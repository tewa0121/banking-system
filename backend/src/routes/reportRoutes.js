const router = require('express').Router();
const reportController = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/auth');

// User routes - require authentication only
router.get('/statement/:account_id', protect, reportController.getAccountStatement);

// Admin routes - require admin role
router.get('/admin/transactions', protect, adminOnly, reportController.getAllTransactionsReport);

module.exports = router;