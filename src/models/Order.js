const mongoose = require('mongoose');

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
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  imageUrl: String,
  productType: {
    type: String,
    enum: ['sauce', 'bundle'],
    required: true
  },
  discountApplied: {
    type: Number,
    default: 0,
    comment: '10% discount if this is the 8th sauce'
  },
  finalPrice: {
    type: Number,
    required: true,
    comment: 'Price after discount (if any)'
  }
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional for guest orders
    },
    guestEmail: {
      type: String,
      required: function () {
        return !this.user;
      },
    },
    guestPhone: {
      type: String,
      required: function () {
        return !this.user;
      },
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String },
      country: { type: String, required: true, default: 'Egypt' },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingFee: { type: Number, default: 100 },
    promoCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PromoCode',
    },
    promoCodeUsed: {
      code: String,
      discountPercent: Number,
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Out for Delivery', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    isEditable: {
      type: Boolean,
      default: true,
    },
    editableUntil: {
      type: Date,
      required: false,
    },
    saucesInOrder: {
      type: Number,
      default: 0,
      comment: 'Count of individual sauces in this order (excludes bundles)'
    }
  },
  {
    timestamps: true,
  }
);

// Set editable until time on creation
orderSchema.pre('save', function (next) {
  if (this.isNew) {
    const editWindow = parseInt(process.env.ORDER_EDIT_WINDOW) || 15;
    this.editableUntil = new Date(Date.now() + editWindow * 60 * 1000);
  }
  next();
});

// Method to check if order can be edited
orderSchema.methods.canBeEdited = function () {
  return this.isEditable && new Date() < this.editableUntil && this.status === 'Pending';
};

// Update isEditable based on time
orderSchema.pre('save', function (next) {
  if (new Date() >= this.editableUntil) {
    this.isEditable = false;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
