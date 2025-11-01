const Post = require('../../models/Post');
const logger = require('../../utils/logger');

const unarchivePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { status = 'draft' } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check authorization
    const isOwner = post.author.equals(req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to unarchive this post'
      });
    }

    if (!['draft', 'published'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "draft" or "published"'
      });
    }

    // Update post
    post.status = status;
    post.archiveReason = '';
    
    if (status === 'published' && !post.publishedAt) {
      post.publishedAt = new Date();
    }
    
    if (isAdmin && !isOwner) {
      post.moderatedBy = req.user.id;
      post.moderatedAt = new Date();
    }
    
    await post.save();

    await post.populate('category', 'name slug');
    await post.populate('author', 'firstName lastName avatar');
    await post.populate('moderatedBy', 'firstName lastName');

    res.json({
      success: true,
      message: `Post ${status === 'published' ? 'published' : 'moved to drafts'} successfully`,
      data: { post }
    });
  } catch (error) {
    logger.error('Error unarchiving post', { 
      postId: req.params.postId, 
      userId: req.user.id, 
      error: error.message 
    });
    res.status(500).json({
      success: false,
      message: 'Error unarchiving post',
      error: error.message
    });
  }
};

module.exports = unarchivePost;