const http = require('http');

const makeRequest = (options, postData) => {
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

async function runTest() {
  console.log('🧪 Starting End-to-End Payment and Billing Lifecycle Test...');

  // 1. Get Tables and Products
  const tablesRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/tables',
    method: 'GET',
  });
  const table = tablesRes.body.all[0];
  console.log(`1. Resolved Table: ${table.tableNumber} (QR Token: ${table.qrToken})`);

  const menuRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/public/menu',
    method: 'GET',
  });
  const product = menuRes.body.products[0];
  console.log(`2. Selected Menu Item: ${product.name} (₹${product.price})`);

  // 2. Submit Public Order (Passwordless)
  const orderRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/public/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      tableToken: table.qrToken,
      numberOfPersons: 2,
      customerName: 'Aarav Sharma',
      customerPhone: '9876543210',
      items: [{ _id: product._id, quantity: 2 }],
    }
  );

  if (orderRes.status !== 201) {
    throw new Error(`Order placement failed: ${JSON.stringify(orderRes.body)}`);
  }
  const order = orderRes.body;
  console.log(`3. Order Created: ${order.orderNumber} (Status: ${order.status}, Payment: ${order.paymentStatus})`);
  console.log(`   Subtotal: ₹${order.subtotal}, Tax: ₹${order.tax}, Total: ₹${order.totalAmount}`);
  console.log(`   Customer Access Token: ${order.publicAccessToken.slice(0, 16)}...`);

  // 3. Initiate Gateway Order
  const payOrderRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/public/orders/${order._id}/payment`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      publicAccessToken: order.publicAccessToken,
      customerName: 'Aarav Sharma',
      customerPhone: '9876543210',
    }
  );

  const gatewayOrder = payOrderRes.body;
  console.log(`4. Gateway Order Initialized: ${gatewayOrder.gatewayOrderId} (${gatewayOrder.amountInPaise} paise)`);

  // 4. Verify Payment Signature
  const verifyRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/public/payments/verify',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      orderId: order._id,
      publicAccessToken: order.publicAccessToken,
      razorpay_order_id: gatewayOrder.gatewayOrderId,
      razorpay_payment_id: `pay_test_${Date.now()}`,
      razorpay_signature: 'test_signature_valid',
    }
  );

  console.log(`5. Payment Verified: Invoice Number Generated -> ${verifyRes.body.invoiceNumber}`);
  console.log(`   Confirmed Kitchen State -> ${verifyRes.body.order.status}`);

  // 5. Download / Retrieve Official Receipt
  const receiptRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/public/orders/${order.publicAccessToken}/receipt`,
    method: 'GET',
  });

  console.log(`6. Official Receipt Retrieved:`);
  console.log(`   Receipt #: ${receiptRes.body.receiptNumber}`);
  console.log(`   Restaurant: ${receiptRes.body.restaurant.name} (GSTIN: ${receiptRes.body.restaurant.gstin})`);
  console.log(`   Payment Method: ${receiptRes.body.paymentMethod}`);
  console.log(`   Total Paid: ₹${receiptRes.body.totalAmount}`);

  console.log('🎉 All End-to-End Tests Succeeded Perfectly!');
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
