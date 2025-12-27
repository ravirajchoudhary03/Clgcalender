// WeeklySchedule entries: user's timetable for each day/time

const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  day: { type: String, enum: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], required: true },
  time: { type: String, required: true }, // e.g. "09:00"
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true }
});

module.exports = mongoose.model('WeeklySchedule', scheduleSchema);
