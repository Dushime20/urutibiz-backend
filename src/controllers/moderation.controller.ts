import { Request, Response } from 'express';
import { ModerationRule, ModerationConfig } from '@/types/moderation.types';
import ModerationService from '@/services/moderation.service';
import { ResponseHelper } from '@/utils/response';
import logger from '@/utils/logger';

/**
 * Moderation Controller for Automated Moderation Workflows
 */
export default class ModerationController {
  /**
   * Get current moderation config
   */
  static async getConfig(req: Request, res: Response) {
    try {
      const config = await ModerationService.getConfig();
      return ResponseHelper.success(res, 'Moderation configuration retrieved successfully', config);
    } catch (error: any) {
      logger.error(`Error in getConfig: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve moderation configuration', error);
    }
  }

  /**
   * Update moderation config
   */
  static async updateConfig(req: Request, res: Response) {
    try {
      const updated = await ModerationService.updateConfig(req.body);
      return ResponseHelper.success(res, 'Moderation configuration updated successfully', updated);
    } catch (error: any) {
      logger.error(`Error in updateConfig: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to update moderation configuration', error);
    }
  }

  /**
   * List moderation rules
   */
  static async listRules(req: Request, res: Response) {
    try {
      const rules = await ModerationService.listRules();
      return ResponseHelper.success(res, 'Moderation rules retrieved successfully', rules);
    } catch (error: any) {
      logger.error(`Error in listRules: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve moderation rules', error);
    }
  }

  /**
   * Create a moderation rule
   */
  static async createRule(req: Request, res: Response) {
    try {
      const rule = await ModerationService.createRule(req.body);
      return ResponseHelper.success(res, 'Moderation rule created successfully', rule, 201);
    } catch (error: any) {
      logger.error(`Error in createRule: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to create moderation rule', error);
    }
  }

  /**
   * Update a moderation rule
   */
  static async updateRule(req: Request, res: Response) {
    try {
      const rule = await ModerationService.updateRule(req.params.id, req.body);
      return ResponseHelper.success(res, 'Moderation rule updated successfully', rule);
    } catch (error: any) {
      logger.error(`Error in updateRule: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to update moderation rule', error);
    }
  }

  /**
   * Delete a moderation rule
   */
  static async deleteRule(req: Request, res: Response) {
    try {
      await ModerationService.deleteRule(req.params.id);
      return ResponseHelper.success(res, 'Moderation rule deleted successfully', null, 204);
    } catch (error: any) {
      logger.error(`Error in deleteRule: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to delete moderation rule', error);
    }
  }

  /**
   * Get moderation queue
   */
  static async getQueue(req: Request, res: Response) {
    try {
      const queue = await ModerationService.getQueue();
      return ResponseHelper.success(res, 'Moderation queue retrieved successfully', queue);
    } catch (error: any) {
      logger.error(`Error in getQueue: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve moderation queue', error);
    }
  }

  /**
   * Get moderation metrics
   */
  static async getMetrics(req: Request, res: Response) {
    try {
      const metrics = await ModerationService.getMetrics();
      return ResponseHelper.success(res, 'Moderation metrics retrieved successfully', metrics);
    } catch (error: any) {
      logger.error(`Error in getMetrics: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve moderation metrics', error);
    }
  }

  /**
   * Manual moderation trigger
   */
  static async triggerModeration(req: Request, res: Response) {
    try {
      const result = await ModerationService.triggerModeration(req.body);
      return ResponseHelper.success(res, 'Moderation triggered successfully', result);
    } catch (error: any) {
      logger.error(`Error in triggerModeration: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to trigger moderation', error);
    }
  }

  // ✅ NEW: Get moderation history for a resource
  static async getModerationHistory(req: Request, res: Response) {
    try {
      const { resourceType, resourceId } = req.params;
      const history = await ModerationService.getModerationHistory(resourceType, resourceId);
      return ResponseHelper.success(res, 'Moderation history retrieved successfully', history);
    } catch (error: any) {
      logger.error(`Error in getModerationHistory: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve moderation history', error);
    }
  }

  // ✅ NEW: Get moderation actions by moderator
  static async getModeratorActions(req: Request, res: Response) {
    try {
      const { moderatorId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      const actions = await ModerationService.getModeratorActions(
        moderatorId, 
        Number(limit), 
        Number(offset)
      );
      return ResponseHelper.success(res, 'Moderator actions retrieved successfully', actions);
    } catch (error: any) {
      logger.error(`Error in getModeratorActions: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve moderator actions', error);
    }
  }

  // ✅ NEW: Get all moderation actions with filters
  static async getModerationActions(req: Request, res: Response) {
    try {
      const { limit = 50, offset = 0, resourceType, action, moderatorId, dateFrom, dateTo } = req.query;
      
      const filters: any = {};
      if (resourceType) filters.resourceType = resourceType as string;
      if (action) filters.action = action as string;
      if (moderatorId) filters.moderatorId = moderatorId as string;
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);

      const actions = await ModerationService.getModerationActions(
        filters, 
        Number(limit), 
        Number(offset)
      );
      return ResponseHelper.success(res, 'Moderation actions retrieved successfully', actions);
    } catch (error: any) {
      logger.error(`Error in getModerationActions: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve moderation actions', error);
    }
  }

  // ✅ NEW: Get moderation statistics
  static async getModerationStats(req: Request, res: Response) {
    try {
      const stats = await ModerationService.getModerationStats();
      return ResponseHelper.success(res, 'Moderation statistics retrieved successfully', stats);
    } catch (error: any) {
      logger.error(`Error in getModerationStats: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve moderation statistics', error);
    }
  }
}
