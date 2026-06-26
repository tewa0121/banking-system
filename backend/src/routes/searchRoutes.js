const router = require('express').Router();
const searchController = require('../controllers/searchController');
const { protect, adminOnly } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Global Search
router.get('/global', searchController.globalSearch);

// Search Users (Admin only)
router.get('/users', adminOnly, searchController.searchUsers);

// Search Accounts
router.get('/accounts', searchController.searchAccounts);

// Search Transactions
router.get('/transactions', searchController.searchTransactions);

module.exports = router;