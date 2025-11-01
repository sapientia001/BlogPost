const mongoose = require('mongoose');
const slugify = require('slugify');
const mongoosePaginate = require('mongoose-paginate-v2');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Post title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  excerpt: {
    type: String,
    required: [true, 'Excerpt is required'],
    maxlength: [300, 'Excerpt cannot exceed 300 characters'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  featuredImage: {
    type: String,
    default: null
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true
  },
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  readTime: {
    type: Number,
    default: 5,
    min: 1
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: {
    type: Number,
    default: 0
  },
  metadata: {
    wordCount: {
      type: Number,
      default: 0
    },
    references: [{
      type: String,
      trim: true
    }],
    methodology: {
      type: String,
      trim: true,
      maxlength: [500, 'Methodology cannot exceed 500 characters']
    },
    citations: [{
      type: String,
      trim: true
    }],
    keywords: [{
      type: String,
      trim: true,
      lowercase: true
    }]
  },
  publishedAt: {
    type: Date,
    default: null
  },
  lastEditedAt: {
    type: Date,
    default: null
  },
  // ADDED: Fields for moderation tracking
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  moderatedAt: {
    type: Date,
    default: null
  },
  // ADDED: Field for archive reason
  archiveReason: {
    type: String,
    maxlength: [200, 'Archive reason cannot exceed 200 characters'],
    trim: true
  },
  // ADDED: Fields for offense system (admin only)
  isOffensive: {
    type: Boolean,
    default: false,
    index: true
  },
  offenseReason: {
    type: String,
    maxlength: [500, 'Offense reason cannot exceed 500 characters'],
    trim: true
  },
  offenseReportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  offenseReportedAt: {
    type: Date,
    default: null
  },
  offenseResolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  offenseResolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      return ret;
    },
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
});

// Virtual for full name
postSchema.virtual('authorName').get(function() {
  if (this.author && this.author.firstName && this.author.lastName) {
    return `${this.author.firstName} ${this.author.lastName}`;
  }
  return 'Unknown Author';
});

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for isPublished
postSchema.virtual('isPublished').get(function() {
  return this.status === 'published';
});

// Virtual for isFeatured
postSchema.virtual('isFeatured').get(function() {
  return this.featured && this.status === 'published';
});

// Virtual for isOffensive (for easy filtering)
postSchema.virtual('isRemoved').get(function() {
  return this.isOffensive;
});

// Virtual for URL
postSchema.virtual('url').get(function() {
  return `/posts/${this.slug}`;
});

// Index for search and performance
postSchema.index({ title: 'text', content: 'text', excerpt: 'text', 'metadata.keywords': 'text' });
postSchema.index({ category: 1, status: 1, createdAt: -1 });
postSchema.index({ author: 1, status: 1, createdAt: -1 });
postSchema.index({ featured: 1, status: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ 'metadata.keywords': 1 });
postSchema.index({ publishedAt: -1 });
postSchema.index({ views: -1 });
postSchema.index({ moderatedBy: 1 });
postSchema.index({ isOffensive: 1 });
postSchema.index({ offenseReportedBy: 1 });

// Generate slug before saving
postSchema.pre('save', function(next) {
  if (this.isModified('title') && this.title) {
    const baseSlug = slugify(this.title, { 
      lower: true, 
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
    
    // Add timestamp to ensure uniqueness
    this.slug = `${baseSlug}-${Date.now().toString(36)}`;
  }
  
  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Set lastEditedAt when content is modified
  if (this.isModified('content') || this.isModified('title') || this.isModified('excerpt')) {
    this.lastEditedAt = new Date();
  }
  
  // Set moderatedAt when moderatedBy changes
  if (this.isModified('moderatedBy') && this.moderatedBy) {
    this.moderatedAt = new Date();
  }
  
  // Set offense reported/resolved dates
  if (this.isModified('isOffensive')) {
    if (this.isOffensive && !this.offenseReportedAt) {
      this.offenseReportedAt = new Date();
    } else if (!this.isOffensive && this.offenseReportedAt && !this.offenseResolvedAt) {
      this.offenseResolvedAt = new Date();
    }
  }
  
  next();
});

// Calculate read time and word count
postSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Calculate word count
    const wordCount = this.content.split(/\s+/).length;
    this.metadata.wordCount = wordCount;
    
    // Calculate read time (200 words per minute)
    const wordsPerMinute = 200;
    this.readTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    
    // Extract keywords from title and content (simple implementation)
    const text = `${this.title} ${this.excerpt} ${this.content}`;
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    const keywords = [...new Set(words.filter(word => 
      word.length > 3 && !stopWords.has(word) && /^[a-z]+$/.test(word)
    ).slice(0, 10))];
    
    this.metadata.keywords = keywords;
  }
  next();
});

// Static method to find published posts
postSchema.statics.findPublished = function() {
  return this.find({ status: 'published', isOffensive: false });
};

// Static method to find featured posts
postSchema.statics.findFeatured = function() {
  return this.find({ featured: true, status: 'published', isOffensive: false });
};

// Static method to find by author
postSchema.statics.findByAuthor = function(authorId) {
  return this.find({ author: authorId });
};

// Static method to find archived posts
postSchema.statics.findArchived = function() {
  return this.find({ status: 'archived' });
};

// Static method to find offensive posts (admin only)
postSchema.statics.findOffensive = function() {
  return this.find({ isOffensive: true });
};

// Static method to find popular posts
postSchema.statics.findPopular = function(limit = 10) {
  return this.find({ status: 'published', isOffensive: false })
    .sort({ views: -1, likes: -1 })
    .limit(limit);
};

// Static method to find related posts
postSchema.statics.findRelated = function(post, limit = 4) {
  return this.find({
    _id: { $ne: post._id },
    $or: [
      { category: post.category },
      { tags: { $in: post.tags } },
      { 'metadata.keywords': { $in: post.metadata.keywords } }
    ],
    status: 'published',
    isOffensive: false
  })
  .limit(limit)
  .sort({ views: -1, createdAt: -1 });
};

// Instance method to increment views
postSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Instance method to toggle like
postSchema.methods.toggleLike = function(userId) {
  const likeIndex = this.likes.indexOf(userId);
  
  if (likeIndex > -1) {
    this.likes.splice(likeIndex, 1);
  } else {
    this.likes.push(userId);
  }
  
  return this.save();
};

// Instance method to check if user liked the post
postSchema.methods.isLikedBy = function(userId) {
  return this.likes.includes(userId);
};

// Instance method to publish
postSchema.methods.publish = function() {
  this.status = 'published';
  this.publishedAt = new Date();
  return this.save();
};

// Instance method to archive
postSchema.methods.archive = function(reason = '') {
  this.status = 'archived';
  this.archiveReason = reason;
  return this.save();
};

// Instance method to unarchive (move to draft)
postSchema.methods.unarchive = function() {
  this.status = 'draft';
  this.archiveReason = '';
  return this.save();
};

// Instance method to moderate (admin only)
postSchema.methods.moderate = function(moderatorId, reason = '') {
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  this.archiveReason = reason;
  return this.save();
};

// Instance method to mark as offensive (admin only)
postSchema.methods.markAsOffensive = function(adminId, reason = '') {
  this.isOffensive = true;
  this.offenseReason = reason;
  this.offenseReportedBy = adminId;
  this.offenseReportedAt = new Date();
  return this.save();
};

// Instance method to remove offense (admin only)
postSchema.methods.removeOffense = function(adminId) {
  this.isOffensive = false;
  this.offenseReason = '';
  this.offenseResolvedBy = adminId;
  this.offenseResolvedAt = new Date();
  return this.save();
};

// Apply mongoose-paginate-v2 plugin
postSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Post', postSchema);