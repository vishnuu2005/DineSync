const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    priceInPaise: {
      type: Number,
      default: function () {
        return Math.round((this.price || 0) * 100);
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: 'Coffee',
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
    },
    available: {
      type: Boolean,
      default: true,
    },
    type: {
      type: String,
      enum: ['veg', 'non-veg'],
      default: 'veg',
    },
    preparationTimeMinutes: {
      type: Number,
      default: 12,
      min: 1,
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

productSchema.pre('save', function (next) {
  if (this.price !== undefined) {
    this.priceInPaise = Math.round(this.price * 100);
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
