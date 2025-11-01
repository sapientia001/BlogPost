// Barrel export for all utils

// JWT utilities
const { 
  generateToken, 
  generateRefreshToken, 
  verifyToken, 
  verifyRefreshToken 
} = require('./jwt');

// Helper functions
const {
  generateRandomString,
  formatDate,
  calculateReadingTime,
  sanitizeHTML,
  generateExcerpt,
  isValidEmail,
  paginateOptions,
  formatFileSize,
  delay,
  deepClone
} = require('./helpers');

// Import constants
const constants = require('./constants');

// Validators
const validators = require('./validators');

// Logger
const logger = require('./logger');

module.exports = {
  // JWT utilities
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  
  // Helper functions
  generateRandomString,
  formatDate,
  calculateReadingTime,
  sanitizeHTML,
  generateExcerpt,
  isValidEmail,
  paginateOptions,
  formatFileSize,
  delay,
  deepClone,
  
  // Constants (export all constants)
  ...constants,
  
  // Validators
  ...validators,
  
  // Logger
  logger
};

const USER_ROLES = {
  READER: 'reader',
  RESEARCHER: 'researcher',
  ADMIN: 'admin'
};

const POST_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

const UPLOAD_CONSTRAINTS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

module.exports = {
  USER_ROLES,
  POST_STATUS,
  UPLOAD_CONSTRAINTS
};