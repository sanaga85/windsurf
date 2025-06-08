const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');

// Validation rules
const loginValidation = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const resetPasswordValidation = [
  body('phone').isMobilePhone().withMessage('Valid phone number is required')
];

const verifyOtpValidation = [
  body('phone').isMobilePhone().withMessage('Valid phone number is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
];

// Public routes
router.post('/login', loginValidation, authController.login);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);
router.post('/verify-otp', verifyOtpValidation, authController.verifyOtp);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.post('/logout', authMiddleware, authController.logout);
router.post('/change-password', authMiddleware, changePasswordValidation, authController.changePassword);
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;