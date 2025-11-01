const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('./rateLimit');
const logger = require('../utils/logger');

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request from origin', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Headers'
  ]
};

// Security headers configuration
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

// HPP (HTTP Parameter Pollution) configuration
const hppOptions = {
  whitelist: [
    'category',
    'tags',
    'status',
    'featured',
    'sort',
    'page',
    'limit',
    'search'
  ]
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      user: req.user ? req.user.id : 'anonymous'
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });

  next();
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    });
  }
  
  next();
};

// Security audit middleware
const securityAudit = (req, res, next) => {
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+=/gi,
    /union.*select/gi,
    /insert.*into/gi,
    /drop.*table/gi,
    /--/g,
    /\/\*.*\*\//g
  ];

  const checkForSuspiciousContent = (obj) => {
    if (typeof obj === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(obj));
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(value => checkForSuspiciousContent(value));
    }
    return false;
  };

  const hasSuspiciousContent = 
    checkForSuspiciousContent(req.body) || 
    checkForSuspiciousContent(req.query) ||
    checkForSuspiciousContent(req.params);

  if (hasSuspiciousContent) {
    logger.warn('Suspicious content detected in request', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      user: req.user ? req.user.id : 'anonymous'
    });
    
    return res.status(400).json({
      success: false,
      message: 'Suspicious content detected'
    });
  }

  next();
};

// File upload security middleware
const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  // Check file type by magic numbers (first few bytes)
  const magicNumbers = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/gif': [0x47, 0x49, 0x46, 0x38],
    'image/webp': [0x52, 0x49, 0x46, 0x46],
    'application/pdf': [0x25, 0x50, 0x44, 0x46]
  };

  const buffer = req.file.buffer;
  const fileType = Object.keys(magicNumbers).find(type => {
    const magic = magicNumbers[type];
    return magic.every((byte, index) => buffer[index] === byte);
  });

  if (!fileType || fileType !== req.file.mimetype) {
    logger.warn('File type mismatch detected', {
      declaredType: req.file.mimetype,
      actualType: fileType,
      fileName: req.file.originalname,
      ip: req.ip
    });
    
    return res.status(400).json({
      success: false,
      message: 'File type validation failed'
    });
  }

  next();
};

// Rate limiting configuration per endpoint
const getRateLimitConfig = (endpoint) => {
  const configs = {
    '/api/auth': rateLimit.authLimiter,
    '/api/uploads': rateLimit.uploadLimiter,
    '/api/search': rateLimit.searchLimiter,
    '/api/comments': rateLimit.commentLimiter,
    default: rateLimit.apiLimiter
  };

  return configs[endpoint] || configs.default;
};

module.exports = {
  corsOptions,
  securityHeaders,
  hppOptions,
  requestLogger,
  sanitizeInput,
  securityAudit,
  validateFileUpload,
  getRateLimitConfig,
  
  // Export security middleware chain
  applySecurityMiddleware: (app) => {
    app.use(securityHeaders);
    app.use(cors(corsOptions));
    app.use(xss());
    app.use(hpp(hppOptions));
    app.use(mongoSanitize());
    app.use(requestLogger);
    app.use(sanitizeInput);
    app.use(securityAudit);
  }
};