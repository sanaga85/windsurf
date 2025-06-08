const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const crypto = require('crypto');

const db = require('../database/connection');
const config = require('../config/config');
const logger = require('../utils/logger');
const smsService = require('../services/smsService');
const emailService = require('../services/emailService');

/**
 * Generate JWT tokens
 */
const generateTokens = (user) => {
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    institutionId: user.institution_id
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });

  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn
  });

  return { accessToken, refreshToken };
};

/**
 * Hash refresh token for storage
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // Find user by username within the institution
    const user = await db('users')
      .where({ username, institution_id: req.institutionId, is_active: true })
      .first();

    if (!user) {
      logger.warn('Login attempt with invalid username', {
        username,
        ip: req.ip,
        institutionId: req.institutionId
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const lockoutTime = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account locked. Try again in ${lockoutTime} minutes`
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedAttempts = (user.failed_login_attempts || 0) + 1;
      const updateData = { failed_login_attempts: failedAttempts };

      // Lock account if max attempts reached
      if (failedAttempts >= config.security.maxLoginAttempts) {
        const lockoutTime = new Date();
        lockoutTime.setMinutes(lockoutTime.getMinutes() + config.security.lockoutTime);
        updateData.locked_until = lockoutTime;
      }

      await db('users').where({ id: user.id }).update(updateData);

      logger.warn('Failed login attempt', {
        userId: user.id,
        username: user.username,
        attempts: failedAttempts,
        ip: req.ip
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset failed attempts on successful login
    await db('users')
      .where({ id: user.id })
      .update({
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date(),
        last_login_ip: req.ip
      });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Save hashed refresh token
    const refreshTokenHash = hashToken(refreshToken);
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days

    await db('users')
      .where({ id: user.id })
      .update({
        refresh_token_hash: refreshTokenHash,
        refresh_token_expires_at: refreshTokenExpiry
      });

    // Prepare user data
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      permissions: user.permissions || [],
      forcePasswordChange: user.force_password_change,
      institutionId: user.institution_id
    };

    logger.info('User logged in successfully', {
      userId: user.id,
      username: user.username,
      role: user.role,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        accessToken,
        refreshToken,
        expiresIn: config.jwt.expiresIn
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  try {
    // Clear refresh token
    await db('users')
      .where({ id: req.user.userId })
      .update({
        refresh_token_hash: null,
        refresh_token_expires_at: null
      });

    logger.info('User logged out', {
      userId: req.user.userId,
      username: req.user.username,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Get user and verify stored refresh token
    const user = await db('users')
      .where({ id: decoded.userId, is_active: true })
      .first();

    if (!user || !user.refresh_token_hash || new Date(user.refresh_token_expires_at) < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired or invalid'
      });
    }

    // Verify refresh token hash
    const refreshTokenHash = hashToken(refreshToken);
    if (user.refresh_token_hash !== refreshTokenHash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    // Update stored refresh token
    const newRefreshTokenHash = hashToken(tokens.refreshToken);
    const newRefreshTokenExpiry = new Date();
    newRefreshTokenExpiry.setDate(newRefreshTokenExpiry.getDate() + 7);

    await db('users')
      .where({ id: user.id })
      .update({
        refresh_token_hash: newRefreshTokenHash,
        refresh_token_expires_at: newRefreshTokenExpiry
      });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: config.jwt.expiresIn
      }
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Reset password - send OTP
 */
const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { phone } = req.body;

    // Find user by phone within the institution
    const user = await db('users')
      .where({ phone, institution_id: req.institutionId, is_active: true })
      .first();

    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        success: true,
        message: 'If the account exists, you will receive a reset code'
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5); // 5 minutes

    // Save OTP
    await db('users')
      .where({ id: user.id })
      .update({
        otp_hash: otpHash,
        otp_expires_at: otpExpiry,
        otp_attempts: 0
      });

    // Send OTP via SMS
    await smsService.sendOTP(user.phone, otp);

    logger.info('Password reset OTP sent', {
      userId: user.id,
      username: user.username,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Reset code sent successfully'
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Verify OTP and reset password
 */
const verifyOtpAndResetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { phone, otp, newPassword } = req.body;

    // Find user by phone
    const user = await db('users')
      .where({ phone, institution_id: req.institutionId, is_active: true })
      .first();

    if (!user || !user.otp_hash || new Date(user.otp_expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Check OTP attempts
    if (user.otp_attempts >= 3) {
      await db('users')
        .where({ id: user.id })
        .update({
          otp_hash: null,
          otp_expires_at: null,
          otp_attempts: 0
        });

      return res.status(429).json({
        success: false,
        message: 'Too many OTP attempts. Please request a new code.'
      });
    }

    // Verify OTP
    const isOtpValid = await bcrypt.compare(otp, user.otp_hash);
    if (!isOtpValid) {
      await db('users')
        .where({ id: user.id })
        .update({ otp_attempts: user.otp_attempts + 1 });

      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds);

    // Update password and clear OTP
    await db('users')
      .where({ id: user.id })
      .update({
        password_hash: hashedPassword,
        otp_hash: null,
        otp_expires_at: null,
        otp_attempts: 0,
        force_password_change: false,
        failed_login_attempts: 0,
        locked_until: null,
        refresh_token_hash: null,
        refresh_token_expires_at: null
      });

    logger.info('Password reset successfully', {
      userId: user.id,
      username: user.username,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    logger.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await db('users')
      .where({ id: req.user.userId })
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds);

    // Update password
    await db('users')
      .where({ id: req.user.userId })
      .update({
        password_hash: hashedPassword,
        force_password_change: false,
        refresh_token_hash: null,
        refresh_token_expires_at: null
      });

    logger.info('Password changed successfully', {
      userId: req.user.userId,
      username: req.user.username,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get current user
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = await db('users')
      .select([
        'id', 'username', 'email', 'phone', 'first_name', 'last_name',
        'role', 'permissions', 'force_password_change', 'institution_id',
        'profile_picture_url', 'bio', 'date_of_birth', 'gender'
      ])
      .where({ id: req.user.userId })
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, dateOfBirth, gender, bio
    } = req.body;

    const updateData = {};

    if (firstName) updateData.first_name = firstName;
    if (lastName) updateData.last_name = lastName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (dateOfBirth) updateData.date_of_birth = dateOfBirth;
    if (gender) updateData.gender = gender;
    if (bio !== undefined) updateData.bio = bio;

    await db('users')
      .where({ id: req.user.userId })
      .update(updateData);

    logger.info('Profile updated', {
      userId: req.user.userId,
      username: req.user.username,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  login,
  logout,
  refreshToken,
  resetPassword,
  verifyOtpAndResetPassword,
  changePassword,
  getCurrentUser,
  updateProfile
};