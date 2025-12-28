const express = require("express");
const auth = require("../middleware/auth");
const {
  createSubject,
  listSubjects,
  deleteSubject,
  logAttendance,
  getTodaysClasses,
  getWeekClasses,
  updateClassStatus,
  getClassInstances,
  regenerateSchedule,
} = require("../controllers/attendanceController");

const router = express.Router();
router.use(auth);

// Subject management
router.post("/subject", createSubject);
router.get("/subjects", listSubjects);
router.delete("/subject/:id", deleteSubject);

// Legacy attendance logging
router.post("/log", logAttendance);

// Class instance management
router.get("/classes/today", getTodaysClasses);
router.get("/classes/week", getWeekClasses);
router.get("/classes", getClassInstances);
router.post("/classes/update-status", updateClassStatus);
router.post("/classes/regenerate/:subjectId", regenerateSchedule);

module.exports = router;
