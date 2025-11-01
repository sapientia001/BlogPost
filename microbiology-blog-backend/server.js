const app = require('./src/app');
const connectDB = require('./src/config/database');
const logger = require('./src/utils/logger');
const { cache } = require('./src/middleware/cache');

// Handle uncaught exceptions (synchronous errors)
process.on('uncaughtException', (error) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Initialize database connection
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info('✅ Database connection established');

    // Get port from environment or default
    const PORT = process.env.PORT || 5000;
    
    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
      logger.info(`📍 Port: ${PORT}`);
      logger.info(`🌐 URL: http://localhost:${PORT}`);
      logger.info(`📊 API Health: http://localhost:${PORT}/api/health`);
      logger.info(`📚 API Docs: http://localhost:${PORT}/api/docs`);
      
      //Log environment-specific information
      if (process.env.NODE_ENV === 'development') {
        logger.info('🔧 Development mode - Enhanced logging enabled');
      }
      
      if (process.env.NODE_ENV === 'production') {
        logger.info('🏭 Production mode - Optimized for performance');
      }
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (error) => {
      logger.error('UNHANDLED REJECTION! 💥 Shutting down...', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Gracefully close server
      server.close(() => {
        process.exit(1);
      });
    });

    // Graceful shutdown handler
    const gracefulShutdown = (signal) => {
      logger.info(`📞 ${signal} received. Starting graceful shutdown...`);
      
      // Stop accepting new requests
      server.close(async (err) => {
        if (err) {
          logger.error('Error during server close', { error: err.message });
          process.exit(1);
        }
        
        logger.info('✅ HTTP server closed');
        
        // Close database connection
        try {
          const mongoose = require('mongoose');
          await mongoose.connection.close();
          logger.info('✅ Database connection closed');
        } catch (dbError) {
          logger.error('Error closing database connection', { error: dbError.message });
        }
        
        // Clear cache
        try {
          cache.flushAll();
          logger.info('✅ Cache cleared');
        } catch (cacheError) {
          logger.error('Error clearing cache', { error: cacheError.message });
        }
        
        logger.info('👋 Graceful shutdown completed');
        process.exit(0);
      });
      
      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('🕒 Forcing shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    //Handle process warnings
    process.on('warning', (warning) => {
      logger.warn('Process Warning', {
        name: warning.name,
        message: warning.message,
        stack: warning.stack
      });
    });

    // Monitor server health
    const monitorServerHealth = () => {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      logger.debug('Server Health Check', {
        uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
        },
        cache: {
          keys: cache.keys().length,
          hits: cache.getStats().hits,
          misses: cache.getStats().misses
        }
      });
    };

    // Health check every 5 minutes in production
    if (process.env.NODE_ENV === 'production') {
      setInterval(monitorServerHealth, 5 * 60 * 1000);
    }

  } catch (error) {
    logger.error('❌ Failed to start server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

// Start the server
startServer();

// Export for testing purposes
// module.exports = app;