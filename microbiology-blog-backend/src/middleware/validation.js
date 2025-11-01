const { 
  validateRegistration: validateRegistrationFunc, 
  validateLogin: validateLoginFunc, 
  validatePostCreation: validatePostCreationFunc, 
  validatePostUpdate: validatePostUpdateFunc, 
  validateCategoryCreation: validateCategoryCreationFunc, 
  validateCommentCreation: validateCommentCreationFunc, 
  validateImageFile, 
  validateDocumentFile, 
  validateSearchQuery: validateSearchQueryFunc 
} = require('../utils/validators');

const logger = require('../utils/logger');

// User validation middleware
const validateRegistration = (req, res, next) => {
  const validation = validateRegistrationFunc(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.errors
    });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const validation = validateLoginFunc(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.errors
    });
  }
  next();
};

const validateProfileUpdate = (req, res, next) => {
  const validation = validateProfileUpdateFunc(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.errors
    });
  }
  next();
};

// Post validation middleware
const validatePostCreation = (req, res, next) => {
  const validation = validatePostCreationFunc(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.errors
    });
  }
  next();
};

const validatePostUpdate = (req, res, next) => {
  const validation = validatePostUpdateFunc(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.errors
    });
  }
  next();
};

// Category validation middleware
const validateCategoryCreation = (req, res, next) => {
  const validation = validateCategoryCreationFunc(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.errors
    });
  }
  next();
};

// Comment validation middleware
const validateCommentCreation = (req, res, next) => {
  const validation = validateCommentCreationFunc(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.errors
    });
  }
  next();
};

// Search validation middleware
const validateSearchQuery = (req, res, next) => {
  const validation = validateSearchQueryFunc(req.query.q);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.errors
    });
  }
  next();
};

// File upload validation middleware
const validateImageUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file provided'
    });
  }

  const validation = validateImageFile(req.file);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'File validation failed',
      errors: validation.errors
    });
  }

  next();
};

const validateDocumentUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file provided'
    });
  }

  const validation = validateDocumentFile(req.file);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'File validation failed',
      errors: validation.errors
    });
  }

  next();
};

// ObjectId validation middleware - FIXED: More flexible validation
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: `${paramName} is required`
      });
    }
    
    // FIXED: Accept both 24-character ObjectId and other IDs
    // Some MongoDB IDs might be different formats, so be more permissive
    if (!id.match(/^[0-9a-fA-F]{24}$/) && !id.match(/^[a-zA-Z0-9_-]+$/)) {
      console.log(`⚠️ Non-standard ID format for ${paramName}:`, id);
      // Don't block the request, just log a warning
      // Let the controller handle the actual database lookup
    }
    
    console.log(`✅ Processing ${paramName}:`, id);
    next();
  };
};


// Post identifier validation (accepts both ObjectId and slug) - FIXED
const validatePostIdentifier = (req, res, next) => {
  const { postIdentifier } = req.params;
  
  if (!postIdentifier) {
    return res.status(400).json({
      success: false,
      message: 'Post identifier is required'
    });
  }
  
  // ✅ FIX: Be more strict about what constitutes a valid post identifier
  // Reject empty strings, query-like patterns, and obviously invalid identifiers
  const isValidFormat = postIdentifier.match(/^[a-zA-Z0-9-_]{1,100}$/) && 
                       !postIdentifier.includes('?') && 
                       !postIdentifier.includes('&') &&
                       !postIdentifier.includes('=') &&
                       postIdentifier.trim().length > 0;
  
  if (!isValidFormat) {
    console.log('❌ Invalid post identifier format:', postIdentifier);
    return res.status(400).json({
      success: false,
      message: 'Invalid post identifier format'
    });
  }
  
  console.log(`✅ Processing post identifier:`, postIdentifier);
  next();
};

// Archive request validation middleware
const validateArchiveRequest = (req, res, next) => {
  const { status, reason } = req.body;
  
  // For unarchive, validate status
  if (status && !['draft', 'published'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be "draft" or "published"'
    });
  }
  
  // Validate reason length if provided
  if (reason && reason.length > 200) {
    return res.status(400).json({
      success: false,
      message: 'Archive reason cannot exceed 200 characters'
    });
  }
  
  next();
};

// Pagination validation middleware
const validatePagination = (req, res, next) => {
  const { page = 1, limit = 10, sort, order } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({
      success: false,
      message: 'Page must be a positive number'
    });
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({
      success: false,
      message: 'Limit must be between 1 and 100'
    });
  }
  
  // Validate sort parameters
  const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'views', 'likes', 'publishedAt'];
  const allowedOrders = ['asc', 'desc', 'ascending', 'descending', 1, -1];
  
  if (sort && !allowedSortFields.includes(sort)) {
    return res.status(400).json({
      success: false,
      message: `Invalid sort field. Allowed fields: ${allowedSortFields.join(', ')}`
    });
  }
  
  if (order && !allowedOrders.includes(order)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid sort order. Use "asc" or "desc"'
    });
  }
  
  // Add validated values to request for controllers to use
  req.validatedPagination = {
    page: pageNum,
    limit: limitNum,
    skip: (pageNum - 1) * limitNum,
    sort: sort || 'createdAt',
    order: order || 'desc'
  };
  
  next();
};

// Status filter validation middleware
const validateStatusFilter = (req, res, next) => {
  const { status } = req.query;
  
  const allowedStatuses = ['draft', 'published', 'archived', 'all'];
  
  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status filter. Allowed values: ${allowedStatuses.join(', ')}`
    });
  }
  
  next();
};

// Role validation middleware
const validateRole = (req, res, next) => {
  const { role } = req.body;
  
  const allowedRoles = ['reader', 'researcher', 'admin'];
  
  if (role && !allowedRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}`
    });
  }
  
  next();
};

// Email validation middleware
const validateEmail = (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }
  
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }
  
  next();
};

// Password validation middleware
const validatePassword = (req, res, next) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required'
    });
  }
  
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }
  
  next();
};

// Search type validation middleware
const validateSearchType = (req, res, next) => {
  const { searchType = 'all' } = req.query;
  
  const allowedSearchTypes = ['all', 'title', 'content', 'author', 'tags'];
  
  if (!allowedSearchTypes.includes(searchType)) {
    return res.status(400).json({
      success: false,
      message: `Invalid search type. Allowed types: ${allowedSearchTypes.join(', ')}`
    });
  }
  
  next();
};

// Comment status validation middleware (for admin moderation)
const validateCommentStatus = (req, res, next) => {
  const { status } = req.body;
  
  const allowedStatuses = ['active', 'flagged', 'removed'];
  
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid comment status. Allowed statuses: ${allowedStatuses.join(', ')}`
    });
  }
  
  next();
};

// User status validation middleware
const validateUserStatus = (req, res, next) => {
  const { status } = req.body;
  
  const allowedStatuses = ['active', 'pending', 'suspended'];
  
  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid user status. Allowed statuses: ${allowedStatuses.join(', ')}`
    });
  }
  
  next();
};

// Featured post validation middleware
const validateFeaturedUpdate = (req, res, next) => {
  const { featured } = req.body;
  
  if (featured !== undefined && typeof featured !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'Featured must be a boolean value'
    });
  }
  
  next();
};

// Tags validation middleware
const validateTags = (req, res, next) => {
  const { tags } = req.body;
  
  if (tags) {
    let tagArray = [];
    
    if (Array.isArray(tags)) {
      tagArray = tags;
    } else if (typeof tags === 'string') {
      tagArray = tags.split(',').map(tag => tag.trim());
    }
    
    // Validate each tag
    for (const tag of tagArray) {
      if (tag.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Each tag must be at least 2 characters long'
        });
      }
      
      if (tag.length > 30) {
        return res.status(400).json({
          success: false,
          message: 'Each tag cannot exceed 30 characters'
        });
      }
      
      // Check for special characters (basic validation)
      if (!/^[a-zA-Z0-9\s\-_]+$/.test(tag)) {
        return res.status(400).json({
          success: false,
          message: 'Tags can only contain letters, numbers, spaces, hyphens, and underscores'
        });
      }
    }
    
    // Limit number of tags
    if (tagArray.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Cannot exceed 10 tags per post'
      });
    }
    
    // Add cleaned tags to request for controllers to use
    req.cleanedTags = tagArray.map(tag => tag.toLowerCase().trim());
  }
  
  next();
};

module.exports = {
  // User validators
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validateRole,
  validateEmail,
  validatePassword,
  validateUserStatus,
  
  // Post validators
  validatePostCreation,
  validatePostUpdate,
  validateTags,
  validateFeaturedUpdate,
  
  // Category validators
  validateCategoryCreation,
  
  // Comment validators
  validateCommentCreation,
  validateCommentStatus,
  
  // Search validators
  validateSearchQuery,
  validateSearchType,
  
  // File validators
  validateImageUpload,
  validateDocumentUpload,
  
  // ID and parameter validators
  validateObjectId,
  validatePostIdentifier,
  
  // Pagination and filter validators
  validatePagination,
  validateStatusFilter,
  
  // Archive validators
  validateArchiveRequest,
};