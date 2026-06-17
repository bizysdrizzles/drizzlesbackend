const PromoCode = require('../models/PromoCode');
const { asyncHandler } = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create promo code
// @route   POST /api/promocodes
// @access  Private/Admin
exports.createPromoCode = asyncHandler(async (req, res, next) => {
  const promoCode = await PromoCode.create(req.body);

  res.status(201).json({
    success: true,
    data: promoCode,
  });
});

// @desc    Get all promo codes
// @route   GET /api/promocodes
// @access  Private/Admin
exports.getPromoCodes = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const promoCodes = await PromoCode.find().skip(skip).limit(limit);

  const total = await PromoCode.countDocuments();

  res.status(200).json({
    success: true,
    count: promoCodes.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: promoCodes,
  });
});

// @desc    Get active promo codes
// @route   GET /api/promocodes/active
// @access  Private/Admin
exports.getActivePromoCodes = asyncHandler(async (req, res, next) => {
  const promoCodes = await PromoCode.find({ isActive: true });

  res.status(200).json({
    success: true,
    count: promoCodes.length,
    data: promoCodes,
  });
});

// @desc    Validate promo code
// @route   POST /api/promocodes/validate
// @access  Public
exports.validatePromoCode = asyncHandler(async (req, res, next) => {
  const { code } = req.body;

  if (!code) {
    return next(new ErrorResponse('Please provide a promo code', 400));
  }

  const promoCode = await PromoCode.findOne({ code: code.toUpperCase() });

  if (!promoCode) {
    return next(new ErrorResponse('Invalid promo code', 404));
  }

  if (!promoCode.isValid()) {
    return next(new ErrorResponse('Promo code is not valid or has expired', 400));
  }

  res.status(200).json({
    success: true,
    data: {
      code: promoCode.code,
      discountPercent: promoCode.discountPercent,
    },
  });
});

// @desc    Update promo code
// @route   PUT /api/promocodes/:id
// @access  Private/Admin
exports.updatePromoCode = asyncHandler(async (req, res, next) => {
  let promoCode = await PromoCode.findById(req.params.id);

  if (!promoCode) {
    return next(new ErrorResponse('Promo code not found', 404));
  }

  promoCode = await PromoCode.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: promoCode,
  });
});

// @desc    Delete promo code
// @route   DELETE /api/promocodes/:id
// @access  Private/Admin
exports.deletePromoCode = asyncHandler(async (req, res, next) => {
  const promoCode = await PromoCode.findById(req.params.id);

  if (!promoCode) {
    return next(new ErrorResponse('Promo code not found', 404));
  }

  await promoCode.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});
