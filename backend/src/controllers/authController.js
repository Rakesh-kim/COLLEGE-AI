const User = require('../models/User');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Generates a signed JWT token for the given user ID.
 */
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * POST /api/auth/register
 * Creates a new user (student role by default) + linked Student record.
 * Returns JWT token immediately after registration.
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    // Only allow admin creation if a secret header is provided (prevents self-promotion)
    const assignedRole = (role === 'admin' && req.headers['x-admin-secret'] === process.env.ADMIN_SECRET)
      ? 'admin'
      : 'student';

    // Check for duplicate email
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    // Create user (password hashed in pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: password,
      role: assignedRole,
    });

    // Create linked Student record (empty – filled via chatbot)
    if (assignedRole === 'student') {
      await Student.create({ userId: user._id });
    }

    // Welcome notification
    await Notification.create({
      userId: user._id,
      title: '👋 Welcome to Hostel AI!',
      message: 'Start chatting with our AI assistant to complete your hostel registration.',
      type: 'info',
    });

    logger.info(`New user registered: ${user.email} (${assignedRole})`);

    const token = signToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    logger.error(`Registration error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

/**
 * POST /api/auth/login
 * Validates credentials, handles brute-force lockout, returns JWT.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Fetch user WITH password (select: false means we must explicitly include it)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash +failedLoginAttempts +lockUntil');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Check lockout
    if (user.isLocked()) {
      logger.warn(`Locked account login attempt: ${email} – IP: ${req.ip}`);
      return res.status(403).json({ success: false, message: 'Account locked. Try again later.' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      // Lock after 5 failed attempts for 15 minutes
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        logger.warn(`Account locked after brute-force: ${email} – IP: ${req.ip}`);
      }
      await user.save({ validateBeforeSave: false });
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Success – reset failed attempts
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    logger.info(`User logged in: ${user.email} – IP: ${req.ip}`);

    const token = signToken(user._id);
    res.status(200).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile.
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch profile.' });
  }
};

module.exports = { register, login, getMe };
