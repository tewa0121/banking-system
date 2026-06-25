const router = require('express').Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

// Dashboard Statistics
router.get('/stats', adminController.getDashboardStats);

// Users
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/status', adminController.updateUserStatus); // ⭐ አክል

// Accounts
router.get('/accounts', adminController.getAllAccounts);

// Transactions
router.get('/transactions', adminController.getAllTransactions);

module.exports = router;