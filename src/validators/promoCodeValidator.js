const { body } = require('express-validator');

exports.createPromoCodeValidator = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Promo code is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Promo code must be between 3 and 20 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Promo code must contain only uppercase letters and numbers'),
  body('discountPercent')
    .notEmpty()
    .withMessage('Discount percentage is required')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100'),
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('usageLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Usage limit must be at least 1'),
];

exports.updatePromoCodeValidator = [
  body('discountPercent')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100'),
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('usageLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Usage limit must be at least 1'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];
