const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code:       { type: String, required: true, unique: true, uppercase: true, trim: true },
  type:       { type: String, enum: ['percent', 'flat'], default: 'percent' },
  value:      { type: Number, required: true },           // 20 => 20% off OR ৳20 off
  minOrder:   { type: Number, default: 0 },               // minimum order amount
  maxUses:    { type: Number, default: 100 },
  usedCount:  { type: Number, default: 0 },
  usedBy:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  expiresAt:  { type: Date },
  isActive:   { type: Boolean, default: true },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin/farmer
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
