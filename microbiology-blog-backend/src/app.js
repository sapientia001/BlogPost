const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

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
  uploadRoutes,
} = require('./routes');

// Import middleware
const {
  errorHandler,
  notFoundHandler,
  applySecurityMiddleware,
  generalLimiter,
  apiLimiter
} = require('./middleware');

// Import logger
const logger = require('./utils/logger');

const app = express();

// Apply security middleware
applySecurityMiddleware(app);

// Apply general rate limiting
app.use(generalLimiter);

// Apply API rate limiting to all API routes
app.use('/api', apiLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: message => logger.info(message.trim()) }
  }));
}

// Health check route (exclude from some rate limiting if needed)
// Add this after your middleware and before your other routes

// Root endpoint - for health checks and general API info
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
      users: '/api/users'
    },
    message: 'Welcome to Microbiology Blog API Server'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Microbiology Blog API is running 🚀',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});


// API routes

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/uploads', uploadRoutes);

// API documentation route
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Microbiology Blog API Documentation',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'User login',
        'POST /api/auth/logout': 'User logout',
        'GET /api/auth/me': 'Get current user',
        'POST /api/auth/refresh-token': 'Refresh access token',
        'POST /api/auth/forgot-password': 'Request password reset',
        'POST /api/auth/reset-password': 'Reset password'
      },
      users: {
        'GET /api/users': 'Get all users (admin only)',
        'GET /api/users/:userId': 'Get user profile',
        'PUT /api/users/:userId': 'Update user profile',
        'DELETE /api/users/:userId': 'Delete user (admin only)',
        'GET /api/users/:userId/posts': 'Get user posts',
        'GET /api/users/search/users': 'Search users (admin only)',
        'GET /api/users/stats/overview': 'Get user statistics (admin only)'
      },
      posts: {
        'GET /api/posts': 'Get all posts with filters',
        'GET /api/posts/featured': 'Get featured posts',
        'GET /api/posts/popular': 'Get popular posts',
        'GET /api/posts/search': 'Search posts',
        'GET /api/posts/search/suggestions': 'Get search suggestions',
        'GET /api/posts/:postId': 'Get single post',
        'POST /api/posts': 'Create new post (researcher+)',
        'PUT /api/posts/:postId': 'Update post',
        'DELETE /api/posts/:postId': 'Delete post',
        'POST /api/posts/:postId/like': 'Like/unlike post',
        'POST /api/posts/:postId/view': 'Increment view count',
        'GET /api/posts/:postId/comments': 'Get post comments',
        'GET /api/posts/author/:authorId': 'Get posts by author',
        'GET /api/posts/:postId/related': 'Get related posts',
        'POST /api/posts/:postId/archive': 'Archive post',
        'POST /api/posts/:postId/unarchive': 'Unarchive post'
      },
      categories: {
        'GET /api/categories': 'Get all categories',
        'GET /api/categories/:categoryId': 'Get single category',
        'POST /api/categories': 'Create category (admin only)',
        'PUT /api/categories/:categoryId': 'Update category (admin only)',
        'DELETE /api/categories/:categoryId': 'Delete category (admin only)',
        'GET /api/categories/:categoryId/posts': 'Get posts by category'
      },
      comments: {
        'GET /api/comments/post/:postId': 'Get comments for post',
        'POST /api/comments/post/:postId': 'Create comment',
        'PUT /api/comments/:commentId': 'Update comment',
        'DELETE /api/comments/:commentId': 'Delete comment',
        'POST /api/comments/:commentId/like': 'Like comment',
        'POST /api/comments/:commentId/reply': 'Reply to comment',
        'GET /api/comments/': 'Get all comments (admin only)',
        'PUT /api/comments/:commentId/moderate': 'Moderate comment (admin only)'
      },
      analytics: {
        'GET /api/analytics/dashboard': 'Get dashboard stats (admin)',
        'GET /api/analytics/admin/dashboard': 'Get admin dashboard stats',
        'GET /api/analytics/researcher/dashboard': 'Get researcher dashboard',
        'GET /api/analytics/posts': 'Get post analytics (admin)',
        'GET /api/analytics/users': 'Get user analytics (admin)',
        'GET /api/analytics/engagement': 'Get engagement metrics (admin)',
        'GET /api/analytics/email-stats': 'Get email performance (admin)',
        'GET /api/analytics/export/:type': 'Export data (admin)'
      },
      uploads: {
        'POST /api/uploads/image': 'Upload image',
        'POST /api/uploads/document': 'Upload document',
        'DELETE /api/uploads/:publicId': 'Delete file'
      }
    },
    rateLimiting: {
      general: 'Applied to all routes',
      auth: 'Stricter limits for authentication',
      api: 'API-wide rate limiting'
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

module.exports = app;