const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getAdminProducts,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const {
  createProductValidator,
  updateProductValidator,
} = require('../validators/productValidator');
const { validate } = require('../middleware/validation');

router.get('/', getProducts);
router.get('/admin/all', protect, authorize('admin'), getAdminProducts);
router.get('/:id', getProduct);
router.post('/', protect, authorize('admin'), createProductValidator, validate, createProduct);
router.put('/:id', protect, authorize('admin'), updateProductValidator, validate, updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);
router.patch('/:id/stock', protect, authorize('admin'), updateStock);

module.exports = router;
