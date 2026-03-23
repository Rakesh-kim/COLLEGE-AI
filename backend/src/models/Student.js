const mongoose = require('mongoose');

/**
 * Student Model
 * Stores hostel registration details, chat history, and uploaded documents.
 * Linked to User model via userId reference.
 */
const documentSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  mimetype: String,
  size: Number,
  path: String,
  uploadedAt: { type: Date, default: Date.now },
  validated: { type: Boolean, default: false },
  validationNote: String,
});

const chatMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'] },
  content: String,
  timestamp: { type: Date, default: Date.now },
});

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // Academic Info (collected via chatbot)
    rollNo: { type: String, trim: true },
    course: { type: String, trim: true },
    year: { type: Number, min: 1, max: 5 },
    branch: { type: String, trim: true },
    phone: { type: String, trim: true },
    parentPhone: { type: String, trim: true },
    address: { type: String, trim: true },
    bloodGroup: { type: String, trim: true },
    emergencyContact: { type: String, trim: true },

    // Hostel preferences
    roomPreference: {
      type: String,
      enum: ['single', 'double', 'triple'],
      default: 'double',
    },
    roomNumber: { type: String },

    // Registration status
    registrationStatus: {
      type: String,
      enum: ['incomplete', 'pending', 'approved', 'rejected'],
      default: 'incomplete',
    },
    adminNote: { type: String }, // Admin feedback on rejection

    // Documents
    documents: [documentSchema],

    // Chat history with AI (kept for context continuity)
    chatHistory: [chatMessageSchema],

    // Registration completeness flags
    completionFlags: {
      personalInfo: { type: Boolean, default: false },
      academicInfo: { type: Boolean, default: false },
      documentsUploaded: { type: Boolean, default: false },
      roomSelected: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Virtual: completion percentage
studentSchema.virtual('completionPercent').get(function () {
  const flags = Object.values(this.completionFlags);
  const done = flags.filter(Boolean).length;
  return Math.round((done / flags.length) * 100);
});

studentSchema.set('toJSON', { virtuals: true });
studentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Student', studentSchema);
