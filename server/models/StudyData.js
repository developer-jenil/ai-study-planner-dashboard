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

// Add indexes on fields queried, filtered, or sorted by the application
StudyDataSchema.index({ "tasks.completed": 1 });
StudyDataSchema.index({ "tasks.priority": 1 });
StudyDataSchema.index({ "tasks.subject": 1 });
StudyDataSchema.index({ "tasks.deadline": 1 });
StudyDataSchema.index({ "tasks.createdAt": -1 });

module.exports = mongoose.model('StudyData', StudyDataSchema);
