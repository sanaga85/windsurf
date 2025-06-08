const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs').promises;
const db = require('../database/connection');
const logger = require('../utils/logger');

/**
 * Get content with pagination and filtering
 */
const getContent = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      courseId,
      type,
      isPublished,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    let query = db('content')
      .where({ institution_id: req.user.institutionId })
      .select([
        'id', 'title', 'description', 'type', 'file_url', 'file_size',
        'duration', 'course_id', 'is_published', 'metadata',
        'created_at', 'updated_at'
      ]);

    // Apply filters
    if (search) {
      query = query.where(function() {
        this.where('title', 'ilike', `%${search}%`)
            .orWhere('description', 'ilike', `%${search}%`);
      });
    }

    if (courseId) {
      query = query.where('course_id', courseId);
    }

    if (type) {
      query = query.where('type', type);
    }

    if (isPublished !== undefined) {
      query = query.where('is_published', isPublished === 'true');
    }

    // Get total count
    const totalQuery = query.clone();
    const [{ count }] = await totalQuery.count('* as count');

    // Apply sorting and pagination
    const content = await query
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset(offset);

    // Get course names
    const courseIds = [...new Set(content.map(c => c.course_id).filter(Boolean))];
    let courses = {};
    if (courseIds.length > 0) {
      const courseData = await db('courses')
        .whereIn('id', courseIds)
        .select(['id', 'name', 'code']);
      courses = courseData.reduce((acc, course) => {
        acc[course.id] = course;
        return acc;
      }, {});
    }

    // Add course info to content
    content.forEach(item => {
      if (item.course_id && courses[item.course_id]) {
        item.course = courses[item.course_id];
      }
    });

    res.json({
      success: true,
      data: {
        content,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(count),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get content by ID
 */
const getContentById = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await db('content')
      .where({ id, institution_id: req.user.institutionId })
      .first();

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Get course info
    if (content.course_id) {
      const course = await db('courses')
        .where({ id: content.course_id })
        .select(['id', 'name', 'code'])
        .first();
      content.course = course;
    }

    // Get user progress if student
    if (req.user.role === 'student') {
      const progress = await db('content_progress')
        .where({
          content_id: id,
          user_id: req.user.userId
        })
        .first();
      content.progress = progress;
    }

    // Get view count
    const [{ count: viewCount }] = await db('content_views')
      .where({ content_id: id })
      .count('* as count');
    content.view_count = parseInt(viewCount);

    res.json({
      success: true,
      data: { content }
    });
  } catch (error) {
    logger.error('Get content by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Upload content
 */
const uploadContent = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { title, description, courseId } = req.body;
    const file = req.file;

    // Determine content type based on file extension
    const ext = path.extname(file.originalname).toLowerCase();
    let type;
    let duration = null;

    switch (ext) {
      case '.pdf':
        type = 'pdf';
        break;
      case '.mp4':
      case '.avi':
      case '.mov':
      case '.wmv':
        type = 'video';
        // TODO: Extract video duration
        break;
      case '.mp3':
      case '.wav':
      case '.aac':
        type = 'audio';
        // TODO: Extract audio duration
        break;
      case '.epub':
        type = 'epub';
        break;
      case '.docx':
      case '.doc':
        type = 'document';
        break;
      default:
        type = 'document';
    }

    const contentData = {
      title: title || file.originalname,
      description: description || null,
      type,
      file_url: file.path,
      file_name: file.originalname,
      file_size: file.size,
      duration,
      course_id: courseId || null,
      institution_id: req.user.institutionId,
      uploaded_by: req.user.userId,
      is_published: false,
      metadata: JSON.stringify({
        originalName: file.originalname,
        mimeType: file.mimetype,
        uploadedAt: new Date()
      })
    };

    const [contentId] = await db('content').insert(contentData).returning('id');

    logger.info('Content uploaded', {
      contentId,
      title: contentData.title,
      type,
      fileSize: file.size,
      uploadedBy: req.user.userId,
      institutionId: req.user.institutionId
    });

    res.status(201).json({
      success: true,
      message: 'Content uploaded successfully',
      data: { contentId }
    });
  } catch (error) {
    logger.error('Upload content error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create URL content
 */
const createUrlContent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, url, courseId } = req.body;

    const contentData = {
      title,
      description: description || null,
      type: 'url',
      file_url: url,
      course_id: courseId,
      institution_id: req.user.institutionId,
      uploaded_by: req.user.userId,
      is_published: false,
      metadata: JSON.stringify({
        url,
        createdAt: new Date()
      })
    };

    const [contentId] = await db('content').insert(contentData).returning('id');

    logger.info('URL content created', {
      contentId,
      title,
      url,
      createdBy: req.user.userId,
      institutionId: req.user.institutionId
    });

    res.status(201).json({
      success: true,
      message: 'URL content created successfully',
      data: { contentId }
    });
  } catch (error) {
    logger.error('Create URL content error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update content
 */
const updateContent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { title, description } = req.body;

    // Check if content exists
    const content = await db('content')
      .where({ id, institution_id: req.user.institutionId })
      .first();

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    const updateData = {
      updated_at: new Date()
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    await db('content').where({ id }).update(updateData);

    logger.info('Content updated', {
      contentId: id,
      updatedBy: req.user.userId,
      institutionId: req.user.institutionId
    });

    res.json({
      success: true,
      message: 'Content updated successfully'
    });
  } catch (error) {
    logger.error('Update content error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete content
 */
const deleteContent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if content exists
    const content = await db('content')
      .where({ id, institution_id: req.user.institutionId })
      .first();

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Delete file if it exists
    if (content.file_url && content.type !== 'url') {
      try {
        await fs.unlink(content.file_url);
      } catch (error) {
        logger.warn('Failed to delete file:', error);
      }
    }

    // Soft delete
    await db('content')
      .where({ id })
      .update({
        deleted_at: new Date(),
        is_published: false
      });

    logger.info('Content deleted', {
      contentId: id,
      deletedBy: req.user.userId,
      institutionId: req.user.institutionId
    });

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    logger.error('Delete content error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Publish content
 */
const publishContent = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await db('content')
      .where({ id, institution_id: req.user.institutionId })
      .first();

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    await db('content')
      .where({ id })
      .update({ is_published: true, published_at: new Date() });

    logger.info('Content published', {
      contentId: id,
      publishedBy: req.user.userId,
      institutionId: req.user.institutionId
    });

    res.json({
      success: true,
      message: 'Content published successfully'
    });
  } catch (error) {
    logger.error('Publish content error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Unpublish content
 */
const unpublishContent = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await db('content')
      .where({ id, institution_id: req.user.institutionId })
      .first();

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    await db('content')
      .where({ id })
      .update({ is_published: false, published_at: null });

    logger.info('Content unpublished', {
      contentId: id,
      unpublishedBy: req.user.userId,
      institutionId: req.user.institutionId
    });

    res.json({
      success: true,
      message: 'Content unpublished successfully'
    });
  } catch (error) {
    logger.error('Unpublish content error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Record content view
 */
const recordView = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if content exists and is published
    const content = await db('content')
      .where({ id, institution_id: req.user.institutionId, is_published: true })
      .first();

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Record view
    await db('content_views').insert({
      content_id: id,
      user_id: req.user.userId,
      viewed_at: new Date(),
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'View recorded'
    });
  } catch (error) {
    logger.error('Record view error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update content progress
 */
const updateProgress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { position, percentage } = req.body;

    // Check if content exists
    const content = await db('content')
      .where({ id, institution_id: req.user.institutionId })
      .first();

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Upsert progress
    const existingProgress = await db('content_progress')
      .where({ content_id: id, user_id: req.user.userId })
      .first();

    const progressData = {
      content_id: id,
      user_id: req.user.userId,
      position: JSON.stringify(position),
      percentage,
      last_accessed_at: new Date()
    };

    if (existingProgress) {
      await db('content_progress')
        .where({ content_id: id, user_id: req.user.userId })
        .update(progressData);
    } else {
      await db('content_progress').insert(progressData);
    }

    res.json({
      success: true,
      message: 'Progress updated'
    });
  } catch (error) {
    logger.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Placeholder implementations for missing methods
const createContent = async (req, res) => {
  res.json({ success: true, message: 'Create content not implemented yet' });
};

const searchContent = async (req, res) => {
  res.json({ success: true, data: { content: [] } });
};

const getRecentContent = async (req, res) => {
  res.json({ success: true, data: { content: [] } });
};

const getMyContent = async (req, res) => {
  res.json({ success: true, data: { content: [] } });
};

const getContentAnnotations = async (req, res) => {
  res.json({ success: true, data: { annotations: [] } });
};

const getContentProgress = async (req, res) => {
  res.json({ success: true, data: { progress: {} } });
};

const getContentAnalytics = async (req, res) => {
  res.json({ success: true, data: { analytics: {} } });
};

const uploadMultipleContent = async (req, res) => {
  res.json({ success: true, message: 'Multiple upload not implemented yet' });
};

const createAnnotation = async (req, res) => {
  res.json({ success: true, message: 'Annotation created' });
};

const updateAnnotation = async (req, res) => {
  res.json({ success: true, message: 'Annotation updated' });
};

const deleteAnnotation = async (req, res) => {
  res.json({ success: true, message: 'Annotation deleted' });
};

const markAsComplete = async (req, res) => {
  res.json({ success: true, message: 'Content marked as complete' });
};

const recordDownload = async (req, res) => {
  res.json({ success: true, message: 'Download recorded' });
};

const bulkUploadContent = async (req, res) => {
  res.json({ success: true, message: 'Bulk upload not implemented yet' });
};

const bulkAssignContent = async (req, res) => {
  res.json({ success: true, message: 'Bulk assign not implemented yet' });
};

const bulkDeleteContent = async (req, res) => {
  res.json({ success: true, message: 'Bulk delete not implemented yet' });
};

module.exports = {
  getContent,
  getContentById,
  uploadContent,
  createUrlContent,
  updateContent,
  deleteContent,
  publishContent,
  unpublishContent,
  recordView,
  updateProgress,
  createContent,
  searchContent,
  getRecentContent,
  getMyContent,
  getContentAnnotations,
  getContentProgress,
  getContentAnalytics,
  uploadMultipleContent,
  createAnnotation,
  updateAnnotation,
  deleteAnnotation,
  markAsComplete,
  recordDownload,
  bulkUploadContent,
  bulkAssignContent,
  bulkDeleteContent
};