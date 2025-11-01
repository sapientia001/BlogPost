const User = require('../models/User');
const EmailService = require('../services/emailService');
const logger = require('../utils/logger');
const crypto = require('crypto');

const emailController = {
  // Send email verification
  async sendVerificationEmail(req, res) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified'
        });
      }

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      user.verificationToken = verificationToken;
      user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      
      await user.save();

      // Send verification email
      const emailResult = await EmailService.sendEmailVerificationEmail(user, verificationToken);

      if (!emailResult.success) {
        logger.error('Failed to send verification email', {
          userId: user._id,
          error: emailResult.error
        });
        
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification email'
        });
      }

      logger.info('Verification email sent successfully', {
        userId: user._id,
        email: user.email,
        messageId: emailResult.messageId
      });

      res.json({
        success: true,
        message: 'Verification email sent successfully',
        previewUrl: emailResult.previewUrl // Useful for development
      });

    } catch (error) {
      logger.error('Send verification email error', {
        error: error.message,
        email: req.body.email
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Verify email
  async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Verification token is required'
        });
      }

      const user = await User.findOne({
        verificationToken: token,
        verificationTokenExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification token'
        });
      }

      // Mark user as verified and clear token
      user.isVerified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpires = undefined;
      user.status = 'active';
      
      await user.save();

      logger.info('Email verified successfully', {
        userId: user._id,
        email: user.email
      });

      res.json({
        success: true,
        message: 'Email verified successfully'
      });

    } catch (error) {
      logger.error('Verify email error', {
        error: error.message,
        token: req.body.token
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Resend verification email
  async resendVerification(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified'
        });
      }

      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      user.verificationToken = verificationToken;
      user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      
      await user.save();

      // Send verification email
      const emailResult = await EmailService.sendEmailVerificationEmail(user, verificationToken);

      if (!emailResult.success) {
        logger.error('Failed to resend verification email', {
          userId: user._id,
          error: emailResult.error
        });
        
        return res.status(500).json({
          success: false,
          message: 'Failed to resend verification email'
        });
      }

      logger.info('Verification email resent successfully', {
        userId: user._id,
        email: user.email
      });

      res.json({
        success: true,
        message: 'Verification email resent successfully',
        previewUrl: emailResult.previewUrl
      });

    } catch (error) {
      logger.error('Resend verification email error', {
        error: error.message,
        email: req.body.email
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Test email service
  async testEmailService(req, res) {
    try {
      const testResult = await EmailService.testConnection();

      if (!testResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Email service test failed',
          error: testResult.error
        });
      }

      // Get test account info for development
      const testAccountInfo = EmailService.getTestAccountInfo();

      res.json({
        success: true,
        message: testResult.message,
        testAccount: testAccountInfo,
        environment: process.env.NODE_ENV || 'development'
      });

    } catch (error) {
      logger.error('Email service test error', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Email service test failed',
        error: error.message
      });
    }
  },

  // Send custom email (admin functionality)
  async sendCustomEmail(req, res) {
    try {
      const { to, subject, message, type = 'custom' } = req.body;

      // Basic validation
      if (!to || !subject || !message) {
        return res.status(400).json({
          success: false,
          message: 'To, subject, and message are required'
        });
      }

      let htmlContent = '';
      
      // Create HTML content based on type
      switch (type) {
        case 'announcement':
          htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #2c5530, #4a7c59); color: white; padding: 20px; text-align: center;">
                <h1>🔬 Important Announcement</h1>
              </div>
              <div style="padding: 20px; background: white;">
                <p>${message.replace(/\n/g, '<br>')}</p>
                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                  <p style="margin: 0; color: #666; font-size: 14px;">
                    This is an official announcement from Microbiology Blog.
                  </p>
                </div>
              </div>
            </div>
          `;
          break;
        
        case 'newsletter':
          htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #0275d8, #025aa5); color: white; padding: 20px; text-align: center;">
                <h1>📰 Microbiology Blog Newsletter</h1>
              </div>
              <div style="padding: 20px; background: white;">
                <p>${message.replace(/\n/g, '<br>')}</p>
                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                  <p style="margin: 0; color: #666; font-size: 14px;">
                    You're receiving this email as part of our Microbiology Blog newsletter.
                  </p>
                </div>
              </div>
            </div>
          `;
          break;
        
        default:
          htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #6c757d, #495057); color: white; padding: 20px; text-align: center;">
                <h1>${subject}</h1>
              </div>
              <div style="padding: 20px; background: white;">
                <p>${message.replace(/\n/g, '<br>')}</p>
              </div>
            </div>
          `;
      }

      const emailResult = await EmailService.sendEmail(to, subject, htmlContent);

      if (!emailResult.success) {
        logger.error('Failed to send custom email', {
          to,
          subject,
          error: emailResult.error
        });
        
        return res.status(500).json({
          success: false,
          message: 'Failed to send email'
        });
      }

      logger.info('Custom email sent successfully', {
        to,
        subject,
        type,
        messageId: emailResult.messageId
      });

      res.json({
        success: true,
        message: 'Email sent successfully',
        previewUrl: emailResult.previewUrl
      });

    } catch (error) {
      logger.error('Send custom email error', {
        error: error.message,
        to: req.body.to,
        subject: req.body.subject
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get email service status
  async getEmailStatus(req, res) {
    try {
      const testResult = await EmailService.testConnection();
      const testAccountInfo = EmailService.getTestAccountInfo();

      res.json({
        success: true,
        status: testResult.success ? 'operational' : 'failed',
        environment: process.env.NODE_ENV || 'development',
        testAccount: testAccountInfo,
        lastError: testResult.error || null
      });

    } catch (error) {
      logger.error('Get email status error', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get email service status'
      });
    }
  }
};

module.exports = emailController;