const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  deadline: {
    type: Date,
  },
  subject: {
    type: String,
  },
  description: {
    type: String,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Avoid having default _id virtual mappings clash, we will expose id representation
TaskSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
TaskSchema.set('toJSON', { virtuals: true });
TaskSchema.set('toObject', { virtuals: true });

const StudyDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // One dashboard input/data profile per user
  },
  tasks: [TaskSchema],
  pomodoroSettings: {
    workDuration: {
      type: Number,
      default: 1500, // 25 minutes in seconds
    },
    breakDuration: {
      type: Number,
      default: 300, // 5 minutes in seconds
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StudyData', StudyDataSchema);
