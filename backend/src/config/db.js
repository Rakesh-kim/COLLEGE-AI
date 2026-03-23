const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Connects to MongoDB with retry logic.
 * Uses MONGO_URI from environment variables — never hardcode credentials.
 */
const connectDB = async () => {
  const MAX_RETRIES = 5;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        // Modern Mongoose does not need these, but kept for clarity
        serverSelectionTimeoutMS: 5000,
      });
      logger.info(`MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      attempt++;
      logger.error(`MongoDB connection attempt ${attempt} failed: ${err.message}`);
      if (attempt >= MAX_RETRIES) {
        logger.error('Max retries reached. Exiting.');
        process.exit(1);
      }
      // Exponential back-off
      await new Promise((r) => setTimeout(r, 2 ** attempt * 500));
    }
  }
};

module.exports = connectDB;
