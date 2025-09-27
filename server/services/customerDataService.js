import CustomerData from '../models/customerData.model.js';
import DataFile from '../models/dataFile.model.js';
import ProcessingJob from '../models/processingJob.model.js';
import { fileProcessingService } from './fileProcessing.service.js';
import { validationService } from './validation.service.js';

class CustomerDataService {
  constructor() {
    this.transactionFieldMap = {
      'Transaction_ID': 'transactionId',
      'TransactionID': 'transactionId',
      'transaction_id': 'transactionId',
      'Customer_ID': 'customerId',
      'CustomerID': 'customerId',
      'customer_id': 'customerId',
      'Date': 'date',
      'Transaction_Date': 'date',
      'Year': 'year',
      'Month': 'month',
      'Time': 'time',
      'Total_Purchases': 'totalPurchases',
      'Amount': 'amount',
      'Total_Amount': 'totalAmount',
      'Product_Category': 'product.category',
      'Product_Brand': 'product.brand',
      'Product_Type': 'product.type',
      'Product_Name': 'product.name',
      'Feedback': 'feedback',
      'Shipping_Method': 'shippingMethod',
      'Payment_Method': 'paymentMethod',
      'Order_Status': 'orderStatus',
      'Ratings': 'ratings',
      'UPI_ID': 'upiId',
      'Credit_Card_Type': 'creditCardType',
      'Merchant_Code': 'merchantCode'
    };
  }

  async processMultipleFiles(fileIds, userId) {
    try {
      const customerDataMap = new Map();
      const processedSources = [];

      for (const fileId of fileIds) {
        const file = await DataFile.findById(fileId);
        if (!file) continue;

        const extractedData = file.extractedData;
        if (!extractedData || !Array.isArray(extractedData)) continue;

        // Process based on file type and structure
        const processedData = await this.processFileData(extractedData, file);
        
        // Merge data by customer ID
        processedData.forEach(record => {
          const customerId = record.customerId;
          if (!customerId) return;

          if (!customerDataMap.has(customerId)) {
            customerDataMap.set(customerId, {
              customerId,
              customerInfo: record.customerInfo || {},
              transactions: [],
              processingInfo: {
                processedBy: userId,
                dataSourceTypes: [],
                mergedSources: [],
                transformationsApplied: [],
                validationsPassed: true,
                qualityScore: 0
              }
            });
          }

          const customerData = customerDataMap.get(customerId);
          
          // Add transaction data
          if (record.transaction) {
            customerData.transactions.push({
              ...record.transaction,
              transactionType: this.determineTransactionType(file.fileType, file.originalName)
            });
          }

          // Merge customer info
          if (record.customerInfo) {
            customerData.customerInfo = {
              ...customerData.customerInfo,
              ...record.customerInfo
            };
          }

          // Track source
          if (!customerData.processingInfo.dataSourceTypes.includes(file.fileType)) {
            customerData.processingInfo.dataSourceTypes.push(file.fileType);
            customerData.processingInfo.mergedSources.push({
              sourceType: file.fileType,
              fileName: file.originalName,
              recordCount: extractedData.length,
              processedAt: new Date()
            });
          }
        });

        processedSources.push({
          fileId: file._id,
          fileName: file.originalName,
          recordCount: extractedData.length
        });
      }

      // Save merged customer data
      const savedCustomers = [];
      for (const [customerId, customerData] of customerDataMap) {
        // Calculate quality score
        customerData.processingInfo.qualityScore = this.calculateDataQuality(customerData);
        
        const customer = new CustomerData(customerData);
        await customer.save();
        savedCustomers.push(customer);
      }

      return {
        processedCustomers: savedCustomers.length,
        totalTransactions: savedCustomers.reduce((sum, c) => sum + c.transactions.length, 0),
        sourceFiles: processedSources,
        dataQualityAverage: savedCustomers.reduce((sum, c) => sum + c.processingInfo.qualityScore, 0) / savedCustomers.length
      };

    } catch (error) {
      console.error('Customer data processing error:', error);
      throw error;
    }
  }

  async processFileData(data, file) {
    const processed = [];

    for (const row of data) {
      const record = {
        customerId: null,
        customerInfo: {},
        transaction: null
      };

      // Determine file type and process accordingly
      if (this.isTransactionData(row)) {
        // Transaction data (CSV, Excel, XML)
        record.transaction = this.normalizeTransactionData(row);
        record.customerId = record.transaction.customerId;
      } else if (this.isCustomerMasterData(row)) {
        // Customer master data (JSON)
        record.customerInfo = this.normalizeCustomerData(row);
        record.customerId = record.customerInfo.id || record.customerInfo.customerId;
      }

      if (record.customerId) {
        processed.push(record);
      }
    }

    return processed;
  }

  normalizeTransactionData(row) {
    const transaction = {
      product: {}
    };

    // Map fields using field mapping
    for (const [originalField, mappedField] of Object.entries(this.transactionFieldMap)) {
      const value = row[originalField] || row[originalField.toLowerCase()] || row[originalField.toUpperCase()];
      
      if (value !== undefined && value !== null && value !== '') {
        this.setNestedProperty(transaction, mappedField, this.normalizeValue(value, mappedField));
      }
    }

    // Handle date normalization
    if (transaction.date) {
      transaction.date = this.normalizeDate(transaction.date);
    }

    // Extract customer ID for grouping
    transaction.customerId = transaction.customerId || 
                            row.Customer_ID || 
                            row.CustomerID || 
                            row.customer_id;

    return transaction;
  }

  normalizeCustomerData(row) {
    const customer = {};

    // Handle nested JSON structure
    if (row.id) customer.id = row.id;
    if (row.customerId) customer.id = row.customerId;
    if (row.name) customer.name = row.name;
    if (row.email) customer.email = row.email;
    if (row.phone) customer.phone = row.phone;
    
    // Handle address
    if (row.address) {
      customer.address = {
        street: row.address.street,
        city: row.address.city,
        state: row.address.state,
        zip: row.address.zip,
        country: row.address.country || 'US'
      };
    }

    // Handle demographics
    if (row.age || row.gender || row.dateOfBirth) {
      customer.demographics = {
        age: row.age,
        gender: row.gender,
        dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : null
      };
    }

    return customer;
  }

  normalizeValue(value, fieldPath) {
    // Handle specific field types
    if (fieldPath.includes('date') || fieldPath === 'date') {
      return this.normalizeDate(value);
    }
    
    if (fieldPath.includes('amount') || fieldPath.includes('Amount')) {
      return parseFloat(value) || 0;
    }
    
    if (fieldPath === 'ratings' || fieldPath === 'totalPurchases') {
      return parseInt(value) || 0;
    }

    // Clean string values
    if (typeof value === 'string') {
      return value.trim();
    }

    return value;
  }

  normalizeDate(dateValue) {
    if (!dateValue) return null;

    // Handle different date formats
    const formats = [
      /^\d{1,2}\/\d{1,2}\/\d{4}$/, // MM/DD/YYYY or M/D/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{4}\/\d{2}\/\d{2}$/ // YYYY/MM/DD
    ];

    const dateStr = String(dateValue).trim();
    
    // Try parsing with built-in Date constructor first
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    // Handle specific format: "05-08-2023"
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const [month, day, year] = dateStr.split('-');
      return new Date(year, month - 1, day);
    }

    return null;
  }

  setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  isTransactionData(row) {
    // Check if the row contains transaction-like fields
    const transactionFields = ['Transaction_ID', 'transactionId', 'Amount', 'amount', 'Payment_Method', 'paymentMethod'];
    return transactionFields.some(field => 
      row[field] !== undefined || 
      row[field.toLowerCase()] !== undefined ||
      row[field.toUpperCase()] !== undefined
    );
  }

  isCustomerMasterData(row) {
    // Check if the row contains customer master data fields
    const customerFields = ['customerId', 'id', 'name', 'email', 'address'];
    return customerFields.some(field => row[field] !== undefined);
  }

  determineTransactionType(fileType, fileName) {
    const name = fileName.toLowerCase();
    
    if (name.includes('upi')) return 'UPI';
    if (name.includes('credit')) return 'Credit Card';
    if (name.includes('debit')) return 'Debit Card';
    if (name.includes('retail')) return 'Retail';
    
    return 'Unknown';
  }

  calculateDataQuality(customerData) {
    let score = 0;
    let maxScore = 0;

    // Customer info completeness (40 points)
    maxScore += 40;
    if (customerData.customerInfo.name) score += 10;
    if (customerData.customerInfo.email) score += 10;
    if (customerData.customerInfo.phone) score += 10;
    if (customerData.customerInfo.address && customerData.customerInfo.address.city) score += 10;

    // Transaction data quality (60 points)
    maxScore += 60;
    if (customerData.transactions.length > 0) {
      const validTransactions = customerData.transactions.filter(t => 
        t.transactionId && t.date && t.amount && t.paymentMethod
      );
      
      const completenessRatio = validTransactions.length / customerData.transactions.length;
      score += Math.round(completenessRatio * 60);
    }

    return Math.round((score / maxScore) * 100);
  }

  async getCustomerAnalytics(customerId) {
    const customer = await CustomerData.findOne({ customerId });
    if (!customer) return null;

    const analytics = customer.analytics;
    
    // Calculate additional insights
    const insights = {
      basicMetrics: {
        totalSpent: analytics.totalSpent,
        totalTransactions: analytics.totalTransactions,
        averageOrderValue: analytics.averageOrderValue,
        lifetimeValue: analytics.lifetimeValue
      },
      preferences: {
        favoriteCategory: analytics.favoriteCategory,
        favoriteBrand: analytics.favoriteBrand,
        preferredPaymentMethod: analytics.preferredPaymentMethod
      },
      behavior: {
        lastPurchase: analytics.lastPurchaseDate,
        customerSegment: analytics.customerSegment,
        purchaseFrequency: this.calculatePurchaseFrequency(customer.transactions)
      },
      recommendations: this.generateRecommendations(customer)
    };

    return insights;
  }

  calculatePurchaseFrequency(transactions) {
    if (transactions.length < 2) return 'Insufficient data';

    const dates = transactions
      .map(t => new Date(t.date))
      .sort((a, b) => a - b);
    
    const daysBetween = [];
    for (let i = 1; i < dates.length; i++) {
      const diff = (dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24);
      daysBetween.push(diff);
    }

    const avgDays = daysBetween.reduce((sum, days) => sum + days, 0) / daysBetween.length;
    
    if (avgDays <= 7) return 'Weekly';
    if (avgDays <= 30) return 'Monthly';
    if (avgDays <= 90) return 'Quarterly';
    return 'Infrequent';
  }

  generateRecommendations(customer) {
    const recommendations = [];
    const analytics = customer.analytics;

    // Segment-based recommendations
    if (analytics.customerSegment === 'VIP') {
      recommendations.push('Offer exclusive premium products');
      recommendations.push('Provide white-glove customer service');
    } else if (analytics.customerSegment === 'New') {
      recommendations.push('Send welcome series emails');
      recommendations.push('Offer first-purchase discounts');
    }

    // Category-based recommendations
    if (analytics.favoriteCategory) {
      recommendations.push(`Focus marketing on ${analytics.favoriteCategory} products`);
    }

    // Payment method optimization
    if (analytics.preferredPaymentMethod) {
      recommendations.push(`Optimize checkout for ${analytics.preferredPaymentMethod} users`);
    }

    return recommendations;
  }
}

export const customerDataService = new CustomerDataService();