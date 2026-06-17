const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeCart,
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

// Middleware to handle both authenticated and guest users
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
};

router.get('/', optionalAuth, getCart);
router.post('/', optionalAuth, addToCart);
router.put('/:productId', optionalAuth, updateCartItem);
router.delete('/:productId', optionalAuth, removeFromCart);
router.delete('/', optionalAuth, clearCart);
router.post('/merge', protect, mergeCart);

module.exports = router;
