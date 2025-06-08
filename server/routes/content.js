const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { body, param, query } = require('express-validator');
const uploadMiddleware = require('../middleware/uploadMiddleware');

// Validation rules
const contentValidation = [
  body('title').notEmpty().withMessage('Content title is required'),
  body('chapterId').isUUID().withMessage('Valid chapter ID is required'),
  body('type').isIn(['pdf', 'mp4', 'mp3', 'epub', 'docx', 'image', 'url']).withMessage('Invalid content type')
];

const progressValidation = [
  body('progressPercentage').isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
  body('currentPage').optional().isInt({ min: 0 }).withMessage('Current page must be a positive number'),
  body('currentTimeSeconds').optional().isInt({ min: 0 }).withMessage('Current time must be a positive number')
];

const annotationValidation = [
  body('type').isIn(['highlight', 'note', 'bookmark']).withMessage('Invalid annotation type'),
  body('content').optional().notEmpty().withMessage('Annotation content cannot be empty'),
  body('position').isObject().withMessage('Position data is required')
];

// Content CRUD routes
router.get('/', contentController.getContent);
router.get('/search', contentController.searchContent);
router.get('/:id', param('id').isUUID(), contentController.getContentById);
router.get('/:id/metadata', param('id').isUUID(), contentController.getContentMetadata);

router.post('/', contentValidation, contentController.createContent);
router.post('/upload', uploadMiddleware.single('file'), contentController.uploadContent);
router.post('/bulk-upload', uploadMiddleware.array('files', 10), contentController.bulkUploadContent);
router.post('/url', contentController.addUrlContent);

router.put('/:id', param('id').isUUID(), contentController.updateContent);
router.put('/:id/metadata', param('id').isUUID(), contentController.updateContentMetadata);

router.delete('/:id', param('id').isUUID(), contentController.deleteContent);

// Content access and streaming
router.get('/:id/stream', param('id').isUUID(), contentController.streamContent);
router.get('/:id/download', param('id').isUUID(), contentController.downloadContent);
router.get('/:id/thumbnail', param('id').isUUID(), contentController.getContentThumbnail);

// Progress tracking
router.get('/:id/progress', param('id').isUUID(), contentController.getContentProgress);
router.put('/:id/progress', param('id').isUUID(), progressValidation, contentController.updateContentProgress);

// Annotations (highlights, notes, bookmarks)
router.get('/:id/annotations', param('id').isUUID(), contentController.getContentAnnotations);
router.post('/:id/annotations', param('id').isUUID(), annotationValidation, contentController.createAnnotation);
router.put('/:id/annotations/:annotationId', contentController.updateAnnotation);
router.delete('/:id/annotations/:annotationId', contentController.deleteAnnotation);

// Bookmarks
router.get('/bookmarks/my', contentController.getMyBookmarks);
router.post('/:id/bookmark', param('id').isUUID(), contentController.addBookmark);
router.delete('/:id/bookmark', param('id').isUUID(), contentController.removeBookmark);

// Reading session management
router.post('/:id/start-session', param('id').isUUID(), contentController.startReadingSession);
router.put('/:id/update-session', param('id').isUUID(), contentController.updateReadingSession);
router.post('/:id/end-session', param('id').isUUID(), contentController.endReadingSession);

// Content analytics
router.get('/:id/analytics', param('id').isUUID(), contentController.getContentAnalytics);
router.get('/analytics/popular', contentController.getPopularContent);
router.get('/analytics/recent', contentController.getRecentContent);

// Content sharing and permissions
router.get('/:id/permissions', param('id').isUUID(), contentController.getContentPermissions);
router.put('/:id/permissions', param('id').isUUID(), contentController.updateContentPermissions);
router.post('/:id/share', param('id').isUUID(), contentController.shareContent);

// Content organization
router.get('/by-chapter/:chapterId', param('chapterId').isUUID(), contentController.getContentByChapter);
router.get('/by-subject/:subjectId', param('subjectId').isUUID(), contentController.getContentBySubject);
router.get('/by-type/:type', contentController.getContentByType);

// Bulk operations
router.post('/bulk-assign', contentController.bulkAssignContent);
router.post('/bulk-delete', contentController.bulkDeleteContent);
router.post('/bulk-move', contentController.bulkMoveContent);

module.exports = router;