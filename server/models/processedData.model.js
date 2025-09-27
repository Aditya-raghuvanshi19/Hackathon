import mongoose from 'mongoose';

const processedDataSchema = new mongoose.Schema({
  dataFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DataFile',
    required: true
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  transformations: [{
    operation: String,
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now }
  }],
  validationStatus: {
    type: String,
    enum: ['valid', 'invalid', 'warning'],
    default: 'valid'
  },
  validationResults: [{
    rule: String,
    field: String,
    status: String,
    message: String
  }],
  metrics: {
    processingTime: Number,
    dataQualityScore: Number,
    completenessScore: Number,
    accuracyScore: Number
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

processedDataSchema.index({ dataFileId: 1 });
processedDataSchema.index({ processedBy: 1, createdAt: -1 });
processedDataSchema.index({ validationStatus: 1 });

export default mongoose.model('ProcessedData', processedDataSchema);