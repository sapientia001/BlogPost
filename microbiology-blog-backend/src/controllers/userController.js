const User = require('../models/User');
const Post = require('../models/Post');
const AvatarService = require('../services/avatarService');
const { validateProfileUpdate } = require('../utils/validators');
const logger = require('../utils/logger');

// Standardized response helper
const sendSuccessResponse = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
    ...(data && { data })
  };
  return res.status(statusCode).json(response);
};

const sendErrorResponse = (res, message, error = null, statusCode = 500) => {
  const response = {
    success: false,
    message,
    ...(error && { error: error.message || error })
  };
  return res.status(statusCode).json(response);
};

// Standardized user object formatter
const formatUserResponse = (user) => ({
  id: user._id,
  _id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  bio: user.bio,
  institution: user.institution,
  specialization: user.specialization,
  preferences: user.preferences,
  status: user.status,
  emailVerified: user.emailVerified,
  lastActive: user.lastActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const userController = {
  // Get all users (admin only)
  getUsers: async (req, res) => {
    try {
      const { page = 1, limit = 10, role, status, search } = req.query;
      
      const query = {};
      if (role) query.role = role;
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        select: '-password'
      };

      const users = await User.paginate(query, options);

      // Format response data
      const responseData = {
        users: users.docs.map(user => formatUserResponse(user)),
        pagination: {
          total: users.totalDocs,
          limit: users.limit,
          page: users.page,
          pages: users.totalPages,
          hasNext: users.hasNextPage,
          hasPrev: users.hasPrevPage
        },
        filters: {
          role: role || null,
          status: status || null,
          search: search || null
        }
      };

      return sendSuccessResponse(res, 'Users retrieved successfully', responseData);

    } catch (error) {
      logger.error('Error fetching users', { error: error.message, stack: error.stack });
      return sendErrorResponse(res, 'Error fetching users', error.message, 500);
    }
  },

  // Get user profile
  getUser: async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId)
        .select('-password')
        .populate('preferences.subscribedCategories', 'name slug')
        .populate('preferences.subscribedAuthors', 'firstName lastName avatar');

      if (!user) {
        return sendErrorResponse(res, 'User not found', null, 404);
      }

      const responseData = {
        user: formatUserResponse(user)
      };

      return sendSuccessResponse(res, 'User profile retrieved successfully', responseData);

    } catch (error) {
      logger.error('Error fetching user', { userId, error: error.message, stack: error.stack });
      return sendErrorResponse(res, 'Error fetching user', error.message, 500);
    }
  },

  // Update user profile
  updateUser: async (req, res) => {
    let avatarResult = null;
    
    try {
      const { userId } = req.params;
      let updateData = { ...req.body };

      // Check if user is updating their own profile or is admin
      if (req.user && (userId !== req.user.id && req.user.role !== 'admin')) {
        return sendErrorResponse(res, 'Not authorized to update this user', null, 403);
      }

      // Get current user
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        return sendErrorResponse(res, 'User not found', null, 404);
      }

      // Validate avatar file if provided
      if (req.file) {
        const fileValidation = AvatarService.validateAvatarFile(req.file);
        if (!fileValidation.isValid) {
          return sendErrorResponse(res, fileValidation.error, null, 400);
        }
      }

      // Process avatar upload if file provided
      if (req.file) {
        avatarResult = await AvatarService.processAvatarUpdate(req, currentUser);
        if (!avatarResult.success) {
          return sendErrorResponse(res, 'Avatar upload failed', avatarResult.error, 400);
        }
        
        // Set the new avatar URL
        if (avatarResult.avatarUrl) {
          updateData.avatar = avatarResult.avatarUrl;
        }
      }

      // Normalize avatar data from request body
      updateData = AvatarService.normalizeAvatarData(updateData);

      // Remove sensitive fields that shouldn't be updated through this route
      delete updateData.password;
      delete updateData.email;

      // ONLY ADMIN CAN UPDATE ROLE AND STATUS
      if (req.user && req.user.role !== 'admin') {
        delete updateData.role;
        delete updateData.status;
      }

      // Handle specialization array conversion
      if (updateData.specialization) {
        if (typeof updateData.specialization === 'string') {
          try {
            updateData.specialization = JSON.parse(updateData.specialization);
          } catch (e) {
            updateData.specialization = updateData.specialization.split(',').map(s => s.trim()).filter(s => s);
          }
        }
        
        if (!Array.isArray(updateData.specialization)) {
          updateData.specialization = [updateData.specialization].filter(s => s);
        }
      }

      // Validate input
      const validation = validateProfileUpdate(updateData);
      if (!validation.isValid) {
        logger.error('Validation failed for user update', {
          userId,
          errors: validation.errors
        });
        
        // Clean up uploaded avatar if validation fails
        if (avatarResult && avatarResult.uploadedAvatarUrl) {
          await AvatarService.cleanupUploadedAvatar(avatarResult.uploadedAvatarUrl);
        }

        return sendErrorResponse(res, 'Validation failed', validation.errors, 400);
      }

      // Update user fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && updateData[key] !== null) {
          currentUser[key] = updateData[key];
        }
      });

      // Save the user document
      await currentUser.save();
      
      // Get the fresh updated user from database
      const updatedUser = await User.findById(userId)
        .select('-password')
        .populate('preferences.subscribedCategories', 'name slug')
        .populate('preferences.subscribedAuthors', 'firstName lastName avatar');

      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user');
      }

      logger.info('User updated successfully', { userId });

      // Clean up old avatar if a new one was uploaded and old one exists
      if (avatarResult && 
          avatarResult.uploadedAvatarUrl && 
          avatarResult.oldAvatarUrl && 
          avatarResult.oldAvatarUrl !== avatarResult.uploadedAvatarUrl) {
        await AvatarService.deleteOldAvatar(avatarResult.oldAvatarUrl);
      }

      const responseData = {
        user: formatUserResponse(updatedUser)
      };

      return sendSuccessResponse(res, 'User updated successfully', responseData);

    } catch (error) {
      logger.error('Error updating user', { 
        userId: req.params.userId, 
        error: error.message,
        stack: error.stack
      });
      
      // Clean up uploaded avatar if any error occurs
      if (avatarResult && avatarResult.uploadedAvatarUrl) {
        await AvatarService.cleanupUploadedAvatar(avatarResult.uploadedAvatarUrl);
      }
      
      return sendErrorResponse(res, 'Error updating user', error.message, 500);
    }
  },

  // Delete user (admin only)
  deleteUser: async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);

      if (!user) {
        return sendErrorResponse(res, 'User not found', null, 404);
      }

      // Prevent users from deleting themselves
      if (req.user && userId === req.user.id) {
        return sendErrorResponse(res, 'Cannot delete your own account', null, 400);
      }

      // Delete user's avatar from Cloudinary if exists
      await AvatarService.handleUserDeletion(user);

      await User.findByIdAndDelete(userId);

      logger.info('User deleted successfully', { userId });

      return sendSuccessResponse(res, 'User deleted successfully');

    } catch (error) {
      logger.error('Error deleting user', { userId, error: error.message, stack: error.stack });
      return sendErrorResponse(res, 'Error deleting user', error.message, 500);
    }
  },

  // Update user role (admin only)
  updateUserRole: async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!['reader', 'researcher', 'admin'].includes(role)) {
        return sendErrorResponse(res, 'Invalid role', null, 400);
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true }
      ).select('-password');

      if (!user) {
        return sendErrorResponse(res, 'User not found', null, 404);
      }

      const responseData = {
        user: formatUserResponse(user)
      };

      return sendSuccessResponse(res, 'User role updated successfully', responseData);

    } catch (error) {
      logger.error('Error updating user role', { userId, error: error.message, stack: error.stack });
      return sendErrorResponse(res, 'Error updating user role', error.message, 500);
    }
  },

  // Update user status (admin only)
  updateUserStatus: async (req, res) => {
    try {
      const { userId } = req.params;
      const { status } = req.body;

      if (!['active', 'pending', 'suspended'].includes(status)) {
        return sendErrorResponse(res, 'Invalid status', null, 400);
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { status },
        { new: true }
      ).select('-password');

      if (!user) {
        return sendErrorResponse(res, 'User not found', null, 404);
      }

      const responseData = {
        user: formatUserResponse(user)
      };

      return sendSuccessResponse(res, 'User status updated successfully', responseData);

    } catch (error) {
      logger.error('Error updating user status', { userId, error: error.message, stack: error.stack });
      return sendErrorResponse(res, 'Error updating user status', error.message, 500);
    }
  },

  // Get user's posts
  getUserPosts: async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10, status } = req.query;

      const user = await User.findById(userId);
      if (!user) {
        return sendErrorResponse(res, 'User not found', null, 404);
      }

      const query = { author: userId };
      if (status) query.status = status;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        populate: [
          { path: 'category', select: 'name slug' },
          { path: 'author', select: 'firstName lastName avatar' }
        ]
      };

      const posts = await Post.paginate(query, options);

      const responseData = {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar
        },
        posts: posts.docs,
        pagination: {
          total: posts.totalDocs,
          limit: posts.limit,
          page: posts.page,
          pages: posts.totalPages,
          hasNext: posts.hasNextPage,
          hasPrev: posts.hasPrevPage
        }
      };

      return sendSuccessResponse(res, 'User posts retrieved successfully', responseData);

    } catch (error) {
      logger.error('Error fetching user posts', { userId, error: error.message, stack: error.stack });
      return sendErrorResponse(res, 'Error fetching user posts', error.message, 500);
    }
  },

  // Get current user profile
  getCurrentUser: async (req, res) => {
    try {
      if (!req.user) {
        return sendErrorResponse(res, 'Not authenticated', null, 401);
      }

      const user = await User.findById(req.user.id)
        .select('-password')
        .populate('preferences.subscribedCategories', 'name slug')
        .populate('preferences.subscribedAuthors', 'firstName lastName avatar');

      if (!user) {
        return sendErrorResponse(res, 'User not found', null, 404);
      }

      const responseData = {
        user: formatUserResponse(user)
      };

      return sendSuccessResponse(res, 'Current user profile retrieved successfully', responseData);

    } catch (error) {
      logger.error('Error fetching current user', { userId: req.user?.id, error: error.message, stack: error.stack });
      return sendErrorResponse(res, 'Error fetching user profile', error.message, 500);
    }
  },

  // Get user by ID
  getUserById: async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId)
        .select('-password')
        .populate('preferences.subscribedCategories', 'name slug')
        .populate('preferences.subscribedAuthors', 'firstName lastName avatar');

      if (!user) {
        return sendErrorResponse(res, 'User not found', null, 404);
      }

      const responseData = {
        user: formatUserResponse(user)
      };

      return sendSuccessResponse(res, 'User retrieved successfully', responseData);

    } catch (error) {
      logger.error('Error fetching user by ID', { userId, error: error.message, stack: error.stack });
      return sendErrorResponse(res, 'Error fetching user', error.message, 500);
    }
  },

  // Update user preferences
  updateUserPreferences: async (req, res) => {
    try {
      const { userId } = req.params;
      const { preferences } = req.body;

      // Check if user is updating their own preferences or is admin
      if (req.user && (userId !== req.user.id && req.user.role !== 'admin')) {
        return sendErrorResponse(res, 'Not authorized to update this user\'s preferences', null, 403);
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { preferences },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return sendErrorResponse(res, 'User not found', null, 404);
      }

      const responseData = {
        user: formatUserResponse(user)
      };

      return sendSuccessResponse(res, 'User preferences updated successfully', responseData);

    } catch (error) {
      logger.error('Error updating user preferences', { userId, error: error.message, stack: error.stack });
      return sendErrorResponse(res, 'Error updating user preferences', error.message, 500);
    }
  },

  // Search users (admin only)
  searchUsers: async (req, res) => {
    try {
      const { q: query, page = 1, limit = 10 } = req.query;

      if (!query) {
        return sendErrorResponse(res, 'Search query is required', null, 400);
      }

      const searchQuery = {
        $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { institution: { $regex: query, $options: 'i' } }
        ]
      };

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        select: '-password'
      };

      const users = await User.paginate(searchQuery, options);

      const responseData = {
        users: users.docs.map(user => formatUserResponse(user)),
        pagination: {
          total: users.totalDocs,
          limit: users.limit,
          page: users.page,
          pages: users.totalPages,
          hasNext: users.hasNextPage,
          hasPrev: users.hasPrevPage
        },
        search: {
          query,
          results: users.docs.length
        }
      };

      return sendSuccessResponse(res, 'Users search completed successfully', responseData);

    } catch (error) {
      logger.error('Error searching users', { error: error.message, stack: error.stack });
      return sendErrorResponse(res, 'Error searching users', error.message, 500);
    }
  },

  // Get user statistics (admin only)
  getUserStats: async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ status: 'active' });
      const pendingUsers = await User.countDocuments({ status: 'pending' });
      const suspendedUsers = await User.countDocuments({ status: 'suspended' });
      const readers = await User.countDocuments({ role: 'reader' });
      const researchers = await User.countDocuments({ role: 'researcher' });
      const admins = await User.countDocuments({ role: 'admin' });

      // Get users by role
      const usersByRole = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get users by status
      const usersByStatus = await User.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get recent registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentRegistrations = await User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });

      // Get daily registrations for the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const dailyRegistrations = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: sevenDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      const responseData = {
        overview: {
          totalUsers,
          activeUsers,
          pendingUsers,
          suspendedUsers,
          readers,
          researchers,
          admins,
          recentRegistrations
        },
        distributions: {
          byRole: usersByRole,
          byStatus: usersByStatus
        },
        trends: {
          dailyRegistrations,
          period: '7 days'
        },
        lastUpdated: new Date()
      };

      return sendSuccessResponse(res, 'User statistics retrieved successfully', responseData);

    } catch (error) {
      logger.error('Error fetching user statistics', { error: error.message, stack: error.stack });
      return sendErrorResponse(res, 'Error fetching user statistics', error.message, 500);
    }
  }
};

module.exports = userController;