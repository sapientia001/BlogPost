const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      logger.warn('Authentication attempt without token');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = verifyToken(token);
    
    // Use either id or _id from token (standardize on id)
    const userId = decoded.id || decoded._id;
    
    if (!userId) {
      logger.error('No user ID found in token', { decoded });
      return res.status(401).json({
        success: false,
        message: 'Token is invalid - no user ID found.'
      });
    }

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      logger.error('User not found with ID from token', { userId });
      return res.status(401).json({
        success: false,
        message: 'Token is invalid.'
      });
    }

    if (user.status !== 'active') {
      logger.warn('User account not active', { userId, status: user.status });
      return res.status(401).json({
        success: false,
        message: 'Account is not active.'
      });
    }

    req.user = user;
    logger.info('User authenticated successfully', { userId: user._id, email: user.email });
    next();
  } catch (error) {
    logger.error('Authentication error', { error: error.message });
    res.status(401).json({
      success: false,
      message: 'Token is invalid.'
    });
  }
};

const adminAuth = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    logger.warn('Admin access denied', { userId: req.user?._id, role: req.user?.role });
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  next();
};

const researcherAuth = (req, res, next) => {
  if (!req.user || !['researcher', 'admin'].includes(req.user.role)) {
    logger.warn('Researcher access denied', { userId: req.user?._id, role: req.user?.role });
    return res.status(403).json({
      success: false,
      message: 'Access denied. Researcher or Admin role required.'
    });
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id || decoded._id).select('-password');
      
      if (user && user.status === 'active') {
        req.user = user;
        logger.debug('Optional auth - user set', { userId: user._id });
      }
    }
    
    next();
  } catch (error) {
    // If token is invalid, continue without user
    logger.debug('Optional auth - token invalid, continuing without user');
    next();
  }
};

module.exports = { 
  auth, 
  adminAuth, 
  researcherAuth, 
  optionalAuth 
};