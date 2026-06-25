const router = require('express').Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Get account statement
router.get('/statement/:account_id', reportController.getAccountStatement);

module.exports = router;