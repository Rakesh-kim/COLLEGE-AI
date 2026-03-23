const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getNotifications, markNotificationRead } = require('../controllers/studentController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.get('/profile', protect, requireRole('student'), getProfile);
router.put('/profile', protect, requireRole('student'), updateProfile);
router.get('/notifications', protect, getNotifications); // Both student & admin
router.put('/notifications/:id/read', protect, markNotificationRead);

module.exports = router;
