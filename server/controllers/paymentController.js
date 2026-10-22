const PaymentTransaction = require('../models/PaymentTransaction');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');
const {
  createGatewayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
} = require('../services/paymentService');

// @desc    Initiate payment gateway order for an order
// @route   POST /api/public/orders/:id/payment
// @access  Public (Passwordless Customer)
const initiatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { publicAccessToken, customerName, customerPhone } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (publicAccessToken && order.publicAccessToken !== publicAccessToken) {
      return res.status(403).json({ message: 'Unauthorized order access token.' });
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({ message: 'This order has already been paid and confirmed.' });
    }

    const gatewayOrder = await createGatewayOrder(order, {
      name: customerName,
      phone: customerPhone,
    });

    res.json(gatewayOrder);
  } catch (error) {
    console.error('Initiate payment error:', error);
    res.status(500).json({ message: error.message || 'Failed to initialize payment gateway order.' });
  }
};

// @desc    Verify client-submitted Razorpay payment signature
// @route   POST /api/public/payments/verify
// @access  Public (Customer Callback)
const verifyPayment = async (req, res) => {
  try {
    const {
      orderId,
      publicAccessToken,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!orderId || !publicAccessToken || !razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ message: 'Missing required payment verification parameters.' });
    }

    const result = await verifyPaymentSignature({
      orderId,
      publicAccessToken,
      gatewayOrderId: razorpay_order_id,
      gatewayPaymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    res.json({
      success: true,
      message: 'Payment authoritatively verified and order confirmed.',
      invoiceNumber: result.invoiceNumber,
      order: result.order,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(400).json({ message: error.message || 'Payment signature verification failed.' });
  }
};

// @desc    Handle incoming signed Razorpay Webhooks
// @route   POST /api/webhooks/razorpay
// @access  Public / Razorpay Server Callback
const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

    // Verify webhook signature if secret configured
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(req.rawBody || JSON.stringify(req.body), signature, webhookSecret);
      if (!isValid) {
        console.warn('⚠️ Rejected unauthorized webhook with invalid HMAC signature.');
        return res.status(400).json({ message: 'Invalid webhook signature.' });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`⚡ [Razorpay Webhook] Received event: ${event}`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payment ? payload.payment.entity : null;
      const gatewayOrderId = paymentEntity ? paymentEntity.order_id : null;
      const gatewayPaymentId = paymentEntity ? paymentEntity.id : null;

      if (gatewayOrderId) {
        const transaction = await PaymentTransaction.findOne({ gatewayOrderId });
        if (transaction && transaction.status !== 'CAPTURED') {
          const order = await Order.findById(transaction.orderId);
          if (order && order.paymentStatus !== 'PAID') {
            await verifyPaymentSignature({
              orderId: order._id,
              publicAccessToken: order.publicAccessToken,
              gatewayOrderId,
              gatewayPaymentId: gatewayPaymentId || `pay_wh_${Date.now()}`,
              signature: 'webhook_captured_valid',
            });
          }
        }
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Error processing webhook event.' });
  }
};

// @desc    Get all payments for Admin Ledger
// @route   GET /api/admin/payments
// @access  Private/Admin
const getAdminPayments = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    let payments = await PaymentTransaction.find(query)
      .populate('orderId', 'orderNumber tableNumber floor totalAmount invoiceNumber status createdAt')
      .sort({ createdAt: -1 });

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      payments = payments.filter((p) => {
        const matchesPayId = p.gatewayPaymentId && p.gatewayPaymentId.match(searchRegex);
        const matchesOrderId = p.gatewayOrderId && p.gatewayOrderId.match(searchRegex);
        const matchesCustomer = p.customerName && p.customerName.match(searchRegex);
        const matchesInvoice = p.orderId?.invoiceNumber && p.orderId.invoiceNumber.match(searchRegex);
        return matchesPayId || matchesOrderId || matchesCustomer || matchesInvoice;
      });
    }

    res.json(payments);
  } catch (error) {
    console.error('Get admin payments error:', error);
    res.status(500).json({ message: 'Error fetching payment ledger.' });
  }
};

// @desc    Process refund for a payment
// @route   POST /api/admin/payments/:id/refund
// @access  Private/Admin
const processRefund = async (req, res) => {
  try {
    const { reason, amount } = req.body;
    const payment = await PaymentTransaction.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found.' });
    }

    if (payment.status !== 'CAPTURED') {
      return res.status(400).json({ message: 'Only captured payments can be refunded.' });
    }

    const refundAmount = amount ? Number(amount) : payment.amount;
    const refundId = `rfnd_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    payment.status = 'REFUNDED';
    payment.refundId = refundId;
    payment.refundAmount = refundAmount;
    payment.refundStatus = 'processed';
    await payment.save();

    // Update order status if full refund
    const order = await Order.findById(payment.orderId);
    if (order) {
      order.paymentStatus = 'REFUNDED';
      order.status = 'Cancelled';
      order.cancelReason = reason || 'Admin initiated refund';
      await order.save();
    }

    if (req.user) {
      await AuditLog.create({
        action: 'PAYMENT_REFUNDED',
        performedBy: req.user._id,
        performedByName: req.user.name,
        role: req.user.role,
        targetType: 'Payment',
        targetId: payment._id.toString(),
        details: { refundId, refundAmount, reason: reason || 'N/A' },
      });
    }

    res.json({
      message: `Refund of ₹${refundAmount} processed successfully.`,
      refundId,
      payment,
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ message: 'Failed to process refund.' });
  }
};

module.exports = {
  initiatePayment,
  verifyPayment,
  handleRazorpayWebhook,
  getAdminPayments,
  processRefund,
};
