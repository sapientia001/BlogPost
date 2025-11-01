const Post = require('../../models/Post');
const logger = require('../../utils/logger');

const markAsOffensive = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason = '' } = req.body;

    console.log('🚫 Marking post as offensive:', postId, 'Reason:', reason, 'Admin:', req.user.id);

    const post = await Post.findById(postId);
    if (!post) {
      console.log('❌ Post not found for offense marking:', postId);
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (req.user.role !== 'admin') {
      console.log('🚫 Non-admin attempt to mark post as offensive:', req.user.id);
      return res.status(403).json({
        success: false,
        message: 'Only administrators can mark posts as offensive'
      });
    }

    post.isOffensive = true;
    post.offenseReason = reason;
    post.offenseReportedBy = req.user.id;
    post.offenseReportedAt = new Date();

    await post.save();

    await post.populate('category', 'name slug');
    await post.populate('author', 'firstName lastName avatar');
    await post.populate('offenseReportedBy', 'firstName lastName');

    console.log('✅ Post marked as offensive successfully:', postId);

    res.json({
      success: true,
      message: 'Post marked as offensive and removed from public view',
      data: { post }
    });
  } catch (error) {
    console.error('❌ Error marking post as offensive:', error);
    logger.error('Error marking post as offensive', { 
      postId: req.params.postId, 
      adminId: req.user.id, 
      error: error.message 
    });
    res.status(500).json({
      success: false,
      message: 'Error marking post as offensive',
      error: error.message
    });
  }
};

module.exports = markAsOffensive;