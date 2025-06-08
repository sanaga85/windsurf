const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/libraryController');
const externalLibraryController = require('../controllers/externalLibraryController');
const { body, param, query } = require('express-validator');
const uploadMiddleware = require('../middleware/uploadMiddleware');

// Validation rules
const libraryItemValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('type').isIn(['book', 'journal', 'article', 'video', 'audio', 'document', 'url']).withMessage('Invalid item type'),
  body('isPhysical').isBoolean().withMessage('isPhysical must be boolean'),
  body('isDigital').isBoolean().withMessage('isDigital must be boolean')
];

const borrowingValidation = [
  body('libraryItemId').isUUID().withMessage('Valid library item ID is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required')
];

const reservationValidation = [
  body('libraryItemId').isUUID().withMessage('Valid library item ID is required')
];

// Internal Library Routes

// Library items CRUD
router.get('/items', libraryController.getLibraryItems);
router.get('/items/search', libraryController.searchLibraryItems);
router.get('/items/:id', param('id').isUUID(), libraryController.getLibraryItemById);
router.get('/items/:id/availability', param('id').isUUID(), libraryController.checkItemAvailability);

router.post('/items', libraryItemValidation, libraryController.createLibraryItem);
router.post('/items/bulk', libraryController.bulkCreateLibraryItems);
router.post('/items/import-csv', uploadMiddleware.single('file'), libraryController.importItemsFromCSV);

router.put('/items/:id', param('id').isUUID(), libraryController.updateLibraryItem);
router.delete('/items/:id', param('id').isUUID(), libraryController.deleteLibraryItem);

// File uploads for library items
router.post('/items/:id/file', 
  param('id').isUUID(),
  uploadMiddleware.single('file'),
  libraryController.uploadItemFile
);

router.post('/items/:id/cover', 
  param('id').isUUID(),
  uploadMiddleware.single('cover'),
  libraryController.uploadItemCover
);

// QR Code generation for physical books
router.get('/items/:id/qr-code', param('id').isUUID(), libraryController.generateQRCode);
router.post('/items/scan-qr', libraryController.scanQRCode);

// Borrowing management
router.get('/borrowings', libraryController.getBorrowings);
router.get('/borrowings/my', libraryController.getMyBorrowings);
router.get('/borrowings/overdue', libraryController.getOverdueBorrowings);
router.get('/borrowings/:id', param('id').isUUID(), libraryController.getBorrowingById);

router.post('/borrowings', borrowingValidation, libraryController.createBorrowing);
router.post('/borrowings/quick-borrow', libraryController.quickBorrow); // For QR code scanning
router.put('/borrowings/:id/return', param('id').isUUID(), libraryController.returnItem);
router.put('/borrowings/:id/renew', param('id').isUUID(), libraryController.renewBorrowing);
router.put('/borrowings/:id/mark-lost', param('id').isUUID(), libraryController.markItemLost);
router.put('/borrowings/:id/mark-damaged', param('id').isUUID(), libraryController.markItemDamaged);

// Reservations
router.get('/reservations', libraryController.getReservations);
router.get('/reservations/my', libraryController.getMyReservations);
router.post('/reservations', reservationValidation, libraryController.createReservation);
router.put('/reservations/:id/cancel', param('id').isUUID(), libraryController.cancelReservation);
router.put('/reservations/:id/fulfill', param('id').isUUID(), libraryController.fulfillReservation);

// Library analytics and reports
router.get('/analytics/overview', libraryController.getLibraryOverview);
router.get('/analytics/popular-items', libraryController.getPopularItems);
router.get('/analytics/borrowing-trends', libraryController.getBorrowingTrends);
router.get('/analytics/user-activity', libraryController.getUserActivity);

// Fine management
router.get('/fines', libraryController.getFines);
router.get('/fines/my', libraryController.getMyFines);
router.put('/fines/:id/pay', param('id').isUUID(), libraryController.payFine);
router.put('/fines/:id/waive', param('id').isUUID(), libraryController.waiveFine);

// Inventory management
router.get('/inventory/low-stock', libraryController.getLowStockItems);
router.get('/inventory/damaged', libraryController.getDamagedItems);
router.get('/inventory/lost', libraryController.getLostItems);
router.post('/inventory/audit', libraryController.performInventoryAudit);

// External Library Routes (Federated Search)

// Search across external sources
router.get('/external/search', externalLibraryController.searchExternalSources);
router.get('/external/search/google-books', externalLibraryController.searchGoogleBooks);
router.get('/external/search/openlibrary', externalLibraryController.searchOpenLibrary);
router.get('/external/search/youtube', externalLibraryController.searchYouTube);
router.get('/external/search/podcasts', externalLibraryController.searchPodcasts);
router.get('/external/search/arxiv', externalLibraryController.searchArxiv);

// External item details
router.get('/external/item/:source/:id', externalLibraryController.getExternalItemDetails);

// Bookmarking external resources
router.get('/external/bookmarks', externalLibraryController.getExternalBookmarks);
router.post('/external/bookmarks', externalLibraryController.createExternalBookmark);
router.delete('/external/bookmarks/:id', param('id').isUUID(), externalLibraryController.deleteExternalBookmark);

// Import external items to internal library
router.post('/external/import', externalLibraryController.importExternalItem);
router.post('/external/bulk-import', externalLibraryController.bulkImportExternalItems);

// Categories and tags
router.get('/categories', libraryController.getCategories);
router.post('/categories', libraryController.createCategory);
router.get('/tags', libraryController.getTags);
router.post('/tags', libraryController.createTag);

// Library settings and policies
router.get('/settings', libraryController.getLibrarySettings);
router.put('/settings', libraryController.updateLibrarySettings);
router.get('/policies', libraryController.getBorrowingPolicies);
router.put('/policies', libraryController.updateBorrowingPolicies);

// Automated tasks (for cron jobs)
router.post('/tasks/auto-return', libraryController.autoReturnOverdueItems);
router.post('/tasks/send-reminders', libraryController.sendDueReminders);
router.post('/tasks/calculate-fines', libraryController.calculateOverdueFines);

module.exports = router;