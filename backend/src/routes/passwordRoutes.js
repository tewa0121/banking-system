const router = require('express').Router();
const passwordController = require('../controllers/passwordController');

// Forgot password - public
router.post('/forgot', passwordController.forgotPassword);

// Reset password - public
router.post('/reset', passwordController.resetPassword);

module.exports = router;