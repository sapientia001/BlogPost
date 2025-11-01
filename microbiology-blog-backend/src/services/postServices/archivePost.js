const Post = require('../../models/Post');
const logger = require('../../utils/logger');

const archivePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason = '' } = req.body;

    console.log('🗄️ Archiving post:', postId, 'Reason:', reason, 'User:', req.user.id);

    const post = await Post.findById(postId);
    if (!post) {
      console.log('❌ Post not found for archiving:', postId);
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // ✅ FIX: Use .equals() for proper ObjectId comparison
    const isOwner = post.author.equals(req.user.id);
    const isAdmin = req.user.role === 'admin';
    
    console.log('👤 Archive authorization check:', {
      postAuthor: post.author.toString(),
      userId: req.user.id,
      isOwner,
      isAdmin,
      userRole: req.user.role
    });

    if (!isOwner && !isAdmin) {
      console.log('🚫 Unauthorized archive attempt by user:', req.user.id);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to archive this post'
      });
    }

    post.status = 'archived';
    post.archiveReason = reason;
    
    if (isAdmin && !isOwner) {
      post.moderatedBy = req.user.id;
      post.moderatedAt = new Date();
      console.log('👮 Admin moderation tracked for post archiving');
    }

    await post.save();

    await post.populate('category', 'name slug');
    await post.populate('author', 'firstName lastName avatar');
    await post.populate('moderatedBy', 'firstName lastName');

    console.log('✅ Post archived successfully:', postId);

    res.json({
      success: true,
      message: 'Post archived successfully',
      data: { post }
    });
  } catch (error) {
    console.error('❌ Error archiving post:', error);
    logger.error('Error archiving post', { 
      postId: req.params.postId, 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(500).json({
      success: false,
      message: 'Error archiving post',
      error: error.message
    });
  }
};

module.exports = archivePost;