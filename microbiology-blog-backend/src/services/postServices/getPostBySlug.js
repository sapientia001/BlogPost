const Post = require('../../models/Post');
const logger = require('../../utils/logger');

const getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await Post.findOne({ slug })
      .populate('author', 'firstName lastName avatar institution bio')
      .populate('category', 'name slug')
      .populate('likes', 'firstName lastName avatar');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.status !== 'published' && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    post.views += 1;
    await post.save();

    res.json({
      success: true,
      data: { post }
    });
  } catch (error) {
    logger.error('Error fetching post by slug', { slug, error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error fetching post',
      error: error.message
    });
  }
};

module.exports = getPostBySlug;