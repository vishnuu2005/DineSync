const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    publicAccessToken: {
      type: String,
      required: true,
      index: true,
    },
    gateway: {
      type: String,
      default: 'razorpay',
    },
    gatewayOrderId: {
      type: String,
      index: true,
      trim: true,
    },
    gatewayPaymentId: {
      type: String,
      index: true,
      trim: true,
    },
    amountInPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['CREATED', 'PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED'],
      default: 'CREATED',
      index: true,
    },
    method: {
      type: String,
      default: 'online',
    },
    signature: {
      type: String,
      trim: true,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    errorMessage: {
      type: String,
      default: '',
    },
    refundId: {
      type: String,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundStatus: {
      type: String,
    },
    customerName: {
      type: String,
      default: 'Guest Customer',
    },
    customerPhone: {
      type: String,
      default: '',
    },
    rawDetails: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
