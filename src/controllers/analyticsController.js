const Order = require('../models/Order');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/asyncHandler');

// @desc    Get sales analytics
// @route   GET /api/analytics/sales
// @access  Private/Admin
exports.getSalesAnalytics = asyncHandler(async (req, res, next) => {
  // Total revenue
  const revenueData = await Order.aggregate([
    {
      $match: {
        status: { $in: ['Completed'] },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$total' },
        totalOrders: { $sum: 1 },
        averageOrderValue: { $avg: '$total' },
      },
    },
  ]);

  // Revenue per product
  const revenuePerProduct = await Order.aggregate([
    {
      $match: {
        status: { $in: ['Completed'] },
      },
    },
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: '$orderItems.name',
        totalRevenue: {
          $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] },
        },
        totalQuantity: { $sum: '$orderItems.quantity' },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);

  // Orders per day (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const ordersPerDay = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        count: { $sum: 1 },
        revenue: { $sum: '$total' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    {
      $project: {
        _id: 0,
        date: {
          $dateFromParts: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day',
          },
        },
        count: 1,
        revenue: 1,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      overview: revenueData[0] || {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
      },
      revenuePerProduct,
      ordersPerDay,
    },
  });
});

// @desc    Get analytics by date range
// @route   GET /api/analytics/daterange
// @access  Private/Admin
exports.getAnalyticsByDateRange = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: 'Please provide startDate and endDate query parameters',
    });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // End of day

  const analytics = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
        status: { $in: ['Completed'] },
      },
    },
    {
      $facet: {
        overview: [
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$total' },
              totalOrders: { $sum: 1 },
              averageOrderValue: { $avg: '$total' },
            },
          },
        ],
        dailyBreakdown: [
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' },
              },
              count: { $sum: 1 },
              revenue: { $sum: '$total' },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
          {
            $project: {
              _id: 0,
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: '$_id.day',
                },
              },
              count: 1,
              revenue: 1,
            },
          },
        ],
        productBreakdown: [
          { $unwind: '$orderItems' },
          {
            $group: {
              _id: '$orderItems.name',
              totalRevenue: {
                $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] },
              },
              totalQuantity: { $sum: '$orderItems.quantity' },
            },
          },
          { $sort: { totalRevenue: -1 } },
        ],
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      dateRange: { startDate, endDate },
      overview: analytics[0].overview[0] || {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
      },
      dailyBreakdown: analytics[0].dailyBreakdown,
      productBreakdown: analytics[0].productBreakdown,
    },
  });
});

// @desc    Get most purchased product
// @route   GET /api/analytics/popular
// @access  Private/Admin
exports.getMostPurchasedProduct = asyncHandler(async (req, res, next) => {
  const popularProducts = await Order.aggregate([
    {
      $match: {
        status: { $in: ['Completed'] },
      },
    },
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: {
          productId: '$orderItems.product',
          productName: '$orderItems.name',
        },
        totalQuantity: { $sum: '$orderItems.quantity' },
        totalRevenue: {
          $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] },
        },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        productId: '$_id.productId',
        productName: '$_id.productName',
        totalQuantity: 1,
        totalRevenue: 1,
        orderCount: 1,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: popularProducts,
  });
});

// @desc    Get user statistics
// @route   GET /api/analytics/users
// @access  Private/Admin
exports.getUserStatistics = asyncHandler(async (req, res, next) => {
  const totalUsers = await User.countDocuments();
  const loyaltyMembers = await User.countDocuments({ isLoyaltyMember: true });

  const userDistribution = await User.aggregate([
    {
      $group: {
        _id: '$isLoyaltyMember',
        count: { $sum: 1 },
      },
    },
  ]);

  const topCustomers = await Order.aggregate([
    {
      $match: {
        user: { $exists: true },
        status: 'Completed',
      },
    },
    {
      $group: {
        _id: '$user',
        totalSpent: { $sum: '$total' },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userDetails',
      },
    },
    { $unwind: '$userDetails' },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        fullName: '$userDetails.fullName',
        email: '$userDetails.email',
        totalSpent: 1,
        orderCount: 1,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      loyaltyMembers,
      regularUsers: totalUsers - loyaltyMembers,
      userDistribution,
      topCustomers,
    },
  });
});

// @desc    Get order status distribution
// @route   GET /api/analytics/orders/status
// @access  Private/Admin
exports.getOrderStatusDistribution = asyncHandler(async (req, res, next) => {
  const statusDistribution = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$total' },
      },
    },
    { $sort: { count: -1 } },
  ]);

  res.status(200).json({
    success: true,
    data: statusDistribution,
  });
});
