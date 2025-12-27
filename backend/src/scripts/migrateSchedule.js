// Migration script to convert WeeklySchedule entries to Subject.schedule + ClassInstances
// This is a ONE-TIME migration to fix the data architecture

const mongoose = require("mongoose");
const WeeklySchedule = require("../models/WeeklySchedule");
const Subject = require("../models/Subject");
const ClassInstance = require("../models/ClassInstance");
const dayjs = require("dayjs");

// Load environment variables
require("dotenv").config();

const migrateSchedule = async () => {
  try {
    console.log("🔄 Starting schedule migration...");
    console.log("📊 Connecting to database...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/attendance-tracker", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to database");

    // Step 1: Fetch all WeeklySchedule entries
    const weeklySchedules = await WeeklySchedule.find({}).populate("subject");
    console.log(`📅 Found ${weeklySchedules.length} WeeklySchedule entries`);

    if (weeklySchedules.length === 0) {
      console.log("ℹ️ No WeeklySchedule entries to migrate");
      await mongoose.connection.close();
      return;
    }

    // Step 2: Group by subject
    const schedulesBySubject = {};
    weeklySchedules.forEach((entry) => {
      const subjectId = entry.subject._id.toString();
      if (!schedulesBySubject[subjectId]) {
        schedulesBySubject[subjectId] = {
          subject: entry.subject,
          slots: [],
        };
      }

      // Calculate end time (1 hour after start by default)
      const [hours, minutes] = entry.time.split(":");
      const endHour = (parseInt(hours) + 1) % 24;
      const endTime = `${endHour.toString().padStart(2, "0")}:${minutes}`;

      schedulesBySubject[subjectId].slots.push({
        day: entry.day,
        startTime: entry.time,
        endTime: endTime,
      });
    });

    console.log(`📚 Found ${Object.keys(schedulesBySubject).length} unique subjects`);

    // Step 3: Update each subject with schedule
    for (const [subjectId, data] of Object.entries(schedulesBySubject)) {
      const subject = await Subject.findById(subjectId);

      if (!subject) {
        console.log(`⚠️ Subject ${subjectId} not found, skipping...`);
        continue;
      }

      console.log(`\n📖 Processing subject: ${subject.name}`);
      console.log(`   Time slots to add: ${data.slots.length}`);

      // Add slots to subject.schedule (avoid duplicates)
      data.slots.forEach((slot) => {
        const exists = subject.schedule.some(
          (s) => s.day === slot.day && s.startTime === slot.startTime
        );

        if (!exists) {
          subject.schedule.push(slot);
          console.log(`   ✅ Added: ${slot.day} ${slot.startTime}-${slot.endTime}`);
        } else {
          console.log(`   ⏭️ Skipped (duplicate): ${slot.day} ${slot.startTime}`);
        }
      });

      // Update classesPerWeek
      subject.classesPerWeek = subject.schedule.length;
      await subject.save();

      console.log(`   💾 Saved subject with ${subject.schedule.length} time slots`);

      // Step 4: Generate ClassInstances for next 4 weeks
      console.log(`   🔄 Generating ClassInstances for next 4 weeks...`);
      await generateClassInstances(subject, 4);
    }

    console.log("\n✅ Migration completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`   - Migrated ${weeklySchedules.length} schedule entries`);
    console.log(`   - Updated ${Object.keys(schedulesBySubject).length} subjects`);
    console.log(`   - Generated ClassInstances for next 4 weeks`);
    console.log("\n⚠️ IMPORTANT: You can now safely delete WeeklySchedule entries");
    console.log("   Run: db.weeklyschedules.deleteMany({}) in MongoDB shell");

    await mongoose.connection.close();
    console.log("\n👋 Database connection closed");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Helper function to generate class instances
const generateClassInstances = async (subject, weeksAhead = 4) => {
  if (!subject.schedule || subject.schedule.length === 0) {
    console.log("      No schedule defined, skipping instance generation");
    return;
  }

  const instances = [];
  const today = dayjs().startOf("day");
  const endDate = today.add(weeksAhead, "week");

  const dayMap = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  for (const slot of subject.schedule) {
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

      currentDate = currentDate.add(1, "week");
    }
  }

  if (instances.length > 0) {
    try {
      const result = await ClassInstance.insertMany(instances, {
        ordered: false,
      });
      console.log(`      ✅ Created ${result.length} ClassInstances`);
    } catch (err) {
      if (err.code === 11000) {
        console.log("      ⏭️ Some instances already exist, skipped duplicates");
      } else {
        console.error("      ❌ Error inserting instances:", err);
      }
    }
  } else {
    console.log("      ℹ️ No new instances to create");
  }
};

// Run migration
if (require.main === module) {
  migrateSchedule();
}

module.exports = migrateSchedule;
