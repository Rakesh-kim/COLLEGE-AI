require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./src/config/db');
const logger = require('./src/utils/logger');
const { sanitizeInputs } = require('./src/middleware/sanitize');

// Route imports
const authRoutes = require('./src/routes/auth');
const chatRoutes = require('./src/routes/chat');
const uploadRoutes = require('./src/routes/upload');
const studentRoutes = require('./src/routes/student');
const adminRoutes = require('./src/routes/admin');

// ============================================
//  Security & Middleware Setup
// ============================================
const app = express();

// 1. Helmet — sets secure HTTP headers (prevents clickjacking, MIME sniffing, etc.)
app.use(helmet());

// 2. CORS — only allow configured origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// 3. Rate Limiting — prevent brute force and DoS
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // Stricter for auth endpoints
  message: { success: false, message: 'Too many auth attempts. Please try again in 15 minutes.' },
});

app.use(globalLimiter);

// 4. Body parsing (with size limits to prevent payload attacks)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 5. Input sanitization (NoSQL injection + XSS protection)
app.use(...sanitizeInputs);

// 6. HTTP Request logging (morgan streams through winston)
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// ============================================
//  Routes
// ============================================
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint (useful for deployment monitors)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
//  Global Error Handler
// ============================================
app.use((err, req, res, next) => {
  // Multer file size/type errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: `File too large. Max size is ${process.env.MAX_FILE_SIZE_MB || 10}MB.` });
  }
  if (err.message && err.message.includes('Only PDF')) {
    return res.status(415).json({ success: false, message: err.message });
  }
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'CORS error: Origin not allowed.' });
  }

  logger.error(`Unhandled error: ${err.message} | Stack: ${err.stack}`);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'An internal server error occurred.' : err.message,
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ============================================
//  Start Server
// ============================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();

module.exports = app;
