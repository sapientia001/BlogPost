const uploadService = require('./uploadService');
const logger = require('../utils/logger');

class AvatarService {
  // Process avatar update - handles CloudinaryStorage uploads
  static async processAvatarUpdate(req, currentUser) {
    let uploadedAvatarUrl = null;
    let oldAvatarUrl = currentUser.avatar || null;

    // No file provided, return current avatar
    if (!req.file) {
      logger.info('ℹ️ No avatar file provided in request');
      return {
        success: true,
        avatarUrl: currentUser.avatar,
        oldAvatarUrl: null,
        uploadedAvatarUrl: null
      };
    }

    // With CloudinaryStorage, the file is already uploaded and URL is in req.file.path
    if (req.file.path) {
      uploadedAvatarUrl = req.file.path;
      logger.info('✅ Avatar uploaded via CloudinaryStorage', {
        url: uploadedAvatarUrl,
        originalname: req.file.originalname
      });
      
      return {
        success: true,
        avatarUrl: uploadedAvatarUrl,
        oldAvatarUrl,
        uploadedAvatarUrl
      };
    } else {
      logger.error('❌ CloudinaryStorage upload failed - no file path');
      return {
        success: false,
        error: 'Avatar upload failed - no file URL received'
      };
    }
  }

  // Delete old avatar from Cloudinary
  static async deleteOldAvatar(avatarUrl) {
    if (!avatarUrl) {
      logger.info('ℹ️ No avatar URL provided for deletion');
      return { success: true };
    }
    
    try {
      logger.info('🗑️ Deleting old avatar from Cloudinary', {
        avatarUrl
      });
      
      const publicId = this.extractPublicId(avatarUrl);
      if (publicId) {
        await uploadService.deleteFile(publicId);
        logger.info('✅ Old avatar deleted successfully');
        return { success: true };
      } else {
        logger.warn('⚠️ Could not extract publicId from avatar URL', { avatarUrl });
        return { success: true }; // Continue anyway
      }
    } catch (error) {
      logger.error('❌ Failed to delete old avatar', {
        avatarUrl,
        error: error.message
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Extract publicId from Cloudinary URL
  static extractPublicId(url) {
    if (!url) return null;
    
    try {
      // Cloudinary URL format: https://res.cloudinary.com/cloudname/image/upload/v1234567/folder/filename.jpg
      const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.\w+$/);
      return matches ? matches[1] : null;
    } catch (error) {
      logger.error('❌ Failed to extract publicId from URL', { url, error: error.message });
      return null;
    }
  }

  // Clean up uploaded avatar if operation fails
  static async cleanupUploadedAvatar(avatarUrl) {
    if (!avatarUrl) {
      logger.info('ℹ️ No avatar URL provided for cleanup');
      return { success: true };
    }
    
    try {
      logger.info('🧹 Cleaning up uploaded avatar due to error', {
        avatarUrl
      });
      
      const publicId = this.extractPublicId(avatarUrl);
      if (publicId) {
        await uploadService.deleteFile(publicId);
        logger.info('✅ Uploaded avatar cleaned up successfully');
        return { success: true };
      } else {
        logger.warn('⚠️ Could not extract publicId for cleanup', { avatarUrl });
        return { success: true };
      }
    } catch (cleanupError) {
      logger.error('❌ Failed to cleanup uploaded avatar', {
        avatarUrl,
        error: cleanupError.message
      });
      return {
        success: false,
        error: cleanupError.message
      };
    }
  }

  // Normalize avatar data from request body
  static normalizeAvatarData(updateData) {
    // Remove any empty avatar objects from FormData
    if (updateData.avatar && typeof updateData.avatar === 'object' && Object.keys(updateData.avatar).length === 0) {
      logger.info('🔄 Removing empty avatar object from updateData');
      delete updateData.avatar;
    }

    // Ensure avatar is always a string
    if (updateData.avatar && typeof updateData.avatar !== 'string') {
      logger.info('🔄 Converting avatar object to string', {
        avatarObject: updateData.avatar
      });
      if (updateData.avatar.url) {
        updateData.avatar = updateData.avatar.url;
      } else {
        // If it's an object without url, remove it
        logger.info('🔄 Removing invalid avatar object (no URL property)');
        delete updateData.avatar;
      }
    }

    return updateData;
  }

  // Handle avatar for user deletion
  static async handleUserDeletion(user) {
    if (!user || !user.avatar) {
      return { success: true };
    }

    try {
      logger.info('🗑️ Handling avatar deletion for user', {
        userId: user._id,
        avatarUrl: user.avatar
      });
      
      const result = await this.deleteOldAvatar(user.avatar);
      
      if (result.success) {
        logger.info('✅ User avatar deleted successfully', {
          userId: user._id
        });
      } else {
        logger.warn('⚠️ Failed to delete user avatar, but continuing with user deletion', {
          userId: user._id,
          error: result.error
        });
      }
      
      return result;
    } catch (error) {
      logger.error('❌ Error handling avatar deletion for user', {
        userId: user._id,
        error: error.message
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validate avatar file
  static validateAvatarFile(file) {
    if (!file) {
      return {
        isValid: false,
        error: 'No file provided'
      };
    }

    // Check file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed'
      };
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size must be less than 5MB'
      };
    }

    return {
      isValid: true
    };
  }
}

module.exports = AvatarService;