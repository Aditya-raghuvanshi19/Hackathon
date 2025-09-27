import express from 'express';
import { mlAnalyticsService } from '../services/mlAnalytics.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Predict customer lifetime value
router.get('/predict-ltv/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const prediction = await mlAnalyticsService.predictLifetimeValue(customerId);
    
    if (!prediction) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: {
        customerId,
        prediction
      }
    });
  } catch (error) {
    console.error('LTV prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to predict customer lifetime value'
    });
  }
});

// Predict next purchase date
router.get('/predict-next-purchase/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const prediction = await mlAnalyticsService.predictNextPurchase(customerId);
    
    if (!prediction) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: {
        customerId,
        prediction
      }
    });
  } catch (error) {
    console.error('Next purchase prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to predict next purchase'
    });
  }
});

// Analyze customer churn risk
router.get('/churn-analysis', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const analysis = await mlAnalyticsService.analyzeChurnRisk(userId);
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'No customer data found'
      });
    }

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Churn analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze churn risk'
    });
  }
});

// Get high-risk customers (churn risk > 60)
router.get('/high-risk-customers', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const analysis = await mlAnalyticsService.analyzeChurnRisk(userId);
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'No customer data found'
      });
    }

    const highRiskCustomers = analysis.customers.filter(c => c.churnRisk === 'High');

    res.json({
      success: true,
      data: {
        totalHighRisk: highRiskCustomers.length,
        customers: highRiskCustomers,
        summary: {
          totalCustomers: analysis.totalCustomers,
          percentageAtRisk: Math.round((highRiskCustomers.length / analysis.totalCustomers) * 100)
        }
      }
    });
  } catch (error) {
    console.error('High-risk customers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get high-risk customers'
    });
  }
});

// Generate product recommendations for a customer
router.get('/recommendations/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { limit = 5 } = req.query;
    
    const recommendations = await mlAnalyticsService.generateProductRecommendations(
      customerId, 
      parseInt(limit)
    );
    
    if (!recommendations) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found or insufficient data'
      });
    }

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Product recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate product recommendations'
    });
  }
});

// Analyze seasonal trends
router.get('/seasonal-trends', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const trends = await mlAnalyticsService.analyzeSeasonalTrends(userId);
    
    if (!trends) {
      return res.status(404).json({
        success: false,
        error: 'No transaction data found'
      });
    }

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Seasonal trends error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze seasonal trends'
    });
  }
});

// Comprehensive customer insights (combines multiple ML analyses)
router.get('/customer-insights/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // Run multiple analyses in parallel
    const [ltvPrediction, nextPurchase, recommendations] = await Promise.all([
      mlAnalyticsService.predictLifetimeValue(customerId),
      mlAnalyticsService.predictNextPurchase(customerId),
      mlAnalyticsService.generateProductRecommendations(customerId, 3)
    ]);

    if (!ltvPrediction && !nextPurchase && !recommendations) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: {
        customerId,
        lifetimeValue: ltvPrediction,
        nextPurchase: nextPurchase,
        productRecommendations: recommendations?.recommendations || [],
        insights: {
          hasInsufficientData: !ltvPrediction || !nextPurchase,
          recommendationCount: recommendations?.recommendations?.length || 0
        }
      }
    });
  } catch (error) {
    console.error('Customer insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate customer insights'
    });
  }
});

// ML Analytics dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Run multiple analyses
    const [churnAnalysis, seasonalTrends] = await Promise.all([
      mlAnalyticsService.analyzeChurnRisk(userId),
      mlAnalyticsService.analyzeSeasonalTrends(userId)
    ]);

    const dashboardData = {
      churnRisk: {
        totalCustomers: churnAnalysis?.totalCustomers || 0,
        highRisk: churnAnalysis?.highRisk || 0,
        mediumRisk: churnAnalysis?.mediumRisk || 0,
        lowRisk: churnAnalysis?.lowRisk || 0,
        riskPercentage: churnAnalysis ? 
          Math.round((churnAnalysis.highRisk / churnAnalysis.totalCustomers) * 100) : 0
      },
      seasonalInsights: seasonalTrends?.insights || null,
      recommendations: {
        urgentActions: [],
        opportunities: [],
        insights: []
      }
    };

    // Generate urgent actions based on high churn risk
    if (churnAnalysis?.highRisk > 0) {
      dashboardData.recommendations.urgentActions.push({
        type: 'churn_prevention',
        title: 'High Churn Risk Alert',
        description: `${churnAnalysis.highRisk} customers are at high risk of churning`,
        action: 'Review high-risk customers and create retention campaigns'
      });
    }

    // Generate opportunities based on seasonal trends
    if (seasonalTrends?.insights?.peakQuarter) {
      dashboardData.recommendations.opportunities.push({
        type: 'seasonal_opportunity',
        title: 'Seasonal Peak Preparation',
        description: `${seasonalTrends.insights.peakQuarter.quarter} shows highest revenue`,
        action: 'Prepare inventory and marketing for peak season'
      });
    }

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('ML dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load ML analytics dashboard'
    });
  }
});

// Batch customer scoring (for all customers)
router.post('/batch-scoring', async (req, res) => {
  try {
    const userId = req.user.id;
    const { metrics = ['ltv', 'churn'] } = req.body;
    
    const CustomerData = (await import('../models/customerData.model.js')).default;
    const customers = await CustomerData.find({ 'processingInfo.processedBy': userId })
      .limit(100) // Limit for performance
      .select('customerId customerInfo analytics');

    const results = [];

    for (const customer of customers) {
      const customerScores = {
        customerId: customer.customerId,
        name: customer.customerInfo?.name || 'Unknown',
        scores: {}
      };

      // Calculate requested metrics
      if (metrics.includes('ltv')) {
        const ltv = await mlAnalyticsService.predictLifetimeValue(customer.customerId);
        customerScores.scores.lifetimeValue = ltv?.predictedLifetimeValue || 0;
        customerScores.scores.ltvConfidence = ltv?.confidence || 0;
      }

      if (metrics.includes('churn')) {
        const churnRisk = await mlAnalyticsService.calculateChurnRisk(customer);
        customerScores.scores.churnScore = churnRisk.score;
        customerScores.scores.churnRisk = churnRisk.riskLevel;
      }

      results.push(customerScores);
    }

    // Sort by LTV if included
    if (metrics.includes('ltv')) {
      results.sort((a, b) => (b.scores.lifetimeValue || 0) - (a.scores.lifetimeValue || 0));
    }

    res.json({
      success: true,
      data: {
        totalCustomers: customers.length,
        metrics,
        results
      }
    });
  } catch (error) {
    console.error('Batch scoring error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform batch scoring'
    });
  }
});

export default router;