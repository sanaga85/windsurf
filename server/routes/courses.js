const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { body, param, query } = require('express-validator');
const uploadMiddleware = require('../middleware/uploadMiddleware');

// Validation rules
const programValidation = [
  body('name').notEmpty().withMessage('Program name is required'),
  body('code').optional().notEmpty().withMessage('Program code cannot be empty')
];

const classValidation = [
  body('name').notEmpty().withMessage('Class name is required'),
  body('programId').optional().isUUID().withMessage('Invalid program ID')
];

const subjectValidation = [
  body('name').notEmpty().withMessage('Subject name is required'),
  body('classId').isUUID().withMessage('Valid class ID is required')
];

const chapterValidation = [
  body('name').notEmpty().withMessage('Chapter name is required'),
  body('subjectId').isUUID().withMessage('Valid subject ID is required')
];

const enrollmentValidation = [
  body('userId').isUUID().withMessage('Valid user ID is required'),
  body('programId').optional().isUUID().withMessage('Invalid program ID'),
  body('classId').optional().isUUID().withMessage('Invalid class ID'),
  body('subjectId').optional().isUUID().withMessage('Invalid subject ID')
];

// Program routes
router.get('/programs', courseController.getPrograms);
router.get('/programs/:id', param('id').isUUID(), courseController.getProgramById);
router.post('/programs', programValidation, courseController.createProgram);
router.put('/programs/:id', param('id').isUUID(), programValidation, courseController.updateProgram);
router.delete('/programs/:id', param('id').isUUID(), courseController.deleteProgram);

// Class routes
router.get('/classes', courseController.getClasses);
router.get('/classes/:id', param('id').isUUID(), courseController.getClassById);
router.post('/classes', classValidation, courseController.createClass);
router.put('/classes/:id', param('id').isUUID(), classValidation, courseController.updateClass);
router.delete('/classes/:id', param('id').isUUID(), courseController.deleteClass);

// Subject routes
router.get('/subjects', courseController.getSubjects);
router.get('/subjects/:id', param('id').isUUID(), courseController.getSubjectById);
router.post('/subjects', subjectValidation, courseController.createSubject);
router.put('/subjects/:id', param('id').isUUID(), subjectValidation, courseController.updateSubject);
router.delete('/subjects/:id', param('id').isUUID(), courseController.deleteSubject);

// Chapter routes
router.get('/chapters', courseController.getChapters);
router.get('/chapters/:id', param('id').isUUID(), courseController.getChapterById);
router.post('/chapters', chapterValidation, courseController.createChapter);
router.put('/chapters/:id', param('id').isUUID(), chapterValidation, courseController.updateChapter);
router.delete('/chapters/:id', param('id').isUUID(), courseController.deleteChapter);

// Enrollment routes
router.get('/enrollments', courseController.getEnrollments);
router.get('/enrollments/my', courseController.getMyEnrollments);
router.post('/enrollments', enrollmentValidation, courseController.createEnrollment);
router.post('/enrollments/bulk', courseController.bulkCreateEnrollments);
router.put('/enrollments/:id', param('id').isUUID(), courseController.updateEnrollment);
router.delete('/enrollments/:id', param('id').isUUID(), courseController.deleteEnrollment);

// Faculty assignment routes
router.get('/assignments', courseController.getFacultyAssignments);
router.get('/assignments/my', courseController.getMyAssignments);
router.post('/assignments', courseController.createFacultyAssignment);
router.put('/assignments/:id', param('id').isUUID(), courseController.updateFacultyAssignment);
router.delete('/assignments/:id', param('id').isUUID(), courseController.deleteFacultyAssignment);

// Bulk operations
router.post('/bulk-import', uploadMiddleware.single('file'), courseController.bulkImportCourses);
router.get('/hierarchy', courseController.getCourseHierarchy);
router.get('/structure/:type', courseController.getCourseStructureByType);

// Progress tracking
router.get('/progress/:userId', param('userId').isUUID(), courseController.getUserProgress);
router.put('/progress/:userId/:subjectId', courseController.updateUserProgress);

module.exports = router;