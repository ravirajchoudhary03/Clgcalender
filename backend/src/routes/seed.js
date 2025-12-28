const express = require('express');
const router = express.Router();
const seedController = require('../controllers/seedController');
const protect = require('../middleware/auth');

router.post('/', protect, seedController.seedData);

module.exports = router;
