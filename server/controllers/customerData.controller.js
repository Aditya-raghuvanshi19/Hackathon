import { customerDataService } from '../services/customerDataService.js';
import CustomerData from '../models/customerData.model.js';

export const customerDataController = {
  // Process multiple files and extract customer data
  async processFiles(req, res) {
    try {
      const { fileIds } = req.body;
      const userId = req.user.id;

      if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'File IDs array is required'
        });
      }

      const result = await customerDataService.processMultipleFiles(fileIds, userId);

      res.json({
        success: true,
        message: 'Customer data processed successfully',
        data: result
      });
    } catch (error) {
      console.error('Process files error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get customer analytics overview
  async getAnalyticsOverview(req, res) {
    try {
      const userId = req.user.id;

      const overview = await CustomerData.aggregate([
        { $match: { 'processingInfo.processedBy': userId } },
        {
          $group: {
            _id: null,
            totalCustomers: { $sum: 1 },
            totalRevenue: { $sum: '$analytics.totalSpent' },
            totalTransactions: { $sum: '$analytics.totalTransactions' },
            averageOrderValue: { $avg: '$analytics.averageOrderValue' }
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

      const categoryDistribution = await CustomerData.aggregate([
        { $match: { 'processingInfo.processedBy': userId } },
        {
          $group: {
            _id: '$analytics.favoriteCategory',
            count: { $sum: 1 },
            revenue: { $sum: '$analytics.totalSpent' }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
      ]);

      res.json({
        success: true,
        data: {
          overview: overview[0] || {
            totalCustomers: 0,
            totalRevenue: 0,
            totalTransactions: 0,
            averageOrderValue: 0
          },
          segmentDistribution,
          categoryDistribution
        }
      });
    } catch (error) {
      console.error('Get analytics overview error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get customer list with filters
  async getCustomers(req, res) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 20,
        search = '',
        segment,
        category,
        sortBy = 'analytics.totalSpent',
        sortOrder = 'desc'
      } = req.query;

      const query = { 'processingInfo.processedBy': userId };

      // Apply filters
      if (segment) {
        query['analytics.customerSegment'] = segment;
      }

      if (category) {
        query['analytics.favoriteCategory'] = category;
      }

      if (search) {
        query.$or = [
          { customerId: { $regex: search, $options: 'i' } },
          { 'customerInfo.name': { $regex: search, $options: 'i' } },
          { 'customerInfo.email': { $regex: search, $options: 'i' } }
        ];
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const customers = await CustomerData.find(query)
        .select('-transactions') // Exclude transactions for performance
        .sort(sortOptions)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await CustomerData.countDocuments(query);

      res.json({
        success: true,
        data: {
          customers,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalCustomers: total,
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get customers error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get specific customer details
  async getCustomerDetails(req, res) {
    try {
      const { customerId } = req.params;
      const userId = req.user.id;

      const customer = await CustomerData.findOne({
        customerId,
        'processingInfo.processedBy': userId
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }

      // Get customer insights
      const insights = await customerDataService.getCustomerAnalytics(customerId);

      res.json({
        success: true,
        data: {
          customer,
          insights
        }
      });
    } catch (error) {
      console.error('Get customer details error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get transaction history for a customer
  async getCustomerTransactions(req, res) {
    try {
      const { customerId } = req.params;
      const userId = req.user.id;
      const { page = 1, limit = 50 } = req.query;

      const customer = await CustomerData.findOne({
        customerId,
        'processingInfo.processedBy': userId
      }).select('transactions analytics.totalTransactions');

      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }

      // Paginate transactions
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      const paginatedTransactions = customer.transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(startIndex, endIndex);

      const totalTransactions = customer.transactions.length;

      res.json({
        success: true,
        data: {
          transactions: paginatedTransactions,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalTransactions / limit),
            totalTransactions,
            hasNextPage: endIndex < totalTransactions,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get customer transactions error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get customer insights and recommendations
  async getCustomerInsights(req, res) {
    try {
      const { customerId } = req.params;

      const insights = await customerDataService.getCustomerAnalytics(customerId);

      if (!insights) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }

      res.json({
        success: true,
        data: insights
      });
    } catch (error) {
      console.error('Get customer insights error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Search customers with advanced filters
  async searchCustomers(req, res) {
    try {
      const userId = req.user.id;
      const {
        filters = {},
        sortBy = 'analytics.totalSpent',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = req.body;

      const query = { 'processingInfo.processedBy': userId };

      // Apply filters
      if (filters.segments?.length > 0) {
        query['analytics.customerSegment'] = { $in: filters.segments };
      }

      if (filters.spentRange) {
        const spentQuery = {};
        if (filters.spentRange.min !== undefined) {
          spentQuery.$gte = filters.spentRange.min;
        }
        if (filters.spentRange.max !== undefined) {
          spentQuery.$lte = filters.spentRange.max;
        }
        if (Object.keys(spentQuery).length > 0) {
          query['analytics.totalSpent'] = spentQuery;
        }
      }

      if (filters.categories?.length > 0) {
        query['analytics.favoriteCategory'] = { $in: filters.categories };
      }

      if (filters.paymentMethods?.length > 0) {
        query['analytics.preferredPaymentMethod'] = { $in: filters.paymentMethods };
      }

      if (filters.dateRange) {
        const dateQuery = {};
        if (filters.dateRange.start) {
          dateQuery.$gte = new Date(filters.dateRange.start);
        }
        if (filters.dateRange.end) {
          dateQuery.$lte = new Date(filters.dateRange.end);
        }
        if (Object.keys(dateQuery).length > 0) {
          query['analytics.lastPurchaseDate'] = dateQuery;
        }
      }

      if (filters.search) {
        query.$or = [
          { customerId: { $regex: filters.search, $options: 'i' } },
          { 'customerInfo.name': { $regex: filters.search, $options: 'i' } },
          { 'customerInfo.email': { $regex: filters.search, $options: 'i' } }
        ];
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const customers = await CustomerData.find(query)
        .select('-transactions')
        .sort(sortOptions)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await CustomerData.countDocuments(query);

      res.json({
        success: true,
        data: {
          customers,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            total,
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Search customers error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Generate customer report
  async generateReport(req, res) {
    try {
      const userId = req.user.id;
      const { format = 'json', filters = {} } = req.body;

      const query = { 'processingInfo.processedBy': userId };

      // Apply filters
      if (filters.segment) {
        query['analytics.customerSegment'] = filters.segment;
      }

      if (filters.category) {
        query['analytics.favoriteCategory'] = filters.category;
      }

      if (filters.dateRange) {
        const dateQuery = {};
        if (filters.dateRange.start) {
          dateQuery.$gte = new Date(filters.dateRange.start);
        }
        if (filters.dateRange.end) {
          dateQuery.$lte = new Date(filters.dateRange.end);
        }
        if (Object.keys(dateQuery).length > 0) {
          query['processingInfo.processedAt'] = dateQuery;
        }
      }

      const customers = await CustomerData.find(query)
        .select('-transactions')
        .lean();

      // Generate summary statistics
      const summary = {
        totalCustomers: customers.length,
        totalRevenue: customers.reduce((sum, c) => sum + (c.analytics?.totalSpent || 0), 0),
        totalTransactions: customers.reduce((sum, c) => sum + (c.analytics?.totalTransactions || 0), 0),
        averageOrderValue: customers.length > 0 
          ? customers.reduce((sum, c) => sum + (c.analytics?.averageOrderValue || 0), 0) / customers.length 
          : 0,
        segmentDistribution: {},
        categoryDistribution: {}
      };

      // Calculate distributions
      customers.forEach(customer => {
        const segment = customer.analytics?.customerSegment || 'Unknown';
        const category = customer.analytics?.favoriteCategory || 'Unknown';
        
        summary.segmentDistribution[segment] = (summary.segmentDistribution[segment] || 0) + 1;
        summary.categoryDistribution[category] = (summary.categoryDistribution[category] || 0) + 1;
      });

      const reportData = {
        generatedAt: new Date().toISOString(),
        filters,
        summary,
        customers: format === 'detailed' ? customers : customers.map(c => ({
          customerId: c.customerId,
          name: c.customerInfo?.name || '',
          email: c.customerInfo?.email || '',
          totalSpent: c.analytics?.totalSpent || 0,
          customerSegment: c.analytics?.customerSegment || '',
          favoriteCategory: c.analytics?.favoriteCategory || ''
        }))
      };

      res.json({
        success: true,
        data: reportData
      });
    } catch (error) {
      console.error('Generate report error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};