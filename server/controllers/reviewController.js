const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Order  = require('../models/Order');

// ── POST /api/reviews ────────────────────────────────────────
const createReview = asyncHandler(async (req, res) => {
  const { farmerId, productId, orderId, rating, comment } = req.body;

  // Verify the order exists and belongs to this customer
  const order = await Order.findById(orderId);
  if (!order || order.customer.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('You can only review orders you placed');
  }
  if (order.status !== 'delivered') {
    res.status(400); throw new Error('You can only review after order is delivered');
  }

  const review = await Review.create({
    reviewer: req.user._id,
    farmer:   farmerId,
    product:  productId,
    order:    orderId,
    rating,
    comment,
  });

  res.status(201).json({ success: true, review });
});

// ── GET /api/reviews/farmer/:farmerId ────────────────────────
const getFarmerReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ farmer: req.params.farmerId })
    .populate('reviewer', 'name avatar')
    .sort({ createdAt: -1 });

  res.json({ success: true, reviews });
});

module.exports = { createReview, getFarmerReviews };
