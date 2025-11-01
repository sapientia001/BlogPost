const Post = require('../../models/Post');
const mongoose = require('mongoose');

const getPost = async (req, res) => {
  try {
    const { postIdentifier } = req.params;

    let post;
    
    if (mongoose.Types.ObjectId.isValid(postIdentifier)) {
      post = await Post.findById(postIdentifier)
        .populate('author', 'firstName lastName avatar institution bio')
        .populate('category', 'name slug')
        .populate('likes', 'firstName lastName avatar');
    }

    if (!post) {
      post = await Post.findOne({ slug: postIdentifier })
        .populate('author', 'firstName lastName avatar institution bio')
        .populate('category', 'name slug')
        .populate('likes', 'firstName lastName avatar');
    }

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found. It may have been deleted or you may not have access.',
        data: null
      });
    }

    // Check authorization
    const isAdmin = req.user && req.user.role === 'admin';
    let isOwner = false;

    if (req.user && post.author) {
      const currentUserId = req.user._id?.toString();
      const postAuthorId = post.author._id?.toString();
      isOwner = currentUserId && postAuthorId && currentUserId === postAuthorId;
    }

    // Allow access to published posts, or non-published posts for admins/owners
    if (post.status !== 'published' && !isAdmin && !isOwner) {
      return res.status(404).json({
        success: false,
        message: 'Post not found. It may have been deleted or you may not have access.',
        data: null
      });
    }

    // Increment views for published posts (except when owner views)
    const shouldIncrementViews = post.status === 'published' && (!req.user || !isOwner);
    if (shouldIncrementViews) {
      post.views = (post.views || 0) + 1;
      await post.save();
    }

    // Transform data to match frontend expectations
    const postObj = post.toObject ? post.toObject() : post;
    
    const transformedPost = {
      ...postObj,
      image: postObj.featuredImage,
      likes: Array.isArray(postObj.likes) ? postObj.likes.length : postObj.likes || 0,
      author: postObj.author ? {
        _id: postObj.author._id,
        firstName: postObj.author.firstName || 'Unknown',
        lastName: postObj.author.lastName || 'Author',
        avatar: postObj.author.avatar,
        institution: postObj.author.institution,
        bio: postObj.author.bio
      } : null,
      category: postObj.category ? {
        _id: postObj.category._id,
        name: postObj.category.name || 'Uncategorized',
        slug: postObj.category.slug
      } : null,
      views: postObj.views || 0,
      comments: postObj.comments || 0,
      excerpt: postObj.excerpt || '',
      tags: Array.isArray(postObj.tags) ? postObj.tags : [],
      likesCount: Array.isArray(postObj.likes) ? postObj.likes.length : postObj.likes || 0
    };

    res.json({
      success: true,
      data: { post: transformedPost }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching post',
      error: error.message,
      data: null
    });
  }
};

module.exports = getPost;