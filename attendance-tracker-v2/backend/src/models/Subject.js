const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true
  },
  color: {
    type: String,
    required: [true, 'Subject color is required'],
    default: '#3B82F6',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for user + name uniqueness
subjectSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
