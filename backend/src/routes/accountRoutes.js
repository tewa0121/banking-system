const router = require('express').Router();
const accountController = require('../controllers/accountController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get my account
router.get('/me', accountController.getMyAccount);

// Get account by ID
router.get('/:id', accountController.getAccountById);

module.exports = router;