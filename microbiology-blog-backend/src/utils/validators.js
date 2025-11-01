const { isValidEmail } = require('./helpers');
const { USER_ROLES, POST_STATUS, UPLOAD_CONSTRAINTS } = require('./constants');

// User validation schemas
const validateRegistration = (data) => {
  const errors = {};
  
  if (!data.firstName || data.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters long';
  }
  
  if (!data.lastName || data.lastName.trim().length < 2) {
    errors.lastName = 'Last name must be at least 2 characters long';
  }
  
  if (!data.email || !isValidEmail(data.email)) {
    errors.email = 'Please provide a valid email address';
  }
  
  if (!data.password || data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters long';
  }
  
  if (data.role && !Object.values(USER_ROLES).includes(data.role)) {
    errors.role = 'Invalid user role';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateLogin = (data) => {
  const errors = {};
  
  if (!data.email || !isValidEmail(data.email)) {
    errors.email = 'Please provide a valid email address';
  }
  
  if (!data.password) {
    errors.password = 'Password is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateProfileUpdate = (data) => {
  const errors = {};
  
  if (data.firstName && data.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters long';
  }
  
  if (data.lastName && data.lastName.trim().length < 2) {
    errors.lastName = 'Last name must be at least 2 characters long';
  }
  
  if (data.bio && data.bio.length > 500) {
    errors.bio = 'Bio cannot exceed 500 characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Post validation schemas
const validatePostCreation = (data) => {
  const errors = {};
  
  if (!data.title || data.title.trim().length < 5) {
    errors.title = 'Title must be at least 5 characters long';
  }
  
  if (!data.excerpt || data.excerpt.trim().length < 10) {
    errors.excerpt = 'Excerpt must be at least 10 characters long';
  }
  
  if (!data.content || data.content.trim().length < 50) {
    errors.content = 'Content must be at least 50 characters long';
  }
  
  if (!data.category) {
    errors.category = 'Category is required';
  }
  
  if (data.status && !Object.values(POST_STATUS).includes(data.status)) {
    errors.status = 'Invalid post status';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validatePostUpdate = (data) => {
  const errors = {};
  
  if (data.title && data.title.trim().length < 5) {
    errors.title = 'Title must be at least 5 characters long';
  }
  
  if (data.excerpt && data.excerpt.trim().length < 10) {
    errors.excerpt = 'Excerpt must be at least 10 characters long';
  }
  
  if (data.content && data.content.trim().length < 50) {
    errors.content = 'Content must be at least 50 characters long';
  }
  
  if (data.status && !Object.values(POST_STATUS).includes(data.status)) {
    errors.status = 'Invalid post status';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Category validation schemas
const validateCategoryCreation = (data) => {
  const errors = {};
  
  if (!data.name || data.name.trim().length < 3) {
    errors.name = 'Category name must be at least 3 characters long';
  }
  
  if (!data.description || data.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters long';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Comment validation schemas
const validateCommentCreation = (data) => {
  const errors = {};
  
  if (!data.content || data.content.trim().length < 1) {
    errors.content = 'Comment content is required';
  }
  
  if (data.content && data.content.length > 1000) {
    errors.content = 'Comment cannot exceed 1000 characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// File upload validation
const validateImageFile = (file) => {
  const errors = {};
  
  if (!file) {
    errors.file = 'File is required';
    return { isValid: false, errors };
  }
  
  if (!UPLOAD_CONSTRAINTS.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    errors.file = 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed';
  }
  
  if (file.size > UPLOAD_CONSTRAINTS.MAX_FILE_SIZE) {
    errors.file = 'File size must be less than 5MB';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateDocumentFile = (file) => {
  const errors = {};
  
  if (!file) {
    errors.file = 'File is required';
    return { isValid: false, errors };
  }
  
  if (!UPLOAD_CONSTRAINTS.ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    errors.file = 'Invalid file type. Only PDF and Word documents are allowed';
  }
  
  if (file.size > UPLOAD_CONSTRAINTS.MAX_FILE_SIZE) {
    errors.file = 'File size must be less than 5MB';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Search validation
const validateSearchQuery = (query) => {
  const errors = {};
  
  if (!query || query.trim().length < 2) {
    errors.query = 'Search query must be at least 2 characters long';
  }
  
  if (query && query.length > 100) {
    errors.query = 'Search query cannot exceed 100 characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = {
  // User validators
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  
  // Post validators
  validatePostCreation,
  validatePostUpdate,
  
  // Category validators
  validateCategoryCreation,
  
  // Comment validators
  validateCommentCreation,
  
  // File validators
  validateImageFile,
  validateDocumentFile,
  
  // Search validators
  validateSearchQuery
};