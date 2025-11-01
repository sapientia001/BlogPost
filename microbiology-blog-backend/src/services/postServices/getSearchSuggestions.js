const Post = require('../../models/Post');
const User = require('../../models/User');

const getSearchSuggestions = async (req, res) => {
  try {
    const { q: query, type = 'all' } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: {
          suggestions: [],
          query: query || '',
          type
        }
      });
    }

    console.log('💡 Getting search suggestions for:', query);

    const suggestions = {
      authors: [],
      titles: [],
      tags: []
    };

    if (type === 'all' || type === 'authors') {
      const authorSuggestions = await User.find({
        $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } }
        ],
        status: 'active'
      })
      .select('firstName lastName avatar institution')
      .limit(5);

      suggestions.authors = authorSuggestions.map(author => ({
        type: 'author',
        display: `${author.firstName} ${author.lastName}`,
        value: `${author.firstName} ${author.lastName}`,
        avatar: author.avatar,
        institution: author.institution,
        _id: author._id
      }));
    }

    if (type === 'all' || type === 'titles') {
      const titleSuggestions = await Post.find({
        title: { $regex: query, $options: 'i' },
        status: 'published',
        isOffensive: false
      })
      .select('title slug featuredImage')
      .limit(5);

      suggestions.titles = titleSuggestions.map(post => ({
        type: 'title',
        display: post.title,
        value: post.title,
        slug: post.slug,
        image: post.featuredImage,
        _id: post._id
      }));
    }

    if (type === 'all' || type === 'tags') {
      const tagSuggestions = await Post.aggregate([
        { $match: { 
          status: 'published',
          isOffensive: false,
          tags: { $exists: true, $ne: [] }
        }},
        { $unwind: '$tags' },
        { $match: { tags: { $regex: query, $options: 'i' } } },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      suggestions.tags = tagSuggestions.map(tag => ({
        type: 'tag',
        display: `#${tag._id}`,
        value: tag._id,
        count: tag.count
      }));
    }

    const allSuggestions = [
      ...suggestions.authors,
      ...suggestions.titles,
      ...suggestions.tags
    ].slice(0, 10);

    console.log(`💡 Found ${allSuggestions.length} search suggestions`);

    res.json({
      success: true,
      data: {
        suggestions: allSuggestions,
        query,
        type,
        counts: {
          authors: suggestions.authors.length,
          titles: suggestions.titles.length,
          tags: suggestions.tags.length
        }
      }
    });
  } catch (error) {
    console.error('❌ Error getting search suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting search suggestions',
      error: error.message
    });
  }
};

module.exports = getSearchSuggestions;