const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Please provide a promo code'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountPercent: {
      type: Number,
      required: [true, 'Please provide a discount percentage'],
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiryDate: {
      type: Date,
      required: false,
    },
    usageLimit: {
      type: Number,
      default: null, // null means unlimited
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Method to check if promo code is valid
promoCodeSchema.methods.isValid = function () {
  if (!this.isActive) return false;
  if (this.expiryDate && new Date() > this.expiryDate) return false;
  if (this.usageLimit && this.usageCount >= this.usageLimit) return false;
  return true;
};

module.exports = mongoose.model('PromoCode', promoCodeSchema);
