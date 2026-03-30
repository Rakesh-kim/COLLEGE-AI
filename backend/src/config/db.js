const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Connects to MongoDB with retry logic.
 * Uses MONGO_URI from environment variables — never hardcode credentials.
 */
const connectDB = async () => {
  const atlasOrCustomUri = (process.env.MONGO_URI || '').trim();
  const localFallbackUri = (process.env.MONGO_URI_LOCAL || 'mongodb://127.0.0.1:27017/hostel_db').trim();
  const looksLikeTemplate =
    !atlasOrCustomUri ||
    atlasOrCustomUri.includes('<username>') ||
    atlasOrCustomUri.includes('<password>') ||
    atlasOrCustomUri.includes('...your Atlas URI...');

  // Use local fallback only when MONGO_URI looks like a placeholder/unconfigured value.
  // Otherwise (real Atlas or real custom Mongo URI) use it directly.
  const preferredUri = looksLikeTemplate ? localFallbackUri : atlasOrCustomUri;

  const MAX_RETRIES = 5;
  let attempt = 0;
  const isProd = process.env.NODE_ENV === 'production';
  const allowInMemory = process.env.USE_IN_MEMORY_MONGO === 'true' || !isProd;

  while (attempt < MAX_RETRIES) {
    try {
      const conn = await mongoose.connect(preferredUri, {
        // Modern Mongoose does not need these, but kept for clarity
        serverSelectionTimeoutMS: 5000,
      });
      logger.info(`MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      attempt++;
      // In dev we may fall back to an in-memory MongoDB; avoid noisy "error" logs.
      const logFn = allowInMemory ? logger.warn : logger.error;
      logFn(`MongoDB connection attempt ${attempt} failed: ${err.message}`);
      // Exponential back-off
      await new Promise((r) => setTimeout(r, 2 ** attempt * 500));
    }
  }

  // Dev fallback: use an in-memory MongoDB if available (so website can work).
  // This avoids hard-failing startup when MongoDB isn't installed locally.
  if (!isProd && allowInMemory) {
    try {
      logger.warn('MongoDB unreachable. Starting in-memory MongoDB (dev fallback).');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const memoryServer = await MongoMemoryServer.create();
      const uri = memoryServer.getUri();
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      logger.info(`In-memory MongoDB connected: ${uri}`);
      return;
    } catch (fallbackErr) {
      logger.error(`In-memory MongoDB fallback failed: ${fallbackErr.message}`);
    }
  }

  logger.error('Max retries reached. MongoDB connection could not be established.');
  // In production we must not start the API without a working DB.
  // In dev, failing fast is also better than returning 500s for every request.
  throw new Error('MongoDB connection failed.');
};

module.exports = connectDB;
