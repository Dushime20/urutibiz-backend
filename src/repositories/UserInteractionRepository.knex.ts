/**
 * User Interaction Repository
 * Handles database operations for user behavior tracking using Knex
 */

import { Knex } from 'knex';
import {
  UserInteraction,
  CreateUserInteractionRequest,
  UserInteractionFilters,
  UserBehaviorAnalytics,
  InteractionActionType,
  TargetType,
  DeviceType,
  UserInteractionError
} from '../types/aiRecommendation.types';

export class UserInteractionRepository {
  constructor(private db: Knex) {}

  /**
   * Safely stringify metadata for storage
   */
  private static serializeMetadata(metadata: any): string | null {
    if (metadata == null) return null;
    // If already a string, ensure it's valid JSON; if not, wrap into an object
    if (typeof metadata === 'string') {
      const trimmed = metadata.trim();
      try {
        // If it's valid JSON, store as-is
        JSON.parse(trimmed);
        return trimmed;
      } catch (_err) {
        // Store as { value: "original" }
        return JSON.stringify({ value: metadata });
      }
    }
    // If it's an object/array/primitive, stringify safely
    try {
      return JSON.stringify(metadata);
    } catch (_err) {
      return JSON.stringify({ value: String(metadata) });
    }
  }

  /**
   * Safely parse JSON that might not be JSON
   */
  private static safeParseJson<T = any>(value: any): T | undefined {
    if (value == null) return undefined;
    if (typeof value === 'object') return value as T;
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    const looksLikeJson = (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
                          (trimmed.startsWith('[') && trimmed.endsWith(']'));
    if (!looksLikeJson) return undefined;
    try {
      return JSON.parse(trimmed) as T;
    } catch (_err) {
      return undefined;
    }
  }

  /**
   * Create a new user interaction
   */
  async create(interaction: CreateUserInteractionRequest): Promise<UserInteraction> {
    try {
      const [created] = await this.db('user_interactions')
        .insert({
          user_id: interaction.userId || null,
          session_id: interaction.sessionId || null,
          action_type: interaction.actionType,
          target_type: interaction.targetType || null,
          target_id: interaction.targetId || null,
          page_url: interaction.pageUrl || null,
          referrer_url: interaction.referrerUrl || null,
          user_agent: interaction.userAgent || null,
          device_type: interaction.deviceType || null,
          metadata: UserInteractionRepository.serializeMetadata(interaction.metadata)
        })
        .returning('*');

      return this.mapRowToUserInteraction(created);
    } catch (error) {
      console.error('Error creating user interaction:', error);
      throw new UserInteractionError('Failed to create user interaction');
    }
  }

  /**
   * Get user interaction by ID
   */
  async findById(id: string): Promise<UserInteraction | null> {
    try {
      const result = await this.db('user_interactions')
        .where('id', id)
        .first();

      return result ? this.mapRowToUserInteraction(result) : null;
    } catch (error) {
      console.error('Error finding user interaction by ID:', error);
      throw new UserInteractionError('Failed to find user interaction');
    }
  }

  /**
   * Get user interactions with filters
   */
  async findMany(filters: UserInteractionFilters = {}): Promise<{
    interactions: UserInteraction[];
    total: number;
  }> {
    try {
      let query = this.db('user_interactions');

      // Apply filters
      if (filters.userId) {
        query = query.where('user_id', filters.userId);
      }

      if (filters.sessionId) {
        query = query.where('session_id', filters.sessionId);
      }

      if (filters.actionType) {
        query = query.where('action_type', filters.actionType);
      }

      if (filters.targetType) {
        query = query.where('target_type', filters.targetType);
      }

      if (filters.targetId) {
        query = query.where('target_id', filters.targetId);
      }

      if (filters.deviceType) {
        query = query.where('device_type', filters.deviceType);
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

      const interactions = results.map(row => this.mapRowToUserInteraction(row));

      return { interactions, total };
    } catch (error) {
      console.error('Error finding user interactions:', error);
      throw new UserInteractionError('Failed to find user interactions');
    }
  }

  /**
   * Get user interactions for a specific user
   */
  async findByUserId(userId: string, limit: number = 50, offset: number = 0): Promise<UserInteraction[]> {
    try {
      const results = await this.db('user_interactions')
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      return results.map(row => this.mapRowToUserInteraction(row));
    } catch (error) {
      console.error('Error finding user interactions by user ID:', error);
      throw new UserInteractionError('Failed to find user interactions by user ID');
    }
  }

  /**
   * Get user interactions for a specific session
   */
  async findBySessionId(sessionId: string, limit: number = 50, offset: number = 0): Promise<UserInteraction[]> {
    try {
      const results = await this.db('user_interactions')
        .where('session_id', sessionId)
        .orderBy('created_at', 'asc')
        .limit(limit)
        .offset(offset);

      return results.map(row => this.mapRowToUserInteraction(row));
    } catch (error) {
      console.error('Error finding user interactions by session ID:', error);
      throw new UserInteractionError('Failed to find user interactions by session ID');
    }
  }

  /**
   * Get user interactions for a specific target
   */
  async findByTarget(targetType: TargetType, targetId: string, limit: number = 50): Promise<UserInteraction[]> {
    try {
      const results = await this.db('user_interactions')
        .where('target_type', targetType)
        .where('target_id', targetId)
        .orderBy('created_at', 'desc')
        .limit(limit);

      return results.map(row => this.mapRowToUserInteraction(row));
    } catch (error) {
      console.error('Error finding user interactions by target:', error);
      throw new UserInteractionError('Failed to find user interactions by target');
    }
  }

  /**
   * Delete user interaction
   */
  async delete(id: string): Promise<boolean> {
    try {
      const deletedCount = await this.db('user_interactions')
        .where('id', id)
        .del();

      return deletedCount > 0;
    } catch (error) {
      console.error('Error deleting user interaction:', error);
      throw new UserInteractionError('Failed to delete user interaction');
    }
  }

  /**
   * Get user behavior analytics
   */
  async getAnalytics(filters: UserInteractionFilters = {}): Promise<UserBehaviorAnalytics> {
    try {
      let baseQuery = this.db('user_interactions');

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
        .count('* as total_interactions')
        .countDistinct('user_id as unique_users')
        .countDistinct('session_id as unique_sessions');

      const totalInteractions = parseInt(overallMetrics.total_interactions as string);

      // Top actions
      const topActions = await baseQuery.clone()
        .select('action_type')
        .count('* as count')
        .groupBy('action_type')
        .orderBy('count', 'desc');

      // Device breakdown
      const deviceBreakdown = await baseQuery.clone()
        .select(this.db.raw('COALESCE(device_type, \'unknown\') as device_type'))
        .count('* as count')
        .groupBy('device_type')
        .orderBy('count', 'desc');

      // Hourly activity
      const hourlyActivity = await baseQuery.clone()
        .select(this.db.raw('EXTRACT(HOUR FROM created_at) as hour'))
        .count('* as interactions')
        .groupBy(this.db.raw('EXTRACT(HOUR FROM created_at)'))
        .orderBy('hour');

      return {
        totalInteractions,
        uniqueUsers: parseInt(overallMetrics.unique_users as string),
        uniqueSessions: parseInt(overallMetrics.unique_sessions as string),
        topActions: topActions.map((row: any) => ({
          actionType: row.action_type as InteractionActionType,
          count: parseInt(row.count as string),
          percentage: totalInteractions > 0 ? (parseInt(row.count as string) / totalInteractions) * 100 : 0
        })),
        deviceBreakdown: deviceBreakdown.map((row: any) => ({
          deviceType: row.device_type as DeviceType,
          count: parseInt(row.count as string),
          percentage: totalInteractions > 0 ? (parseInt(row.count as string) / totalInteractions) * 100 : 0
        })),
        hourlyActivity: Array.from({ length: 24 }, (_, hour) => {
          const hourData = hourlyActivity.find((row: any) => parseInt(row.hour as string) === hour);
          return {
            hour,
            interactions: hourData ? parseInt(hourData.interactions as string) : 0
          };
        })
      };
    } catch (error) {
      console.error('Error getting user behavior analytics:', error);
      throw new UserInteractionError('Failed to get user behavior analytics');
    }
  }

  /**
   * Get user journey for a session
   */
  async getSessionJourney(sessionId: string): Promise<UserInteraction[]> {
    try {
      const results = await this.db('user_interactions')
        .where('session_id', sessionId)
        .orderBy('created_at', 'asc');

      return results.map(row => this.mapRowToUserInteraction(row));
    } catch (error) {
      console.error('Error getting session journey:', error);
      throw new UserInteractionError('Failed to get session journey');
    }
  }

  /**
   * Get popular targets by action type
   */
  async getPopularTargets(
    actionType: InteractionActionType,
    targetType?: TargetType,
    limit: number = 10,
    timeRange?: { from: Date; to: Date }
  ): Promise<Array<{ targetId: string; count: number; targetType?: TargetType }>> {
    try {
      let query = this.db('user_interactions')
        .select('target_id', 'target_type')
        .count('* as count')
        .where('action_type', actionType)
        .whereNotNull('target_id');

      if (targetType) {
        query = query.where('target_type', targetType);
      }

      if (timeRange) {
        query = query.where('created_at', '>=', timeRange.from)
                   .where('created_at', '<=', timeRange.to);
      }

      const results = await query
        .groupBy('target_id', 'target_type')
        .orderBy('count', 'desc')
        .limit(limit);

      return results.map((row: any) => ({
        targetId: String(row.target_id),
        targetType: row.target_type as TargetType,
        count: parseInt(row.count as string)
      }));
    } catch (error) {
      console.error('Error getting popular targets:', error);
      throw new UserInteractionError('Failed to get popular targets');
    }
  }

  /**
   * Cleanup old interactions (older than specified days)
   */
  async cleanupOldInteractions(olderThanDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      
      const deletedCount = await this.db('user_interactions')
        .where('created_at', '<', cutoffDate)
        .del();

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old interactions:', error);
      throw new UserInteractionError('Failed to cleanup old interactions');
    }
  }

  /**
   * Map database row to UserInteraction object
   */
  private mapRowToUserInteraction(row: any): UserInteraction {
    return {
      id: row.id,
      userId: row.user_id,
      sessionId: row.session_id,
      actionType: row.action_type as InteractionActionType,
      targetType: row.target_type as TargetType,
      targetId: row.target_id,
      pageUrl: row.page_url,
      referrerUrl: row.referrer_url,
      userAgent: row.user_agent,
      deviceType: row.device_type as DeviceType,
      metadata: UserInteractionRepository.safeParseJson(row.metadata),
      createdAt: new Date(row.created_at)
    };
  }
}
