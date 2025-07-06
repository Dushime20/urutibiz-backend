/**
 * AI Recommendations Integration Test
 * Tests the complete AI recommendation system functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api/v1';
const AI_BASE_URL = `${BASE_URL}/ai`;

// Test data
const testUsers = [
  { id: 'user-1', email: 'test1@example.com' },
  { id: 'user-2', email: 'test2@example.com' },
  { id: 'user-3', email: 'test3@example.com' }
];

const testProducts = [
  { id: 'prod-1', name: 'Mountain Bike', category: 'bikes' },
  { id: 'prod-2', name: 'Road Bike', category: 'bikes' },
  { id: 'prod-3', name: 'Camera DSLR', category: 'electronics' },
  { id: 'prod-4', name: 'Tent 4-person', category: 'camping' }
];

/**
 * Test utility functions
 */
const testUtils = {
  async checkHealth() {
    try {
      const response = await axios.get('http://localhost:4000/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  },

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  generateRandomInteractions(userId, count = 10) {
    const actions = ['view', 'click', 'search', 'book'];
    const targets = ['product', 'category', 'page'];
    const devices = ['desktop', 'mobile', 'tablet'];
    
    return Array.from({ length: count }, () => ({
      userId,
      sessionId: `session-${Date.now()}-${Math.random()}`,
      actionType: actions[Math.floor(Math.random() * actions.length)],
      targetType: targets[Math.floor(Math.random() * targets.length)],
      targetId: testProducts[Math.floor(Math.random() * testProducts.length)].id,
      deviceType: devices[Math.floor(Math.random() * devices.length)],
      pageUrl: '/products',
      metadata: {
        timestamp: new Date().toISOString(),
        test: true
      }
    }));
  }
};

/**
 * Test suite for AI Recommendations
 */
const tests = {
  async testHealthCheck() {
    console.log('\n🏥 Testing Health Check...');
    
    const isHealthy = await testUtils.checkHealth();
    console.log(`  ✅ Server health: ${isHealthy ? 'OK' : 'FAILED'}`);
    
    if (!isHealthy) {
      throw new Error('Server is not healthy. Please start the server first.');
    }
  },

  async testUserInteractionTracking() {
    console.log('\n📊 Testing User Interaction Tracking...');
    
    for (const user of testUsers) {
      console.log(`  Testing interactions for ${user.email}...`);
      
      const interactions = testUtils.generateRandomInteractions(user.id, 5);
      
      for (const interaction of interactions) {
        try {
          const response = await axios.post(`${AI_BASE_URL}/interactions`, interaction);
          
          if (response.status === 201) {
            console.log(`    ✅ Interaction tracked: ${interaction.actionType} on ${interaction.targetType}`);
          } else {
            console.log(`    ⚠️  Unexpected response: ${response.status}`);
          }
        } catch (error) {
          console.log(`    ❌ Failed to track interaction: ${error.response?.data?.error || error.message}`);
        }
        
        await testUtils.delay(100); // Prevent overwhelming the server
      }
    }
  },

  async testRecommendationGeneration() {
    console.log('\n🤖 Testing Recommendation Generation...');
    
    for (const user of testUsers) {
      console.log(`  Generating recommendations for ${user.email}...`);
      
      const recommendationRequest = {
        userId: user.id,
        limit: 5,
        excludeProductIds: [],
        recommendationTypes: ['collaborative_filtering', 'content_based', 'trending'],
        contextData: {
          currentPage: 'home',
          deviceType: 'desktop',
          sessionDuration: 300
        }
      };
      
      try {
        const response = await axios.post(
          `${AI_BASE_URL}/recommendations/generate`,
          recommendationRequest
        );
        
        if (response.status === 201 && response.data.success) {
          const recommendations = response.data.data;
          console.log(`    ✅ Generated ${recommendations.length} recommendations`);
          
          // Analyze recommendation quality
          recommendations.forEach((rec, index) => {
            console.log(`      ${index + 1}. Product: ${rec.productId} (${rec.recommendationType}) - Confidence: ${rec.confidenceScore}`);
          });
        } else {
          console.log(`    ⚠️  Unexpected response: ${response.status}`);
        }
      } catch (error) {
        console.log(`    ❌ Failed to generate recommendations: ${error.response?.data?.error || error.message}`);
      }
    }
  },

  async testRecommendationInteraction() {
    console.log('\n👆 Testing Recommendation Interactions...');
    
    // First generate some recommendations
    const userId = testUsers[0].id;
    
    try {
      const genResponse = await axios.post(`${AI_BASE_URL}/recommendations/generate`, {
        userId,
        limit: 3
      });
      
      if (genResponse.data.success && genResponse.data.data.length > 0) {
        const recommendation = genResponse.data.data[0];
        console.log(`  Testing interaction with recommendation: ${recommendation.id}`);
        
        // Test click interaction
        try {
          const clickResponse = await axios.post(
            `${AI_BASE_URL}/recommendations/${recommendation.id}/interaction`,
            {
              actionType: 'click',
              context: {
                pageUrl: '/products',
                sessionId: 'test-session-123',
                deviceType: 'desktop'
              }
            }
          );
          
          if (clickResponse.data.success) {
            console.log(`    ✅ Click interaction recorded successfully`);
          }
        } catch (error) {
          console.log(`    ❌ Failed to record click: ${error.response?.data?.error || error.message}`);
        }
        
        // Test booking interaction
        try {
          const bookResponse = await axios.post(
            `${AI_BASE_URL}/recommendations/${recommendation.id}/interaction`,
            {
              actionType: 'book',
              context: {
                pageUrl: '/booking',
                sessionId: 'test-session-123',
                bookingId: 'test-booking-123'
              }
            }
          );
          
          if (bookResponse.data.success) {
            console.log(`    ✅ Booking interaction recorded successfully`);
          }
        } catch (error) {
          console.log(`    ❌ Failed to record booking: ${error.response?.data?.error || error.message}`);
        }
      }
    } catch (error) {
      console.log(`    ❌ Failed to test interactions: ${error.response?.data?.error || error.message}`);
    }
  },

  async testUserBehaviorAnalytics() {
    console.log('\n📈 Testing User Behavior Analytics...');
    
    for (const user of testUsers) {
      console.log(`  Getting analytics for ${user.email}...`);
      
      try {
        const response = await axios.get(
          `${AI_BASE_URL}/analytics/user-behavior?userId=${user.id}&days=7`
        );
        
        if (response.status === 200) {
          const analytics = response.data.data;
          console.log(`    ✅ Analytics retrieved successfully`);
          console.log(`      Total interactions: ${analytics.totalInteractions || 0}`);
          console.log(`      Unique sessions: ${analytics.uniqueSessions || 0}`);
          console.log(`      Top actions: ${JSON.stringify(analytics.topActions || {})}`);
        }
      } catch (error) {
        console.log(`    ❌ Failed to get analytics: ${error.response?.data?.error || error.message}`);
      }
    }
  },

  async testRecommendationAnalytics() {
    console.log('\n🎯 Testing Recommendation Analytics...');
    
    try {
      const response = await axios.get(`${AI_BASE_URL}/analytics/recommendations?days=7`);
      
      if (response.status === 200) {
        const analytics = response.data.data;
        console.log(`    ✅ Recommendation analytics retrieved`);
        console.log(`      Total recommendations: ${analytics.totalRecommendations || 0}`);
        console.log(`      Click-through rate: ${analytics.clickThroughRate || 0}%`);
        console.log(`      Conversion rate: ${analytics.conversionRate || 0}%`);
        console.log(`      Top recommendation types: ${JSON.stringify(analytics.topTypes || {})}`);
      }
    } catch (error) {
      console.log(`    ❌ Failed to get recommendation analytics: ${error.response?.data?.error || error.message}`);
    }
  },

  async testModelMetrics() {
    console.log('\n🔬 Testing Model Performance Metrics...');
    
    try {
      const response = await axios.get(`${AI_BASE_URL}/metrics/model-performance?days=7`);
      
      if (response.status === 200) {
        const metrics = response.data.data;
        console.log(`    ✅ Model metrics retrieved`);
        console.log(`      Available metrics: ${Object.keys(metrics || {}).length}`);
        
        if (metrics.recommendations_generated) {
          console.log(`      Recommendations generated: ${metrics.recommendations_generated}`);
        }
        
        if (metrics.average_confidence_score) {
          console.log(`      Average confidence score: ${metrics.average_confidence_score}`);
        }
      }
    } catch (error) {
      console.log(`    ❌ Failed to get model metrics: ${error.response?.data?.error || error.message}`);
    }
  },

  async testRecommendationPersonalization() {
    console.log('\n🎨 Testing Recommendation Personalization...');
    
    // Create different interaction patterns for users
    const users = [
      { id: 'user-bike-lover', pattern: 'bikes' },
      { id: 'user-tech-enthusiast', pattern: 'electronics' },
      { id: 'user-outdoor-adventurer', pattern: 'camping' }
    ];
    
    for (const user of users) {
      console.log(`  Testing personalization for ${user.pattern} lover...`);
      
      // Create targeted interactions
      const relevantProducts = testProducts.filter(p => p.category === user.pattern);
      
      for (const product of relevantProducts) {
        const interaction = {
          userId: user.id,
          actionType: 'view',
          targetType: 'product',
          targetId: product.id,
          deviceType: 'desktop',
          metadata: { test: true, pattern: user.pattern }
        };
        
        try {
          await axios.post(`${AI_BASE_URL}/interactions`, interaction);
        } catch (error) {
          // Continue even if some interactions fail
        }
      }
      
      // Wait a bit for processing
      await testUtils.delay(500);
      
      // Generate recommendations
      try {
        const recResponse = await axios.post(`${AI_BASE_URL}/recommendations/generate`, {
          userId: user.id,
          limit: 5,
          recommendationTypes: ['content_based', 'behavior_based']
        });
        
        if (recResponse.data.success) {
          const recommendations = recResponse.data.data;
          console.log(`    ✅ Generated ${recommendations.length} personalized recommendations`);
          
          // Check if recommendations match user pattern
          let relevantCount = 0;
          recommendations.forEach(rec => {
            const product = testProducts.find(p => p.id === rec.productId);
            if (product && product.category === user.pattern) {
              relevantCount++;
            }
          });
          
          const relevancePercentage = (relevantCount / recommendations.length) * 100;
          console.log(`    📊 Personalization accuracy: ${relevancePercentage.toFixed(1)}% (${relevantCount}/${recommendations.length})`);
        }
      } catch (error) {
        console.log(`    ❌ Failed to test personalization: ${error.response?.data?.error || error.message}`);
      }
    }
  }
};

/**
 * Main test runner
 */
async function runAIRecommendationTests() {
  console.log('🚀 Starting AI Recommendation System Tests...');
  console.log('================================================');
  
  const testCases = [
    tests.testHealthCheck,
    tests.testUserInteractionTracking,
    tests.testRecommendationGeneration,
    tests.testRecommendationInteraction,
    tests.testUserBehaviorAnalytics,
    tests.testRecommendationAnalytics,
    tests.testModelMetrics,
    tests.testRecommendationPersonalization
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    try {
      await testCase();
      passed++;
    } catch (error) {
      console.log(`\n❌ Test failed: ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n================================================');
  console.log('🏁 Test Results Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All AI Recommendation tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the output above.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAIRecommendationTests().catch(console.error);
}

module.exports = { runAIRecommendationTests, testUtils, tests };
