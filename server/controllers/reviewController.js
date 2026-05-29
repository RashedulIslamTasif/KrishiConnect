const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Order  = require('../models/Order');

// POST /api/reviews
const createReview = asyncHandler(async (req, res) => {
  const { farmerId, productId, orderId, rating, comment } = req.body;
  const order = await Order.findById(orderId);
  if (!order || order.customer.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('You can only review orders you placed');
  }
  if (order.status !== 'delivered') {
    res.status(400); throw new Error('You can only review after order is delivered');
  }
  const existing = await Review.findOne({ reviewer: req.user._id, order: orderId });
  if (existing) {
    return res.status(200).json({ success: true, review: existing, alreadyReviewed: true });
  }
  const review = await Review.create({ reviewer: req.user._id, farmer: farmerId, product: productId, order: orderId, rating, comment });
  res.status(201).json({ success: true, review });
});

// GET /api/reviews/my
const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ reviewer: req.user._id }).select('order');
  res.json({ success: true, reviewedOrderIds: reviews.map(r => r.order?.toString()) });
});

// GET /api/reviews/product/:productId  ← reviews for a specific product
const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId })
    .populate('reviewer', 'name avatar')
    .sort({ createdAt: -1 });
  res.json({ success: true, reviews });
});

// GET /api/reviews/farmer/:farmerId
const getFarmerReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ farmer: req.params.farmerId })
    .populate('reviewer', 'name avatar')
    .sort({ createdAt: -1 });
  res.json({ success: true, reviews });
});

module.exports = { createReview, getMyReviews, getProductReviews, getFarmerReviews };
