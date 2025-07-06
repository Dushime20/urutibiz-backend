/**
 * AI Recommendations API Usage Examples
 * Complete examples showing how to use the AI recommendations and behavior tracking API
 */

// =====================================================
// SETUP AND IMPORTS
// =====================================================

// For Node.js/Express usage
import axios from 'axios';

// API base URL - adjust for your environment
const API_BASE_URL = 'http://localhost:3000/api';
const AI_BASE_URL = `${API_BASE_URL}/ai`;

// Sample user and product IDs for examples
const SAMPLE_USER_ID = 'user-123';
const SAMPLE_PRODUCT_ID = 'product-456';
const SAMPLE_SESSION_ID = 'session-789';

// =====================================================
// 1. USER INTERACTION TRACKING
// =====================================================

/**
 * Example 1: Track user viewing a product
 */
async function trackProductView() {
  try {
    const response = await axios.post(`${AI_BASE_URL}/interactions`, {
      userId: SAMPLE_USER_ID,
      sessionId: SAMPLE_SESSION_ID,
      actionType: 'view',
      targetType: 'product',
      targetId: SAMPLE_PRODUCT_ID,
      pageUrl: '/products/beach-vacation-package',
      referrerUrl: '/search?q=beach',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      deviceType: 'mobile',
      metadata: {
        searchQuery: 'beach vacation',
        category: 'travel',
        duration: 45000, // time spent on page in ms
        scrollDepth: 0.8
      }
    });

    console.log('Product view tracked:', response.data);
  } catch (error) {
    console.error('Error tracking product view:', error.response?.data || error.message);
  }
}

/**
 * Example 2: Track user search behavior
 */
async function trackUserSearch() {
  try {
    const response = await axios.post(`${AI_BASE_URL}/interactions`, {
      userId: SAMPLE_USER_ID,
      sessionId: SAMPLE_SESSION_ID,
      actionType: 'search',
      pageUrl: '/search',
      deviceType: 'desktop',
      metadata: {
        searchQuery: 'luxury beach resort',
        filters: {
          priceRange: { min: 500, max: 2000 },
          location: 'Caribbean',
          amenities: ['pool', 'spa', 'beach-access']
        },
        resultsCount: 24,
        searchDuration: 2500
      }
    });

    console.log('Search tracked:', response.data);
  } catch (error) {
    console.error('Error tracking search:', error.response?.data || error.message);
  }
}

/**
 * Example 3: Track user clicking on a recommendation
 */
async function trackRecommendationClick() {
  try {
    const response = await axios.post(`${AI_BASE_URL}/interactions`, {
      userId: SAMPLE_USER_ID,
      sessionId: SAMPLE_SESSION_ID,
      actionType: 'click',
      targetType: 'recommendation',
      targetId: 'recommendation-123',
      pageUrl: '/dashboard',
      metadata: {
        recommendationType: 'collaborative_filtering',
        confidenceScore: 0.85,
        rankingPosition: 2
      }
    });

    console.log('Recommendation click tracked:', response.data);
  } catch (error) {
    console.error('Error tracking recommendation click:', error.response?.data || error.message);
  }
}

/**
 * Example 4: Track booking completion
 */
async function trackBookingCompletion() {
  try {
    const response = await axios.post(`${AI_BASE_URL}/interactions`, {
      userId: SAMPLE_USER_ID,
      sessionId: SAMPLE_SESSION_ID,
      actionType: 'book',
      targetType: 'product',
      targetId: SAMPLE_PRODUCT_ID,
      pageUrl: '/booking/confirmation',
      metadata: {
        bookingId: 'booking-789',
        totalAmount: 1500.00,
        currency: 'USD',
        bookingDate: new Date().toISOString(),
        guestCount: 2,
        duration: 7, // days
        source: 'recommendation'
      }
    });

    console.log('Booking completion tracked:', response.data);
  } catch (error) {
    console.error('Error tracking booking:', error.response?.data || error.message);
  }
}

// =====================================================
// 2. RECOMMENDATION GENERATION
// =====================================================

/**
 * Example 5: Generate personalized recommendations
 */
async function generateRecommendations() {
  try {
    const response = await axios.post(`${AI_BASE_URL}/recommendations/generate`, {
      userId: SAMPLE_USER_ID,
      limit: 10,
      excludeProductIds: ['product-111', 'product-222'], // Already viewed/booked
      recommendationTypes: [
        'collaborative_filtering',
        'content_based',
        'behavior_based',
        'trending'
      ],
      contextData: {
        currentLocation: 'New York',
        preferredCategory: 'luxury',
        budget: { min: 1000, max: 3000 },
        travelDates: {
          start: '2025-06-01',
          end: '2025-06-08'
        }
      }
    });

    console.log('Generated recommendations:', response.data);
    return response.data.data; // Array of recommendations
  } catch (error) {
    console.error('Error generating recommendations:', error.response?.data || error.message);
    return [];
  }
}

/**
 * Example 6: Get existing recommendations for a user
 */
async function getUserRecommendations() {
  try {
    const response = await axios.get(`${AI_BASE_URL}/recommendations/user/${SAMPLE_USER_ID}`, {
      params: {
        limit: 15,
        excludeProductIds: 'product-111,product-222',
        types: 'collaborative_filtering,trending'
      }
    });

    console.log('User recommendations:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error getting user recommendations:', error.response?.data || error.message);
    return [];
  }
}

/**
 * Example 7: Record interaction with a recommendation
 */
async function recordRecommendationInteraction(recommendationId: string, actionType: 'click' | 'book') {
  try {
    const response = await axios.post(`${AI_BASE_URL}/recommendations/${recommendationId}/interact`, {
      actionType,
      context: {
        timestamp: new Date().toISOString(),
        source: 'homepage_widget',
        userAgent: navigator.userAgent,
        sessionDuration: 180000 // 3 minutes
      }
    });

    console.log(`Recommendation ${actionType} recorded:`, response.data);
    return response.data.success;
  } catch (error) {
    console.error(`Error recording recommendation ${actionType}:`, error.response?.data || error.message);
    return false;
  }
}

// =====================================================
// 3. ANALYTICS AND REPORTING
// =====================================================

/**
 * Example 8: Get user behavior analytics
 */
async function getUserBehaviorAnalytics() {
  try {
    const response = await axios.get(`${AI_BASE_URL}/analytics/behavior`, {
      params: {
        userId: SAMPLE_USER_ID, // Optional: specific user or all users
        from: '2025-01-01T00:00:00Z',
        to: '2025-01-31T23:59:59Z'
      }
    });

    console.log('User behavior analytics:', response.data);
    
    const analytics = response.data.data;
    console.log(`Total interactions: ${analytics.totalInteractions}`);
    console.log(`Unique users: ${analytics.uniqueUsers}`);
    console.log(`Top actions:`, analytics.topActions);
    console.log(`Device breakdown:`, analytics.deviceBreakdown);
    
    return analytics;
  } catch (error) {
    console.error('Error getting behavior analytics:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Example 9: Get recommendation performance analytics
 */
async function getRecommendationAnalytics() {
  try {
    const response = await axios.get(`${AI_BASE_URL}/analytics/recommendations`, {
      params: {
        from: '2025-01-01T00:00:00Z',
        to: '2025-01-31T23:59:59Z'
      }
    });

    console.log('Recommendation analytics:', response.data);
    
    const analytics = response.data.data;
    console.log(`Total recommendations: ${analytics.totalRecommendations}`);
    console.log(`Click-through rate: ${analytics.clickThroughRate.toFixed(2)}%`);
    console.log(`Conversion rate: ${analytics.conversionRate.toFixed(2)}%`);
    console.log(`Average confidence: ${analytics.averageConfidenceScore.toFixed(3)}`);
    console.log(`Top performing types:`, analytics.topPerformingTypes);
    
    return analytics;
  } catch (error) {
    console.error('Error getting recommendation analytics:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Example 10: Get AI model performance metrics
 */
async function getModelMetrics() {
  try {
    const response = await axios.get(`${AI_BASE_URL}/analytics/models`, {
      params: {
        modelName: 'recommendation_engine', // Optional: specific model
        days: 30
      }
    });

    console.log('Model metrics:', response.data);
    
    const metrics = response.data.data;
    console.log(`Models tracked: ${metrics.models.length}`);
    
    metrics.models.forEach(model => {
      console.log(`Model: ${model.modelName} v${model.modelVersion}`);
      console.log(`Metrics count: ${model.metricsCount}`);
      console.log(`Latest metrics:`, model.latestMetrics);
    });
    
    return metrics;
  } catch (error) {
    console.error('Error getting model metrics:', error.response?.data || error.message);
    return null;
  }
}

// =====================================================
// 4. UTILITY FUNCTIONS
// =====================================================

/**
 * Example 11: Get available recommendation types
 */
async function getRecommendationTypes() {
  try {
    const response = await axios.get(`${AI_BASE_URL}/recommendations/types`);
    console.log('Available recommendation types:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error getting recommendation types:', error.response?.data || error.message);
    return [];
  }
}

/**
 * Example 12: Get available interaction types
 */
async function getInteractionTypes() {
  try {
    const response = await axios.get(`${AI_BASE_URL}/interactions/types`);
    console.log('Available interaction types:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error getting interaction types:', error.response?.data || error.message);
    return {};
  }
}

/**
 * Example 13: Cleanup expired recommendations (admin only)
 */
async function cleanupExpiredRecommendations() {
  try {
    const response = await axios.post(`${AI_BASE_URL}/recommendations/cleanup`);
    console.log('Cleanup completed:', response.data);
    console.log(`Deleted ${response.data.data.deletedCount} expired recommendations`);
    return response.data.data.deletedCount;
  } catch (error) {
    console.error('Error cleaning up recommendations:', error.response?.data || error.message);
    return 0;
  }
}

// =====================================================
// 5. COMPLETE WORKFLOW EXAMPLES
// =====================================================

/**
 * Example 14: Complete user journey tracking
 */
async function trackCompleteUserJourney() {
  console.log('Starting complete user journey tracking...');
  
  // 1. User visits homepage
  await axios.post(`${AI_BASE_URL}/interactions`, {
    userId: SAMPLE_USER_ID,
    sessionId: SAMPLE_SESSION_ID,
    actionType: 'view',
    targetType: 'page',
    pageUrl: '/',
    deviceType: 'desktop'
  });
  
  // 2. User searches for products
  await axios.post(`${AI_BASE_URL}/interactions`, {
    userId: SAMPLE_USER_ID,
    sessionId: SAMPLE_SESSION_ID,
    actionType: 'search',
    pageUrl: '/search',
    metadata: { searchQuery: 'beach vacation packages' }
  });
  
  // 3. User views a product
  await trackProductView();
  
  // 4. Generate recommendations
  const recommendations = await generateRecommendations();
  
  // 5. User clicks on a recommendation
  if (recommendations.length > 0) {
    await recordRecommendationInteraction(recommendations[0].id, 'click');
  }
  
  // 6. User makes a booking
  await trackBookingCompletion();
  
  console.log('Complete user journey tracked successfully!');
}

/**
 * Example 15: E-commerce integration example
 */
class ECommerceAIIntegration {
  private aiBaseUrl: string;
  
  constructor(baseUrl: string) {
    this.aiBaseUrl = `${baseUrl}/ai`;
  }
  
  // Track product page views
  async trackProductView(userId: string, productId: string, sessionId: string, metadata?: any) {
    return axios.post(`${this.aiBaseUrl}/interactions`, {
      userId,
      sessionId,
      actionType: 'view',
      targetType: 'product',
      targetId: productId,
      pageUrl: `/products/${productId}`,
      userAgent: navigator.userAgent,
      metadata
    });
  }
  
  // Get personalized recommendations for homepage
  async getHomepageRecommendations(userId: string, limit: number = 8) {
    const response = await axios.post(`${this.aiBaseUrl}/recommendations/generate`, {
      userId,
      limit,
      recommendationTypes: ['collaborative_filtering', 'trending'],
      contextData: {
        context: 'homepage',
        timestamp: new Date().toISOString()
      }
    });
    
    return response.data.data;
  }
  
  // Track add to cart events
  async trackAddToCart(userId: string, productId: string, sessionId: string, quantity: number, price: number) {
    return axios.post(`${this.aiBaseUrl}/interactions`, {
      userId,
      sessionId,
      actionType: 'favorite', // Using favorite as closest to add-to-cart
      targetType: 'product',
      targetId: productId,
      metadata: {
        action: 'add_to_cart',
        quantity,
        price,
        cartValue: quantity * price
      }
    });
  }
  
  // Track purchase completion
  async trackPurchase(userId: string, sessionId: string, orderData: any) {
    // Track purchase event
    await axios.post(`${this.aiBaseUrl}/interactions`, {
      userId,
      sessionId,
      actionType: 'book',
      targetType: 'product',
      targetId: orderData.productId,
      metadata: {
        orderId: orderData.id,
        totalAmount: orderData.total,
        currency: orderData.currency,
        items: orderData.items,
        paymentMethod: orderData.paymentMethod
      }
    });
    
    // If purchase was from a recommendation, record it
    if (orderData.recommendationId) {
      await this.recordRecommendationConversion(orderData.recommendationId);
    }
  }
  
  // Record recommendation conversion
  async recordRecommendationConversion(recommendationId: string) {
    return axios.post(`${this.aiBaseUrl}/recommendations/${recommendationId}/interact`, {
      actionType: 'book',
      context: {
        conversionType: 'purchase',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  // Get analytics dashboard data
  async getDashboardAnalytics(dateRange: { from: string; to: string }) {
    const [behaviorAnalytics, recommendationAnalytics, modelMetrics] = await Promise.all([
      axios.get(`${this.aiBaseUrl}/analytics/behavior`, { params: dateRange }),
      axios.get(`${this.aiBaseUrl}/analytics/recommendations`, { params: dateRange }),
      axios.get(`${this.aiBaseUrl}/analytics/models`, { params: { days: 30 } })
    ]);
    
    return {
      behavior: behaviorAnalytics.data.data,
      recommendations: recommendationAnalytics.data.data,
      models: modelMetrics.data.data
    };
  }
}

// =====================================================
// 6. FRONTEND INTEGRATION EXAMPLES
// =====================================================

/**
 * Example 16: Frontend integration helper class
 */
class RecommendationsWidget {
  private userId: string;
  private recommendations: any[] = [];
  private loading: boolean = true;
  
  constructor(userId: string) {
    this.userId = userId;
  }
  
  async loadRecommendations(): Promise<void> {
    try {
      this.loading = true;
      const response = await axios.get(`${AI_BASE_URL}/recommendations/user/${this.userId}?limit=6`);
      this.recommendations = response.data.data;
      console.log('Loaded recommendations:', this.recommendations);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      this.loading = false;
    }
  }
  
  async handleRecommendationClick(recommendation: any): Promise<void> {
    try {
      // Track the click
      await axios.post(`${AI_BASE_URL}/recommendations/${recommendation.id}/interact`, {
        actionType: 'click',
        context: {
          source: 'recommendations_widget',
          timestamp: new Date().toISOString()
        }
      });
      
      console.log(`Tracked click for recommendation: ${recommendation.id}`);
      // In a real app, this would navigate to the product page
      console.log(`Would navigate to: /products/${recommendation.productId}`);
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  }
  
  getRecommendations(): any[] {
    return this.recommendations;
  }
  
  isLoading(): boolean {
    return this.loading;
  }
}

/**
 * Example 17: Analytics dashboard helper class
 */
class AnalyticsDashboard {
  private analytics: any = null;
  private loading: boolean = true;
  private dateRange: { from: string; to: string };
  
  constructor() {
    this.dateRange = {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date().toISOString()
    };
  }
  
  async loadAnalytics(): Promise<void> {
    try {
      this.loading = true;
      const ecommerce = new ECommerceAIIntegration(API_BASE_URL);
      const dashboardData = await ecommerce.getDashboardAnalytics(this.dateRange);
      this.analytics = dashboardData;
      console.log('Analytics loaded:', dashboardData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      this.loading = false;
    }
  }
  
  setDateRange(from: string, to: string): void {
    this.dateRange = { from, to };
  }
  
  getAnalytics(): any {
    return this.analytics;
  }
  
  isLoading(): boolean {
    return this.loading;
  }
  
  displayAnalytics(): void {
    if (this.loading) {
      console.log('Loading analytics...');
      return;
    }
    
    if (!this.analytics) {
      console.log('No analytics data available');
      return;
    }
    
    console.log('=== AI Analytics Dashboard ===');
    console.log('Date Range:', this.dateRange);
    console.log('\n--- User Behavior ---');
    console.log('Total Interactions:', this.analytics.behavior.totalInteractions);
    console.log('Unique Users:', this.analytics.behavior.uniqueUsers);
    console.log('Unique Sessions:', this.analytics.behavior.uniqueSessions);
    
    console.log('\n--- Recommendations ---');
    console.log('Total Generated:', this.analytics.recommendations.totalRecommendations);
    console.log('CTR:', `${this.analytics.recommendations.clickThroughRate.toFixed(2)}%`);
    console.log('Conversion:', `${this.analytics.recommendations.conversionRate.toFixed(2)}%`);
    
    console.log('\n--- Model Performance ---');
    console.log('Models:', this.analytics.models.models.length);
    console.log('Metrics Tracked:', this.analytics.models.trendData.length);
  }
}

// =====================================================
// 7. TESTING EXAMPLES
// =====================================================

/**
 * Example 18: Test all AI endpoints
 */
async function runComprehensiveTest() {
  console.log('Starting comprehensive AI API test...');
  
  try {
    // Test 1: Track interactions
    console.log('1. Testing interaction tracking...');
    await trackProductView();
    await trackUserSearch();
    
    // Test 2: Generate recommendations
    console.log('2. Testing recommendation generation...');
    const recommendations = await generateRecommendations();
    
    // Test 3: Get user recommendations
    console.log('3. Testing user recommendations retrieval...');
    await getUserRecommendations();
    
    // Test 4: Record recommendation interactions
    if (recommendations.length > 0) {
      console.log('4. Testing recommendation interactions...');
      await recordRecommendationInteraction(recommendations[0].id, 'click');
    }
    
    // Test 5: Get analytics
    console.log('5. Testing analytics endpoints...');
    await getUserBehaviorAnalytics();
    await getRecommendationAnalytics();
    await getModelMetrics();
    
    // Test 6: Get utility data
    console.log('6. Testing utility endpoints...');
    await getRecommendationTypes();
    await getInteractionTypes();
    
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// =====================================================
// EXPORT FOR MODULE USAGE
// =====================================================

// For Node.js module usage
export {
  trackProductView,
  trackUserSearch,
  trackRecommendationClick,
  trackBookingCompletion,
  generateRecommendations,
  getUserRecommendations,
  recordRecommendationInteraction,
  getUserBehaviorAnalytics,
  getRecommendationAnalytics,
  getModelMetrics,
  getRecommendationTypes,
  getInteractionTypes,
  cleanupExpiredRecommendations,
  trackCompleteUserJourney,
  ECommerceAIIntegration,
  runComprehensiveTest
};

// For browser usage
declare global {
  interface Window {
    UrutiBizAI: any;
  }
}

if (typeof window !== 'undefined') {
  window.UrutiBizAI = {
    trackProductView,
    generateRecommendations,
    getUserRecommendations,
    recordRecommendationInteraction,
    getUserBehaviorAnalytics,
    getRecommendationAnalytics,
    ECommerceAIIntegration,
    runComprehensiveTest
  };
}

// Example usage in browser console:
// UrutiBizAI.runComprehensiveTest();
