const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * JWT Authentication Middleware
 * Verifies Bearer token, attaches decoded user to req.user.
 * Logs suspicious activity (missing/invalid tokens).
 */
const protect = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn(`Unauthorized access attempt – no token – IP: ${req.ip} – ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify token signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      logger.warn(`Invalid token – IP: ${req.ip} – ${err.message}`);
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }

    // 3. Check user still exists in DB (handles deleted/banned accounts)
    const user = await User.findById(decoded.id).select('_id name email role');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    // 4. Check account lockout
    if (user.isLocked && user.isLocked()) {
      return res.status(403).json({ success: false, message: 'Account temporarily locked.' });
    }

    req.user = user;
    next();
  } catch (err) {
    logger.error(`Auth middleware error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Server error during authentication.' });
  }
};

module.exports = { protect };
