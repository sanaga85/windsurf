const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { body, param, query } = require('express-validator');
const uploadMiddleware = require('../middleware/uploadMiddleware');

// Validation rules
const createContentValidation = [
  body('title').notEmpty().withMessage('Content title is required'),
  body('type').isIn(['pdf', 'video', 'audio', 'epub', 'document', 'url']).withMessage('Invalid content type'),
  body('courseId').isUUID().withMessage('Valid course ID is required')
];

const updateContentValidation = [
  body('title').optional().notEmpty().withMessage('Content title cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty')
];

const annotationValidation = [
  body('type').isIn(['highlight', 'note', 'bookmark']).withMessage('Invalid annotation type'),
  body('content').notEmpty().withMessage('Annotation content is required'),
  body('position').isObject().withMessage('Position object is required')
];

// Routes
router.get('/', contentController.getContent);
router.get('/search', contentController.searchContent);
router.get('/recent', contentController.getRecentContent);
router.get('/my-content', contentController.getMyContent);

router.get('/:id', param('id').isUUID().withMessage('Invalid content ID'), contentController.getContentById);
router.get('/:id/annotations', param('id').isUUID().withMessage('Invalid content ID'), contentController.getContentAnnotations);
router.get('/:id/progress', param('id').isUUID().withMessage('Invalid content ID'), contentController.getContentProgress);
router.get('/:id/analytics', param('id').isUUID().withMessage('Invalid content ID'), contentController.getContentAnalytics);

// File upload routes
router.post('/upload', uploadMiddleware.single('file'), contentController.uploadContent);
router.post('/upload-multiple', uploadMiddleware.array('files', 10), contentController.uploadMultipleContent);

// Content management routes
router.post('/', createContentValidation, contentController.createContent);
router.post('/url', 
  body('title').notEmpty().withMessage('Content title is required'),
  body('url').isURL().withMessage('Valid URL is required'),
  body('courseId').isUUID().withMessage('Valid course ID is required'),
  contentController.createUrlContent
);

router.put('/:id', 
  param('id').isUUID().withMessage('Invalid content ID'),
  updateContentValidation,
  contentController.updateContent
);

router.patch('/:id/publish', 
  param('id').isUUID().withMessage('Invalid content ID'),
  contentController.publishContent
);

router.patch('/:id/unpublish', 
  param('id').isUUID().withMessage('Invalid content ID'),
  contentController.unpublishContent
);

router.delete('/:id', 
  param('id').isUUID().withMessage('Invalid content ID'),
  contentController.deleteContent
);

// Annotation routes
router.post('/:id/annotations', 
  param('id').isUUID().withMessage('Invalid content ID'),
  annotationValidation,
  contentController.createAnnotation
);

router.put('/:id/annotations/:annotationId', 
  param('id').isUUID().withMessage('Invalid content ID'),
  param('annotationId').isUUID().withMessage('Invalid annotation ID'),
  contentController.updateAnnotation
);

router.delete('/:id/annotations/:annotationId', 
  param('id').isUUID().withMessage('Invalid content ID'),
  param('annotationId').isUUID().withMessage('Invalid annotation ID'),
  contentController.deleteAnnotation
);

// Progress tracking routes
router.post('/:id/progress', 
  param('id').isUUID().withMessage('Invalid content ID'),
  body('position').isObject().withMessage('Position object is required'),
  body('percentage').isFloat({ min: 0, max: 100 }).withMessage('Percentage must be between 0 and 100'),
  contentController.updateProgress
);

router.post('/:id/complete', 
  param('id').isUUID().withMessage('Invalid content ID'),
  contentController.markAsComplete
);

// Content interaction routes
router.post('/:id/view', 
  param('id').isUUID().withMessage('Invalid content ID'),
  contentController.recordView
);

router.post('/:id/download', 
  param('id').isUUID().withMessage('Invalid content ID'),
  contentController.recordDownload
);

// Bulk operations
router.post('/bulk-upload', uploadMiddleware.array('files', 50), contentController.bulkUploadContent);
router.post('/bulk-assign', 
  body('contentIds').isArray({ min: 1 }).withMessage('Content IDs array is required'),
  body('courseIds').isArray({ min: 1 }).withMessage('Course IDs array is required'),
  contentController.bulkAssignContent
);

router.delete('/bulk-delete', 
  body('contentIds').isArray({ min: 1 }).withMessage('Content IDs array is required'),
  contentController.bulkDeleteContent
);

module.exports = router;