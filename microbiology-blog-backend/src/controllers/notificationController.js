const Notification = require('../models/Notification');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

const notificationController = {
  // Get user notifications
  getNotifications: async (req, res) => {
    try {
      const { page = 1, limit = 20, unreadOnly } = req.query;

      const query = { user: req.user.id };
      if (unreadOnly === 'true') {
        query.isRead = false;
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        populate: [
          { path: 'relatedPost', select: 'title slug' },
          { path: 'relatedUser', select: 'firstName lastName avatar' }
        ]
      };

      const notifications = await Notification.paginate(query, options);

      // Get unread count
      const unreadCount = await notificationService.getUnreadCount(req.user.id);

      res.json({
        success: true,
        data: {
          ...notifications,
          unreadCount
        }
      });
    } catch (error) {
      logger.error('Error fetching notifications', { userId: req.user.id, error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error fetching notifications',
        error: error.message
      });
    }
  },

  // Mark notification as read
  markAsRead: async (req, res) => {
    try {
      const { id } = req.params;

      const notification = await notificationService.markAsRead(id, req.user.id);

      res.json({
        success: true,
        message: 'Notification marked as read',
        data: { notification }
      });
    } catch (error) {
      logger.error('Error marking notification as read', { notificationId: req.params.id, userId: req.user.id, error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error marking notification as read',
        error: error.message
      });
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (req, res) => {
    try {
      const count = await notificationService.markAllAsRead(req.user.id);

      res.json({
        success: true,
        message: 'All notifications marked as read',
        data: { markedCount: count }
      });
    } catch (error) {
      logger.error('Error marking all notifications as read', { userId: req.user.id, error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error marking notifications as read',
        error: error.message
      });
    }
  },

  // Delete notification
  deleteNotification: async (req, res) => {
    try {
      const { id } = req.params;

      const notification = await Notification.findOneAndDelete({
        _id: id,
        user: req.user.id
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting notification', { notificationId: req.params.id, userId: req.user.id, error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error deleting notification',
        error: error.message
      });
    }
  },

  // Get notification preferences
  getPreferences: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('preferences');

      res.json({
        success: true,
        data: { preferences: user.preferences }
      });
    } catch (error) {
      logger.error('Error fetching notification preferences', { userId: req.user.id, error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error fetching preferences',
        error: error.message
      });
    }
  },

  // Update notification preferences
  updatePreferences: async (req, res) => {
    try {
      const { emailNotifications, pushNotifications } = req.body;

      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          $set: {
            'preferences.emailNotifications': emailNotifications,
            'preferences.pushNotifications': pushNotifications
          }
        },
        { new: true }
      ).select('preferences');

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: { preferences: user.preferences }
      });
    } catch (error) {
      logger.error('Error updating notification preferences', { userId: req.user.id, error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error updating preferences',
        error: error.message
      });
    }
  },

  // Subscribe to category
  subscribeToCategory: async (req, res) => {
    try {
      const { categoryId } = req.body;

      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          $addToSet: { 'preferences.subscribedCategories': categoryId }
        },
        { new: true }
      ).select('preferences');

      res.json({
        success: true,
        message: 'Subscribed to category successfully',
        data: { preferences: user.preferences }
      });
    } catch (error) {
      logger.error('Error subscribing to category', { userId: req.user.id, categoryId: req.body.categoryId, error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error subscribing to category',
        error: error.message
      });
    }
  },

  // Subscribe to author
  subscribeToAuthor: async (req, res) => {
    try {
      const { authorId } = req.body;

      // Check if author exists
      const author = await User.findById(authorId);
      if (!author) {
        return res.status(404).json({
          success: false,
          message: 'Author not found'
        });
      }

      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          $addToSet: { 'preferences.subscribedAuthors': authorId }
        },
        { new: true }
      ).select('preferences');

      res.json({
        success: true,
        message: 'Subscribed to author successfully',
        data: { preferences: user.preferences }
      });
    } catch (error) {
      logger.error('Error subscribing to author', { userId: req.user.id, authorId: req.body.authorId, error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error subscribing to author',
        error: error.message
      });
    }
  }
};

module.exports = notificationController;