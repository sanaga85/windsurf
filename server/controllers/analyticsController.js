const db = require('../database/connection');
const logger = require('../utils/logger');

/**
 * Get dashboard analytics
 */
const getDashboardAnalytics = async (req, res) => {
  try {
    const institutionId = req.user.institutionId;
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get basic counts
    const [userCount] = await db('users')
      .where({ institution_id: institutionId, is_active: true })
      .count('* as count');

    const [courseCount] = await db('courses')
      .where({ institution_id: institutionId, is_active: true })
      .count('* as count');

    const [contentCount] = await db('content')
      .where({ institution_id: institutionId, is_published: true })
      .count('* as count');

    const [libraryItemCount] = await db('library_items')
      .where({ institution_id: institutionId, deleted_at: null })
      .count('* as count');

    // Get active users in time range
    const [activeUserCount] = await db('users')
      .where({ institution_id: institutionId, is_active: true })
      .where('last_login_at', '>=', startDate)
      .count('* as count');

    // Get content views in time range
    const [contentViewCount] = await db('content_views')
      .join('content', 'content_views.content_id', 'content.id')
      .where({ 'content.institution_id': institutionId })
      .where('content_views.viewed_at', '>=', startDate)
      .count('* as count');

    // Get library borrowings in time range
    const [borrowingCount] = await db('library_borrowings')
      .join('library_items', 'library_borrowings.item_id', 'library_items.id')
      .where({ 'library_items.institution_id': institutionId })
      .where('library_borrowings.borrowed_at', '>=', startDate)
      .count('* as count');

    // Get user role distribution
    const userRoles = await db('users')
      .where({ institution_id: institutionId, is_active: true })
      .groupBy('role')
      .select('role')
      .count('* as count');

    // Get daily activity for the time range
    const dailyActivity = await db('content_views')
      .join('content', 'content_views.content_id', 'content.id')
      .where({ 'content.institution_id': institutionId })
      .where('content_views.viewed_at', '>=', startDate)
      .select(db.raw('DATE(content_views.viewed_at) as date'))
      .count('* as views')
      .groupBy(db.raw('DATE(content_views.viewed_at)'))
      .orderBy('date');

    const analytics = {
      summary: {
        totalUsers: parseInt(userCount.count),
        totalCourses: parseInt(courseCount.count),
        totalContent: parseInt(contentCount.count),
        totalLibraryItems: parseInt(libraryItemCount.count),
        activeUsers: parseInt(activeUserCount.count),
        contentViews: parseInt(contentViewCount.count),
        libraryBorrowings: parseInt(borrowingCount.count)
      },
      userRoles: userRoles.map(role => ({
        role: role.role,
        count: parseInt(role.count)
      })),
      dailyActivity,
      timeRange
    };

    res.json({
      success: true,
      data: { analytics }
    });
  } catch (error) {
    logger.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get dashboard summary
 */
const getDashboardSummary = async (req, res) => {
  try {
    const institutionId = req.user.institutionId;

    // Get basic counts
    const [userCount] = await db('users')
      .where({ institution_id: institutionId, is_active: true })
      .count('* as count');

    const [courseCount] = await db('courses')
      .where({ institution_id: institutionId, is_active: true })
      .count('* as count');

    const [contentCount] = await db('content')
      .where({ institution_id: institutionId, is_published: true })
      .count('* as count');

    const [libraryItemCount] = await db('library_items')
      .where({ institution_id: institutionId, deleted_at: null })
      .count('* as count');

    // Get recent activity counts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentLogins] = await db('users')
      .where({ institution_id: institutionId, is_active: true })
      .where('last_login_at', '>=', sevenDaysAgo)
      .count('* as count');

    const [recentContent] = await db('content')
      .where({ institution_id: institutionId })
      .where('created_at', '>=', sevenDaysAgo)
      .count('* as count');

    const summary = {
      totalUsers: parseInt(userCount.count),
      totalCourses: parseInt(courseCount.count),
      totalContent: parseInt(contentCount.count),
      totalLibraryItems: parseInt(libraryItemCount.count),
      recentLogins: parseInt(recentLogins.count),
      recentContent: parseInt(recentContent.count)
    };

    res.json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    logger.error('Get dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get user analytics
 */
const getUserAnalytics = async (req, res) => {
  try {
    const institutionId = req.user.institutionId;
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get user registration trends
    const registrationTrends = await db('users')
      .where({ institution_id: institutionId })
      .where('created_at', '>=', startDate)
      .select(db.raw('DATE(created_at) as date'))
      .count('* as registrations')
      .groupBy(db.raw('DATE(created_at)'))
      .orderBy('date');

    // Get user activity trends
    const activityTrends = await db('users')
      .where({ institution_id: institutionId, is_active: true })
      .where('last_login_at', '>=', startDate)
      .select(db.raw('DATE(last_login_at) as date'))
      .count('* as logins')
      .groupBy(db.raw('DATE(last_login_at)'))
      .orderBy('date');

    // Get user role distribution
    const roleDistribution = await db('users')
      .where({ institution_id: institutionId, is_active: true })
      .groupBy('role')
      .select('role')
      .count('* as count');

    const analytics = {
      registrationTrends,
      activityTrends,
      roleDistribution: roleDistribution.map(role => ({
        role: role.role,
        count: parseInt(role.count)
      })),
      timeRange
    };

    res.json({
      success: true,
      data: { analytics }
    });
  } catch (error) {
    logger.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get content analytics
 */
const getContentAnalytics = async (req, res) => {
  try {
    const institutionId = req.user.institutionId;
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get content type distribution
    const typeDistribution = await db('content')
      .where({ institution_id: institutionId, is_published: true })
      .groupBy('type')
      .select('type')
      .count('* as count');

    // Get content views over time
    const viewTrends = await db('content_views')
      .join('content', 'content_views.content_id', 'content.id')
      .where({ 'content.institution_id': institutionId })
      .where('content_views.viewed_at', '>=', startDate)
      .select(db.raw('DATE(content_views.viewed_at) as date'))
      .count('* as views')
      .groupBy(db.raw('DATE(content_views.viewed_at)'))
      .orderBy('date');

    // Get most viewed content
    const popularContent = await db('content_views')
      .join('content', 'content_views.content_id', 'content.id')
      .where({ 'content.institution_id': institutionId })
      .where('content_views.viewed_at', '>=', startDate)
      .groupBy('content.id', 'content.title')
      .select('content.id', 'content.title')
      .count('* as views')
      .orderBy('views', 'desc')
      .limit(10);

    const analytics = {
      typeDistribution: typeDistribution.map(type => ({
        type: type.type,
        count: parseInt(type.count)
      })),
      viewTrends,
      popularContent: popularContent.map(content => ({
        id: content.id,
        title: content.title,
        views: parseInt(content.views)
      })),
      timeRange
    };

    res.json({
      success: true,
      data: { analytics }
    });
  } catch (error) {
    logger.error('Get content analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get library analytics
 */
const getLibraryAnalytics = async (req, res) => {
  try {
    const institutionId = req.user.institutionId;
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get borrowing trends
    const borrowingTrends = await db('library_borrowings')
      .join('library_items', 'library_borrowings.item_id', 'library_items.id')
      .where({ 'library_items.institution_id': institutionId })
      .where('library_borrowings.borrowed_at', '>=', startDate)
      .select(db.raw('DATE(library_borrowings.borrowed_at) as date'))
      .count('* as borrowings')
      .groupBy(db.raw('DATE(library_borrowings.borrowed_at)'))
      .orderBy('date');

    // Get item type distribution
    const typeDistribution = await db('library_items')
      .where({ institution_id: institutionId, deleted_at: null })
      .groupBy('type')
      .select('type')
      .count('* as count');

    // Get most borrowed items
    const popularItems = await db('library_borrowings')
      .join('library_items', 'library_borrowings.item_id', 'library_items.id')
      .where({ 'library_items.institution_id': institutionId })
      .where('library_borrowings.borrowed_at', '>=', startDate)
      .groupBy('library_items.id', 'library_items.title')
      .select('library_items.id', 'library_items.title')
      .count('* as borrowings')
      .orderBy('borrowings', 'desc')
      .limit(10);

    // Get overdue statistics
    const [overdueCount] = await db('library_borrowings')
      .join('library_items', 'library_borrowings.item_id', 'library_items.id')
      .where({ 
        'library_items.institution_id': institutionId,
        'library_borrowings.status': 'borrowed'
      })
      .where('library_borrowings.due_date', '<', new Date())
      .count('* as count');

    const analytics = {
      borrowingTrends,
      typeDistribution: typeDistribution.map(type => ({
        type: type.type,
        count: parseInt(type.count)
      })),
      popularItems: popularItems.map(item => ({
        id: item.id,
        title: item.title,
        borrowings: parseInt(item.borrowings)
      })),
      overdueCount: parseInt(overdueCount.count),
      timeRange
    };

    res.json({
      success: true,
      data: { analytics }
    });
  } catch (error) {
    logger.error('Get library analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Placeholder implementations for missing methods
const getUserActivityAnalytics = async (req, res) => {
  res.json({ success: true, data: { analytics: {} } });
};

const getUserEngagementAnalytics = async (req, res) => {
  res.json({ success: true, data: { analytics: {} } });
};

const getUserProgressAnalytics = async (req, res) => {
  res.json({ success: true, data: { analytics: {} } });
};

const getUserActivityById = async (req, res) => {
  res.json({ success: true, data: { activity: {} } });
};

const getPopularContent = async (req, res) => {
  res.json({ success: true, data: { content: [] } });
};

const getContentEngagement = async (req, res) => {
  res.json({ success: true, data: { engagement: {} } });
};

const getContentCompletion = async (req, res) => {
  res.json({ success: true, data: { completion: {} } });
};

const getContentAnalyticsById = async (req, res) => {
  res.json({ success: true, data: { analytics: {} } });
};

const getCourseAnalytics = async (req, res) => {
  res.json({ success: true, data: { analytics: {} } });
};

const getCourseEnrollmentAnalytics = async (req, res) => {
  res.json({ success: true, data: { analytics: {} } });
};

const getCourseCompletionAnalytics = async (req, res) => {
  res.json({ success: true, data: { analytics: {} } });
};

const getCoursePerformanceAnalytics = async (req, res) => {
  res.json({ success: true, data: { analytics: {} } });
};

const getCourseAnalyticsById = async (req, res) => {
  res.json({ success: true, data: { analytics: {} } });
};

const getPopularLibraryItems = async (req, res) => {
  res.json({ success: true, data: { items: [] } });
};

const getLibraryUsageTrends = async (req, res) => {
  res.json({ success: true, data: { trends: {} } });
};

const getSystemAnalytics = async (req, res) => {
  res.json({ success: true, data: { analytics: {} } });
};

const getSystemPerformance = async (req, res) => {
  res.json({ success: true, data: { performance: {} } });
};

const getSystemUsage = async (req, res) => {
  res.json({ success: true, data: { usage: {} } });
};

const getSystemErrors = async (req, res) => {
  res.json({ success: true, data: { errors: [] } });
};

const getInstitutionAnalytics = async (req, res) => {
  res.json({ success: true, data: { analytics: {} } });
};

const getInstitutionGrowth = async (req, res) => {
  res.json({ success: true, data: { growth: {} } });
};

const getInstitutionUsage = async (req, res) => {
  res.json({ success: true, data: { usage: {} } });
};

const getInstitutionAnalyticsById = async (req, res) => {
  res.json({ success: true, data: { analytics: {} } });
};

const getActiveUsers = async (req, res) => {
  res.json({ success: true, data: { activeUsers: 0 } });
};

const getCurrentSessions = async (req, res) => {
  res.json({ success: true, data: { sessions: [] } });
};

const getLiveActivity = async (req, res) => {
  res.json({ success: true, data: { activity: [] } });
};

const exportUserAnalytics = async (req, res) => {
  res.json({ success: true, message: 'Export not implemented yet' });
};

const exportContentAnalytics = async (req, res) => {
  res.json({ success: true, message: 'Export not implemented yet' });
};

const exportCourseAnalytics = async (req, res) => {
  res.json({ success: true, message: 'Export not implemented yet' });
};

const exportLibraryAnalytics = async (req, res) => {
  res.json({ success: true, message: 'Export not implemented yet' });
};

const getCustomReports = async (req, res) => {
  res.json({ success: true, data: { reports: [] } });
};

const createCustomReport = async (req, res) => {
  res.json({ success: true, message: 'Custom report created' });
};

const getCustomReportById = async (req, res) => {
  res.json({ success: true, data: { report: {} } });
};

const deleteCustomReport = async (req, res) => {
  res.json({ success: true, message: 'Custom report deleted' });
};

const getDailyTrends = async (req, res) => {
  res.json({ success: true, data: { trends: [] } });
};

const getWeeklyTrends = async (req, res) => {
  res.json({ success: true, data: { trends: [] } });
};

const getMonthlyTrends = async (req, res) => {
  res.json({ success: true, data: { trends: [] } });
};

const getYearlyTrends = async (req, res) => {
  res.json({ success: true, data: { trends: [] } });
};

module.exports = {
  getDashboardAnalytics,
  getDashboardSummary,
  getUserAnalytics,
  getContentAnalytics,
  getLibraryAnalytics,
  getUserActivityAnalytics,
  getUserEngagementAnalytics,
  getUserProgressAnalytics,
  getUserActivityById,
  getPopularContent,
  getContentEngagement,
  getContentCompletion,
  getContentAnalyticsById,
  getCourseAnalytics,
  getCourseEnrollmentAnalytics,
  getCourseCompletionAnalytics,
  getCoursePerformanceAnalytics,
  getCourseAnalyticsById,
  getPopularLibraryItems,
  getLibraryUsageTrends,
  getSystemAnalytics,
  getSystemPerformance,
  getSystemUsage,
  getSystemErrors,
  getInstitutionAnalytics,
  getInstitutionGrowth,
  getInstitutionUsage,
  getInstitutionAnalyticsById,
  getActiveUsers,
  getCurrentSessions,
  getLiveActivity,
  exportUserAnalytics,
  exportContentAnalytics,
  exportCourseAnalytics,
  exportLibraryAnalytics,
  getCustomReports,
  createCustomReport,
  getCustomReportById,
  deleteCustomReport,
  getDailyTrends,
  getWeeklyTrends,
  getMonthlyTrends,
  getYearlyTrends
};