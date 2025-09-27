import CustomerData from '../models/customerData.model.js';

// Simple ML-like analytics for customer data
export const mlAnalyticsService = {
  // Predict customer lifetime value using simple regression
  async predictLifetimeValue(customerId) {
    try {
      const customer = await CustomerData.findOne({ customerId });
      if (!customer) return null;

      const { analytics, transactions } = customer;
      
      // Simple LTV calculation: avg_order_value * purchase_frequency * expected_lifespan
      const avgOrderValue = analytics.averageOrderValue || 0;
      const totalTransactions = analytics.totalTransactions || 0;
      const daysSinceFirst = customer.analytics.daysSinceFirstPurchase || 1;
      
      // Calculate purchase frequency (transactions per month)
      const purchaseFrequency = (totalTransactions / daysSinceFirst) * 30;
      
      // Predict based on customer segment
      const segmentMultipliers = {
        'Premium': 3.5,
        'VIP': 4.0,
        'Loyal': 2.5,
        'Regular': 1.8,
        'New': 1.2
      };
      
      const multiplier = segmentMultipliers[analytics.customerSegment] || 1.5;
      const predictedLTV = avgOrderValue * purchaseFrequency * multiplier * 24; // 24 month lifespan
      
      return {
        predictedLifetimeValue: Math.round(predictedLTV * 100) / 100,
        confidence: this.calculateConfidence(totalTransactions, daysSinceFirst),
        factors: {
          avgOrderValue,
          purchaseFrequency: Math.round(purchaseFrequency * 100) / 100,
          segmentMultiplier: multiplier,
          expectedLifespan: 24
        }
      };
    } catch (error) {
      console.error('LTV prediction error:', error);
      return null;
    }
  },

  // Calculate confidence score based on data availability
  calculateConfidence(transactions, daysSinceFirst) {
    let confidence = 0;
    
    // More transactions = higher confidence
    if (transactions >= 10) confidence += 40;
    else if (transactions >= 5) confidence += 25;
    else if (transactions >= 2) confidence += 15;
    else confidence += 5;
    
    // More history = higher confidence
    if (daysSinceFirst >= 365) confidence += 40;
    else if (daysSinceFirst >= 180) confidence += 30;
    else if (daysSinceFirst >= 90) confidence += 20;
    else confidence += 10;
    
    // Additional factors
    confidence += 20; // Base confidence
    
    return Math.min(confidence, 100);
  },

  // Predict next purchase date
  async predictNextPurchase(customerId) {
    try {
      const customer = await CustomerData.findOne({ customerId });
      if (!customer) return null;

      const transactions = customer.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      if (transactions.length < 2) {
        return {
          predictedDate: null,
          confidence: 0,
          message: 'Insufficient transaction history'
        };
      }

      // Calculate average days between purchases
      const intervals = [];
      for (let i = 1; i < transactions.length; i++) {
        const daysDiff = (new Date(transactions[i].date) - new Date(transactions[i-1].date)) / (1000 * 60 * 60 * 24);
        intervals.push(daysDiff);
      }

      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      const lastPurchaseDate = new Date(transactions[transactions.length - 1].date);
      const predictedDate = new Date(lastPurchaseDate.getTime() + (avgInterval * 24 * 60 * 60 * 1000));

      // Adjust based on customer segment
      const segmentAdjustment = {
        'Premium': 0.8,  // More frequent purchases
        'VIP': 0.7,
        'Loyal': 0.9,
        'Regular': 1.0,
        'New': 1.5      // Less frequent purchases
      };

      const adjustment = segmentAdjustment[customer.analytics.customerSegment] || 1.0;
      const adjustedDate = new Date(lastPurchaseDate.getTime() + (avgInterval * adjustment * 24 * 60 * 60 * 1000));

      return {
        predictedDate: adjustedDate,
        confidence: this.calculatePurchasePredictionConfidence(intervals),
        averageInterval: Math.round(avgInterval),
        lastPurchaseDate,
        segmentAdjustment: adjustment
      };
    } catch (error) {
      console.error('Next purchase prediction error:', error);
      return null;
    }
  },

  calculatePurchasePredictionConfidence(intervals) {
    if (intervals.length < 2) return 20;
    
    // Calculate variance in intervals
    const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower variance = higher confidence
    const coefficientOfVariation = standardDeviation / mean;
    let confidence = 100 - (coefficientOfVariation * 50);
    
    // More data points = higher confidence
    confidence += Math.min(intervals.length * 5, 30);
    
    return Math.max(20, Math.min(confidence, 95));
  },

  // Customer churn risk analysis
  async analyzeChurnRisk(userId) {
    try {
      const customers = await CustomerData.find({ 'processingInfo.processedBy': userId });
      const churnAnalysis = [];

      for (const customer of customers) {
        const risk = await this.calculateChurnRisk(customer);
        churnAnalysis.push({
          customerId: customer.customerId,
          name: customer.customerInfo?.name || 'Unknown',
          churnRisk: risk.riskLevel,
          churnScore: risk.score,
          factors: risk.factors,
          recommendations: risk.recommendations
        });
      }

      // Sort by churn risk (highest first)
      churnAnalysis.sort((a, b) => b.churnScore - a.churnScore);

      return {
        totalCustomers: customers.length,
        highRisk: churnAnalysis.filter(c => c.churnRisk === 'High').length,
        mediumRisk: churnAnalysis.filter(c => c.churnRisk === 'Medium').length,
        lowRisk: churnAnalysis.filter(c => c.churnRisk === 'Low').length,
        customers: churnAnalysis
      };
    } catch (error) {
      console.error('Churn analysis error:', error);
      return null;
    }
  },

  async calculateChurnRisk(customer) {
    let score = 0;
    const factors = [];
    const recommendations = [];

    // Days since last purchase
    const daysSinceLastPurchase = (new Date() - new Date(customer.analytics.lastPurchaseDate)) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastPurchase > 180) {
      score += 40;
      factors.push('No purchases in 6+ months');
      recommendations.push('Send re-engagement campaign');
    } else if (daysSinceLastPurchase > 90) {
      score += 25;
      factors.push('No recent purchases (3+ months)');
      recommendations.push('Send targeted offer');
    } else if (daysSinceLastPurchase > 30) {
      score += 10;
      factors.push('Decreased purchase frequency');
    }

    // Transaction frequency decline
    const transactions = customer.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentTransactions = transactions.filter(t => {
      const daysDiff = (new Date() - new Date(t.date)) / (1000 * 60 * 60 * 24);
      return daysDiff <= 90;
    });

    if (recentTransactions.length === 0 && transactions.length > 0) {
      score += 30;
      factors.push('No recent activity');
      recommendations.push('Send personalized offer');
    }

    // Low engagement (few transactions)
    if (customer.analytics.totalTransactions <= 2) {
      score += 20;
      factors.push('Low engagement (few purchases)');
      recommendations.push('Improve onboarding experience');
    }

    // Low average order value compared to segment
    const segmentAvgOrderValues = {
      'Premium': 200,
      'VIP': 300,
      'Loyal': 100,
      'Regular': 75,
      'New': 50
    };

    const expectedAOV = segmentAvgOrderValues[customer.analytics.customerSegment] || 75;
    if (customer.analytics.averageOrderValue < expectedAOV * 0.6) {
      score += 15;
      factors.push('Below-average order value');
      recommendations.push('Suggest complementary products');
    }

    // Determine risk level
    let riskLevel;
    if (score >= 60) riskLevel = 'High';
    else if (score >= 30) riskLevel = 'Medium';
    else riskLevel = 'Low';

    return {
      score: Math.min(score, 100),
      riskLevel,
      factors,
      recommendations
    };
  },

  // Product recommendation engine
  async generateProductRecommendations(customerId, limit = 5) {
    try {
      const customer = await CustomerData.findOne({ customerId });
      if (!customer) return null;

      const userId = customer.processingInfo.processedBy;
      const allCustomers = await CustomerData.find({ 'processingInfo.processedBy': userId });

      // Find similar customers based on favorite category and spending
      const similarCustomers = allCustomers.filter(c => 
        c.customerId !== customerId &&
        c.analytics.favoriteCategory === customer.analytics.favoriteCategory &&
        Math.abs(c.analytics.totalSpent - customer.analytics.totalSpent) <= customer.analytics.totalSpent * 0.5
      );

      // Get product categories from similar customers' transactions
      const categoryFrequency = {};
      const productFrequency = {};

      // Analyze customer's own purchase history
      customer.transactions.forEach(transaction => {
        const category = transaction.category || 'Other';
        const product = transaction.productName || transaction.description || 'Unknown Product';
        
        categoryFrequency[category] = (categoryFrequency[category] || 0) + 1;
        productFrequency[product] = (productFrequency[product] || 0) + 1;
      });

      // Analyze similar customers' purchases
      similarCustomers.forEach(similarCustomer => {
        similarCustomer.transactions.forEach(transaction => {
          const category = transaction.category || 'Other';
          const product = transaction.productName || transaction.description || 'Unknown Product';
          
          // Don't recommend products the customer already bought
          if (!productFrequency[product]) {
            categoryFrequency[category] = (categoryFrequency[category] || 0) + 0.5;
            productFrequency[product] = (productFrequency[product] || 0) + 0.5;
          }
        });
      });

      // Sort recommendations by frequency and relevance
      const recommendations = Object.keys(productFrequency)
        .filter(product => !customer.transactions.some(t => 
          (t.productName === product) || (t.description === product)
        ))
        .sort((a, b) => productFrequency[b] - productFrequency[a])
        .slice(0, limit)
        .map((product, index) => ({
          rank: index + 1,
          product,
          score: Math.round(productFrequency[product] * 100) / 100,
          reason: this.getRecommendationReason(product, customer, similarCustomers.length)
        }));

      return {
        customerId,
        customerSegment: customer.analytics.customerSegment,
        favoriteCategory: customer.analytics.favoriteCategory,
        similarCustomersFound: similarCustomers.length,
        recommendations
      };
    } catch (error) {
      console.error('Product recommendation error:', error);
      return null;
    }
  },

  getRecommendationReason(product, customer, similarCustomersCount) {
    const reasons = [
      `Popular among ${similarCustomersCount} similar customers`,
      `Complements your ${customer.analytics.favoriteCategory} purchases`,
      `Trending in your customer segment`,
      `Frequently bought together with your past purchases`
    ];
    
    return reasons[Math.floor(Math.random() * reasons.length)];
  },

  // Seasonal trend analysis
  async analyzeSeasonalTrends(userId) {
    try {
      const customers = await CustomerData.find({ 'processingInfo.processedBy': userId });
      
      const monthlyData = {};
      const quarterlyData = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
      const categorySeasonality = {};

      customers.forEach(customer => {
        customer.transactions.forEach(transaction => {
          const date = new Date(transaction.date);
          const month = date.getMonth() + 1;
          const quarter = Math.ceil(month / 3);
          const category = transaction.category || 'Other';
          
          // Monthly trends
          monthlyData[month] = (monthlyData[month] || 0) + transaction.totalAmount;
          
          // Quarterly trends
          quarterlyData[`Q${quarter}`] += transaction.totalAmount;
          
          // Category seasonality
          if (!categorySeasonality[category]) {
            categorySeasonality[category] = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
          }
          categorySeasonality[category][`Q${quarter}`] += transaction.totalAmount;
        });
      });

      // Find peak months and quarters
      const peakMonth = Object.keys(monthlyData).reduce((a, b) => 
        monthlyData[a] > monthlyData[b] ? a : b
      );
      
      const peakQuarter = Object.keys(quarterlyData).reduce((a, b) => 
        quarterlyData[a] > quarterlyData[b] ? a : b
      );

      return {
        monthlyTrends: monthlyData,
        quarterlyTrends: quarterlyData,
        categorySeasonality,
        insights: {
          peakMonth: {
            month: parseInt(peakMonth),
            monthName: new Date(2024, peakMonth - 1).toLocaleString('default', { month: 'long' }),
            revenue: monthlyData[peakMonth]
          },
          peakQuarter: {
            quarter: peakQuarter,
            revenue: quarterlyData[peakQuarter]
          }
        }
      };
    } catch (error) {
      console.error('Seasonal analysis error:', error);
      return null;
    }
  }
};