const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

// === Multer Configuration ===
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '10');

// Use memoryStorage in production (Render has ephemeral disk — files lost on restart)
// Use diskStorage in development for easy inspection
const storage = process.env.NODE_ENV === 'production'
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads', req.user._id.toString());
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${Date.now()}-${safeName}`);
      },
    });

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG, and PNG files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  fileFilter,
});

/**
 * POST /api/upload
 * Handles single document upload, validates it, saves metadata to Student.
 */
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { documentType } = req.body; // e.g. "ID Proof", "Admission Letter"

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // Basic validation: check file size > 1KB (not empty/corrupt)
    const fileSizeKB = req.file.size / 1024;
    const isValid = fileSizeKB > 1;
    const validationNote = isValid
      ? 'File looks valid. Pending admin verification.'
      : 'File appears empty or corrupt.';

    // memoryStorage (production) doesn't set filename/path — generate safe filename manually
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const generatedFilename = req.file.filename || `${Date.now()}-${safeName}`;

    const docRecord = {
      filename: generatedFilename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path || '', // empty string in production (memoryStorage)
      validated: isValid,
      validationNote,
    };

    student.documents.push(docRecord);

    // Mark docs uploaded if at least 2 documents uploaded
    if (student.documents.length >= 2) {
      student.completionFlags.documentsUploaded = true;
    }

    await student.save();

    // Notify student of successful upload
    await Notification.create({
      userId: req.user._id,
      title: '📄 Document Uploaded',
      message: `"${req.file.originalname}" has been uploaded successfully. ${validationNote}`,
      type: isValid ? 'success' : 'warning',
    });

    logger.info(`Document uploaded – User: ${req.user._id} – File: ${generatedFilename}`);

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully.',
      document: {
        id: student.documents[student.documents.length - 1]._id,
        originalName: req.file.originalname,
        size: req.file.size,
        validated: isValid,
        validationNote,
      },
      documentsCount: student.documents.length,
    });
  } catch (err) {
    logger.error(`Upload error: ${err.message}`);
    res.status(500).json({ success: false, message: 'File upload failed.' });
  }
};

/**
 * GET /api/upload/documents
 * Returns list of uploaded documents for the current student.
 */
const getDocuments = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id }).select('documents');
    if (!student) return res.status(404).json({ success: false, message: 'Profile not found.' });

    // Don't expose server file paths to client
    const safeDocuments = student.documents.map((doc) => ({
      id: doc._id,
      originalName: doc.originalName,
      mimetype: doc.mimetype,
      size: doc.size,
      validated: doc.validated,
      validationNote: doc.validationNote,
      uploadedAt: doc.uploadedAt,
    }));

    res.status(200).json({ success: true, documents: safeDocuments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch documents.' });
  }
};

module.exports = { upload, uploadDocument, getDocuments };
