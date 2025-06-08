const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { body, param, query } = require('express-validator');

// Validation rules
const createCourseValidation = [
  body('name').notEmpty().withMessage('Course name is required'),
  body('code').optional().notEmpty().withMessage('Course code cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
  body('parentId').optional().isUUID().withMessage('Invalid parent ID')
];

const updateCourseValidation = [
  body('name').optional().notEmpty().withMessage('Course name cannot be empty'),
  body('code').optional().notEmpty().withMessage('Course code cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty')
];

const enrollmentValidation = [
  body('userIds').isArray({ min: 1 }).withMessage('User IDs array is required'),
  body('userIds.*').isUUID().withMessage('Invalid user ID')
];

const bulkCreateValidation = [
  body('courses').isArray({ min: 1 }).withMessage('Courses array is required'),
  body('courses.*.name').notEmpty().withMessage('Course name is required for all courses'),
  body('courses.*.parentId').optional().isUUID().withMessage('Invalid parent ID')
];

// Routes
router.get('/', courseController.getCourses);
router.get('/hierarchy', courseController.getCourseHierarchy);
router.get('/search', courseController.searchCourses);
router.get('/my-courses', courseController.getMyCourses);
router.get('/templates', courseController.getCourseTemplates);

router.get('/:id', param('id').isUUID().withMessage('Invalid course ID'), courseController.getCourseById);
router.get('/:id/children', param('id').isUUID().withMessage('Invalid course ID'), courseController.getCourseChildren);
router.get('/:id/content', param('id').isUUID().withMessage('Invalid course ID'), courseController.getCourseContent);
router.get('/:id/enrollments', param('id').isUUID().withMessage('Invalid course ID'), courseController.getCourseEnrollments);
router.get('/:id/analytics', param('id').isUUID().withMessage('Invalid course ID'), courseController.getCourseAnalytics);

router.post('/', createCourseValidation, courseController.createCourse);
router.post('/bulk', bulkCreateValidation, courseController.bulkCreateCourses);
router.post('/import-csv', courseController.importCoursesFromCSV);
router.post('/:id/enroll', 
  param('id').isUUID().withMessage('Invalid course ID'),
  enrollmentValidation,
  courseController.enrollUsers
);
router.post('/:id/unenroll', 
  param('id').isUUID().withMessage('Invalid course ID'),
  enrollmentValidation,
  courseController.unenrollUsers
);

router.put('/:id', 
  param('id').isUUID().withMessage('Invalid course ID'),
  updateCourseValidation,
  courseController.updateCourse
);

router.patch('/:id/activate', 
  param('id').isUUID().withMessage('Invalid course ID'),
  courseController.activateCourse
);

router.patch('/:id/deactivate', 
  param('id').isUUID().withMessage('Invalid course ID'),
  courseController.deactivateCourse
);

router.delete('/:id', 
  param('id').isUUID().withMessage('Invalid course ID'),
  courseController.deleteCourse
);

// Course structure management
router.post('/:id/move', 
  param('id').isUUID().withMessage('Invalid course ID'),
  body('newParentId').optional().isUUID().withMessage('Invalid new parent ID'),
  body('position').optional().isInt({ min: 0 }).withMessage('Position must be a non-negative integer'),
  courseController.moveCourse
);

router.post('/:id/duplicate', 
  param('id').isUUID().withMessage('Invalid course ID'),
  courseController.duplicateCourse
);

module.exports = router;