const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get cart
// @route   GET /api/cart
// @access  Private/Public (with session)
exports.getCart = asyncHandler(async (req, res, next) => {
  let cart;

  if (req.user) {
    cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
  } else {
    const sessionId = req.headers['x-session-id'];
    if (!sessionId) {
      return res.status(200).json({
        success: true,
        data: { items: [] },
      });
    }
    cart = await Cart.findOne({ sessionId }).populate('items.product');
  }

  if (!cart) {
    return res.status(200).json({
      success: true,
      data: { items: [] },
    });
  }

  res.status(200).json({
    success: true,
    data: cart,
  });
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private/Public (with session)
exports.addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity } = req.body;

  if (!productId || !quantity) {
    return next(new ErrorResponse('Product ID and quantity are required', 400));
  }

  const product = await Product.findById(productId);

  if (!product || !product.isActive) {
    return next(new ErrorResponse('Product not available', 404));
  }

  if (product.stock < quantity) {
    return next(
      new ErrorResponse(`Insufficient stock. Available: ${product.stock}`, 400)
    );
  }

  let cart;

  if (req.user) {
    cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }
  } else {
    const sessionId = req.headers['x-session-id'];
    if (!sessionId) {
      return next(new ErrorResponse('Session ID required for guest cart', 400));
    }

    cart = await Cart.findOne({ sessionId });
    if (!cart) {
      cart = new Cart({ sessionId, items: [] });
    }
  }

  // Check if product already in cart
  const existingItemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (existingItemIndex > -1) {
    // Update quantity
    cart.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    cart.items.push({ product: productId, quantity });
  }

  await cart.save();
  await cart.populate('items.product');

  res.status(200).json({
    success: true,
    data: cart,
  });
});

// @desc    Update cart item
// @route   PUT /api/cart/:productId
// @access  Private/Public (with session)
exports.updateCartItem = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;
  const { productId } = req.params;

  if (!quantity || quantity < 0) {
    return next(new ErrorResponse('Valid quantity is required', 400));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  if (product.stock < quantity) {
    return next(
      new ErrorResponse(`Insufficient stock. Available: ${product.stock}`, 400)
    );
  }

  let cart;

  if (req.user) {
    cart = await Cart.findOne({ user: req.user.id });
  } else {
    const sessionId = req.headers['x-session-id'];
    cart = await Cart.findOne({ sessionId });
  }

  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex === -1) {
    return next(new ErrorResponse('Product not in cart', 404));
  }

  if (quantity === 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = quantity;
  }

  await cart.save();
  await cart.populate('items.product');

  res.status(200).json({
    success: true,
    data: cart,
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private/Public (with session)
exports.removeFromCart = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;

  let cart;

  if (req.user) {
    cart = await Cart.findOne({ user: req.user.id });
  } else {
    const sessionId = req.headers['x-session-id'];
    cart = await Cart.findOne({ sessionId });
  }

  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }

  cart.items = cart.items.filter((item) => item.product.toString() !== productId);

  await cart.save();
  await cart.populate('items.product');

  res.status(200).json({
    success: true,
    data: cart,
  });
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private/Public (with session)
exports.clearCart = asyncHandler(async (req, res, next) => {
  let cart;

  if (req.user) {
    cart = await Cart.findOneAndDelete({ user: req.user.id });
  } else {
    const sessionId = req.headers['x-session-id'];
    cart = await Cart.findOneAndDelete({ sessionId });
  }

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Merge guest cart with user cart after login
// @route   POST /api/cart/merge
// @access  Private
exports.mergeCart = asyncHandler(async (req, res, next) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return next(new ErrorResponse('Session ID required', 400));
  }

  const guestCart = await Cart.findOne({ sessionId });
  if (!guestCart || guestCart.items.length === 0) {
    const userCart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    return res.status(200).json({
      success: true,
      data: userCart || { items: [] },
    });
  }

  let userCart = await Cart.findOne({ user: req.user.id });
  if (!userCart) {
    // Transfer guest cart to user
    guestCart.user = req.user.id;
    guestCart.sessionId = undefined;
    await guestCart.save();
    await guestCart.populate('items.product');
    return res.status(200).json({
      success: true,
      data: guestCart,
    });
  }

  // Merge carts
  for (const guestItem of guestCart.items) {
    const existingItemIndex = userCart.items.findIndex(
      (item) => item.product.toString() === guestItem.product.toString()
    );

    if (existingItemIndex > -1) {
      userCart.items[existingItemIndex].quantity += guestItem.quantity;
    } else {
      userCart.items.push(guestItem);
    }
  }

  await userCart.save();
  await guestCart.deleteOne();
  await userCart.populate('items.product');

  res.status(200).json({
    success: true,
    data: userCart,
  });
});
