import express from 'express';
import { nlpService } from '../services/nlpService.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateUser);

// Chat endpoint - main interface for natural language queries
router.post('/query', async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string'
      });
    }

    // Parse the natural language query
    const parsedQuery = await nlpService.parseQuery(message, userId);
    
    // Handle the parsed query
    const response = await nlpService.handleQuery(parsedQuery);

    res.json({
      success: response.success,
      message: response.message,
      data: response.data,
      visualData: response.visualData,
      suggestions: response.suggestions,
      query: {
        original: message,
        intent: parsedQuery.intent,
        entities: parsedQuery.entities
      }
    });
  } catch (error) {
    console.error('Chat query error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process your query. Please try again.',
      message: "I'm having trouble understanding your request. Could you try rephrasing it?"
    });
  }
});

// Get contextual suggestions for the chat interface
router.get('/suggestions', async (req, res) => {
  try {
    const userId = req.user.id;
    const suggestions = await nlpService.generateSuggestions(userId);

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate suggestions'
    });
  }
});

// Get chat history (if you want to implement chat history storage)
router.get('/history', async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const userId = req.user.id;

    // This would require implementing a ChatHistory model
    // For now, return empty array
    res.json({
      success: true,
      data: {
        conversations: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          total: 0
        }
      }
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get chat history'
    });
  }
});

// Quick actions - predefined queries for common tasks
router.post('/quick-action', async (req, res) => {
  try {
    const { action } = req.body;
    const userId = req.user.id;

    const quickActions = {
      'analytics': 'Show me analytics dashboard',
      'top-customers': 'Show me top 10 customers',
      'sales-trends': 'Show me sales trends',
      'recommendations': 'Give me recommendations',
      'customer-segments': 'Show me customer segments',
      'revenue-overview': 'Show me revenue overview'
    };

    const query = quickActions[action];
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quick action',
        availableActions: Object.keys(quickActions)
      });
    }

    // Process the quick action as a regular query
    const parsedQuery = await nlpService.parseQuery(query, userId);
    const response = await nlpService.handleQuery(parsedQuery);

    res.json({
      success: response.success,
      message: response.message,
      data: response.data,
      visualData: response.visualData,
      action
    });
  } catch (error) {
    console.error('Quick action error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process quick action'
    });
  }
});

// Interactive query builder - helps users construct queries
router.post('/build-query', async (req, res) => {
  try {
    const { intent, parameters } = req.body;
    const userId = req.user.id;

    let query = '';

    switch (intent) {
      case 'customer-info':
        if (parameters.customerId) {
          query = `Show me customer ${parameters.customerId}`;
        }
        break;
      
      case 'top-customers':
        const limit = parameters.limit || 5;
        query = `Show me top ${limit} customers`;
        break;
      
      case 'segment-analysis':
        if (parameters.segment) {
          query = `Show me ${parameters.segment} customers`;
        }
        break;
      
      case 'category-analysis':
        if (parameters.category) {
          query = `Show me customers who buy ${parameters.category}`;
        }
        break;
      
      case 'spending-analysis':
        if (parameters.customerId) {
          query = `How much has ${parameters.customerId} spent`;
        }
        break;
      
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid intent or missing parameters'
        });
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Could not build query with provided parameters'
      });
    }

    // Process the built query
    const parsedQuery = await nlpService.parseQuery(query, userId);
    const response = await nlpService.handleQuery(parsedQuery);

    res.json({
      success: response.success,
      message: response.message,
      data: response.data,
      visualData: response.visualData,
      builtQuery: query,
      intent,
      parameters
    });
  } catch (error) {
    console.error('Build query error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to build and process query'
    });
  }
});

// Get available query templates
router.get('/templates', async (req, res) => {
  try {
    const templates = {
      customerInfo: {
        name: 'Customer Information',
        description: 'Get detailed information about a specific customer',
        examples: [
          'Show me customer CUST001',
          'Tell me about John Smith',
          'Find customer john@email.com'
        ],
        parameters: ['customerId', 'customerName', 'email']
      },
      
      topCustomers: {
        name: 'Top Customers',
        description: 'Get your highest spending customers',
        examples: [
          'Show me top 10 customers',
          'Best 5 customers',
          'Highest spending customers'
        ],
        parameters: ['limit']
      },
      
      analytics: {
        name: 'Business Analytics',
        description: 'Get overview of your business metrics',
        examples: [
          'Show me analytics',
          'Business overview',
          'Dashboard summary'
        ],
        parameters: []
      },
      
      salesTrends: {
        name: 'Sales Trends',
        description: 'Analyze sales performance over time',
        examples: [
          'Sales trends',
          'Monthly revenue',
          'How are sales doing'
        ],
        parameters: ['timeframe']
      },
      
      customerSegments: {
        name: 'Customer Segments',
        description: 'Analyze customers by segment',
        examples: [
          'Premium customers',
          'VIP segment analysis',
          'Show me loyal customers'
        ],
        parameters: ['segment']
      },
      
      categoryAnalysis: {
        name: 'Category Analysis',
        description: 'Analyze customers by product category',
        examples: [
          'Electronics customers',
          'Who buys clothing',
          'Books category analysis'
        ],
        parameters: ['category']
      }
    };

    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get query templates'
    });
  }
});

// Health check for chatbot service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'chatbot',
    timestamp: new Date().toISOString()
  });
});

export default router;