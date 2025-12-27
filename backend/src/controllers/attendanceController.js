const Subject = require("../models/Subject");
const ClassInstance = require("../models/ClassInstance");
const AttendanceLog = require("../models/AttendanceLog");
const mockDb = require("../config/mockDb");
const dayjs = require("dayjs");
const isSameOrAfter = require("dayjs/plugin/isSameOrAfter");
const isSameOrBefore = require("dayjs/plugin/isSameOrBefore");

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// Helper function to generate class instances for a subject
const generateClassInstances = async (subject, weeksAhead = 4) => {
  if (!subject.schedule || subject.schedule.length === 0) {
    console.log("No schedule defined for subject:", subject.name);
    return;
  }

  console.log(`Generating class instances for ${subject.name}...`);
  const instances = [];

  // Start from today, not from Monday of current week
  const today = dayjs().startOf("day");
  const endDate = today.add(weeksAhead, "week");

  // Day name to day number mapping (Sunday = 0, Monday = 1, etc.)
  const dayMap = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  // For each time slot in the schedule
  for (const slot of subject.schedule) {
    const targetDayNum = dayMap[slot.day];

    // Start from today
    let currentDate = today;

    // If today is past the target day this week, start from next week
    if (currentDate.day() > targetDayNum) {
      // Move to next week's target day
      currentDate = currentDate.add(1, "week").day(targetDayNum);
    } else {
      // Move to this week's target day
      currentDate = currentDate.day(targetDayNum);
    }

    // Generate instances for each week until endDate
    while (
      currentDate.isBefore(endDate) ||
      currentDate.isSame(endDate, "day")
    ) {
      try {
        // Check if instance already exists
        const existing = await ClassInstance.findOne({
          user: subject.user,
          subject: subject._id,
          date: currentDate.toDate(),
          startTime: slot.startTime,
        });

        if (!existing) {
          instances.push({
            user: subject.user,
            subject: subject._id,
            date: currentDate.toDate(),
            startTime: slot.startTime,
            endTime: slot.endTime,
            day: slot.day,
            status: "pending", // Always pending for future classes
          });
        }
      } catch (err) {
        console.error("Error checking existing instance:", err);
      }

      currentDate = currentDate.add(1, "week");
    }
  }

  // Bulk insert class instances
  if (instances.length > 0) {
    try {
      const result = await ClassInstance.insertMany(instances, {
        ordered: false,
      });
      console.log(
        `✅ Created ${result.length} class instances for ${subject.name}`,
      );
    } catch (err) {
      // Ignore duplicate key errors
      if (err.code === 11000) {
        console.log("Some instances already exist, skipped duplicates");
      } else {
        console.error("Error inserting instances:", err);
      }
    }
  } else {
    console.log("No new instances to create");
  }
};

// Create subject with schedule
exports.createSubject = async (req, res) => {
  const { name, color, classesPerWeek, schedule } = req.body;

  console.log("Creating subject:", { name, color, classesPerWeek, schedule });

  try {
    try {
      // Validate schedule
      const validSchedule = schedule && Array.isArray(schedule) ? schedule : [];

      const sub = new Subject({
        user: req.user._id,
        name,
        color: color || "#34D399",
        classesPerWeek: classesPerWeek || validSchedule.length,
        schedule: validSchedule,
      });

      await sub.save();
      console.log("✅ Subject saved:", sub._id);

      // Generate class instances for the next 4 weeks
      if (validSchedule.length > 0) {
        await generateClassInstances(sub, 4);
      }

      return res.json(sub);
    } catch (err) {
      console.error("Database error, using mock data:", err);
      // Use mock data fallback
      const validSchedule = schedule && Array.isArray(schedule) ? schedule : [];
      const id = mockDb.nextId.subjects++;
      const sub = {
        _id: String(id),
        user_id: req.user._id.toString(),
        name,
        color: color || "#34D399",
        totalClasses: 0,
        classesAttended: 0,
        classesCancelled: 0,
        classesPerWeek: classesPerWeek || validSchedule.length,
        schedule: validSchedule,
      };
      mockDb.subjects[id] = sub;

      // Generate mock class instances for next 4 weeks
      if (validSchedule.length > 0) {
        const dayMap = {
          Sun: 0,
          Mon: 1,
          Tue: 2,
          Wed: 3,
          Thu: 4,
          Fri: 5,
          Sat: 6,
        };
        const today = dayjs().startOf("day");
        const endDate = today.add(4, "week");

        validSchedule.forEach((slot) => {
          const targetDayNum = dayMap[slot.day];
          let currentDate = today;

          if (currentDate.day() > targetDayNum) {
            currentDate = currentDate.add(1, "week").day(targetDayNum);
          } else {
            currentDate = currentDate.day(targetDayNum);
          }

          while (
            currentDate.isBefore(endDate) ||
            currentDate.isSame(endDate, "day")
          ) {
            const instanceId = mockDb.nextId.classInstances++;
            mockDb.classInstances[instanceId] = {
              _id: String(instanceId),
              user_id: req.user._id.toString(),
              subject_id: String(id),
              date: currentDate.format("YYYY-MM-DD"),
              startTime: slot.startTime,
              endTime: slot.endTime,
              day: slot.day,
              status: "pending",
            };
            currentDate = currentDate.add(1, "week");
          }
        });
      }

      return res.json(sub);
    }
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// List subjects with calculated percentage and status color
exports.listSubjects = async (req, res) => {
  if (!process.env.MONGO_URI) {
    // Use mock data directly
    const subs = Object.values(mockDb.subjects).filter(
      (s) => s.user_id === req.user._id.toString(),
    );
    const result = subs.map((s) => {
      const totalConducted = s.totalClasses - (s.classesCancelled || 0);
      const percent =
        totalConducted === 0
          ? 0
          : Math.round((s.classesAttended / totalConducted) * 100);
      let status = "red";
      if (percent >= 75) status = "green";
      else if (percent >= 65) status = "yellow";
      return {
        ...s,
        name: s.name,
        percent,
        status,
        classesAttended: s.classesAttended,
        totalClasses: s.totalClasses,
      };
    });
    return res.json(result);
  }

  try {
    const subs = await Subject.find({ user: req.user._id }).lean();
    const result = subs.map((s) => {
      const totalConducted = s.totalClasses - (s.classesCancelled || 0);
      const percent =
        totalConducted === 0
          ? 0
          : Math.round((s.classesAttended / totalConducted) * 100);
      let status = "red";
      if (percent >= 75) status = "green";
      else if (percent >= 65) status = "yellow";
      return { ...s, percent, status };
    });
    return res.json(result);
  } catch (err) {
    console.error("Database error, using mock data:", err);
    // Use mock data fallback
    const subs = Object.values(mockDb.subjects).filter(
      (s) => s.user_id === req.user._id.toString(),
    );
    const result = subs.map((s) => {
      const totalConducted = s.totalClasses - (s.classesCancelled || 0);
      const percent =
        totalConducted === 0
          ? 0
          : Math.round((s.classesAttended / totalConducted) * 100);
      let status = "red";
      if (percent >= 75) status = "green";
      else if (percent >= 65) status = "yellow";
      return {
        ...s,
        name: s.name,
        percent,
        status,
        classesAttended: s.classesAttended,
        totalClasses: s.totalClasses,
      };
    });
    return res.json(result);
  }
};

// Log attendance for a subject for a date (attended/missed) - LEGACY
exports.logAttendance = async (req, res) => {
  const { subjectId, date, status } = req.body;
  if (!subjectId || !date || !["attended", "missed"].includes(status)) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  try {
    try {
      const subject = await Subject.findOne({
        _id: subjectId,
        user: req.user._id,
      });
      if (!subject)
        return res.status(404).json({ message: "Subject not found" });

      const prev = await AttendanceLog.findOne({
        user: req.user._id,
        subject: subjectId,
        date,
      });
      if (prev) {
        if (prev.status === status)
          return res.json({ message: "No change", log: prev });
        if (prev.status === "attended") subject.classesAttended -= 1;
      } else {
        subject.totalClasses += 1;
      }

      if (status === "attended") subject.classesAttended += 1;

      await subject.save();

      const log = await AttendanceLog.findOneAndUpdate(
        { user: req.user._id, subject: subjectId, date },
        { status },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      return res.json({ subject, log });
    } catch (err) {
      console.error("Database error:", err);
      // Use mock data fallback
      const subject = Object.values(mockDb.subjects).find(
        (s) => s._id === subjectId && s.user_id === req.user._id.toString(),
      );
      if (!subject)
        return res.status(404).json({ message: "Subject not found" });

      const id = mockDb.nextId.attendanceLogs++;
      const log = {
        _id: String(id),
        user_id: req.user._id,
        subject_id: subjectId,
        date,
        status,
      };
      mockDb.attendanceLogs[id] = log;
      return res.json({ subject, log });
    }
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get today's classes
exports.getTodaysClasses = async (req, res) => {
  try {
    const today = dayjs().startOf("day").toDate();
    const tomorrow = dayjs().add(1, "day").startOf("day").toDate();

    console.log("Fetching today's classes for:", today);

    try {
      const classes = await ClassInstance.find({
        user: req.user._id,
        date: { $gte: today, $lt: tomorrow },
      })
        .populate("subject")
        .sort({ startTime: 1 })
        .lean();

      console.log(`Found ${classes.length} classes for today`);

      // Calculate attendance percentage for each subject
      const classesWithPercent = classes.map((cls) => {
        if (cls.subject) {
          const totalConducted =
            cls.subject.totalClasses - (cls.subject.classesCancelled || 0);
          const percent =
            totalConducted === 0
              ? 0
              : Math.round(
                  (cls.subject.classesAttended / totalConducted) * 100,
                );
          return {
            ...cls,
            subject: {
              ...cls.subject,
              percent,
            },
          };
        }
        return cls;
      });

      return res.json(classesWithPercent);
    } catch (err) {
      console.error("Database error, using mock data:", err);
      // Mock data fallback - return today's mock classes
      const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const todayDayName = dayMap[new Date().getDay()];

      const todayMockClasses = Object.values(mockDb.classInstances || {})
        .filter((cls) => {
          const clsDate = new Date(cls.date);
          return (
            cls.user_id === req.user._id.toString() &&
            cls.date === dayjs().format("YYYY-MM-DD")
          );
        })
        .map((cls) => {
          const subject = mockDb.subjects[cls.subject_id] || {};
          return {
            ...cls,
            subject: {
              ...subject,
              percent: 0,
            },
          };
        });

      return res.json(todayMockClasses);
    }
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get week's classes (for calendar view)
exports.getWeekClasses = async (req, res) => {
  try {
    const { weekOffset } = req.query;
    const offset = parseInt(weekOffset) || 0;

    // Calculate week start (Monday) and end (Sunday)
    const today = dayjs().add(offset * 7, "day");
    const weekStart = today
      .startOf("week")
      .add(1, "day")
      .startOf("day")
      .toDate();
    const weekEnd = today.endOf("week").add(1, "day").endOf("day").toDate();

    console.log("Fetching week classes from:", weekStart, "to:", weekEnd);

    try {
      const classes = await ClassInstance.find({
        user: req.user._id,
        date: { $gte: weekStart, $lte: weekEnd },
      })
        .populate("subject")
        .sort({ date: 1, startTime: 1 })
        .lean();

      console.log(`Found ${classes.length} classes for the week`);

      // Add day name to each class
      const classesWithDay = classes.map((cls) => {
        const date = dayjs(cls.date);
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return {
          ...cls,
          day: dayNames[date.day()],
        };
      });

      return res.json(classesWithDay);
    } catch (err) {
      console.error("Database error, using mock data:", err);
      // Mock data fallback - return week's mock classes
      const today = dayjs().add(offset * 7, "day");
      const weekStart = today.startOf("week").add(1, "day");
      const weekEnd = today.endOf("week").add(1, "day");

      const weekMockClasses = Object.values(mockDb.classInstances || {})
        .filter((cls) => {
          const clsDate = dayjs(cls.date);
          return (
            cls.user_id === req.user._id.toString() &&
            clsDate.isSameOrAfter(weekStart, "day") &&
            clsDate.isSameOrBefore(weekEnd, "day")
          );
        })
        .map((cls) => {
          const subject = mockDb.subjects[cls.subject_id] || {};
          return {
            ...cls,
            subject: subject,
            day: cls.day,
          };
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      console.log(`Returning ${weekMockClasses.length} mock week classes`);
      return res.json(weekMockClasses);
    }
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update class instance status (attended/missed/cancelled)
exports.updateClassStatus = async (req, res) => {
  const { classId, status } = req.body;

  console.log("Updating class status:", { classId, status });

  if (!classId || !["attended", "missed", "cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  try {
    try {
      const classInstance = await ClassInstance.findOne({
        _id: classId,
        user: req.user._id,
      });

      if (!classInstance) {
        return res.status(404).json({ message: "Class not found" });
      }

      const subject = await Subject.findById(classInstance.subject);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }

      const oldStatus = classInstance.status;
      console.log(`Changing status from ${oldStatus} to ${status}`);

      // Revert old status from subject counters
      if (oldStatus === "attended") {
        subject.classesAttended -= 1;
        subject.totalClasses -= 1;
      } else if (oldStatus === "missed") {
        subject.totalClasses -= 1;
      } else if (oldStatus === "cancelled") {
        subject.classesCancelled -= 1;
      }

      // Apply new status to subject counters
      if (status === "attended") {
        subject.classesAttended += 1;
        subject.totalClasses += 1;
      } else if (status === "missed") {
        subject.totalClasses += 1;
      } else if (status === "cancelled") {
        subject.classesCancelled += 1;
      }

      // Update class instance
      classInstance.status = status;
      await classInstance.save();
      await subject.save();

      console.log("✅ Status updated successfully");
      console.log("Subject stats:", {
        attended: subject.classesAttended,
        total: subject.totalClasses,
        cancelled: subject.classesCancelled,
      });

      // Recalculate attendance percentage
      const totalConducted = subject.totalClasses - subject.classesCancelled;
      const percent =
        totalConducted === 0
          ? 0
          : Math.round((subject.classesAttended / totalConducted) * 100);

      return res.json({
        classInstance,
        subject: {
          ...subject.toObject(),
          percent,
        },
      });
    } catch (err) {
      console.error("Database error:", err);
      // Mock data fallback
      return res
        .status(500)
        .json({ message: "Database unavailable, using mock mode" });
    }
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all class instances for a date range
exports.getClassInstances = async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const query = { user: req.user._id };
    if (startDate) query.date = { $gte: new Date(startDate) };
    if (endDate) query.date = { ...query.date, $lte: new Date(endDate) };

    const instances = await ClassInstance.find(query)
      .populate("subject")
      .sort({ date: 1, startTime: 1 });

    return res.json(instances);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Regenerate class instances for a subject
exports.regenerateSchedule = async (req, res) => {
  const { subjectId } = req.params;

  console.log("Regenerating schedule for subject:", subjectId);

  try {
    const subject = await Subject.findOne({
      _id: subjectId,
      user: req.user._id,
    });

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    await generateClassInstances(subject, 4);

    return res.json({ message: "Schedule regenerated successfully" });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
