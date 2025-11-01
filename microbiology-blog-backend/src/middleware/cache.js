const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// Create cache instance with default TTL of 10 minutes
const cache = new NodeCache({
  stdTTL: 600, // 10 minutes
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false // Better performance
});

// Cache middleware
const cacheMiddleware = (duration = 300) => { // Default 5 minutes
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key based on URL and query parameters
    const key = `${req.originalUrl}`;
    
    // Check if data exists in cache
    const cachedData = cache.get(key);
    
    if (cachedData) {
      logger.debug('Cache hit', { key });
      return res.json(cachedData);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, data, duration);
        logger.debug('Response cached', { key, duration });
      }
      
      originalJson.call(this, data);
    };

    next();
  };
};

// Clear cache for specific key pattern
const clearCache = (keyPattern) => {
  const keys = cache.keys();
  const keysToDelete = keys.filter(key => key.includes(keyPattern));
  
  if (keysToDelete.length > 0) {
    cache.del(keysToDelete);
    logger.info('Cache cleared', { pattern: keyPattern, keysDeleted: keysToDelete.length });
  }
};

// Cache stats middleware
const cacheStats = (req, res, next) => {
  if (req.path === '/api/cache/stats' && req.user?.role === 'admin') {
    const stats = cache.getStats();
    return res.json({
      success: true,
      data: {
        hits: stats.hits,
        misses: stats.misses,
        keys: stats.keys,
        ksize: stats.ksize,
        vsize: stats.vsize
      }
    });
  }
  next();
};

// Cache invalidation middleware for specific routes
const invalidateCache = (keyPatterns) => {
  return (req, res, next) => {
    // Store the original send method
    const originalSend = res.send;
    
    res.send = function(data) {
      // Invalidate cache after successful non-GET requests
      if (req.method !== 'GET' && res.statusCode >= 200 && res.statusCode < 300) {
        keyPatterns.forEach(pattern => {
          clearCache(pattern);
        });
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  cache,
  cacheMiddleware,
  clearCache,
  cacheStats,
  invalidateCache
};