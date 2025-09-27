import mongoose from 'mongoose';

const processingJobSchema = new mongoose.Schema({
  jobId: {
    type: String,
    required: true,
    unique: true
  },
  jobType: {
    type: String,
    enum: ['extract', 'transform', 'validate', 'merge', 'export'],
    required: true
  },
  status: {
    type: String,
    enum: ['queued', 'running', 'completed', 'failed', 'cancelled'],
    default: 'queued'
  },
  priority: {
    type: Number,
    default: 0
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inputFiles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DataFile'
  }],
  outputFiles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProcessedData'
  }],
  configuration: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  progress: {
    percentage: { type: Number, default: 0 },
    currentStep: String,
    totalSteps: Number,
    completedSteps: { type: Number, default: 0 }
  },
  logs: [{
    timestamp: { type: Date, default: Date.now },
    level: { type: String, enum: ['info', 'warn', 'error'], default: 'info' },
    message: String,
    details: mongoose.Schema.Types.Mixed
  }],
  errors: [{
    timestamp: { type: Date, default: Date.now },
    error: String,
    stack: String,
    context: mongoose.Schema.Types.Mixed
  }],
  startedAt: Date,
  completedAt: Date,
  estimatedDuration: Number,
  actualDuration: Number
}, {
  timestamps: true
});

processingJobSchema.index({ userId: 1, createdAt: -1 });
processingJobSchema.index({ status: 1, priority: -1 });
processingJobSchema.index({ jobType: 1 });

export default mongoose.model('ProcessingJob', processingJobSchema);