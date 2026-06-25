const router = require('express').Router();
const transactionController = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Deposit - Add money
router.post('/deposit', transactionController.deposit);

// Withdraw - Remove money
router.post('/withdraw', transactionController.withdraw);

// Transfer - Send money to another account
router.post('/transfer', transactionController.transfer);

// Get transaction history
router.get('/history/:account_id', transactionController.getTransactionHistory);

// Get transaction by ID
router.get('/:id', transactionController.getTransactionById);
// Get filtered transaction history
router.get('/filter/:account_id', transactionController.getFilteredTransactions);

module.exports = router;