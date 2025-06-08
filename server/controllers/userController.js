const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const csv = require('csv-parser');
const fs = require('fs');

const db = require('../database/connection');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Generate random username
 */
const generateUsername = (firstName, lastName, institutionId) => {
  const base = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${base}${random}`;
};

/**
 * Generate random password
 */
const generatePassword = () => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

/**
 * Get users with filtering and pagination
 */
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      search,
      isActive,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;

    let query = db('users')
      .where({ institution_id: req.user.institutionId })
      .whereNull('deleted_at');

    // Apply filters
    if (role) {
      query = query.where({ role });
    }

    if (isActive !== undefined) {
      query = query.where({ is_active: isActive === 'true' });
    }

    if (search) {
      query = query.where(function() {
        this.where('first_name', 'ilike', `%${search}%`)
          .orWhere('last_name', 'ilike', `%${search}%`)
          .orWhere('username', 'ilike', `%${search}%`)
          .orWhere('email', 'ilike', `%${search}%`)
          .orWhere('phone', 'ilike', `%${search}%`);
      });
    }

    // Get total count
    const totalQuery = query.clone();
    const [{ count }] = await totalQuery.count('* as count');
    const total = parseInt(count);

    // Get users
    const users = await query
      .select([
        'id', 'username', 'email', 'phone', 'first_name', 'last_name',
        'role', 'is_active', 'force_password_change', 'last_login_at',
        'profile_picture_url', 'created_at', 'updated_at'
      ])
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Search users
 */
const searchUsers = async (req, res) => {
  try {
    const { q, role, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: { users: [] }
      });
    }

    let query = db('users')
      .where({ institution_id: req.user.institutionId, is_active: true })
      .whereNull('deleted_at')
      .where(function() {
        this.where('first_name', 'ilike', `%${q}%`)
          .orWhere('last_name', 'ilike', `%${q}%`)
          .orWhere('username', 'ilike', `%${q}%`)
          .orWhere('email', 'ilike', `%${q}%`)
          .orWhere('phone', 'ilike', `%${q}%`);
      });

    if (role) {
      query = query.where({ role });
    }

    const users = await query
      .select([
        'id', 'username', 'first_name', 'last_name', 'email', 'phone',
        'role', 'profile_picture_url'
      ])
      .limit(limit);

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    logger.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await db('users')
      .select([
        'id', 'username', 'email', 'phone', 'first_name', 'last_name',
        'role', 'permissions', 'is_active', 'force_password_change',
        'profile_picture_url', 'bio', 'date_of_birth', 'gender',
        'last_login_at', 'last_login_ip', 'created_at', 'updated_at'
      ])
      .where({ id, institution_id: req.user.institutionId })
      .whereNull('deleted_at')
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
    logger.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create new user
 */
const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, phone, email, role } = req.body;

    // Check if phone already exists
    const existingUser = await db('users')
      .where({ phone, institution_id: req.user.institutionId })
      .whereNull('deleted_at')
      .first();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already exists'
      });
    }

    // Generate username and password
    const username = generateUsername(firstName, lastName, req.user.institutionId);
    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);

    // Create user
    const [userId] = await db('users').insert({
      institution_id: req.user.institutionId,
      username,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      phone,
      email,
      role,
      is_active: true,
      force_password_change: true
    }).returning('id');

    logger.info('User created successfully', {
      userId: userId.id,
      username,
      role,
      createdBy: req.user.userId
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: userId.id,
          username,
          firstName,
          lastName,
          phone,
          email,
          role
        },
        credentials: {
          username,
          password
        }
      }
    });
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update user
 */
const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { firstName, lastName, phone, email, role, permissions } = req.body;

    // Check if user exists
    const user = await db('users')
      .where({ id, institution_id: req.user.institutionId })
      .whereNull('deleted_at')
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if phone already exists (if changed)
    if (phone && phone !== user.phone) {
      const existingUser = await db('users')
        .where({ phone, institution_id: req.user.institutionId })
        .whereNull('deleted_at')
        .whereNot({ id })
        .first();

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already exists'
        });
      }
    }

    // Update user
    const updateData = {};
    if (firstName) updateData.first_name = firstName;
    if (lastName) updateData.last_name = lastName;
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (permissions) updateData.permissions = JSON.stringify(permissions);

    await db('users')
      .where({ id })
      .update(updateData);

    logger.info('User updated successfully', {
      userId: id,
      updatedBy: req.user.userId,
      changes: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Activate user
 */
const activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db('users')
      .where({ id, institution_id: req.user.institutionId })
      .whereNull('deleted_at')
      .update({ is_active: true });

    if (result === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    logger.info('User activated', {
      userId: id,
      activatedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'User activated successfully'
    });
  } catch (error) {
    logger.error('Activate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Deactivate user
 */
const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db('users')
      .where({ id, institution_id: req.user.institutionId })
      .whereNull('deleted_at')
      .update({ 
        is_active: false,
        refresh_token_hash: null,
        refresh_token_expires_at: null
      });

    if (result === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    logger.info('User deactivated', {
      userId: id,
      deactivatedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    logger.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete user (soft delete)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db('users')
      .where({ id, institution_id: req.user.institutionId })
      .whereNull('deleted_at')
      .update({ 
        deleted_at: new Date(),
        is_active: false,
        refresh_token_hash: null,
        refresh_token_expires_at: null
      });

    if (result === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    logger.info('User deleted', {
      userId: id,
      deletedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Reset user password
 */
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await db('users')
      .where({ id, institution_id: req.user.institutionId })
      .whereNull('deleted_at')
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new password
    const newPassword = generatePassword();
    const passwordHash = await bcrypt.hash(newPassword, config.security.bcryptRounds);

    // Update password
    await db('users')
      .where({ id })
      .update({
        password_hash: passwordHash,
        force_password_change: true,
        refresh_token_hash: null,
        refresh_token_expires_at: null,
        failed_login_attempts: 0,
        locked_until: null
      });

    logger.info('User password reset', {
      userId: id,
      resetBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        newPassword
      }
    });
  } catch (error) {
    logger.error('Reset user password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Bulk create users
 */
const bulkCreateUsers = async (req, res) => {
  try {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors.array()
      });
    }

    const { users } = req.body;
    const createdUsers = [];
    const creationErrors = [];

    for (const userData of users) {
      try {
        const { firstName, lastName, phone, email, role } = userData;

        // Check if phone already exists
        const existingUser = await db('users')
          .where({ phone, institution_id: req.user.institutionId })
          .whereNull('deleted_at')
          .first();

        if (existingUser) {
          creationErrors.push({
            phone,
            error: 'Phone number already exists'
          });
          continue;
        }

        // Generate username and password
        const username = generateUsername(firstName, lastName, req.user.institutionId);
        const password = generatePassword();
        const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);

        // Create user
        const [userId] = await db('users').insert({
          institution_id: req.user.institutionId,
          username,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          phone,
          email,
          role,
          is_active: true,
          force_password_change: true
        }).returning('id');

        createdUsers.push({
          id: userId.id,
          username,
          password,
          firstName,
          lastName,
          phone,
          email,
          role
        });
      } catch (error) {
        creationErrors.push({
          phone: userData.phone,
          error: error.message
        });
      }
    }

    logger.info('Bulk users created', {
      count: createdUsers.length,
      errors: creationErrors.length,
      createdBy: req.user.userId
    });

    res.json({
      success: true,
      message: `${createdUsers.length} users created successfully`,
      data: {
        users: createdUsers,
        errors: creationErrors
      }
    });
  } catch (error) {
    logger.error('Bulk create users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Import users from CSV
 */
const importUsersFromCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    const users = [];
    const importErrors = [];

    // Parse CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        users.push(row);
      })
      .on('end', async () => {
        const createdUsers = [];

        for (const userData of users) {
          try {
            const { firstName, lastName, phone, email, role } = userData;

            if (!firstName || !lastName || !phone || !role) {
              importErrors.push({
                row: userData,
                error: 'Missing required fields'
              });
              continue;
            }

            // Check if phone already exists
            const existingUser = await db('users')
              .where({ phone, institution_id: req.user.institutionId })
              .whereNull('deleted_at')
              .first();

            if (existingUser) {
              importErrors.push({
                row: userData,
                error: 'Phone number already exists'
              });
              continue;
            }

            // Generate username and password
            const username = generateUsername(firstName, lastName, req.user.institutionId);
            const password = generatePassword();
            const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);

            // Create user
            const [userId] = await db('users').insert({
              institution_id: req.user.institutionId,
              username,
              password_hash: passwordHash,
              first_name: firstName,
              last_name: lastName,
              phone,
              email,
              role,
              is_active: true,
              force_password_change: true
            }).returning('id');

            createdUsers.push({
              id: userId.id,
              username,
              password,
              firstName,
              lastName,
              phone,
              email,
              role
            });
          } catch (error) {
            importErrors.push({
              row: userData,
              error: error.message
            });
          }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        logger.info('CSV users imported', {
          count: createdUsers.length,
          errors: importErrors.length,
          importedBy: req.user.userId
        });

        res.json({
          success: true,
          message: `${createdUsers.length} users imported successfully`,
          data: {
            users: createdUsers,
            errors: importErrors
          }
        });
      });
  } catch (error) {
    logger.error('Import users from CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Upload profile picture
 */
const uploadProfilePicture = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Profile picture file is required'
      });
    }

    // Check if user exists
    const user = await db('users')
      .where({ id, institution_id: req.user.institutionId })
      .whereNull('deleted_at')
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const profilePictureUrl = `/uploads/profiles/${req.file.filename}`;

    // Update user profile picture
    await db('users')
      .where({ id })
      .update({ profile_picture_url: profilePictureUrl });

    logger.info('Profile picture uploaded', {
      userId: id,
      uploadedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePictureUrl
      }
    });
  } catch (error) {
    logger.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Export users
 */
const exportUsers = async (req, res) => {
  try {
    const { role, isActive } = req.query;

    let query = db('users')
      .select([
        'username', 'first_name', 'last_name', 'email', 'phone',
        'role', 'is_active', 'last_login_at', 'created_at'
      ])
      .where({ institution_id: req.user.institutionId })
      .whereNull('deleted_at');

    if (role) {
      query = query.where({ role });
    }

    if (isActive !== undefined) {
      query = query.where({ is_active: isActive === 'true' });
    }

    const users = await query.orderBy('created_at', 'desc');

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    logger.error('Export users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get available roles
 */
const getRoles = async (req, res) => {
  try {
    const roles = [
      { value: 'institution_admin', label: 'Institution Admin', description: 'Full access to institution management' },
      { value: 'faculty', label: 'Faculty/Trainer', description: 'Content creation and student management' },
      { value: 'student', label: 'Student/Learner', description: 'Access to courses and library' },
      { value: 'librarian', label: 'Librarian', description: 'Library management and support' },
      { value: 'parent', label: 'Parent', description: 'Monitor child progress and activities' }
    ];

    res.json({
      success: true,
      data: { roles }
    });
  } catch (error) {
    logger.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getUsers,
  searchUsers,
  getUserById,
  createUser,
  updateUser,
  activateUser,
  deactivateUser,
  deleteUser,
  resetUserPassword,
  bulkCreateUsers,
  importUsersFromCSV,
  uploadProfilePicture,
  exportUsers,
  getRoles
};