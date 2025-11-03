const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.testAccount = null;
    this.isInitialized = false;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      // Prevent multiple initializations
      if (this.isInitialized) return;

      const env = process.env.NODE_ENV || 'development';
      
      if (env === 'development' || env === 'test') {
        await this.initializeDevelopmentTransporter();
      } else {
        await this.initializeProductionTransporter();
      }
      
      this.isInitialized = true;
      logger.info('Email transporter initialized successfully', { environment: env });
      
    } catch (error) {
      logger.error('Failed to initialize email transporter', { 
        error: error.message,
        environment: process.env.NODE_ENV 
      });
      throw error;
    }
  }

  async initializeDevelopmentTransporter() {
    // Use provided SMTP credentials if available
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        // Better timeout handling for development
        connectionTimeout: 60000,
        greetingTimeout: 60000,
        socketTimeout: 60000
      });
      logger.info('Using provided SMTP credentials for development');
    } else {
      // Fallback to Ethereal email
      this.testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: this.testAccount.user,
          pass: this.testAccount.pass
        }
      });
      
      logger.info('Ethereal test account created', {
        email: this.testAccount.user,
        password: this.testAccount.pass,
        webInterface: 'https://ethereal.email'
      });
      
    }
  }

  async initializeProductionTransporter() {
    const requiredEnvVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required SMTP environment variables: ${missingVars.join(', ')}`);
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      // Production settings
      pool: true,
      maxConnections: 5,
      maxMessages: 100
    });

    // Verify transporter configuration
    await this.transporter.verify();
  }

  async sendEmail(to, subject, html, text = '', options = {}) {
    try {
      if (!this.transporter || !this.isInitialized) {
        await this.initializeTransporter();
      }

      const from = options.from || process.env.SMTP_FROM || 'noreply@microbiologyblog.com';
      
      const mailOptions = {
        from,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject.trim(),
        html: html,
        text: text || this.stripHtml(html),
        // Additional options
        ...options
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      return this.handleSuccess(result, to, subject);
      
    } catch (error) {
      return this.handleError(error, to, subject);
    }
  }

  handleSuccess(result, to, subject) {
    const previewUrl = nodemailer.getTestMessageUrl(result);
    const response = {
      success: true,
      messageId: result.messageId,
      previewUrl: previewUrl || null
    };

    // Enhanced logging for different environments
    if (process.env.NODE_ENV !== 'production') {
      logger.info('📧 Email sent successfully', {
        to,
        subject,
        messageId: result.messageId,
        previewUrl,
        testAccount: this.testAccount ? this.testAccount.user : null
      });
      
      if (previewUrl) {
        console.log('🔗 Email Preview URL:', previewUrl);
      }
    } else {
      logger.info('Email sent successfully', {
        to,
        subject,
        messageId: result.messageId,
        response: result.response
      });
    }

    return response;
  }

  handleError(error, to, subject) {
    logger.error('Failed to send email', {
      to,
      subject,
      error: error.message,
      code: error.code
    });
    
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }

  stripHtml(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  // ==================== TEMPLATE METHODS ====================

  async sendWelcomeEmail(user) {
    const subject = 'Welcome to Microbiology Blog!';
    const html = this.getWelcomeTemplate(user);
    const text = `Welcome ${user.firstName} ${user.lastName}! Thank you for joining Microbiology Blog.`;

    return await this.sendEmail(user.email, subject, html, text);
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    const subject = 'Reset Your Password - Microbiology Blog';
    const html = this.getPasswordResetTemplate(user, resetUrl, resetToken);
    const text = `Hello ${user.firstName}, use this link to reset your password: ${resetUrl}`;

    return await this.sendEmail(user.email, subject, html, text);
  }

  async sendEmailVerificationEmail(user, verificationToken) {
    const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    const subject = 'Verify Your Email - Microbiology Blog';
    const html = this.getEmailVerificationTemplate(user, verifyUrl);
    const text = `Hello ${user.firstName}, verify your email by clicking: ${verifyUrl}`;

    return await this.sendEmail(user.email, subject, html, text);
  }

  async sendNotificationEmail(user, notification) {
    const subject = `Notification: ${notification.title}`;
    const html = this.getNotificationTemplate(user, notification);
    const text = `Hello ${user.firstName}, you have a new notification: ${notification.message}`;

    return await this.sendEmail(user.email, subject, html, text);
  }

  async sendAdminAlert(subject, message, level = 'info') {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      logger.warn('Admin email not configured for admin alerts');
      return { success: false, error: 'Admin email not configured' };
    }

    const html = this.getAdminAlertTemplate(subject, message, level);
    const text = `ADMIN ALERT: ${subject}\n\n${message}`;

    return await this.sendEmail(adminEmail, subject, html, text);
  }

  // ==================== EMAIL TEMPLATES ====================

  getWelcomeTemplate(user) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Microbiology Blog</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #2c5530, #4a7c59); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .content { padding: 40px 30px; }
    .welcome-text { font-size: 16px; margin-bottom: 25px; color: #555; }
    .features { background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; }
    .feature-item { display: flex; align-items: center; margin-bottom: 15px; }
    .feature-icon { background: #2c5530; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold; }
    .cta-button { display: inline-block; background: #2c5530; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 25px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #e9ecef; }
    .social-links { margin: 20px 0; }
    .social-links a { color: #2c5530; margin: 0 10px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔬 Welcome to Microbiology Blog!</h1>
      <p>Your journey into the microbial world begins here</p>
    </div>
    
    <div class="content">
      <div class="welcome-text">
        <p>Hello <strong>${user.firstName} ${user.lastName}</strong>,</p>
        <p>Welcome to our community of microbiology enthusiasts, researchers, and professionals! We're thrilled to have you on board.</p>
      </div>

      <div class="features">
        <h3 style="color: #2c5530; margin-bottom: 20px;">🎯 What you can do:</h3>
        
        <div class="feature-item">
          <div class="feature-icon">📖</div>
          <span>Read the latest research articles and blog posts</span>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">✍️</div>
          <span>Share your own research and insights</span>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">💬</div>
          <span>Engage with our scientific community</span>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">🔔</div>
          <span>Get notifications about new content in your interests</span>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" class="cta-button">
          Explore Your Dashboard
        </a>
      </div>

      <p style="text-align: center; color: #666; font-size: 14px; margin-top: 20px;">
        Need help? Reply to this email or visit our help center.
      </p>
    </div>
    
    <div class="footer">
      <p>&copy; 2024 Microbiology Blog. All rights reserved.</p>
      <p>Dedicated to advancing microbiology knowledge and collaboration.</p>
      
      <div class="social-links">
        <a href="#">Twitter</a> | 
        <a href="#">LinkedIn</a> | 
        <a href="#">ResearchGate</a>
      </div>
      
      <p style="margin-top: 15px; font-size: 12px; color: #999;">
        You're receiving this email because you signed up for Microbiology Blog.<br>
        If this wasn't you, please ignore this email.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  getPasswordResetTemplate(user, resetUrl, resetToken) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #d9534f, #c9302c); color: white; padding: 30px 20px; text-align: center; }
    .content { padding: 40px 30px; }
    .reset-button { display: inline-block; background: #d9534f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
    .token { background: #f8f9fa; padding: 15px; border-radius: 5px; font-family: monospace; word-break: break-all; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Reset Request</h1>
    </div>
    
    <div class="content">
      <p>Hello <strong>${user.firstName}</strong>,</p>
      
      <p>We received a request to reset your password for your Microbiology Blog account. If you didn't make this request, you can safely ignore this email.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" class="reset-button">
          Reset Your Password
        </a>
      </div>

      <p>This password reset link will expire in <strong>1 hour</strong>.</p>
      
      <p>Or copy and paste this URL in your browser:</p>
      <div class="token">${resetUrl}</div>
      
      <p><strong>Security Tip:</strong> Never share your password or this reset link with anyone.</p>
    </div>
    
    <div class="footer">
      <p>&copy; 2024 Microbiology Blog. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  getEmailVerificationTemplate(user, verifyUrl) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0275d8, #025aa5); color: white; padding: 30px 20px; text-align: center; }
    .content { padding: 40px 30px; }
    .verify-button { display: inline-block; background: #0275d8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Verify Your Email</h1>
    </div>
    
    <div class="content">
      <p>Hello <strong>${user.firstName}</strong>,</p>
      
      <p>Thank you for signing up for Microbiology Blog! Please verify your email address to complete your registration and access all features.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" class="verify-button">
          Verify Email Address
        </a>
      </div>

      <p>This verification link will expire in <strong>24 hours</strong>.</p>
      
      <p>If the button doesn't work, copy and paste this URL in your browser:</p>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; font-family: monospace; word-break: break-all; margin: 15px 0;">
        ${verifyUrl}
      </div>
    </div>
    
    <div class="footer">
      <p>&copy; 2024 Microbiology Blog. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  getNotificationTemplate(user, notification) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Notification</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #f0ad4e, #ec971f); color: white; padding: 25px 20px; text-align: center; }
    .content { padding: 30px; }
    .notification { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f0ad4e; }
    .button { display: inline-block; background: #f0ad4e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 New Notification</h1>
    </div>
    
    <div class="content">
      <p>Hello <strong>${user.firstName}</strong>,</p>
      
      <div class="notification">
        <h3 style="color: #f0ad4e; margin-bottom: 10px;">${notification.title}</h3>
        <p style="margin: 0;">${notification.message}</p>
      </div>

      ${notification.link ? `
      <div style="text-align: center; margin: 25px 0;">
        <a href="${notification.link}" class="button">
          View Details
        </a>
      </div>
      ` : ''}

      <p style="color: #666; font-size: 14px;">
        You can manage your notification preferences in your account settings.
      </p>
    </div>
    
    <div class="footer">
      <p>&copy; 2024 Microbiology Blog. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  getAdminAlertTemplate(subject, message, level) {
    const colorMap = {
      info: '#0275d8',
      warning: '#f0ad4e', 
      error: '#d9534f',
      success: '#5cb85c'
    };
    
    const color = colorMap[level] || '#0275d8';
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Alert</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, ${color}, ${this.darkenColor(color)}); color: white; padding: 25px 20px; text-align: center; }
    .content { padding: 30px; }
    .alert { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${color}; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 Admin Alert - ${level.toUpperCase()}</h1>
    </div>
    
    <div class="content">
      <div class="alert">
        <h3 style="color: ${color}; margin-bottom: 15px;">${subject}</h3>
        <pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">${message}</pre>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        <strong>Timestamp:</strong> ${new Date().toISOString()}<br>
        <strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}
      </p>
    </div>
    
    <div class="footer">
      <p>&copy; 2024 Microbiology Blog - Admin System</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  darkenColor(color) {
    // Simple color darkening for gradients
    return color.replace(/#(\w{2})(\w{2})(\w{2})/, (_, r, g, b) => {
      return '#' + 
        Math.max(0, parseInt(r, 16) - 40).toString(16).padStart(2, '0') +
        Math.max(0, parseInt(g, 16) - 40).toString(16).padStart(2, '0') +
        Math.max(0, parseInt(b, 16) - 40).toString(16).padStart(2, '0');
    });
  }

  // ==================== UTILITY METHODS ====================

  async testConnection() {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
      }
      
      await this.transporter.verify();
      return { success: true, message: 'SMTP connection verified successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getTestAccountInfo() {
    if (this.testAccount) {
      return {
        email: this.testAccount.user,
        password: this.testAccount.pass,
        webInterface: 'https://ethereal.email'
      };
    }
    return null;
  }

  // Close the transporter (useful for tests)
  async close() {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
      this.isInitialized = false;
    }
  }
}

// Create and export singleton instance
module.exports = new EmailService();