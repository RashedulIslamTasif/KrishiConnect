const asyncHandler   = require('express-async-handler');
const Conversation   = require('../models/Conversation');
const Message        = require('../models/Message');
const Notification   = require('../models/Notification');

// GET /api/chat/conversations — get all my conversations
const getConversations = asyncHandler(async (req, res) => {
  const convos = await Conversation.find({ participants: req.user._id })
    .populate('participants', 'name avatar role')
    .populate('product', 'name images')
    .sort({ lastMessageAt: -1 });
  res.json({ success: true, conversations: convos });
});

// POST /api/chat/start — start or get existing conversation
const startConversation = asyncHandler(async (req, res) => {
  const { recipientId, productId } = req.body;

  let convo = await Conversation.findOne({
    participants: { $all: [req.user._id, recipientId] },
    product: productId || null,
  }).populate('participants', 'name avatar role');

  if (!convo) {
    convo = await Conversation.create({
      participants: [req.user._id, recipientId],
      product: productId || null,
    });
    convo = await convo.populate('participants', 'name avatar role');
  }

  res.json({ success: true, conversation: convo });
});

// GET /api/chat/:conversationId/messages
const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  // Verify user is a participant
  const convo = await Conversation.findById(conversationId);
  if (!convo || !convo.participants.includes(req.user._id)) {
    res.status(403); throw new Error('Not authorized');
  }

  const messages = await Message.find({ conversation: conversationId })
    .populate('sender', 'name avatar')
    .sort({ createdAt: 1 });

  // Mark messages as read
  await Message.updateMany(
    { conversation: conversationId, sender: { $ne: req.user._id }, isRead: false },
    { isRead: true }
  );

  res.json({ success: true, messages });
});

// POST /api/chat/:conversationId/messages
const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { text } = req.body;

  const convo = await Conversation.findById(conversationId);
  if (!convo || !convo.participants.includes(req.user._id)) {
    res.status(403); throw new Error('Not authorized');
  }

  const message = await Message.create({
    conversation: conversationId,
    sender: req.user._id,
    text,
  });

  // Update conversation lastMessage
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: text.length > 60 ? text.slice(0, 60) + '...' : text,
    lastMessageAt: new Date(),
  });

  const populated = await message.populate('sender', 'name avatar');

  // Notify the other participant
  const recipientId = convo.participants.find(p => p.toString() !== req.user._id.toString());
  if (recipientId) {
    await Notification.create({
      recipient: recipientId,
      type: 'new_message',
      title: `New message from ${req.user.name}`,
      message: text.length > 80 ? text.slice(0, 80) + '...' : text,
      link: `/chat/${conversationId}`,
    });

    // Emit socket event if available
    if (req.app.get('io')) {
      req.app.get('io').to(recipientId.toString()).emit('new_message', {
        conversationId,
        message: populated,
      });
    }
  }

  res.status(201).json({ success: true, message: populated });
});

// GET /api/chat/unread — unread message count
const getUnreadCount = asyncHandler(async (req, res) => {
  const convos = await Conversation.find({ participants: req.user._id }).select('_id');
  const convoIds = convos.map(c => c._id);
  const count = await Message.countDocuments({
    conversation: { $in: convoIds },
    sender: { $ne: req.user._id },
    isRead: false,
  });
  res.json({ success: true, count });
});

module.exports = { getConversations, startConversation, getMessages, sendMessage, getUnreadCount };
