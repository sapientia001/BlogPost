const Bookmark = require('../models/Bookmark');
const Post = require('../models/Post');
const logger = require('../utils/logger');

const bookmarkController = {
  // Get user bookmarks
  getBookmarks: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        populate: {
          path: 'post',
          populate: [
            { path: 'author', select: 'firstName lastName avatar' },
            { path: 'category', select: 'name slug' }
          ]
        }
      };

      const bookmarks = await Bookmark.paginate(
        { user: req.user.id },
        options
      );

      res.json({
        success: true,
        data: bookmarks
      });
    } catch (error) {
      logger.error('Error fetching bookmarks', { userId: req.user.id, error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error fetching bookmarks',
        error: error.message
      });
    }
  },

  // Add bookmark
  addBookmark: async (req, res) => {
    try {
      const { postId } = req.body;

      if (!postId) {
        return res.status(400).json({
          success: false,
          message: 'Post ID is required'
        });
      }

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      // Check if already bookmarked
      const existingBookmark = await Bookmark.findOne({
        user: req.user.id,
        post: postId
      });

      if (existingBookmark) {
        return res.status(400).json({
          success: false,
          message: 'Post already bookmarked'
        });
      }

      const bookmark = new Bookmark({
        user: req.user.id,
        post: postId
      });

      await bookmark.save();
      await bookmark.populate({
        path: 'post',
        populate: [
          { path: 'author', select: 'firstName lastName avatar' },
          { path: 'category', select: 'name slug' }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Post bookmarked successfully',
        data: { bookmark }
      });
    } catch (error) {
      logger.error('Error adding bookmark', { userId: req.user.id, postId: req.body.postId, error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error adding bookmark',
        error: error.message
      });
    }
  },

  // Remove bookmark
  removeBookmark: async (req, res) => {
    try {
      const { postId } = req.params;

      const bookmark = await Bookmark.findOneAndDelete({
        user: req.user.id,
        post: postId
      });

      if (!bookmark) {
        return res.status(404).json({
          success: false,
          message: 'Bookmark not found'
        });
      }

      res.json({
        success: true,
        message: 'Bookmark removed successfully'
      });
    } catch (error) {
      logger.error('Error removing bookmark', { userId: req.user.id, postId, error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error removing bookmark',
        error: error.message
      });
    }
  },

  // Check if post is bookmarked
  checkBookmark: async (req, res) => {
    try {
      const { postId } = req.params;

      const bookmark = await Bookmark.findOne({
        user: req.user.id,
        post: postId
      });

      res.json({
        success: true,
        data: { isBookmarked: !!bookmark }
      });
    } catch (error) {
      logger.error('Error checking bookmark', { userId: req.user.id, postId, error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error checking bookmark',
        error: error.message
      });
    }
  }
};

module.exports = bookmarkController;