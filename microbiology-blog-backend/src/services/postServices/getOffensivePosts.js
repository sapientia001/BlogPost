const Post = require('../../models/Post');
const logger = require('../../utils/logger');

const getOffensivePosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    console.log('📋 Fetching offensive posts, Admin:', req.user?.id);

    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view offensive posts'
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = { isOffensive: true };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { offenseReason: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Post.countDocuments(query);
    
    const posts = await Post.find(query)
      .populate('author', 'firstName lastName avatar institution')
      .populate('category', 'name slug')
      .populate('offenseReportedBy', 'firstName lastName')
      .sort({ offenseReportedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    console.log(`✅ Found ${posts.length} offensive posts out of ${total} total`);

    res.json({
      success: true,
      data: {
        posts,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching offensive posts:', error);
    logger.error('Error fetching offensive posts', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching offensive posts',
      error: error.message
    });
  }
};

module.exports = getOffensivePosts;