const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { body, param, query } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profiles/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Validation rules
const createUserValidation = [
  body('username').notEmpty().withMessage('Username is required'),
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
  body('users.*.username').notEmpty().withMessage('Username is required for all users'),
  body('users.*.firstName').notEmpty().withMessage('First name is required for all users'),
  body('users.*.lastName').notEmpty().withMessage('Last name is required for all users'),
  body('users.*.phone').isMobilePhone().withMessage('Valid phone number is required for all users'),
  body('users.*.role').isIn(['faculty', 'student', 'librarian', 'parent']).withMessage('Invalid role for user')
];

// Routes
router.get('/', userController.getUsers);
router.get('/search', userController.searchUsers);
router.get('/roles', userController.getRoles);
router.get('/export', userController.exportUsers);
router.get('/:id', param('id').isUUID().withMessage('Invalid user ID'), userController.getUserById);

router.post('/', createUserValidation, userController.createUser);
router.post('/bulk', bulkCreateValidation, userController.bulkCreateUsers);
router.post('/import-csv', upload.single('csvFile'), userController.importUsersFromCSV);
router.post('/:id/upload-profile-picture', 
  param('id').isUUID().withMessage('Invalid user ID'),
  upload.single('profilePicture'), 
  userController.uploadProfilePicture
);

router.put('/:id', 
  param('id').isUUID().withMessage('Invalid user ID'),
  updateUserValidation, 
  userController.updateUser
);

router.patch('/:id/activate', 
  param('id').isUUID().withMessage('Invalid user ID'),
  userController.activateUser
);

router.patch('/:id/deactivate', 
  param('id').isUUID().withMessage('Invalid user ID'),
  userController.deactivateUser
);

router.patch('/:id/reset-password', 
  param('id').isUUID().withMessage('Invalid user ID'),
  userController.resetUserPassword
);

router.delete('/:id', 
  param('id').isUUID().withMessage('Invalid user ID'),
  userController.deleteUser
);

module.exports = router;