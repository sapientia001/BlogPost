const Post = require('../../models/Post');

const getPostsByAuthor = async (req, res) => {
  try {
    const { authorId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const query = { 
      author: authorId,
      isOffensive: false
    };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .populate('category', 'name slug')
      .populate('author', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: {
        posts,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching posts by author:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching posts by author',
      error: error.message
    });
  }
};

module.exports = getPostsByAuthor;