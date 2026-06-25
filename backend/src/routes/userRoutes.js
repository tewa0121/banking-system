const router = require('express').Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get profile
router.get('/profile', userController.getProfile);

// Update profile
router.put('/profile', userController.updateProfile);

// Change password
router.put('/change-password', userController.changePassword);

// ⭐ Upload profile image
router.put('/profile-image', userController.uploadProfileImage);

module.exports = router;