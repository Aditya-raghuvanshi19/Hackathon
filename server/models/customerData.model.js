import mongoose from 'mongoose';

const customerDataSchema = new mongoose.Schema({
  // Source file information
  sourceFile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DataFile',
    required: true
  },
  
  // Customer Master Data
  customerId: {
    type: String,
    required: true,
    index: true
  },
  customerInfo: {
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
    },
    preferences: {
      categories: [String],
      brands: [String],
      paymentMethods: [String]
    }
  },

  // Transaction Data
  transactions: [{
    transactionId: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    year: Number,
    month: String,
    time: String,
    totalPurchases: Number,
    amount: Number,
    totalAmount: Number,
    
    // Product Information
    product: {
      category: String,
      brand: String,
      type: String,
      name: String,
      sku: String
    },
    
    // Transaction Details
    feedback: String,
    shippingMethod: String,
    paymentMethod: { type: String, index: true },
    orderStatus: String,
    ratings: Number,
    
    // UPI/Credit Card specific fields
    upiId: String,
    creditCardType: String,
    creditCardLast4: String,
    merchantCode: String,
    transactionType: String, // UPI, Credit Card, Debit Card
    
    // Geolocation if available
    location: {
      lat: Number,
      lng: Number,
      city: String,
      state: String
    }
  }],

  // Analytics & Insights
  analytics: {
    totalSpent: { type: Number, default: 0 },
    totalTransactions: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    favoriteCategory: String,
    favoriteBrand: String,
    preferredPaymentMethod: String,
    lastPurchaseDate: Date,
    customerSegment: String, // VIP, Regular, New, Inactive
    lifetimeValue: Number,
    
    // Behavioral patterns
    purchasePatterns: {
      dayOfWeek: [Number], // 0-6 for Sun-Sat
      timeOfDay: [Number], // 0-23 hours
      seasonality: {
        spring: Number,
        summer: Number,
        fall: Number,
        winter: Number
      }
    },
    
    // Quality metrics
    dataQuality: {
      completeness: Number,
      accuracy: Number,
      consistency: Number,
      timeliness: Number
    }
  },

  // Processing metadata
  processingInfo: {
    processedAt: { type: Date, default: Date.now },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    dataSourceTypes: [String], // ['json', 'csv', 'xlsx', 'xml', 'pdf']
    mergedSources: [{
      sourceType: String,
      fileName: String,
      recordCount: Number,
      processedAt: Date
    }],
    transformationsApplied: [String],
    validationsPassed: Boolean,
    qualityScore: Number
  },

  // Status and flags
  isActive: { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now },
  tags: [String]
}, {
  timestamps: true
});

// Indexes for better performance
customerDataSchema.index({ customerId: 1, 'processingInfo.processedAt': -1 });
customerDataSchema.index({ 'transactions.transactionId': 1 });
customerDataSchema.index({ 'transactions.date': -1 });
customerDataSchema.index({ 'transactions.paymentMethod': 1 });
customerDataSchema.index({ 'analytics.customerSegment': 1 });
customerDataSchema.index({ 'analytics.totalSpent': -1 });

// Pre-save middleware to calculate analytics
customerDataSchema.pre('save', function(next) {
  if (this.transactions && this.transactions.length > 0) {
    const transactions = this.transactions;
    
    // Calculate basic metrics
    this.analytics.totalTransactions = transactions.length;
    this.analytics.totalSpent = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    this.analytics.averageOrderValue = this.analytics.totalSpent / this.analytics.totalTransactions;
    
    // Find favorites
    const categories = {};
    const brands = {};
    const paymentMethods = {};
    
    transactions.forEach(t => {
      if (t.product.category) categories[t.product.category] = (categories[t.product.category] || 0) + 1;
      if (t.product.brand) brands[t.product.brand] = (brands[t.product.brand] || 0) + 1;
      if (t.paymentMethod) paymentMethods[t.paymentMethod] = (paymentMethods[t.paymentMethod] || 0) + 1;
    });
    
    this.analytics.favoriteCategory = Object.keys(categories).reduce((a, b) => categories[a] > categories[b] ? a : b, '');
    this.analytics.favoriteBrand = Object.keys(brands).reduce((a, b) => brands[a] > brands[b] ? a : b, '');
    this.analytics.preferredPaymentMethod = Object.keys(paymentMethods).reduce((a, b) => paymentMethods[a] > paymentMethods[b] ? a : b, '');
    
    // Last purchase date
    const sortedTransactions = transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.analytics.lastPurchaseDate = sortedTransactions[0].date;
    
    // Customer segmentation
    if (this.analytics.totalSpent > 10000) {
      this.analytics.customerSegment = 'VIP';
    } else if (this.analytics.totalSpent > 5000) {
      this.analytics.customerSegment = 'Premium';
    } else if (this.analytics.totalTransactions > 10) {
      this.analytics.customerSegment = 'Regular';
    } else {
      this.analytics.customerSegment = 'New';
    }
    
    // Calculate lifetime value (simplified)
    this.analytics.lifetimeValue = this.analytics.totalSpent * 1.2; // Assume 20% profit margin
  }
  
  next();
});

export default mongoose.model('CustomerData', customerDataSchema);