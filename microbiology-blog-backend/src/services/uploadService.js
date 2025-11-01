const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const stream = require('stream');
const { UPLOAD_CONSTRAINTS } = require('../utils/constants');
const logger = require('../utils/logger');

class UploadService {
  constructor() {
    this.initializeCloudinary();
  }

  initializeCloudinary() {
    try {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      logger.info('Cloudinary initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Cloudinary', { error: error.message });
      throw new Error('Cloudinary configuration failed');
    }
  }

  // Configure multer for file uploads with Cloudinary storage
  getMulterConfig(folder = 'general') {
    const storage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: `microbiology-blog/${folder}`,
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx'],
        transformation: [
          { width: 1200, height: 630, crop: 'limit', quality: 'auto' }
        ],
        resource_type: 'auto'
      },
    });

    const fileFilter = (req, file, cb) => {
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
        return cb(new Error('File size too large. Maximum size is 5MB.'), false);
      }

      cb(null, true);
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: UPLOAD_CONSTRAINTS.MAX_FILE_SIZE
      }
    });
  }

  // Upload single file from memory buffer (for multer memoryStorage)
  async uploadFile(file, folder = 'general') {
    try {
      if (!file || !file.buffer) {
        throw new Error('No file provided or file buffer is missing');
      }

      // Validate file before upload
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `microbiology-blog/${folder}`,
            resource_type: 'auto',
            transformation: [
              { width: 1200, height: 630, crop: 'limit', quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) {
              logger.error('Cloudinary upload failed', {
                fileName: file.originalname,
                folder,
                error: error.message
              });
              reject(error);
            } else {
              logger.info('File uploaded successfully to Cloudinary', {
                publicId: result.public_id,
                format: result.format,
                size: result.bytes,
                folder,
                url: result.secure_url
              });

              resolve({
                success: true,
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                size: result.bytes,
                width: result.width,
                height: result.height,
                resourceType: result.resource_type,
                createdAt: result.created_at
              });
            }
          }
        );

        // Create a buffer stream and pipe to Cloudinary
        const bufferStream = new stream.PassThrough();
        bufferStream.end(file.buffer);
        bufferStream.pipe(uploadStream);
      });
    } catch (error) {
      logger.error('Failed to upload file', {
        fileName: file?.originalname,
        folder,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  // Upload file from path (alternative method for direct file paths)
  async uploadFileFromPath(filePath, folder = 'general') {
    try {
      if (!filePath) {
        throw new Error('File path is required');
      }

      const result = await cloudinary.uploader.upload(filePath, {
        folder: `microbiology-blog/${folder}`,
        resource_type: 'auto',
        transformation: [
          { width: 1200, height: 630, crop: 'limit', quality: 'auto' }
        ]
      });

      logger.info('File uploaded successfully from path', {
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
        folder,
        url: result.secure_url
      });

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height,
        resourceType: result.resource_type,
        createdAt: result.created_at
      };
    } catch (error) {
      logger.error('Failed to upload file from path', {
        filePath,
        folder,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(files, folder = 'general') {
    try {
      if (!files || files.length === 0) {
        throw new Error('No files provided');
      }

      const uploadPromises = files.map(file => this.uploadFile(file, folder));
      const results = await Promise.allSettled(uploadPromises);

      const successfulUploads = results
        .filter(result => result.status === 'fulfilled' && result.value.success)
        .map(result => result.value);

      const failedUploads = results
        .filter(result => result.status === 'rejected' || !result.value.success)
        .map(result => result.reason || result.value);

      logger.info('Multiple files upload completed', {
        totalFiles: files.length,
        successful: successfulUploads.length,
        failed: failedUploads.length,
        folder
      });

      return {
        success: true,
        uploadedFiles: successfulUploads,
        failedUploads: failedUploads.map(f => ({
          error: f.error || f.message || 'Unknown error',
          fileName: f.originalname || 'Unknown file'
        }))
      };
    } catch (error) {
      logger.error('Failed to upload multiple files', {
        fileCount: files?.length,
        folder,
        error: error.message
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete file from Cloudinary
  async deleteFile(publicId) {
    try {
      if (!publicId) {
        throw new Error('Public ID is required');
      }

      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result === 'ok') {
        logger.info('File deleted successfully from Cloudinary', { publicId });
        return { success: true };
      } else {
        throw new Error(`Cloudinary deletion failed: ${result.result}`);
      }
    } catch (error) {
      logger.error('Failed to delete file from Cloudinary', {
        publicId,
        error: error.message
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete multiple files
  async deleteMultipleFiles(publicIds) {
    try {
      if (!publicIds || publicIds.length === 0) {
        throw new Error('No public IDs provided');
      }

      const deletePromises = publicIds.map(publicId => this.deleteFile(publicId));
      const results = await Promise.allSettled(deletePromises);

      const successfulDeletes = results
        .filter(result => result.status === 'fulfilled' && result.value.success)
        .map(result => result.value);

      const failedDeletes = results
        .filter(result => result.status === 'rejected' || !result.value.success)
        .map(result => result.reason || result.value);

      logger.info('Multiple files deletion completed', {
        totalFiles: publicIds.length,
        successful: successfulDeletes.length,
        failed: failedDeletes.length
      });

      return {
        success: true,
        deletedFiles: successfulDeletes.length,
        failedDeletes: failedDeletes.map(f => ({
          error: f.error || f.message || 'Unknown error',
          publicId: f.publicId || 'Unknown'
        }))
      };
    } catch (error) {
      logger.error('Failed to delete multiple files', {
        publicIdsCount: publicIds?.length,
        error: error.message
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate image URL with transformations
  generateImageUrl(publicId, transformations = {}) {
    try {
      if (!publicId) {
        throw new Error('Public ID is required');
      }

      const defaultTransformations = {
        width: 800,
        height: 600,
        crop: 'fill',
        quality: 'auto',
        format: 'webp'
      };

      const finalTransformations = { ...defaultTransformations, ...transformations };
      
      return cloudinary.url(publicId, finalTransformations);
    } catch (error) {
      logger.error('Failed to generate image URL', {
        publicId,
        error: error.message
      });
      return null;
    }
  }

  // Get file information from Cloudinary
  async getFileInfo(publicId) {
    try {
      if (!publicId) {
        throw new Error('Public ID is required');
      }

      const result = await cloudinary.api.resource(publicId);
      
      return {
        success: true,
        url: result.secure_url,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height,
        createdAt: result.created_at,
        tags: result.tags || [],
        resourceType: result.resource_type,
        publicId: result.public_id
      };
    } catch (error) {
      logger.error('Failed to get file info from Cloudinary', {
        publicId,
        error: error.message
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create folder in Cloudinary
  async createFolder(folderName) {
    try {
      if (!folderName) {
        throw new Error('Folder name is required');
      }

      const result = await cloudinary.api.create_folder(`microbiology-blog/${folderName}`);
      
      logger.info('Folder created successfully in Cloudinary', { folderName });
      return { 
        success: true, 
        path: result.path,
        name: folderName
      };
    } catch (error) {
      logger.error('Failed to create folder in Cloudinary', {
        folderName,
        error: error.message
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  // List resources in a folder
  async listFolderResources(folder, options = {}) {
    try {
      if (!folder) {
        throw new Error('Folder path is required');
      }

      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: `microbiology-blog/${folder}`,
        max_results: options.limit || 50,
        ...options
      });

      return {
        success: true,
        resources: result.resources,
        totalCount: result.resources.length
      };
    } catch (error) {
      logger.error('Failed to list folder resources', {
        folder,
        error: error.message
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validate file before upload
  validateFile(file) {
    const errors = [];

    if (!file) {
      errors.push('No file provided');
      return { isValid: false, errors };
    }

    if (!file.buffer && !file.path) {
      errors.push('File buffer or path is required');
    }

    // Check file type
    if (file.mimetype.startsWith('image/')) {
      if (!UPLOAD_CONSTRAINTS.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        errors.push('Invalid image file type. Only JPEG, PNG, GIF, and WebP are allowed.');
      }
    } else if (file.mimetype.startsWith('application/')) {
      if (!UPLOAD_CONSTRAINTS.ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
        errors.push('Invalid document file type. Only PDF and Word documents are allowed.');
      }
    } else {
      errors.push('Invalid file type. Only images and documents are allowed.');
    }

    // Check file size
    if (file.size > UPLOAD_CONSTRAINTS.MAX_FILE_SIZE) {
      errors.push('File size too large. Maximum size is 5MB.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Generate responsive image URLs for different screen sizes
  generateResponsiveUrls(publicId, sizes = [400, 800, 1200]) {
    try {
      if (!publicId) {
        throw new Error('Public ID is required');
      }

      const urls = {};
      
      sizes.forEach(size => {
        urls[size] = cloudinary.url(publicId, {
          width: size,
          crop: 'scale',
          quality: 'auto',
          format: 'webp'
        });
      });

      // Original URL
      urls.original = cloudinary.url(publicId, {
        quality: 'auto',
        format: 'webp'
      });

      return urls;
    } catch (error) {
      logger.error('Failed to generate responsive URLs', {
        publicId,
        error: error.message
      });
      return null;
    }
  }

  // Upload base64 image (for frontend direct uploads)
  async uploadBase64Image(base64Data, folder = 'general') {
    try {
      if (!base64Data) {
        throw new Error('Base64 data is required');
      }

      const result = await cloudinary.uploader.upload(base64Data, {
        folder: `microbiology-blog/${folder}`,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 630, crop: 'limit', quality: 'auto' }
        ]
      });

      logger.info('Base64 image uploaded successfully', {
        publicId: result.public_id,
        folder,
        url: result.secure_url
      });

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height
      };
    } catch (error) {
      logger.error('Failed to upload base64 image', {
        folder,
        error: error.message
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if Cloudinary is properly configured
  checkConfiguration() {
    try {
      const config = cloudinary.config();
      return {
        success: true,
        configured: !!(config.cloud_name && config.api_key && config.api_secret),
        cloudName: config.cloud_name
      };
    } catch (error) {
      logger.error('Cloudinary configuration check failed', { error: error.message });
      return {
        success: false,
        configured: false,
        error: error.message
      };
    }
  }
}

module.exports = new UploadService();