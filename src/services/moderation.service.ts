import { ModerationRule, ModerationConfig, ModerationQueue, ModerationMetrics, ModerationResult, ModerationActionData } from '@/types/moderation.types';
import { getDatabase } from '@/config/database';
import { ModerationActionModel } from '@/models/ModerationAction.model';
import AutoModerationService from './autoModeration.service';

export default class ModerationService {
  private static moderationActionModel = new ModerationActionModel();

  // Config Management
  static async getConfig(): Promise<ModerationConfig> {
    // Return a default config if DB/config not implemented
    return {
      globalSettings: {
        enabled: true,
        defaultSeverity: 'medium',
        humanReviewThreshold: 0.7,
        autoActionThreshold: 0.9,
        appealWindow: 72
      },
      contentModeration: {
        textAnalysis: true,
        imageAnalysis: true,
        languageDetection: true,
        sentimentAnalysis: true,
        topicClassification: true
      },
      behaviorMonitoring: {
        enabled: true,
        trackingWindow: 30,
        anomalyDetection: true,
        patternRecognition: true
      },
      fraudDetection: {
        enabled: true,
        mlModels: true,
        riskThresholds: { low: 0.2, medium: 0.5, high: 0.8 }
      },
      notifications: {
        adminAlerts: true,
        userNotifications: true,
        escalationAlerts: true,
        reportFrequency: 'realtime'
      }
    };
  }

  static async updateConfig(config: ModerationConfig): Promise<ModerationConfig> {
    // Implement config update logic here
    return config;
  }

  static async listRules(): Promise<ModerationRule[]> {
    // Implement rule listing logic here
    return [];
  }

  static async createRule(rule: Omit<ModerationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ModerationRule> {
    // Implement rule creation logic here
    return {
      ...rule,
      id: 'temp-id',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  static async updateRule(id: string, updates: Partial<ModerationRule>): Promise<ModerationRule> {
    // Implement rule update logic here
    return {
      ...updates,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    } as ModerationRule;
  }

  static async deleteRule(id: string): Promise<void> {
    // Implement rule deletion logic here
  }

  static async getQueue(): Promise<ModerationQueue[]> {
    // Implement queue retrieval logic here
    return [];
  }

  static async getMetrics(): Promise<ModerationMetrics> {
    // Implement analytics aggregation logic here
    return getDatabase()('moderation_metrics').orderBy('created_at', 'desc').first();
  }

  static async triggerModeration(payload: any): Promise<ModerationResult> {
    // Manual moderation trigger (content, user, booking, etc)
    return {
      id: payload.resourceId,
      resourceType: payload.resourceType,
      resourceId: payload.resourceId,
      ruleId: '',
      ruleName: 'manual',
      score: 1,
      confidence: 1,
      status: 'pending',
      triggeredConditions: [],
      appliedActions: [],
      reviewRequired: false,
      moderatorId: payload.adminId || '',
      moderatorDecision: undefined,
      moderatorNotes: payload.reason || '',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Moderate a user (ban, suspend, warn, etc)
  static async moderateUser({ userId, adminId, action, reason, duration }: { userId: string, adminId: string, action: string, reason?: string, duration?: number }) {
    const db = getDatabase();
    const user = await db('users').where({ id: userId }).first();
    if (!user) throw new Error('User not found');
    let newStatus = user.status;
    switch (action) {
      case 'ban': newStatus = 'banned'; break;
      case 'suspend': newStatus = 'suspended'; break;
      case 'activate': newStatus = 'active'; break;
      case 'warn': newStatus = user.status; break;
      default: throw new Error('Invalid moderation action');
    }
    await db('users').where({ id: userId }).update({ status: newStatus });
    
    // ✅ Store moderation action with reason
    await this.moderationActionModel.create({
      resourceType: 'user',
      resourceId: userId,
      action: action as any,
      reason: reason,
      moderatorId: adminId,
      metadata: {
        previousStatus: user.status,
        newStatus: newStatus,
        duration: duration
      }
    });

    return {
      id: userId,
      resourceType: 'user',
      resourceId: userId,
      ruleId: '',
      ruleName: action,
      score: 1,
      confidence: 1,
      status: newStatus,
      triggeredConditions: [],
      appliedActions: [{ type: action, duration }],
      reviewRequired: false,
      moderatorId: adminId,
      moderatorDecision: action,
      moderatorNotes: reason,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Moderate a product (approve, reject, flag, etc)
  static async moderateProduct({ productId, adminId, action, reason }: { productId: string, adminId: string, action: string, reason?: string }) {
    const db = getDatabase();
    const product = await db('products').where({ id: productId }).first();
    if (!product) throw new Error('Product not found');
    let newStatus = product.status;
    switch (action) {
      case 'approve': newStatus = 'active'; break;
      case 'reject': newStatus = 'inactive'; break;      // Changed from 'rejected' to 'inactive'
      case 'flag': newStatus = 'suspended'; break;      // Changed from 'flagged' to 'suspended'
      case 'quarantine': newStatus = 'suspended'; break; // Changed from 'quarantined' to 'suspended'
      case 'delete': newStatus = 'deleted'; break;      // Added delete action
      case 'draft': newStatus = 'draft'; break;         // Added draft action
      default: throw new Error('Invalid moderation action');
    }
    await db('products').where({ id: productId }).update({ status: newStatus });
    
    // ✅ Store moderation action with reason
    await this.moderationActionModel.create({
      resourceType: 'product',
      resourceId: productId,
      action: action as any,
      reason: reason,
      moderatorId: adminId,
      metadata: {
        previousStatus: product.status,
        newStatus: newStatus
      }
    });

    return {
      id: productId,
      resourceType: 'product',
      resourceId: productId,
      ruleId: '',
      ruleName: action,
      score: 1,
      confidence: 1,
      status: newStatus,
      triggeredConditions: [],
      appliedActions: [{ type: action }],
      reviewRequired: false,
      moderatorId: adminId,
      moderatorDecision: action,
      moderatorNotes: reason,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // ✅ NEW: Get moderation history for a resource
  static async getModerationHistory(resourceType: string, resourceId: string): Promise<ModerationActionData[]> {
    return await this.moderationActionModel.getByResource(resourceType, resourceId);
  }

  // ✅ NEW: Get moderation actions by moderator
  static async getModeratorActions(moderatorId: string, limit = 50, offset = 0): Promise<ModerationActionData[]> {
    return await this.moderationActionModel.getByModerator(moderatorId, limit, offset);
  }

  // ✅ NEW: Get all moderation actions with filters
  static async getModerationActions(filters: {
    resourceType?: string;
    action?: string;
    moderatorId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }, limit = 50, offset = 0): Promise<ModerationActionData[]> {
    return await this.moderationActionModel.getAll(filters, limit, offset);
  }

  // ✅ NEW: Get moderation statistics
  static async getModerationStats(): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    actionsByResource: Record<string, number>;
    recentActions: number;
  }> {
    return await this.moderationActionModel.getStats();
  }
}
