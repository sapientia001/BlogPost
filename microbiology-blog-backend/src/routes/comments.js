const express = require('express');
const {
  getPostComments,
  createComment,
  updateComment,
  deleteComment,
  toggleLike,
  replyToComment,
  getAllComments,
  moderateComment
} = require('../controllers/commentController');
const { auth, adminAuth } = require('../middleware/auth');
const {
  validateCommentCreation,
  validateObjectId,
  validatePagination
} = require('../middleware/validation');
const { commentLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Apply rate limiting
router.use(commentLimiter);

// Public routes - FIXED: Remove validateObjectId to handle both ID and slug
router.get('/post/:postIdentifier', validatePagination, getPostComments);

// Protected routes - FIXED: Remove validateObjectId for post routes
router.post('/post/:postIdentifier', auth, validateCommentCreation, createComment);
router.put('/:commentId', auth, validateObjectId('commentId'), validateCommentCreation, updateComment);
router.delete('/:commentId', auth, validateObjectId('commentId'), deleteComment);
router.post('/:commentId/like', auth, validateObjectId('commentId'), toggleLike);
router.post('/:commentId/reply', auth, validateObjectId('commentId'), validateCommentCreation, replyToComment);

// Admin only routes
router.get('/', auth, adminAuth, validatePagination, getAllComments);
router.put('/:commentId/moderate', auth, adminAuth, validateObjectId('commentId'), moderateComment);

module.exports = router;