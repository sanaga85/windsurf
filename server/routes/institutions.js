const express = require('express');
const router = express.Router();
const institutionController = require('../controllers/institutionController');
const { body, param } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Configure multer for logo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/logos/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|svg|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'image/svg+xml';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, SVG, GIF) are allowed'));
    }
  }
});

// Validation rules
const createInstitutionValidation = [
  body('name').notEmpty().withMessage('Institution name is required'),
  body('slug').notEmpty().withMessage('Institution slug is required'),
  body('subdomain').notEmpty().withMessage('Subdomain is required'),
  body('type').isIn(['school', 'university', 'corporate', 'coaching']).withMessage('Invalid institution type'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required')
];

const updateInstitutionValidation = [
  body('name').optional().notEmpty().withMessage('Institution name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required')
];

const brandingValidation = [
  body('primaryColor').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid primary color format'),
  body('secondaryColor').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid secondary color format')
];

// Routes for SuperAdmin only
router.get('/', institutionController.getAllInstitutions);
router.post('/', createInstitutionValidation, institutionController.createInstitution);

// Routes for Institution Admin and SuperAdmin
router.get('/current', institutionController.getCurrentInstitution);
router.put('/current', updateInstitutionValidation, institutionController.updateCurrentInstitution);

// Branding routes
router.get('/current/branding', institutionController.getBranding);
router.put('/current/branding', brandingValidation, institutionController.updateBranding);
router.post('/current/logo', upload.single('logo'), institutionController.uploadLogo);
router.post('/current/favicon', upload.single('favicon'), institutionController.uploadFavicon);

// Settings routes
router.get('/current/settings', institutionController.getSettings);
router.put('/current/settings', institutionController.updateSettings);

// Features routes
router.get('/current/features', institutionController.getFeatures);
router.put('/current/features', institutionController.updateFeatures);

// SuperAdmin specific routes
router.get('/:id', param('id').isUUID().withMessage('Invalid institution ID'), institutionController.getInstitutionById);
router.put('/:id', 
  param('id').isUUID().withMessage('Invalid institution ID'),
  updateInstitutionValidation, 
  institutionController.updateInstitution
);
router.patch('/:id/activate', 
  param('id').isUUID().withMessage('Invalid institution ID'),
  institutionController.activateInstitution
);
router.patch('/:id/suspend', 
  param('id').isUUID().withMessage('Invalid institution ID'),
  institutionController.suspendInstitution
);
router.delete('/:id', 
  param('id').isUUID().withMessage('Invalid institution ID'),
  institutionController.deleteInstitution
);

// Analytics routes
router.get('/current/analytics', institutionController.getInstitutionAnalytics);
router.get('/:id/analytics', 
  param('id').isUUID().withMessage('Invalid institution ID'),
  institutionController.getInstitutionAnalytics
);

module.exports = router;