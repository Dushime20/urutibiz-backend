/**
 * AI Recommendation Repository
 * Handles database operations for AI recommendations system using Knex
 */

import { Knex } from 'knex';
import {
  AIRecommendation,
  CreateAIRecommendationRequest,
  UpdateAIRecommendationRequest,
  AIRecommendationFilters,
  RecommendationAnalytics,
  RecommendationType,
  AIRecommendationError
} from '../types/aiRecommendation.types';

export class AIRecommendationRepository {
  constructor(private db: Knex) {}

  /**
   * Create a new AI recommendation
   */
  async create(recommendation: CreateAIRecommendationRequest): Promise<AIRecommendation> {
    try {
      const [created] = await this.db('ai_recommendations')
        .insert({
          user_id: recommendation.userId,
          product_id: recommendation.productId,
          recommendation_type: recommendation.recommendationType,
          confidence_score: recommendation.confidenceScore,
          ranking_position: recommendation.rankingPosition || null,
          context: recommendation.context ? JSON.stringify(recommendation.context) : null,
          reasoning: recommendation.reasoning || null,
          expires_at: recommendation.expiresAt || null
        })
        .returning('*');

      return this.mapRowToAIRecommendation(created);
    } catch (error) {
      console.error('Error creating AI recommendation:', error);
      throw new AIRecommendationError('Failed to create AI recommendation');
    }
  }

  /**
   * Get AI recommendation by ID
   */
  async findById(id: string): Promise<AIRecommendation | null> {
    try {
      const result = await this.db('ai_recommendations')
        .where('id', id)
        .first();

      return result ? this.mapRowToAIRecommendation(result) : null;
    } catch (error) {
      console.error('Error finding AI recommendation by ID:', error);
      throw new AIRecommendationError('Failed to find AI recommendation');
    }
  }

  /**
   * Get AI recommendations with filters
   */
  async findMany(filters: AIRecommendationFilters = {}): Promise<{
    recommendations: AIRecommendation[];
    total: number;
  }> {
    try {
      let query = this.db('ai_recommendations');

      // Apply filters
      if (filters.userId) {
        query = query.where('user_id', filters.userId);
      }

      if (filters.productId) {
        query = query.where('product_id', filters.productId);
      }

      if (filters.recommendationType) {
        query = query.where('recommendation_type', filters.recommendationType);
      }

      if (filters.minConfidence !== undefined) {
        query = query.where('confidence_score', '>=', filters.minConfidence);
      }

      if (filters.maxConfidence !== undefined) {
        query = query.where('confidence_score', '<=', filters.maxConfidence);
      }

      if (filters.wasClicked !== undefined) {
        query = query.where('was_clicked', filters.wasClicked);
      }

      if (filters.wasBooked !== undefined) {
        query = query.where('was_booked', filters.wasBooked);
      }

      if (filters.isActive) {
        query = query.where(function(this: Knex.QueryBuilder) {
          this.whereNull('expires_at').orWhere('expires_at', '>', new Date());
        });
      }

      if (filters.createdAfter) {
        query = query.where('created_at', '>=', filters.createdAfter);
      }

      if (filters.createdBefore) {
        query = query.where('created_at', '<=', filters.createdBefore);
      }

      // Get total count
      const countQuery = query.clone();
      const [{ count }] = await countQuery.count('* as count');
      const total = parseInt(count as string);

      // Apply sorting and pagination
      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'desc';
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;

      const results = await query
        .orderBy(sortBy, sortOrder)
        .limit(limit)
        .offset(offset);

      const recommendations = results.map(row => this.mapRowToAIRecommendation(row));

      return { recommendations, total };
    } catch (error) {
      console.error('Error finding AI recommendations:', error);
      throw new AIRecommendationError('Failed to find AI recommendations');
    }
  }

  /**
   * Update AI recommendation
   */
  async update(id: string, updates: UpdateAIRecommendationRequest): Promise<AIRecommendation | null> {
    try {
      const updateData: any = {};

      if (updates.confidenceScore !== undefined) {
        updateData.confidence_score = updates.confidenceScore;
      }

      if (updates.rankingPosition !== undefined) {
        updateData.ranking_position = updates.rankingPosition;
      }

      if (updates.context !== undefined) {
        updateData.context = updates.context ? JSON.stringify(updates.context) : null;
      }

      if (updates.reasoning !== undefined) {
        updateData.reasoning = updates.reasoning;
      }

      if (updates.wasClicked !== undefined) {
        updateData.was_clicked = updates.wasClicked;
      }

      if (updates.wasBooked !== undefined) {
        updateData.was_booked = updates.wasBooked;
      }

      if (updates.clickedAt !== undefined) {
        updateData.clicked_at = updates.clickedAt;
      }

      if (updates.expiresAt !== undefined) {
        updateData.expires_at = updates.expiresAt;
      }

      if (Object.keys(updateData).length === 0) {
        throw new AIRecommendationError('No valid fields to update');
      }

      updateData.updated_at = new Date();

      const [updated] = await this.db('ai_recommendations')
        .where('id', id)
        .update(updateData)
        .returning('*');

      return updated ? this.mapRowToAIRecommendation(updated) : null;
    } catch (error) {
      console.error('Error updating AI recommendation:', error);
      throw new AIRecommendationError('Failed to update AI recommendation');
    }
  }

  /**
   * Delete AI recommendation
   */
  async delete(id: string): Promise<boolean> {
    try {
      const deletedCount = await this.db('ai_recommendations')
        .where('id', id)
        .del();

      return deletedCount > 0;
    } catch (error) {
      console.error('Error deleting AI recommendation:', error);
      throw new AIRecommendationError('Failed to delete AI recommendation');
    }
  }

  /**
   * Record recommendation click
   */
  async recordClick(id: string): Promise<boolean> {
    try {
      const updatedCount = await this.db('ai_recommendations')
        .where('id', id)
        .where('was_clicked', false)
        .update({
          was_clicked: true,
          clicked_at: new Date(),
          updated_at: new Date()
        });

      return updatedCount > 0;
    } catch (error) {
      console.error('Error recording recommendation click:', error);
      throw new AIRecommendationError('Failed to record recommendation click');
    }
  }

  /**
   * Record recommendation booking
   */
  async recordBooking(id: string): Promise<boolean> {
    try {
      const updatedCount = await this.db('ai_recommendations')
        .where('id', id)
        .where('was_booked', false)
        .update({
          was_booked: true,
          updated_at: new Date()
        });

      return updatedCount > 0;
    } catch (error) {
      console.error('Error recording recommendation booking:', error);
      throw new AIRecommendationError('Failed to record recommendation booking');
    }
  }

  /**
   * Get recommendations for a user
   */
  async getRecommendationsForUser(
    userId: string,
    limit: number = 10,
    excludeProductIds: string[] = [],
    types: RecommendationType[] = []
  ): Promise<AIRecommendation[]> {
    try {
      let query = this.db('ai_recommendations')
        .where('user_id', userId)
        .where(function(this: Knex.QueryBuilder) {
          this.whereNull('expires_at').orWhere('expires_at', '>', new Date());
        });

      if (excludeProductIds.length > 0) {
        query = query.whereNotIn('product_id', excludeProductIds);
      }

      if (types.length > 0) {
        query = query.whereIn('recommendation_type', types);
      }

      const results = await query
        .orderBy('confidence_score', 'desc')
        .orderBy('ranking_position', 'asc')
        .orderBy('created_at', 'desc')
        .limit(limit);

      return results.map(row => this.mapRowToAIRecommendation(row));
    } catch (error) {
      console.error('Error getting recommendations for user:', error);
      throw new AIRecommendationError('Failed to get recommendations for user');
    }
  }

  /**
   * Get recommendation analytics
   */
  async getAnalytics(filters: AIRecommendationFilters = {}): Promise<RecommendationAnalytics> {
    try {
      let baseQuery = this.db('ai_recommendations');

      // Apply filters
      if (filters.userId) {
        baseQuery = baseQuery.where('user_id', filters.userId);
      }

      if (filters.createdAfter) {
        baseQuery = baseQuery.where('created_at', '>=', filters.createdAfter);
      }

      if (filters.createdBefore) {
        baseQuery = baseQuery.where('created_at', '<=', filters.createdBefore);
      }

      // Overall metrics
      const [overallMetrics] = await baseQuery.clone()
        .count('* as total_recommendations')
        .avg('confidence_score as avg_confidence')
        .sum('was_clicked as total_clicks')
        .sum('was_booked as total_bookings');

      const totalRecommendations = parseInt(overallMetrics.total_recommendations as string);
      const totalClicks = parseInt(overallMetrics.total_clicks as string) || 0;
      const totalBookings = parseInt(overallMetrics.total_bookings as string) || 0;

      // Performance by type
      const typePerformance = await baseQuery.clone()
        .select('recommendation_type')
        .count('* as count')
        .sum('was_clicked as clicks')
        .sum('was_booked as bookings')
        .groupBy('recommendation_type')
        .orderBy('count', 'desc');

      // Performance by date
      const datePerformance = await baseQuery.clone()
        .select(this.db.raw('DATE(created_at) as date'))
        .count('* as recommendations')
        .sum('was_clicked as clicks')
        .sum('was_booked as bookings')
        .groupBy(this.db.raw('DATE(created_at)'))
        .orderBy('date', 'desc')
        .limit(30);

      return {
        totalRecommendations,
        clickThroughRate: totalRecommendations > 0 ? (totalClicks / totalRecommendations) * 100 : 0,
        conversionRate: totalRecommendations > 0 ? (totalBookings / totalRecommendations) * 100 : 0,
        averageConfidenceScore: parseFloat(overallMetrics.avg_confidence as string) || 0,
        topPerformingTypes: typePerformance.map((row: any) => ({
          type: row.recommendation_type as RecommendationType,
          count: parseInt(row.count as string),
          ctr: parseInt(row.count as string) > 0 ? (parseInt(row.clicks as string) / parseInt(row.count as string)) * 100 : 0,
          conversionRate: parseInt(row.count as string) > 0 ? (parseInt(row.bookings as string) / parseInt(row.count as string)) * 100 : 0
        })),
        performanceByDate: datePerformance.map((row: any) => ({
          date: row.date,
          recommendations: parseInt(row.recommendations as string),
          clicks: parseInt(row.clicks as string),
          bookings: parseInt(row.bookings as string)
        }))
      };
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
      const deletedCount = await this.db('ai_recommendations')
        .whereNotNull('expires_at')
        .where('expires_at', '<', new Date())
        .del();

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up expired recommendations:', error);
      throw new AIRecommendationError('Failed to cleanup expired recommendations');
    }
  }

  /**
   * Map database row to AIRecommendation object
   */
  private mapRowToAIRecommendation(row: any): AIRecommendation {
    return {
      id: row.id,
      userId: row.user_id,
      productId: row.product_id,
      recommendationType: row.recommendation_type as RecommendationType,
      confidenceScore: parseFloat(row.confidence_score),
      rankingPosition: row.ranking_position,
      context: row.context ? JSON.parse(row.context) : undefined,
      reasoning: row.reasoning,
      wasClicked: row.was_clicked,
      wasBooked: row.was_booked,
      clickedAt: row.clicked_at ? new Date(row.clicked_at) : undefined,
      createdAt: new Date(row.created_at),
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined
    };
  }
}
