const express = require('express');
const router = express.Router();
const {
  createFeedback,
  getAllFeedback,
  getFeedback,
  deleteFeedback,
} = require('../controllers/feedbackController');
const { protect, authorize } = require('../middleware/auth');
const { createFeedbackValidator } = require('../validators/feedbackValidator');
const { validate } = require('../middleware/validation');

// Optional auth for feedback creation
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
};

router.post('/', optionalAuth, createFeedbackValidator, validate, createFeedback);
router.get('/', getAllFeedback);
router.get('/:id', getFeedback);
router.delete('/:id', protect, authorize('admin'), deleteFeedback);

module.exports = router;
