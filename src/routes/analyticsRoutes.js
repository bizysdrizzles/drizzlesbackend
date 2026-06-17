const express = require('express');
const router = express.Router();
const {
  getSalesAnalytics,
  getAnalyticsByDateRange,
  getMostPurchasedProduct,
  getUserStatistics,
  getOrderStatusDistribution,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/sales', getSalesAnalytics);
router.get('/daterange', getAnalyticsByDateRange);
router.get('/popular', getMostPurchasedProduct);
router.get('/users', getUserStatistics);
router.get('/orders/status', getOrderStatusDistribution);

module.exports = router;
