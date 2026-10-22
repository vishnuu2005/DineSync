const mongoose = require('mongoose');
const crypto = require('crypto');

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: String,
      required: [true, 'Table identifier is required'],
      unique: true,
      trim: true,
    },
    floor: {
      type: String,
      required: [true, 'Floor description is required'],
      default: 'Ground Floor',
      trim: true,
    },
    floorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Floor',
    },
    capacity: {
      type: Number,
      required: [true, 'Seating capacity is required'],
      min: [1, 'Capacity must be at least 1 person'],
      max: [50, 'Capacity cannot exceed 50 persons'],
      default: 4,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Available', 'Occupied', 'Reserved', 'Maintenance'],
      default: 'Available',
    },
    qrToken: {
      type: String,
      unique: true,
      index: true,
      default: () => crypto.randomBytes(16).toString('hex'),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Method to regenerate a fresh QR token
tableSchema.methods.regenerateQRToken = function () {
  this.qrToken = crypto.randomBytes(16).toString('hex');
  return this.qrToken;
};

module.exports = mongoose.model('Table', tableSchema);
