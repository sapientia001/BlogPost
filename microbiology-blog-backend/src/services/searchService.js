const Post = require('../models/Post');
const User = require('../models/User');
const Category = require('../models/Category');
const analyticsService = require('./analyticsService');
const logger = require('../utils/logger');

class SearchService {
  // Search posts with advanced filtering
  async searchPosts(query, filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = '-createdAt'
      } = options;

      const searchQuery = this.buildSearchQuery(query, filters);
      const searchOptions = this.buildSearchOptions(page, limit, sort);

      const results = await Post.paginate(searchQuery, searchOptions);
      
      // Track search query for analytics
      if (query && query.trim()) {
        analyticsService.trackSearchQuery(
          query.trim(), 
          results.totalDocs,
          filters.userId
        );
      }

      logger.debug('Post search executed', {
        query,
        filters,
        resultsCount: results.totalDocs
      });

      return results;
    } catch (error) {
      logger.error('Failed to search posts', {
        query,
        error: error.message
      });
      throw error;
    }
  }

  // Build MongoDB search query
  buildSearchQuery(query, filters) {
    const searchQuery = { status: 'published' };

    // Text search
    if (query && query.trim()) {
      searchQuery.$text = { $search: query.trim() };
    }

    // Category filter
    if (filters.category) {
      searchQuery.category = filters.category;
    }

    // Author filter
    if (filters.author) {
      searchQuery.author = filters.author;
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      searchQuery.tags = { $in: filters.tags };
    }

    // Date range filter
    if (filters.startDate || filters.endDate) {
      searchQuery.createdAt = {};
      if (filters.startDate) {
        searchQuery.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        searchQuery.createdAt.$lte = new Date(filters.endDate);
      }
    }

    // Featured filter
    if (filters.featured !== undefined) {
      searchQuery.featured = filters.featured === 'true';
    }

    // Read time filter
    if (filters.maxReadTime) {
      searchQuery.readTime = { $lte: parseInt(filters.maxReadTime) };
    }

    return searchQuery;
  }

  // Build search options
  buildSearchOptions(page, limit, sort) {
    return {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      populate: [
        { 
          path: 'author', 
          select: 'firstName lastName avatar institution' 
        },
        { 
          path: 'category', 
          select: 'name slug' 
        }
      ]
    };
  }

  // Search users
  async searchUsers(query, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        role,
        institution
      } = options;

      const searchQuery = { status: 'active' };

      // Text search across name and email
      if (query && query.trim()) {
        searchQuery.$or = [
          { firstName: { $regex: query.trim(), $options: 'i' } },
          { lastName: { $regex: query.trim(), $options: 'i' } },
          { email: { $regex: query.trim(), $options: 'i' } }
        ];
      }

      // Role filter
      if (role) {
        searchQuery.role = role;
      }

      // Institution filter
      if (institution) {
        searchQuery.institution = { $regex: institution, $options: 'i' };
      }

      const searchOptions = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        select: '-password'
      };

      const results = await User.paginate(searchQuery, searchOptions);

      logger.debug('User search executed', {
        query,
        resultsCount: results.totalDocs
      });

      return results;
    } catch (error) {
      logger.error('Failed to search users', {
        query,
        error: error.message
      });
      throw error;
    }
  }

  // Search categories
  async searchCategories(query, options = {}) {
    try {
      const {
        page = 1,
        limit = 20
      } = options;

      const searchQuery = { isActive: true };

      if (query && query.trim()) {
        searchQuery.$or = [
          { name: { $regex: query.trim(), $options: 'i' } },
          { description: { $regex: query.trim(), $options: 'i' } }
        ];
      }

      const searchOptions = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { name: 1 }
      };

      const results = await Category.paginate(searchQuery, searchOptions);

      logger.debug('Category search executed', {
        query,
        resultsCount: results.totalDocs
      });

      return results;
    } catch (error) {
      logger.error('Failed to search categories', {
        query,
        error: error.message
      });
      throw error;
    }
  }

  // Get search suggestions
  async getSearchSuggestions(query, type = 'posts') {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      let suggestions = [];

      switch (type) {
        case 'posts':
          suggestions = await this.getPostSuggestions(query);
          break;
        case 'users':
          suggestions = await this.getUserSuggestions(query);
          break;
        case 'categories':
          suggestions = await this.getCategorySuggestions(query);
          break;
        default:
          suggestions = await this.getPostSuggestions(query);
      }

      logger.debug('Search suggestions generated', {
        query,
        type,
        suggestionsCount: suggestions.length
      });

      return suggestions;
    } catch (error) {
      logger.error('Failed to get search suggestions', {
        query,
        type,
        error: error.message
      });
      return [];
    }
  }

  // Get post search suggestions
  async getPostSuggestions(query) {
    const posts = await Post.find({
      $text: { $search: query },
      status: 'published'
    })
    .select('title slug excerpt category')
    .populate('category', 'name')
    .limit(5)
    .sort({ score: { $meta: 'textScore' } });

    return posts.map(post => ({
      type: 'post',
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      category: post.category?.name
    }));
  }

  // Get user search suggestions
  async getUserSuggestions(query) {
    const users = await User.find({
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } }
      ],
      status: 'active'
    })
    .select('firstName lastName avatar institution role')
    .limit(5);

    return users.map(user => ({
      type: 'user',
      name: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar,
      institution: user.institution,
      role: user.role
    }));
  }

  // Get category search suggestions
  async getCategorySuggestions(query) {
    const categories = await Category.find({
      name: { $regex: query, $options: 'i' },
      isActive: true
    })
    .select('name slug description')
    .limit(5);

    return categories.map(category => ({
      type: 'category',
      name: category.name,
      slug: category.slug,
      description: category.description
    }));
  }

  // Get popular search terms
  async getPopularSearchTerms(days = 7, limit = 10) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const popularTerms = await Analytics.aggregate([
        {
          $match: {
            type: 'search_queries',
            metric: { $regex: /^term_/ },
            date: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$metric',
            count: { $sum: '$value' }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: limit
        },
        {
          $project: {
            term: { $substr: ['$_id', 5, -1] }, // Remove 'term_' prefix
            count: 1
          }
        }
      ]);

      return popularTerms;
    } catch (error) {
      logger.error('Failed to get popular search terms', {
        days,
        error: error.message
      });
      return [];
    }
  }
}

module.exports = new SearchService();