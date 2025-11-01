const Post = require('../../models/Post');
const Category = require('../../models/Category');
const User = require('../../models/User');
const logger = require('../../utils/logger');

const searchPosts = async (req, res) => {
  try {
    const { q: query, page = 1, limit = 10, searchType = 'all', category, sort = '-createdAt' } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    console.log('🔍 Enhanced search for:', query, 'Type:', searchType, 'Category:', category);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let searchQuery = {
      status: 'published',
      isOffensive: false
    };

    if (category) {
      const categoryDoc = await Category.findOne({ 
        $or: [
          { slug: category },
          { _id: category }
        ]
      });
      if (categoryDoc) {
        searchQuery.category = categoryDoc._id;
        console.log('✅ Category filter applied in search:', categoryDoc.name);
      }
    }

    if (searchType === 'author') {
      const matchingAuthors = await User.find({
        $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } }
        ]
      }).select('_id');

      const authorIds = matchingAuthors.map(author => author._id);
      
      if (authorIds.length > 0) {
        searchQuery.author = { $in: authorIds };
        console.log('👥 Author search found', authorIds.length, 'authors');
      } else {
        return res.json({
          success: true,
          data: {
            posts: [],
            total: 0,
            page: pageNum,
            limit: limitNum,
            totalPages: 0,
            searchInfo: {
              query,
              searchType,
              matchedAuthors: 0
            }
          }
        });
      }
    } 
    else if (searchType === 'title') {
      searchQuery.title = { $regex: query, $options: 'i' };
      console.log('📝 Title-only search');
    } 
    else if (searchType === 'content') {
      searchQuery.content = { $regex: query, $options: 'i' };
      console.log('📄 Content-only search');
    } 
    else if (searchType === 'tags') {
      searchQuery.tags = { $in: [new RegExp(query, 'i')] };
      console.log('🏷️ Tags-only search');
    } 
    else {
      const matchingAuthors = await User.find({
        $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } }
        ]
      }).select('_id');

      const authorIds = matchingAuthors.map(author => author._id);
      
      searchQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { excerpt: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ];

      if (authorIds.length > 0) {
        searchQuery.$or.push({ author: { $in: authorIds } });
        console.log('✅ Added author search with', authorIds.length, 'matching authors');
      }
      
      console.log('🌐 Comprehensive search across all fields');
    }

    console.log('🔍 Final search query:', JSON.stringify(searchQuery, null, 2));

    const total = await Post.countDocuments(searchQuery);
    const posts = await Post.find(searchQuery)
      .populate('author', 'firstName lastName avatar institution')
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // ✅ FIX: Transform data to match frontend expectations
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
        tags: Array.isArray(postObj.tags) ? postObj.tags : [],
        // Add featuredImage alias for backward compatibility
        featuredImage: postObj.featuredImage
      };
    });

    console.log(`✅ Search found ${posts.length} posts for query: "${query}"`);
    console.log('🔄 Transformed search results sample:', transformedPosts.slice(0, 2).map(p => ({
      title: p.title,
      image: p.image,
      likes: p.likes,
      author: p.author?.firstName,
      category: p.category?.name
    })));

    if (posts.length > 0) {
      console.log('📝 Sample results:', posts.slice(0, 2).map(p => ({
        title: p.title,
        author: p.author?.firstName,
        category: p.category?.name
      })));
    }

    res.json({
      success: true,
      data: {
        posts: transformedPosts, // ✅ Use transformed posts
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        searchInfo: {
          query,
          searchType,
          resultsCount: posts.length
        }
      }
    });
  } catch (error) {
    console.error('❌ Error in enhanced search:', error);
    logger.error('Error searching posts', { 
      query: req.query.q, 
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Error searching posts',
      error: error.message
    });
  }
};

module.exports = searchPosts;