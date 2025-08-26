/**
 * AI Recommendation Controller
 * Handles HTTP requests for AI recommendations and user behavior tracking
 */

import { Request, Response } from 'express';
import { AIRecommendationService } from '../services/AIRecommendationService';
import {
  GenerateRecommendationsRequest,
  RecommendationType,
  InteractionActionType,
  TargetType,
  DeviceType,
  AIRecommendationError,
  UserInteractionError,
  AIModelMetricError
} from '../types/aiRecommendation.types';

export class AIRecommendationController {
  constructor(private aiRecommendationService: AIRecommendationService) {}

  /**
   * Generate AI recommendations for a user
   * POST /api/ai/recommendations/generate
   */
  async generateRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { userId, limit, excludeProductIds, recommendationTypes, contextData } = req.body;

      if (!userId) {
        res.status(400).json({
          error: 'User ID is required',
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      const request: GenerateRecommendationsRequest = {
        userId,
        limit: limit || 10,
        excludeProductIds: excludeProductIds || [],
        recommendationTypes: recommendationTypes || undefined,
        contextData: contextData || {}
      };

      const recommendations = await this.aiRecommendationService.generateRecommendations(request);

      res.status(201).json({
        success: true,
        data: recommendations,
        meta: {
          count: recommendations.length,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error generating recommendations:', error);
      
      if (error instanceof AIRecommendationError) {
        res.status(400).json({
          error: error.message,
          code: error.code
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  }

  /**
   * Get recommendations for a user
   * GET /api/ai/recommendations/user/:userId
   */
  async getRecommendationsForUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { limit, excludeProductIds, types } = req.query;

      if (!userId) {
        res.status(400).json({
          error: 'User ID is required',
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      const parsedLimit = limit ? parseInt(limit as string) : 10;
      const parsedExcludeIds = excludeProductIds 
        ? (excludeProductIds as string).split(',').filter(Boolean)
        : [];
      const parsedTypes = types
        ? (types as string).split(',').filter(Boolean) as RecommendationType[]
        : [];

      const recommendations = await this.aiRecommendationService.getRecommendationsForUser(
        userId,
        parsedLimit,
        parsedExcludeIds,
        parsedTypes
      );

      res.status(200).json({
        success: true,
        data: recommendations,
        meta: {
          count: recommendations.length,
          userId,
          limit: parsedLimit
        }
      });
    } catch (error) {
      console.error('Error getting recommendations for user:', error);
      
      if (error instanceof AIRecommendationError) {
        res.status(400).json({
          error: error.message,
          code: error.code
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  }

  /**
   * Record recommendation interaction
   * POST /api/ai/recommendations/:id/interact
   */
  async recordInteraction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { actionType, context } = req.body;

      if (!id) {
        res.status(400).json({
          error: 'Recommendation ID is required',
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      if (!actionType || !['click', 'book'].includes(actionType)) {
        res.status(400).json({
          error: 'Valid action type (click or book) is required',
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      const success = await this.aiRecommendationService.recordInteraction(
        id,
        actionType,
        context
      );

      if (success) {
        res.status(200).json({
          success: true,
          message: `Recommendation ${actionType} recorded successfully`
        });
      } else {
        res.status(404).json({
          error: 'Recommendation not found or already recorded',
          code: 'NOT_FOUND'
        });
      }
    } catch (error) {
      console.error('Error recording recommendation interaction:', error);
      
      if (error instanceof AIRecommendationError) {
        res.status(400).json({
          error: error.message,
          code: error.code
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  }

  /**
   * Track user interaction
   * POST /api/ai/interactions
   */
  async trackInteraction(req: Request, res: Response): Promise<void> {
    try {
      const {
        userId,
        sessionId,
        actionType,
        targetType,
        targetId,
        pageUrl,
        referrerUrl,
        userAgent,
        deviceType,
        metadata
      } = req.body;

      if (!actionType || !Object.values(InteractionActionType).includes(actionType)) {
        res.status(400).json({
          error: 'Valid action type is required',
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      // Auto-detect device type from user agent if not provided
      let detectedDeviceType = deviceType;
      if (!detectedDeviceType && userAgent) {
        detectedDeviceType = this.detectDeviceType(userAgent);
      }

      await this.aiRecommendationService.trackUserInteraction(
        userId,
        sessionId,
        actionType,
        targetType,
        targetId,
        {
          pageUrl,
          referrerUrl,
          userAgent,
          deviceType: detectedDeviceType,
          metadata
        }
      );

      res.status(201).json({
        success: true,
        message: 'Interaction tracked successfully'
      });
    } catch (error) {
      console.error('Error tracking user interaction:', error);
      
      if (error instanceof UserInteractionError) {
        res.status(400).json({
          error: error.message,
          code: error.code
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  }

  /**
   * List interactions (raw) with filters and pagination
   * GET /api/ai/interactions
   */
  async getInteractions(req: Request, res: Response): Promise<void> {
    try {
      const {
        userId,
        sessionId,
        actionType,
        targetType,
        targetId,
        deviceType,
        createdAfter,
        createdBefore,
        limit,
        offset,
        sortBy,
        sortOrder
      } = req.query as Record<string, string>;

      const filters: any = {};
      if (userId) filters.userId = userId;
      if (sessionId) filters.sessionId = sessionId;
      if (actionType) filters.actionType = actionType;
      if (targetType) filters.targetType = targetType;
      if (targetId) filters.targetId = targetId;
      if (deviceType) filters.deviceType = deviceType;
      if (createdAfter) filters.createdAfter = new Date(createdAfter);
      if (createdBefore) filters.createdBefore = new Date(createdBefore);
      if (limit) filters.limit = Math.min(Math.max(parseInt(limit), 1), 200);
      if (offset) filters.offset = Math.max(parseInt(offset), 0);
      if (sortBy) filters.sortBy = sortBy;
      if (sortOrder) filters.sortOrder = (sortOrder as any);

      const { interactions, total } = await (this.aiRecommendationService as any).userInteractionRepo.findMany(filters);

      res.status(200).json({
        success: true,
        data: interactions,
        meta: {
          total,
          limit: filters.limit || 50,
          offset: filters.offset || 0,
          hasMore: (filters.offset || 0) + (filters.limit || 50) < total
        }
      });
    } catch (error) {
      console.error('Error listing interactions:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get product views aggregated by product
   * GET /api/ai/interactions/products/views
   */
  async getProductViews(req: Request, res: Response): Promise<void> {
    try {
      const { from, to, actionTypes } = req.query as Record<string, string>;

      const timeRange = from && to ? { from: new Date(from), to: new Date(to) } : undefined;
      const actions = actionTypes
        ? (actionTypes.split(',').filter(Boolean))
        : ['view', 'click'];

      const repo = (this.aiRecommendationService as any).userInteractionRepo;
      const results = await repo.getPopularTargets(
        actions[0].toUpperCase(),
        'product',
        1000,
        timeRange
      );

      // If multiple actions requested, merge counts
      if (actions.length > 1) {
        for (let i = 1; i < actions.length; i++) {
          const more = await repo.getPopularTargets(actions[i].toUpperCase(), 'product', 1000, timeRange);
          const map: Record<string, number> = Object.create(null);
          results.forEach(r => { map[r.targetId] = (map[r.targetId] || 0) + r.count; });
          more.forEach(r => { map[r.targetId] = (map[r.targetId] || 0) + r.count; });
          const merged = Object.entries(map).map(([targetId, count]) => ({ targetId, count }));
          merged.sort((a, b) => b.count - a.count);
          // replace results
          (results as any).length = 0;
          (results as any).push(...merged);
        }
      }

      res.status(200).json({
        success: true,
        data: results.map((r: any) => ({ productId: r.targetId, views: r.count })),
        meta: {
          from: timeRange?.from?.toISOString() || null,
          to: timeRange?.to?.toISOString() || null,
          actions
        }
      });
    } catch (error) {
      console.error('Error getting product views:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get user behavior analytics
   * GET /api/ai/analytics/behavior
   */
  async getUserBehaviorAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { userId, from, to } = req.query;

      let timeRange;
      if (from && to) {
        timeRange = {
          from: new Date(from as string),
          to: new Date(to as string)
        };
      } else if (!from && !to) {
        // Default to last 30 days
        timeRange = {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          to: new Date()
        };
      }

      const analytics = await this.aiRecommendationService.getUserBehaviorAnalytics(
        userId as string,
        timeRange
      );

      res.status(200).json({
        success: true,
        data: analytics,
        meta: {
          userId: userId || 'all',
          timeRange: timeRange ? {
            from: timeRange.from.toISOString(),
            to: timeRange.to.toISOString()
          } : null
        }
      });
    } catch (error) {
      console.error('Error getting user behavior analytics:', error);
      
      if (error instanceof UserInteractionError) {
        res.status(400).json({
          error: error.message,
          code: error.code
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  }

  /**
   * Get recommendation analytics
   * GET /api/ai/analytics/recommendations
   */
  async getRecommendationAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { userId, from, to } = req.query;

      let timeRange;
      if (from && to) {
        timeRange = {
          from: new Date(from as string),
          to: new Date(to as string)
        };
      } else if (!from && !to) {
        // Default to last 30 days
        timeRange = {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          to: new Date()
        };
      }

      const analytics = await this.aiRecommendationService.getRecommendationAnalytics(
        userId as string,
        timeRange
      );

      res.status(200).json({
        success: true,
        data: analytics,
        meta: {
          userId: userId || 'all',
          timeRange: timeRange ? {
            from: timeRange.from.toISOString(),
            to: timeRange.to.toISOString()
          } : null
        }
      });
    } catch (error) {
      console.error('Error getting recommendation analytics:', error);
      
      if (error instanceof AIRecommendationError) {
        res.status(400).json({
          error: error.message,
          code: error.code
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  }

  /**
   * Get AI model metrics
   * GET /api/ai/analytics/models
   */
  async getModelMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { modelName, days } = req.query;

      const parsedDays = days ? parseInt(days as string) : 30;

      const metrics = await this.aiRecommendationService.getModelMetrics(
        modelName as string,
        parsedDays
      );

      res.status(200).json({
        success: true,
        data: metrics,
        meta: {
          modelName: modelName || 'all',
          days: parsedDays
        }
      });
    } catch (error) {
      console.error('Error getting model metrics:', error);
      
      if (error instanceof AIModelMetricError) {
        res.status(400).json({
          error: error.message,
          code: error.code
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  }

  /**
   * Cleanup expired recommendations
   * POST /api/ai/recommendations/cleanup
   */
  async cleanupExpiredRecommendations(_req: Request, res: Response): Promise<void> {
    try {
      const deletedCount = await this.aiRecommendationService.cleanupExpiredRecommendations();

      res.status(200).json({
        success: true,
        message: 'Expired recommendations cleaned up successfully',
        data: {
          deletedCount
        }
      });
    } catch (error) {
      console.error('Error cleaning up expired recommendations:', error);
      
      if (error instanceof AIRecommendationError) {
        res.status(400).json({
          error: error.message,
          code: error.code
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  }

  /**
   * Get recommendation types
   * GET /api/ai/recommendations/types
   */
  async getRecommendationTypes(_req: Request, res: Response): Promise<void> {
    try {
      const types = Object.values(RecommendationType);

      res.status(200).json({
        success: true,
        data: types,
        meta: {
          count: types.length
        }
      });
    } catch (error) {
      console.error('Error getting recommendation types:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get interaction action types
   * GET /api/ai/interactions/types
   */
  async getInteractionTypes(_req: Request, res: Response): Promise<void> {
    try {
      const actionTypes = Object.values(InteractionActionType);
      const targetTypes = Object.values(TargetType);
      const deviceTypes = Object.values(DeviceType);

      res.status(200).json({
        success: true,
        data: {
          actionTypes,
          targetTypes,
          deviceTypes
        },
        meta: {
          actionTypesCount: actionTypes.length,
          targetTypesCount: targetTypes.length,
          deviceTypesCount: deviceTypes.length
        }
      });
    } catch (error) {
      console.error('Error getting interaction types:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Detect device type from user agent
   */
  private detectDeviceType(userAgent: string): DeviceType {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return DeviceType.MOBILE;
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return DeviceType.TABLET;
    } else if (ua.includes('windows') || ua.includes('mac') || ua.includes('linux')) {
      return DeviceType.DESKTOP;
    } else {
      return DeviceType.UNKNOWN;
    }
  }
}
