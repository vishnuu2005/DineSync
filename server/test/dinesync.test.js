require('dotenv').config();
const test = require('node:test');
const assert = require('node:assert');
const http = require('http');

const makeReq = (options, postData) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

const waitForHealthyServer = async (timeoutMs = 30000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await makeReq({
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/health',
        method: 'GET',
      });
      if (res && res.status === 200) {
        return true;
      }
    } catch (_) {
      // not yet ready
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  throw new Error('Server did not become healthy within timeout');
};

test('DineSync Comprehensive Platform Automated Test Suite', async (t) => {
  let sampleTable;
  let sampleProduct;
  let createdOrder;
  let gatewayOrder;
  let staffToken;
  let localServer = null;

  t.before(async () => {
    try {
      await waitForHealthyServer(1500);
      console.log('Using already running DineSync server on port 5000.');
    } catch (_) {
      console.log('Booting DineSync server for test suite...');
      const serverModule = require('../server');
      localServer = serverModule.server;
      await waitForHealthyServer(30000);
      console.log('DineSync server booted successfully.');
    }
  });

  t.after(async () => {
    if (localServer) {
      console.log('Closing local test server...');
      await new Promise((resolve) => localServer.close(resolve));
      try {
        const mongoose = require('mongoose');
        await mongoose.disconnect();
      } catch (_) {}
      setTimeout(() => process.exit(0), 100);
    }
  });

  await t.test('1. Health check endpoint responds OK', async () => {
    const res = await makeReq({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/health',
      method: 'GET',
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'healthy');
  });

  await t.test('2. Public table QR resolution by token', async () => {
    const tablesRes = await makeReq({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/tables',
      method: 'GET',
    });
    assert.strictEqual(tablesRes.status, 200);
    assert.ok(tablesRes.body.all.length > 0);
    sampleTable = tablesRes.body.all[0];
    assert.ok(sampleTable.qrToken, 'Table must have a secure qrToken');

    const tokenRes = await makeReq({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/public/tables/${sampleTable.qrToken}`,
      method: 'GET',
    });
    assert.strictEqual(tokenRes.status, 200);
    assert.strictEqual(tokenRes.body.table.tableNumber, sampleTable.tableNumber);
    assert.ok(tokenRes.body.restaurant.name);
  });

  await t.test('3. Public menu returns active products and categories', async () => {
    const menuRes = await makeReq({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/public/menu',
      method: 'GET',
    });
    assert.strictEqual(menuRes.status, 200);
    assert.ok(menuRes.body.products.length > 0);
    assert.ok(menuRes.body.categories.length > 0);
    sampleProduct = menuRes.body.products[0];
    assert.ok(sampleProduct.price > 0);
  });

  await t.test('4. Passwordless customer order creation with server price calculation', async () => {
    const orderRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/public/orders',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        tableToken: sampleTable.qrToken,
        numberOfPersons: 2,
        customerName: 'Test Suite Guest',
        customerPhone: '9876543210',
        items: [{ _id: sampleProduct._id, quantity: 2 }],
      }
    );

    assert.strictEqual(orderRes.status, 201);
    createdOrder = orderRes.body;
    assert.ok(createdOrder._id);
    assert.ok(createdOrder.publicAccessToken);
    assert.strictEqual(createdOrder.paymentStatus, 'UNPAID');
    assert.strictEqual(createdOrder.status, 'Pending_Payment');

    const expectedSubtotal = sampleProduct.price * 2;
    const expectedTax = Math.round(expectedSubtotal * 0.05 * 100) / 100;
    const expectedTotal = Math.round((expectedSubtotal + expectedTax) * 100) / 100;

    assert.strictEqual(createdOrder.subtotal, expectedSubtotal);
    assert.strictEqual(createdOrder.tax, expectedTax);
    assert.strictEqual(createdOrder.totalAmount, expectedTotal);
  });

  await t.test('5. Rejection of order exceeding table capacity', async () => {
    const overCapacityRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/public/orders',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        tableToken: sampleTable.qrToken,
        numberOfPersons: sampleTable.capacity + 10,
        items: [{ _id: sampleProduct._id, quantity: 1 }],
      }
    );
    assert.strictEqual(overCapacityRes.status, 400);
    assert.match(overCapacityRes.body.message, /capacity limit/i);
  });

  await t.test('6. Order tracking by unguessable public access token', async () => {
    const trackRes = await makeReq({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/public/orders/${createdOrder.publicAccessToken}`,
      method: 'GET',
    });
    assert.strictEqual(trackRes.status, 200);
    assert.strictEqual(trackRes.body.orderNumber, createdOrder.orderNumber);
  });

  await t.test('7. Payment gateway order creation in paise', async () => {
    const payRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/public/orders/${createdOrder._id}/payment`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        publicAccessToken: createdOrder.publicAccessToken,
        customerName: 'Test Suite Guest',
      }
    );
    assert.strictEqual(payRes.status, 200);
    gatewayOrder = payRes.body;
    assert.ok(gatewayOrder.gatewayOrderId);
    assert.strictEqual(gatewayOrder.currency, 'INR');
    assert.strictEqual(gatewayOrder.amountInPaise, Math.round(createdOrder.totalAmount * 100));
  });

  await t.test('8. Authoritative payment verification, invoice generation, and kitchen confirmation', async () => {
    const testPaymentId = `pay_autotest_${Date.now()}`;
    const verifyRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/public/payments/verify',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        orderId: createdOrder._id,
        publicAccessToken: createdOrder.publicAccessToken,
        razorpay_order_id: gatewayOrder.gatewayOrderId,
        razorpay_payment_id: testPaymentId,
        razorpay_signature: 'test_signature_valid',
      }
    );

    assert.strictEqual(verifyRes.status, 200);
    assert.ok(verifyRes.body.invoiceNumber);
    assert.match(verifyRes.body.invoiceNumber, /^INV-/);
    assert.strictEqual(verifyRes.body.order.paymentStatus, 'PAID');
    assert.strictEqual(verifyRes.body.order.status, 'Confirmed');
  });

  await t.test('9. Paid tax invoice / receipt retrieval', async () => {
    const receiptRes = await makeReq({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/public/orders/${createdOrder.publicAccessToken}/receipt`,
      method: 'GET',
    });
    assert.strictEqual(receiptRes.status, 200);
    assert.strictEqual(receiptRes.body.status, 'PAID');
    assert.ok(receiptRes.body.restaurant.gstin);
    assert.strictEqual(receiptRes.body.totalAmount, createdOrder.totalAmount);
  });

  await t.test('10. Staff authentication & authorized kitchen state transitions', async () => {
    // 1. Staff login
    const loginRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@cafe.com', password: 'admin123' }
    );
    assert.strictEqual(loginRes.status, 200);
    staffToken = loginRes.body.token;
    assert.ok(staffToken);

    // 2. Accepted
    const acceptRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/orders/${createdOrder._id}/status`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`,
        },
      },
      { status: 'Accepted' }
    );
    assert.strictEqual(acceptRes.status, 200);
    assert.strictEqual(acceptRes.body.status, 'Accepted');

    // 3. Preparing
    const prepRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/orders/${createdOrder._id}/status`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`,
        },
      },
      { status: 'Preparing' }
    );
    assert.strictEqual(prepRes.status, 200);
    assert.strictEqual(prepRes.body.status, 'Preparing');

    // 4. Ready
    const readyRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/orders/${createdOrder._id}/status`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`,
        },
      },
      { status: 'Ready' }
    );
    assert.strictEqual(readyRes.status, 200);
    assert.strictEqual(readyRes.body.status, 'Ready');

    // 5. Served
    const servedRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/orders/${createdOrder._id}/status`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`,
        },
      },
      { status: 'Served' }
    );
    assert.strictEqual(servedRes.status, 200);
    assert.strictEqual(servedRes.body.status, 'Served');

    // 6. Completed
    const completeRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/orders/${createdOrder._id}/status`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`,
        },
      },
      { status: 'Completed' }
    );
    assert.strictEqual(completeRes.status, 200);
    assert.strictEqual(completeRes.body.status, 'Completed');
  });

  await t.test('11. QR token revocation and regeneration', async () => {
    const oldQrToken = sampleTable.qrToken;
    const regenRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/tables/${sampleTable._id}/qr/regenerate`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`,
        },
      },
      {}
    );
    assert.strictEqual(regenRes.status, 200);
    assert.notStrictEqual(regenRes.body.newToken, oldQrToken);
    sampleTable.qrToken = regenRes.body.newToken;

    // Old token must now be revoked
    const revokedRes = await makeReq({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/public/tables/${oldQrToken}`,
      method: 'GET',
    });
    assert.strictEqual(revokedRes.status, 404);
  });

  await t.test('12. Rejection of advancing kitchen status on unpaid order', async () => {
    // Create an unpaid order
    const unpaidOrderRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/public/orders',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        tableToken: sampleTable.qrToken,
        numberOfPersons: 2,
        customerName: 'Unpaid Order Guest',
        items: [{ _id: sampleProduct._id, quantity: 1 }],
      }
    );
    assert.strictEqual(unpaidOrderRes.status, 201);
    const unpaidOrder = unpaidOrderRes.body;
    assert.strictEqual(unpaidOrder.paymentStatus, 'UNPAID');

    // Attempting to move unpaid order to Preparing must be rejected with 400
    const advanceRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/orders/${unpaidOrder._id}/status`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`,
        },
      },
      { status: 'Preparing' }
    );
    assert.strictEqual(advanceRes.status, 400);
    assert.match(advanceRes.body.message, /unpaid order/i);
  });

  await t.test('13. Protection against modifying completed terminal orders', async () => {
    const modCompletedRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/orders/${createdOrder._id}/status`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`,
        },
      },
      { status: 'Preparing' }
    );
    assert.strictEqual(modCompletedRes.status, 400);
    assert.match(modCompletedRes.body.message, /already Completed/i);
  });

  await t.test('14. Webhook security: rejection of invalid HMAC signatures', async () => {
    const fakePayload = JSON.stringify({ event: 'payment.captured', payload: {} });
    const invalidWhRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/webhooks/razorpay',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': 'definitely_invalid_signature_hex_12345',
        },
      },
      fakePayload
    );
    assert.strictEqual(invalidWhRes.status, 400);
    assert.match(invalidWhRes.body.message, /invalid webhook signature/i);
  });

  await t.test('15. Webhook security: authoritative signature validation & idempotent processing', async () => {
    const crypto = require('crypto');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_test_placeholder_webhook_secret';
    const payloadObj = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_wh_${Date.now()}`,
            order_id: gatewayOrder.gatewayOrderId,
            amount: gatewayOrder.amountInPaise,
            currency: 'INR',
            status: 'captured',
          },
        },
      },
    };
    const rawPayload = JSON.stringify(payloadObj);
    const validSignature = crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');

    // First delivery
    const whRes1 = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/webhooks/razorpay',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': validSignature,
        },
      },
      rawPayload
    );
    assert.strictEqual(whRes1.status, 200);

    // Repeated / duplicate delivery (idempotency check)
    const whRes2 = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/webhooks/razorpay',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': validSignature,
        },
      },
      rawPayload
    );
    assert.strictEqual(whRes2.status, 200);
  });

  await t.test('16. Waiter dashboard: reset table occupancy when customer completed their dine', async () => {
    // 1. Waiter login
    const waiterLoginRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'waiter@cafe.com', password: 'waiter123' }
    );
    assert.strictEqual(waiterLoginRes.status, 200);
    const waiterToken = waiterLoginRes.body.token;
    assert.ok(waiterToken);
    assert.strictEqual(waiterLoginRes.body.role, 'waiter');

    // 2. Mark table Occupied
    const occupyRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/tables/${sampleTable._id}/status`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${waiterToken}`,
        },
      },
      { status: 'Occupied' }
    );
    assert.strictEqual(occupyRes.status, 200);
    assert.strictEqual(occupyRes.body.status, 'Occupied');

    // 3. Create a served dining order on this table
    const diningOrderRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/public/orders',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        tableToken: sampleTable.qrToken,
        numberOfPersons: 2,
        customerName: 'Dining Guest',
        items: [{ _id: sampleProduct._id, quantity: 1 }],
      }
    );
    assert.strictEqual(diningOrderRes.status, 201);
    const diningOrderId = diningOrderRes.body._id;

    // Simulate payment and move to Served
    const payRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/public/orders/${diningOrderId}/payment`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { publicAccessToken: diningOrderRes.body.publicAccessToken }
    );
    assert.strictEqual(payRes.status, 200);

    const payVerifyRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/public/payments/verify',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        orderId: diningOrderId,
        publicAccessToken: diningOrderRes.body.publicAccessToken,
        razorpay_order_id: payRes.body.gatewayOrderId,
        razorpay_payment_id: `pay_test_${Date.now()}`,
        razorpay_signature: 'test_signature_valid',
      }
    );
    assert.strictEqual(payVerifyRes.status, 200);

    // Waiter marks served
    await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/orders/${diningOrderId}/status`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${waiterToken}`,
        },
      },
      { status: 'Served' }
    );

    // 4. Customer completed their dine -> Waiter resets table occupancy
    const resetRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/tables/${sampleTable._id}/reset-occupancy`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${waiterToken}`,
        },
      }
    );
    assert.strictEqual(resetRes.status, 200);
    assert.strictEqual(resetRes.body.success, true);
    assert.strictEqual(resetRes.body.table.status, 'Available');
    assert.ok(resetRes.body.message.includes('Available'));

    // 5. Verify the dining order was automatically transitioned to Completed
    const checkOrderRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/public/orders/${diningOrderRes.body.publicAccessToken}`,
        method: 'GET',
      }
    );
    assert.strictEqual(checkOrderRes.status, 200);
    assert.strictEqual(checkOrderRes.body.status, 'Completed');
    assert.ok(checkOrderRes.body.completedAt);
  });

  await t.test('17. Resilient table resolution: handles tableNumber, prefixes ("Table 1", "T-1"), and stale token fallback', async () => {
    // 1. Order with prefixed tableNumber "Table 1" and invalid stale token
    const prefixOrderRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/public/orders',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        tableNumber: `Table ${sampleTable.tableNumber}`,
        tableToken: 'invalid_stale_token_from_localstorage',
        numberOfPersons: 1,
        customerName: 'Prefix Test Guest',
        items: [{ _id: sampleProduct._id, quantity: 1 }],
      }
    );
    assert.strictEqual(prefixOrderRes.status, 201);
    assert.strictEqual(prefixOrderRes.body.tableNumber, sampleTable.tableNumber);

    // 2. Order with "T-1" prefix format
    const tPrefixOrderRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/public/orders',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        tableNumber: `T-${sampleTable.tableNumber}`,
        numberOfPersons: 1,
        customerName: 'T-Prefix Test Guest',
        items: [{ _id: sampleProduct._id, quantity: 1 }],
      }
    );
    assert.strictEqual(tPrefixOrderRes.status, 201);
    assert.strictEqual(tPrefixOrderRes.body.tableNumber, sampleTable.tableNumber);

    // 3. Order with tableId
    const idOrderRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/public/orders',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        tableId: sampleTable._id,
        tableNumber: sampleTable.tableNumber,
        numberOfPersons: 1,
        customerName: 'ID Test Guest',
        items: [{ _id: sampleProduct._id, quantity: 1 }],
      }
    );
    assert.strictEqual(idOrderRes.status, 201);
    assert.strictEqual(idOrderRes.body.tableNumber, sampleTable.tableNumber);
  });

  await t.test('18. QR Code Scanning & Isolation: Scanning Table 1 correctly resolves Table 1 and prevents cross-table hijack', async () => {
    // 1. Resolve table by table number via public table endpoint (e.g. /menu/t/1 or scanned QR with number)
    const scanTable1Res = await makeReq({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/public/tables/1',
      method: 'GET',
    });
    assert.strictEqual(scanTable1Res.status, 200);
    assert.strictEqual(scanTable1Res.body.table.tableNumber, '1');
    assert.ok(scanTable1Res.body.table.qrToken);

    // 2. Resolve table by actual qrToken
    const scanTokenRes = await makeReq({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/public/tables/${scanTable1Res.body.table.qrToken}`,
      method: 'GET',
    });
    assert.strictEqual(scanTokenRes.status, 200);
    assert.strictEqual(scanTokenRes.body.table.tableNumber, '1');

    // 3. Simulate customer who scanned Table 1, but has a stale token from Table 2 in localStorage
    // Find Table 2
    const table2Res = await makeReq({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/tables/number/2',
      method: 'GET',
    });
    assert.strictEqual(table2Res.status, 200);
    const staleTable2Token = table2Res.body.qrToken;
    assert.ok(staleTable2Token);

    // Place order for Table 1 while staleTable2Token is in the payload
    const orderRes = await makeReq(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/public/orders',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        tableNumber: '1',
        tableToken: staleTable2Token, // Stale token from earlier session on Table 2!
        numberOfPersons: 1,
        customerName: 'Table 1 Customer',
        items: [{ _id: sampleProduct._id, quantity: 1 }],
      }
    );
    assert.strictEqual(orderRes.status, 201);
    // Must be assigned to Table 1, NEVER to Table 2!
    assert.strictEqual(orderRes.body.tableNumber, '1');

    // 4. Verify natural ordering of tables in /api/tables (Table 1, 2, ... not 1, 10, 11...)
    const tablesListRes = await makeReq({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/tables',
      method: 'GET',
    });
    assert.strictEqual(tablesListRes.status, 200);
    const tableNumbers = tablesListRes.body.all.map((t) => t.tableNumber);
    // Table 1 must come before Table 2, and Table 2 must come before Table 10
    const idx1 = tableNumbers.indexOf('1');
    const idx2 = tableNumbers.indexOf('2');
    const idx10 = tableNumbers.indexOf('10');
    assert.ok(idx1 < idx2, 'Table 1 must appear before Table 2');
    if (idx10 !== -1) {
      assert.ok(idx2 < idx10, 'Table 2 must appear before Table 10');
    }
  });
});



