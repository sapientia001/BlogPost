const Analytics = require('../models/Analytics');
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Category = require('../models/Category');
const logger = require('../utils/logger');

class AnalyticsService {
  // Track page view
  async trackPageView(page, userId = null) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await Analytics.findOneAndUpdate(
        {
          date: today,
          type: 'page_views',
          metric: page
        },
        {
          $inc: { value: 1 },
          $set: { details: { lastUserId: userId } }
        },
        { upsert: true, new: true }
      );

      logger.debug('Page view tracked', { page, userId });
    } catch (error) {
      logger.error('Failed to track page view', { page, error: error.message });
    }
  }

  // Track user registration
  async trackUserRegistration(user) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await Analytics.findOneAndUpdate(
        {
          date: today,
          type: 'user_registrations',
          metric: 'total'
        },
        {
          $inc: { value: 1 },
          $set: { 
            details: { 
              role: user.role,
              institution: user.institution 
            }
          }
        },
        { upsert: true, new: true }
      );

      logger.debug('User registration tracked', { userId: user._id, role: user.role });
    } catch (error) {
      logger.error('Failed to track user registration', { userId: user._id, error: error.message });
    }
  }

  // Track post view
  async trackPostView(post, userId = null) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Track total post views
      await Analytics.findOneAndUpdate(
        {
          date: today,
          type: 'post_views',
          metric: 'total'
        },
        {
          $inc: { value: 1 }
        },
        { upsert: true, new: true }
      );

      // Track views by category
      await Analytics.findOneAndUpdate(
        {
          date: today,
          type: 'post_views',
          metric: `category_${post.category}`
        },
        {
          $inc: { value: 1 }
        },
        { upsert: true, new: true }
      );

      logger.debug('Post view tracked', { 
        postId: post._id, 
        category: post.category,
        userId 
      });
    } catch (error) {
      logger.error('Failed to track post view', { postId: post._id, error: error.message });
    }
  }

  // Track post like
  async trackPostLike(post, userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await Analytics.findOneAndUpdate(
        {
          date: today,
          type: 'post_likes',
          metric: 'total'
        },
        {
          $inc: { value: 1 }
        },
        { upsert: true, new: true }
      );

      logger.debug('Post like tracked', { postId: post._id, userId });
    } catch (error) {
      logger.error('Failed to track post like', { postId: post._id, error: error.message });
    }
  }

  // Track comment
  async trackComment(comment, userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await Analytics.findOneAndUpdate(
        {
          date: today,
          type: 'comments',
          metric: 'total'
        },
        {
          $inc: { value: 1 }
        },
        { upsert: true, new: true }
      );

      logger.debug('Comment tracked', { commentId: comment._id, userId });
    } catch (error) {
      logger.error('Failed to track comment', { commentId: comment._id, error: error.message });
    }
  }

  // Track search query
  async trackSearchQuery(query, resultsCount, userId = null) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await Analytics.findOneAndUpdate(
        {
          date: today,
          type: 'search_queries',
          metric: 'total'
        },
        {
          $inc: { value: 1 }
        },
        { upsert: true, new: true }
      );

      // Track popular search terms (simplified - in production, use a separate collection)
      if (query && query.length > 2) {
        await Analytics.findOneAndUpdate(
          {
            date: today,
            type: 'search_queries',
            metric: `term_${query.toLowerCase()}`
          },
          {
            $inc: { value: 1 },
            $set: { details: { resultsCount, userId } }
          },
          { upsert: true, new: true }
        );
      }

      logger.debug('Search query tracked', { query, resultsCount, userId });
    } catch (error) {
      logger.error('Failed to track search query', { query, error: error.message });
    }
  }

  // Get analytics for dashboard - UPDATED TO MATCH FRONTEND EXPECTATIONS
  async getDashboardStats(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Total counts
      const totalPosts = await Post.countDocuments();
      const totalUsers = await User.countDocuments();
      const totalComments = await Comment.countDocuments();
      const totalCategories = await Category.countDocuments();

      // Recent activity (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const recentPosts = await Post.countDocuments({ 
        createdAt: { $gte: weekAgo } 
      });
      const recentUsers = await User.countDocuments({ 
        createdAt: { $gte: weekAgo } 
      });
      const recentComments = await Comment.countDocuments({ 
        createdAt: { $gte: weekAgo } 
      });

      // Popular posts
      const popularPosts = await Post.find({ status: 'published' })
        .select('title views likes comments createdAt author category')
        .sort({ views: -1 })
        .limit(5)
        .populate('author', 'firstName lastName avatar')
        .populate('category', 'name slug');

      // User growth data
      const userGrowth = await Analytics.aggregate([
        {
          $match: {
            type: 'user_registrations',
            date: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$date',
            registrations: { $sum: '$value' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      // Post views data
      const postViews = await Analytics.aggregate([
        {
          $match: {
            type: 'post_views',
            metric: 'total',
            date: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$date',
            views: { $sum: '$value' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      // RETURN STRUCTURE THAT MATCHES FRONTEND EXPECTATIONS
      const stats = {
        overview: {
          totalUsers,
          recentUsers, 
          totalPosts,
          recentPosts,
          totalCategories,
          totalComments
        },
        popularPosts: popularPosts.map(post => ({
          _id: post._id,
          title: post.title,
          views: post.views || 0,
          likes: post.likes?.length || 0,
          comments: post.comments || 0,
          author: post.author,
          category: post.category,
          createdAt: post.createdAt
        })),
        // Keep charts data for future use
        charts: {
          userGrowth,
          postViews
        }
      };

      logger.debug('Dashboard stats generated', { days });

      return stats;
    } catch (error) {
      logger.error('Failed to get dashboard stats', { error: error.message });
      throw error;
    }
  }

  // Get post analytics
  async getPostAnalytics(postId, days = 30) {
    try {
      const post = await Post.findById(postId)
        .populate('author', 'firstName lastName')
        .populate('category', 'name');

      if (!post) {
        throw new Error('Post not found');
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get daily views for the post
      const dailyViews = await Analytics.aggregate([
        {
          $match: {
            type: 'post_views',
            metric: `category_${post.category._id}`,
            date: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$date',
            views: { $sum: '$value' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      // Get engagement metrics
      const engagement = {
        views: post.views,
        likes: post.likes.length,
        comments: post.comments,
        readTime: post.readTime
      };

      const analytics = {
        post,
        engagement,
        dailyViews,
        period: days
      };

      logger.debug('Post analytics generated', { postId, days });

      return analytics;
    } catch (error) {
      logger.error('Failed to get post analytics', { postId, error: error.message });
      throw error;
    }
  }

  // Export analytics data
  async exportAnalytics(type, format = 'json', startDate, endDate) {
    try {
      const matchStage = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };

      if (type !== 'all') {
        matchStage.type = type;
      }

      const data = await Analytics.find(matchStage).sort({ date: 1, type: 1 });

      let exportData;
      if (format === 'csv') {
        // Convert to CSV format
        const csvHeaders = 'Date,Type,Metric,Value,Details\n';
        const csvRows = data.map(item => 
          `"${item.date.toISOString().split('T')[0]}","${item.type}","${item.metric}",${item.value},"${JSON.stringify(item.details)}"`
        ).join('\n');
        exportData = csvHeaders + csvRows;
      } else {
        // JSON format
        exportData = data;
      }

      logger.debug('Analytics data exported', { 
        type, 
        format, 
        startDate, 
        endDate,
        recordCount: data.length 
      });

      return exportData;
    } catch (error) {
      logger.error('Failed to export analytics', { 
        type, 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = new AnalyticsService();