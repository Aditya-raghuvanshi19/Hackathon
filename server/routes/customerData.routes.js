import express from 'express';
import { customerDataService } from '../services/customerDataService.js';
import CustomerData from '../models/customerData.model.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateUser);

// Process and merge customer data from multiple files
router.post('/process-customer-data', async (req, res) => {
  try {
    const { fileIds } = req.body;
    
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'File IDs array is required' });
    }

    const result = await customerDataService.processMultipleFiles(fileIds, req.user.id);
    
    res.json({
      success: true,
      message: 'Customer data processed successfully',
      result
    });
  } catch (error) {
    console.error('Process customer data error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all processed customer data with pagination
router.get('/customers', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      segment, 
      minSpent, 
      maxSpent, 
      category,
      paymentMethod,
      search 
    } = req.query;

    const query = { 'processingInfo.processedBy': req.user.id };
    
    // Add filters
    if (segment) query['analytics.customerSegment'] = segment;
    if (minSpent) query['analytics.totalSpent'] = { $gte: parseFloat(minSpent) };
    if (maxSpent) {
      if (query['analytics.totalSpent']) {
        query['analytics.totalSpent']['$lte'] = parseFloat(maxSpent);
      } else {
        query['analytics.totalSpent'] = { $lte: parseFloat(maxSpent) };
      }
    }
    if (category) query['analytics.favoriteCategory'] = category;
    if (paymentMethod) query['analytics.preferredPaymentMethod'] = paymentMethod;
    
    // Search functionality
    if (search) {
      query['$or'] = [
        { customerId: { $regex: search, $options: 'i' } },
        { 'customerInfo.name': { $regex: search, $options: 'i' } },
        { 'customerInfo.email': { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await CustomerData.find(query)
      .select('-transactions') // Exclude transactions for list view
      .sort({ 'analytics.totalSpent': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await CustomerData.countDocuments(query);

    res.json({
      customers,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific customer details with full transaction history
router.get('/customers/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const customer = await CustomerData.findOne({
      customerId,
      'processingInfo.processedBy': req.user.id
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get analytics insights
    const analytics = await customerDataService.getCustomerAnalytics(customerId);

    res.json({
      customer,
      analytics
    });
  } catch (error) {
    console.error('Get customer details error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get customer analytics dashboard data
router.get('/analytics/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;

    // Aggregation pipeline for dashboard metrics
    const dashboardData = await CustomerData.aggregate([
      { $match: { 'processingInfo.processedBy': userId } },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          totalRevenue: { $sum: '$analytics.totalSpent' },
          totalTransactions: { $sum: '$analytics.totalTransactions' },
          avgOrderValue: { $avg: '$analytics.averageOrderValue' },
          avgLifetimeValue: { $avg: '$analytics.lifetimeValue' }
        }
      }
    ]);

    // Customer segmentation distribution
    const segmentDistribution = await CustomerData.aggregate([
      { $match: { 'processingInfo.processedBy': userId } },
      {
        $group: {
          _id: '$analytics.customerSegment',
          count: { $sum: 1 },
          revenue: { $sum: '$analytics.totalSpent' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Top categories
    const categoryDistribution = await CustomerData.aggregate([
      { $match: { 'processingInfo.processedBy': userId } },
      {
        $group: {
          _id: '$analytics.favoriteCategory',
          customerCount: { $sum: 1 },
          revenue: { $sum: '$analytics.totalSpent' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    // Payment method distribution
    const paymentMethodDistribution = await CustomerData.aggregate([
      { $match: { 'processingInfo.processedBy': userId } },
      {
        $group: {
          _id: '$analytics.preferredPaymentMethod',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Monthly revenue trend (last 12 months)
    const monthlyTrends = await CustomerData.aggregate([
      { $match: { 'processingInfo.processedBy': userId } },
      { $unwind: '$transactions' },
      {
        $group: {
          _id: {
            year: { $year: '$transactions.date' },
            month: { $month: '$transactions.date' }
          },
          revenue: { $sum: '$transactions.totalAmount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // Top spending customers
    const topCustomers = await CustomerData.find({
      'processingInfo.processedBy': userId
    })
      .select('customerId customerInfo.name analytics.totalSpent analytics.totalTransactions')
      .sort({ 'analytics.totalSpent': -1 })
      .limit(10);

    const metrics = dashboardData[0] || {
      totalCustomers: 0,
      totalRevenue: 0,
      totalTransactions: 0,
      avgOrderValue: 0,
      avgLifetimeValue: 0
    };

    res.json({
      overview: metrics,
      segmentDistribution,
      categoryDistribution,
      paymentMethodDistribution,
      monthlyTrends,
      topCustomers
    });
  } catch (error) {
    console.error('Get analytics dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get customer insights and recommendations
router.get('/customers/:customerId/insights', async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const insights = await customerDataService.getCustomerAnalytics(customerId);
    
    if (!insights) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(insights);
  } catch (error) {
    console.error('Get customer insights error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search customers with advanced filters
router.post('/customers/search', async (req, res) => {
  try {
    const {
      filters = {},
      sortBy = 'analytics.totalSpent',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.body;

    const query = { 'processingInfo.processedBy': req.user.id };

    // Apply advanced filters
    if (filters.segments && filters.segments.length > 0) {
      query['analytics.customerSegment'] = { $in: filters.segments };
    }

    if (filters.spentRange) {
      if (filters.spentRange.min !== undefined) {
        query['analytics.totalSpent'] = { $gte: filters.spentRange.min };
      }
      if (filters.spentRange.max !== undefined) {
        if (query['analytics.totalSpent']) {
          query['analytics.totalSpent']['$lte'] = filters.spentRange.max;
        } else {
          query['analytics.totalSpent'] = { $lte: filters.spentRange.max };
        }
      }
    }

    if (filters.categories && filters.categories.length > 0) {
      query['analytics.favoriteCategory'] = { $in: filters.categories };
    }

    if (filters.paymentMethods && filters.paymentMethods.length > 0) {
      query['analytics.preferredPaymentMethod'] = { $in: filters.paymentMethods };
    }

    if (filters.dateRange) {
      const dateQuery = {};
      if (filters.dateRange.start) {
        dateQuery['$gte'] = new Date(filters.dateRange.start);
      }
      if (filters.dateRange.end) {
        dateQuery['$lte'] = new Date(filters.dateRange.end);
      }
      if (Object.keys(dateQuery).length > 0) {
        query['analytics.lastPurchaseDate'] = dateQuery;
      }
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const customers = await CustomerData.find(query)
      .select('-transactions')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CustomerData.countDocuments(query);

    res.json({
      customers,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Search customers error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export customer data
router.get('/export', async (req, res) => {
  try {
    const { format = 'csv', segment, category } = req.query;
    const query = { 'processingInfo.processedBy': req.user.id };

    if (segment) query['analytics.customerSegment'] = segment;
    if (category) query['analytics.favoriteCategory'] = category;

    const customers = await CustomerData.find(query).lean();

    // Transform data for export
    const exportData = customers.map(customer => ({
      customerId: customer.customerId,
      name: customer.customerInfo.name || '',
      email: customer.customerInfo.email || '',
      phone: customer.customerInfo.phone || '',
      city: customer.customerInfo.address?.city || '',
      totalSpent: customer.analytics.totalSpent || 0,
      totalTransactions: customer.analytics.totalTransactions || 0,
      averageOrderValue: customer.analytics.averageOrderValue || 0,
      customerSegment: customer.analytics.customerSegment || '',
      favoriteCategory: customer.analytics.favoriteCategory || '',
      preferredPaymentMethod: customer.analytics.preferredPaymentMethod || '',
      lastPurchaseDate: customer.analytics.lastPurchaseDate || ''
    }));

    let content, filename, contentType;

    switch (format) {
      case 'csv':
        content = this.arrayToCSV(exportData);
        filename = `customers_${Date.now()}.csv`;
        contentType = 'text/csv';
        break;
      case 'json':
        content = JSON.stringify(exportData, null, 2);
        filename = `customers_${Date.now()}.json`;
        contentType = 'application/json';
        break;
      default:
        return res.status(400).json({ error: 'Unsupported format' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  } catch (error) {
    console.error('Export customers error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to convert array to CSV
router.arrayToCSV = function(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
};

export default router;