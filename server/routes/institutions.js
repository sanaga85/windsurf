const express = require('express');
const router = express.Router();
const institutionController = require('../controllers/institutionController');
const { body, param } = require('express-validator');
const uploadMiddleware = require('../middleware/uploadMiddleware');

// Validation rules
const createInstitutionValidation = [
  body('name').notEmpty().withMessage('Institution name is required'),
  body('type').isIn(['school', 'university', 'corporate', 'coaching']).withMessage('Invalid institution type'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required')
];

const updateInstitutionValidation = [
  body('name').optional().notEmpty().withMessage('Institution name cannot be empty'),
  body('type').optional().isIn(['school', 'university', 'corporate', 'coaching']).withMessage('Invalid institution type'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required')
];

const brandingValidation = [
  body('primaryColor').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid primary color format'),
  body('secondaryColor').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid secondary color format')
];

// Routes
router.get('/', institutionController.getInstitutions);
router.get('/current', institutionController.getCurrentInstitution);
router.get('/:id', param('id').isUUID().withMessage('Invalid institution ID'), institutionController.getInstitutionById);

router.post('/', createInstitutionValidation, institutionController.createInstitution);

router.put('/:id', 
  param('id').isUUID().withMessage('Invalid institution ID'),
  updateInstitutionValidation,
  institutionController.updateInstitution
);

router.put('/:id/branding',
  param('id').isUUID().withMessage('Invalid institution ID'),
  brandingValidation,
  institutionController.updateBranding
);

router.put('/:id/settings',
  param('id').isUUID().withMessage('Invalid institution ID'),
  institutionController.updateSettings
);

router.put('/:id/activate',
  param('id').isUUID().withMessage('Invalid institution ID'),
  institutionController.activateInstitution
);

router.put('/:id/suspend',
  param('id').isUUID().withMessage('Invalid institution ID'),
  institutionController.suspendInstitution
);

router.delete('/:id',
  param('id').isUUID().withMessage('Invalid institution ID'),
  institutionController.deleteInstitution
);

// File uploads
router.post('/:id/logo',
  param('id').isUUID().withMessage('Invalid institution ID'),
  uploadMiddleware.single('logo'),
  institutionController.uploadLogo
);

router.post('/:id/favicon',
  param('id').isUUID().withMessage('Invalid institution ID'),
  uploadMiddleware.single('favicon'),
  institutionController.uploadFavicon
);

// Analytics and stats
router.get('/:id/stats', 
  param('id').isUUID().withMessage('Invalid institution ID'),
  institutionController.getInstitutionStats
);

module.exports = router;