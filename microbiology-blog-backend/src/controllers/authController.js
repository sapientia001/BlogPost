const User = require('../models/User');
const { generateToken, generateRefreshToken, verifyRefreshToken, verifyToken } = require('../utils/jwt');
const { validateRegistration, validateLogin } = require('../utils/validators');
const emailService = require('../services/emailService');
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

const authController = {
  // Register new user
  register: async (req, res) => {
    try {
      const { firstName, lastName, email, password, role, institution, specialization } = req.body;

      // Validate input
      const validation = validateRegistration(req.body);
      if (!validation.isValid) {
        return sendErrorResponse(res, 'Validation failed', validation.errors, 400);
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        return sendErrorResponse(res, 'User already exists with this email', null, 400);
      }

      // Create new user
      const user = new User({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        password,
        role: role || 'reader',
        institution: institution?.trim(),
        specialization: Array.isArray(specialization) ? specialization : []
      });

      await user.save();

      // Generate tokens
      const token = generateToken({ id: user._id.toString() });
      const refreshToken = generateRefreshToken({ id: user._id.toString() });

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(user);
      } catch (emailError) {
        logger.error('Failed to send welcome email', { userId: user._id, error: emailError.message });
      }

      // Standardized user response
      const userResponse = {
        user: {
          id: user._id,
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          institution: user.institution,
          specialization: user.specialization,
          avatar: user.avatar,
          bio: user.bio,
          status: user.status,
          emailVerified: user.emailVerified,
          preferences: user.preferences,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        token,
        refreshToken
      };

      return sendSuccessResponse(res, 'User registered successfully', userResponse, 201);

    } catch (error) {
      logger.error('Error registering user', { error: error.message, stack: error.stack });
      return sendErrorResponse(res, 'Error registering user', error.message, 500);
    }
  },

  // User login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate input
      const validation = validateLogin(req.body);
      if (!validation.isValid) {
        return sendErrorResponse(res, 'Validation failed', validation.errors, 400);
      }

      // Find user with password explicitly selected
      const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
      
      if (!user) {
        return sendErrorResponse(res, 'Invalid email or password', null, 401);
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return sendErrorResponse(res, 'Invalid email or password', null, 401);
      }

      // Check user status
      if (user.status !== 'active') {
        return sendErrorResponse(res, 'Account is not active. Please contact administrator.', null, 401);
      }

      // Update last active
      await user.updateLastActive();

      // Generate tokens
      const token = generateToken({ id: user._id.toString() });
      const refreshToken = generateRefreshToken({ id: user._id.toString() });

      // Standardized user response
      const userResponse = {
        user: {
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
          status: user.status,
          emailVerified: user.emailVerified,
          preferences: user.preferences,
          lastActive: user.lastActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        token,
        refreshToken
      };

      return sendSuccessResponse(res, 'Login successful', userResponse);

    } catch (error) {
      logger.error('Error during login', { error: error.message, stack: error.stack });
      return sendErrorResponse(res, 'Error during login', error.message, 500);
    }
  },

  // Get current user
  getMe: async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return sendErrorResponse(res, 'User not authenticated', null, 401);
      }

      const user = await User.findById(req.user.id)
        .select('-password')
        .populate('preferences.subscribedCategories', 'name slug')
        .populate('preferences.subscribedAuthors', 'firstName lastName avatar');

      if (!user) {
        return sendErrorResponse(res, 'User not found', null, 404);
      }

      // Standardized user response
      const userResponse = {
        user: {
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
        }
      };

      return sendSuccessResponse(res, 'User profile retrieved successfully', userResponse);

    } catch (error) {
      logger.error('Error fetching user data', { userId: req.user?.id, error: error.message, stack: error.stack });
      return sendErrorResponse(res, 'Error fetching user data', error.message, 500);
    }
  },

  // Refresh token
  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return sendErrorResponse(res, 'Refresh token is required', null, 401);
      }

      const decoded = verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.id);

      if (!user) {
        return sendErrorResponse(res, 'Invalid refresh token', null, 401);
      }

      // Generate new tokens
      const newToken = generateToken({ id: user._id.toString() });
      const newRefreshToken = generateRefreshToken({ id: user._id.toString() });

      const tokenResponse = {
        token: newToken,
        refreshToken: newRefreshToken
      };

      return sendSuccessResponse(res, 'Token refreshed successfully', tokenResponse);

    } catch (error) {
      logger.error('Error refreshing token', { error: error.message, stack: error.stack });
      return sendErrorResponse(res, 'Invalid refresh token', error.message, 401);
    }
  },

  // Logout user
  logout: async (req, res) => {
    try {
      return sendSuccessResponse(res, 'Logout successful');
    } catch (error) {
      logger.error('Error during logout', { userId: req.user?.id, error: error.message, stack: error.stack });
      return sendErrorResponse(res, 'Error during logout', error.message, 500);
    }
  },

  // Forgot password
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        // Don't reveal whether email exists
        return sendSuccessResponse(res, 'If the email exists, a password reset link has been sent');
      }

      const resetToken = generateToken({ id: user._id.toString() }, '1h');
      await emailService.sendPasswordResetEmail(user, resetToken);

      return sendSuccessResponse(res, 'If the email exists, a password reset link has been sent');

    } catch (error) {
      logger.error('Error in forgot password', { error: error.message, stack: error.stack });
      return sendErrorResponse(res, 'Error processing request', error.message, 500);
    }
  },

  // Reset password
  resetPassword: async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return sendErrorResponse(res, 'Token and password are required', null, 400);
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);

      if (!user) {
        return sendErrorResponse(res, 'Invalid or expired token', null, 400);
      }

      user.password = password;
      await user.save();

      return sendSuccessResponse(res, 'Password reset successfully');

    } catch (error) {
      logger.error('Error resetting password', { error: error.message, stack: error.stack });
      return sendErrorResponse(res, 'Invalid or expired token', error.message, 400);
    }
  }
};

module.exports = authController;