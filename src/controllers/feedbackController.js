const Feedback = require('../models/Feedback');
const { asyncHandler } = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create feedback
// @route   POST /api/feedback
// @access  Public
exports.createFeedback = asyncHandler(async (req, res, next) => {
  const feedbackData = { ...req.body };

  // If user is logged in, attach user ID
  if (req.user) {
    feedbackData.user = req.user.id;
  }

  const feedback = await Feedback.create(feedbackData);

  res.status(201).json({
    success: true,
    data: feedback,
  });
});

// @desc    Get all feedback
// @route   GET /api/feedback
// @access  Private/Admin
exports.getAllFeedback = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const feedback = await Feedback.find()
    .populate('user', 'fullName email')
    .populate('order', 'orderItems')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  const total = await Feedback.countDocuments();

  res.status(200).json({
    success: true,
    count: feedback.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: feedback,
  });
});

// @desc    Get single feedback
// @route   GET /api/feedback/:id
// @access  Private/Admin
exports.getFeedback = asyncHandler(async (req, res, next) => {
  const feedback = await Feedback.findById(req.params.id)
    .populate('user', 'fullName email')
    .populate('order', 'orderItems');

  if (!feedback) {
    return next(new ErrorResponse('Feedback not found', 404));
  }

  res.status(200).json({
    success: true,
    data: feedback,
  });
});

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private/Admin
exports.deleteFeedback = asyncHandler(async (req, res, next) => {
  const feedback = await Feedback.findById(req.params.id);

  if (!feedback) {
    return next(new ErrorResponse('Feedback not found', 404));
  }

  await feedback.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});
