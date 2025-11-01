const Post = require('../../models/Post');

const incrementViews = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findByIdAndUpdate(
      postId,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      data: { views: post.views }
    });
  } catch (error) {
    console.error('❌ Error incrementing views:', error);
    res.status(500).json({
      success: false,
      message: 'Error incrementing views',
      error: error.message
    });
  }
};

module.exports = incrementViews;