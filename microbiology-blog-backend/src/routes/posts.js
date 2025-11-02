const express = require('express');
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  incrementViews,
  getPostComments,
  getFeaturedPosts,
  getPopularPosts,
  searchPosts,
  archivePost,
  unarchivePost,
  getPostsByAuthor,
  getRelatedPosts,
  getSearchSuggestions,
  getOffensivePosts,
  markAsOffensive,
  removeOffense
} = require('../controllers/postController');
const { validateObjectId, validatePagination, validatePostIdentifier } = require('../middleware/validation');
const { auth, researcherAuth, adminAuth } = require('../middleware/auth');
const Post = require('../models/Post');

const router = express.Router();

// 🎯 CRITICAL: EDIT ROUTE FIRST - bypasses status check for editing
router.get('/edit/:postId', auth, validateObjectId('postId'), async (req, res) => {
  try {
    const { postId } = req.params;
    
    const post = await Post.findById(postId)
      .populate('author', 'firstName lastName avatar institution bio')
      .populate('category', 'name slug');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // ✅ Simple authorization - allow admin or post owner
    const isOwner = post.author._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this post'
      });
    }

    // Transform the post data
    const transformedPost = {
      ...post.toObject(),
      image: post.featuredImage,
      author: {
        _id: post.author._id,
        firstName: post.author.firstName,
        lastName: post.author.lastName,
        avatar: post.author.avatar,
        institution: post.author.institution,
        bio: post.author.bio
      },
      category: post.category ? {
        _id: post.category._id,
        name: post.category.name,
        slug: post.category.slug
      } : null
    };

    res.json({
      success: true,
      data: { post: transformedPost }
    });
  } catch (error) {
    console.error('❌ EDIT ROUTE - Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading post for editing',
      error: error.message
    });
  }
});

// Test endpoint
router.get('/test', async (req, res) => {
  try {
    const testPosts = await Post.find({ status: 'published' })
      .populate('author', 'firstName lastName')
      .populate('category', 'name')
      .limit(2)
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      message: 'Test endpoint working',
      data: {
        posts: testPosts,
        count: testPosts.length
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
});

// ==================== PUBLIC ROUTES ====================
router.get('/featured', getFeaturedPosts);
router.get('/popular', getPopularPosts);
router.get('/search', searchPosts);
router.get('/search/suggestions', getSearchSuggestions);

// Author-specific routes
router.get('/author/:authorId', validateObjectId('authorId'), validatePagination, getPostsByAuthor);

// ==================== AUTHENTICATED ROUTES ====================
// Admin-only offensive post routes
router.get('/admin/offensive', auth, adminAuth, validatePagination, getOffensivePosts);
router.post('/:postId/offensive', auth, adminAuth, validateObjectId('postId'), markAsOffensive);
router.delete('/:postId/offensive', auth, adminAuth, validateObjectId('postId'), removeOffense);

// Archive routes
router.post('/:postId/archive', auth, validateObjectId('postId'), archivePost);
router.post('/:postId/unarchive', auth, validateObjectId('postId'), unarchivePost);

// Post-specific action routes
router.get('/:postId/comments', validateObjectId('postId'), getPostComments);
router.get('/:postId/related', validateObjectId('postId'), getRelatedPosts);
router.post('/:postId/like', auth, validateObjectId('postId'), toggleLike);
router.post('/:postId/view', incrementViews);

// Post modification routes
router.post('/', auth, researcherAuth, createPost);
router.put('/:postId', auth, validateObjectId('postId'), updatePost);
router.delete('/:postId', auth, validateObjectId('postId'), deletePost);

// ==================== SINGLE POST ROUTE ====================
router.get('/:postIdentifier', validatePostIdentifier, getPost);

// ==================== MAIN POSTS ROUTE ====================
router.get('/', validatePagination, getPosts);

module.exports = router;