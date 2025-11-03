const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const mongoosePaginate = require('mongoose-paginate-v2');
const crypto = require('crypto'); // Add this at the top

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Please enter a valid email'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['reader', 'researcher', 'admin'],
    default: 'reader'
  },
  specialization: [{
    type: String,
    trim: true
  }],
  institution: {
    type: String,
    trim: true,
    maxlength: [100, 'Institution name cannot exceed 100 characters']
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'suspended'],
    default: 'pending'
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    subscribedCategories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }],
    subscribedAuthors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      return ret;
    },
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'preferences.subscribedCategories': 1 });
userSchema.index({ 'preferences.subscribedAuthors': 1 });

// Text search index
userSchema.index({
  firstName: 'text',
  lastName: 'text',
  email: 'text',
  institution: 'text',
  bio: 'text'
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method - FIXED VERSION
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // If password is not selected (due to select: false), fetch user with password
    if (!this.password) {
      const userWithPassword = await this.constructor.findById(this._id).select('+password');
      return await bcrypt.compare(candidatePassword, userWithPassword.password);
    }
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Update last active
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save({ validateBeforeSave: false });
};

// Generate email verification token - FIXED VERSION
userSchema.methods.generateEmailVerificationToken = function() {
  // Generate token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Set token and expiration on user
  this.emailVerificationToken = token;
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  // Return the token so it can be used in email
  return token;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  // Generate token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Set token and expiration on user
  this.passwordResetToken = token;
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  
  // Return the token so it can be used in email
  return token;
};

// Check if user is active
userSchema.methods.isActive = function() {
  return this.status === 'active';
};

// Check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// Check if user is researcher or admin
userSchema.methods.isResearcherOrAdmin = function() {
  return this.role === 'researcher' || this.role === 'admin';
};

// Static method to find active users
userSchema.statics.findActiveUsers = function() {
  return this.find({ status: 'active' });
};

// Static method to find by email (case insensitive)
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: new RegExp(`^${email}$`, 'i') });
};

// Static method to find by verification token
userSchema.statics.findByVerificationToken = function(token) {
  return this.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() }
  });
};

// Static method to find by reset token
userSchema.statics.findByResetToken = function(token) {
  return this.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() }
  });
};

// Apply mongoose-paginate-v2 plugin
userSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('User', userSchema);