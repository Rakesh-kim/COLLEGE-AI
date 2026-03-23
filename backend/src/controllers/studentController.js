const Student = require('../models/Student');
const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * GET /api/student/profile
 * Returns the current student's full profile.
 */
const getProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id })
      .populate('userId', 'name email role createdAt');
    if (!student) return res.status(404).json({ success: false, message: 'Profile not found.' });
    res.status(200).json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch profile.' });
  }
};

/**
 * PUT /api/student/profile
 * Lets student update their own allowed fields.
 */
const updateProfile = async (req, res) => {
  try {
    const allowed = ['rollNo', 'course', 'year', 'branch', 'phone', 'parentPhone', 'bloodGroup', 'address', 'emergencyContact', 'roomPreference'];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const student = await Student.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!student) return res.status(404).json({ success: false, message: 'Profile not found.' });

    res.status(200).json({ success: true, message: 'Profile updated.', student });
  } catch (err) {
    logger.error(`Profile update error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Could not update profile.' });
  }
};

/**
 * GET /api/student/notifications
 * Returns all notifications for the student, newest first.
 */
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    // Count unread
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });

    res.status(200).json({ success: true, notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch notifications.' });
  }
};

/**
 * PUT /api/student/notifications/:id/read
 * Marks a notification as read.
 */
const markNotificationRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not update notification.' });
  }
};

module.exports = { getProfile, updateProfile, getNotifications, markNotificationRead };
