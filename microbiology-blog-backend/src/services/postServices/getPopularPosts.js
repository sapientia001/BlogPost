const Post = require('../../models/Post');

const getPopularPosts = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const posts = await Post.find({ 
      status: 'published',
      isOffensive: false
    })
    .populate('author', 'firstName lastName avatar')
    .populate('category', 'name slug')
    .sort({ views: -1, likes: -1 })
    .limit(parseInt(limit));

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
          avatar: postObj.author.avatar
        } : {
          _id: null,
          firstName: 'Unknown',
          lastName: 'Author',
          avatar: null
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

    console.log(`✅ Found ${transformedPosts.length} popular posts`);
    console.log('🔄 Transformed popular posts sample:', transformedPosts.slice(0, 1).map(p => ({
      id: p._id,
      title: p.title,
      image: p.image,
      likes: p.likes,
      views: p.views,
      author: p.author?.firstName,
      category: p.category?.name
    })));

    res.json({
      success: true,
      data: { posts: transformedPosts } // ✅ Use transformed posts
    });
  } catch (error) {
    console.error('❌ Error fetching popular posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching popular posts',
      error: error.message
    });
  }
};

module.exports = getPopularPosts;