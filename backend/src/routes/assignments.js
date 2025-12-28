const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/', assignmentController.getAssignments);
router.post('/', assignmentController.createAssignment);
router.put('/:id', assignmentController.updateAssignment);

module.exports = router;
