const express = require("express");
const auth = require("../middleware/auth");
// const {
//   addSchedule,
//   getSchedule,
//   getTodaysClasses,
//   markTodayClass,
//   getSubjectAttendance,
//   regenerateAllSchedules,
// } = require("../controllers/scheduleController");
const { getSchedule } = require("../controllers/scheduleController");

const router = express.Router();
router.use(auth);

// router.post("/", addSchedule);
router.get("/", getSchedule);
// router.get("/today", getTodaysClasses);
// router.post("/today/mark", markTodayClass);
// router.get("/subject/:subjectId/attendance", getSubjectAttendance);
// router.post("/regenerate", regenerateAllSchedules);

module.exports = router;
