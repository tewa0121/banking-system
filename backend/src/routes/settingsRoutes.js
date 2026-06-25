const router = require('express').Router();
const settingsController = require('../controllers/settingsController');
const { protect, adminOnly } = require('../middleware/auth');

// Only admin can access settings
router.use(protect);
router.use(adminOnly);

router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

module.exports = router;