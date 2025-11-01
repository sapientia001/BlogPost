const Post = require('../../models/Post');
const uploadService = require('../../services/uploadService');

const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const isOwner = post.author.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    if (post.featuredImage) {
      try {
        const publicId = post.featuredImage.split('/').pop().split('.')[0];
        await uploadService.deleteFile(publicId);
      } catch (imageError) {
        console.error('❌ Failed to delete post image:', imageError);
      }
    }

    await Post.findByIdAndDelete(postId);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting post',
      error: error.message
    });
  }
};

module.exports = deletePost;