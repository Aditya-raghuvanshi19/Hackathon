import mongoose from 'mongoose';

// CustomerData schema represents the unified, standardized customer view
// built by merging master data and transactional data extracted from various files.
const customerDataSchema = new mongoose.Schema({
  customerId: { type: String, index: true },
  // Optional flattened fields for convenience
  name: String,
  email: { type: String, index: true },
  phone: String,
  // Original nested structure used by services
  customerInfo: {
    id: String,
    name: String,
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String
    },
    demographics: {
      age: Number,
      gender: String,
      dateOfBirth: Date
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  demographics: {
    age: Number,
    gender: String,
    incomeBracket: String,
    maritalStatus: String
  },
  preferences: {
    categories: [String],
    brands: [String],
    channels: [String]
  },
  transactions: [
    {
      transactionId: String,
      date: Date,
      amount: Number,
      paymentMethod: String,
      orderStatus: String,
      product: {
        name: String,
        category: String,
        brand: String,
        type: String
      },
      sourceFile: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'DataFile' },
        name: String,
        type: String
      }
    }
  ],
  analytics: {
    totalSpent: { type: Number, default: 0 },
    totalTransactions: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    purchaseFrequency: { type: Number, default: 0 },
    favoriteCategory: String,
    customerSegment: String
  },
  dataQuality: {
    completeness: Number,
    accuracy: Number,
    issues: [
      {
        field: String,
        message: String,
        rowIndex: Number
      }
    ]
  },
  processingInfo: {
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    sourceFiles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DataFile' }],
    processedAt: { type: Date, default: Date.now }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

customerDataSchema.index({ 'analytics.totalSpent': -1 });
customerDataSchema.index({ 'analytics.customerSegment': 1 });

const CustomerData = mongoose.model('CustomerData', customerDataSchema);
export default CustomerData;
