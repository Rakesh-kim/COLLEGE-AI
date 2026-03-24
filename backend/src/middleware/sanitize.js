const mongoSanitize = require('express-mongo-sanitize');

/**
 * Input Sanitization Middleware Stack
 *
 * 1. express-mongo-sanitize: Strips MongoDB operators ($, .) from req.body / req.params / req.query
 *    to prevent NoSQL injection attacks.
 * 2. manualXssSanitize: Manually escapes HTML characters from string fields in req.body
 *    to prevent XSS attacks. (xss-clean is abandoned and broken on Node 18+)
 */

/**
 * Recursively escape HTML special characters in all string values of an object.
 */
function escapeHtml(val) {
  if (typeof val === 'string') {
    return val
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const sanitized = {};
    for (const key of Object.keys(val)) sanitized[key] = escapeHtml(val[key]);
    return sanitized;
  }
  if (Array.isArray(val)) return val.map(escapeHtml);
  return val;
}

function manualXssSanitize(req, res, next) {
  if (req.body) req.body = escapeHtml(req.body);
  next();
}

// Export as a single middleware that chains both — use app.use(sanitizeInputs) safely
const sanitizeInputs = [
  mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`Sanitized dangerous key [${key}] from IP ${req.ip}`);
    },
  }),
  manualXssSanitize,
];

module.exports = { sanitizeInputs };
