const router = require('express').Router();
const languageController = require('../controllers/languageController');

router.get('/languages', languageController.getLanguages);

module.exports = router;