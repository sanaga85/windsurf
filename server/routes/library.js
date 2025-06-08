const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/libraryController');
const { body, param, query } = require('express-validator');
const uploadMiddleware = require('../middleware/uploadMiddleware');

// Validation rules
const createLibraryItemValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('type').isIn(['book', 'ebook', 'journal', 'article', 'video', 'audio', 'document']).withMessage('Invalid item type'),
  body('format').isIn(['physical', 'digital']).withMessage('Invalid format'),
  body('isbn').optional().isISBN().withMessage('Invalid ISBN format'),
  body('author').optional().notEmpty().withMessage('Author cannot be empty'),
  body('publisher').optional().notEmpty().withMessage('Publisher cannot be empty')
];

const updateLibraryItemValidation = [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('author').optional().notEmpty().withMessage('Author cannot be empty'),
  body('publisher').optional().notEmpty().withMessage('Publisher cannot be empty'),
  body('isbn').optional().isISBN().withMessage('Invalid ISBN format')
];

const borrowValidation = [
  body('itemId').isUUID().withMessage('Valid item ID is required'),
  body('userId').optional().isUUID().withMessage('Valid user ID is required'),
  body('dueDate').optional().isISO8601().withMessage('Valid due date is required')
];

const bulkImportValidation = [
  body('items').isArray({ min: 1 }).withMessage('Items array is required'),
  body('items.*.title').notEmpty().withMessage('Title is required for all items'),
  body('items.*.type').isIn(['book', 'ebook', 'journal', 'article', 'video', 'audio', 'document']).withMessage('Invalid item type'),
  body('items.*.format').isIn(['physical', 'digital']).withMessage('Invalid format')
];

// Internal library routes
router.get('/internal', libraryController.getInternalLibrary);
router.get('/internal/search', libraryController.searchInternalLibrary);
router.get('/internal/categories', libraryController.getCategories);
router.get('/internal/my-borrowed', libraryController.getMyBorrowedItems);
router.get('/internal/overdue', libraryController.getOverdueItems);
router.get('/internal/popular', libraryController.getPopularItems);

router.get('/internal/:id', 
  param('id').isUUID().withMessage('Invalid item ID'), 
  libraryController.getInternalLibraryItem
);

router.post('/internal', createLibraryItemValidation, libraryController.createLibraryItem);
router.post('/internal/bulk', bulkImportValidation, libraryController.bulkCreateLibraryItems);
router.post('/internal/import-csv', uploadMiddleware.single('csvFile'), libraryController.importLibraryFromCSV);
router.post('/internal/upload-cover', uploadMiddleware.single('cover'), libraryController.uploadItemCover);

router.put('/internal/:id', 
  param('id').isUUID().withMessage('Invalid item ID'),
  updateLibraryItemValidation,
  libraryController.updateLibraryItem
);

router.delete('/internal/:id', 
  param('id').isUUID().withMessage('Invalid item ID'),
  libraryController.deleteLibraryItem
);

// Borrowing and returning routes
router.post('/borrow', borrowValidation, libraryController.borrowItem);
router.post('/return', 
  body('borrowId').isUUID().withMessage('Valid borrow ID is required'),
  libraryController.returnItem
);

router.post('/borrow-qr', 
  body('qrCode').notEmpty().withMessage('QR code is required'),
  body('userId').optional().isUUID().withMessage('Valid user ID is required'),
  libraryController.borrowItemByQR
);

router.post('/return-qr', 
  body('qrCode').notEmpty().withMessage('QR code is required'),
  libraryController.returnItemByQR
);

// Reservation routes
router.post('/reserve', 
  body('itemId').isUUID().withMessage('Valid item ID is required'),
  libraryController.reserveItem
);

router.delete('/reserve/:id', 
  param('id').isUUID().withMessage('Invalid reservation ID'),
  libraryController.cancelReservation
);

router.get('/reservations', libraryController.getMyReservations);

// External library (federated search) routes
router.get('/external/search', libraryController.searchExternalLibraries);
router.get('/external/sources', libraryController.getExternalSources);
router.post('/external/bookmark', 
  body('source').notEmpty().withMessage('Source is required'),
  body('externalId').notEmpty().withMessage('External ID is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('metadata').isObject().withMessage('Metadata object is required'),
  libraryController.bookmarkExternalItem
);

router.post('/external/import', 
  body('source').notEmpty().withMessage('Source is required'),
  body('externalId').notEmpty().withMessage('External ID is required'),
  body('metadata').isObject().withMessage('Metadata object is required'),
  libraryController.importExternalItem
);

router.get('/external/bookmarks', libraryController.getExternalBookmarks);
router.delete('/external/bookmarks/:id', 
  param('id').isUUID().withMessage('Invalid bookmark ID'),
  libraryController.removeExternalBookmark
);

// QR code management
router.get('/internal/:id/qr', 
  param('id').isUUID().withMessage('Invalid item ID'),
  libraryController.generateQRCode
);

router.post('/scan-qr', 
  body('qrCode').notEmpty().withMessage('QR code is required'),
  libraryController.scanQRCode
);

// Analytics and reports
router.get('/analytics/borrowing', libraryController.getBorrowingAnalytics);
router.get('/analytics/popular', libraryController.getPopularItemsAnalytics);
router.get('/analytics/overdue', libraryController.getOverdueAnalytics);
router.get('/analytics/usage', libraryController.getUsageAnalytics);

// Library management (Librarian only)
router.get('/manage/borrowings', libraryController.getAllBorrowings);
router.get('/manage/reservations', libraryController.getAllReservations);
router.get('/manage/overdue', libraryController.getAllOverdueItems);
router.get('/manage/inventory', libraryController.getInventoryReport);

router.patch('/manage/borrowings/:id/extend', 
  param('id').isUUID().withMessage('Invalid borrowing ID'),
  body('newDueDate').isISO8601().withMessage('Valid due date is required'),
  libraryController.extendBorrowing
);

router.patch('/manage/borrowings/:id/fine', 
  param('id').isUUID().withMessage('Invalid borrowing ID'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid fine amount is required'),
  body('reason').notEmpty().withMessage('Fine reason is required'),
  libraryController.addFine
);

// Auto-return system (cron job endpoint)
router.post('/auto-return', libraryController.autoReturnOverdueItems);

module.exports = router;