import CustomerData from '../models/customerData.model.js';

// Simple NLP patterns for customer data queries
const queryPatterns = {
  customerInfo: {
    patterns: [
      /show\s+(?:me\s+)?(?:customer|client)\s+(?:info|information|details)\s+(?:for\s+)?(.+)/i,
      /(?:who\s+is|tell\s+me\s+about)\s+customer\s+(.+)/i,
      /find\s+customer\s+(.+)/i,
      /customer\s+(.+)\s+details/i
    ],
    handler: 'getCustomerInfo'
  },
  
  spending: {
    patterns: [
      /how\s+much\s+(?:has\s+)?(.+)\s+spent/i,
      /(?:total\s+)?spending\s+(?:of\s+|for\s+)?(.+)/i,
      /(.+)\s+total\s+(?:amount|spending)/i,
      /show\s+(?:me\s+)?spending\s+(?:of\s+|for\s+)?(.+)/i
    ],
    handler: 'getSpendingInfo'
  },

  topCustomers: {
    patterns: [
      /top\s+(\d+)\s+customers?/i,
      /best\s+(\d+)\s+customers?/i,
      /highest\s+spending\s+customers?/i,
      /who\s+are\s+(?:my\s+)?top\s+customers?/i,
      /show\s+(?:me\s+)?(?:my\s+)?best\s+customers?/i
    ],
    handler: 'getTopCustomers'
  },

  segmentAnalysis: {
    patterns: [
      /(?:show\s+)?customers?\s+in\s+(.+)\s+segment/i,
      /(.+)\s+segment\s+customers?/i,
      /how\s+many\s+(.+)\s+customers?/i,
      /list\s+(.+)\s+customers?/i
    ],
    handler: 'getSegmentAnalysis'
  },

  categoryAnalysis: {
    patterns: [
      /customers?\s+who\s+buy\s+(.+)/i,
      /(.+)\s+category\s+customers?/i,
      /customers?\s+interested\s+in\s+(.+)/i,
      /who\s+buys?\s+(.+)/i
    ],
    handler: 'getCategoryAnalysis'
  },

  salesTrends: {
    patterns: [
      /sales\s+trend/i,
      /revenue\s+trend/i,
      /monthly\s+sales/i,
      /sales\s+over\s+time/i,
      /how\s+are\s+sales\s+doing/i
    ],
    handler: 'getSalesTrends'
  },

  analytics: {
    patterns: [
      /analytics/i,
      /dashboard/i,
      /overview/i,
      /summary/i,
      /show\s+(?:me\s+)?(?:my\s+)?stats/i,
      /business\s+metrics/i
    ],
    handler: 'getAnalytics'
  },

  recommendations: {
    patterns: [
      /recommend/i,
      /suggestions?/i,
      /what\s+should\s+I\s+do/i,
      /insights?/i,
      /advice/i
    ],
    handler: 'getRecommendations'
  }
};

// Extract entities from text
const extractEntities = (text) => {
  const entities = {
    numbers: [],
    categories: [],
    segments: [],
    customerIds: [],
    timeframes: []
  };

  // Extract numbers
  const numbers = text.match(/\b\d+\b/g);
  if (numbers) entities.numbers = numbers.map(n => parseInt(n));

  // Extract customer segments
  const segmentKeywords = ['premium', 'vip', 'gold', 'silver', 'bronze', 'loyal', 'new', 'regular'];
  segmentKeywords.forEach(segment => {
    if (text.toLowerCase().includes(segment)) {
      entities.segments.push(segment);
    }
  });

  // Extract time-related entities
  const timeKeywords = ['today', 'yesterday', 'week', 'month', 'year', 'quarterly', 'daily'];
  timeKeywords.forEach(time => {
    if (text.toLowerCase().includes(time)) {
      entities.timeframes.push(time);
    }
  });

  // Extract customer IDs (assuming format like CUST001, C123, etc.)
  const customerIdMatches = text.match(/\b[A-Z]*\d+\b/g);
  if (customerIdMatches) {
    entities.customerIds = customerIdMatches;
  }

  return entities;
};

export const nlpService = {
  // Parse natural language query and return structured intent
  async parseQuery(query, userId) {
    const normalizedQuery = query.toLowerCase().trim();
    const entities = extractEntities(query);

    // Find matching pattern
    for (const [intentType, config] of Object.entries(queryPatterns)) {
      for (const pattern of config.patterns) {
        const match = normalizedQuery.match(pattern);
        if (match) {
          return {
            intent: intentType,
            handler: config.handler,
            entities,
            matches: match.slice(1), // Captured groups
            originalQuery: query,
            userId
          };
        }
      }
    }

    // No specific pattern matched, try general search
    return {
      intent: 'general',
      handler: 'generalSearch',
      entities,
      matches: [normalizedQuery],
      originalQuery: query,
      userId
    };
  },

  // Handle different query types
  async handleQuery(parsedQuery) {
    const { handler, userId, entities, matches } = parsedQuery;

    try {
      switch (handler) {
        case 'getCustomerInfo':
          return await this.getCustomerInfo(matches[0], userId);
          
        case 'getSpendingInfo':
          return await this.getSpendingInfo(matches[0], userId);
          
        case 'getTopCustomers':
          const limit = entities.numbers[0] || 5;
          return await this.getTopCustomers(limit, userId);
          
        case 'getSegmentAnalysis':
          return await this.getSegmentAnalysis(matches[0], userId);
          
        case 'getCategoryAnalysis':
          return await this.getCategoryAnalysis(matches[0], userId);
          
        case 'getSalesTrends':
          return await this.getSalesTrends(userId);
          
        case 'getAnalytics':
          return await this.getAnalytics(userId);
          
        case 'getRecommendations':
          return await this.getRecommendations(userId);
          
        default:
          return await this.generalSearch(matches[0], userId);
      }
    } catch (error) {
      console.error('NLP Handler error:', error);
      return {
        success: false,
        message: 'Sorry, I encountered an error processing your request.',
        error: error.message
      };
    }
  },

  // Specific handler methods
  async getCustomerInfo(customerQuery, userId) {
    try {
      const customer = await CustomerData.findOne({
        $or: [
          { customerId: { $regex: customerQuery, $options: 'i' } },
          { 'customerInfo.name': { $regex: customerQuery, $options: 'i' } },
          { 'customerInfo.email': { $regex: customerQuery, $options: 'i' } }
        ],
        'processingInfo.processedBy': userId
      });

      if (!customer) {
        return {
          success: false,
          message: `I couldn't find a customer matching "${customerQuery}". Try using the customer ID or exact name.`,
          suggestions: ['Try "show customer CUST001"', 'Use exact customer name', 'Check customer list first']
        };
      }

      return {
        success: true,
        message: `Here's the information for ${customer.customerInfo.name || customer.customerId}:`,
        data: {
          customer: {
            id: customer.customerId,
            name: customer.customerInfo.name,
            email: customer.customerInfo.email,
            phone: customer.customerInfo.phone,
            address: customer.customerInfo.address,
            totalSpent: customer.analytics.totalSpent,
            totalTransactions: customer.analytics.totalTransactions,
            customerSegment: customer.analytics.customerSegment,
            favoriteCategory: customer.analytics.favoriteCategory,
            lastPurchaseDate: customer.analytics.lastPurchaseDate
          }
        },
        visualData: {
          type: 'customer-profile',
          customer: customer
        }
      };
    } catch (error) {
      throw new Error(`Failed to get customer info: ${error.message}`);
    }
  },

  async getSpendingInfo(customerQuery, userId) {
    try {
      const customer = await CustomerData.findOne({
        $or: [
          { customerId: { $regex: customerQuery, $options: 'i' } },
          { 'customerInfo.name': { $regex: customerQuery, $options: 'i' } }
        ],
        'processingInfo.processedBy': userId
      });

      if (!customer) {
        return {
          success: false,
          message: `I couldn't find spending information for "${customerQuery}".`
        };
      }

      // Calculate monthly spending trend
      const monthlySpending = {};
      customer.transactions.forEach(transaction => {
        const month = new Date(transaction.date).toISOString().substring(0, 7);
        monthlySpending[month] = (monthlySpending[month] || 0) + transaction.totalAmount;
      });

      return {
        success: true,
        message: `${customer.customerInfo.name || customer.customerId} has spent $${customer.analytics.totalSpent.toFixed(2)} total across ${customer.analytics.totalTransactions} transactions.`,
        data: {
          totalSpent: customer.analytics.totalSpent,
          totalTransactions: customer.analytics.totalTransactions,
          averageOrderValue: customer.analytics.averageOrderValue,
          monthlySpending
        },
        visualData: {
          type: 'spending-trend',
          data: monthlySpending
        }
      };
    } catch (error) {
      throw new Error(`Failed to get spending info: ${error.message}`);
    }
  },

  async getTopCustomers(limit, userId) {
    try {
      const topCustomers = await CustomerData.find({
        'processingInfo.processedBy': userId
      })
        .sort({ 'analytics.totalSpent': -1 })
        .limit(limit)
        .select('customerId customerInfo analytics.totalSpent analytics.totalTransactions analytics.customerSegment');

      if (topCustomers.length === 0) {
        return {
          success: false,
          message: "No customers found in your data."
        };
      }

      const totalSpent = topCustomers.reduce((sum, customer) => sum + customer.analytics.totalSpent, 0);

      return {
        success: true,
        message: `Here are your top ${topCustomers.length} customers by spending:`,
        data: {
          customers: topCustomers.map(customer => ({
            id: customer.customerId,
            name: customer.customerInfo.name,
            totalSpent: customer.analytics.totalSpent,
            totalTransactions: customer.analytics.totalTransactions,
            segment: customer.analytics.customerSegment
          })),
          totalSpent
        },
        visualData: {
          type: 'top-customers',
          customers: topCustomers
        }
      };
    } catch (error) {
      throw new Error(`Failed to get top customers: ${error.message}`);
    }
  },

  async getSegmentAnalysis(segment, userId) {
    try {
      const customers = await CustomerData.find({
        'analytics.customerSegment': { $regex: segment, $options: 'i' },
        'processingInfo.processedBy': userId
      });

      if (customers.length === 0) {
        return {
          success: false,
          message: `No customers found in the "${segment}" segment.`,
          suggestions: ['Try "premium customers"', 'Use "loyal customers"', 'Check "new customers"']
        };
      }

      const totalSpent = customers.reduce((sum, customer) => sum + customer.analytics.totalSpent, 0);
      const avgSpent = totalSpent / customers.length;

      return {
        success: true,
        message: `Found ${customers.length} customers in the "${segment}" segment with total spending of $${totalSpent.toFixed(2)}.`,
        data: {
          segmentName: segment,
          customerCount: customers.length,
          totalSpent,
          averageSpent: avgSpent,
          customers: customers.slice(0, 10).map(customer => ({
            id: customer.customerId,
            name: customer.customerInfo.name,
            totalSpent: customer.analytics.totalSpent
          }))
        },
        visualData: {
          type: 'segment-analysis',
          segment: segment,
          customers: customers
        }
      };
    } catch (error) {
      throw new Error(`Failed to get segment analysis: ${error.message}`);
    }
  },

  async getCategoryAnalysis(category, userId) {
    try {
      const customers = await CustomerData.find({
        'analytics.favoriteCategory': { $regex: category, $options: 'i' },
        'processingInfo.processedBy': userId
      });

      if (customers.length === 0) {
        return {
          success: false,
          message: `No customers found who prefer "${category}" category.`
        };
      }

      const totalSpent = customers.reduce((sum, customer) => sum + customer.analytics.totalSpent, 0);

      return {
        success: true,
        message: `Found ${customers.length} customers who prefer "${category}" category with total spending of $${totalSpent.toFixed(2)}.`,
        data: {
          category,
          customerCount: customers.length,
          totalSpent,
          topCustomers: customers
            .sort((a, b) => b.analytics.totalSpent - a.analytics.totalSpent)
            .slice(0, 5)
            .map(customer => ({
              id: customer.customerId,
              name: customer.customerInfo.name,
              totalSpent: customer.analytics.totalSpent
            }))
        },
        visualData: {
          type: 'category-analysis',
          category: category,
          customers: customers
        }
      };
    } catch (error) {
      throw new Error(`Failed to get category analysis: ${error.message}`);
    }
  },

  async getSalesTrends(userId) {
    try {
      const customers = await CustomerData.find({
        'processingInfo.processedBy': userId
      });

      if (customers.length === 0) {
        return {
          success: false,
          message: "No customer data found to analyze trends."
        };
      }

      // Calculate monthly trends
      const monthlyTrends = {};
      const categoryTrends = {};

      customers.forEach(customer => {
        customer.transactions.forEach(transaction => {
          const month = new Date(transaction.date).toISOString().substring(0, 7);
          const category = transaction.category || 'Other';

          monthlyTrends[month] = (monthlyTrends[month] || 0) + transaction.totalAmount;
          categoryTrends[category] = (categoryTrends[category] || 0) + transaction.totalAmount;
        });
      });

      const sortedMonths = Object.keys(monthlyTrends).sort();
      const recentTrends = sortedMonths.slice(-6); // Last 6 months

      return {
        success: true,
        message: `Sales trends analysis for the last ${recentTrends.length} months:`,
        data: {
          monthlyTrends: recentTrends.reduce((obj, month) => {
            obj[month] = monthlyTrends[month];
            return obj;
          }, {}),
          categoryTrends,
          totalRevenue: Object.values(monthlyTrends).reduce((sum, val) => sum + val, 0),
          totalCustomers: customers.length
        },
        visualData: {
          type: 'sales-trends',
          monthlyData: monthlyTrends,
          categoryData: categoryTrends
        }
      };
    } catch (error) {
      throw new Error(`Failed to get sales trends: ${error.message}`);
    }
  },

  async getAnalytics(userId) {
    try {
      const analytics = await CustomerData.aggregate([
        { $match: { 'processingInfo.processedBy': userId } },
        {
          $group: {
            _id: null,
            totalCustomers: { $sum: 1 },
            totalRevenue: { $sum: '$analytics.totalSpent' },
            totalTransactions: { $sum: '$analytics.totalTransactions' },
            avgOrderValue: { $avg: '$analytics.averageOrderValue' }
          }
        }
      ]);

      const segmentDistribution = await CustomerData.aggregate([
        { $match: { 'processingInfo.processedBy': userId } },
        {
          $group: {
            _id: '$analytics.customerSegment',
            count: { $sum: 1 },
            revenue: { $sum: '$analytics.totalSpent' }
          }
        }
      ]);

      if (!analytics[0]) {
        return {
          success: false,
          message: "No analytics data available."
        };
      }

      const data = analytics[0];

      return {
        success: true,
        message: `Analytics Overview: ${data.totalCustomers} customers, $${data.totalRevenue.toFixed(2)} revenue, ${data.totalTransactions} transactions.`,
        data: {
          overview: data,
          segmentDistribution
        },
        visualData: {
          type: 'analytics-dashboard',
          overview: data,
          segments: segmentDistribution
        }
      };
    } catch (error) {
      throw new Error(`Failed to get analytics: ${error.message}`);
    }
  },

  async getRecommendations(userId) {
    try {
      const customers = await CustomerData.find({
        'processingInfo.processedBy': userId
      })
        .sort({ 'analytics.totalSpent': -1 })
        .limit(100);

      if (customers.length === 0) {
        return {
          success: false,
          message: "No customer data available for recommendations."
        };
      }

      const recommendations = [];

      // Analyze customer segments
      const segments = {};
      customers.forEach(customer => {
        const segment = customer.analytics.customerSegment;
        if (!segments[segment]) {
          segments[segment] = { count: 0, totalSpent: 0 };
        }
        segments[segment].count++;
        segments[segment].totalSpent += customer.analytics.totalSpent;
      });

      // Generate recommendations
      const topSegment = Object.keys(segments).reduce((a, b) => 
        segments[a].totalSpent > segments[b].totalSpent ? a : b
      );

      recommendations.push(`Focus on your "${topSegment}" segment - they generate the most revenue.`);

      // Check for inactive customers
      const inactiveCustomers = customers.filter(customer => {
        const lastPurchase = new Date(customer.analytics.lastPurchaseDate);
        const daysSinceLastPurchase = (new Date() - lastPurchase) / (1000 * 60 * 60 * 24);
        return daysSinceLastPurchase > 90;
      });

      if (inactiveCustomers.length > 0) {
        recommendations.push(`You have ${inactiveCustomers.length} inactive customers - consider a re-engagement campaign.`);
      }

      // Analyze average order values
      const lowValueCustomers = customers.filter(customer => 
        customer.analytics.averageOrderValue < 50
      );

      if (lowValueCustomers.length > 0) {
        recommendations.push(`${lowValueCustomers.length} customers have low average order values - consider upselling strategies.`);
      }

      return {
        success: true,
        message: "Here are my recommendations based on your customer data:",
        data: {
          recommendations,
          insights: {
            topSegment,
            inactiveCustomers: inactiveCustomers.length,
            lowValueCustomers: lowValueCustomers.length,
            totalCustomers: customers.length
          }
        }
      };
    } catch (error) {
      throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
  },

  async generalSearch(query, userId) {
    try {
      // Perform a general search across customer data
      const customers = await CustomerData.find({
        'processingInfo.processedBy': userId,
        $or: [
          { customerId: { $regex: query, $options: 'i' } },
          { 'customerInfo.name': { $regex: query, $options: 'i' } },
          { 'customerInfo.email': { $regex: query, $options: 'i' } },
          { 'analytics.customerSegment': { $regex: query, $options: 'i' } },
          { 'analytics.favoriteCategory': { $regex: query, $options: 'i' } }
        ]
      }).limit(10);

      if (customers.length === 0) {
        return {
          success: false,
          message: `No results found for "${query}". Try asking about specific customers, analytics, or trends.`,
          suggestions: [
            'Try "show me analytics"',
            'Ask "top 5 customers"',
            'Use "sales trends"',
            'Search by customer ID or name'
          ]
        };
      }

      return {
        success: true,
        message: `Found ${customers.length} results for "${query}":`,
        data: {
          query,
          results: customers.map(customer => ({
            id: customer.customerId,
            name: customer.customerInfo.name,
            email: customer.customerInfo.email,
            totalSpent: customer.analytics.totalSpent,
            segment: customer.analytics.customerSegment
          }))
        },
        visualData: {
          type: 'search-results',
          query,
          customers
        }
      };
    } catch (error) {
      throw new Error(`General search failed: ${error.message}`);
    }
  },

  // Generate contextual suggestions based on current data
  async generateSuggestions(userId) {
    try {
      const customerCount = await CustomerData.countDocuments({
        'processingInfo.processedBy': userId
      });

      if (customerCount === 0) {
        return [
          'Upload customer data to get started',
          'Process your first customer file',
          'Import transaction data'
        ];
      }

      const suggestions = [
        'Show me analytics dashboard',
        'Top 10 customers by spending',
        'Sales trends this year',
        'Premium customers analysis',
        'Customer recommendations',
        'Monthly revenue trends',
        'Category performance analysis'
      ];

      // Add customer-specific suggestions if there are many customers
      if (customerCount > 50) {
        suggestions.push(
          'Inactive customer analysis',
          'Customer segmentation insights',
          'High-value customer list'
        );
      }

      return suggestions.slice(0, 6); // Return top 6 suggestions
    } catch (error) {
      console.error('Generate suggestions error:', error);
      return ['Show me analytics', 'Top customers', 'Sales trends'];
    }
  }
};