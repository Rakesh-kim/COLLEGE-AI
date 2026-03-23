const express = require('express');
const router = express.Router();
const {
  getStats,
  getAllStudents,
  getStudentById,
  updateStudentStatus,
  sendAdminNotification,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// All admin routes require authentication + admin role
router.use(protect, requireRole('admin'));

router.get('/stats', getStats);
router.get('/students', getAllStudents);
router.get('/students/:id', getStudentById);
router.put('/students/:id/status', updateStudentStatus);
router.post('/notify', sendAdminNotification);

module.exports = router;
