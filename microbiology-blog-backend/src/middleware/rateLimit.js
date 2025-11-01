const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// General rate limiter for all requests
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 100, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(options.statusCode).json(options.message);
  }
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res, next, options) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(options.statusCode).json(options.message);
  }
});

// Rate limiter for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: {
    success: false,
    message: 'Too many API requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('API rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(options.statusCode).json(options.message);
  }
});

// Rate limiter for file uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 file uploads per hour
  message: {
    success: false,
    message: 'Too many file uploads from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('Upload rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(options.statusCode).json(options.message);
  }
});

// Rate limiter for search endpoints
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 search requests per minute
  message: {
    success: false,
    message: 'Too many search requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('Search rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(options.statusCode).json(options.message);
  }
});

// Rate limiter for comment creation
const commentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // Limit each IP to 50 comments per 10 minutes
  message: {
    success: false,
    message: 'Too many comments from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('Comment rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(options.statusCode).json(options.message);
  }
});

// Dynamic rate limiting based on user role
const createRoleBasedLimiter = (defaultMax, roleLimits = {}) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req) => {
      if (req.user) {
        return roleLimits[req.user.role] || defaultMax;
      }
      return defaultMax;
    },
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.user ? `${req.user.id}-${req.ip}` : req.ip;
    }
  });
};

// Admin users get higher limits
const roleBasedLimiter = createRoleBasedLimiter(100, {
  reader: 100,
  researcher: 500,
  admin: 2000
});

module.exports = {
  generalLimiter,
  authLimiter,
  apiLimiter,
  uploadLimiter,
  searchLimiter,
  commentLimiter,
  roleBasedLimiter
};
