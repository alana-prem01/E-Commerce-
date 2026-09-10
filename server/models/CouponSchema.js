const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percent', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    validate: {
      validator: function(val) {
        if (this.discountType === 'percent') {
          return val >= 1 && val <= 70;
        }
        return val > 0;
      },
      message: 'Percentage discount must be between 1% and 70%.'
    }
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  maxDiscount: {
    type: Number, // Max discount cap for percent coupons
    default: null
  },
  expiresAt: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: null, // null = unlimited
    validate: {
      validator: function(val) {
        if (val !== null && val !== undefined) {
          return val > 0;
        }
        return true;
      },
      message: 'Usage limit must be greater than 0.'
    }
  },
  usedCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
