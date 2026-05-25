const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage:  { type: String, default: '' },
  lastMessageAt:{ type: Date,   default: Date.now },
  product:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // context product
}, { timestamps: true });

// Ensure only one conversation between two users per product
conversationSchema.index({ participants: 1, product: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
