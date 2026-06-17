const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrder,
  updateOrder,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const {
  createOrderValidator,
  updateOrderValidator,
} = require('../validators/orderValidator');
const { validate } = require('../middleware/validation');

// Protect middleware is optional for createOrder (supports guest)
router.post('/', createOrderValidator, validate, (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
}, createOrder);

router.get('/myorders', protect, getMyOrders);
router.get('/admin/all', protect, authorize('admin'), getAllOrders);
router.get('/:id', protect, getOrder);
router.put('/:id', protect, updateOrderValidator, validate, updateOrder);
router.patch('/:id/status', protect, authorize('admin'), updateOrderStatus);
router.delete('/:id', protect, cancelOrder);

module.exports = router;
