const Post = require('../../models/Post');
const Category = require('../../models/Category');
const uploadService = require('../../services/uploadService');

const createPost = async (req, res) => {
  let uploadedImageUrl = null;
  
  try {
    const { 
      title, 
      excerpt, 
      content, 
      category, 
      tags, 
      status = 'draft',
      image
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
        data: null
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Content is required',
        data: null
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required',
        data: null
      });
    }

    if (image && image.startsWith('data:image')) {
      try {
        const uploadResult = await uploadService.uploadBase64Image(image, 'posts');
        if (uploadResult.success) {
          uploadedImageUrl = uploadResult.url;
        }
      } catch (uploadError) {
        console.error('❌ Image upload error:', uploadError);
      }
    }

    let parsedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        parsedTags = tags.map(tag => tag.trim()).filter(tag => tag);
      } else if (typeof tags === 'string') {
        parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
    }

    const categoryExists = await Category.findOne({
      $or: [
        { _id: category },
        { slug: category }
      ]
    });
    
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Selected category does not exist',
        data: null
      });
    }

    const post = new Post({
      title: title.trim(),
      excerpt: excerpt ? excerpt.trim() : '',
      content: content.trim(),
      category: categoryExists._id,
      featuredImage: uploadedImageUrl,
      tags: parsedTags,
      status: status || 'draft',
      author: req.user.id
    });

    await post.save();
    
    await post.populate('category', 'name slug');
    await post.populate('author', 'firstName lastName avatar');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: { post }
    });
  } catch (error) {
    console.error('❌ Error creating post:', error);
    
    if (uploadedImageUrl) {
      try {
        const publicId = uploadedImageUrl.split('/').pop().split('.')[0];
        await uploadService.deleteFile(publicId);
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup image:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating post',
      error: error.message,
      data: null
    });
  }
};

module.exports = createPost;