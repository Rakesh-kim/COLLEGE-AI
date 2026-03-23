const logger = require('../utils/logger');

/**
 * Role-Based Access Control (RBAC) Middleware
 * Usage: requireRole('admin') or requireRole('student', 'admin')
 * Must be used AFTER the protect middleware so req.user is set.
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(
        `Forbidden role access – User: ${req.user._id} (${req.user.role}) tried to access ${req.method} ${req.originalUrl}`
      );
      return res.status(403).json({
        success: false,
        message: `Access forbidden. Required roles: ${roles.join(', ')}.`,
      });
    }

    next();
  };
};

module.exports = { requireRole };
