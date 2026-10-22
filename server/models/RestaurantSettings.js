const mongoose = require('mongoose');

const restaurantSettingsSchema = new mongoose.Schema(
  {
    restaurantName: {
      type: String,
      default: 'DineSync Demo Restaurant',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Artisan Coffee & Culinary Experience',
    },
    gstin: {
      type: String,
      default: '29ABCDE1234F1Z5',
      trim: true,
    },
    address: {
      type: String,
      default: '100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038',
    },
    phone: {
      type: String,
      default: '+91 98765 43210',
    },
    email: {
      type: String,
      default: 'contact@dinesync.com',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    currencySymbol: {
      type: String,
      default: '₹',
    },
    taxRatePercent: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 100,
    },
    paymentMode: {
      type: String,
      enum: ['test', 'live'],
      default: 'test',
    },
    requirePaymentBeforeKitchen: {
      type: Boolean,
      default: true,
    },
    allowGuestOrdering: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('RestaurantSettings', restaurantSettingsSchema);
