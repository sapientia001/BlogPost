// Barrel export for all services
const emailService = require('./emailService');
const notificationService = require('./notificationService');
const analyticsService = require('./analyticsService');
const searchService = require('./searchService');
const uploadService = require('./uploadService');

module.exports = {
  emailService,
  notificationService,
  analyticsService,
  searchService,
  uploadService
};