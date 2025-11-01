const express = require('express');
const {
  getBookmarks,
  addBookmark,
  removeBookmark,
  checkBookmark
} = require('../controllers/bookmarkController');
const { auth } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');
const { apiLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Apply rate limiting and require authentication for all routes
router.use(apiLimiter);
router.use(auth);

// Bookmark management routes
router.get('/', validatePagination, getBookmarks);
router.post('/', addBookmark);
router.delete('/:postId', validateObjectId('postId'), removeBookmark);
router.get('/:postId/check', validateObjectId('postId'), checkBookmark);

module.exports = router;