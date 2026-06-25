const router = require('express').Router();
const bankController = require('../controllers/bankController');
const { protect } = require('../middleware/auth');

// Get all banks
router.get('/list', protect, bankController.getBanks);

// External transfer
router.post('/transfer', protect, bankController.externalTransfer);

module.exports = router;