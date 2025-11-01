// Application Information
const APP_INFO = {
  NAME: 'Microbiology Blog',
  VERSION: '1.0.0',
  DESCRIPTION: 'A comprehensive platform for microbiology research and articles'
};

// User roles
const USER_ROLES = {
  READER: 'reader',
  RESEARCHER: 'researcher', 
  ADMIN: 'admin'
};

// User statuses
const USER_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  SUSPENDED: 'suspended'
};

// Post statuses
const POST_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

// Comment statuses
const COMMENT_STATUS = {
  ACTIVE: 'active',
  FLAGGED: 'flagged',
  REMOVED: 'removed'
};

// Notification types
const NOTIFICATION_TYPES = {
  NEW_POST: 'new_post',
  POST_LIKE: 'post_like',
  NEW_COMMENT: 'new_comment',
  COMMENT_REPLY: 'comment_reply',
  NEW_FOLLOWER: 'new_follower',
  ADMIN_ANNOUNCEMENT: 'admin_announcement'
};

// File upload constraints
const UPLOAD_CONSTRAINTS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

// Pagination defaults
const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100
};

// API response messages
const MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  VALIDATION_ERROR: 'Validation failed',
  SERVER_ERROR: 'Internal server error',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTER_SUCCESS: 'Registration successful'
};

// Email templates
const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password_reset',
  NEW_POST_NOTIFICATION: 'new_post_notification',
  COMMENT_NOTIFICATION: 'comment_notification'
};

module.exports = {
  APP_INFO,
  USER_ROLES,
  USER_STATUS,
  POST_STATUS,
  COMMENT_STATUS,
  NOTIFICATION_TYPES,
  UPLOAD_CONSTRAINTS,
  PAGINATION_DEFAULTS,
  MESSAGES,
  EMAIL_TEMPLATES
};