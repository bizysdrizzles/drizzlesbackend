const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const query = { isActive: true };

  const products = await Product.find(query)
    .select('-stock') // Hide stock from customers
    .skip(skip)
    .limit(limit);

  const total = await Product.countDocuments(query);

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: products,
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id).select('-stock');

  if (!product || !product.isActive) {
    return next(new ErrorResponse('Product not found', 404));
  }

  res.status(200).json({
    success: true,
    data: product,
  });
});

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    data: product,
  });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: product,
  });
});

// @desc    Delete product (soft delete)
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  // Soft delete
  product.isActive = false;
  await product.save();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Update stock
// @route   PATCH /api/products/:id/stock
// @access  Private/Admin
exports.updateStock = asyncHandler(async (req, res, next) => {
  const { quantity, operation } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  if (operation === 'increase') {
    product.stock += quantity;
  } else if (operation === 'decrease') {
    product.stock = Math.max(0, product.stock - quantity);
  } else {
    return next(new ErrorResponse('Invalid operation. Use "increase" or "decrease"', 400));
  }

  await product.save();

  res.status(200).json({
    success: true,
    data: product,
  });
});

// @desc    Get all products (admin view with stock)
// @route   GET /api/products/admin/all
// @access  Private/Admin
exports.getAdminProducts = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const products = await Product.find().skip(skip).limit(limit);

  const total = await Product.countDocuments();

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: products,
  });
});
