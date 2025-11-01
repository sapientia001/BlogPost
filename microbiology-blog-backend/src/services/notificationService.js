const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('./emailService');
const logger = require('../utils/logger');

class NotificationService {
  // Create a new notification
  async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      await notification.save();

      // Populate for response
      await notification.populate([
        { path: 'relatedPost', select: 'title slug' },
        { path: 'relatedUser', select: 'firstName lastName avatar' }
      ]);

      logger.info('Notification created', {
        notificationId: notification._id,
        userId: notificationData.user,
        type: notificationData.type
      });

      return notification;
    } catch (error) {
      logger.error('Failed to create notification', {
        error: error.message,
        notificationData
      });
      throw error;
    }
  }

  // Create notification for new post
  async notifyNewPost(post, author) {
    try {
      // Get users who subscribed to this author or category
      const subscribedUsers = await User.find({
        $or: [
          { 'preferences.subscribedAuthors': author._id },
          { 'preferences.subscribedCategories': post.category }
        ],
        'preferences.emailNotifications': true,
        status: 'active'
      });

      const notifications = [];
      const emailPromises = [];

      for (const user of subscribedUsers) {
        // Create in-app notification
        const notification = await this.createNotification({
          user: user._id,
          type: 'new_post',
          title: 'New Article Published',
          message: `${author.firstName} ${author.lastName} published a new article: "${post.title}"`,
          relatedPost: post._id,
          relatedUser: author._id
        });
        notifications.push(notification);

        // Send email notification if enabled
        if (user.preferences.emailNotifications) {
          emailPromises.push(
            emailService.sendNewPostNotification(user, post, author)
          );
        }
      }

      // Send all emails in parallel
      await Promise.allSettled(emailPromises);

      logger.info('New post notifications processed', {
        postId: post._id,
        authorId: author._id,
        notificationsSent: notifications.length,
        emailsSent: emailPromises.length
      });

      return notifications;
    } catch (error) {
      logger.error('Failed to send new post notifications', {
        postId: post._id,
        error: error.message
      });
      throw error;
    }
  }

  // Create notification for post like
  async notifyPostLike(post, likedBy, postAuthor) {
    try {
      // Don't notify if user liked their own post
      if (likedBy._id.toString() === postAuthor._id.toString()) {
        return null;
      }

      const notification = await this.createNotification({
        user: postAuthor._id,
        type: 'post_like',
        title: 'Post Liked',
        message: `${likedBy.firstName} ${likedBy.lastName} liked your post "${post.title}"`,
        relatedPost: post._id,
        relatedUser: likedBy._id
      });

      logger.info('Post like notification created', {
        postId: post._id,
        likedById: likedBy._id,
        authorId: postAuthor._id
      });

      return notification;
    } catch (error) {
      logger.error('Failed to create post like notification', {
        postId: post._id,
        error: error.message
      });
      throw error;
    }
  }

  // Create notification for new comment
  async notifyNewComment(comment, post, commenter, parentCommentAuthor = null) {
    try {
      const notifications = [];

      // Notify post author (unless they commented on their own post)
      if (post.author.toString() !== commenter._id.toString()) {
        const postAuthorNotification = await this.createNotification({
          user: post.author,
          type: 'new_comment',
          title: 'New Comment',
          message: `${commenter.firstName} ${commenter.lastName} commented on your post "${post.title}"`,
          relatedPost: post._id,
          relatedUser: commenter._id
        });
        notifications.push(postAuthorNotification);

        // Send email to post author
        const postAuthor = await User.findById(post.author);
        if (postAuthor && postAuthor.preferences.emailNotifications) {
          await emailService.sendCommentNotification(postAuthor, comment, post, commenter);
        }
      }

      // Notify parent comment author if this is a reply
      if (parentCommentAuthor && parentCommentAuthor._id.toString() !== commenter._id.toString()) {
        const replyNotification = await this.createNotification({
          user: parentCommentAuthor._id,
          type: 'comment_reply',
          title: 'Reply to Your Comment',
          message: `${commenter.firstName} ${commenter.lastName} replied to your comment on "${post.title}"`,
          relatedPost: post._id,
          relatedUser: commenter._id
        });
        notifications.push(replyNotification);
      }

      logger.info('New comment notifications created', {
        commentId: comment._id,
        postId: post._id,
        notificationsCount: notifications.length
      });

      return notifications;
    } catch (error) {
      logger.error('Failed to create comment notifications', {
        commentId: comment._id,
        error: error.message
      });
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { isRead: true },
        { new: true }
      ).populate([
        { path: 'relatedPost', select: 'title slug' },
        { path: 'relatedUser', select: 'firstName lastName avatar' }
      ]);

      if (!notification) {
        throw new Error('Notification not found');
      }

      logger.info('Notification marked as read', {
        notificationId,
        userId
      });

      return notification;
    } catch (error) {
      logger.error('Failed to mark notification as read', {
        notificationId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  // Mark all notifications as read for user
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { user: userId, isRead: false },
        { isRead: true }
      );

      logger.info('All notifications marked as read', {
        userId,
        modifiedCount: result.modifiedCount
      });

      return result.modifiedCount;
    } catch (error) {
      logger.error('Failed to mark all notifications as read', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  // Get unread notification count for user
  async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        user: userId,
        isRead: false
      });

      return count;
    } catch (error) {
      logger.error('Failed to get unread notification count', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  // Clean up old notifications (keep only last 100 per user)
  async cleanupOldNotifications(userId) {
    try {
      const notifications = await Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(100)
        .select('_id');

      const idsToDelete = notifications.map(n => n._id);
      
      if (idsToDelete.length > 0) {
        await Notification.deleteMany({ _id: { $in: idsToDelete } });
        
        logger.info('Old notifications cleaned up', {
          userId,
          deletedCount: idsToDelete.length
        });
      }

      return idsToDelete.length;
    } catch (error) {
      logger.error('Failed to cleanup old notifications', {
        userId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new NotificationService();