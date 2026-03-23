const Student = require('../models/Student');
const User = require('../models/User');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

/**
 * GET /api/admin/stats
 * Dashboard aggregation: total students, status breakdown, recent registrations.
 */
const getStats = async (req, res) => {
  try {
    const [total, incomplete, pending, approved, rejected] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ registrationStatus: 'incomplete' }),
      Student.countDocuments({ registrationStatus: 'pending' }),
      Student.countDocuments({ registrationStatus: 'approved' }),
      Student.countDocuments({ registrationStatus: 'rejected' }),
    ]);

    const recentStudents = await Student.find()
      .populate('userId', 'name email createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('registrationStatus completionFlags createdAt userId');

    res.status(200).json({
      success: true,
      stats: { total, incomplete, pending, approved, rejected },
      recentStudents,
    });
  } catch (err) {
    logger.error(`Admin stats error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Could not fetch stats.' });
  }
};

/**
 * GET /api/admin/students?page=1&limit=20&status=pending&search=john
 * Paginated, filterable student list.
 */
const getAllStudents = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const filter = {};

    if (status && ['incomplete', 'pending', 'approved', 'rejected'].includes(status)) {
      filter.registrationStatus = status;
    }

    let query = Student.find(filter).populate('userId', 'name email createdAt');

    // Text search via user name/email
    if (search) {
      const userIds = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      filter.userId = { $in: userIds.map((u) => u._id) };
      query = Student.find(filter).populate('userId', 'name email createdAt');
    }

    const total = await Student.countDocuments(filter);
    const students = await query
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      students,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    logger.error(`Admin students error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Could not fetch students.' });
  }
};

/**
 * GET /api/admin/students/:id
 * Full student profile for admin review.
 */
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('userId', 'name email role createdAt lastLogin');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.status(200).json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch student.' });
  }
};

/**
 * PUT /api/admin/students/:id/status
 * Approves or rejects a student's registration.
 */
const updateStudentStatus = async (req, res) => {
  try {
    const { status, adminNote, roomNumber } = req.body;
    const validStatuses = ['approved', 'rejected', 'pending'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { registrationStatus: status, adminNote, roomNumber: roomNumber || undefined },
      { new: true }
    ).populate('userId', 'name email');

    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    // Notify student about status change
    const messages = {
      approved: { title: '🎉 Registration Approved!', msg: `Congratulations! Your hostel registration is approved.${roomNumber ? ` Your room number is ${roomNumber}.` : ''}`, type: 'approval' },
      rejected: { title: '❌ Registration Rejected', msg: `Your registration was not approved. Reason: ${adminNote || 'Please contact admin.'}`, type: 'warning' },
      pending: { title: '🔄 Status Updated', msg: 'Your registration is under review.', type: 'info' },
    };

    await Notification.create({
      userId: student.userId._id,
      title: messages[status].title,
      message: messages[status].msg,
      type: messages[status].type,
    });

    logger.info(`Admin ${req.user._id} updated student ${req.params.id} status to ${status}`);

    res.status(200).json({ success: true, message: `Student ${status}.`, student });
  } catch (err) {
    logger.error(`Status update error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Could not update status.' });
  }
};

/**
 * POST /api/admin/notify
 * Admin sends a broadcast or targeted notification.
 */
const sendAdminNotification = async (req, res) => {
  try {
    const { title, message, type, targetUserId } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message required.' });
    }

    let userIds;
    if (targetUserId) {
      userIds = [targetUserId];
    } else {
      // Broadcast to all students
      const users = await User.find({ role: 'student' }).select('_id');
      userIds = users.map((u) => u._id);
    }

    const notifications = userIds.map((userId) => ({ userId, title, message, type: type || 'info' }));
    await Notification.insertMany(notifications);

    res.status(200).json({ success: true, message: `Notification sent to ${userIds.length} user(s).` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not send notification.' });
  }
};

module.exports = { getStats, getAllStudents, getStudentById, updateStudentStatus, sendAdminNotification };
