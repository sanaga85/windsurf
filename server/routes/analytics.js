const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { param, query } = require('express-validator');

// Institution-wide analytics
router.get('/overview', analyticsController.getInstitutionOverview);
router.get('/dashboard', analyticsController.getDashboardData);

// User analytics
router.get('/users/activity', analyticsController.getUserActivity);
router.get('/users/engagement', analyticsController.getUserEngagement);
router.get('/users/progress', analyticsController.getUserProgress);
router.get('/users/login-stats', analyticsController.getLoginStats);
router.get('/users/:userId/detailed', param('userId').isUUID(), analyticsController.getUserDetailedAnalytics);

// Content analytics
router.get('/content/popular', analyticsController.getPopularContent);
router.get('/content/engagement', analyticsController.getContentEngagement);
router.get('/content/completion-rates', analyticsController.getContentCompletionRates);
router.get('/content/:contentId/analytics', param('contentId').isUUID(), analyticsController.getContentAnalytics);

// Course analytics
router.get('/courses/enrollment', analyticsController.getCourseEnrollmentStats);
router.get('/courses/progress', analyticsController.getCourseProgressStats);
router.get('/courses/completion', analyticsController.getCourseCompletionStats);
router.get('/courses/:courseId/analytics', param('courseId').isUUID(), analyticsController.getCourseAnalytics);

// Library analytics
router.get('/library/borrowing-trends', analyticsController.getLibraryBorrowingTrends);
router.get('/library/popular-items', analyticsController.getLibraryPopularItems);
router.get('/library/usage-stats', analyticsController.getLibraryUsageStats);
router.get('/library/overdue-analysis', analyticsController.getLibraryOverdueAnalysis);

// Faculty analytics
router.get('/faculty/performance', analyticsController.getFacultyPerformance);
router.get('/faculty/content-uploads', analyticsController.getFacultyContentUploads);
router.get('/faculty/:facultyId/analytics', param('facultyId').isUUID(), analyticsController.getFacultyAnalytics);

// System analytics
router.get('/system/performance', analyticsController.getSystemPerformance);
router.get('/system/usage-patterns', analyticsController.getUsagePatterns);
router.get('/system/error-rates', analyticsController.getErrorRates);
router.get('/system/storage-usage', analyticsController.getStorageUsage);

// Time-based analytics
router.get('/trends/daily', analyticsController.getDailyTrends);
router.get('/trends/weekly', analyticsController.getWeeklyTrends);
router.get('/trends/monthly', analyticsController.getMonthlyTrends);

// Comparative analytics
router.get('/compare/periods', analyticsController.comparePeriods);
router.get('/compare/cohorts', analyticsController.compareCohorts);
router.get('/compare/subjects', analyticsController.compareSubjects);

// Export analytics
router.get('/export/users', analyticsController.exportUserAnalytics);
router.get('/export/content', analyticsController.exportContentAnalytics);
router.get('/export/courses', analyticsController.exportCourseAnalytics);
router.get('/export/library', analyticsController.exportLibraryAnalytics);

// Real-time analytics
router.get('/realtime/active-users', analyticsController.getActiveUsers);
router.get('/realtime/current-sessions', analyticsController.getCurrentSessions);
router.get('/realtime/live-activity', analyticsController.getLiveActivity);

// Custom reports
router.get('/reports/custom', analyticsController.getCustomReport);
router.post('/reports/generate', analyticsController.generateCustomReport);
router.get('/reports/scheduled', analyticsController.getScheduledReports);
router.post('/reports/schedule', analyticsController.scheduleReport);

// Alerts and notifications
router.get('/alerts/thresholds', analyticsController.getAlertThresholds);
router.put('/alerts/thresholds', analyticsController.updateAlertThresholds);
router.get('/alerts/triggered', analyticsController.getTriggeredAlerts);

module.exports = router;