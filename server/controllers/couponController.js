const asyncHandler = require('express-async-handler');
const Coupon       = require('../models/Coupon');

// POST /api/coupons/validate — customer validates a coupon before checkout
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, orderAmount } = req.body;

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

  if (!coupon) {
    res.status(400); throw new Error('Invalid or expired coupon code');
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    res.status(400); throw new Error('Coupon has expired');
  }
  if (coupon.usedCount >= coupon.maxUses) {
    res.status(400); throw new Error('Coupon usage limit reached');
  }
  if (coupon.usedBy.includes(req.user._id)) {
    res.status(400); throw new Error('You have already used this coupon');
  }
  if (orderAmount < coupon.minOrder) {
    res.status(400); throw new Error(`Minimum order of ৳${coupon.minOrder} required`);
  }

  const discount = coupon.type === 'percent'
    ? Math.round((orderAmount * coupon.value) / 100)
    : coupon.value;

  const finalAmount = Math.max(0, orderAmount - discount);

  res.json({
    success: true,
    coupon: { code: coupon.code, type: coupon.type, value: coupon.value },
    discount,
    finalAmount,
    message: coupon.type === 'percent' ? `${coupon.value}% off applied!` : `৳${coupon.value} off applied!`,
  });
});

// POST /api/coupons/apply — called when order is placed, marks coupon as used
const applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (coupon) {
    coupon.usedCount += 1;
    coupon.usedBy.push(req.user._id);
    await coupon.save();
  }
  res.json({ success: true });
});

// POST /api/coupons — admin/farmer creates a coupon
const createCoupon = asyncHandler(async (req, res) => {
  const { code, type, value, minOrder, maxUses, expiresAt } = req.body;

  const existing = await Coupon.findOne({ code: code.toUpperCase() });
  if (existing) { res.status(400); throw new Error('Coupon code already exists'); }

  const coupon = await Coupon.create({
    code, type, value, minOrder, maxUses, expiresAt,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, coupon });
});

// GET /api/coupons — farmer/admin sees their coupons
const getMyCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, coupons });
});

// DELETE /api/coupons/:id
const deleteCoupon = asyncHandler(async (req, res) => {
  await Coupon.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
  res.json({ success: true });
});

module.exports = { validateCoupon, applyCoupon, createCoupon, getMyCoupons, deleteCoupon };
