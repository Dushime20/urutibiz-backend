import { getDatabase } from '@/config/database';
import { ModerationActionData } from '@/types/moderation.types';

export class ModerationActionModel {
  private db = getDatabase();

  /**
   * Create a new moderation action
   */
  async create(data: Omit<ModerationActionData, 'id' | 'createdAt'>): Promise<ModerationActionData> {
    const [action] = await this.db('moderation_actions')
      .insert({
        resource_type: data.resourceType,
        resource_id: data.resourceId,
        action: data.action,
        reason: data.reason,
        moderator_id: data.moderatorId,
        metadata: data.metadata || {},
        created_at: new Date()
      })
      .returning('*');

    return this.mapDbToModel(action);
  }

  /**
   * Get moderation actions for a specific resource
   */
  async getByResource(resourceType: string, resourceId: string): Promise<ModerationActionData[]> {
    const actions = await this.db('moderation_actions')
      .where({ resource_type: resourceType, resource_id: resourceId })
      .orderBy('created_at', 'desc');

    return actions.map(this.mapDbToModel);
  }

  /**
   * Get moderation actions by moderator
   */
  async getByModerator(moderatorId: string, limit = 50, offset = 0): Promise<ModerationActionData[]> {
    const actions = await this.db('moderation_actions')
      .where({ moderator_id: moderatorId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return actions.map(this.mapDbToModel);
  }

  /**
   * Get moderation actions by type
   */
  async getByAction(action: string, limit = 50, offset = 0): Promise<ModerationActionData[]> {
    const actions = await this.db('moderation_actions')
      .where({ action })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return actions.map(this.mapDbToModel);
  }

  /**
   * Get all moderation actions with filters
   */
  async getAll(filters: {
    resourceType?: string;
    action?: string;
    moderatorId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }, limit = 50, offset = 0): Promise<ModerationActionData[]> {
    let query = this.db('moderation_actions');

    if (filters.resourceType) {
      query = query.where('resource_type', filters.resourceType);
    }
    if (filters.action) {
      query = query.where('action', filters.action);
    }
    if (filters.moderatorId) {
      query = query.where('moderator_id', filters.moderatorId);
    }
    if (filters.dateFrom) {
      query = query.where('created_at', '>=', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.where('created_at', '<=', filters.dateTo);
    }

    const actions = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return actions.map(this.mapDbToModel);
  }

  /**
   * Get moderation action by ID
   */
  async getById(id: string): Promise<ModerationActionData | null> {
    const action = await this.db('moderation_actions')
      .where({ id })
      .first();

    return action ? this.mapDbToModel(action) : null;
  }

  /**
   * Get moderation statistics
   */
  async getStats(): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    actionsByResource: Record<string, number>;
    recentActions: number;
  }> {
    const totalActions = await this.db('moderation_actions').count('* as count').first();
    
    const actionsByType = await this.db('moderation_actions')
      .select('action')
      .count('* as count')
      .groupBy('action');
    
    const actionsByResource = await this.db('moderation_actions')
      .select('resource_type')
      .count('* as count')
      .groupBy('resource_type');
    
    const recentActions = await this.db('moderation_actions')
      .where('created_at', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
      .count('* as count')
      .first();

    const actionsByTypeResult: Record<string, number> = {};
    actionsByType.forEach(item => {
      actionsByTypeResult[String(item.action)] = Number(item.count);
    });
    
    const actionsByResourceResult: Record<string, number> = {};
    actionsByResource.forEach(item => {
      actionsByResourceResult[String(item.resource_type)] = Number(item.count);
    });
    
    return {
      totalActions: Number(totalActions?.count || 0),
      actionsByType: actionsByTypeResult,
      actionsByResource: actionsByResourceResult,
      recentActions: Number(recentActions?.count || 0)
    };
  }

  /**
   * Map database record to model
   */
  private mapDbToModel(dbRecord: any): ModerationActionData {
    return {
      id: dbRecord.id,
      resourceType: dbRecord.resource_type,
      resourceId: dbRecord.resource_id,
      action: dbRecord.action,
      reason: dbRecord.reason,
      moderatorId: dbRecord.moderator_id,
      metadata: dbRecord.metadata || {},
      createdAt: dbRecord.created_at
    };
  }
}
