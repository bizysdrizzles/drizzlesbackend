const { body } = require('express-validator');

exports.createOrderValidator = [
  body('orderItems')
    .isArray({ min: 1 })
    .withMessage('Order must have at least one item'),
  body('orderItems.*.product')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('orderItems.*.quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('shippingAddress.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('shippingAddress.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  // body('shippingAddress.zipCode')
  //   .trim()
  //   .notEmpty()
  //   .withMessage('Zip code is required'),
  body('shippingAddress.country')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Country cannot be empty'),
  body('promoCode').optional().trim(),
  body('guestEmail')
    .if(body('isGuest').equals('true'))
    .trim()
    .notEmpty()
    .withMessage('Guest email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('guestPhone')
    .if(body('isGuest').equals('true'))
    .trim()
    .notEmpty()
    .withMessage('Guest phone is required'),
];

exports.updateOrderValidator = [
  body('orderItems')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Order must have at least one item'),
  body('shippingAddress').optional().isObject().withMessage('Shipping address must be an object'),
];
