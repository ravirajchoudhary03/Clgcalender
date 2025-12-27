// ClassInstance model - represents each individual class session
// Tracks attendance status for each scheduled class

const mongoose = require("mongoose");

const classInstanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  date: { type: Date, required: true }, // Full date of the class
  startTime: { type: String, required: true }, // Format: "HH:MM" e.g., "09:00"
  endTime: { type: String, required: true }, // Format: "HH:MM" e.g., "10:00"
  day: {
    type: String,
    required: true,
    enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  status: {
    type: String,
    enum: ["pending", "attended", "missed", "cancelled"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Index for efficient queries
classInstanceSchema.index({ user: 1, date: 1 });
classInstanceSchema.index({ subject: 1, date: 1 });
classInstanceSchema.index(
  { user: 1, subject: 1, date: 1, startTime: 1 },
  { unique: true },
);

// Update timestamp on save
classInstanceSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("ClassInstance", classInstanceSchema);
