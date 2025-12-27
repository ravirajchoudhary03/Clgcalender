const Subject = require("../models/Subject");
const ClassInstance = require("../models/ClassInstance");
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

  // Start from today
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
      currentDate = currentDate.add(1, "week").day(targetDayNum);
    } else {
      currentDate = currentDate.day(targetDayNum);
    }

    // Generate instances for each week until endDate
    while (
      currentDate.isBefore(endDate) ||
      currentDate.isSame(endDate, "day")
    ) {
      try {
        // Check if instance already exists (idempotent)
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
            status: "pending",
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

// Add schedule entry (adds to Subject.schedule and generates ClassInstances)
exports.addSchedule = async (req, res) => {
  const { day, time, subjectId } = req.body;

  console.log("📅 Adding schedule:", { day, time, subjectId });

  if (!day || !time || !subjectId) {
    return res
      .status(400)
      .json({ message: "Invalid payload: day, time, and subjectId required" });
  }

  // Validate day
  const validDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  if (!validDays.includes(day)) {
    return res
      .status(400)
      .json({
        message: "Invalid day. Must be Mon, Tue, Wed, Thu, Fri, Sat, or Sun",
      });
  }

  // Parse time and calculate end time (1 hour later by default)
  const startTime = time;
  const [hours, minutes] = time.split(":");
  const endHour = (parseInt(hours) + 1) % 24;
  const endTime = `${endHour.toString().padStart(2, "0")}:${minutes}`;

  try {
    // Find the subject
    const subject = await Subject.findOne({
      _id: subjectId,
      user: req.user._id,
    });
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Check if this time slot already exists
    const existingSlot = subject.schedule.find(
      (slot) => slot.day === day && slot.startTime === startTime,
    );

    if (existingSlot) {
      return res
        .status(400)
        .json({ message: "This time slot already exists for this subject" });
    }

    // Add the new schedule entry
    subject.schedule.push({
      day,
      startTime,
      endTime,
    });

    // Update classesPerWeek
    subject.classesPerWeek = subject.schedule.length;

    await subject.save();

    console.log("✅ Schedule entry added to subject");
    console.log("📊 Subject now has", subject.schedule.length, "time slots");

    // Generate ClassInstances for the next 4 weeks
    await generateClassInstances(subject, 4);

    // Return the updated subject
    const updatedSubject = await Subject.findById(subjectId).lean();

    return res.json({
      message: "Schedule added successfully",
      subject: updatedSubject,
      scheduleEntry: { day, startTime, endTime },
    });
  } catch (err) {
    console.error("❌ Error adding schedule:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get schedule for user (returns all subjects with their schedules)
exports.getSchedule = async (req, res) => {
  try {
    const subjects = await Subject.find({ user: req.user._id }).lean();

    console.log("📚 Found", subjects.length, "subjects");

    // Flatten all schedule entries across subjects
    const scheduleEntries = [];

    subjects.forEach((subject) => {
      if (subject.schedule && subject.schedule.length > 0) {
        subject.schedule.forEach((slot) => {
          scheduleEntries.push({
            _id: `${subject._id}_${slot.day}_${slot.startTime}`, // Composite ID
            day: slot.day,
            time: slot.startTime,
            endTime: slot.endTime,
            subject: subject,
            subjectId: subject._id,
          });
        });
      }
    });

    console.log("📅 Total schedule entries:", scheduleEntries.length);

    return res.json(scheduleEntries);
  } catch (err) {
    console.error("❌ Error fetching schedule:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get today's classes (from ClassInstance, not WeeklySchedule)
exports.getTodaysClasses = async (req, res) => {
  try {
    const today = dayjs().startOf("day").toDate();
    const tomorrow = dayjs().add(1, "day").startOf("day").toDate();

    console.log("📅 Fetching today's classes for:", today);

    // Auto-generate missing instances for today (safety check)
    const subjects = await Subject.find({ user: req.user._id });
    for (const subject of subjects) {
      if (subject.schedule && subject.schedule.length > 0) {
        await generateClassInstances(subject, 1); // Generate for next 1 week
      }
    }

    const classes = await ClassInstance.find({
      user: req.user._id,
      date: { $gte: today, $lt: tomorrow },
    })
      .populate("subject")
      .sort({ startTime: 1 })
      .lean();

    console.log(`✅ Found ${classes.length} classes for today`);

    // Calculate attendance percentage for each subject
    const classesWithPercent = classes.map((cls) => {
      if (cls.subject) {
        const totalConducted =
          cls.subject.totalClasses - (cls.subject.classesCancelled || 0);
        const percent =
          totalConducted === 0
            ? 0
            : Math.round((cls.subject.classesAttended / totalConducted) * 100);
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
    console.error("❌ Error fetching today's classes:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Mark today's class (updates ClassInstance status)
exports.markTodayClass = async (req, res) => {
  const { scheduleId, date, status } = req.body;

  console.log("✏️ Marking class:", { scheduleId, date, status });

  if (!scheduleId || !date || !["attended", "missed"].includes(status)) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  try {
    // scheduleId is actually the ClassInstance _id in the new architecture
    const classInstance = await ClassInstance.findOne({
      _id: scheduleId,
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
    }

    // Update class instance
    classInstance.status = status;
    await classInstance.save();
    await subject.save();

    console.log("✅ Status updated successfully");

    // Recalculate attendance percentage
    const totalConducted = subject.totalClasses - subject.classesCancelled;
    const percent =
      totalConducted === 0
        ? 0
        : Math.round((subject.classesAttended / totalConducted) * 100);

    return res.json({
      subject: {
        ...subject.toObject(),
        percent,
      },
      log: classInstance,
    });
  } catch (err) {
    console.error("❌ Error marking class:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get attendance for a subject
exports.getSubjectAttendance = async (req, res) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.subjectId,
      user: req.user._id,
    }).lean();

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const totalConducted =
      subject.totalClasses - (subject.classesCancelled || 0);
    const percent =
      totalConducted === 0
        ? 0
        : Math.round((subject.classesAttended / totalConducted) * 100);

    let status = "red";
    if (percent >= 75) status = "green";
    else if (percent >= 65) status = "yellow";

    return res.json({ ...subject, percent, status });
  } catch (err) {
    console.error("❌ Error fetching subject attendance:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Regenerate class instances for all subjects (maintenance endpoint)
exports.regenerateAllSchedules = async (req, res) => {
  try {
    console.log("🔄 Regenerating all schedules...");

    const subjects = await Subject.find({ user: req.user._id });

    let totalGenerated = 0;

    for (const subject of subjects) {
      if (subject.schedule && subject.schedule.length > 0) {
        await generateClassInstances(subject, 4);
        totalGenerated += subject.schedule.length * 4; // Approximate
      }
    }

    console.log("✅ Regeneration complete");

    return res.json({
      message: "Schedules regenerated successfully",
      subjectsProcessed: subjects.length,
    });
  } catch (err) {
    console.error("❌ Error regenerating schedules:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
