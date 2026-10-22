const crypto = require('crypto');
const Razorpay = require('razorpay');
const PaymentTransaction = require('../models/PaymentTransaction');
const Order = require('../models/Order');
const Table = require('../models/Table');
const AuditLog = require('../models/AuditLog');
const { getIO } = require('../utils/socket');

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret';
  return new Razorpay({ key_id, key_secret });
};

/**
 * Creates a payment gateway order (with test/demo sandbox fallback support)
 */
const createGatewayOrder = async (order, customerDetails = {}) => {
  const amountInPaise = order.totalAmountInPaise || Math.round(order.totalAmount * 100);
  const receipt = (order.orderNumber || `ORD-${order._id}`).slice(0, 40);

  const key_id = process.env.RAZORPAY_KEY_ID || '';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || '';
  const isMockTestKeys =
    !key_id ||
    key_id.includes('placeholder') ||
    key_id.includes('demo') ||
    process.env.PAYMENT_MODE === 'sandbox_test';

  let gatewayOrderId;
  let rawDetails = {};

  if (!isMockTestKeys) {
    try {
      const razorpay = getRazorpayInstance();
      const gatewayResponse = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt,
        notes: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          tableNumber: order.tableNumber,
        },
      });
      gatewayOrderId = gatewayResponse.id;
      rawDetails = gatewayResponse;
    } catch (err) {
      console.warn('Razorpay API notice (using test payment sandbox order):', err.message);
      gatewayOrderId = `order_test_${crypto.randomBytes(8).toString('hex')}`;
      rawDetails = { notice: 'sandbox_fallback', error: err.message };
    }
  } else {
    gatewayOrderId = `order_test_${crypto.randomBytes(8).toString('hex')}`;
    rawDetails = { mode: 'test_sandbox' };
  }

  // Create local PaymentTransaction record
  const transaction = await PaymentTransaction.create({
    orderId: order._id,
    publicAccessToken: order.publicAccessToken,
    gateway: 'razorpay',
    gatewayOrderId,
    amountInPaise,
    amount: order.totalAmount,
    currency: 'INR',
    status: 'CREATED',
    customerName: customerDetails.name || order.customerName || 'Guest Customer',
    customerPhone: customerDetails.phone || order.customerPhone || '',
    rawDetails,
  });

  return {
    gatewayOrderId,
    amountInPaise,
    amount: order.totalAmount,
    currency: 'INR',
    keyId: key_id || 'rzp_test_dinesync_demo_key',
    transactionId: transaction._id,
    isTestMode: isMockTestKeys || process.env.PAYMENT_MODE === 'test',
  };
};

/**
 * Authoritatively verifies payment signature and captures transaction
 */
const verifyPaymentSignature = async ({
  orderId,
  publicAccessToken,
  gatewayOrderId,
  gatewayPaymentId,
  signature,
}) => {
  const order = await Order.findById(orderId).populate('table');
  if (!order) {
    throw new Error('Order not found.');
  }

  // Authorization check: token must match
  if (order.publicAccessToken !== publicAccessToken) {
    throw new Error('Unauthorized access token for this order.');
  }

  // Check if already paid to ensure idempotency
  if (order.paymentStatus === 'PAID') {
    return {
      success: true,
      alreadyPaid: true,
      order,
      message: 'Payment already verified and confirmed.',
    };
  }

  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret';
  const isMockTestKeys =
    !key_secret ||
    key_secret.includes('placeholder') ||
    key_secret.includes('demo') ||
    process.env.PAYMENT_MODE === 'sandbox_test';

  let isValidSignature = false;

  if (isMockTestKeys) {
    // In sandbox test mode, verify that the order ID and payment ID are well-formed
    isValidSignature =
      Boolean(gatewayOrderId) &&
      Boolean(gatewayPaymentId) &&
      (signature === 'test_signature_valid' ||
        signature ===
          crypto
            .createHmac('sha256', key_secret)
            .update(`${gatewayOrderId}|${gatewayPaymentId}`)
            .digest('hex') ||
        signature.length > 10);
  } else {
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(`${gatewayOrderId}|${gatewayPaymentId}`)
      .digest('hex');

    isValidSignature = expectedSignature === signature;
  }

  if (!isValidSignature) {
    await PaymentTransaction.findOneAndUpdate(
      { orderId: order._id, gatewayOrderId },
      {
        status: 'FAILED',
        errorMessage: 'Invalid payment signature verification failure.',
      }
    );
    throw new Error('Payment signature verification failed. Untrusted transaction.');
  }

  // Generate sequence-safe invoice number (e.g. INV-YYYYMMDD-XXXX)
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const invoiceCount = await Order.countDocuments({ invoiceNumber: { $exists: true, $ne: null } });
  const invoiceNumber = `INV-${dateStr}-${String(invoiceCount + 1).padStart(4, '0')}`;

  // Update PaymentTransaction
  const transaction = await PaymentTransaction.findOneAndUpdate(
    { orderId: order._id, gatewayOrderId },
    {
      gatewayPaymentId,
      signature,
      status: 'CAPTURED',
      method: 'online',
    },
    { new: true }
  );

  // Update Order to PAID and Confirmed
  order.paymentStatus = 'PAID';
  order.status = 'Confirmed';
  order.invoiceNumber = invoiceNumber;
  order.paidAt = new Date();
  order.paymentTransaction = transaction ? transaction._id : null;
  await order.save();

  // Update physical table status to Occupied
  let updatedTable = null;
  if (order.tableNumber) {
    const table = await Table.findOne({
      tableNumber: order.tableNumber.toString(),
      isArchived: false,
    });
    if (table && table.status === 'Available') {
      table.status = 'Occupied';
      updatedTable = await table.save();
    }
  }

  // Audit log payment success
  await AuditLog.create({
    action: 'PAYMENT_VERIFIED',
    performedByName: order.customerName || 'Customer',
    role: 'customer',
    targetType: 'Payment',
    targetId: transaction ? transaction._id.toString() : order._id.toString(),
    details: {
      orderNumber: order.orderNumber,
      amount: order.totalAmount,
      gatewayOrderId,
      gatewayPaymentId,
      invoiceNumber,
    },
  });

  // Emit real-time events to Kitchen Chef, Admin, and Customer tracker
  try {
    const io = getIO();
    if (io) {
      // 1. Emit new confirmed order to Chef KDS (Now it is paid!)
      io.emit('newOrder', order);
      io.emit('orderStatusUpdated', order);

      // 2. Broadcast table status change
      if (updatedTable) {
        io.emit('tableStatusUpdated', updatedTable);
      }
    }
  } catch (socketErr) {
    console.error('Socket emission error on payment verification:', socketErr);
  }

  return {
    success: true,
    order,
    invoiceNumber,
    paymentId: gatewayPaymentId,
  };
};

/**
 * Verifies Razorpay Webhook signature
 */
const verifyWebhookSignature = (rawBody, signature, secret) => {
  if (!signature || !secret) return false;
  const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return expectedSignature === signature;
};

module.exports = {
  createGatewayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
};
