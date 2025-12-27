const mongoose = require('mongoose');

const classInstanceSchema = new mongoose.Schema({
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
  scheduleRule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScheduleRule',
    required: [true, 'Schedule rule reference is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
    // Stored as UTC midnight of the class date
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
  status: {
    type: String,
    enum: ['pending', 'attended', 'missed', 'cancelled'],
    default: 'pending',
    index: true
  },
  markedAt: {
    type: Date,
    default: null
    // When the status was changed from pending
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

// Compound indexes for efficient queries
classInstanceSchema.index({ user: 1, date: 1 });
classInstanceSchema.index({ user: 1, subject: 1, date: 1 });
classInstanceSchema.index({ user: 1, date: 1, status: 1 });

// Unique constraint: one class instance per user+subject+date+startTime
classInstanceSchema.index({
  user: 1,
  subject: 1,
  date: 1,
  startTime: 1
}, { unique: true });

// Update timestamp on save
classInstanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();

  // Set markedAt when status changes from pending
  if (this.isModified('status') && this.status !== 'pending' && !this.markedAt) {
    this.markedAt = Date.now();
  }

  next();
});

// Static method to get attendance summary for a subject
classInstanceSchema.statics.getAttendanceSummary = async function(userId, subjectId) {
  const result = await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        subject: mongoose.Types.ObjectId(subjectId),
        date: { $lte: new Date() } // Only past and today's classes
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const summary = {
    total: 0,
    attended: 0,
    missed: 0,
    cancelled: 0,
    pending: 0,
    percentage: 0
  };

  result.forEach(item => {
    summary[item._id] = item.count;
    summary.total += item.count;
  });

  // Calculate percentage: attended / (total - cancelled - pending)
  const conductedClasses = summary.total - summary.cancelled - summary.pending;
  if (conductedClasses > 0) {
    summary.percentage = Math.round((summary.attended / conductedClasses) * 100);
  }

  return summary;
};

// Static method to get all subjects attendance summary
classInstanceSchema.statics.getAllSubjectsAttendance = async function(userId) {
  const result = await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $lte: new Date() }
      }
    },
    {
      $group: {
        _id: {
          subject: '$subject',
          status: '$status'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.subject',
        stats: {
          $push: {
            status: '$_id.status',
            count: '$count'
          }
        }
      }
    },
    {
      $lookup: {
        from: 'subjects',
        localField: '_id',
        foreignField: '_id',
        as: 'subjectInfo'
      }
    },
    {
      $unwind: '$subjectInfo'
    }
  ]);

  return result.map(item => {
    const stats = {
      total: 0,
      attended: 0,
      missed: 0,
      cancelled: 0,
      pending: 0
    };

    item.stats.forEach(stat => {
      stats[stat.status] = stat.count;
      stats.total += stat.count;
    });

    const conductedClasses = stats.total - stats.cancelled - stats.pending;
    const percentage = conductedClasses > 0
      ? Math.round((stats.attended / conductedClasses) * 100)
      : 0;

    return {
      subject: item.subjectInfo,
      ...stats,
      percentage
    };
  });
};

module.exports = mongoose.model('ClassInstance', classInstanceSchema);
