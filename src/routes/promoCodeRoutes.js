const express = require('express');
const router = express.Router();
const {
  createPromoCode,
  getPromoCodes,
  getActivePromoCodes,
  validatePromoCode,
  updatePromoCode,
  deletePromoCode,
} = require('../controllers/promoCodeController');
const { protect, authorize } = require('../middleware/auth');
const {
  createPromoCodeValidator,
  updatePromoCodeValidator,
} = require('../validators/promoCodeValidator');
const { validate } = require('../middleware/validation');

router.post('/validate', validatePromoCode);
router.get('/active', protect, authorize('admin'), getActivePromoCodes);
router.get('/', protect, authorize('admin'), getPromoCodes);
router.post('/', protect, authorize('admin'), createPromoCodeValidator, validate, createPromoCode);
router.put('/:id', protect, authorize('admin'), updatePromoCodeValidator, validate, updatePromoCode);
router.delete('/:id', protect, authorize('admin'), deletePromoCode);

module.exports = router;
