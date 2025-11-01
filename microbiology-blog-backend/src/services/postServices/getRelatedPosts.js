const Post = require('../../models/Post');

const getRelatedPosts = async (req, res) => {
  try {
    const { postId } = req.params;
    const { limit = 4 } = req.query;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const relatedPosts = await Post.find({
      _id: { $ne: postId },
      category: post.category,
      status: 'published',
      isOffensive: false
    })
    .populate('author', 'firstName lastName avatar')
    .populate('category', 'name slug')
    .sort({ views: -1, createdAt: -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: { posts: relatedPosts }
    });
  } catch (error) {
    console.error('❌ Error fetching related posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching related posts',
      error: error.message
    });
  }
};

module.exports = getRelatedPosts;