const mongoose = require('mongoose');

const scheduleRuleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject reference is required'],
    index: true
  },
  daysOfWeek: {
    type: [String],
    required: [true, 'Days of week are required'],
    validate: {
      validator: function(days) {
        const validDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days.length > 0 && days.every(day => validDays.includes(day));
      },
      message: 'Invalid days of week. Must be array of: Mon, Tue, Wed, Thu, Fri, Sat, Sun'
    }
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
scheduleRuleSchema.index({ user: 1, subject: 1 });

// Update timestamp on save
scheduleRuleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Validate that endTime is after startTime
scheduleRuleSchema.pre('save', function(next) {
  const [startHour, startMin] = this.startTime.split(':').map(Number);
  const [endHour, endMin] = this.endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (endMinutes <= startMinutes) {
    return next(new Error('End time must be after start time'));
  }

  next();
});

module.exports = mongoose.model('ScheduleRule', scheduleRuleSchema);
