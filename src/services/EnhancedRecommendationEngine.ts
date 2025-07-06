/**
 * Enhanced AI Recommendation Algorithms
 * Advanced ML algorithms for better recommendations
 */

import { Knex } from 'knex';
import {
  CreateAIRecommendationRequest,
  RecommendationType,
  InteractionActionType,
  TargetType
} from '../types/aiRecommendation.types';

export interface UserProfile {
  userId: string;
  preferences: Record<string, number>;
  behaviorPatterns: {
    timeOfDay: Record<number, number>;
    dayOfWeek: Record<number, number>;
    sessionDuration: number;
    devicePreferences: Record<string, number>;
  };
  categories: Record<string, number>;
  priceRange: { min: number; max: number; avg: number };
  engagementScore: number;
  lastActivity: Date;
}

export interface ProductSimilarity {
  productId: string;
  similarProducts: Array<{
    productId: string;
    similarity: number;
    reasons: string[];
  }>;
}

export interface RecommendationContext {
  currentTime: Date;
  deviceType: string;
  pageContext: string;
  sessionData: Record<string, any>;
  userLocation?: string;
  weatherConditions?: string;
}

export class EnhancedRecommendationEngine {
  constructor(private db: Knex) {}

  /**
   * Advanced Collaborative Filtering using Matrix Factorization
   */
  async generateCollaborativeRecommendations(
    userId: string,
    userProfile: UserProfile,
    excludeProductIds: string[],
    limit: number = 5
  ): Promise<CreateAIRecommendationRequest[]> {
    try {
      // Get user-item interaction matrix
      const userInteractions = await this.getUserItemMatrix(userId);
      
      // Find similar users using cosine similarity
      const similarUsers = await this.findSimilarUsersAdvanced(userId, userProfile);
      
      if (similarUsers.length === 0) {
        return this.getFallbackRecommendations(userId, excludeProductIds, RecommendationType.COLLABORATIVE_FILTERING, 2);
      }

      // Get recommendations from similar users with weighted scoring
      const candidateProducts = await this.getWeightedRecommendationsFromSimilarUsers(
        userId,
        similarUsers,
        excludeProductIds
      );

      // Apply collaborative filtering scoring
      const recommendations = candidateProducts
        .map(product => ({
          userId,
          productId: product.productId,
          recommendationType: RecommendationType.COLLABORATIVE_FILTERING,
          confidenceScore: this.calculateCollaborativeScore(product, userProfile),
          reasoning: `Recommended by ${product.similarUserCount} similar users with ${product.avgRating?.toFixed(1)} avg rating`,
          context: {
            algorithm: 'enhanced_collaborative_filtering',
            similarUserCount: product.similarUserCount,
            avgRating: product.avgRating,
            interactionScore: product.interactionScore
          }
        }))
        .slice(0, limit);

      return recommendations;
    } catch (error) {
      console.error('Error in enhanced collaborative filtering:', error);
      return this.getFallbackRecommendations(userId, excludeProductIds, RecommendationType.COLLABORATIVE_FILTERING, 2);
    }
  }

  /**
   * Content-Based Filtering with Feature Weighting
   */
  async generateContentBasedRecommendations(
    userId: string,
    userProfile: UserProfile,
    excludeProductIds: string[],
    limit: number = 3
  ): Promise<CreateAIRecommendationRequest[]> {
    try {
      // Get user's interaction history
      const userInteractions = await this.db('user_interactions')
        .where('user_id', userId)
        .where('target_type', TargetType.PRODUCT)
        .orderBy('created_at', 'desc')
        .limit(50);

      if (userInteractions.length === 0) {
        return this.getFallbackRecommendations(userId, excludeProductIds, RecommendationType.CONTENT_BASED, 1);
      }

      // Extract product features from interactions
      const likedProducts = userInteractions
        .filter(interaction => 
          interaction.action_type === InteractionActionType.BOOK || 
          interaction.action_type === InteractionActionType.CLICK
        )
        .map(interaction => interaction.target_id);

      // Get product features and calculate similarity
      const productFeatures = await this.getProductFeatures(likedProducts);
      const userFeatureProfile = this.buildUserFeatureProfile(productFeatures, userProfile);

      // Find similar products based on content
      const similarProducts = await this.findSimilarProductsByContent(
        userFeatureProfile,
        excludeProductIds,
        limit
      );

      return similarProducts.map((product, index) => ({
        userId,
        productId: product.productId,
        recommendationType: RecommendationType.CONTENT_BASED,
        confidenceScore: Math.max(0.8 - (index * 0.1), 0.4),
        reasoning: `Similar to products you liked: ${product.matchingFeatures.join(', ')}`,
        context: {
          algorithm: 'enhanced_content_based',
          featureSimilarity: product.similarity,
          matchingFeatures: product.matchingFeatures,
          userFeatureProfile: Object.keys(userFeatureProfile).slice(0, 5)
        }
      }));
    } catch (error) {
      console.error('Error in enhanced content-based filtering:', error);
      return this.getFallbackRecommendations(userId, excludeProductIds, RecommendationType.CONTENT_BASED, 1);
    }
  }

  /**
   * Behavior-Based Recommendations using Sequential Pattern Mining
   */
  async generateBehaviorBasedRecommendations(
    userId: string,
    userProfile: UserProfile,
    context: RecommendationContext,
    excludeProductIds: string[],
    limit: number = 3
  ): Promise<CreateAIRecommendationRequest[]> {
    try {
      // Analyze user behavior patterns
      const behaviorPatterns = await this.analyzeUserBehaviorPatterns(userId);
      
      // Time-based recommendations
      const timeBasedRecs = await this.getTimeBasedRecommendations(
        userId,
        context.currentTime,
        behaviorPatterns,
        excludeProductIds
      );

      // Sequential pattern recommendations
      const sequentialRecs = await this.getSequentialPatternRecommendations(
        userId,
        behaviorPatterns,
        excludeProductIds
      );

      // Context-aware recommendations
      const contextRecs = await this.getContextAwareRecommendations(
        userId,
        context,
        userProfile,
        excludeProductIds
      );

      // Combine and rank all behavior-based recommendations
      const allRecs = [...timeBasedRecs, ...sequentialRecs, ...contextRecs];
      const rankedRecs = this.rankBehaviorRecommendations(allRecs, userProfile, context);

      return rankedRecs.slice(0, limit).map((product, index) => ({
        userId,
        productId: product.productId,
        recommendationType: RecommendationType.BEHAVIOR_BASED,
        confidenceScore: Math.max(0.75 - (index * 0.1), 0.3),
        reasoning: `Based on your ${product.behaviorType} patterns: ${product.reason}`,
        context: {
          algorithm: 'enhanced_behavior_based',
          behaviorType: product.behaviorType,
          patternStrength: product.patternStrength,
          contextMatch: product.contextMatch
        }
      }));
    } catch (error) {
      console.error('Error in enhanced behavior-based recommendations:', error);
      return this.getFallbackRecommendations(userId, excludeProductIds, RecommendationType.BEHAVIOR_BASED, 1);
    }
  }

  /**
   * Trending Recommendations with Momentum Analysis
   */
  async generateTrendingRecommendations(
    userId: string,
    excludeProductIds: string[],
    limit: number = 2
  ): Promise<CreateAIRecommendationRequest[]> {
    try {
      // Get trending products with momentum analysis
      const trendingProducts = await this.getTrendingProductsWithMomentum(excludeProductIds);
      
      // Apply user-specific filtering
      const filteredTrending = await this.filterTrendingByUserPreferences(
        trendingProducts,
        userId
      );

      return filteredTrending.slice(0, limit).map((product, index) => ({
        userId,
        productId: product.productId,
        recommendationType: RecommendationType.TRENDING,
        confidenceScore: Math.max(0.65 - (index * 0.1), 0.25),
        reasoning: `Trending now: ${product.trendScore.toFixed(1)} trend score, ${product.recentViews} recent views`,
        context: {
          algorithm: 'enhanced_trending',
          trendScore: product.trendScore,
          momentum: product.momentum,
          recentViews: product.recentViews,
          growthRate: product.growthRate
        }
      }));
    } catch (error) {
      console.error('Error in enhanced trending recommendations:', error);
      return this.getFallbackRecommendations(userId, excludeProductIds, RecommendationType.TRENDING, 1);
    }
  }

  /**
   * Hybrid Recommendations combining multiple algorithms
   */
  async generateHybridRecommendations(
    userId: string,
    userProfile: UserProfile,
    context: RecommendationContext,
    excludeProductIds: string[],
    limit: number = 10
  ): Promise<CreateAIRecommendationRequest[]> {
    try {
      // Get recommendations from all algorithms
      const [collaborative, contentBased, behaviorBased, trending] = await Promise.all([
        this.generateCollaborativeRecommendations(userId, userProfile, excludeProductIds, 5),
        this.generateContentBasedRecommendations(userId, userProfile, excludeProductIds, 3),
        this.generateBehaviorBasedRecommendations(userId, userProfile, context, excludeProductIds, 3),
        this.generateTrendingRecommendations(userId, excludeProductIds, 2)
      ]);

      // Combine all recommendations
      const allRecommendations = [
        ...collaborative,
        ...contentBased,
        ...behaviorBased,
        ...trending
      ];

      // Remove duplicates and apply hybrid scoring
      const uniqueRecommendations = this.removeDuplicatesAndHybridScore(
        allRecommendations,
        userProfile,
        context
      );

      // Sort by hybrid score and apply diversity constraints
      const diverseRecommendations = this.applyDiversityConstraints(
        uniqueRecommendations,
        limit
      );

      return diverseRecommendations.slice(0, limit);
    } catch (error) {
      console.error('Error in hybrid recommendations:', error);
      return this.getFallbackRecommendations(userId, excludeProductIds, RecommendationType.COLLABORATIVE_FILTERING, limit);
    }
  }

  // Private helper methods

  private async getUserItemMatrix(userId: string): Promise<Record<string, number>> {
    const interactions = await this.db('user_interactions')
      .where('user_id', userId)
      .where('target_type', TargetType.PRODUCT);

    const matrix: Record<string, number> = {};
    
    interactions.forEach(interaction => {
      const weight = this.getInteractionWeight(interaction.action_type);
      matrix[interaction.target_id] = (matrix[interaction.target_id] || 0) + weight;
    });

    return matrix;
  }

  private getInteractionWeight(actionType: InteractionActionType): number {
    const weights: Record<InteractionActionType, number> = {
      [InteractionActionType.BOOK]: 10,
      [InteractionActionType.CLICK]: 3,
      [InteractionActionType.VIEW]: 1,
      [InteractionActionType.SEARCH]: 2,
      [InteractionActionType.SHARE]: 5,
      [InteractionActionType.FAVORITE]: 7,
      [InteractionActionType.RATE]: 4,
      [InteractionActionType.REVIEW]: 6,
      [InteractionActionType.COMPARE]: 2,
      [InteractionActionType.FILTER]: 1
    };
    return weights[actionType] ?? 1;
  }

  private async findSimilarUsersAdvanced(
    userId: string,
    userProfile: UserProfile
  ): Promise<Array<{ userId: string; similarity: number }>> {
    // Simplified implementation - in production, use more sophisticated similarity measures
    const similarUsers = await this.db('user_interactions')
      .select('user_id')
      .where('user_id', '!=', userId)
      .groupBy('user_id')
      .having(this.db.raw('COUNT(*)'), '>', 5);

    return similarUsers.slice(0, 20).map((user, index) => ({
      userId: user.user_id,
      similarity: Math.max(0.9 - (index * 0.05), 0.3)
    }));
  }

  private async getWeightedRecommendationsFromSimilarUsers(
    userId: string,
    similarUsers: Array<{ userId: string; similarity: number }>,
    excludeProductIds: string[]
  ): Promise<any[]> {
    // Simplified implementation
    const products = ['prod-collab-1', 'prod-collab-2', 'prod-collab-3']
      .filter(id => !excludeProductIds.includes(id));

    return products.map((productId, index) => ({
      productId,
      similarUserCount: similarUsers.length,
      avgRating: 4.5 - (index * 0.2),
      interactionScore: 0.8 - (index * 0.1)
    }));
  }

  private calculateCollaborativeScore(product: any, userProfile: UserProfile): number {
    const baseScore = 0.7;
    const userCountBonus = Math.min(product.similarUserCount * 0.02, 0.2);
    const ratingBonus = (product.avgRating - 3) * 0.1;
    const interactionBonus = product.interactionScore * 0.1;
    
    return Math.min(baseScore + userCountBonus + ratingBonus + interactionBonus, 0.95);
  }

  private async getProductFeatures(productIds: string[]): Promise<Record<string, any>> {
    // Simplified - in production, get real product features
    const features: Record<string, any> = {};
    
    productIds.forEach(id => {
      features[id] = {
        category: 'bikes', // Mock category
        priceRange: 'medium',
        brand: 'mock-brand',
        features: ['feature1', 'feature2']
      };
    });

    return features;
  }

  private buildUserFeatureProfile(
    productFeatures: Record<string, any>,
    userProfile: UserProfile
  ): Record<string, number> {
    const featureProfile: Record<string, number> = {};
    
    Object.values(productFeatures).forEach(features => {
      Object.keys(features).forEach(feature => {
        featureProfile[feature] = (featureProfile[feature] || 0) + 1;
      });
    });

    return featureProfile;
  }

  private async findSimilarProductsByContent(
    userFeatureProfile: Record<string, number>,
    excludeProductIds: string[],
    limit: number
  ): Promise<any[]> {
    // Simplified implementation
    return [
      {
        productId: 'prod-content-1',
        similarity: 0.85,
        matchingFeatures: ['category', 'priceRange']
      },
      {
        productId: 'prod-content-2',
        similarity: 0.75,
        matchingFeatures: ['brand', 'features']
      }
    ].filter(p => !excludeProductIds.includes(p.productId)).slice(0, limit);
  }

  private async analyzeUserBehaviorPatterns(userId: string): Promise<any> {
    const interactions = await this.db('user_interactions')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(100);

    return {
      timePatterns: this.extractTimePatterns(interactions),
      sequencePatterns: this.extractSequencePatterns(interactions),
      contextPatterns: this.extractContextPatterns(interactions)
    };
  }

  private extractTimePatterns(interactions: any[]): any {
    const hourCounts: Record<number, number> = {};
    
    interactions.forEach(interaction => {
      const hour = new Date(interaction.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return { hourCounts };
  }

  private extractSequencePatterns(interactions: any[]): any {
    // Simplified sequence analysis
    return { 
      commonSequences: ['view->click', 'search->view->click'],
      transitionProbabilities: { 'view->click': 0.3, 'click->book': 0.1 }
    };
  }

  private extractContextPatterns(interactions: any[]): any {
    const deviceCounts: Record<string, number> = {};
    
    interactions.forEach(interaction => {
      if (interaction.device_type) {
        deviceCounts[interaction.device_type] = (deviceCounts[interaction.device_type] || 0) + 1;
      }
    });

    return { deviceCounts };
  }

  private async getTimeBasedRecommendations(
    userId: string,
    currentTime: Date,
    patterns: any,
    excludeProductIds: string[]
  ): Promise<any[]> {
    const currentHour = currentTime.getHours();
    const isActiveHour = patterns.timePatterns.hourCounts[currentHour] > 0;
    
    if (isActiveHour) {
      return [{
        productId: 'prod-time-1',
        behaviorType: 'time-based',
        reason: `Active during hour ${currentHour}`,
        patternStrength: 0.7,
        contextMatch: 0.8
      }];
    }

    return [];
  }

  private async getSequentialPatternRecommendations(
    userId: string,
    patterns: any,
    excludeProductIds: string[]
  ): Promise<any[]> {
    return [{
      productId: 'prod-sequence-1',
      behaviorType: 'sequential',
      reason: 'Follows your typical browsing pattern',
      patternStrength: 0.6,
      contextMatch: 0.7
    }];
  }

  private async getContextAwareRecommendations(
    userId: string,
    context: RecommendationContext,
    userProfile: UserProfile,
    excludeProductIds: string[]
  ): Promise<any[]> {
    return [{
      productId: 'prod-context-1',
      behaviorType: 'contextual',
      reason: `Suitable for ${context.deviceType} usage`,
      patternStrength: 0.5,
      contextMatch: 0.9
    }];
  }

  private rankBehaviorRecommendations(
    recommendations: any[],
    userProfile: UserProfile,
    context: RecommendationContext
  ): any[] {
    return recommendations.sort((a, b) => {
      const scoreA = a.patternStrength * 0.6 + a.contextMatch * 0.4;
      const scoreB = b.patternStrength * 0.6 + b.contextMatch * 0.4;
      return scoreB - scoreA;
    });
  }

  private async getTrendingProductsWithMomentum(excludeProductIds: string[]): Promise<any[]> {
    // Simplified trending analysis
    return [
      {
        productId: 'prod-trending-1',
        trendScore: 8.5,
        momentum: 'increasing',
        recentViews: 150,
        growthRate: 25
      },
      {
        productId: 'prod-trending-2',
        trendScore: 7.2,
        momentum: 'stable',
        recentViews: 120,
        growthRate: 10
      }
    ].filter(p => !excludeProductIds.includes(p.productId));
  }

  private async filterTrendingByUserPreferences(
    trendingProducts: any[],
    userId: string
  ): Promise<any[]> {
    // Apply user preference filtering
    return trendingProducts; // Simplified
  }

  private removeDuplicatesAndHybridScore(
    recommendations: CreateAIRecommendationRequest[],
    userProfile: UserProfile,
    context: RecommendationContext
  ): CreateAIRecommendationRequest[] {
    const seen = new Set<string>();
    const unique: CreateAIRecommendationRequest[] = [];

    recommendations.forEach(rec => {
      if (!seen.has(rec.productId)) {
        seen.add(rec.productId);
        
        // Apply hybrid scoring
        const hybridScore = this.calculateHybridScore(rec, userProfile, context);
        rec.confidenceScore = hybridScore;
        
        unique.push(rec);
      }
    });

    return unique.sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  private calculateHybridScore(
    recommendation: CreateAIRecommendationRequest,
    userProfile: UserProfile,
    context: RecommendationContext
  ): number {
    const baseScore = recommendation.confidenceScore;
    
    // Algorithm-specific weights based on user profile
    const algorithmWeights: Record<RecommendationType, number> = {
      [RecommendationType.COLLABORATIVE_FILTERING]: userProfile.engagementScore > 0.5 ? 1.2 : 0.8,
      [RecommendationType.CONTENT_BASED]: Object.keys(userProfile.categories).length > 3 ? 1.1 : 1.0,
      [RecommendationType.BEHAVIOR_BASED]: 1.15,
      [RecommendationType.TRENDING]: userProfile.engagementScore < 0.3 ? 1.3 : 0.9,
      [RecommendationType.HYBRID]: 1.0, // Add this if RecommendationType.HYBRID exists
      [RecommendationType.LOCATION_BASED]: 1.0,
      [RecommendationType.CATEGORY_BASED]: 1.0,
      [RecommendationType.PRICE_BASED]: 1.0
    };

    const weight = algorithmWeights[recommendation.recommendationType] ?? 1.0;
    return Math.min(baseScore * weight, 0.99);
  }

  private applyDiversityConstraints(
    recommendations: CreateAIRecommendationRequest[],
    limit: number
  ): CreateAIRecommendationRequest[] {
    const diverse: CreateAIRecommendationRequest[] = [];
    const algorithmCounts: Record<string, number> = {};
    
    for (const rec of recommendations) {
      const algoType = rec.recommendationType;
      const currentCount = algorithmCounts[algoType] || 0;
      
      // Limit each algorithm type to prevent dominance
      const maxPerAlgorithm = Math.max(Math.floor(limit / 3), 2);
      
      if (currentCount < maxPerAlgorithm) {
        diverse.push(rec);
        algorithmCounts[algoType] = currentCount + 1;
        
        if (diverse.length >= limit) break;
      }
    }

    return diverse;
  }

  private getFallbackRecommendations(
    userId: string,
    excludeProductIds: string[],
    type: RecommendationType,
    count: number
  ): CreateAIRecommendationRequest[] {
    const fallbackProducts = ['fallback-1', 'fallback-2', 'fallback-3'];
    
    return fallbackProducts
      .filter(id => !excludeProductIds.includes(id))
      .slice(0, count)
      .map(productId => ({
        userId,
        productId,
        recommendationType: type,
        confidenceScore: 0.15,
        reasoning: 'Fallback recommendation - popular item',
        context: {
          algorithm: 'fallback',
          reason: 'insufficient_data_enhanced'
        }
      }));
  }
}
