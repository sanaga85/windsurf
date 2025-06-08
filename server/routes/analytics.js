const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { param, query } = require('express-validator');

// Dashboard analytics
router.get('/dashboard', analyticsController.getDashboardAnalytics);
router.get('/dashboard/summary', analyticsController.getDashboardSummary);

// User analytics
router.get('/users', analyticsController.getUserAnalytics);
router.get('/users/activity', analyticsController.getUserActivityAnalytics);
router.get('/users/engagement', analyticsController.getUserEngagementAnalytics);
router.get('/users/progress', analyticsController.getUserProgressAnalytics);
router.get('/users/:id/activity', 
  param('id').isUUID().withMessage('Invalid user ID'),
  analyticsController.getUserActivityById
);

// Content analytics
router.get('/content', analyticsController.getContentAnalytics);
router.get('/content/popular', analyticsController.getPopularContent);
router.get('/content/engagement', analyticsController.getContentEngagement);
router.get('/content/completion', analyticsController.getContentCompletion);
router.get('/content/:id/analytics', 
  param('id').isUUID().withMessage('Invalid content ID'),
  analyticsController.getContentAnalyticsById
);

// Course analytics
router.get('/courses', analyticsController.getCourseAnalytics);
router.get('/courses/enrollment', analyticsController.getCourseEnrollmentAnalytics);
router.get('/courses/completion', analyticsController.getCourseCompletionAnalytics);
router.get('/courses/performance', analyticsController.getCoursePerformanceAnalytics);
router.get('/courses/:id/analytics', 
  param('id').isUUID().withMessage('Invalid course ID'),
  analyticsController.getCourseAnalyticsById
);

// Library analytics
router.get('/library', analyticsController.getLibraryAnalytics);
router.get('/library/borrowing', analyticsController.getBorrowingAnalytics);
router.get('/library/popular-items', analyticsController.getPopularLibraryItems);
router.get('/library/usage-trends', analyticsController.getLibraryUsageTrends);

// System analytics
router.get('/system', analyticsController.getSystemAnalytics);
router.get('/system/performance', analyticsController.getSystemPerformance);
router.get('/system/usage', analyticsController.getSystemUsage);
router.get('/system/errors', analyticsController.getSystemErrors);

// Institution analytics (for SuperAdmin)
router.get('/institutions', analyticsController.getInstitutionAnalytics);
router.get('/institutions/growth', analyticsController.getInstitutionGrowth);
router.get('/institutions/usage', analyticsController.getInstitutionUsage);
router.get('/institutions/:id/analytics', 
  param('id').isUUID().withMessage('Invalid institution ID'),
  analyticsController.getInstitutionAnalyticsById
);

// Real-time analytics
router.get('/realtime/active-users', analyticsController.getActiveUsers);
router.get('/realtime/current-sessions', analyticsController.getCurrentSessions);
router.get('/realtime/live-activity', analyticsController.getLiveActivity);

// Export analytics
router.get('/export/users', analyticsController.exportUserAnalytics);
router.get('/export/content', analyticsController.exportContentAnalytics);
router.get('/export/courses', analyticsController.exportCourseAnalytics);
router.get('/export/library', analyticsController.exportLibraryAnalytics);

// Custom reports
router.get('/reports/custom', analyticsController.getCustomReports);
router.post('/reports/custom', analyticsController.createCustomReport);
router.get('/reports/custom/:id', 
  param('id').isUUID().withMessage('Invalid report ID'),
  analyticsController.getCustomReportById
);
router.delete('/reports/custom/:id', 
  param('id').isUUID().withMessage('Invalid report ID'),
  analyticsController.deleteCustomReport
);

// Time-based analytics with filters
router.get('/trends/daily', analyticsController.getDailyTrends);
router.get('/trends/weekly', analyticsController.getWeeklyTrends);
router.get('/trends/monthly', analyticsController.getMonthlyTrends);
router.get('/trends/yearly', analyticsController.getYearlyTrends);

module.exports = router;