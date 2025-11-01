const Post = require('../../models/Post');
const logger = require('../../utils/logger');

const removeOffense = async (req, res) => {
  try {
    const { postId } = req.params;

    console.log('✅ Removing offense from post:', postId, 'Admin:', req.user.id);

    const post = await Post.findById(postId);
    if (!post) {
      console.log('❌ Post not found for offense removal:', postId);
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (req.user.role !== 'admin') {
      console.log('🚫 Non-admin attempt to remove offense:', req.user.id);
      return res.status(403).json({
        success: false,
        message: 'Only administrators can remove offenses from posts'
      });
    }

    post.isOffensive = false;
    post.offenseReason = '';
    post.offenseResolvedBy = req.user.id;
    post.offenseResolvedAt = new Date();

    await post.save();

    await post.populate('category', 'name slug');
    await post.populate('author', 'firstName lastName avatar');
    await post.populate('offenseResolvedBy', 'firstName lastName');

    console.log('✅ Offense removed successfully from post:', postId);

    res.json({
      success: true,
      message: 'Offense removed and post restored to public view',
      data: { post }
    });
  } catch (error) {
    console.error('❌ Error removing offense from post:', error);
    logger.error('Error removing offense from post', { 
      postId: req.params.postId, 
      adminId: req.user.id, 
      error: error.message 
    });
    res.status(500).json({
      success: false,
      message: 'Error removing offense from post',
      error: error.message
    });
  }
};

module.exports = removeOffense;