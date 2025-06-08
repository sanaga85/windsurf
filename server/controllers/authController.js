const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const db = require('../database/connection');
const config = require('../config/config');
const logger = require('../utils/logger');
const { ValidationError, AuthenticationError, NotFoundError } = require('../middleware/errorHandler');
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
 * Save refresh token to database
 */
const saveRefreshToken = async (userId, refreshToken, deviceInfo) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await db('refresh_tokens').insert({
    user_id: userId,
    token: refreshToken,
    expires_at: expiresAt,
    device_info: deviceInfo.userAgent,
    ip_address: deviceInfo.ip
  });
};

/**
 * Login user
 */
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { username, password, rememberMe = false } = req.body;
  const deviceInfo = {
    userAgent: req.get('User-Agent'),
    ip: req.ip
  };

  // Find user by username, email, or phone
  const user = await db('users')
    .where(function() {
      this.where({ username })
        .orWhere({ email: username })
        .orWhere({ phone: username });
    })
    .andWhere({ institution_id: req.institutionId, is_active: true })
    .first();

  if (!user) {
    logger.security('Login attempt with invalid username', {
      username,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      institutionId: req.institutionId
    });
    throw new AuthenticationError('Invalid credentials');
  }

  // Check if account is locked
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const lockoutTime = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
    throw new AuthenticationError(`Account locked. Try again in ${lockoutTime} minutes`);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    // Increment login attempts
    const loginAttempts = (user.login_attempts || 0) + 1;
    const updateData = { login_attempts: loginAttempts };

    // Lock account if max attempts reached
    if (loginAttempts >= config.security.maxLoginAttempts) {
      const lockoutTime = new Date();
      lockoutTime.setMinutes(lockoutTime.getMinutes() + config.security.lockoutTime);
      updateData.locked_until = lockoutTime;
    }

    await db('users').where({ id: user.id }).update(updateData);

    logger.security('Failed login attempt', {
      userId: user.id,
      username: user.username,
      attempts: loginAttempts,
      ip: req.ip,
      institutionId: req.institutionId
    });

    throw new AuthenticationError('Invalid credentials');
  }

  // Reset login attempts on successful login
  await db('users')
    .where({ id: user.id })
    .update({
      login_attempts: 0,
      locked_until: null,
      last_login: new Date()
    });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);

  // Save refresh token
  await saveRefreshToken(user.id, refreshToken, deviceInfo);

  // Prepare user data
  const userData = {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    firstName: user.first_name,
    lastName: user.last_name,
    displayName: user.display_name,
    role: user.role,
    permissions: user.permissions || [],
    profileCompleted: user.profile_completed,
    forcePasswordChange: user.force_password_change,
    twoFactorEnabled: user.two_factor_enabled,
    preferences: user.preferences || {}
  };

  logger.info('User logged in successfully', {
    userId: user.id,
    username: user.username,
    role: user.role,
    ip: req.ip,
    institutionId: req.institutionId
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
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    // Revoke refresh token
    await db('refresh_tokens')
      .where({ user_id: req.user.id })
      .update({ is_revoked: true, revoked_at: new Date() });
  }

  logger.info('User logged out', {
    userId: req.user.id,
    username: req.user.username,
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Logout successful'
  });
};

/**
 * Logout from all devices
 */
const logoutAll = async (req, res) => {
  // Revoke all refresh tokens for user
  await db('refresh_tokens')
    .where({ user_id: req.user.id })
    .update({ is_revoked: true, revoked_at: new Date() });

  logger.info('User logged out from all devices', {
    userId: req.user.id,
    username: req.user.username,
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Logged out from all devices'
  });
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { refreshToken } = req.body;

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch (error) {
    throw new AuthenticationError('Invalid refresh token');
  }

  // Check if refresh token exists and is not revoked
  const tokenRecord = await db('refresh_tokens')
    .where({ token: refreshToken, is_revoked: false })
    .andWhere('expires_at', '>', new Date())
    .first();

  if (!tokenRecord) {
    throw new AuthenticationError('Refresh token not found or expired');
  }

  // Get user
  const user = await db('users')
    .where({ id: decoded.userId, is_active: true })
    .first();

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  // Generate new tokens
  const tokens = generateTokens(user);

  // Revoke old refresh token and save new one
  await db('refresh_tokens')
    .where({ id: tokenRecord.id })
    .update({ is_revoked: true, revoked_at: new Date() });

  await saveRefreshToken(user.id, tokens.refreshToken, {
    userAgent: req.get('User-Agent'),
    ip: req.ip
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
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await db('users')
    .where({ id: req.user.id })
    .first();

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isCurrentPasswordValid) {
    throw new AuthenticationError('Current password is incorrect');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds);

  // Update password
  await db('users')
    .where({ id: req.user.id })
    .update({
      password_hash: hashedPassword,
      password_changed_at: new Date(),
      force_password_change: false
    });

  // Revoke all refresh tokens to force re-login
  await db('refresh_tokens')
    .where({ user_id: req.user.id })
    .update({ is_revoked: true, revoked_at: new Date() });

  logger.info('Password changed successfully', {
    userId: req.user.id,
    username: req.user.username,
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
};

/**
 * Complete user profile
 */
const completeProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { firstName, lastName, phone, email, dateOfBirth, gender } = req.body;

  // Check if phone is already used by another user
  if (phone) {
    const existingUser = await db('users')
      .where({ phone, institution_id: req.user.institutionId })
      .andWhere('id', '!=', req.user.id)
      .first();

    if (existingUser) {
      throw new ValidationError('Phone number already in use');
    }
  }

  // Update profile
  const updateData = {
    first_name: firstName,
    last_name: lastName,
    display_name: `${firstName} ${lastName}`,
    phone,
    email,
    date_of_birth: dateOfBirth,
    gender,
    profile_completed: true
  };

  await db('users')
    .where({ id: req.user.id })
    .update(updateData);

  logger.info('Profile completed', {
    userId: req.user.id,
    username: req.user.username,
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Profile completed successfully',
    data: {
      profileCompleted: true
    }
  });
};

/**
 * Get user profile
 */
const getProfile = async (req, res) => {
  const user = await db('users')
    .select([
      'id', 'username', 'email', 'phone', 'first_name', 'last_name',
      'display_name', 'avatar_url', 'date_of_birth', 'gender', 'bio',
      'role', 'permissions', 'preferences', 'language', 'timezone',
      'dark_mode', 'notification_settings', 'two_factor_enabled',
      'profile_completed', 'created_at', 'updated_at'
    ])
    .where({ id: req.user.id })
    .first();

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    success: true,
    data: { user }
  });
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  const {
    firstName, lastName, email, phone, dateOfBirth, gender, bio,
    language, timezone, darkMode, notificationSettings
  } = req.body;

  const updateData = {};

  if (firstName) updateData.first_name = firstName;
  if (lastName) updateData.last_name = lastName;
  if (firstName && lastName) updateData.display_name = `${firstName} ${lastName}`;
  if (email) updateData.email = email;
  if (phone) updateData.phone = phone;
  if (dateOfBirth) updateData.date_of_birth = dateOfBirth;
  if (gender) updateData.gender = gender;
  if (bio !== undefined) updateData.bio = bio;
  if (language) updateData.language = language;
  if (timezone) updateData.timezone = timezone;
  if (darkMode !== undefined) updateData.dark_mode = darkMode;
  if (notificationSettings) updateData.notification_settings = notificationSettings;

  await db('users')
    .where({ id: req.user.id })
    .update(updateData);

  logger.info('Profile updated', {
    userId: req.user.id,
    username: req.user.username,
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Profile updated successfully'
  });
};

/**
 * Forgot password - send OTP
 */
const forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { identifier } = req.body;

  // Find user by username, email, or phone
  const user = await db('users')
    .where(function() {
      this.where({ username: identifier })
        .orWhere({ email: identifier })
        .orWhere({ phone: identifier });
    })
    .andWhere({ institution_id: req.institutionId, is_active: true })
    .first();

  if (!user) {
    // Don't reveal if user exists or not
    return res.json({
      success: true,
      message: 'If the account exists, you will receive a reset code'
    });
  }

  // Generate OTP and reset token
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const resetToken = jwt.sign(
    { userId: user.id, otp },
    config.jwt.secret,
    { expiresIn: '15m' }
  );

  // Save reset token
  await db('users')
    .where({ id: user.id })
    .update({
      password_reset_token: resetToken,
      password_reset_expires: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    });

  // Send OTP via SMS or email
  if (user.phone) {
    await smsService.sendOTP(user.phone, otp);
  } else if (user.email) {
    await emailService.sendPasswordResetOTP(user.email, otp);
  }

  logger.info('Password reset OTP sent', {
    userId: user.id,
    username: user.username,
    method: user.phone ? 'SMS' : 'Email',
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Reset code sent successfully',
    data: {
      resetToken,
      method: user.phone ? 'SMS' : 'Email'
    }
  });
};

/**
 * Reset password with OTP
 */
const resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { token, otp, newPassword } = req.body;

  // Verify reset token
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.secret);
  } catch (error) {
    throw new AuthenticationError('Invalid or expired reset token');
  }

  // Verify OTP
  if (decoded.otp !== otp) {
    throw new AuthenticationError('Invalid OTP');
  }

  // Get user and verify reset token
  const user = await db('users')
    .where({
      id: decoded.userId,
      password_reset_token: token,
      is_active: true
    })
    .andWhere('password_reset_expires', '>', new Date())
    .first();

  if (!user) {
    throw new AuthenticationError('Invalid or expired reset token');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds);

  // Update password and clear reset token
  await db('users')
    .where({ id: user.id })
    .update({
      password_hash: hashedPassword,
      password_reset_token: null,
      password_reset_expires: null,
      password_changed_at: new Date(),
      force_password_change: false,
      login_attempts: 0,
      locked_until: null
    });

  // Revoke all refresh tokens
  await db('refresh_tokens')
    .where({ user_id: user.id })
    .update({ is_revoked: true, revoked_at: new Date() });

  logger.info('Password reset successfully', {
    userId: user.id,
    username: user.username,
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
};

module.exports = {
  login,
  logout,
  logoutAll,
  refreshToken,
  changePassword,
  completeProfile,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword
};