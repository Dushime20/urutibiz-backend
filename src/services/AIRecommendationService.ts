/**
 * AI Recommendation Service
 * Business logic for AI-powered recommendations system
 */

import { Knex } from 'knex';
import { createHash } from 'crypto';
import {
  AIRecommendation,
  CreateAIRecommendationRequest,
  GenerateRecommendationsRequest,
  RecommendationType,
  AIRecommendationError,
  UserInteractionError,
  AIModelMetricError,
  InteractionActionType,
  TargetType,
  DeviceType
} from '../types/aiRecommendation.types';
import { AIRecommendationRepository } from '../repositories/AIRecommendationRepository.knex';
import { UserInteractionRepository } from '../repositories/UserInteractionRepository.knex';
import { AIModelMetricRepository } from '../repositories/AIModelMetricRepository.knex';
import { EnhancedRecommendationEngine, UserProfile, RecommendationContext } from './EnhancedRecommendationEngine';
import { recommendationCache } from '../utils/RecommendationCache';

interface AIRecommendationConfig {
  modelName: string;
  modelVersion: string;
  maxRecommendations: number;
  defaultLimit: number;
  cacheTTL: number;
  trendingDays: number;
  maxSimilarUsers: number;
  minConfidenceScore: number;
}

interface CacheEntry {
  data: AIRecommendation[];
  timestamp: number;
  ttl: number;
}

export class AIRecommendationService {
  private aiRecommendationRepo: AIRecommendationRepository;
  private userInteractionRepo: UserInteractionRepository;
  private aiModelMetricRepo: AIModelMetricRepository;
  private enhancedEngine: EnhancedRecommendationEngine;
  private config: AIRecommendationConfig;
  private cache: Map<string, CacheEntry> = new Map();

  constructor(db: Knex, config?: Partial<AIRecommendationConfig>) {
    this.aiRecommendationRepo = new AIRecommendationRepository(db);
    this.userInteractionRepo = new UserInteractionRepository(db);
    this.aiModelMetricRepo = new AIModelMetricRepository(db);
    this.enhancedEngine = new EnhancedRecommendationEngine(db);
    
    this.config = {
      modelName: 'recommendation_engine',
      modelVersion: '2.0.0',
      maxRecommendations: 100,
      defaultLimit: 10,
      cacheTTL: 3600000, // 1 hour in ms
      trendingDays: 7,
      maxSimilarUsers: 50,
      minConfidenceScore: 0.1,
      ...config
    };
  }

  /**
   * Generate AI recommendations for a user with enhanced algorithms
   */
  async generateRecommendations(request: GenerateRecommendationsRequest): Promise<AIRecommendation[]> {
    // Validate input
    this.validateGenerateRequest(request);

    const startTime = Date.now();
    
    try {
      // Check cache first using enhanced cache
      const cached = await recommendationCache.getUserRecommendations(request.userId);
      if (cached) {
        await this.recordMetric('cache_hit', 1);
        return cached;
      }

      // Build user profile for enhanced recommendations
      const userProfile = await this.buildUserProfile(request.userId);
      
      // Create recommendation context
      const context: RecommendationContext = {
        currentTime: new Date(),
        deviceType: request.contextData?.deviceType || 'desktop',
        pageContext: request.contextData?.pageContext || 'home',
        sessionData: request.contextData || {},
        userLocation: request.contextData?.userLocation,
        weatherConditions: request.contextData?.weatherConditions
      };

      // Generate enhanced recommendations
      const allRecommendations = await this.generateEnhancedRecommendations(
        request,
        userProfile,
        context
      );

      // Process and rank recommendations
      const processedRecommendations = this.processRecommendations(
        allRecommendations,
        request.limit || this.config.defaultLimit
      );

      // Create recommendations in database with transaction
      const createdRecommendations = await this.createRecommendationsInTransaction(
        processedRecommendations
      );

      // Cache results using enhanced cache
      await recommendationCache.setUserRecommendations(
        request.userId,
        createdRecommendations,
        this.config.cacheTTL,
        ['user_recommendations', `user_${request.userId}`]
      );

      // Record enhanced metrics
      await this.recordGenerationMetrics(
        createdRecommendations.length,
        Date.now() - startTime,
        request.recommendationTypes,
        userProfile,
        context
      );

      return createdRecommendations;
    } catch (error) {
      await this.recordMetric('generation_error', 1);
      console.error('Error generating recommendations:', error);
      throw new AIRecommendationError('Failed to generate recommendations', 'GENERATION_ERROR');
    }
  }

  /**
   * Get recommendations for a user with caching
   */
  async getRecommendationsForUser(
    userId: string,
    limit: number = 10,
    excludeProductIds: string[] = [],
    types: RecommendationType[] = []
  ): Promise<AIRecommendation[]> {
    this.validateUserId(userId);
    this.validateLimit(limit);

    try {
      return await this.aiRecommendationRepo.getRecommendationsForUser(
        userId,
        limit,
        excludeProductIds,
        types
      );
    } catch (error) {
      console.error('Error getting recommendations for user:', error);
      throw new AIRecommendationError('Failed to get recommendations for user');
    }
  }

  /**
   * Record recommendation interaction with better error handling
   */
  async recordInteraction(
    recommendationId: string,
    actionType: 'click' | 'book',
    context?: Record<string, any>
  ): Promise<boolean> {
    if (!recommendationId || !actionType) {
      throw new AIRecommendationError('Recommendation ID and action type are required', 'VALIDATION_ERROR');
    }

    try {
      let success = false;

      if (actionType === 'click') {
        success = await this.aiRecommendationRepo.recordClick(recommendationId);
      } else if (actionType === 'book') {
        success = await this.aiRecommendationRepo.recordBooking(recommendationId);
      } else {
        throw new AIRecommendationError('Invalid action type', 'VALIDATION_ERROR');
      }

      if (success) {
        // Also record as user interaction
        const recommendation = await this.aiRecommendationRepo.findById(recommendationId);
        if (recommendation) {
          await this.userInteractionRepo.create({
            userId: recommendation.userId,
            sessionId: context?.sessionId,
            actionType: actionType === 'click' ? InteractionActionType.CLICK : InteractionActionType.BOOK,
            targetType: TargetType.PRODUCT,
            targetId: recommendation.productId,
            pageUrl: context?.pageUrl,
            referrerUrl: context?.referrerUrl,
            userAgent: context?.userAgent,
            deviceType: context?.deviceType,
            metadata: {
              recommendationId,
              recommendationType: recommendation.recommendationType,
              confidenceScore: recommendation.confidenceScore,
              ...context?.metadata
            }
          });
        }

        // Record interaction metric
        await this.recordMetric(`interaction_${actionType}`, 1);
      }

      return success;
    } catch (error) {
      console.error('Error recording recommendation interaction:', error);
      throw new AIRecommendationError('Failed to record recommendation interaction');
    }
  }

  /**
   * Track user interaction with validation
   */
  async trackUserInteraction(
    userId: string | undefined,
    sessionId: string | undefined,
    actionType: InteractionActionType,
    targetType?: TargetType,
    targetId?: string,
    context?: {
      pageUrl?: string;
      referrerUrl?: string;
      userAgent?: string;
      deviceType?: DeviceType;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    if (!actionType) {
      throw new UserInteractionError('Action type is required', 'VALIDATION_ERROR');
    }

    try {
      await this.userInteractionRepo.create({
        userId,
        sessionId,
        actionType,
        targetType,
        targetId,
        pageUrl: context?.pageUrl,
        referrerUrl: context?.referrerUrl,
        userAgent: context?.userAgent,
        deviceType: context?.deviceType,
        metadata: context?.metadata
      });

      // Invalidate user's cached profile and recommendations
      if (userId) {
        await recommendationCache.invalidateUser(userId);
      }

      // Record tracking metric
      await this.recordMetric('interaction_tracked', 1);
    } catch (error) {
      console.error('Error tracking user interaction:', error);
      throw new UserInteractionError('Failed to track user interaction', 'TRACKING_ERROR');
    }
  }

  /**
   * Get user behavior analytics with error handling
   */
  async getUserBehaviorAnalytics(userId?: string, timeRange?: { from: Date; to: Date }) {
    try {
      const cacheKey = `behavior_analytics:${userId || 'global'}:${timeRange?.from.getTime() || 'all'}:${timeRange?.to.getTime() || 'all'}`;
      
      // Check cache first
      const cached = await recommendationCache.getAnalytics(cacheKey);
      if (cached) {
        return cached;
      }

      const filters: any = {};
      if (userId) {
        this.validateUserId(userId);
        filters.userId = userId;
      }
      if (timeRange) {
        this.validateTimeRange(timeRange);
        filters.createdAfter = timeRange.from;
        filters.createdBefore = timeRange.to;
      }

      const analytics = await this.userInteractionRepo.getAnalytics(filters);
      
      // Cache the result
      await recommendationCache.setAnalytics(cacheKey, analytics);
      
      return analytics;
    } catch (error) {
      console.error('Error getting user behavior analytics:', error);
      throw new UserInteractionError('Failed to get user behavior analytics');
    }
  }

  /**
   * Get recommendation analytics with error handling
   */
  async getRecommendationAnalytics(userId?: string, timeRange?: { from: Date; to: Date }) {
    try {
      const cacheKey = `rec_analytics:${userId || 'global'}:${timeRange?.from.getTime() || 'all'}:${timeRange?.to.getTime() || 'all'}`;
      
      // Check cache first
      const cached = await recommendationCache.getAnalytics(cacheKey);
      if (cached) {
        return cached;
      }

      const filters: any = {};
      if (userId) {
        this.validateUserId(userId);
        filters.userId = userId;
      }
      if (timeRange) {
        this.validateTimeRange(timeRange);
        filters.createdAfter = timeRange.from;
        filters.createdBefore = timeRange.to;
      }

      const analytics = await this.aiRecommendationRepo.getAnalytics(filters);
      
      // Cache the result
      await recommendationCache.setAnalytics(cacheKey, analytics);
      
      return analytics;
    } catch (error) {
      console.error('Error getting recommendation analytics:', error);
      throw new AIRecommendationError('Failed to get recommendation analytics');
    }
  }

  /**
   * Cleanup expired recommendations
   */
  async cleanupExpiredRecommendations(): Promise<number> {
    try {
      const count = await this.aiRecommendationRepo.cleanupExpiredRecommendations();
      await this.recordMetric('recommendations_cleaned', count);
      return count;
    } catch (error) {
      console.error('Error cleaning up expired recommendations:', error);
      throw new AIRecommendationError('Failed to cleanup expired recommendations');
    }
  }

  /**
   * Get model performance metrics
   */
  async getModelMetrics(modelName?: string, days: number = 30) {
    try {
      const filters: any = {
        dataDateAfter: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      };
      
      if (modelName) {
        filters.modelName = modelName;
      }

      return await this.aiModelMetricRepo.getAnalytics(filters);
    } catch (error) {
      console.error('Error getting model metrics:', error);
      throw new AIModelMetricError('Failed to get model metrics');
    }
  }

  // Private helper methods

  private validateGenerateRequest(request: GenerateRecommendationsRequest): void {
    if (!request.userId) {
      throw new AIRecommendationError('User ID is required', 'VALIDATION_ERROR');
    }
    
    if (request.limit && (request.limit < 1 || request.limit > this.config.maxRecommendations)) {
      throw new AIRecommendationError(
        `Limit must be between 1 and ${this.config.maxRecommendations}`,
        'VALIDATION_ERROR'
      );
    }

    if (request.excludeProductIds && !Array.isArray(request.excludeProductIds)) {
      throw new AIRecommendationError('excludeProductIds must be an array', 'VALIDATION_ERROR');
    }
  }

  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string') {
      throw new AIRecommendationError('Valid user ID is required', 'VALIDATION_ERROR');
    }
  }

  private validateLimit(limit: number): void {
    if (limit < 1 || limit > this.config.maxRecommendations) {
      throw new AIRecommendationError(
        `Limit must be between 1 and ${this.config.maxRecommendations}`,
        'VALIDATION_ERROR'
      );
    }
  }

  private validateTimeRange(timeRange: { from: Date; to: Date }): void {
    if (!timeRange.from || !timeRange.to) {
      throw new AIRecommendationError('Both from and to dates are required', 'VALIDATION_ERROR');
    }
    if (timeRange.from >= timeRange.to) {
      throw new AIRecommendationError('From date must be before to date', 'VALIDATION_ERROR');
    }
  }

  private generateCacheKey(request: GenerateRecommendationsRequest): string {
    const key = `recs:${request.userId}:${(request.recommendationTypes || []).sort().join(',')}:${request.limit || this.config.defaultLimit}:${(request.excludeProductIds || []).sort().join(',')}`;
    return createHash('md5').update(key).digest('hex');
  }

  private getFromCache(key: string): AIRecommendation[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private setCache(key: string, data: AIRecommendation[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.config.cacheTTL
    });
  }

  private async generateAllRecommendations(
    request: GenerateRecommendationsRequest,
    behaviorProfile: any
  ): Promise<CreateAIRecommendationRequest[]> {
    const recommendations: CreateAIRecommendationRequest[] = [];
    const excludeProductIds = request.excludeProductIds || [];

    // Generate different types of recommendations
    const generators = [
      {
        type: RecommendationType.COLLABORATIVE_FILTERING,
        method: () => this.generateCollaborativeFilteringRecommendations(request.userId, behaviorProfile, excludeProductIds)
      },
      {
        type: RecommendationType.CONTENT_BASED,
        method: () => this.generateContentBasedRecommendations(request.userId, behaviorProfile, excludeProductIds)
      },
      {
        type: RecommendationType.BEHAVIOR_BASED,
        method: () => this.generateBehaviorBasedRecommendations(request.userId, behaviorProfile, excludeProductIds)
      },
      {
        type: RecommendationType.TRENDING,
        method: () => this.generateTrendingRecommendations(request.userId, excludeProductIds)
      }
    ];

    for (const generator of generators) {
      if (!request.recommendationTypes || request.recommendationTypes.includes(generator.type)) {
        try {
          const typeRecs = await generator.method();
          recommendations.push(...typeRecs);
        } catch (error) {
          console.error(`Error generating ${generator.type} recommendations:`, error);
          // Continue with other types instead of failing completely
        }
      }
    }

    return recommendations;
  }

  private processRecommendations(
    recommendations: CreateAIRecommendationRequest[],
    limit: number
  ): CreateAIRecommendationRequest[] {
    // Filter by minimum confidence score
    const filtered = recommendations.filter(
      rec => rec.confidenceScore >= this.config.minConfidenceScore
    );

    // Sort by confidence score
    filtered.sort((a, b) => b.confidenceScore - a.confidenceScore);
    
    // Apply ranking positions and limit
    const limited = filtered.slice(0, limit);
    limited.forEach((rec, index) => {
      rec.rankingPosition = index + 1;
    });

    return limited;
  }

  private async createRecommendationsInTransaction(
    recommendations: CreateAIRecommendationRequest[]
  ): Promise<AIRecommendation[]> {
    const createdRecommendations: AIRecommendation[] = [];
    
    // Create recommendations individually
    if (recommendations.length > 0) {
      for (const rec of recommendations) {
        try {
          const created = await this.aiRecommendationRepo.create(rec);
          createdRecommendations.push(created);
        } catch (error) {
          console.error('Error creating individual recommendation:', error);
          // Continue with other recommendations
        }
      }
    }

    return createdRecommendations;
  }

  /**
   * Analyze user behavior patterns with better structure
   */
  private analyzeUserBehavior(interactions: any[]): any {
    const profile: any = {
      totalInteractions: interactions.length,
      actionCounts: {},
      targetCounts: {},
      recentTargets: [],
      deviceTypes: {},
      timePatterns: {},
      preferences: {},
      engagementScore: 0
    };

    if (interactions.length === 0) {
      return profile;
    }

    interactions.forEach(interaction => {
      // Count actions
      profile.actionCounts[interaction.actionType] = 
        (profile.actionCounts[interaction.actionType] || 0) + 1;

      // Count targets
      if (interaction.targetType && interaction.targetId) {
        const targetKey = `${interaction.targetType}:${interaction.targetId}`;
        profile.targetCounts[targetKey] = (profile.targetCounts[targetKey] || 0) + 1;
        
        // Track recent targets (avoid duplicates)
        if (profile.recentTargets.length < 10 && 
            !profile.recentTargets.some((t: any) => t.id === interaction.targetId)) {
          profile.recentTargets.push({
            id: interaction.targetId,
            type: interaction.targetType,
            count: 1
          });
        }
      }

      // Track device types
      if (interaction.deviceType) {
        profile.deviceTypes[interaction.deviceType] = 
          (profile.deviceTypes[interaction.deviceType] || 0) + 1;
      }

      // Track time patterns
      const hour = new Date(interaction.createdAt).getHours();
      profile.timePatterns[hour] = (profile.timePatterns[hour] || 0) + 1;
    });

    // Calculate engagement score
    profile.engagementScore = this.calculateEngagementScore(profile);

    return profile;
  }

  private calculateEngagementScore(profile: any): number {
    const bookings = profile.actionCounts['book'] || 0;
    const clicks = profile.actionCounts['click'] || 0;
    const views = profile.actionCounts['view'] || 0;
    
    // Weighted engagement score
    return (bookings * 10 + clicks * 2 + views * 1) / Math.max(profile.totalInteractions, 1);
  }

  /**
   * Improved collaborative filtering with better logic
   */
  private async generateCollaborativeFilteringRecommendations(
    userId: string,
    behaviorProfile: any,
    excludeProductIds: string[]
  ): Promise<CreateAIRecommendationRequest[]> {
    try {
      // Get users with similar behavior patterns
      const similarUsers = await this.findSimilarUsers(userId, behaviorProfile);
      
      if (similarUsers.length === 0) {
        return this.getFallbackRecommendations(userId, excludeProductIds, RecommendationType.COLLABORATIVE_FILTERING);
      }

      // Get popular products among similar users
      const recommendations = await this.getPopularProductsFromSimilarUsers(
        userId,
        similarUsers,
        excludeProductIds
      );

      return recommendations.slice(0, 3);
    } catch (error) {
      console.error('Error in collaborative filtering:', error);
      return this.getFallbackRecommendations(userId, excludeProductIds, RecommendationType.COLLABORATIVE_FILTERING);
    }
  }

  /**
   * Improved content-based recommendations
   */
  private async generateContentBasedRecommendations(
    userId: string,
    behaviorProfile: any,
    excludeProductIds: string[]
  ): Promise<CreateAIRecommendationRequest[]> {
    try {
      const recentTargets = behaviorProfile.recentTargets || [];
      const productTargets = recentTargets.filter((t: any) => t.type === 'product');

      if (productTargets.length === 0) {
        return this.getFallbackRecommendations(userId, excludeProductIds, RecommendationType.CONTENT_BASED);
      }

      // In a real implementation, this would use product similarity algorithms
      // For now, use a simplified approach based on category/tags
      const recommendations = await this.getSimilarProducts(
        userId,
        productTargets,
        excludeProductIds
      );

      return recommendations.slice(0, 2);
    } catch (error) {
      console.error('Error in content-based recommendations:', error);
      return this.getFallbackRecommendations(userId, excludeProductIds, RecommendationType.CONTENT_BASED);
    }
  }

  /**
   * Improved behavior-based recommendations
   */
  private async generateBehaviorBasedRecommendations(
    userId: string,
    behaviorProfile: any,
    excludeProductIds: string[]
  ): Promise<CreateAIRecommendationRequest[]> {
    try {
      const topActions = Object.entries(behaviorProfile.actionCounts || {})
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 3);

      if (topActions.length === 0) {
        return this.getFallbackRecommendations(userId, excludeProductIds, RecommendationType.BEHAVIOR_BASED);
      }

      // Generate recommendations based on behavior patterns
      const recommendations = await this.getRecommendationsBasedOnBehavior(
        userId,
        behaviorProfile,
        excludeProductIds
      );

      return recommendations.slice(0, 2);
    } catch (error) {
      console.error('Error in behavior-based recommendations:', error);
      return this.getFallbackRecommendations(userId, excludeProductIds, RecommendationType.BEHAVIOR_BASED);
    }
  }

  /**
   * Improved trending recommendations
   */
  private async generateTrendingRecommendations(
    userId: string,
    excludeProductIds: string[]
  ): Promise<CreateAIRecommendationRequest[]> {
    try {
      const trendingTargets = await this.userInteractionRepo.getPopularTargets(
        InteractionActionType.VIEW,
        TargetType.PRODUCT,
        10,
        {
          from: new Date(Date.now() - this.config.trendingDays * 24 * 60 * 60 * 1000),
          to: new Date()
        }
      );

      return trendingTargets
        .filter(target => !excludeProductIds.includes(target.targetId))
        .slice(0, 2)
        .map((target, index) => ({
          userId,
          productId: target.targetId,
          recommendationType: RecommendationType.TRENDING,
          confidenceScore: Math.max(0.6 - (index * 0.1), 0.3),
          reasoning: `Trending product with ${target.count} recent views`,
          context: {
            algorithm: 'trending',
            viewCount: target.count,
            trendingRank: index + 1
          }
        }));
    } catch (error) {
      console.error('Error getting trending products:', error);
      return this.getFallbackRecommendations(userId, excludeProductIds, RecommendationType.TRENDING);
    }
  }

  // Helper methods for improved recommendation algorithms

  private async findSimilarUsers(userId: string, behaviorProfile: any): Promise<string[]> {
    // Simplified implementation - in production, use proper ML algorithms
    try {
      const allUsers = await this.userInteractionRepo.findMany({
        limit: this.config.maxSimilarUsers,
        sortBy: 'created_at',
        sortOrder: 'DESC'
      });

      // Filter out current user and return sample similar users
      return allUsers.interactions
        .filter(interaction => interaction.userId && interaction.userId !== userId)
        .map(interaction => interaction.userId!)
        .slice(0, 10);
    } catch (error) {
      console.error('Error finding similar users:', error);
      return [];
    }
  }

  private async getPopularProductsFromSimilarUsers(
    userId: string,
    similarUsers: string[],
    excludeProductIds: string[]
  ): Promise<CreateAIRecommendationRequest[]> {
    // Simplified implementation
    const sampleProductIds = ['prod_collab_1', 'prod_collab_2', 'prod_collab_3'];
    
    return sampleProductIds
      .filter(id => !excludeProductIds.includes(id))
      .slice(0, 3)
      .map((productId, index) => ({
        userId,
        productId,
        recommendationType: RecommendationType.COLLABORATIVE_FILTERING,
        confidenceScore: Math.max(0.7 - (index * 0.1), 0.4),
        reasoning: `Popular among ${similarUsers.length} similar users`,
        context: {
          algorithm: 'collaborative_filtering',
          similarUserCount: similarUsers.length,
          popularity: Math.random() * 0.5 + 0.5
        }
      }));
  }

  private async getSimilarProducts(
    userId: string,
    productTargets: any[],
    excludeProductIds: string[]
  ): Promise<CreateAIRecommendationRequest[]> {
    // Simplified implementation
    const sampleProductIds = ['prod_content_1', 'prod_content_2'];
    
    return sampleProductIds
      .filter(id => !excludeProductIds.includes(id))
      .map((productId, index) => ({
        userId,
        productId,
        recommendationType: RecommendationType.CONTENT_BASED,
        confidenceScore: Math.max(0.75 - (index * 0.1), 0.5),
        reasoning: `Similar to ${productTargets.length} products you viewed`,
        context: {
          algorithm: 'content_based',
          similarityScore: Math.random() * 0.3 + 0.7,
          basedOnProducts: productTargets.slice(0, 3).map(t => t.id)
        }
      }));
  }

  private async getRecommendationsBasedOnBehavior(
    userId: string,
    behaviorProfile: any,
    excludeProductIds: string[]
  ): Promise<CreateAIRecommendationRequest[]> {
    // Simplified implementation
    const sampleProductIds = ['prod_behavior_1', 'prod_behavior_2'];
    
    return sampleProductIds
      .filter(id => !excludeProductIds.includes(id))
      .map((productId, index) => ({
        userId,
        productId,
        recommendationType: RecommendationType.BEHAVIOR_BASED,
        confidenceScore: Math.max(0.65 - (index * 0.1), 0.35),
        reasoning: `Based on your engagement patterns (score: ${behaviorProfile.engagementScore.toFixed(2)})`,
        context: {
          algorithm: 'behavior_based',
          engagementScore: behaviorProfile.engagementScore,
          totalInteractions: behaviorProfile.totalInteractions
        }
      }));
  }

  private getFallbackRecommendations(
    userId: string,
    excludeProductIds: string[],
    type: RecommendationType
  ): CreateAIRecommendationRequest[] {
    const fallbackProducts = ['fallback_1', 'fallback_2'];
    
    return fallbackProducts
      .filter(id => !excludeProductIds.includes(id))
      .slice(0, 1)
      .map(productId => ({
        userId,
        productId,
        recommendationType: type,
        confidenceScore: 0.2,
        reasoning: 'Fallback recommendation due to insufficient data',
        context: {
          algorithm: 'fallback',
          reason: 'insufficient_data'
        }
      }));
  }

  private async recordMetric(metricName: string, value: number): Promise<void> {
    try {
      await this.aiModelMetricRepo.create({
        modelName: this.config.modelName,
        modelVersion: this.config.modelVersion,
        metricName,
        metricValue: value,
        dataDate: new Date()
      });
    } catch (error) {
      console.error(`Error recording metric ${metricName}:`, error);
      // Don't throw error as this is not critical
    }
  }

  private async recordGenerationMetrics(
    count: number,
    duration: number,
    types?: RecommendationType[],
    userProfile?: UserProfile,
    context?: RecommendationContext
  ): Promise<void> {
    try {
      const baseMetrics = [
        {
          modelName: this.config.modelName,
          modelVersion: this.config.modelVersion,
          metricName: 'recommendations_generated',
          metricValue: count,
          dataDate: new Date()
        },
        {
          modelName: this.config.modelName,
          modelVersion: this.config.modelVersion,
          metricName: 'generation_duration_ms',
          metricValue: duration,
          dataDate: new Date()
        }
      ];

      // Add algorithm-specific metrics
      if (types) {
        types.forEach(type => {
          baseMetrics.push({
            modelName: this.config.modelName,
            modelVersion: this.config.modelVersion,
            metricName: `${type}_generated`,
            metricValue: 1,
            dataDate: new Date()
          });
        });
      }

      // Add user engagement metrics
      if (userProfile) {
        baseMetrics.push({
          modelName: this.config.modelName,
          modelVersion: this.config.modelVersion,
          metricName: 'user_engagement_score',
          metricValue: userProfile.engagementScore,
          dataDate: new Date()
        });
      }

      // Add context metrics
      if (context) {
        baseMetrics.push({
          modelName: this.config.modelName,
          modelVersion: this.config.modelVersion,
          metricName: `device_${context.deviceType}_recommendations`,
          metricValue: 1,
          dataDate: new Date()
        });
      }

      await this.aiModelMetricRepo.bulkCreate(baseMetrics);
    } catch (error) {
      console.error('Error recording generation metrics:', error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Build comprehensive user profile for recommendations
   */
  private async buildUserProfile(userId: string): Promise<UserProfile> {
    try {
      // Check cache first
      const cached = await recommendationCache.getUserProfile(userId);
      if (cached) {
        return cached;
      }

      // Get user's recent interactions
      const interactions = await this.userInteractionRepo.findByUserId(userId, 100, 0);
      
      const profile: UserProfile = {
        userId,
        preferences: {},
        behaviorPatterns: {
          timeOfDay: {},
          dayOfWeek: {},
          sessionDuration: 0,
          devicePreferences: {}
        },
        categories: {},
        priceRange: { min: 0, max: 1000, avg: 100 },
        engagementScore: 0,
        lastActivity: new Date()
      };

      if (interactions.length === 0) {
        await recommendationCache.setUserProfile(userId, profile);
        return profile;
      }

      // Analyze interaction patterns
      this.analyzeInteractionPatterns(interactions, profile);
      
      // Calculate engagement score
      profile.engagementScore = this.calculateAdvancedEngagementScore(interactions);
      
      // Set last activity
      profile.lastActivity = new Date(Math.max(...interactions.map(i => new Date(i.createdAt).getTime())));

      // Cache the profile
      await recommendationCache.setUserProfile(userId, profile);

      return profile;
    } catch (error) {
      console.error('Error building user profile:', error);
      // Return basic profile as fallback
      return {
        userId,
        preferences: {},
        behaviorPatterns: {
          timeOfDay: {},
          dayOfWeek: {},
          sessionDuration: 0,
          devicePreferences: {}
        },
        categories: {},
        priceRange: { min: 0, max: 1000, avg: 100 },
        engagementScore: 0.1,
        lastActivity: new Date()
      };
    }
  }

  /**
   * Generate enhanced recommendations using multiple algorithms
   */
  private async generateEnhancedRecommendations(
    request: GenerateRecommendationsRequest,
    userProfile: UserProfile,
    context: RecommendationContext
  ): Promise<CreateAIRecommendationRequest[]> {
    const excludeProductIds = request.excludeProductIds || [];
    const requestedTypes = request.recommendationTypes || [
      RecommendationType.COLLABORATIVE_FILTERING,
      RecommendationType.CONTENT_BASED,
      RecommendationType.BEHAVIOR_BASED,
      RecommendationType.TRENDING
    ];

    // Use hybrid approach for best results
    if (requestedTypes.length > 1) {
      return await this.enhancedEngine.generateHybridRecommendations(
        request.userId,
        userProfile,
        context,
        excludeProductIds,
        request.limit || this.config.defaultLimit
      );
    }

    // Single algorithm approach
    const type = requestedTypes[0];
    switch (type) {
      case RecommendationType.COLLABORATIVE_FILTERING:
        return await this.enhancedEngine.generateCollaborativeRecommendations(
          request.userId,
          userProfile,
          excludeProductIds,
          request.limit || this.config.defaultLimit
        );
      
      case RecommendationType.CONTENT_BASED:
        return await this.enhancedEngine.generateContentBasedRecommendations(
          request.userId,
          userProfile,
          excludeProductIds,
          request.limit || this.config.defaultLimit
        );
      
      case RecommendationType.BEHAVIOR_BASED:
        return await this.enhancedEngine.generateBehaviorBasedRecommendations(
          request.userId,
          userProfile,
          context,
          excludeProductIds,
          request.limit || this.config.defaultLimit
        );
      
      case RecommendationType.TRENDING:
        return await this.enhancedEngine.generateTrendingRecommendations(
          request.userId,
          excludeProductIds,
          request.limit || this.config.defaultLimit
        );
      
      default:
        return await this.enhancedEngine.generateHybridRecommendations(
          request.userId,
          userProfile,
          context,
          excludeProductIds,
          request.limit || this.config.defaultLimit
        );
    }
  }

  /**
   * Analyze interaction patterns for user profile
   */
  private analyzeInteractionPatterns(interactions: any[], profile: UserProfile): void {
    interactions.forEach(interaction => {
      // Time patterns
      const hour = new Date(interaction.createdAt).getHours();
      const day = new Date(interaction.createdAt).getDay();
      
      profile.behaviorPatterns.timeOfDay[hour] = (profile.behaviorPatterns.timeOfDay[hour] || 0) + 1;
      profile.behaviorPatterns.dayOfWeek[day] = (profile.behaviorPatterns.dayOfWeek[day] || 0) + 1;
      
      // Device preferences
      if (interaction.deviceType) {
        profile.behaviorPatterns.devicePreferences[interaction.deviceType] = 
          (profile.behaviorPatterns.devicePreferences[interaction.deviceType] || 0) + 1;
      }
      
      // Category preferences (would need product category mapping)
      if (interaction.metadata?.category) {
        profile.categories[interaction.metadata.category] = 
          (profile.categories[interaction.metadata.category] || 0) + 1;
      }
      
      // Action preferences
      profile.preferences[interaction.actionType] = 
        (profile.preferences[interaction.actionType] || 0) + 1;
    });

    // Calculate average session duration (simplified)
    profile.behaviorPatterns.sessionDuration = 300; // Default 5 minutes
  }

  /**
   * Calculate advanced engagement score
   */
  private calculateAdvancedEngagementScore(interactions: any[]): number {
    if (interactions.length === 0) return 0.1;

    let score = 0;
    const weights: Record<string, number> = {
      [InteractionActionType.BOOK]: 10,
      [InteractionActionType.CLICK]: 3,
      [InteractionActionType.VIEW]: 1,
      [InteractionActionType.SEARCH]: 2,
      [InteractionActionType.SHARE]: 5,
      [InteractionActionType.FAVORITE]: 4
    };

    interactions.forEach(interaction => {
      const weight = weights[interaction.actionType] || 1;
      score += weight;
    });

    // Normalize by interaction count and time span
    const timeSpan = Math.max(1, this.getTimeSpanDays(interactions));
    const normalizedScore = (score / interactions.length) / timeSpan;
    
    // Cap at 1.0
    return Math.min(normalizedScore, 1.0);
  }

  /**
   * Get time span of interactions in days
   */
  private getTimeSpanDays(interactions: any[]): number {
    if (interactions.length < 2) return 1;
    
    const timestamps = interactions.map(i => new Date(i.createdAt).getTime());
    const min = Math.min(...timestamps);
    const max = Math.max(...timestamps);
    
    return Math.max(1, (max - min) / (1000 * 60 * 60 * 24));
  }

  /**
   * Warm up cache for active users
   */
  async warmUpCache(activeUserIds: string[]): Promise<void> {
    console.log(`🔥 Warming up cache for ${activeUserIds.length} active users...`);
    
    for (const userId of activeUserIds.slice(0, 100)) { // Limit to 100 users
      try {
        // Pre-build user profiles
        await this.buildUserProfile(userId);
        
        // Pre-generate recommendations
        const recommendations = await this.generateRecommendations({
          userId,
          limit: 10,
          recommendationTypes: [
            RecommendationType.COLLABORATIVE_FILTERING,
            RecommendationType.CONTENT_BASED,
            RecommendationType.TRENDING
          ]
        });
        
        console.log(`✅ Warmed up cache for user ${userId}: ${recommendations.length} recommendations`);
      } catch (error) {
        console.warn(`⚠️ Failed to warm up cache for user ${userId}:`, error);
      }
    }
    
    console.log('🎉 Cache warmup completed!');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return recommendationCache.getDetailedStats();
  }

  /**
   * Clear user cache (useful for testing or user data updates)
   */
  async clearUserCache(userId: string): Promise<void> {
    await recommendationCache.invalidateUser(userId);
  }
}
