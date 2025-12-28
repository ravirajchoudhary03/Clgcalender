const express = require('express');
const auth = require('../middleware/auth');
const { createHabit, getHabits, markCompletion, getCompletionStats, getLogs } = require('../controllers/habitController');

const router = express.Router();

router.use(auth);

router.post('/', createHabit);
router.get('/', getHabits);
router.post('/log', markCompletion);
router.get('/stats', getCompletionStats);
router.get('/logs', getLogs);

module.exports = router;
