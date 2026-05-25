const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['order_placed','order_confirmed','order_harvested','order_delivered','new_message','new_review','low_stock'],
    required: true,
  },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  link:    { type: String, default: '' },   // e.g. /orders/abc123
  isRead:  { type: Boolean, default: false },
  meta:    { type: mongoose.Schema.Types.Mixed }, // extra data
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
