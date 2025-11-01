const multer = require('multer');
const path = require('path');
const { UPLOAD_CONSTRAINTS } = require('../utils/constants');
const logger = require('../utils/logger');

// Configure multer for memory storage (for Cloudinary)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  try {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      if (!UPLOAD_CONSTRAINTS.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        return cb(new Error('Invalid image file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
      }
    } else if (file.mimetype.startsWith('application/')) {
      if (!UPLOAD_CONSTRAINTS.ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
        return cb(new Error('Invalid document file type. Only PDF and Word documents are allowed.'), false);
      }
    } else {
      return cb(new Error('Invalid file type. Only images and documents are allowed.'), false);
    }

    // Check file size
    if (file.size > UPLOAD_CONSTRAINTS.MAX_FILE_SIZE) {
      return cb(new Error(`File size too large. Maximum size is ${UPLOAD_CONSTRAINTS.MAX_FILE_SIZE / 1024 / 1024}MB.`), false);
    }

    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: UPLOAD_CONSTRAINTS.MAX_FILE_SIZE
  }
});

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File size too large. Maximum size is ${UPLOAD_CONSTRAINTS.MAX_FILE_SIZE / 1024 / 1024}MB.`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected field name for file upload.';
        break;
      default:
        message = `Upload error: ${error.message}`;
    }
    
    logger.error('Multer upload error', {
      errorCode: error.code,
      message: error.message,
      fieldName: error.field
    });
    
    return res.status(400).json({
      success: false,
      message
    });
  }
  
  if (error.message) {
    logger.error('File upload validation error', { error: error.message });
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// Middleware to check if file was uploaded (optional)
const requireFile = (fieldName) => {
  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} is required`
      });
    }
    next();
  };
};

// Middleware to handle multiple file uploads with specific field names
const handleMultipleUploads = (fields) => {
  return upload.fields(fields);
};

module.exports = upload;
module.exports.handleUploadError = handleUploadError;
module.exports.requireFile = requireFile;
module.exports.handleMultipleUploads = handleMultipleUploads;