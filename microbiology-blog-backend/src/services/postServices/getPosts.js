const Post = require('../../models/Post');
const Category = require('../../models/Category');
const User = require('../../models/User');

const getPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      search,
      sort = '-createdAt',
      author,
      includeAll = false
    } = req.query;

    let query = {};
    const isAdmin = req.user && req.user.role === 'admin';
    const isResearcher = req.user && req.user.role === 'researcher';
    
    // Always filter offensive content for non-admin users
    if (!isAdmin) {
      query.isOffensive = false;
    }
    
    // Status filtering logic
    if (status && status !== 'all') {
      // If specific status is requested, use it
      query.status = status;
    } else {
      // If includeAll is true OR user is viewing their own posts, show all statuses
      const isViewingOwnPosts = author && req.user && (author === req.user.id || author === req.user._id);
      
      if (includeAll || isViewingOwnPosts) {
        // No status filter - show all posts (published, draft, archived)
      } else if (!req.user) {
        // Public user - only show published
        query.status = 'published';
      } else if (isAdmin || isResearcher) {
        // Admin/Researcher viewing others' posts - only show published
        query.status = 'published';
      } else {
        // Regular authenticated user - only show published
        query.status = 'published';
      }
    }

    // Category filtering
    if (category && category !== 'all') {
      const categoryDoc = await Category.findOne({ 
        $or: [
          { slug: category },
          { _id: category }
        ]
      });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
    }

    // Author filtering
    if (author) {
      query.author = author;
    }

    // Search functionality
    if (search) {
      const matchingAuthors = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      const authorIds = matchingAuthors.map(author => author._id);

      const searchConditions = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];

      if (authorIds.length > 0) {
        searchConditions.push({ author: { $in: authorIds } });
      }

      if (Object.keys(query).length > 0) {
        query = {
          $and: [
            query,
            { $or: searchConditions }
          ]
        };
      } else {
        query.$or = searchConditions;
      }
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count and posts
    const total = await Post.countDocuments(query);

    const posts = await Post.find(query)
      .populate('author', 'firstName lastName avatar institution')
      .populate('category', 'name slug')
      .populate('offenseReportedBy', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Transform data to match frontend expectations
    const transformedPosts = posts.map(post => {
      const postObj = post.toObject ? post.toObject() : post;
      
      return {
        ...postObj,
        // Map featuredImage to image for frontend compatibility
        image: postObj.featuredImage,
        // Ensure likes is a count, not an array
        likes: Array.isArray(postObj.likes) ? postObj.likes.length : postObj.likes || 0,
        // Ensure author object has consistent structure
        author: postObj.author ? {
          _id: postObj.author._id,
          firstName: postObj.author.firstName || 'Unknown',
          lastName: postObj.author.lastName || 'Author',
          avatar: postObj.author.avatar,
          institution: postObj.author.institution
        } : {
          _id: null,
          firstName: 'Unknown',
          lastName: 'Author',
          avatar: null,
          institution: null
        },
        // Ensure category object has consistent structure
        category: postObj.category ? {
          _id: postObj.category._id,
          name: postObj.category.name || 'Uncategorized',
          slug: postObj.category.slug
        } : {
          _id: null,
          name: 'Uncategorized',
          slug: 'uncategorized'
        },
        // Ensure other fields have proper defaults
        views: postObj.views || 0,
        comments: postObj.comments || 0,
        excerpt: postObj.excerpt || '',
        tags: Array.isArray(postObj.tags) ? postObj.tags : []
      };
    });

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        posts: transformedPosts,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: totalPages
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching posts',
      error: error.message,
      data: null
    });
  }
};

module.exports = getPosts;