// Diagnostic script to check the current state of the attendance tracker
// Run this to verify data architecture and identify issues

const mongoose = require("mongoose");
const WeeklySchedule = require("../models/WeeklySchedule");
const Subject = require("../models/Subject");
const ClassInstance = require("../models/ClassInstance");
const dayjs = require("dayjs");

require("dotenv").config();

const diagnose = async () => {
  try {
    console.log("\n🔍 ATTENDANCE TRACKER DIAGNOSTIC REPORT");
    console.log("=" .repeat(60));
    console.log(`📅 Run Date: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`);
    console.log("=" .repeat(60));

    // Connect to MongoDB
    console.log("\n📊 Connecting to database...");
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/attendance-tracker",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("✅ Connected to database\n");

    // Check 1: WeeklySchedule Collection (LEGACY)
    console.log("━".repeat(60));
    console.log("CHECK 1: WeeklySchedule Collection (LEGACY SYSTEM)");
    console.log("━".repeat(60));

    try {
      const weeklyCount = await WeeklySchedule.countDocuments();
      if (weeklyCount > 0) {
        console.log(`⚠️  WARNING: Found ${weeklyCount} WeeklySchedule entries`);
        console.log("   This is the OLD system and should be migrated!");
        console.log("   Run: node src/scripts/migrateSchedule.js");

        const sampleSchedules = await WeeklySchedule.find().limit(3).populate("subject");
        console.log("\n   Sample entries:");
        sampleSchedules.forEach((entry, i) => {
          console.log(`   ${i + 1}. ${entry.day} ${entry.time} - ${entry.subject?.name || "Unknown"}`);
        });
      } else {
        console.log("✅ No WeeklySchedule entries (good - using new system)");
      }
    } catch (err) {
      console.log("ℹ️  WeeklySchedule collection doesn't exist (expected)");
    }

    // Check 2: Subjects with Schedules
    console.log("\n━".repeat(60));
    console.log("CHECK 2: Subjects (Schedule Rules)");
    console.log("━".repeat(60));

    const allSubjects = await Subject.find({});
    console.log(`📚 Total subjects: ${allSubjects.length}`);

    const subjectsWithSchedule = allSubjects.filter(
      (s) => s.schedule && s.schedule.length > 0
    );
    console.log(`📅 Subjects with schedules: ${subjectsWithSchedule.length}`);

    if (subjectsWithSchedule.length > 0) {
      console.log("\n   Subjects with schedules:");
      subjectsWithSchedule.forEach((subject, i) => {
        console.log(`\n   ${i + 1}. ${subject.name} (${subject.schedule.length} time slots)`);
        subject.schedule.forEach((slot) => {
          console.log(`      → ${slot.day}: ${slot.startTime} - ${slot.endTime}`);
        });
      });
    } else {
      console.log("⚠️  No subjects have schedules defined!");
      console.log("   Action: Add subjects via /api/attendance/subjects");
    }

    // Check 3: ClassInstances
    console.log("\n━".repeat(60));
    console.log("CHECK 3: ClassInstances (Actual Classes)");
    console.log("━".repeat(60));

    const totalInstances = await ClassInstance.countDocuments();
    console.log(`📋 Total ClassInstances: ${totalInstances}`);

    const today = dayjs().startOf("day").toDate();
    const todayEnd = dayjs().endOf("day").toDate();
    const todaysInstances = await ClassInstance.find({
      date: { $gte: today, $lte: todayEnd },
    }).populate("subject");

    console.log(`📅 Today's ClassInstances: ${todaysInstances.length}`);

    if (todaysInstances.length > 0) {
      console.log("\n   Today's classes:");
      todaysInstances.forEach((cls, i) => {
        console.log(
          `   ${i + 1}. ${cls.subject?.name || "Unknown"}: ${cls.startTime}-${cls.endTime} [${cls.status}]`
        );
      });
    }

    const weekStart = dayjs().startOf("week").add(1, "day").toDate();
    const weekEnd = dayjs().endOf("week").add(1, "day").toDate();
    const weekInstances = await ClassInstance.countDocuments({
      date: { $gte: weekStart, $lte: weekEnd },
    });

    console.log(`📅 This week's ClassInstances: ${weekInstances}`);

    const futureInstances = await ClassInstance.countDocuments({
      date: { $gte: today },
    });

    console.log(`🔮 Future ClassInstances: ${futureInstances}`);

    // Check 4: Status Distribution
    console.log("\n━".repeat(60));
    console.log("CHECK 4: ClassInstance Status Distribution");
    console.log("━".repeat(60));

    const statusCounts = await ClassInstance.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    statusCounts.forEach((item) => {
      const statusIcon = {
        pending: "⏳",
        attended: "✅",
        missed: "❌",
        cancelled: "🚫",
      }[item._id] || "❓";
      console.log(`   ${statusIcon} ${item._id}: ${item.count}`);
    });

    // Check 5: Data Consistency
    console.log("\n━".repeat(60));
    console.log("CHECK 5: Data Consistency");
    console.log("━".repeat(60));

    let issuesFound = 0;

    // Check if subjects with schedules have ClassInstances
    for (const subject of subjectsWithSchedule) {
      const instanceCount = await ClassInstance.countDocuments({
        subject: subject._id,
        date: { $gte: today },
      });

      if (instanceCount === 0) {
        console.log(`⚠️  Subject "${subject.name}" has schedule but NO ClassInstances`);
        console.log(`   Action: Run regeneration for this subject`);
        issuesFound++;
      }
    }

    if (issuesFound === 0) {
      console.log("✅ All subjects with schedules have ClassInstances");
    }

    // Check 6: Recommendations
    console.log("\n━".repeat(60));
    console.log("RECOMMENDATIONS");
    console.log("━".repeat(60));

    const recommendations = [];

    try {
      const weeklyCount = await WeeklySchedule.countDocuments();
      if (weeklyCount > 0) {
        recommendations.push({
          priority: "🔴 HIGH",
          issue: `${weeklyCount} WeeklySchedule entries found (legacy system)`,
          action: "Run: node src/scripts/migrateSchedule.js",
        });
      }
    } catch (err) {
      // WeeklySchedule doesn't exist - good!
    }

    if (subjectsWithSchedule.length === 0) {
      recommendations.push({
        priority: "🟡 MEDIUM",
        issue: "No subjects have schedules defined",
        action: "Create subjects via Schedule page or API",
      });
    }

    if (futureInstances === 0 && subjectsWithSchedule.length > 0) {
      recommendations.push({
        priority: "🔴 HIGH",
        issue: "Subjects have schedules but no future ClassInstances",
        action: "POST /api/schedule/regenerate",
      });
    }

    if (futureInstances < 20 && subjectsWithSchedule.length > 0) {
      recommendations.push({
        priority: "🟡 MEDIUM",
        issue: "Low number of future ClassInstances",
        action: "Consider running regeneration to create more instances",
      });
    }

    if (recommendations.length === 0) {
      console.log("✅ System looks healthy! No recommendations.");
    } else {
      recommendations.forEach((rec, i) => {
        console.log(`\n${i + 1}. ${rec.priority}`);
        console.log(`   Issue: ${rec.issue}`);
        console.log(`   Action: ${rec.action}`);
      });
    }

    // Summary
    console.log("\n━".repeat(60));
    console.log("SUMMARY");
    console.log("━".repeat(60));
    console.log(`📚 Subjects: ${allSubjects.length}`);
    console.log(`📅 Subjects with schedules: ${subjectsWithSchedule.length}`);
    console.log(`📋 Total ClassInstances: ${totalInstances}`);
    console.log(`🔮 Future ClassInstances: ${futureInstances}`);
    console.log(`⚠️  Issues found: ${issuesFound + recommendations.length}`);

    console.log("\n✅ Diagnostic complete!");
    console.log("=" .repeat(60));

    await mongoose.connection.close();
    console.log("\n👋 Database connection closed\n");
  } catch (err) {
    console.error("\n❌ Diagnostic failed:", err);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run diagnostic
if (require.main === module) {
  diagnose();
}

module.exports = diagnose;
