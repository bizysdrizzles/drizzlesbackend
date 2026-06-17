const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional for guest carts
    },
    sessionId: {
      type: String,
      required: function () {
        return !this.user;
      },
      index: true,
    },
    items: [cartItemSchema],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
cartSchema.index({ user: 1 });
cartSchema.index({ sessionId: 1 });

module.exports = mongoose.model('Cart', cartSchema);
