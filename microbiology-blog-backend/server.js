// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// Import routes
const {
  authRoutes,
  userRoutes,
  postRoutes,
  categoryRoutes,
  commentRoutes,
  bookmarkRoutes,
  notificationRoutes,
  analyticsRoutes,
  uploadRoutes
} = require('./routes');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');
const { authenticate } = require('./middleware/auth');
const { cache } = require('./middleware/cache');
const logger = require('./utils/logger');

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - FIXED: Using CLIENT_URL instead of FRONTEND_URL
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Compression
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) }
  }));
}

// Static files
app.use('/uploads', express.static('uploads'));

// Root endpoint - for health checks
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'Microbiology Blog API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    endpoints: {
      health: '/api/health',
      documentation: '/api/docs',
      authentication: '/api/auth',
      posts: '/api/posts',
      categories: '/api/categories',
      users: '/api/users',
      comments: '/api/comments',
      uploads: '/api/uploads'
    },
    message: 'Welcome to Microbiology Blog API Server'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  };
  
  res.status(200).json(healthCheck);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/bookmarks', authenticate, bookmarkRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);
app.use('/api/analytics', authenticate, analyticsRoutes);
app.use('/api/uploads', uploadRoutes);

// API Documentation
try {
  const swaggerDocument = YAML.load('./swagger.yaml');
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (error) {
  logger.warn('Swagger documentation not found. Running without API docs.');
}

// 404 handler for unmatched routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Export the app
module.exports = app;