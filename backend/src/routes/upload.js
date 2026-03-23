const express = require('express');
const router = express.Router();
const { upload, uploadDocument, getDocuments } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.post('/', protect, requireRole('student'), upload.single('document'), uploadDocument);
router.get('/documents', protect, requireRole('student'), getDocuments);

module.exports = router;
