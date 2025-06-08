const jwt = require('jsonwebtoken');
const db = require('../database/connection');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate JWT tokens and set user context
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Access token expired',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid access token',
          code: 'TOKEN_INVALID'
        });
      }
      throw jwtError;
    }

    // Get user from database
    const user = await db('users')
      .where({ id: decoded.userId, is_active: true })
      .first();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user belongs to the current tenant (if tenant context exists)
    if (req.institutionId && user.institution_id !== req.institutionId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied for this institution',
        code: 'INSTITUTION_ACCESS_DENIED'
      });
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Check if password change is required
    if (user.force_password_change && !req.path.includes('/auth/change-password')) {
      return res.status(428).json({
        success: false,
        message: 'Password change required',
        code: 'PASSWORD_CHANGE_REQUIRED'
      });
    }

    // Check if profile completion is required
    if (!user.profile_completed && !req.path.includes('/auth/complete-profile')) {
      return res.status(428).json({
        success: false,
        message: 'Profile completion required',
        code: 'PROFILE_COMPLETION_REQUIRED'
      });
    }

    // Set user context
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      firstName: user.first_name,
      lastName: user.last_name,
      displayName: user.display_name,
      role: user.role,
      permissions: user.permissions || [],
      institutionId: user.institution_id,
      preferences: user.preferences || {},
      profileCompleted: user.profile_completed,
      forcePasswordChange: user.force_password_change
    };

    // Update last activity
    await db('users')
      .where({ id: user.id })
      .update({ last_login: new Date() });

    // Log authentication
    logger.info(`User authenticated: ${user.username}`, {
      userId: user.id,
      role: user.role,
      institutionId: user.institution_id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

/**
 * Middleware to check if user has required role
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      logger.security(`Access denied for role ${userRole}`, {
        userId: req.user.id,
        requiredRoles: allowedRoles,
        userRole,
        path: req.path
      });

      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has specific permission
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userPermissions = req.user.permissions || [];
    
    if (!userPermissions.includes(permission) && req.user.role !== 'super_admin') {
      logger.security(`Permission denied: ${permission}`, {
        userId: req.user.id,
        requiredPermission: permission,
        userPermissions,
        path: req.path
      });

      return res.status(403).json({
        success: false,
        message: 'Permission denied',
        code: 'PERMISSION_DENIED'
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await db('users')
        .where({ id: decoded.userId, is_active: true })
        .first();

      if (user && (!req.institutionId || user.institution_id === req.institutionId)) {
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          permissions: user.permissions || [],
          institutionId: user.institution_id
        };
      }
    } catch (jwtError) {
      // Ignore JWT errors for optional auth
    }

    next();
  } catch (error) {
    logger.error('Optional auth error:', error);
    next(); // Continue without authentication
  }
};

module.exports = {
  authMiddleware,
  requireRole,
  requirePermission,
  optionalAuth
};