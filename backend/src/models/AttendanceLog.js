// AttendanceLog: logs each attendance event for a subject (helps audit/update)

const mongoose = require('mongoose');

const attendanceLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  status: { type: String, enum: ['attended', 'missed'], required: true }
});

attendanceLogSchema.index({ user: 1, subject: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceLog', attendanceLogSchema);
