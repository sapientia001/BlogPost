const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { validateCommentCreation } = require('../utils/validators');
const notificationService = require('../services/notificationService');
const analyticsService = require('../services/analyticsService');
const logger = require('../utils/logger');

const commentController = {
  // Get comments for a post - FIXED: Handle both ID and slug
  getPostComments: async (req, res) => {
    try {
      const { postIdentifier } = req.params; // CHANGED from postId to postIdentifier
      const { page = 1, limit = 20 } = req.query;

      console.log('🔍 Fetching comments for post:', postIdentifier, 'Page:', page, 'Limit:', limit);

      let post;
      
      // Check if it's a valid MongoDB ObjectId (24 hex characters)
      if (postIdentifier && postIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
        // It's an ObjectId - search by ID
        post = await Post.findById(postIdentifier);
      } else {
        // It's a slug - search by slug
        post = await Post.findOne({ slug: postIdentifier });
      }

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Use post._id for querying comments
      const comments = await Comment.find({ 
        post: post._id, 
        parentComment: null, // Only top-level comments
        status: 'active' 
      })
      .populate('author', 'firstName lastName avatar')
      .populate({
        path: 'replies',
        populate: { path: 'author', select: 'firstName lastName avatar' },
        options: { sort: { createdAt: 1 } }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

      const total = await Comment.countDocuments({ 
        post: post._id, 
        parentComment: null,
        status: 'active' 
      });

      console.log(`✅ Found ${comments.length} comments out of ${total} total for post: ${post.title}`);

      res.json({
        success: true,
        data: {
          comments,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
          post: {
            id: post._id,
            title: post.title,
            slug: post.slug
          }
        }
      });
    } catch (error) {
      console.error('❌ Error fetching comments:', error);
      logger.error('Error fetching comments', { postIdentifier, error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error fetching comments',
        error: error.message
      });
    }
  },

  // Create comment - FIXED: Handle both ID and slug
  createComment: async (req, res) => {
    try {
      const { postIdentifier } = req.params; // CHANGED from postId to postIdentifier
      const { content, parentComment } = req.body;

      console.log('💬 Creating comment for post:', postIdentifier, 'Parent:', parentComment);

      // Validate input
      const validation = validateCommentCreation({ content });
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      let post;
      
      // Check if it's a valid MongoDB ObjectId (24 hex characters)
      if (postIdentifier && postIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
        // It's an ObjectId - search by ID
        post = await Post.findById(postIdentifier);
      } else {
        // It's a slug - search by slug
        post = await Post.findOne({ slug: postIdentifier });
      }

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      const comment = new Comment({
        content,
        author: req.user.id,
        post: post._id, // Use the actual post ID
        parentComment: parentComment || null
      });

      await comment.save();

      // Update post comment count if it's a top-level comment
      if (!parentComment) {
        post.comments = (post.comments || 0) + 1;
        await post.save();
        console.log('✅ Updated post comment count:', post.comments);
      }

      // If it's a reply, add to parent comment's replies
      let parentCommentAuthor = null;
      if (parentComment) {
        const parent = await Comment.findById(parentComment).populate('author');
        if (parent) {
          parent.replies.push(comment._id);
          await parent.save();
          parentCommentAuthor = parent.author;
          console.log('✅ Added reply to parent comment');
        }
      }

      await comment.populate('author', 'firstName lastName avatar');

      // Send notifications (if implemented)
      if (notificationService && notificationService.notifyNewComment) {
        try {
          await notificationService.notifyNewComment(
            comment, 
            post, 
            req.user, 
            parentCommentAuthor
          );
        } catch (notifyError) {
          console.error('Notification error:', notifyError);
        }
      }

      // Track analytics (if implemented)
      if (analyticsService && analyticsService.trackComment) {
        try {
          await analyticsService.trackComment(comment, req.user.id);
        } catch (analyticsError) {
          console.error('Analytics error:', analyticsError);
        }
      }

      console.log('✅ Comment created successfully:', comment._id);

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: { comment }
      });
    } catch (error) {
      console.error('❌ Error creating comment:', error);
      logger.error('Error creating comment', { postIdentifier, userId: req.user.id, error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error creating comment',
        error: error.message
      });
    }
  },

  // Update comment (no changes needed)
  updateComment: async (req, res) => {
    try {
      const { commentId } = req.params;
      const { content } = req.body;

      console.log('✏️ Updating comment:', commentId);

      // Validate input
      const validation = validateCommentCreation({ content });
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      const comment = await Comment.findById(commentId);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Check ownership
      if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this comment'
        });
      }

      comment.content = content;
      comment.isEdited = true;
      await comment.save();

      await comment.populate('author', 'firstName lastName avatar');

      console.log('✅ Comment updated successfully');

      res.json({
        success: true,
        message: 'Comment updated successfully',
        data: { comment }
      });
    } catch (error) {
      console.error('❌ Error updating comment:', error);
      logger.error('Error updating comment', { commentId, userId: req.user.id, error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error updating comment',
        error: error.message
      });
    }
  },

  // Delete comment (no changes needed)
  deleteComment: async (req, res) => {
    try {
      const { commentId } = req.params;

      console.log('🗑️ Deleting comment:', commentId);

      const comment = await Comment.findById(commentId);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Check ownership or admin role
      if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this comment'
        });
      }

      // If it's a top-level comment, update post comment count
      if (!comment.parentComment) {
        await Post.findByIdAndUpdate(comment.post, {
          $inc: { comments: -1 }
        });
        console.log('✅ Decremented post comment count');
      }

      await Comment.findByIdAndDelete(commentId);

      console.log('✅ Comment deleted successfully');

      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      console.error('❌ Error deleting comment:', error);
      logger.error('Error deleting comment', { commentId, userId: req.user.id, error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error deleting comment',
        error: error.message
      });
    }
  },

  // Like/Unlike comment (no changes needed)
  toggleLike: async (req, res) => {
    try {
      const { commentId } = req.params;
      const userId = req.user.id;

      console.log('❤️ Toggling like for comment:', commentId, 'User:', userId);

      const comment = await Comment.findById(commentId);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      const likeIndex = comment.likes.indexOf(userId);

      if (likeIndex > -1) {
        // Unlike
        comment.likes.splice(likeIndex, 1);
        console.log('✅ Comment unliked');
      } else {
        // Like
        comment.likes.push(userId);
        console.log('✅ Comment liked');
      }

      await comment.save();

      res.json({
        success: true,
        message: likeIndex > -1 ? 'Comment unliked' : 'Comment liked',
        data: { likes: comment.likes.length }
      });
    } catch (error) {
      console.error('❌ Error toggling comment like:', error);
      logger.error('Error toggling comment like', { commentId, userId, error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error toggling like',
        error: error.message
      });
    }
  },

  // Reply to comment (no changes needed)
  replyToComment: async (req, res) => {
    try {
      const { commentId } = req.params;
      const { content } = req.body;

      console.log('💬 Replying to comment:', commentId);

      // Validate input
      const validation = validateCommentCreation({ content });
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      const parentComment = await Comment.findById(commentId).populate('post');
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }

      const reply = new Comment({
        content,
        author: req.user.id,
        post: parentComment.post._id,
        parentComment: commentId
      });

      await reply.save();

      // Add reply to parent comment
      parentComment.replies.push(reply._id);
      await parentComment.save();

      await reply.populate('author', 'firstName lastName avatar');

      // Send notification to parent comment author (if implemented)
      if (notificationService && notificationService.notifyNewComment) {
        try {
          await notificationService.notifyNewComment(
            reply,
            parentComment.post,
            req.user,
            parentComment.author
          );
        } catch (notifyError) {
          console.error('Notification error:', notifyError);
        }
      }

      // Track analytics (if implemented)
      if (analyticsService && analyticsService.trackComment) {
        try {
          await analyticsService.trackComment(reply, req.user.id);
        } catch (analyticsError) {
          console.error('Analytics error:', analyticsError);
        }
      }

      console.log('✅ Reply created successfully:', reply._id);

      res.status(201).json({
        success: true,
        message: 'Reply added successfully',
        data: { comment: reply }
      });
    } catch (error) {
      console.error('❌ Error replying to comment:', error);
      logger.error('Error replying to comment', { commentId, userId: req.user.id, error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error replying to comment',
        error: error.message
      });
    }
  },

  // Get all comments (admin only) - FIXED: Add admin moderation features
  getAllComments: async (req, res) => {
    try {
      const { page = 1, limit = 20, status, postId, authorId } = req.query;

      const query = {};
      if (status && status !== 'all') query.status = status;
      if (postId) query.post = postId;
      if (authorId) query.author = authorId;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const comments = await Comment.find(query)
        .populate('author', 'firstName lastName avatar email')
        .populate('post', 'title slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      const total = await Comment.countDocuments(query);

      // Get statistics for admin dashboard
      const stats = {
        total: await Comment.countDocuments({}),
        active: await Comment.countDocuments({ status: 'active' }),
        flagged: await Comment.countDocuments({ status: 'flagged' }),
        removed: await Comment.countDocuments({ status: 'removed' })
      };

      res.json({
        success: true,
        data: {
          comments,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
          stats
        }
      });
    } catch (error) {
      console.error('❌ Error fetching all comments:', error);
      logger.error('Error fetching all comments', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error fetching comments',
        error: error.message
      });
    }
  },

  // Moderate comment (admin only) - ENHANCED with more options
  moderateComment: async (req, res) => {
    try {
      const { commentId } = req.params;
      const { status, reason } = req.body;

      if (!['active', 'flagged', 'removed'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      const comment = await Comment.findByIdAndUpdate(
        commentId,
        { 
          status,
          moderation: {
            moderatedBy: req.user.id,
            moderatedAt: new Date(),
            reason: reason || ''
          }
        },
        { new: true }
      ).populate('author', 'firstName lastName avatar email')
       .populate('post', 'title slug');

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      console.log('✅ Comment moderated:', commentId, 'Status:', status, 'By:', req.user.id);

      res.json({
        success: true,
        message: 'Comment moderated successfully',
        data: { comment }
      });
    } catch (error) {
      console.error('❌ Error moderating comment:', error);
      logger.error('Error moderating comment', { commentId, error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error moderating comment',
        error: error.message
      });
    }
  }
};

module.exports = commentController;