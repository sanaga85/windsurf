const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { body, param, query } = require('express-validator');

// Middleware to check SuperAdmin role
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. SuperAdmin role required.'
    });
  }
  next();
};

// Apply SuperAdmin middleware to all routes
router.use(requireSuperAdmin);

// Platform overview
router.get('/dashboard', superAdminController.getSuperAdminDashboard);
router.get('/platform-stats', superAdminController.getPlatformStats);
router.get('/system-health', superAdminController.getSystemHealth);

// Institution management
router.get('/institutions', superAdminController.getAllInstitutions);
router.get('/institutions/pending', superAdminController.getPendingInstitutions);
router.get('/institutions/trial', superAdminController.getTrialInstitutions);
router.get('/institutions/suspended', superAdminController.getSuspendedInstitutions);

router.post('/institutions', 
  body('name').notEmpty().withMessage('Institution name is required'),
  body('slug').notEmpty().withMessage('Institution slug is required'),
  body('subdomain').notEmpty().withMessage('Subdomain is required'),
  body('type').isIn(['school', 'university', 'corporate', 'coaching']).withMessage('Invalid institution type'),
  body('adminEmail').isEmail().withMessage('Valid admin email is required'),
  body('adminPhone').isMobilePhone().withMessage('Valid admin phone is required'),
  superAdminController.createInstitution
);

router.get('/institutions/:id', 
  param('id').isUUID().withMessage('Invalid institution ID'),
  superAdminController.getInstitutionDetails
);

router.put('/institutions/:id', 
  param('id').isUUID().withMessage('Invalid institution ID'),
  superAdminController.updateInstitution
);

router.patch('/institutions/:id/activate', 
  param('id').isUUID().withMessage('Invalid institution ID'),
  superAdminController.activateInstitution
);

router.patch('/institutions/:id/suspend', 
  param('id').isUUID().withMessage('Invalid institution ID'),
  body('reason').notEmpty().withMessage('Suspension reason is required'),
  superAdminController.suspendInstitution
);

router.patch('/institutions/:id/extend-trial', 
  param('id').isUUID().withMessage('Invalid institution ID'),
  body('days').isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
  superAdminController.extendTrial
);

router.delete('/institutions/:id', 
  param('id').isUUID().withMessage('Invalid institution ID'),
  superAdminController.deleteInstitution
);

// User management across platform
router.get('/users', superAdminController.getAllUsers);
router.get('/users/search', superAdminController.searchUsers);
router.get('/users/admins', superAdminController.getInstitutionAdmins);
router.get('/users/active-sessions', superAdminController.getActiveSessions);

router.post('/users/impersonate', 
  body('userId').isUUID().withMessage('Valid user ID is required'),
  superAdminController.impersonateUser
);

router.patch('/users/:id/force-logout', 
  param('id').isUUID().withMessage('Invalid user ID'),
  superAdminController.forceLogoutUser
);

router.patch('/users/:id/reset-password', 
  param('id').isUUID().withMessage('Invalid user ID'),
  superAdminController.resetUserPassword
);

// Platform configuration
router.get('/config', superAdminController.getPlatformConfig);
router.put('/config', superAdminController.updatePlatformConfig);

router.get('/features', superAdminController.getGlobalFeatures);
router.put('/features', superAdminController.updateGlobalFeatures);

// Announcements
router.get('/announcements', superAdminController.getAnnouncements);
router.post('/announcements', 
  body('title').notEmpty().withMessage('Announcement title is required'),
  body('content').notEmpty().withMessage('Announcement content is required'),
  body('type').isIn(['info', 'warning', 'success', 'error']).withMessage('Invalid announcement type'),
  body('targetAudience').isIn(['all', 'admins', 'faculty', 'students']).withMessage('Invalid target audience'),
  superAdminController.createAnnouncement
);

router.put('/announcements/:id', 
  param('id').isUUID().withMessage('Invalid announcement ID'),
  superAdminController.updateAnnouncement
);

router.delete('/announcements/:id', 
  param('id').isUUID().withMessage('Invalid announcement ID'),
  superAdminController.deleteAnnouncement
);

// System monitoring
router.get('/logs', superAdminController.getSystemLogs);
router.get('/logs/errors', superAdminController.getErrorLogs);
router.get('/logs/security', superAdminController.getSecurityLogs);
router.get('/logs/audit', superAdminController.getAuditLogs);

router.get('/performance', superAdminController.getPerformanceMetrics);
router.get('/database-stats', superAdminController.getDatabaseStats);
router.get('/storage-usage', superAdminController.getStorageUsage);

// Backup and maintenance
router.post('/backup/create', superAdminController.createBackup);
router.get('/backup/list', superAdminController.listBackups);
router.post('/backup/restore', 
  body('backupId').notEmpty().withMessage('Backup ID is required'),
  superAdminController.restoreBackup
);

router.post('/maintenance/start', 
  body('message').notEmpty().withMessage('Maintenance message is required'),
  body('estimatedDuration').isInt({ min: 1 }).withMessage('Estimated duration in minutes is required'),
  superAdminController.startMaintenance
);

router.post('/maintenance/end', superAdminController.endMaintenance);

// Analytics and reporting
router.get('/analytics/platform', superAdminController.getPlatformAnalytics);
router.get('/analytics/revenue', superAdminController.getRevenueAnalytics);
router.get('/analytics/growth', superAdminController.getGrowthAnalytics);
router.get('/analytics/usage', superAdminController.getUsageAnalytics);

router.get('/reports/institutions', superAdminController.getInstitutionReport);
router.get('/reports/users', superAdminController.getUserReport);
router.get('/reports/content', superAdminController.getContentReport);
router.get('/reports/performance', superAdminController.getPerformanceReport);

// Export data
router.get('/export/institutions', superAdminController.exportInstitutions);
router.get('/export/users', superAdminController.exportUsers);
router.get('/export/analytics', superAdminController.exportAnalytics);

// Security management
router.get('/security/failed-logins', superAdminController.getFailedLogins);
router.get('/security/suspicious-activity', superAdminController.getSuspiciousActivity);
router.get('/security/blocked-ips', superAdminController.getBlockedIPs);

router.post('/security/block-ip', 
  body('ip').isIP().withMessage('Valid IP address is required'),
  body('reason').notEmpty().withMessage('Block reason is required'),
  superAdminController.blockIP
);

router.delete('/security/unblock-ip/:ip', 
  param('ip').isIP().withMessage('Valid IP address is required'),
  superAdminController.unblockIP
);

// API management
router.get('/api/usage', superAdminController.getAPIUsage);
router.get('/api/rate-limits', superAdminController.getRateLimits);
router.put('/api/rate-limits', superAdminController.updateRateLimits);

// Integration management
router.get('/integrations', superAdminController.getIntegrations);
router.put('/integrations/:name', 
  param('name').notEmpty().withMessage('Integration name is required'),
  superAdminController.updateIntegration
);

module.exports = router;