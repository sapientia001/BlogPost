const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updateUserRole,
  updateUserStatus,
  getUserPosts,
  getCurrentUser,
  updateUserPreferences,
  searchUsers,
  getUserStats,
  getUserById
} = require('../controllers/userController');
const { auth, adminAuth } = require('../middleware/auth');
const uploadService = require('../services/uploadService');
const { validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Configure multer for file uploads
const upload = uploadService.getMulterConfig('avatars');

// ==================== PUBLIC ROUTES ====================

// Get user profile by ID
router.get('/:userId', validateObjectId('userId'), getUser);

// Get user posts
router.get('/:userId/posts', validateObjectId('userId'), validatePagination, getUserPosts);

// ==================== AUTHENTICATED ROUTES ====================

// Get current user profile (requires authentication)
router.get('/profile/me', auth, getCurrentUser);

// Update current user profile (authenticated users can update their own profile)
router.put('/profile/me', auth, upload.single('avatar'), (req, res, next) => {
  // Add the current user's ID to params for the controller
  req.params.userId = req.user.id;
  next();
}, updateUser);

// Update current user preferences
router.put('/profile/me/preferences', auth, (req, res, next) => {
  // Add the current user's ID to params for the controller
  req.params.userId = req.user.id;
  next();
}, updateUserPreferences);

// ==================== ADMIN-ONLY ROUTES ====================

// Get all users (admin only)
router.get('/', auth, adminAuth, validatePagination, getUsers);

// Search users (admin only)
router.get('/search/users', auth, adminAuth, searchUsers);

// Get user statistics (admin only)
router.get('/stats/overview', auth, adminAuth, getUserStats);

// Update user by ID (admin can update any user)
router.put('/:userId', auth, adminAuth, validateObjectId('userId'), upload.single('avatar'), updateUser);

// Delete user (admin only)
router.delete('/:userId', auth, adminAuth, validateObjectId('userId'), deleteUser);

// Update user role (admin only)
router.put('/:userId/role', auth, adminAuth, validateObjectId('userId'), updateUserRole);

// Update user status (admin only)
router.put('/:userId/status', auth, adminAuth, validateObjectId('userId'), updateUserStatus);

module.exports = router;