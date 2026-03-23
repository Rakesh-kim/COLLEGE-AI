const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');

/**
 * Input Sanitization Middleware Stack
 *
 * 1. express-mongo-sanitize: Strips MongoDB operators ($, .) from req.body / req.params / req.query
 *    to prevent NoSQL injection attacks.
 * 2. xss-clean: Sanitizes user input to prevent Cross-Site Scripting (XSS) attacks
 *    by escaping HTML in request body, query, and params.
 *
 * Apply these early in the middleware stack, before any route handlers.
 */
const sanitizeInputs = [
  mongoSanitize({
    replaceWith: '_', // Replace forbidden chars instead of removing
    onSanitize: ({ req, key }) => {
      console.warn(`Sanitized dangerous key [${key}] from IP ${req.ip}`);
    },
  }),
  xssClean(),
];

module.exports = { sanitizeInputs };
