const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// Create cache instance with default TTL of 10 minutes
const cache = new NodeCache({
  stdTTL: 600, // 10 minutes
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false, // Better performance
  deleteOnExpire: true // Automatically delete expired keys
});

// Cache middleware
const cacheMiddleware = (duration = 300) => { // Default 5 minutes
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip cache for authenticated users if needed (optional)
    if (req.user && req.query.noCache) {
      logger.debug('Cache bypassed for authenticated user with noCache flag');
      return next();
    }

    // Generate cache key based on URL, method, and user context
    const userPrefix = req.user ? `user:${req.user.id}:` : 'guest:';
    const key = `${userPrefix}${req.method}:${req.originalUrl}`;
    
    // Check if data exists in cache
    const cachedData = cache.get(key);
    
    if (cachedData !== undefined) {
      logger.debug('Cache hit', { 
        key: key.substring(0, 50) + (key.length > 50 ? '...' : ''),
        hits: cache.getStats().hits 
      });
      return res.json(cachedData);
    }

    // Store original json method
    const originalJson = res.json;
    
    // Override res.json to cache the response
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          cache.set(key, data, duration);
          logger.debug('Response cached', { 
            key: key.substring(0, 50) + (key.length > 50 ? '...' : ''),
            duration,
            size: JSON.stringify(data).length 
          });
        } catch (error) {
          logger.warn('Failed to cache response', { 
            error: error.message,
            key: key.substring(0, 50) + (key.length > 50 ? '...' : '')
          });
        }
      }
      
      // Restore original method and call it
      res.json = originalJson;
      return res.json(data);
    };

    next();
  };
};

// Clear cache for specific key pattern
const clearCache = (keyPattern) => {
  try {
    const keys = cache.keys();
    const keysToDelete = keys.filter(key => key.includes(keyPattern));
    
    if (keysToDelete.length > 0) {
      const deletedCount = cache.del(keysToDelete);
      logger.info('Cache cleared', { 
        pattern: keyPattern, 
        keysFound: keysToDelete.length,
        keysDeleted: deletedCount
      });
      return deletedCount;
    }
    
    logger.debug('No cache keys found to clear', { pattern: keyPattern });
    return 0;
  } catch (error) {
    logger.error('Error clearing cache', { 
      pattern: keyPattern, 
      error: error.message 
    });
    return 0;
  }
};

// Clear entire cache (use with caution)
const clearAllCache = () => {
  try {
    cache.flushAll();
    logger.info('Entire cache cleared');
    return true;
  } catch (error) {
    logger.error('Error clearing all cache', { error: error.message });
    return false;
  }
};

// Get cache statistics
const getCacheStats = () => {
  return {
    ...cache.getStats(),
    keys: cache.keys().length
  };
};

// Cache stats middleware
const cacheStats = (req, res, next) => {
  if (req.path === '/api/cache/stats') {
    // Enhanced permission check
    if (!req.user?.role || !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const stats = getCacheStats();
    return res.json({
      success: true,
      data: {
        hits: stats.hits,
        misses: stats.misses,
        keys: stats.keys,
        ksize: stats.ksize,
        vsize: stats.vsize,
        hitRate: stats.hits / (stats.hits + stats.misses) || 0
      },
      performance: {
        hitRate: `${((stats.hits / (stats.hits + stats.misses)) * 100 || 0).toFixed(2)}%`,
        totalRequests: stats.hits + stats.misses
      }
    });
  }
  next();
};

// Cache invalidation middleware for specific routes
const invalidateCache = (keyPatterns = []) => {
  return (req, res, next) => {
    // Store the original send method
    const originalSend = res.send;
    
    res.send = function(data) {
      // Invalidate cache after successful non-GET requests
      if (req.method !== 'GET' && res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const patterns = Array.isArray(keyPatterns) ? keyPatterns : [keyPatterns];
          let totalDeleted = 0;
          
          patterns.forEach(pattern => {
            totalDeleted += clearCache(pattern);
          });
          
          if (totalDeleted > 0) {
            logger.debug('Cache invalidated after mutation', { 
              patterns: patterns.join(', '),
              keysDeleted: totalDeleted 
            });
          }
        } catch (error) {
          logger.error('Error invalidating cache', { error: error.message });
        }
      }
      
      // Restore original method
      res.send = originalSend;
      return res.send(data);
    };
    
    next();
  };
};

// Health check for cache
const cacheHealth = () => {
  try {
    // Test cache functionality
    const testKey = 'health-check';
    const testValue = { timestamp: Date.now() };
    
    cache.set(testKey, testValue, 1); // 1 second TTL
    const retrieved = cache.get(testKey);
    cache.del(testKey);
    
    return {
      status: 'healthy',
      stats: getCacheStats(),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = {
  cache,
  cacheMiddleware,
  clearCache,
  clearAllCache,
  cacheStats,
  invalidateCache,
  getCacheStats,
  cacheHealth
};