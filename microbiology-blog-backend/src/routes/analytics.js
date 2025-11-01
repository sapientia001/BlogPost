const express = require('express');
const {
  getDashboardStats,
  getPostAnalytics,
  getUserAnalytics,
  getEngagementMetrics,
  getEmailStats,
  exportData,
  getResearcherDashboard,
  getAdminDashboard // ADD THIS IMPORT
} = require('../controllers/analyticsController');
const { auth, adminAuth, researcherAuth } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const { apiLimiter } = require('../middleware/rateLimit');
const { cacheMiddleware } = require('../middleware/cache');

const router = express.Router();

// Apply rate limiting for all routes
router.use(apiLimiter);

// Researcher dashboard route (researcher access only)
router.get('/researcher/dashboard', auth, researcherAuth, getResearcherDashboard);

// Admin analytics routes (require admin authentication)
router.use(auth);
router.use(adminAuth);

// Analytics routes
router.get('/dashboard', cacheMiddleware(900), getAdminDashboard); // CHANGE TO getAdminDashboard
router.get('/stats', cacheMiddleware(900), getDashboardStats); // KEEP original for other uses
router.get('/posts', getPostAnalytics);
router.get('/users', cacheMiddleware(1800), getUserAnalytics);
router.get('/engagement', getEngagementMetrics);
router.get('/email-stats', getEmailStats);
router.get('/export/:type', exportData);

module.exports = router;