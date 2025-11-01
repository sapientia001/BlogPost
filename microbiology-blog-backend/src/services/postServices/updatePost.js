const Post = require('../../models/Post');
const uploadService = require('../../services/uploadService');

const updatePost = async (req, res) => {
  let oldImageUrl = null;
  let newImageUrl = null;
  
  try {
    const { postId } = req.params;
    const updateData = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // ✅ FIX: Use .equals() for proper ObjectId comparison
    const isOwner = post.author.equals(req.user.id);
    const isAdmin = req.user.role === 'admin';
    
    console.log('👤 Update authorization check:', {
      postAuthor: post.author.toString(),
      userId: req.user.id,
      isOwner,
      isAdmin,
      userRole: req.user.role,
      action: updateData.status === 'published' ? 'publishing' : 'updating'
    });

    if (!isAdmin && !isOwner) {
      console.log('🚫 Unauthorized update attempt by user:', req.user.id);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }

    if (updateData.image) {
      oldImageUrl = post.featuredImage;
    }

    if (updateData.image && updateData.image.startsWith('data:image')) {
      try {
        const uploadResult = await uploadService.uploadBase64Image(updateData.image, 'posts');
        if (uploadResult.success) {
          newImageUrl = uploadResult.url;
          updateData.featuredImage = newImageUrl;
        } else {
          delete updateData.image;
        }
      } catch (uploadError) {
        delete updateData.image;
      }
    }

    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    if (updateData.status === 'published' && post.status !== 'published') {
      updateData.publishedAt = new Date();
      console.log('📅 Publishing post - setting publishedAt date');
    }

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== null) {
        if (key === 'image') {
          post.featuredImage = updateData[key];
        } else {
          post[key] = updateData[key];
        }
      }
    });

    post.lastEditedAt = new Date();
    await post.save();
    
    await post.populate('category', 'name slug');
    await post.populate('author', 'firstName lastName avatar');

    if (oldImageUrl && newImageUrl) {
      try {
        const publicId = oldImageUrl.split('/').pop().split('.')[0];
        await uploadService.deleteFile(publicId);
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup old image:', cleanupError);
      }
    }

    console.log('✅ Post updated successfully:', postId, 'New status:', updateData.status);

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: { post }
    });
  } catch (error) {
    console.error('❌ Error updating post:', error);
    
    if (newImageUrl) {
      try {
        const publicId = newImageUrl.split('/').pop().split('.')[0];
        await uploadService.deleteFile(publicId);
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup new image:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating post',
      error: error.message
    });
  }
};

module.exports = updatePost;