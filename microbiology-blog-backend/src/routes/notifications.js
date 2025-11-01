const express = require('express');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
  subscribeToCategory,
  subscribeToAuthor
} = require('../controllers/notificationController');
const { auth } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');
const { apiLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Apply rate limiting and require authentication for all routes
router.use(apiLimiter);
router.use(auth);

// Notification management
router.get('/', validatePagination, getNotifications);
router.put('/:id/read', validateObjectId('id'), markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', validateObjectId('id'), deleteNotification);

// Preferences and subscriptions
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);
router.post('/subscribe/category', subscribeToCategory);
router.post('/subscribe/author', subscribeToAuthor);

module.exports = router;