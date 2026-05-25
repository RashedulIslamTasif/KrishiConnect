const asyncHandler   = require('express-async-handler');
const Notification   = require('../models/Notification');

// GET /api/notifications — get my notifications
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ success: true, notifications });
});

// GET /api/notifications/unread-count
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  res.json({ success: true, count });
});

// PUT /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true }
  );
  res.json({ success: true });
});

// PUT /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true });
});

// Helper: create notification from anywhere in the app
const createNotification = async ({ recipientId, type, title, message, link, meta, io }) => {
  const notif = await Notification.create({ recipient: recipientId, type, title, message, link, meta });
  if (io) io.to(recipientId.toString()).emit('notification', notif);
  return notif;
};

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead, createNotification };
