import { OptimizedBaseRepository } from '@/repositories/BaseRepository.optimized';
import { ServiceResponse } from '@/types';
import { 
  NotificationData, 
  CreateNotificationData, 
  UpdateNotificationData,
  NotificationStatistics,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationPriority
} from '../types';
import { getDatabase } from '@/config/database';

export class NotificationRepository extends OptimizedBaseRepository<NotificationData, CreateNotificationData, UpdateNotificationData> {
  protected readonly tableName = 'notifications';
  protected readonly modelClass = class {
    static fromDb(row: any): any {
      if (!row) return row;
      
      // Map snake_case DB columns to camelCase
      const mapped: any = { ...row };
      const map: Record<string, string> = {
        recipient_id: 'recipientId',
        notification_type: 'notificationType',
        channel_results: 'channelResults',
        scheduled_at: 'scheduledAt',
        delivered_at: 'deliveredAt',
        expires_at: 'expiresAt',
        created_at: 'createdAt',
        updated_at: 'updatedAt',
      };
      
      Object.entries(map).forEach(([snake, camel]) => {
        if (snake in mapped) {
          mapped[camel] = mapped[snake];
          delete mapped[snake];
        }
      });

      // Parse JSON fields
      if (mapped.channels && typeof mapped.channels === 'string') {
        try {
          mapped.channels = JSON.parse(mapped.channels);
        } catch (error) {
          mapped.channels = [];
        }
      }

      if (mapped.data && typeof mapped.data === 'string') {
        try {
          mapped.data = JSON.parse(mapped.data);
        } catch (error) {
          mapped.data = {};
        }
      }

      if (mapped.metadata && typeof mapped.metadata === 'string') {
        try {
          mapped.metadata = JSON.parse(mapped.metadata);
        } catch (error) {
          mapped.metadata = {};
        }
      }

      if (mapped.channelResults && typeof mapped.channelResults === 'string') {
        try {
          mapped.channelResults = JSON.parse(mapped.channelResults);
        } catch (error) {
          mapped.channelResults = {};
        }
      }

      return mapped;
    }
    constructor(public data: any) {}
  } as any;

  /**
   * Create notification with explicit column mapping
   */
  async create(data: CreateNotificationData): Promise<ServiceResponse<NotificationData>> {
    try {
      const db = getDatabase();
      const payload: any = {
        // Some deployments use 'type' (NOT NULL) instead of 'notification_type'
        type: data.type,
        notification_type: data.type,
        recipient_id: data.recipientId,
        // Backward-compat: some schemas use user_id instead of recipient_id
        user_id: data.recipientId,
        title: data.title,
        message: data.message,
        data: data.data ?? null, // JSONB expects object
        priority: data.priority || NotificationPriority.NORMAL,
        channels: data.channels ?? [], // JSONB expects array
        status: data.status || NotificationStatus.PENDING,
        scheduled_at: data.scheduledAt || new Date(),
        delivered_at: data.deliveredAt || null,
        expires_at: data.expiresAt || null,
        metadata: data.metadata ?? null, // JSONB expects object
        channel_results: data.channelResults ?? null, // JSONB expects object
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      };

      const [row] = await db(this.tableName).insert(payload).returning('*');
      return { success: true, data: (this.modelClass as any).fromDb(row) } as any;

    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Update notification
   */
  async update(id: string, data: UpdateNotificationData): Promise<ServiceResponse<NotificationData>> {
    try {
      const db = getDatabase();
      const payload: any = {};

      if (data.title !== undefined) payload.title = data.title;
      if (data.message !== undefined) payload.message = data.message;
      if (data.data !== undefined) payload.data = data.data;
      if (data.priority !== undefined) payload.priority = data.priority;
      if (data.channels !== undefined) payload.channels = data.channels;
      if (data.status !== undefined) payload.status = data.status;
      if (data.scheduledAt !== undefined) payload.scheduled_at = data.scheduledAt;
      if (data.deliveredAt !== undefined) payload.delivered_at = data.deliveredAt;
      if (data.expiresAt !== undefined) payload.expires_at = data.expiresAt;
      if (data.metadata !== undefined) payload.metadata = data.metadata;
      if (data.channelResults !== undefined) payload.channel_results = data.channelResults;
      if (data.isRead !== undefined) payload.is_read = data.isRead;
      if (data.readAt !== undefined) payload.read_at = data.readAt;

      payload.updated_at = db.fn.now();

      const [row] = await db(this.tableName).where({ id }).update(payload).returning('*');
      if (!row) {
        return { success: false, error: 'Notification not found' };
      }

      return { success: true, data: (this.modelClass as any).fromDb(row) } as any;

    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get notifications by recipient
   */
  async getByRecipient(
    recipientId: string,
    filters: {
      status?: NotificationStatus;
      type?: NotificationType;
      priority?: NotificationPriority;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<ServiceResponse<{ data: NotificationData[]; total: number; page: number; limit: number }>> {
    try {
      const { status, type, priority, page = 1, limit = 20 } = filters;
      const db = getDatabase();

      // Introspect columns once to adapt to schema differences
      const columnsInfo = await db(this.tableName).columnInfo();

      // Use the correct recipient column (prefer user_id, fallback to recipient_id)
      const recipientColumn = columnsInfo.user_id ? 'user_id' : 'recipient_id';
      let query = db(this.tableName).where({ [recipientColumn]: recipientId });

      // Optional filters applied only if the column exists
      if (status && columnsInfo.status) {
        query = query.where({ status });
      }

      if (type) {
        if (columnsInfo.type) {
          query = query.where({ type });
        } else if (columnsInfo.notification_type) {
          query = query.where({ notification_type: type });
        }
      }

      if (priority && columnsInfo.priority) {
        query = query.where({ priority });
      }

      const total = await query.clone().count('* as count').first();
      const totalCount = total ? parseInt(total.count as string) : 0;

      const offset = (page - 1) * limit;
      const rows = await query
        .orderBy('created_at', 'desc')
        .offset(offset)
        .limit(limit)
        .select('*');

      const notifications = rows.map(row => (this.modelClass as any).fromDb(row));

      return {
        success: true,
        data: {
          data: notifications,
          total: totalCount,
          page,
          limit
        }
      } as any;

    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get notifications by status
   */
  async getByStatus(status: NotificationStatus): Promise<ServiceResponse<NotificationData[]>> {
    try {
      const db = getDatabase();
      const rows = await db(this.tableName)
        .where({ status })
        .orderBy('created_at', 'desc')
        .select('*');

      const notifications = rows.map(row => (this.modelClass as any).fromDb(row));
      return { success: true, data: notifications } as any;

    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get scheduled notifications
   */
  async getScheduledNotifications(): Promise<ServiceResponse<NotificationData[]>> {
    try {
      const db = getDatabase();
      const now = new Date();
      
      const rows = await db(this.tableName)
        .where({ status: NotificationStatus.SCHEDULED })
        .where('scheduled_at', '<=', now)
        .orderBy('scheduled_at', 'asc')
        .select('*');

      const notifications = rows.map(row => (this.modelClass as any).fromDb(row));
      return { success: true, data: notifications } as any;

    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Mark notification as delivered
   */
  async markAsDelivered(id: string, channelResults?: Record<NotificationChannel, any>): Promise<ServiceResponse<NotificationData>> {
    try {
      const updateData: UpdateNotificationData = {
        status: NotificationStatus.DELIVERED,
        deliveredAt: new Date()
      };

      if (channelResults) {
        updateData.channelResults = channelResults;
      }

      return await this.update(id, updateData);

    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Mark notification as failed
   */
  async markAsFailed(id: string, error?: string): Promise<ServiceResponse<NotificationData>> {
    try {
      const updateData: UpdateNotificationData = {
        status: NotificationStatus.FAILED
      };

      if (error) {
        updateData.metadata = { error };
      }

      return await this.update(id, updateData);

    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get notification statistics
   */
  async getStatistics(userId?: string): Promise<NotificationStatistics> {
    try {
      const db = getDatabase();
      
      let baseQuery = db(this.tableName);
      if (userId) {
        baseQuery = baseQuery.where({ recipient_id: userId });
      }

      // Get total counts
      const total = await baseQuery.clone().count('* as count').first();
      const delivered = await baseQuery.clone().where({ status: NotificationStatus.DELIVERED }).count('* as count').first();
      const pending = await baseQuery.clone().where({ status: NotificationStatus.PENDING }).count('* as count').first();
      const failed = await baseQuery.clone().where({ status: NotificationStatus.FAILED }).count('* as count').first();

      // Get counts by type (support schemas that use either notification_type or type)
      const byTypeRows = await baseQuery.clone()
        .select(db.raw('COALESCE(notification_type, type) AS type'))
        .count('* as count')
        .groupByRaw('COALESCE(notification_type, type)');
      const byType: Record<NotificationType, number> = {} as any;
      byTypeRows.forEach((row: any) => {
        byType[row.type as NotificationType] = parseInt(row.count as string);
      });

      // Get counts by channel (channels stored as VARCHAR[] in notifications)
      const byChannelRows = await baseQuery.clone()
        .select(db.raw('unnest(channels) as channel'))
        .count('* as count')
        .groupBy('channel');
      const byChannel: Record<NotificationChannel, number> = {} as any;
      byChannelRows.forEach((row: any) => {
        byChannel[row.channel as NotificationChannel] = parseInt(row.count as string);
      });

      // Get counts by status
      const byStatusQuery = baseQuery.clone()
        .select('status')
        .count('* as count')
        .groupBy('status');
      const byStatusRows = await byStatusQuery;
      const byStatus: Record<NotificationStatus, number> = {} as any;
      byStatusRows.forEach(row => {
        byStatus[row.status as NotificationStatus] = parseInt(row.count as string);
      });

      // Get counts by priority
      const byPriorityQuery = baseQuery.clone()
        .select('priority')
        .count('* as count')
        .groupBy('priority');
      const byPriorityRows = await byPriorityQuery;
      const byPriority: Record<NotificationPriority, number> = {} as any;
      byPriorityRows.forEach(row => {
        byPriority[row.priority as NotificationPriority] = parseInt(row.count as string);
      });

      return {
        total: total ? parseInt(total.count as string) : 0,
        delivered: delivered ? parseInt(delivered.count as string) : 0,
        pending: pending ? parseInt(pending.count as string) : 0,
        failed: failed ? parseInt(failed.count as string) : 0,
        byType,
        byChannel,
        byStatus,
        byPriority
      };

    } catch (error) {
      console.error('Error getting notification statistics:', error);
      return {
        total: 0,
        delivered: 0,
        pending: 0,
        failed: 0,
        byType: {} as any,
        byChannel: {} as any,
        byStatus: {} as any,
        byPriority: {} as any
      };
    }
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<ServiceResponse<{ deleted: number }>> {
    try {
      const db = getDatabase();
      const now = new Date();

      const result = await db(this.tableName)
        .where('expires_at', '<', now)
        .where('status', 'in', [NotificationStatus.DELIVERED, NotificationStatus.FAILED])
        .del();

      return { success: true, data: { deleted: result } } as any;

    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get notification by ID
   */
  async getById(id: string): Promise<ServiceResponse<NotificationData>> {
    try {
      const db = getDatabase();
      const result = await db(this.tableName)
        .where('id', id)
        .first();

      if (!result) {
        return { success: false, error: 'Notification not found' };
      }

      const notification = this.modelClass.fromDb(result);
      return { success: true, data: notification };

    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Get notifications by type
   */
  async getByType(type: NotificationType, limit: number = 100): Promise<ServiceResponse<NotificationData[]>> {
    try {
      const db = getDatabase();
      const rows = await db(this.tableName)
        .where({ notification_type: type })
        .orderBy('created_at', 'desc')
        .limit(limit)
        .select('*');

      const notifications = rows.map(row => (this.modelClass as any).fromDb(row));
      return { success: true, data: notifications } as any;

    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}
