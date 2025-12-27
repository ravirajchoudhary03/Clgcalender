// HabitLog: date-wise tracking of completion per habit

const mongoose = require('mongoose');

const habitLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  habit: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
  date: { type: String, required: true }, // ISO date string (YYYY-MM-DD) for easy aggregation
  completed: { type: Boolean, default: false }
});

habitLogSchema.index({ user: 1, habit: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('HabitLog', habitLogSchema);
