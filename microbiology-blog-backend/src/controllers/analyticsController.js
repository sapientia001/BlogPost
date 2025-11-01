const analyticsService = require('../services/analyticsService');
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const logger = require('../utils/logger');
const Category = require('../models/Category'); // ADD THIS IMPORT

const analyticsController = {

 // Get admin dashboard stats
getAdminDashboard: async (req, res) => {
  try {
    console.log('📊 Fetching admin dashboard data');

    // Get total counts
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalCategories = await Category.countDocuments();
    const totalComments = await Comment.countDocuments();

    // Get recent counts (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentUsers = await User.countDocuments({
      createdAt: { $gte: oneWeekAgo }
    });

    const recentPosts = await Post.countDocuments({
      createdAt: { $gte: oneWeekAgo }
    });

    // Get popular posts (top 5 by views)
    const popularPosts = await Post.find({ 
      status: 'published',
      isOffensive: { $ne: true }
    })
      .populate('author', 'firstName lastName avatar')
      .populate('category', 'name')
      .sort({ views: -1, likes: -1 })
      .limit(5)
      .select('title views likes author category createdAt');

    const overview = {
      totalUsers,
      totalPosts,
      totalCategories,
      totalComments,
      recentUsers,
      recentPosts
    };

    console.log('✅ Admin dashboard stats generated:', {
      users: totalUsers,
      posts: totalPosts,
      categories: totalCategories,
      recentUsers,
      recentPosts
    });

    res.json({
      success: true,
      data: {
        overview,
        popularPosts
      }
    });
  } catch (error) {
    console.error('❌ Error fetching admin dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin dashboard data',
      error: error.message
    });
  }
}, 
  // Get researcher dashboard stats
getResearcherDashboard: async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    console.log('📊 Fetching researcher dashboard for user:', userId);

    // Get researcher's posts
    const researcherPosts = await Post.find({ author: userId })
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    // Calculate totals
    const totalPosts = researcherPosts.length;
    const totalViews = researcherPosts.reduce((sum, post) => sum + (post.views || 0), 0);
    const totalLikes = researcherPosts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
    const totalComments = researcherPosts.reduce((sum, post) => sum + (post.comments || 0), 0);

    // Recent posts (last 5)
    const recentPosts = researcherPosts.slice(0, 5).map(post => ({
      _id: post._id,
      title: post.title,
      status: post.status,
      views: post.views || 0,
      likes: post.likes?.length || 0,
      comments: post.comments || 0,
      createdAt: post.createdAt,
      publishedAt: post.status === 'published' ? post.createdAt : null,
      category: post.category
    }));

    // Monthly growth (current month vs previous month)
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentMonthPosts = await Post.countDocuments({
      author: userId,
      createdAt: { $gte: currentMonthStart }
    });

    const lastMonthPosts = await Post.countDocuments({
      author: userId,
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });

    const postsGrowth = lastMonthPosts > 0 
      ? Math.round(((currentMonthPosts - lastMonthPosts) / lastMonthPosts) * 100)
      : currentMonthPosts > 0 ? 100 : 0;

    // Popular posts (top 3 by views)
    const popularPosts = researcherPosts
      .filter(post => post.status === 'published')
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 3)
      .map(post => ({
        _id: post._id,
        title: post.title,
        views: post.views || 0,
        likes: post.likes?.length || 0
      }));

    const stats = {
      totals: {
        posts: totalPosts,
        views: totalViews,
        likes: totalLikes,
        comments: totalComments
      },
      growth: {
        posts: postsGrowth,
        postsCount: currentMonthPosts
      },
      recentPosts,
      popularPosts,
      period: days
    };

    console.log('✅ Researcher dashboard stats generated:', {
      posts: totalPosts,
      views: totalViews,
      likes: totalLikes,
      recentPosts: recentPosts.length
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error fetching researcher dashboard:', error);
    logger.error('Error fetching researcher dashboard', { 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
},
  // Get dashboard stats
  getDashboardStats: async (req, res) => {
    try {
      const { days = 30 } = req.query;

      const stats = await analyticsService.getDashboardStats(parseInt(days));

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error fetching dashboard stats', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard stats',
        error: error.message
      });
    }
  },

  // Get post analytics
  getPostAnalytics: async (req, res) => {
    try {
      const { days = 30 } = req.query;

      const analytics = await analyticsService.getPostAnalytics(days);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Error fetching post analytics', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error fetching post analytics',
        error: error.message
      });
    }
  },

  // Get user analytics
  getUserAnalytics: async (req, res) => {
    try {
      const userStats = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]);

      const statusStats = await User.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // User growth (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentUsers = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      res.json({
        success: true,
        data: {
          userStats,
          statusStats,
          recentUsers
        }
      });
    } catch (error) {
      logger.error('Error fetching user analytics', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error fetching user analytics',
        error: error.message
      });
    }
  },

  // Get engagement metrics
  getEngagementMetrics: async (req, res) => {
    try {
      const { days = 30 } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      // Posts created
      const postsCreated = await Post.countDocuments({
        createdAt: { $gte: startDate }
      });

      // Comments created
      const commentsCreated = await Comment.countDocuments({
        createdAt: { $gte: startDate }
      });

      // Total likes
      const posts = await Post.find({
        createdAt: { $gte: startDate }
      });
      const totalLikes = posts.reduce((sum, post) => sum + post.likes.length, 0);

      // Average read time
      const avgReadTime = posts.length > 0 
        ? posts.reduce((sum, post) => sum + post.readTime, 0) / posts.length 
        : 0;

      res.json({
        success: true,
        data: {
          period: days,
          postsCreated,
          commentsCreated,
          totalLikes,
          avgReadTime: Math.round(avgReadTime * 10) / 10
        }
      });
    } catch (error) {
      logger.error('Error fetching engagement metrics', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error fetching engagement metrics',
        error: error.message
      });
    }
  },

  // Get email performance stats
  getEmailStats: async (req, res) => {
    try {
      // This would typically integrate with an email service provider's API
      // For now, return mock data or basic stats
      const emailStats = {
        sent: 1250,
        delivered: 1180,
        opened: 890,
        clicked: 450,
        bounceRate: 2.5
      };

      res.json({
        success: true,
        data: { emailStats }
      });
    } catch (error) {
      logger.error('Error fetching email stats', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error fetching email stats',
        error: error.message
      });
    }
  },

  // Export data
  exportData: async (req, res) => {
    try {
      const { type } = req.params;
      const { format = 'json', startDate, endDate } = req.query;

      if (!['users', 'posts', 'comments', 'analytics'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
      }

      let data;
      switch (type) {
        case 'users':
          data = await User.find().select('-password').sort({ createdAt: -1 });
          break;
        case 'posts':
          data = await Post.find()
            .populate('author', 'firstName lastName')
            .populate('category', 'name')
            .sort({ createdAt: -1 });
          break;
        case 'comments':
          data = await Comment.find()
            .populate('author', 'firstName lastName')
            .populate('post', 'title')
            .sort({ createdAt: -1 });
          break;
        case 'analytics':
          data = await analyticsService.exportAnalytics('all', format, startDate, endDate);
          break;
      }

      // Set appropriate headers for download
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${type}-${new Date().toISOString().split('T')[0]}.csv`);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=${type}-${new Date().toISOString().split('T')[0]}.json`);
      }

      res.send(data);
    } catch (error) {
      logger.error('Error exporting data', { type: req.params.type, error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error exporting data',
        error: error.message
      });
    }
  }
};

module.exports = analyticsController;