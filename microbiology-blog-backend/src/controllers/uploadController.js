const uploadService = require('../services/uploadService');
const logger = require('../utils/logger');

const uploadController = {
  // Upload image
  uploadImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      const result = await uploadService.uploadFile(req.file, 'posts');

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error
        });
      }

      res.json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          url: result.url,
          publicId: result.publicId,
          width: result.width,
          height: result.height
        }
      });
    } catch (error) {
      logger.error('Error uploading image', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error uploading image',
        error: error.message
      });
    }
  },

  // Upload document
  uploadDocument: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No document file provided'
        });
      }

      const result = await uploadService.uploadFile(req.file, 'documents');

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error
        });
      }

      res.json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          url: result.url,
          publicId: result.publicId,
          originalName: req.file.originalname
        }
      });
    } catch (error) {
      logger.error('Error uploading document', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error uploading document',
        error: error.message
      });
    }
  },

  // Delete file
  deleteFile: async (req, res) => {
    try {
      const { publicId } = req.params;

      const result = await uploadService.deleteFile(publicId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error
        });
      }

      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting file', { publicId: req.params.publicId, error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error deleting file',
        error: error.message
      });
    }
  }
};

module.exports = uploadController;