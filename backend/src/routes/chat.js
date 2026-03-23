const express = require('express');
const router = express.Router();
const { sendMessage, getChatHistory } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Students only can chat
router.post('/', protect, requireRole('student'), sendMessage);
router.get('/history', protect, requireRole('student'), getChatHistory);

module.exports = router;
