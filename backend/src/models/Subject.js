// Subject model to track classes and attendance summary with weekly schedule

const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    startTime: { type: String, required: true }, // Format: "HH:MM" e.g., "09:00"
    endTime: { type: String, required: true }, // Format: "HH:MM" e.g., "10:00"
  },
  { _id: false },
);

const subjectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  totalClasses: { type: Number, default: 0 },
  classesAttended: { type: Number, default: 0 },
  classesCancelled: { type: Number, default: 0 },
  color: { type: String, default: "#34D399" },

  // Weekly schedule configuration
  classesPerWeek: { type: Number, default: 0, min: 0, max: 21 },
  schedule: [timeSlotSchema], // Array of {day, startTime, endTime}

  createdAt: { type: Date, default: Date.now },
});

// Virtual for attendance percentage
subjectSchema.virtual("attendancePercent").get(function () {
  const totalConducted = this.totalClasses - this.classesCancelled;
  if (totalConducted === 0) return 0;
  return Math.round((this.classesAttended / totalConducted) * 100);
});

// Ensure virtuals are included when converting to JSON
subjectSchema.set("toJSON", { virtuals: true });
subjectSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Subject", subjectSchema);
