const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'plugd_marketplace_secret_key_2024',
    { expiresIn: '30d' }
  );
};

// Basic authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'plugd_marketplace_secret_key_2024');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

// Legacy auth function (keeping for compatibility)
const auth = authenticate;

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    // First run the basic auth middleware
    await new Promise((resolve, reject) => {
      authenticate(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Check if user has admin privileges
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    next();
  } catch (error) {
    // Error already handled by basic auth middleware
    return;
  }
};

// Super admin authentication middleware
const superAdminAuth = async (req, res, next) => {
  try {
    // First run the basic auth middleware
    await new Promise((resolve, reject) => {
      authenticate(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Check if user has super admin privileges
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    next();
  } catch (error) {
    // Error already handled by basic auth middleware
    return;
  }
};

// Optional authentication middleware (doesn't require token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token;
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'plugd_marketplace_secret_key_2024');
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

// Role-based access control middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions.'
      });
    }

    next();
  };
};

// Rate limiting middleware for authentication attempts
const rateLimitAuth = (() => {
  const attempts = new Map();
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  const MAX_ATTEMPTS = 5;

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    // Clean up old attempts
    for (const [key, data] of attempts.entries()) {
      if (now - data.firstAttempt > WINDOW_MS) {
        attempts.delete(key);
      }
    }

    const clientAttempts = attempts.get(ip);
    if (clientAttempts && clientAttempts.count >= MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: 'Too many authentication attempts. Please try again later.',
        retryAfter: Math.ceil((WINDOW_MS - (now - clientAttempts.firstAttempt)) / 1000)
      });
    }

    // Record this attempt on auth failure
    req.recordAuthAttempt = () => {
      if (clientAttempts) {
        clientAttempts.count++;
      } else {
        attempts.set(ip, {
          count: 1,
          firstAttempt: now
        });
      }
    };

    // Clear attempts on successful auth
    req.clearAuthAttempts = () => {
      attempts.delete(ip);
    };

    next();
  };
})();

// Permission check middleware
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Define role permissions
    const permissions = {
      superadmin: ['*'], // All permissions
      admin: [
        'users.read', 'users.write', 'users.delete',
        'products.read', 'products.write', 'products.delete',
        'orders.read', 'orders.write',
        'reviews.read', 'reviews.write', 'reviews.delete',
        'analytics.read',
        'settings.read', 'settings.write'
      ],
      moderator: [
        'products.read', 'products.write',
        'orders.read',
        'reviews.read', 'reviews.write',
        'analytics.read'
      ],
      customer: [
        'profile.read', 'profile.write',
        'orders.read',
        'reviews.write'
      ]
    };

    const userPermissions = permissions[req.user.role] || [];
    
    if (userPermissions.includes('*') || userPermissions.includes(permission)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: `Permission denied. Required permission: ${permission}`
      });
    }
  };
};

// Session validation middleware
const validateSession = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    // Check if user's session is still valid
    const user = await User.findById(req.user._id).select('lastLogin isActive');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Session invalid. Please login again.'
      });
    }

    // Update last activity
    user.lastActivity = new Date();
    await user.save();

    next();
  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Session validation failed.'
    });
  }
};

// API key authentication middleware (for external integrations)
const apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.header('X-API-Key');
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required.'
      });
    }

    // In a real application, you would validate the API key against a database
    // For now, we'll use a simple check
    const validApiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];
    
    if (!validApiKeys.includes(apiKey)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key.'
      });
    }

    // Set a fake user object for API requests
    req.user = {
      _id: 'api-user',
      role: 'api',
      email: 'api@plugd.com'
    };

    next();
  } catch (error) {
    console.error('API key auth error:', error);
    res.status(500).json({
      success: false,
      message: 'API key validation failed.'
    });
  }
};

module.exports = {
  generateToken,
  authenticate,
  auth,
  adminAuth,
  superAdminAuth,
  optionalAuth,
  requireRole,
  rateLimitAuth,
  checkPermission,
  validateSession,
  apiKeyAuth
};
