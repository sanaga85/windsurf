const { validationResult } = require('express-validator');
const QRCode = require('qrcode');
const axios = require('axios');
const db = require('../database/connection');
const logger = require('../utils/logger');

/**
 * Get internal library items
 */
const getInternalLibrary = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      type,
      format,
      category,
      author,
      isAvailable,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    let query = db('library_items')
      .where({ institution_id: req.user.institutionId, deleted_at: null })
      .select([
        'id', 'title', 'author', 'publisher', 'isbn', 'type', 'format',
        'category', 'description', 'cover_image_url', 'total_copies',
        'available_copies', 'metadata', 'created_at'
      ]);

    // Apply filters
    if (search) {
      query = query.where(function() {
        this.where('title', 'ilike', `%${search}%`)
            .orWhere('author', 'ilike', `%${search}%`)
            .orWhere('publisher', 'ilike', `%${search}%`)
            .orWhere('isbn', 'ilike', `%${search}%`);
      });
    }

    if (type) {
      query = query.where('type', type);
    }

    if (format) {
      query = query.where('format', format);
    }

    if (category) {
      query = query.where('category', category);
    }

    if (author) {
      query = query.where('author', 'ilike', `%${author}%`);
    }

    if (isAvailable !== undefined) {
      if (isAvailable === 'true') {
        query = query.where('available_copies', '>', 0);
      } else {
        query = query.where('available_copies', '=', 0);
      }
    }

    // Get total count
    const totalQuery = query.clone();
    const [{ count }] = await totalQuery.count('* as count');

    // Apply sorting and pagination
    const items = await query
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(count),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get internal library error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get library item by ID
 */
const getInternalLibraryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await db('library_items')
      .where({ id, institution_id: req.user.institutionId, deleted_at: null })
      .first();

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Library item not found'
      });
    }

    // Get borrowing history for this item
    const borrowings = await db('library_borrowings')
      .join('users', 'library_borrowings.user_id', 'users.id')
      .where({ 'library_borrowings.item_id': id })
      .select([
        'library_borrowings.id', 'library_borrowings.borrowed_at',
        'library_borrowings.due_date', 'library_borrowings.returned_at',
        'library_borrowings.status', 'users.first_name', 'users.last_name',
        'users.username'
      ])
      .orderBy('library_borrowings.borrowed_at', 'desc')
      .limit(10);

    item.recent_borrowings = borrowings;

    // Check if current user has borrowed this item
    if (req.user.role === 'student' || req.user.role === 'faculty') {
      const currentBorrowing = await db('library_borrowings')
        .where({
          item_id: id,
          user_id: req.user.userId,
          status: 'borrowed'
        })
        .first();

      item.current_borrowing = currentBorrowing;
    }

    res.json({
      success: true,
      data: { item }
    });
  } catch (error) {
    logger.error('Get library item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create library item
 */
const createLibraryItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      title, author, publisher, isbn, type, format, category,
      description, totalCopies = 1, metadata = {}
    } = req.body;

    // Check for duplicate ISBN
    if (isbn) {
      const existingItem = await db('library_items')
        .where({ isbn, institution_id: req.user.institutionId, deleted_at: null })
        .first();

      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: 'Item with this ISBN already exists'
        });
      }
    }

    const itemData = {
      title,
      author: author || null,
      publisher: publisher || null,
      isbn: isbn || null,
      type,
      format,
      category: category || null,
      description: description || null,
      total_copies: totalCopies,
      available_copies: totalCopies,
      institution_id: req.user.institutionId,
      created_by: req.user.userId,
      metadata: JSON.stringify(metadata)
    };

    const [itemId] = await db('library_items').insert(itemData).returning('id');

    // Generate QR code for physical items
    if (format === 'physical') {
      const qrData = JSON.stringify({
        itemId,
        institutionId: req.user.institutionId,
        type: 'library_item'
      });

      const qrCodeUrl = await QRCode.toDataURL(qrData);
      
      await db('library_items')
        .where({ id: itemId })
        .update({ qr_code: qrCodeUrl });
    }

    logger.info('Library item created', {
      itemId,
      title,
      type,
      format,
      createdBy: req.user.userId,
      institutionId: req.user.institutionId
    });

    res.status(201).json({
      success: true,
      message: 'Library item created successfully',
      data: { itemId }
    });
  } catch (error) {
    logger.error('Create library item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update library item
 */
const updateLibraryItem = async (req, res) => {
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
    const {
      title, author, publisher, isbn, category, description,
      totalCopies, metadata
    } = req.body;

    // Check if item exists
    const item = await db('library_items')
      .where({ id, institution_id: req.user.institutionId, deleted_at: null })
      .first();

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Library item not found'
      });
    }

    // Check for duplicate ISBN if ISBN is being updated
    if (isbn && isbn !== item.isbn) {
      const existingItem = await db('library_items')
        .where({ isbn, institution_id: req.user.institutionId, deleted_at: null })
        .whereNot('id', id)
        .first();

      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: 'Item with this ISBN already exists'
        });
      }
    }

    const updateData = {
      updated_at: new Date()
    };

    if (title !== undefined) updateData.title = title;
    if (author !== undefined) updateData.author = author;
    if (publisher !== undefined) updateData.publisher = publisher;
    if (isbn !== undefined) updateData.isbn = isbn;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (metadata !== undefined) updateData.metadata = JSON.stringify(metadata);

    // Handle total copies update
    if (totalCopies !== undefined && totalCopies !== item.total_copies) {
      const difference = totalCopies - item.total_copies;
      updateData.total_copies = totalCopies;
      updateData.available_copies = Math.max(0, item.available_copies + difference);
    }

    await db('library_items').where({ id }).update(updateData);

    logger.info('Library item updated', {
      itemId: id,
      updatedBy: req.user.userId,
      institutionId: req.user.institutionId
    });

    res.json({
      success: true,
      message: 'Library item updated successfully'
    });
  } catch (error) {
    logger.error('Update library item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete library item
 */
const deleteLibraryItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if item exists
    const item = await db('library_items')
      .where({ id, institution_id: req.user.institutionId, deleted_at: null })
      .first();

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Library item not found'
      });
    }

    // Check if item is currently borrowed
    const [{ count: borrowedCount }] = await db('library_borrowings')
      .where({ item_id: id, status: 'borrowed' })
      .count('* as count');

    if (parseInt(borrowedCount) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete item that is currently borrowed'
      });
    }

    // Soft delete
    await db('library_items')
      .where({ id })
      .update({ deleted_at: new Date() });

    logger.info('Library item deleted', {
      itemId: id,
      deletedBy: req.user.userId,
      institutionId: req.user.institutionId
    });

    res.json({
      success: true,
      message: 'Library item deleted successfully'
    });
  } catch (error) {
    logger.error('Delete library item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Borrow item
 */
const borrowItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { itemId, userId, dueDate } = req.body;
    const borrowerId = userId || req.user.userId;

    // Check if item exists and is available
    const item = await db('library_items')
      .where({ id: itemId, institution_id: req.user.institutionId, deleted_at: null })
      .first();

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Library item not found'
      });
    }

    if (item.available_copies <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Item is not available for borrowing'
      });
    }

    // Check if user already has this item borrowed
    const existingBorrowing = await db('library_borrowings')
      .where({ item_id: itemId, user_id: borrowerId, status: 'borrowed' })
      .first();

    if (existingBorrowing) {
      return res.status(400).json({
        success: false,
        message: 'User already has this item borrowed'
      });
    }

    // Get user's borrowing limits based on role
    const user = await db('users').where({ id: borrowerId }).first();
    const borrowingLimits = getBorrowingLimits(user.role);

    // Check user's current borrowing count
    const [{ count: currentBorrowings }] = await db('library_borrowings')
      .where({ user_id: borrowerId, status: 'borrowed' })
      .count('* as count');

    if (parseInt(currentBorrowings) >= borrowingLimits.maxBooks) {
      return res.status(400).json({
        success: false,
        message: `User has reached maximum borrowing limit of ${borrowingLimits.maxBooks} books`
      });
    }

    // Calculate due date
    const borrowDate = new Date();
    const calculatedDueDate = dueDate ? new Date(dueDate) : new Date();
    if (!dueDate) {
      calculatedDueDate.setDate(calculatedDueDate.getDate() + borrowingLimits.durationDays);
    }

    // Create borrowing record
    const borrowingData = {
      item_id: itemId,
      user_id: borrowerId,
      borrowed_at: borrowDate,
      due_date: calculatedDueDate,
      status: 'borrowed',
      borrowed_by: req.user.userId
    };

    const [borrowingId] = await db('library_borrowings').insert(borrowingData).returning('id');

    // Update available copies
    await db('library_items')
      .where({ id: itemId })
      .decrement('available_copies', 1);

    logger.info('Item borrowed', {
      borrowingId,
      itemId,
      userId: borrowerId,
      dueDate: calculatedDueDate,
      borrowedBy: req.user.userId,
      institutionId: req.user.institutionId
    });

    res.status(201).json({
      success: true,
      message: 'Item borrowed successfully',
      data: { borrowingId, dueDate: calculatedDueDate }
    });
  } catch (error) {
    logger.error('Borrow item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Return item
 */
const returnItem = async (req, res) => {
  try {
    const { borrowId } = req.body;

    // Get borrowing record
    const borrowing = await db('library_borrowings')
      .join('library_items', 'library_borrowings.item_id', 'library_items.id')
      .where({
        'library_borrowings.id': borrowId,
        'library_borrowings.status': 'borrowed',
        'library_items.institution_id': req.user.institutionId
      })
      .select([
        'library_borrowings.*',
        'library_items.title as item_title'
      ])
      .first();

    if (!borrowing) {
      return res.status(404).json({
        success: false,
        message: 'Borrowing record not found'
      });
    }

    const returnDate = new Date();
    let fine = 0;

    // Calculate fine if overdue
    if (returnDate > new Date(borrowing.due_date)) {
      const overdueDays = Math.ceil((returnDate - new Date(borrowing.due_date)) / (1000 * 60 * 60 * 24));
      fine = overdueDays * 1; // $1 per day fine
    }

    // Update borrowing record
    await db('library_borrowings')
      .where({ id: borrowId })
      .update({
        returned_at: returnDate,
        status: 'returned',
        fine_amount: fine,
        returned_by: req.user.userId
      });

    // Update available copies
    await db('library_items')
      .where({ id: borrowing.item_id })
      .increment('available_copies', 1);

    logger.info('Item returned', {
      borrowingId: borrowId,
      itemId: borrowing.item_id,
      userId: borrowing.user_id,
      returnDate,
      fine,
      returnedBy: req.user.userId,
      institutionId: req.user.institutionId
    });

    res.json({
      success: true,
      message: 'Item returned successfully',
      data: { fine, returnDate }
    });
  } catch (error) {
    logger.error('Return item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Generate QR code for item
 */
const generateQRCode = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await db('library_items')
      .where({ id, institution_id: req.user.institutionId, deleted_at: null })
      .first();

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Library item not found'
      });
    }

    const qrData = JSON.stringify({
      itemId: id,
      institutionId: req.user.institutionId,
      type: 'library_item',
      title: item.title
    });

    const qrCodeUrl = await QRCode.toDataURL(qrData);

    res.json({
      success: true,
      data: { qrCode: qrCodeUrl }
    });
  } catch (error) {
    logger.error('Generate QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Search external libraries
 */
const searchExternalLibraries = async (req, res) => {
  try {
    const { query, sources = 'all', type = 'all', limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const results = [];

    // Google Books API
    if (sources === 'all' || sources.includes('google_books')) {
      try {
        const googleBooksResults = await searchGoogleBooks(query, limit);
        results.push(...googleBooksResults);
      } catch (error) {
        logger.warn('Google Books search failed:', error);
      }
    }

    // OpenLibrary API
    if (sources === 'all' || sources.includes('openlibrary')) {
      try {
        const openLibraryResults = await searchOpenLibrary(query, limit);
        results.push(...openLibraryResults);
      } catch (error) {
        logger.warn('OpenLibrary search failed:', error);
      }
    }

    // Sort results by relevance (simplified)
    results.sort((a, b) => b.relevance - a.relevance);

    res.json({
      success: true,
      data: {
        results: results.slice(0, limit),
        total: results.length,
        sources: sources === 'all' ? ['google_books', 'openlibrary'] : sources
      }
    });
  } catch (error) {
    logger.error('Search external libraries error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Helper function to get borrowing limits based on role
 */
const getBorrowingLimits = (role) => {
  const limits = {
    student: { maxBooks: 2, durationDays: 14 },
    faculty: { maxBooks: 5, durationDays: 30 },
    staff: { maxBooks: 3, durationDays: 21 },
    librarian: { maxBooks: 10, durationDays: 30 }
  };

  return limits[role] || limits.student;
};

/**
 * Helper function to search Google Books
 */
const searchGoogleBooks = async (query, maxResults = 20) => {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (!apiKey) return [];

  const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
    params: {
      q: query,
      maxResults,
      key: apiKey
    }
  });

  return response.data.items?.map(item => ({
    source: 'google_books',
    externalId: item.id,
    title: item.volumeInfo.title,
    authors: item.volumeInfo.authors,
    publisher: item.volumeInfo.publisher,
    publishedDate: item.volumeInfo.publishedDate,
    description: item.volumeInfo.description,
    isbn: item.volumeInfo.industryIdentifiers?.[0]?.identifier,
    thumbnail: item.volumeInfo.imageLinks?.thumbnail,
    previewLink: item.volumeInfo.previewLink,
    relevance: 0.8
  })) || [];
};

/**
 * Helper function to search OpenLibrary
 */
const searchOpenLibrary = async (query, limit = 20) => {
  const response = await axios.get('https://openlibrary.org/search.json', {
    params: {
      q: query,
      limit
    }
  });

  return response.data.docs?.map(item => ({
    source: 'openlibrary',
    externalId: item.key,
    title: item.title,
    authors: item.author_name,
    publisher: item.publisher?.[0],
    publishedDate: item.first_publish_year,
    isbn: item.isbn?.[0],
    relevance: 0.7
  })) || [];
};

// Placeholder implementations for missing methods
const searchInternalLibrary = async (req, res) => {
  res.json({ success: true, data: { items: [] } });
};

const getCategories = async (req, res) => {
  res.json({ success: true, data: { categories: [] } });
};

const getMyBorrowedItems = async (req, res) => {
  res.json({ success: true, data: { items: [] } });
};

const getOverdueItems = async (req, res) => {
  res.json({ success: true, data: { items: [] } });
};

const getPopularItems = async (req, res) => {
  res.json({ success: true, data: { items: [] } });
};

const bulkCreateLibraryItems = async (req, res) => {
  res.json({ success: true, message: 'Bulk create not implemented yet' });
};

const importLibraryFromCSV = async (req, res) => {
  res.json({ success: true, message: 'CSV import not implemented yet' });
};

const uploadItemCover = async (req, res) => {
  res.json({ success: true, message: 'Cover upload not implemented yet' });
};

const borrowItemByQR = async (req, res) => {
  res.json({ success: true, message: 'QR borrow not implemented yet' });
};

const returnItemByQR = async (req, res) => {
  res.json({ success: true, message: 'QR return not implemented yet' });
};

const reserveItem = async (req, res) => {
  res.json({ success: true, message: 'Item reserved' });
};

const cancelReservation = async (req, res) => {
  res.json({ success: true, message: 'Reservation cancelled' });
};

const getMyReservations = async (req, res) => {
  res.json({ success: true, data: { reservations: [] } });
};

const getExternalSources = async (req, res) => {
  res.json({ success: true, data: { sources: [] } });
};

const bookmarkExternalItem = async (req, res) => {
  res.json({ success: true, message: 'Item bookmarked' });
};

const importExternalItem = async (req, res) => {
  res.json({ success: true, message: 'Item imported' });
};

const getExternalBookmarks = async (req, res) => {
  res.json({ success: true, data: { bookmarks: [] } });
};

const removeExternalBookmark = async (req, res) => {
  res.json({ success: true, message: 'Bookmark removed' });
};

const scanQRCode = async (req, res) => {
  res.json({ success: true, data: { item: {} } });
};

const getBorrowingAnalytics = async (req, res) => {
  res.json({ success: true, data: { analytics: {} } });
};

const getPopularItemsAnalytics = async (req, res) => {
  res.json({ success: true, data: { analytics: {} } });
};

const getOverdueAnalytics = async (req, res) => {
  res.json({ success: true, data: { analytics: {} } });
};

const getUsageAnalytics = async (req, res) => {
  res.json({ success: true, data: { analytics: {} } });
};

const getAllBorrowings = async (req, res) => {
  res.json({ success: true, data: { borrowings: [] } });
};

const getAllReservations = async (req, res) => {
  res.json({ success: true, data: { reservations: [] } });
};

const getAllOverdueItems = async (req, res) => {
  res.json({ success: true, data: { items: [] } });
};

const getInventoryReport = async (req, res) => {
  res.json({ success: true, data: { report: {} } });
};

const extendBorrowing = async (req, res) => {
  res.json({ success: true, message: 'Borrowing extended' });
};

const addFine = async (req, res) => {
  res.json({ success: true, message: 'Fine added' });
};

const autoReturnOverdueItems = async (req, res) => {
  res.json({ success: true, message: 'Auto return completed' });
};

module.exports = {
  getInternalLibrary,
  getInternalLibraryItem,
  createLibraryItem,
  updateLibraryItem,
  deleteLibraryItem,
  borrowItem,
  returnItem,
  generateQRCode,
  searchExternalLibraries,
  searchInternalLibrary,
  getCategories,
  getMyBorrowedItems,
  getOverdueItems,
  getPopularItems,
  bulkCreateLibraryItems,
  importLibraryFromCSV,
  uploadItemCover,
  borrowItemByQR,
  returnItemByQR,
  reserveItem,
  cancelReservation,
  getMyReservations,
  getExternalSources,
  bookmarkExternalItem,
  importExternalItem,
  getExternalBookmarks,
  removeExternalBookmark,
  scanQRCode,
  getBorrowingAnalytics,
  getPopularItemsAnalytics,
  getOverdueAnalytics,
  getUsageAnalytics,
  getAllBorrowings,
  getAllReservations,
  getAllOverdueItems,
  getInventoryReport,
  extendBorrowing,
  addFine,
  autoReturnOverdueItems
};