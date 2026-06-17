const { body } = require('express-validator');

exports.createProductValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2 })
    .withMessage('Product name must be at least 2 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Product description is required'),
  body('price')
    .notEmpty()
    .withMessage('Product price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .notEmpty()
    .withMessage('Stock quantity is required')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('imageUrl')
    .trim()
    .notEmpty()
    .withMessage('Image URL is required')
    .isURL()
    .withMessage('Please provide a valid URL'),
];

exports.updateProductValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Product name must be at least 2 characters'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('imageUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid URL'),
];
