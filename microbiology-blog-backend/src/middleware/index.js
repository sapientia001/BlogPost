// Barrel export for all middleware
const { 
  auth, 
  adminAuth, 
  researcherAuth, 
  optionalAuth 
} = require('./auth');

const {
  validateRegistration,
  validateLogin,
  validatePostCreation,
  validatePostUpdate,
  validateCategoryCreation,
  validateCommentCreation,
  validateSearchQuery,
  validateImageUpload,
  validateDocumentUpload,
  validateObjectId,
  validatePagination
} = require('./validation');

const {
  generalLimiter,
  authLimiter,
  apiLimiter,
  uploadLimiter,
  searchLimiter,
  commentLimiter,
  roleBasedLimiter
} = require('./rateLimit');

const {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError
} = require('./errorHandler');

const upload = require('./upload');
const {
  corsOptions,
  securityHeaders,
  hppOptions,
  requestLogger,
  sanitizeInput,
  securityAudit,
  validateFileUpload,
  getRateLimitConfig,
  applySecurityMiddleware
} = require('./security');

const {
  cache,
  cacheMiddleware,
  clearCache,
  cacheStats,
  invalidateCache
} = require('./cache');

module.exports = {
  // Authentication
  auth,
  adminAuth,
  researcherAuth,
  optionalAuth,
  
  // Validation
  validateRegistration,
  validateLogin,
  validatePostCreation,
  validatePostUpdate,
  validateCategoryCreation,
  validateCommentCreation,
  validateSearchQuery,
  validateImageUpload,
  validateDocumentUpload,
  validateObjectId,
  validatePagination,
  
  // Rate Limiting
  generalLimiter,
  authLimiter,
  apiLimiter,
  uploadLimiter,
  searchLimiter,
  commentLimiter,
  roleBasedLimiter,
  getRateLimitConfig,
  
  // Error Handling
  errorHandler,
  asyncHandler,
  notFoundHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  
  // File Upload
  upload,
  
  // Security
  corsOptions,
  securityHeaders,
  hppOptions,
  requestLogger,
  sanitizeInput,
  securityAudit,
  validateFileUpload,
  applySecurityMiddleware,
  
  // Caching
  cache,
  cacheMiddleware,
  clearCache,
  cacheStats,
  invalidateCache
};