const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const PromoCode = require('../models/PromoCode');
const Cart = require('../models/Cart');
const { asyncHandler } = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const mongoose = require('mongoose');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private/Public (guest)
exports.createOrder = asyncHandler(async (req, res, next) => {
  const { orderItems, shippingAddress, promoCode, isGuest, guestEmail, guestPhone } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let subtotal = 0;
    const processedItems = [];
    let totalSaucesInOrder = 0;
    let totalDiscount = 0;

    // Get user's current sauce count (for authenticated users only)
    let userSauceCount = 0;
    if (!isGuest && req.user) {
      const user = await User.findById(req.user.id).session(session);
      userSauceCount = user.saucesOrderedCount || 0;
    }

    // Process each item
    for (const item of orderItems) {
      const product = await Product.findById(item.product).session(session);

      if (!product || !product.isActive) {
        throw new ErrorResponse(`Product not available`, 400);
      }

      if (product.stock < item.quantity) {
        throw new ErrorResponse(
          `Insufficient stock for ${product.name}. Available: ${product.stock}`,
          400
        );
      }

      // Decrease stock
      product.stock -= item.quantity;
      await product.save({ session });

      // Calculate discount for each individual item
      for (let i = 0; i < item.quantity; i++) {
        let itemDiscount = 0;
        let finalPrice = product.price;

        // Only apply loyalty discount to sauces, not bundles
        if (product.type === 'sauce' && !isGuest) {
          userSauceCount++; // Increment for this sauce
          totalSaucesInOrder++; // Track sauces in this order

          // Check if this is the 8th sauce (or 16th, 24th, etc.)
          if (userSauceCount % 8 === 0) {
            itemDiscount = product.price * 0.10; // 10% discount
            finalPrice = product.price - itemDiscount;
            totalDiscount += itemDiscount;
          }
        }

        subtotal += finalPrice;

        // Add to processed items (combining quantities with same discount)
        const existingItem = processedItems.find(
          pi => pi.product.toString() === product._id.toString() && pi.discountApplied === itemDiscount
        );

        if (existingItem) {
          existingItem.quantity++;
        } else {
          processedItems.push({
            product: product._id,
            name: product.name,
            price: product.price,
            quantity: 1,
            imageUrl: product.imageUrl,
            productType: product.type,
            discountApplied: itemDiscount,
            finalPrice: finalPrice
          });
        }
      }
    }

    // Apply promo code discount (if any)
    let promoDiscount = 0;
    let promoCodeData = null;
    
    if (promoCode) {
      const promo = await PromoCode.findOne({ code: promoCode.toUpperCase() }).session(session);
      if (promo && promo.isValid()) {
        promoDiscount = (subtotal * promo.discountPercent) / 100;
        promo.usageCount += 1;
        await promo.save({ session });
        promoCodeData = {
          code: promo.code,
          discountPercent: promo.discountPercent,
        };
      }
    }

    const total = subtotal - promoDiscount;

    // Create order
    const orderData = {
      orderItems: processedItems,
      shippingAddress,
      subtotal: subtotal + totalDiscount, // Original subtotal before loyalty discount
      discount: totalDiscount + promoDiscount,
      total,
      saucesInOrder: totalSaucesInOrder
    };

    if (isGuest) {
      orderData.guestEmail = guestEmail;
      orderData.guestPhone = guestPhone;
    } else {
      orderData.user = req.user.id;
      
      // Update user's sauce count
      const user = await User.findById(req.user.id).session(session);
      user.saucesOrderedCount = userSauceCount;
      await user.save({ session });
    }

    if (promoCodeData) {
      orderData.promoCodeUsed = promoCodeData;
    }

    const order = await Order.create([orderData], { session });

    // Clear cart
    if (!isGuest && req.user) {
      await Cart.findOneAndDelete({ user: req.user.id }, { session });
    }

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      data: order[0],
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// @desc    Get all orders for user
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const orders = await Order.find({ user: req.user.id })
    .populate('orderItems.product', 'name')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  const total = await Order.countDocuments({ user: req.user.id });

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: orders,
  });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate('orderItems.product', 'name');

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  // Make sure user is order owner or admin
  if (order.user && order.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to access this order', 403));
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});

// @desc    Update order (within 15 minutes)
// @route   PUT /api/orders/:id
// @access  Private
exports.updateOrder = asyncHandler(async (req, res, next) => {
  let order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  // Check ownership
  if (order.user && order.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to update this order', 403));
  }

  // Check if order can be edited
  if (!order.canBeEdited()) {
    return next(
      new ErrorResponse('Order can no longer be edited. Edit window has closed.', 400)
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // If updating order items, we need to restore old stock and deduct new stock
    if (req.body.orderItems) {
      // Restore stock for old items
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product).session(session);
        if (product) {
          product.stock += item.quantity;
          await product.save({ session });
        }
      }

      // Process new items
      let subtotal = 0;
      const processedItems = [];

      for (const item of req.body.orderItems) {
        const product = await Product.findById(item.product).session(session);

        if (!product || !product.isActive) {
          throw new ErrorResponse(`Product not available`, 400);
        }

        if (product.stock < item.quantity) {
          throw new ErrorResponse(`Insufficient stock for ${product.name}`, 400);
        }

        product.stock -= item.quantity;
        await product.save({ session });

        processedItems.push({
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          imageUrl: product.imageUrl,
        });

        subtotal += product.price * item.quantity;
      }

      order.orderItems = processedItems;
      order.subtotal = subtotal;
      order.total = subtotal - order.discount;
    }

    // Update shipping address if provided
    if (req.body.shippingAddress) {
      order.shippingAddress = req.body.shippingAddress;
    }

    await order.save({ session });
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  const oldStatus = order.status;
  order.status = status;

  // If order is completed, increment user's completed orders count
  if (status === 'Completed' && oldStatus !== 'Completed' && order.user) {
    const user = await User.findById(order.user);
    if (user) {
      user.completedOrdersCount += 1;
      await user.save();
    }
  }

  await order.save();

  res.status(200).json({
    success: true,
    data: order,
  });
});

// @desc    Cancel order
// @route   DELETE /api/orders/:id
// @access  Private
exports.cancelOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  // Check ownership
  if (order.user && order.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to cancel this order', 403));
  }

  if (order.status === 'Completed' || order.status === 'Cancelled') {
    return next(new ErrorResponse('Cannot cancel this order', 400));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Restore stock
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product).session(session);
      if (product) {
        product.stock += item.quantity;
        await product.save({ session });
      }
    }

    order.status = 'Cancelled';
    await order.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// @desc    Get all orders (admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
exports.getAllOrders = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const orders = await Order.find()
    .populate('user', 'fullName email')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  const total = await Order.countDocuments();

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: orders,
  });
});
