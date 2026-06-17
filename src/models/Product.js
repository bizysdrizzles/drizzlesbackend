const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a product description'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a product price'],
      min: 0,
    },
    stock: {
      type: Number,
      required: [true, 'Please provide stock quantity'],
      min: 0,
      default: 0,
    },
    imageUrl: {
      type: String,
      required: [true, 'Please provide an image URL'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    type: {
      type: String,
      enum: ['sauce', 'bundle'],
      required: true,
      default: 'sauce'
    },
  },
  {
    timestamps: true,
  }
);

// Virtual property to check if product is in stock
productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

// Ensure virtuals are included when converting to JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Prevent negative stock
productSchema.pre('save', function (next) {
  if (this.stock < 0) {
    this.stock = 0;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
