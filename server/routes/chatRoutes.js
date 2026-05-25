const express = require('express');
const router  = express.Router();
const protect = require('../middleware/protect');
const { getConversations, startConversation, getMessages, sendMessage, getUnreadCount } = require('../controllers/chatController');

router.get('/conversations',             protect, getConversations);
router.post('/start',                    protect, startConversation);
router.get('/unread',                    protect, getUnreadCount);
router.get('/:conversationId/messages',  protect, getMessages);
router.post('/:conversationId/messages', protect, sendMessage);

module.exports = router;
