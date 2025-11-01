const Post = require('../../models/Post');

const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      data: {
        postId,
        totalComments: post.comments || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching post comments',
      error: error.message
    });
  }
};

module.exports = getPostComments;