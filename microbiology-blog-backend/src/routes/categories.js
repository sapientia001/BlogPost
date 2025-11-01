const express = require('express');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryPosts,
  getCategoryBySlug,
  searchCategories
} = require('../controllers/categoryController');
const { auth, adminAuth } = require('../middleware/auth');
const {
  validateCategoryCreation,
  validateObjectId,
  validatePagination
} = require('../middleware/validation');
const { apiLimiter } = require('../middleware/rateLimit');
const { cacheMiddleware } = require('../middleware/cache');

const router = express.Router();

// Apply rate limiting
router.use(apiLimiter);

// Public routes
router.get('/', cacheMiddleware(1800), getCategories);
router.get('/search', cacheMiddleware(900), searchCategories);
router.get('/slug/:slug', cacheMiddleware(1800), getCategoryBySlug);
router.get('/:categoryId', validateObjectId('categoryId'), getCategory);
router.get('/:categoryId/posts', validateObjectId('categoryId'), validatePagination, getCategoryPosts);

// Protected routes (admin only)
router.post('/', auth, adminAuth, validateCategoryCreation, createCategory);
router.put('/:categoryId', auth, adminAuth, validateObjectId('categoryId'), updateCategory);
router.delete('/:categoryId', auth, adminAuth, validateObjectId('categoryId'), deleteCategory);

module.exports = router;