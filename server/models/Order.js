const mongoose = require('mongoose');
const crypto = require('crypto');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  priceInPaise: {
    type: Number,
    default: function () {
      return Math.round(this.price * 100);
    },
  },
  image: {
    type: String,
  },
  type: {
    type: String,
    enum: ['veg', 'non-veg'],
    default: 'veg',
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },
    publicAccessToken: {
      type: String,
      unique: true,
      index: true,
      default: () => crypto.randomBytes(24).toString('hex'),
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional for guest QR ordering
    },
    customerName: {
      type: String,
      default: 'Guest Customer',
      trim: true,
    },
    customerPhone: {
      type: String,
      default: '',
      trim: true,
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
    },
    tableNumber: {
      type: String,
      required: [true, 'Table number is required'],
      trim: true,
    },
    floor: {
      type: String,
      default: 'Ground Floor',
      trim: true,
    },
    floorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Floor',
    },
    numberOfPersons: {
      type: Number,
      required: [true, 'Number of persons is required'],
      min: 1,
      default: 1,
    },
    specialInstructions: {
      type: String,
      trim: true,
      default: '',
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    subtotalInPaise: {
      type: Number,
      default: 0,
    },
    taxRate: {
      type: Number,
      default: 5.0, // 5% GST
    },
    tax: {
      type: Number,
      required: true,
      default: 0,
    },
    taxInPaise: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalAmountInPaise: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PENDING', 'PAID', 'REFUNDED', 'FAILED'],
      default: 'UNPAID',
      index: true,
    },
    status: {
      type: String,
      enum: [
        'Pending_Payment',
        'Confirmed',
        'Accepted',
        'Preparing',
        'Ready',
        'Served',
        'Completed',
        'Cancelled',
      ],
      default: 'Pending_Payment',
      index: true,
    },
    paymentTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentTransaction',
    },
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    paidAt: {
      type: Date,
    },
    acceptedAt: {
      type: Date,
    },
    preparedAt: {
      type: Date,
    },
    servedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancelReason: {
      type: String,
      default: '',
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to ensure orderNumber and paise calculations are set
orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    this.orderNumber = `DS-${dateStr}-${randomSuffix}`;
  }
  if (!this.subtotalInPaise) {
    this.subtotalInPaise = Math.round(this.subtotal * 100);
  }
  if (!this.taxInPaise) {
    this.taxInPaise = Math.round(this.tax * 100);
  }
  if (!this.totalAmountInPaise) {
    this.totalAmountInPaise = Math.round(this.totalAmount * 100);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
