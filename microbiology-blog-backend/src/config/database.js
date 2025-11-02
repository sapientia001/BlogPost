const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  // Validate environment variable
  if (!process.env.MONGODB_URI) {
    logger.error('❌ MONGODB_URI environment variable is required');
    process.exit(1);
  }

  try {
    // Set up event listeners BEFORE connecting
    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('✅ MongoDB reconnected');
    });

    mongoose.connection.on('connected', () => {
      logger.info('✅ MongoDB connected');
    });

    // Connect to database with optimized options
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0
    });

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    logger.info(`📊 Database Name: ${conn.connection.name}`);

    return conn;

  } catch (error) {
    logger.error('❌ Database connection failed:', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

module.exports = connectDB;