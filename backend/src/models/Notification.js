const mongoose = require('mongoose');

/**
 * Notification Model
 * Supports both system-generated and admin-sent notifications.
 */
const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'deadline', 'approval'],
      default: 'info',
    },
    read: {
      type: Boolean,
      default: false,
    },
    // Optional deep link for frontend routing
    link: { type: String },
  },
  { timestamps: true }
);

// Index for fast per-user queries
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
