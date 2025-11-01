const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  type: {
    type: String,
    enum: [
      'page_views',
      'user_registrations', 
      'post_views',
      'post_likes',
      'comments',
      'search_queries'
    ],
    required: true
  },
  metric: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    required: true,
    default: 0
  },
  details: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Index for efficient date-based queries
analyticsSchema.index({ date: 1, type: 1 });

module.exports = mongoose.model('Analytics', analyticsSchema);