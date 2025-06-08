const { validationResult } = require('express-validator');
const slugify = require('slugify');

const db = require('../database/connection');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Generate unique slug for institution
 */
const generateSlug = async (name) => {
  let baseSlug = slugify(name, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db('institutions').where({ slug }).first();
    if (!existing) break;
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

/**
 * Generate unique subdomain for institution
 */
const generateSubdomain = async (name) => {
  let baseSubdomain = slugify(name, { lower: true, strict: true });
  let subdomain = baseSubdomain;
  let counter = 1;

  while (true) {
    const existing = await db('institutions').where({ subdomain }).first();
    if (!existing) break;
    
    subdomain = `${baseSubdomain}${counter}`;
    counter++;
  }

  return subdomain;
};

/**
 * Get institutions (Super Admin only)
 */
const getInstitutions = async (req, res) => {
  try {
    // Only super admin can view all institutions
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const {
      page = 1,
      limit = 20,
      type,
      isActive,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;

    let query = db('institutions').whereNull('deleted_at');

    // Apply filters
    if (type) {
      query = query.where({ type });
    }

    if (isActive !== undefined) {
      query = query.where({ is_active: isActive === 'true' });
    }

    if (search) {
      query = query.where(function() {
        this.where('name', 'ilike', `%${search}%`)
          .orWhere('slug', 'ilike', `%${search}%`)
          .orWhere('subdomain', 'ilike', `%${search}%`)
          .orWhere('email', 'ilike', `%${search}%`);
      });
    }

    // Get total count
    const totalQuery = query.clone();
    const [{ count }] = await totalQuery.count('* as count');
    const total = parseInt(count);

    // Get institutions
    const institutions = await query
      .select([
        'id', 'name', 'slug', 'subdomain', 'type', 'email', 'phone',
        'is_active', 'is_trial', 'trial_ends_at', 'subscription_ends_at',
        'created_at', 'updated_at'
      ])
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      data: {
        institutions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get institutions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get current institution
 */
const getCurrentInstitution = async (req, res) => {
  try {
    const institution = await db('institutions')
      .where({ id: req.user.institutionId })
      .whereNull('deleted_at')
      .first();

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    res.json({
      success: true,
      data: { institution }
    });
  } catch (error) {
    logger.error('Get current institution error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get institution by ID
 */
const getInstitutionById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check permissions
    if (req.user.role !== 'super_admin' && req.user.institutionId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const institution = await db('institutions')
      .where({ id })
      .whereNull('deleted_at')
      .first();

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    res.json({
      success: true,
      data: { institution }
    });
  } catch (error) {
    logger.error('Get institution by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create institution (Super Admin only)
 */
const createInstitution = async (req, res) => {
  try {
    // Only super admin can create institutions
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, type, email, phone, address, website } = req.body;

    // Generate slug and subdomain
    const slug = await generateSlug(name);
    const subdomain = await generateSubdomain(name);

    // Create institution
    const [institutionId] = await db('institutions').insert({
      name,
      slug,
      subdomain,
      type,
      email,
      phone,
      address,
      website,
      is_active: true,
      is_trial: true,
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      branding: JSON.stringify({
        primaryColor: '#1976d2',
        secondaryColor: '#dc004e'
      }),
      settings: JSON.stringify({
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        lockoutTime: 15
      }),
      features: JSON.stringify({
        library: true,
        analytics: true,
        webinars: false,
        blogs: false
      })
    }).returning('id');

    logger.info('Institution created', {
      institutionId: institutionId.id,
      name,
      slug,
      subdomain,
      createdBy: req.user.userId
    });

    res.status(201).json({
      success: true,
      message: 'Institution created successfully',
      data: {
        institution: {
          id: institutionId.id,
          name,
          slug,
          subdomain,
          type
        }
      }
    });
  } catch (error) {
    logger.error('Create institution error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update institution
 */
const updateInstitution = async (req, res) => {
  try {
    const { id } = req.params;

    // Check permissions
    if (req.user.role !== 'super_admin' && req.user.institutionId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, type, email, phone, address, website } = req.body;

    // Check if institution exists
    const institution = await db('institutions')
      .where({ id })
      .whereNull('deleted_at')
      .first();

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    // Update institution
    const updateData = {};
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (website) updateData.website = website;

    // Generate new slug if name changed
    if (name && name !== institution.name) {
      updateData.slug = await generateSlug(name);
    }

    await db('institutions')
      .where({ id })
      .update(updateData);

    logger.info('Institution updated', {
      institutionId: id,
      updatedBy: req.user.userId,
      changes: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Institution updated successfully'
    });
  } catch (error) {
    logger.error('Update institution error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update institution branding
 */
const updateBranding = async (req, res) => {
  try {
    const { id } = req.params;

    // Check permissions
    if (req.user.role !== 'super_admin' && req.user.institutionId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { primaryColor, secondaryColor, heroText, footerText } = req.body;

    // Check if institution exists
    const institution = await db('institutions')
      .where({ id })
      .whereNull('deleted_at')
      .first();

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    // Update branding
    const currentBranding = institution.branding || {};
    const newBranding = {
      ...currentBranding,
      ...(primaryColor && { primaryColor }),
      ...(secondaryColor && { secondaryColor }),
      ...(heroText && { heroText }),
      ...(footerText && { footerText })
    };

    await db('institutions')
      .where({ id })
      .update({ branding: JSON.stringify(newBranding) });

    logger.info('Institution branding updated', {
      institutionId: id,
      updatedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'Branding updated successfully',
      data: { branding: newBranding }
    });
  } catch (error) {
    logger.error('Update branding error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update institution settings
 */
const updateSettings = async (req, res) => {
  try {
    const { id } = req.params;

    // Check permissions
    if (req.user.role !== 'super_admin' && req.user.institutionId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { sessionTimeout, maxLoginAttempts, lockoutTime, features } = req.body;

    // Check if institution exists
    const institution = await db('institutions')
      .where({ id })
      .whereNull('deleted_at')
      .first();

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    // Update settings
    const currentSettings = institution.settings || {};
    const newSettings = {
      ...currentSettings,
      ...(sessionTimeout && { sessionTimeout }),
      ...(maxLoginAttempts && { maxLoginAttempts }),
      ...(lockoutTime && { lockoutTime })
    };

    const updateData = { settings: JSON.stringify(newSettings) };

    if (features) {
      const currentFeatures = institution.features || {};
      const newFeatures = { ...currentFeatures, ...features };
      updateData.features = JSON.stringify(newFeatures);
    }

    await db('institutions')
      .where({ id })
      .update(updateData);

    logger.info('Institution settings updated', {
      institutionId: id,
      updatedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        settings: newSettings,
        ...(features && { features: { ...institution.features, ...features } })
      }
    });
  } catch (error) {
    logger.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Activate institution (Super Admin only)
 */
const activateInstitution = async (req, res) => {
  try {
    // Only super admin can activate institutions
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { id } = req.params;

    const result = await db('institutions')
      .where({ id })
      .whereNull('deleted_at')
      .update({ is_active: true });

    if (result === 0) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    logger.info('Institution activated', {
      institutionId: id,
      activatedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'Institution activated successfully'
    });
  } catch (error) {
    logger.error('Activate institution error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Suspend institution (Super Admin only)
 */
const suspendInstitution = async (req, res) => {
  try {
    // Only super admin can suspend institutions
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { id } = req.params;

    const result = await db('institutions')
      .where({ id })
      .whereNull('deleted_at')
      .update({ is_active: false });

    if (result === 0) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    logger.info('Institution suspended', {
      institutionId: id,
      suspendedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'Institution suspended successfully'
    });
  } catch (error) {
    logger.error('Suspend institution error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete institution (Super Admin only)
 */
const deleteInstitution = async (req, res) => {
  try {
    // Only super admin can delete institutions
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { id } = req.params;

    const result = await db('institutions')
      .where({ id })
      .whereNull('deleted_at')
      .update({ 
        deleted_at: new Date(),
        is_active: false
      });

    if (result === 0) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    logger.info('Institution deleted', {
      institutionId: id,
      deletedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'Institution deleted successfully'
    });
  } catch (error) {
    logger.error('Delete institution error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Upload institution logo
 */
const uploadLogo = async (req, res) => {
  try {
    const { id } = req.params;

    // Check permissions
    if (req.user.role !== 'super_admin' && req.user.institutionId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Logo file is required'
      });
    }

    // Check if institution exists
    const institution = await db('institutions')
      .where({ id })
      .whereNull('deleted_at')
      .first();

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    const logoUrl = `/uploads/logos/${req.file.filename}`;

    // Update institution logo
    await db('institutions')
      .where({ id })
      .update({ logo_url: logoUrl });

    logger.info('Institution logo uploaded', {
      institutionId: id,
      uploadedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      data: { logoUrl }
    });
  } catch (error) {
    logger.error('Upload logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Upload institution favicon
 */
const uploadFavicon = async (req, res) => {
  try {
    const { id } = req.params;

    // Check permissions
    if (req.user.role !== 'super_admin' && req.user.institutionId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Favicon file is required'
      });
    }

    // Check if institution exists
    const institution = await db('institutions')
      .where({ id })
      .whereNull('deleted_at')
      .first();

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    const faviconUrl = `/uploads/favicons/${req.file.filename}`;

    // Update institution favicon
    await db('institutions')
      .where({ id })
      .update({ favicon_url: faviconUrl });

    logger.info('Institution favicon uploaded', {
      institutionId: id,
      uploadedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'Favicon uploaded successfully',
      data: { faviconUrl }
    });
  } catch (error) {
    logger.error('Upload favicon error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get institution statistics
 */
const getInstitutionStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Check permissions
    if (req.user.role !== 'super_admin' && req.user.institutionId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get user counts by role
    const userStats = await db('users')
      .select('role')
      .count('* as count')
      .where({ institution_id: id, is_active: true })
      .whereNull('deleted_at')
      .groupBy('role');

    // Get content count
    const [{ count: contentCount }] = await db('content')
      .count('* as count')
      .where({ institution_id: id, is_active: true })
      .whereNull('deleted_at');

    // Get library items count
    const [{ count: libraryCount }] = await db('library_items')
      .count('* as count')
      .where({ institution_id: id, is_available: true })
      .whereNull('deleted_at');

    // Get active borrowings count
    const [{ count: activeBorrowings }] = await db('library_borrowings')
      .count('* as count')
      .where({ status: 'active' })
      .whereIn('library_item_id', function() {
        this.select('id').from('library_items').where({ institution_id: id });
      });

    const stats = {
      users: userStats.reduce((acc, stat) => {
        acc[stat.role] = parseInt(stat.count);
        return acc;
      }, {}),
      content: parseInt(contentCount),
      libraryItems: parseInt(libraryCount),
      activeBorrowings: parseInt(activeBorrowings)
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    logger.error('Get institution stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getInstitutions,
  getCurrentInstitution,
  getInstitutionById,
  createInstitution,
  updateInstitution,
  updateBranding,
  updateSettings,
  activateInstitution,
  suspendInstitution,
  deleteInstitution,
  uploadLogo,
  uploadFavicon,
  getInstitutionStats
};