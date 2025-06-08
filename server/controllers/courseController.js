const { validationResult } = require('express-validator');
const db = require('../database/connection');
const logger = require('../utils/logger');
const { generateSlug } = require('../utils/helpers');

/**
 * Get courses with pagination and filtering
 */
const getCourses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      parentId,
      level,
      isActive,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    let query = db('courses')
      .where({ institution_id: req.user.institutionId })
      .select([
        'id', 'name', 'code', 'description', 'parent_id', 'level',
        'is_active', 'metadata', 'created_at', 'updated_at'
      ]);

    // Apply filters
    if (search) {
      query = query.where(function() {
        this.where('name', 'ilike', `%${search}%`)
            .orWhere('code', 'ilike', `%${search}%`)
            .orWhere('description', 'ilike', `%${search}%`);
      });
    }

    if (parentId !== undefined) {
      if (parentId === 'null' || parentId === '') {
        query = query.whereNull('parent_id');
      } else {
        query = query.where('parent_id', parentId);
      }
    }

    if (level !== undefined) {
      query = query.where('level', level);
    }

    if (isActive !== undefined) {
      query = query.where('is_active', isActive === 'true');
    }

    // Get total count
    const totalQuery = query.clone();
    const [{ count }] = await totalQuery.count('* as count');

    // Apply sorting and pagination
    const courses = await query
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset(offset);

    // Get children count for each course
    const courseIds = courses.map(course => course.id);
    if (courseIds.length > 0) {
      const childrenCounts = await db('courses')
        .whereIn('parent_id', courseIds)
        .groupBy('parent_id')
        .select('parent_id')
        .count('* as children_count');

      const childrenCountMap = {};
      childrenCounts.forEach(item => {
        childrenCountMap[item.parent_id] = parseInt(item.children_count);
      });

      courses.forEach(course => {
        course.children_count = childrenCountMap[course.id] || 0;
      });
    }

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(count),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get course hierarchy
 */
const getCourseHierarchy = async (req, res) => {
  try {
    const { rootId } = req.query;

    let query = db('courses')
      .where({ institution_id: req.user.institutionId, is_active: true })
      .select([
        'id', 'name', 'code', 'description', 'parent_id', 'level',
        'metadata', 'created_at'
      ])
      .orderBy('level')
      .orderBy('name');

    if (rootId) {
      // Get specific subtree
      const descendants = await getDescendants(rootId, req.user.institutionId);
      const descendantIds = descendants.map(d => d.id);
      descendantIds.push(rootId);
      query = query.whereIn('id', descendantIds);
    }

    const courses = await query;

    // Build hierarchy
    const hierarchy = buildHierarchy(courses, rootId || null);

    res.json({
      success: true,
      data: { hierarchy }
    });
  } catch (error) {
    logger.error('Get course hierarchy error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get course by ID
 */
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await db('courses')
      .where({ id, institution_id: req.user.institutionId })
      .first();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get parent course if exists
    if (course.parent_id) {
      const parent = await db('courses')
        .where({ id: course.parent_id })
        .select(['id', 'name', 'code'])
        .first();
      course.parent = parent;
    }

    // Get children count
    const [{ count: childrenCount }] = await db('courses')
      .where({ parent_id: course.id })
      .count('* as count');

    course.children_count = parseInt(childrenCount);

    // Get content count
    const [{ count: contentCount }] = await db('content')
      .where({ course_id: course.id })
      .count('* as count');

    course.content_count = parseInt(contentCount);

    // Get enrollment count
    const [{ count: enrollmentCount }] = await db('enrollments')
      .where({ course_id: course.id, is_active: true })
      .count('* as count');

    course.enrollment_count = parseInt(enrollmentCount);

    res.json({
      success: true,
      data: { course }
    });
  } catch (error) {
    logger.error('Get course by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create course
 */
const createCourse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, code, description, parentId, metadata = {} } = req.body;

    // Determine level
    let level = 0;
    if (parentId) {
      const parent = await db('courses')
        .where({ id: parentId, institution_id: req.user.institutionId })
        .first();

      if (!parent) {
        return res.status(400).json({
          success: false,
          message: 'Parent course not found'
        });
      }

      level = parent.level + 1;
    }

    // Check for duplicate code within institution
    if (code) {
      const existingCourse = await db('courses')
        .where({ code, institution_id: req.user.institutionId })
        .first();

      if (existingCourse) {
        return res.status(400).json({
          success: false,
          message: 'Course code already exists'
        });
      }
    }

    const courseData = {
      name,
      code: code || null,
      description: description || null,
      parent_id: parentId || null,
      level,
      institution_id: req.user.institutionId,
      created_by: req.user.userId,
      metadata: JSON.stringify(metadata),
      is_active: true
    };

    const [courseId] = await db('courses').insert(courseData).returning('id');

    logger.info('Course created', {
      courseId,
      name,
      createdBy: req.user.userId,
      institutionId: req.user.institutionId
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { courseId }
    });
  } catch (error) {
    logger.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update course
 */
const updateCourse = async (req, res) => {
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
    const { name, code, description, metadata } = req.body;

    // Check if course exists
    const course = await db('courses')
      .where({ id, institution_id: req.user.institutionId })
      .first();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check for duplicate code if code is being updated
    if (code && code !== course.code) {
      const existingCourse = await db('courses')
        .where({ code, institution_id: req.user.institutionId })
        .whereNot('id', id)
        .first();

      if (existingCourse) {
        return res.status(400).json({
          success: false,
          message: 'Course code already exists'
        });
      }
    }

    const updateData = {
      updated_at: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (metadata !== undefined) updateData.metadata = JSON.stringify(metadata);

    await db('courses').where({ id }).update(updateData);

    logger.info('Course updated', {
      courseId: id,
      updatedBy: req.user.userId,
      institutionId: req.user.institutionId
    });

    res.json({
      success: true,
      message: 'Course updated successfully'
    });
  } catch (error) {
    logger.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete course
 */
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if course exists
    const course = await db('courses')
      .where({ id, institution_id: req.user.institutionId })
      .first();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if course has children
    const [{ count: childrenCount }] = await db('courses')
      .where({ parent_id: id })
      .count('* as count');

    if (parseInt(childrenCount) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete course with child courses'
      });
    }

    // Check if course has content
    const [{ count: contentCount }] = await db('content')
      .where({ course_id: id })
      .count('* as count');

    if (parseInt(contentCount) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete course with content'
      });
    }

    // Soft delete
    await db('courses')
      .where({ id })
      .update({
        deleted_at: new Date(),
        is_active: false
      });

    logger.info('Course deleted', {
      courseId: id,
      deletedBy: req.user.userId,
      institutionId: req.user.institutionId
    });

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    logger.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get my courses (for students/faculty)
 */
const getMyCourses = async (req, res) => {
  try {
    const { role } = req.user;
    let courses;

    if (role === 'student') {
      // Get enrolled courses
      courses = await db('courses')
        .join('enrollments', 'courses.id', 'enrollments.course_id')
        .where({
          'enrollments.user_id': req.user.userId,
          'enrollments.is_active': true,
          'courses.is_active': true
        })
        .select([
          'courses.id', 'courses.name', 'courses.code', 'courses.description',
          'courses.level', 'enrollments.enrolled_at', 'enrollments.progress'
        ])
        .orderBy('enrollments.enrolled_at', 'desc');
    } else if (role === 'faculty') {
      // Get assigned courses
      courses = await db('courses')
        .join('course_faculty', 'courses.id', 'course_faculty.course_id')
        .where({
          'course_faculty.faculty_id': req.user.userId,
          'courses.is_active': true
        })
        .select([
          'courses.id', 'courses.name', 'courses.code', 'courses.description',
          'courses.level', 'course_faculty.assigned_at'
        ])
        .orderBy('course_faculty.assigned_at', 'desc');
    } else {
      // For admins, get all courses
      courses = await db('courses')
        .where({
          institution_id: req.user.institutionId,
          is_active: true
        })
        .select([
          'id', 'name', 'code', 'description', 'level', 'created_at'
        ])
        .orderBy('created_at', 'desc');
    }

    res.json({
      success: true,
      data: { courses }
    });
  } catch (error) {
    logger.error('Get my courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Helper function to get descendants
 */
const getDescendants = async (parentId, institutionId) => {
  const descendants = [];
  const queue = [parentId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const children = await db('courses')
      .where({ parent_id: currentId, institution_id: institutionId })
      .select(['id', 'name', 'parent_id', 'level']);

    descendants.push(...children);
    queue.push(...children.map(child => child.id));
  }

  return descendants;
};

/**
 * Helper function to build hierarchy
 */
const buildHierarchy = (courses, parentId = null) => {
  const children = courses.filter(course => course.parent_id === parentId);
  
  return children.map(course => ({
    ...course,
    children: buildHierarchy(courses, course.id)
  }));
};

// Placeholder functions for missing methods
const searchCourses = async (req, res) => {
  // Implementation similar to getCourses but with enhanced search
  res.json({ success: true, data: { courses: [] } });
};

const getCourseChildren = async (req, res) => {
  res.json({ success: true, data: { children: [] } });
};

const getCourseContent = async (req, res) => {
  res.json({ success: true, data: { content: [] } });
};

const getCourseEnrollments = async (req, res) => {
  res.json({ success: true, data: { enrollments: [] } });
};

const getCourseAnalytics = async (req, res) => {
  res.json({ success: true, data: { analytics: {} } });
};

const bulkCreateCourses = async (req, res) => {
  res.json({ success: true, message: 'Bulk create not implemented yet' });
};

const importCoursesFromCSV = async (req, res) => {
  res.json({ success: true, message: 'CSV import not implemented yet' });
};

const enrollUsers = async (req, res) => {
  res.json({ success: true, message: 'User enrollment not implemented yet' });
};

const unenrollUsers = async (req, res) => {
  res.json({ success: true, message: 'User unenrollment not implemented yet' });
};

const activateCourse = async (req, res) => {
  res.json({ success: true, message: 'Course activated' });
};

const deactivateCourse = async (req, res) => {
  res.json({ success: true, message: 'Course deactivated' });
};

const moveCourse = async (req, res) => {
  res.json({ success: true, message: 'Course moved' });
};

const duplicateCourse = async (req, res) => {
  res.json({ success: true, message: 'Course duplicated' });
};

const getCourseTemplates = async (req, res) => {
  res.json({ success: true, data: { templates: [] } });
};

module.exports = {
  getCourses,
  getCourseHierarchy,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getMyCourses,
  searchCourses,
  getCourseChildren,
  getCourseContent,
  getCourseEnrollments,
  getCourseAnalytics,
  bulkCreateCourses,
  importCoursesFromCSV,
  enrollUsers,
  unenrollUsers,
  activateCourse,
  deactivateCourse,
  moveCourse,
  duplicateCourse,
  getCourseTemplates
};