// Barrel export for all routes
const authRoutes = require('./auth');
const userRoutes = require('./users');
const postRoutes = require('./posts');
const categoryRoutes = require('./categories');
const commentRoutes = require('./comments');
const bookmarkRoutes = require('./bookmarks');
const notificationRoutes = require('./notifications');
const analyticsRoutes = require('./analytics');
const uploadRoutes = require('./uploads');

module.exports = {
  authRoutes,
  userRoutes,
  postRoutes,
  categoryRoutes,
  commentRoutes,
  bookmarkRoutes,
  notificationRoutes,
  analyticsRoutes,
  uploadRoutes
};