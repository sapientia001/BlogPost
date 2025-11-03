const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail
} = require('../controllers/authController');
const {
  validateRegistration,
  validateLogin
} = require('../middleware/validation');
const { auth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

 const router = express.Router();

// Apply rate limiting to auth endpoints
router.use(authLimiter);


// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh-token', refreshToken);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

// Protected routes
router.get('/me', auth, getMe);
router.post('/logout', auth, logout);


module.exports = router;