const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Validation rules
const loginValidation = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

const completeProfileValidation = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('phone')
    .isMobilePhone()
    .withMessage('Valid phone number is required')
];

const forgotPasswordValidation = [
  body('identifier').notEmpty().withMessage('Username, email, or phone is required')
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid OTP is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

const refreshTokenValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
];

// Public routes
router.post('/login', loginValidation, asyncHandler(authController.login));
router.post('/forgot-password', forgotPasswordValidation, asyncHandler(authController.forgotPassword));
router.post('/reset-password', resetPasswordValidation, asyncHandler(authController.resetPassword));
router.post('/refresh-token', refreshTokenValidation, asyncHandler(authController.refreshToken));

// Protected routes
router.use(authMiddleware);

router.post('/logout', asyncHandler(authController.logout));
router.post('/logout-all', asyncHandler(authController.logoutAll));
router.post('/change-password', changePasswordValidation, asyncHandler(authController.changePassword));
router.post('/complete-profile', completeProfileValidation, asyncHandler(authController.completeProfile));
router.get('/me', asyncHandler(authController.getProfile));
router.put('/me', asyncHandler(authController.updateProfile));
router.post('/enable-2fa', asyncHandler(authController.enableTwoFactor));
router.post('/disable-2fa', asyncHandler(authController.disableTwoFactor));
router.post('/verify-2fa', asyncHandler(authController.verifyTwoFactor));

module.exports = router;