const asyncHandler   = require('express-async-handler');
const Order          = require('../models/Order');
const Product        = require('../models/Product');
const Review         = require('../models/Review');
const User           = require('../models/User');

// GET /api/analytics/farmer — full analytics for a farmer's dashboard
const getFarmerAnalytics = asyncHandler(async (req, res) => {
  const farmerId = req.user._id;

  // ── Revenue by month (last 6 months) ────────────────────────
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const revenueByMonth = await Order.aggregate([
    { $match: { farmer: farmerId, status: 'delivered', createdAt: { $gte: sixMonthsAgo } } },
    { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        orders:  { $sum: 1 },
    }},
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // ── Top selling products ─────────────────────────────────────
  const topProducts = await Order.aggregate([
    { $match: { farmer: farmerId, status: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    { $group: {
        _id:      '$items.name',
        revenue:  { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        qty:      { $sum: '$items.quantity' },
        orders:   { $sum: 1 },
    }},
    { $sort: { revenue: -1 } },
    { $limit: 5 },
  ]);

  // ── Orders by status ─────────────────────────────────────────
  const ordersByStatus = await Order.aggregate([
    { $match: { farmer: farmerId } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  // ── KPIs ─────────────────────────────────────────────────────
  const [totalRevenueArr, totalOrders, totalProducts, avgRatingArr] = await Promise.all([
    Order.aggregate([
      { $match: { farmer: farmerId, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.countDocuments({ farmer: farmerId }),
    Product.countDocuments({ farmer: farmerId, isAvailable: true }),
    Review.aggregate([
      { $match: { farmer: farmerId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]),
  ]);

  // ── Unique customers ─────────────────────────────────────────
  const uniqueCustomers = await Order.distinct('customer', { farmer: farmerId });

  // ── Weekly orders (last 8 weeks) ─────────────────────────────
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
  const weeklyOrders = await Order.aggregate([
    { $match: { farmer: farmerId, createdAt: { $gte: eightWeeksAgo } } },
    { $group: {
        _id: { $week: '$createdAt' },
        count:   { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
    }},
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    kpis: {
      totalRevenue:    totalRevenueArr[0]?.total || 0,
      totalOrders,
      totalProducts,
      avgRating:       avgRatingArr[0]?.avg ? Math.round(avgRatingArr[0].avg * 10) / 10 : 0,
      totalReviews:    avgRatingArr[0]?.count || 0,
      uniqueCustomers: uniqueCustomers.length,
    },
    revenueByMonth,
    topProducts,
    ordersByStatus,
    weeklyOrders,
  });
});

// GET /api/analytics/recommendations/:userId — smart recommendations
const getRecommendations = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  // 1. Get categories the user has ordered before
  const pastOrders = await Order.find({ customer: userId }).limit(20);
  const orderedProductIds = pastOrders.flatMap(o => o.items.map(i => i.product));

  // 2. Get categories of those products
  const orderedProducts = await Product.find({ _id: { $in: orderedProductIds } }).select('category');
  const preferredCats   = [...new Set(orderedProducts.map(p => p.category))];

  // 3. Find products in same categories, not already ordered, with high rating
  let recommended = [];
  if (preferredCats.length > 0) {
    recommended = await Product.find({
      category:    { $in: preferredCats },
      _id:         { $nin: orderedProductIds },
      isAvailable: true,
      stock:       { $gt: 0 },
    })
    .populate('farmer', 'name isVerified location farmName')
    .sort({ avgRating: -1, createdAt: -1 })
    .limit(8);
  }

  // 4. If not enough, fill with top-rated products
  if (recommended.length < 4) {
    const fillProducts = await Product.find({
      _id: { $nin: [...orderedProductIds, ...recommended.map(p => p._id)] },
      isAvailable: true,
      stock: { $gt: 0 },
    })
    .populate('farmer', 'name isVerified location farmName')
    .sort({ avgRating: -1 })
    .limit(8 - recommended.length);
    recommended = [...recommended, ...fillProducts];
  }

  res.json({ success: true, recommended, basedOn: preferredCats });
});

module.exports = { getFarmerAnalytics, getRecommendations };
