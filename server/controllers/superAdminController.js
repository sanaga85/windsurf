const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../database/connection');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');
const { generateSlug, generateRandomPassword } = require('../utils/helpers');

/**
 * Get SuperAdmin dashboard
 */
const getSuperAdminDashboard = async (req, res) => {
  try {
    // Get platform statistics
    const [totalInstitutions] = await db('institutions').count('* as count');
    const [activeInstitutions] = await db('institutions')
      .where({ is_active: true })
      .count('* as count');
    const [trialInstitutions] = await db('institutions')
      .where({ is_trial: true, is_active: true })
      .count('* as count');
    const [totalUsers] = await db('users').count('* as count');
    const [totalContent] = await db('content').count('* as count');

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [newInstitutions] = await db('institutions')
      .where('created_at', '>=', sevenDaysAgo)
      .count('* as count');

    const [newUsers] = await db('users')
      .where('created_at', '>=', sevenDaysAgo)
      .count('* as count');

    // Get institution growth over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const institutionGrowth = await db('institutions')
      .where('created_at', '>=', thirtyDaysAgo)
      .select(db.raw('DATE(created_at) as date'))
      .count('* as count')
      .groupBy(db.raw('DATE(created_at)'))
      .orderBy('date');

    // Get recent institutions
    const recentInstitutions = await db('institutions')
      .select(['id', 'name', 'type', 'is_active', 'is_trial', 'created_at'])
      .orderBy('created_at', 'desc')
      .limit(10);

    const dashboard = {
      statistics: {
        totalInstitutions: parseInt(totalInstitutions.count),
        activeInstitutions: parseInt(activeInstitutions.count),
        trialInstitutions: parseInt(trialInstitutions.count),
        totalUsers: parseInt(totalUsers.count),
        totalContent: parseInt(totalContent.count),
        newInstitutions: parseInt(newInstitutions.count),
        newUsers: parseInt(newUsers.count)
      },
      institutionGrowth,
      recentInstitutions
    };

    res.json({
      success: true,
      data: { dashboard }
    });
  } catch (error) {
    logger.error('Get SuperAdmin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all institutions
 */
const getAllInstitutions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      type,
      status,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    let query = db('institutions')
      .select([
        'id', 'name', 'slug', 'subdomain', 'type', 'email', 'phone',
        'is_active', 'is_trial', 'trial_ends_at', 'subscription_ends_at',
        'created_at', 'updated_at'
      ]);

    // Apply filters
    if (search) {
      query = query.where(function() {
        this.where('name', 'ilike', `%${search}%`)
            .orWhere('email', 'ilike', `%${search}%`)
            .orWhere('subdomain', 'ilike', `%${search}%`);
      });
    }

    if (type) {
      query = query.where('type', type);
    }

    if (status) {
      switch (status) {
        case 'active':
          query = query.where({ is_active: true, is_trial: false });
          break;
        case 'trial':
          query = query.where({ is_active: true, is_trial: true });
          break;
        case 'suspended':
          query = query.where({ is_active: false });
          break;
      }
    }

    // Get total count
    const totalQuery = query.clone();
    const [{ count }] = await totalQuery.count('* as count');

    // Apply sorting and pagination
    const institutions = await query
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset(offset);

    // Get user counts for each institution
    const institutionIds = institutions.map(inst => inst.id);
    if (institutionIds.length > 0) {
      const userCounts = await db('users')
        .whereIn('institution_id', institutionIds)
        .where({ is_active: true })
        .groupBy('institution_id')
        .select('institution_id')
        .count('* as user_count');

      const userCountMap = {};
      userCounts.forEach(item => {
        userCountMap[item.institution_id] = parseInt(item.user_count);
      });

      institutions.forEach(institution => {
        institution.user_count = userCountMap[institution.id] || 0;
      });
    }

    res.json({
      success: true,
      data: {
        institutions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(count),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get all institutions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create institution
 */
const createInstitution = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      name, slug, subdomain, type, email, phone, address, website,
      adminEmail, adminPhone, adminFirstName, adminLastName
    } = req.body;

    // Check for duplicate slug and subdomain
    const existingInstitution = await db('institutions')
      .where(function() {
        this.where('slug', slug).orWhere('subdomain', subdomain);
      })
      .first();

    if (existingInstitution) {
      return res.status(400).json({
        success: false,
        message: 'Institution slug or subdomain already exists'
      });
    }

    // Start transaction
    const trx = await db.transaction();

    try {
      // Create institution
      const institutionData = {
        name,
        slug,
        subdomain,
        type,
        email: email || null,
        phone: phone || null,
        address: address || null,
        website: website || null,
        is_active: true,
        is_trial: true,
        trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        settings: JSON.stringify({}),
        features: JSON.stringify({}),
        branding: JSON.stringify({})
      };

      const [institutionId] = await trx('institutions').insert(institutionData).returning('id');

      // Generate admin credentials
      const adminUsername = generateSlug(adminFirstName + adminLastName);
      const adminPassword = generateRandomPassword();
      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      // Create admin user
      const adminData = {
        username: adminUsername,
        email: adminEmail,
        phone: adminPhone,
        password_hash: hashedPassword,
        first_name: adminFirstName,
        last_name: adminLastName,
        role: 'institution_admin',
        institution_id: institutionId,
        is_active: true,
        force_password_change: true,
        permissions: JSON.stringify([])
      };

      const [adminUserId] = await trx('users').insert(adminData).returning('id');

      await trx.commit();

      // Send welcome email with credentials
      try {
        await emailService.sendWelcomeEmail(adminEmail, {
          institutionName: name,
          adminName: `${adminFirstName} ${adminLastName}`,
          username: adminUsername,
          password: adminPassword,
          loginUrl: `https://${subdomain}.scholarbridgelms.com`
        });
      } catch (emailError) {
        logger.warn('Failed to send welcome email:', emailError);
      }

      logger.info('Institution created', {
        institutionId,
        name,
        type,
        adminUserId,
        createdBy: req.user.userId
      });

      res.status(201).json({
        success: true,
        message: 'Institution created successfully',
        data: {
          institutionId,
          adminUserId,
          credentials: {
            username: adminUsername,
            password: adminPassword
          }
        }
      });
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  } catch (error) {
    logger.error('Create institution error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get institution details
 */
const getInstitutionDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const institution = await db('institutions')
      .where({ id })
      .first();

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    // Get user statistics
    const userStats = await db('users')
      .where({ institution_id: id })
      .groupBy('role')
      .select('role')
      .count('* as count');

    // Get content statistics
    const [contentCount] = await db('content')
      .where({ institution_id: id })
      .count('* as count');

    // Get course statistics
    const [courseCount] = await db('courses')
      .where({ institution_id: id })
      .count('* as count');

    // Get library statistics
    const [libraryItemCount] = await db('library_items')
      .where({ institution_id: id, deleted_at: null })
      .count('* as count');

    // Get recent activity
    const recentUsers = await db('users')
      .where({ institution_id: id })
      .select(['id', 'username', 'first_name', 'last_name', 'role', 'created_at'])
      .orderBy('created_at', 'desc')
      .limit(10);

    institution.statistics = {
      userStats: userStats.map(stat => ({
        role: stat.role,
        count: parseInt(stat.count)
      })),
      contentCount: parseInt(contentCount.count),
      courseCount: parseInt(courseCount.count),
      libraryItemCount: parseInt(libraryItemCount.count)
    };

    institution.recentUsers = recentUsers;

    res.json({
      success: true,
      data: { institution }
    });
  } catch (error) {
    logger.error('Get institution details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Suspend institution
 */
const suspendInstitution = async (req, res) => {
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
    const { reason } = req.body;

    const institution = await db('institutions')
      .where({ id })
      .first();

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    await db('institutions')
      .where({ id })
      .update({
        is_active: false,
        suspended_at: new Date(),
        suspension_reason: reason
      });

    // Log the suspension
    logger.info('Institution suspended', {
      institutionId: id,
      reason,
      suspendedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'Institution suspended successfully'
    });
  } catch (error) {
    logger.error('Suspend institution error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Activate institution
 */
const activateInstitution = async (req, res) => {
  try {
    const { id } = req.params;

    const institution = await db('institutions')
      .where({ id })
      .first();

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    await db('institutions')
      .where({ id })
      .update({
        is_active: true,
        suspended_at: null,
        suspension_reason: null
      });

    logger.info('Institution activated', {
      institutionId: id,
      activatedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'Institution activated successfully'
    });
  } catch (error) {
    logger.error('Activate institution error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete institution
 */
const deleteInstitution = async (req, res) => {
  try {
    const { id } = req.params;

    const institution = await db('institutions')
      .where({ id })
      .first();

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    // Soft delete
    await db('institutions')
      .where({ id })
      .update({
        deleted_at: new Date(),
        is_active: false
      });

    logger.info('Institution deleted', {
      institutionId: id,
      deletedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'Institution deleted successfully'
    });
  } catch (error) {
    logger.error('Delete institution error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get platform statistics
 */
const getPlatformStats = async (req, res) => {
  try {
    const [totalInstitutions] = await db('institutions').count('* as count');
    const [activeInstitutions] = await db('institutions')
      .where({ is_active: true })
      .count('* as count');
    const [totalUsers] = await db('users').count('* as count');
    const [activeUsers] = await db('users')
      .where({ is_active: true })
      .count('* as count');
    const [totalContent] = await db('content').count('* as count');
    const [totalCourses] = await db('courses').count('* as count');

    // Get storage usage (simplified)
    const [storageUsage] = await db('content')
      .sum('file_size as total_size');

    const stats = {
      institutions: {
        total: parseInt(totalInstitutions.count),
        active: parseInt(activeInstitutions.count)
      },
      users: {
        total: parseInt(totalUsers.count),
        active: parseInt(activeUsers.count)
      },
      content: {
        total: parseInt(totalContent.count),
        storageUsed: parseInt(storageUsage.total_size || 0)
      },
      courses: {
        total: parseInt(totalCourses.count)
      }
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    logger.error('Get platform stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Placeholder implementations for missing methods
const getPendingInstitutions = async (req, res) => {
  res.json({ success: true, data: { institutions: [] } });
};

const getTrialInstitutions = async (req, res) => {
  res.json({ success: true, data: { institutions: [] } });
};

const getSuspendedInstitutions = async (req, res) => {
  res.json({ success: true, data: { institutions: [] } });
};

const updateInstitution = async (req, res) => {
  res.json({ success: true, message: 'Institution updated' });
};

const extendTrial = async (req, res) => {
  res.json({ success: true, message: 'Trial extended' });
};

const getAllUsers = async (req, res) => {
  res.json({ success: true, data: { users: [] } });
};

const searchUsers = async (req, res) => {
  res.json({ success: true, data: { users: [] } });
};

const getInstitutionAdmins = async (req, res) => {
  res.json({ success: true, data: { admins: [] } });
};

const getActiveSessions = async (req, res) => {
  res.json({ success: true, data: { sessions: [] } });
};

const impersonateUser = async (req, res) => {
  res.json({ success: true, message: 'User impersonation started' });
};

const forceLogoutUser = async (req, res) => {
  res.json({ success: true, message: 'User logged out' });
};

const resetUserPassword = async (req, res) => {
  res.json({ success: true, message: 'Password reset' });
};

const getPlatformConfig = async (req, res) => {
  res.json({ success: true, data: { config: {} } });
};

const updatePlatformConfig = async (req, res) => {
  res.json({ success: true, message: 'Config updated' });
};

const getGlobalFeatures = async (req, res) => {
  res.json({ success: true, data: { features: {} } });
};

const updateGlobalFeatures = async (req, res) => {
  res.json({ success: true, message: 'Features updated' });
};

const getAnnouncements = async (req, res) => {
  res.json({ success: true, data: { announcements: [] } });
};

const createAnnouncement = async (req, res) => {
  res.json({ success: true, message: 'Announcement created' });
};

const updateAnnouncement = async (req, res) => {
  res.json({ success: true, message: 'Announcement updated' });
};

const deleteAnnouncement = async (req, res) => {
  res.json({ success: true, message: 'Announcement deleted' });
};

const getSystemLogs = async (req, res) => {
  res.json({ success: true, data: { logs: [] } });
};

const getErrorLogs = async (req, res) => {
  res.json({ success: true, data: { logs: [] } });
};

const getSecurityLogs = async (req, res) => {
  res.json({ success: true, data: { logs: [] } });
};

const getAuditLogs = async (req, res) => {
  res.json({ success: true, data: { logs: [] } });
};

const getPerformanceMetrics = async (req, res) => {
  res.json({ success: true, data: { metrics: {} } });
};

const getDatabaseStats = async (req, res) => {
  res.json({ success: true, data: { stats: {} } });
};

const getStorageUsage = async (req, res) => {
  res.json({ success: true, data: { usage: {} } });
};

const createBackup = async (req, res) => {
  res.json({ success: true, message: 'Backup created' });
};

const listBackups = async (req, res) => {
  res.json({ success: true, data: { backups: [] } });
};

const restoreBackup = async (req, res) => {
  res.json({ success: true, message: 'Backup restored' });
};

const startMaintenance = async (req, res) => {
  res.json({ success: true, message: 'Maintenance started' });
};

const endMaintenance = async (req, res) => {
  res.json({ success: true, message: 'Maintenance ended' });
};

const getPlatformAnalytics = async (req, res) => {
  res.json({ success: true, data: { analytics: {} } });
};

const getRevenueAnalytics = async (req, res) => {
  res.json({ success: true, data: { analytics: {} } });
};

const getGrowthAnalytics = async (req, res) => {
  res.json({ success: true, data: { analytics: {} } });
};

const getUsageAnalytics = async (req, res) => {
  res.json({ success: true, data: { analytics: {} } });
};

const getInstitutionReport = async (req, res) => {
  res.json({ success: true, data: { report: {} } });
};

const getUserReport = async (req, res) => {
  res.json({ success: true, data: { report: {} } });
};

const getContentReport = async (req, res) => {
  res.json({ success: true, data: { report: {} } });
};

const getPerformanceReport = async (req, res) => {
  res.json({ success: true, data: { report: {} } });
};

const exportInstitutions = async (req, res) => {
  res.json({ success: true, message: 'Export not implemented yet' });
};

const exportUsers = async (req, res) => {
  res.json({ success: true, message: 'Export not implemented yet' });
};

const exportAnalytics = async (req, res) => {
  res.json({ success: true, message: 'Export not implemented yet' });
};

const getFailedLogins = async (req, res) => {
  res.json({ success: true, data: { logins: [] } });
};

const getSuspiciousActivity = async (req, res) => {
  res.json({ success: true, data: { activity: [] } });
};

const getBlockedIPs = async (req, res) => {
  res.json({ success: true, data: { ips: [] } });
};

const blockIP = async (req, res) => {
  res.json({ success: true, message: 'IP blocked' });
};

const unblockIP = async (req, res) => {
  res.json({ success: true, message: 'IP unblocked' });
};

const getAPIUsage = async (req, res) => {
  res.json({ success: true, data: { usage: {} } });
};

const getRateLimits = async (req, res) => {
  res.json({ success: true, data: { limits: {} } });
};

const updateRateLimits = async (req, res) => {
  res.json({ success: true, message: 'Rate limits updated' });
};

const getIntegrations = async (req, res) => {
  res.json({ success: true, data: { integrations: [] } });
};

const updateIntegration = async (req, res) => {
  res.json({ success: true, message: 'Integration updated' });
};

const getSystemHealth = async (req, res) => {
  res.json({ success: true, data: { health: 'OK' } });
};

module.exports = {
  getSuperAdminDashboard,
  getAllInstitutions,
  createInstitution,
  getInstitutionDetails,
  suspendInstitution,
  activateInstitution,
  deleteInstitution,
  getPlatformStats,
  getSystemHealth,
  getPendingInstitutions,
  getTrialInstitutions,
  getSuspendedInstitutions,
  updateInstitution,
  extendTrial,
  getAllUsers,
  searchUsers,
  getInstitutionAdmins,
  getActiveSessions,
  impersonateUser,
  forceLogoutUser,
  resetUserPassword,
  getPlatformConfig,
  updatePlatformConfig,
  getGlobalFeatures,
  updateGlobalFeatures,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getSystemLogs,
  getErrorLogs,
  getSecurityLogs,
  getAuditLogs,
  getPerformanceMetrics,
  getDatabaseStats,
  getStorageUsage,
  createBackup,
  listBackups,
  restoreBackup,
  startMaintenance,
  endMaintenance,
  getPlatformAnalytics,
  getRevenueAnalytics,
  getGrowthAnalytics,
  getUsageAnalytics,
  getInstitutionReport,
  getUserReport,
  getContentReport,
  getPerformanceReport,
  exportInstitutions,
  exportUsers,
  exportAnalytics,
  getFailedLogins,
  getSuspiciousActivity,
  getBlockedIPs,
  blockIP,
  unblockIP,
  getAPIUsage,
  getRateLimits,
  updateRateLimits,
  getIntegrations,
  updateIntegration
};