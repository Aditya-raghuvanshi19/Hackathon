import mongoose from 'mongoose';

const dataFileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['csv', 'xlsx', 'json', 'pdf', 'docx', 'txt'],
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  extractedData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  validationErrors: [{
    field: String,
    message: String,
    rowIndex: Number
  }],
  metadata: {
    totalRows: { type: Number, default: 0 },
    validRows: { type: Number, default: 0 },
    invalidRows: { type: Number, default: 0 },
    columns: [String],
    schema: mongoose.Schema.Types.Mixed
  },
  transformationRules: [{
    field: String,
    rule: String,
    parameters: mongoose.Schema.Types.Mixed
  }],
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

dataFileSchema.index({ uploadedBy: 1, uploadedAt: -1 });
dataFileSchema.index({ processingStatus: 1 });
dataFileSchema.index({ fileType: 1 });

export default mongoose.model('DataFile', dataFileSchema);