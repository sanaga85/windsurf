const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { body, param, query } = require('express-validator');
const uploadMiddleware = require('../middleware/uploadMiddleware');

// Validation rules
const createUserValidation = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('phone').isMobilePhone().withMessage('Valid phone number is required'),
  body('role').isIn(['institution_admin', 'faculty', 'student', 'librarian', 'parent']).withMessage('Invalid role'),
  body('email').optional().isEmail().withMessage('Valid email is required')
];

const updateUserValidation = [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('email').optional().isEmail().withMessage('Valid email is required')
];

const bulkCreateValidation = [
  body('users').isArray({ min: 1 }).withMessage('Users array is required'),
  body('users.*.firstName').notEmpty().withMessage('First name is required'),
  body('users.*.lastName').notEmpty().withMessage('Last name is required'),
  body('users.*.phone').isMobilePhone().withMessage('Valid phone number is required'),
  body('users.*.role').isIn(['institution_admin', 'faculty', 'student', 'librarian', 'parent']).withMessage('Invalid role')
];

// Routes
router.get('/', userController.getUsers);
router.get('/search', userController.searchUsers);
router.get('/export', userController.exportUsers);
router.get('/:id', param('id').isUUID().withMessage('Invalid user ID'), userController.getUserById);

router.post('/', createUserValidation, userController.createUser);
router.post('/bulk', bulkCreateValidation, userController.bulkCreateUsers);
router.post('/import-csv', uploadMiddleware.single('file'), userController.importUsersFromCSV);
router.post('/generate-credentials', userController.generateBulkCredentials);

router.put('/:id', param('id').isUUID().withMessage('Invalid user ID'), updateUserValidation, userController.updateUser);
router.put('/:id/activate', param('id').isUUID().withMessage('Invalid user ID'), userController.activateUser);
router.put('/:id/deactivate', param('id').isUUID().withMessage('Invalid user ID'), userController.deactivateUser);
router.put('/:id/reset-password', param('id').isUUID().withMessage('Invalid user ID'), userController.resetUserPassword);

router.delete('/:id', param('id').isUUID().withMessage('Invalid user ID'), userController.deleteUser);

// Profile picture upload
router.post('/:id/profile-picture', 
  param('id').isUUID().withMessage('Invalid user ID'),
  uploadMiddleware.single('profilePicture'),
  userController.uploadProfilePicture
);

module.exports = router;