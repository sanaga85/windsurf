const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { body, param, query } = require('express-validator');
const uploadMiddleware = require('../middleware/uploadMiddleware');

// Middleware to check super admin role
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super admin role required.'
    });
  }
  next();
};

// Apply super admin middleware to all routes
router.use(requireSuperAdmin);

// Platform overview and dashboard
router.get('/dashboard', superAdminController.getDashboard);
router.get('/platform-stats', superAdminController.getPlatformStats);
router.get('/system-health', superAdminController.getSystemHealth);

// Institution management
router.get('/institutions', superAdminController.getAllInstitutions);
router.get('/institutions/:id', param('id').isUUID(), superAdminController.getInstitutionDetails);
router.post('/institutions', superAdminController.createInstitution);
router.put('/institutions/:id', param('id').isUUID(), superAdminController.updateInstitution);
router.put('/institutions/:id/activate', param('id').isUUID(), superAdminController.activateInstitution);
router.put('/institutions/:id/suspend', param('id').isUUID(), superAdminController.suspendInstitution);
router.delete('/institutions/:id', param('id').isUUID(), superAdminController.deleteInstitution);

// Institution analytics
router.get('/institutions/:id/analytics', param('id').isUUID(), superAdminController.getInstitutionAnalytics);
router.get('/institutions/:id/users', param('id').isUUID(), superAdminController.getInstitutionUsers);
router.get('/institutions/:id/usage', param('id').isUUID(), superAdminController.getInstitutionUsage);

// User management across platform
router.get('/users', superAdminController.getAllUsers);
router.get('/users/search', superAdminController.searchUsers);
router.get('/users/:id', param('id').isUUID(), superAdminController.getUserDetails);
router.put('/users/:id/impersonate', param('id').isUUID(), superAdminController.impersonateUser);
router.put('/users/:id/reset-password', param('id').isUUID(), superAdminController.resetUserPassword);
router.put('/users/:id/activate', param('id').isUUID(), superAdminController.activateUser);
router.put('/users/:id/deactivate', param('id').isUUID(), superAdminController.deactivateUser);

// Platform configuration
router.get('/config', superAdminController.getPlatformConfig);
router.put('/config', superAdminController.updatePlatformConfig);
router.get('/features', superAdminController.getFeatureFlags);
router.put('/features', superAdminController.updateFeatureFlags);

// Global announcements
router.get('/announcements', superAdminController.getGlobalAnnouncements);
router.post('/announcements', superAdminController.createGlobalAnnouncement);
router.put('/announcements/:id', param('id').isUUID(), superAdminController.updateGlobalAnnouncement);
router.delete('/announcements/:id', param('id').isUUID(), superAdminController.deleteGlobalAnnouncement);
router.post('/announcements/:id/send', param('id').isUUID(), superAdminController.sendGlobalAnnouncement);

// System monitoring and logs
router.get('/logs/system', superAdminController.getSystemLogs);
router.get('/logs/errors', superAdminController.getErrorLogs);
router.get('/logs/audit', superAdminController.getAuditLogs);
router.get('/logs/performance', superAdminController.getPerformanceLogs);

// Analytics and reporting
router.get('/analytics/platform', superAdminController.getPlatformAnalytics);
router.get('/analytics/revenue', superAdminController.getRevenueAnalytics);
router.get('/analytics/growth', superAdminController.getGrowthAnalytics);
router.get('/analytics/usage', superAdminController.getUsageAnalytics);

// Subscription and billing management
router.get('/subscriptions', superAdminController.getSubscriptions);
router.get('/subscriptions/:id', param('id').isUUID(), superAdminController.getSubscriptionDetails);
router.put('/subscriptions/:id/extend', param('id').isUUID(), superAdminController.extendSubscription);
router.put('/subscriptions/:id/cancel', param('id').isUUID(), superAdminController.cancelSubscription);

// Backup and maintenance
router.get('/backups', superAdminController.getBackups);
router.post('/backups/create', superAdminController.createBackup);
router.post('/backups/:id/restore', param('id').isUUID(), superAdminController.restoreBackup);
router.delete('/backups/:id', param('id').isUUID(), superAdminController.deleteBackup);

// System maintenance
router.get('/maintenance/status', superAdminController.getMaintenanceStatus);
router.post('/maintenance/enable', superAdminController.enableMaintenanceMode);
router.post('/maintenance/disable', superAdminController.disableMaintenanceMode);
router.post('/maintenance/schedule', superAdminController.scheduleMaintenanceWindow);

// Database operations
router.get('/database/stats', superAdminController.getDatabaseStats);
router.post('/database/optimize', superAdminController.optimizeDatabase);
router.post('/database/cleanup', superAdminController.cleanupDatabase);

// File and storage management
router.get('/storage/usage', superAdminController.getStorageUsage);
router.get('/storage/files', superAdminController.getStorageFiles);
router.delete('/storage/cleanup', superAdminController.cleanupStorage);

// Security and audit
router.get('/security/threats', superAdminController.getSecurityThreats);
router.get('/security/failed-logins', superAdminController.getFailedLogins);
router.get('/security/suspicious-activity', superAdminController.getSuspiciousActivity);
router.post('/security/block-ip', superAdminController.blockIP);
router.delete('/security/unblock-ip/:ip', superAdminController.unblockIP);

// API management
router.get('/api/usage', superAdminController.getAPIUsage);
router.get('/api/rate-limits', superAdminController.getRateLimits);
router.put('/api/rate-limits', superAdminController.updateRateLimits);
router.get('/api/keys', superAdminController.getAPIKeys);
router.post('/api/keys', superAdminController.createAPIKey);
router.delete('/api/keys/:id', param('id').isUUID(), superAdminController.revokeAPIKey);

// Email and notification management
router.get('/notifications/templates', superAdminController.getNotificationTemplates);
router.put('/notifications/templates/:id', param('id').isUUID(), superAdminController.updateNotificationTemplate);
router.get('/notifications/queue', superAdminController.getNotificationQueue);
router.post('/notifications/test', superAdminController.testNotification);

// Integration management
router.get('/integrations', superAdminController.getIntegrations);
router.put('/integrations/:name', superAdminController.updateIntegration);
router.post('/integrations/:name/test', superAdminController.testIntegration);

// Export and import
router.get('/export/platform-data', superAdminController.exportPlatformData);
router.post('/import/platform-data', uploadMiddleware.single('file'), superAdminController.importPlatformData);

module.exports = router;