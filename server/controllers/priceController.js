const asyncHandler = require('express-async-handler');
const PriceHistory = require('../models/PriceHistory');

// ── GET /api/prices/:productName ─────────────────────────────
// Returns last 8 price records for a product — used in the Recharts graph
const getPriceHistory = asyncHandler(async (req, res) => {
  const productName = req.params.productName.toLowerCase();

  const history = await PriceHistory.find({ productName })
    .sort({ recordedAt: -1 })
    .limit(8);

  // Reverse so oldest is first (for the chart x-axis)
  res.json({ success: true, history: history.reverse() });
});

// ── POST /api/prices ─────────────────────────────────────────
// Farmer records their price vs market price today
const recordPrice = asyncHandler(async (req, res) => {
  const { productName, farmerPrice, marketPrice } = req.body;

  const record = await PriceHistory.create({
    productName: productName.toLowerCase(),
    farmerPrice,
    marketPrice,
    farmer: req.user._id,
  });

  res.status(201).json({ success: true, record });
});

// ── GET /api/prices/all ──────────────────────────────────────
// Get the latest price entry per product (for overview table)
const getLatestPrices = asyncHandler(async (req, res) => {
  const prices = await PriceHistory.aggregate([
    { $sort: { recordedAt: -1 } },
    { $group: { _id: '$productName', latest: { $first: '$$ROOT' } } },
    { $replaceRoot: { newRoot: '$latest' } },
  ]);

  res.json({ success: true, prices });
});

module.exports = { getPriceHistory, recordPrice, getLatestPrices };
