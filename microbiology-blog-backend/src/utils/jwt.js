const jwt = require('jsonwebtoken');
const logger = require('./logger');

const JWT_SECRET = process.env.JWT_SECRET || 'microbiology-blog-jwt-secret-key-2024-development';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'microbiology-blog-refresh-secret-key-2024-development';

// Validate environment variables
if (!process.env.JWT_SECRET) {
  logger.warn('JWT_SECRET not set in environment variables. Using fallback key for development.');
}

if (!process.env.JWT_REFRESH_SECRET) {
  logger.warn('JWT_REFRESH_SECRET not set in environment variables. Using fallback key for development.');
}

const generateToken = (payload, expiresIn = '7d') => {
  try {
    logger.debug('Generating token', { userId: payload?.id });
    
    if (!payload || !payload.id) {
      throw new Error('Payload must contain user id');
    }

    const tokenPayload = {
      id: payload.id,
      _id: payload.id, // Include both for compatibility
      iat: Math.floor(Date.now() / 1000)
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { 
      expiresIn,
      issuer: 'microbiology-blog-api',
      subject: payload.id.toString()
    });

    logger.debug('Token generated successfully', { userId: payload.id });
    return token;
  } catch (error) {
    logger.error('Error generating token', { error: error.message });
    throw new Error('Token generation failed: ' + error.message);
  }
};

const generateRefreshToken = (payload, expiresIn = '30d') => {
  try {
    logger.debug('Generating refresh token', { userId: payload?.id });
    
    if (!payload || !payload.id) {
      throw new Error('Payload must contain user id for refresh token');
    }

    const refreshPayload = {
      id: payload.id,
      _id: payload.id,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    };

    const refreshToken = jwt.sign(refreshPayload, JWT_REFRESH_SECRET, { 
      expiresIn,
      issuer: 'microbiology-blog-api',
      subject: payload.id.toString()
    });

    logger.debug('Refresh token generated successfully', { userId: payload.id });
    return refreshToken;
  } catch (error) {
    logger.error('Error generating refresh token', { error: error.message });
    throw new Error('Refresh token generation failed: ' + error.message);
  }
};

const verifyToken = (token) => {
  try {
    logger.debug('Verifying token');
    
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    logger.debug('Token verified successfully', { 
      userId: decoded.id,
      exp: decoded.exp 
    });

    // Ensure both id and _id are present for compatibility
    if (!decoded._id && decoded.id) {
      decoded._id = decoded.id;
    }
    if (!decoded.id && decoded._id) {
      decoded.id = decoded._id;
    }

    return decoded;
  } catch (error) {
    logger.error('Token verification failed', { error: error.message });
    
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed: ' + error.message);
    }
  }
};

const verifyRefreshToken = (token) => {
  try {
    logger.debug('Verifying refresh token');
    
    if (!token) {
      throw new Error('No refresh token provided');
    }

    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    logger.debug('Refresh token verified successfully', { 
      userId: decoded.id 
    });

    // Validate refresh token type
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid refresh token type');
    }

    // Ensure both id and _id are present for compatibility
    if (!decoded._id && decoded.id) {
      decoded._id = decoded.id;
    }
    if (!decoded.id && decoded._id) {
      decoded.id = decoded._id;
    }

    return decoded;
  } catch (error) {
    logger.error('Refresh token verification failed', { error: error.message });
    
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    } else {
      throw new Error('Refresh token verification failed: ' + error.message);
    }
  }
};

const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Error decoding token', { error: error.message });
    return null;
  }
};

const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded ? new Date(decoded.exp * 1000) : null;
  } catch (error) {
    logger.error('Error getting token expiration', { error: error.message });
    return null;
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  decodeToken,
  getTokenExpiration
};