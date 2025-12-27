const express = require('express');
const auth = require('../middleware/auth');
const { createHabit, getHabits, markCompletion, getCompletionStats } = require('../controllers/habitController');

const router = express.Router();

router.use(auth);

router.post('/', createHabit);
router.get('/', getHabits);
router.post('/log', markCompletion);
router.get('/stats', getCompletionStats);

module.exports = router;
