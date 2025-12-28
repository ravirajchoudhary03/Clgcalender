const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/', examController.getExams);
router.post('/', examController.createExam);

module.exports = router;
