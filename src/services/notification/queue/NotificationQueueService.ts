import { QueuedNotification } from '../types';
import { Logger } from '@/utils/logger';
import { getDatabase } from '@/config/database';

export class NotificationQueueService {
  private logger: Logger;
  private tableName = 'notification_queue';

  constructor() {
    this.logger = new Logger('NotificationQueueService');
  }

  /**
   * Schedule notification for later processing
   */
  async scheduleNotification(notificationId: string, scheduledAt: Date): Promise<boolean> {
    try {
      const db = getDatabase();
      
      await db(this.tableName).insert({
        notification_id: notificationId,
        scheduled_at: scheduledAt,
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      });

      this.logger.info('Notification scheduled', { notificationId, scheduledAt });
      return true;

    } catch (error) {
      this.logger.error('Failed to schedule notification', { error: error instanceof Error ? error.message : String(error), notificationId });
      return false;
    }
  }

  /**
   * Get notifications that are due for processing
   */
  async getDueNotifications(): Promise<QueuedNotification[]> {
    try {
      const db = getDatabase();
      const now = new Date();

      const rows = await db(this.tableName)
        .where({ status: 'pending' })
        .where('scheduled_at', '<=', now)
        .where('attempts', '<', db.ref('max_attempts'))
        .orderBy('scheduled_at', 'asc')
        .select('*');

      return rows.map(row => this.mapFromDb(row));

    } catch (error) {
      this.logger.error('Failed to get due notifications', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  /**
   * Mark notification as being processed
   */
  async markAsProcessing(id: string): Promise<boolean> {
    try {
      const db = getDatabase();
      
      await db(this.tableName)
        .where({ id })
        .update({
          status: 'processing',
          last_attempt_at: db.fn.now(),
          updated_at: db.fn.now()
        });

      return true;

    } catch (error) {
      this.logger.error('Failed to mark notification as processing', { error: error instanceof Error ? error.message : String(error), id });
      return false;
    }
  }

  /**
   * Mark notification as processed successfully
   */
  async markProcessed(id: string): Promise<boolean> {
    try {
      const db = getDatabase();
      
      await db(this.tableName)
        .where({ id })
        .update({
          status: 'completed',
          updated_at: db.fn.now()
        });

      return true;

    } catch (error) {
      this.logger.error('Failed to mark notification as processed', { error: error instanceof Error ? error.message : String(error), id });
      return false;
    }
  }

  /**
   * Mark notification as failed
   */
  async markFailed(id: string, errorMessage: string): Promise<boolean> {
    try {
      const db = getDatabase();
      
      await db(this.tableName)
        .where({ id })
        .update({
          status: 'failed',
          error_message: errorMessage,
          updated_at: db.fn.now()
        });

      return true;

    } catch (error) {
      this.logger.error('Failed to mark notification as failed', { error: error instanceof Error ? error.message : String(error), id });
      return false;
    }
  }

  /**
   * Increment attempt count for a notification
   */
  async incrementAttempts(id: string): Promise<boolean> {
    try {
      const db = getDatabase();
      
      await db(this.tableName)
        .where({ id })
        .increment('attempts', 1);

      return true;

    } catch (error) {
      this.logger.error('Failed to increment attempts', { error: error instanceof Error ? error.message : String(error), id });
      return false;
    }
  }

  /**
   * Get failed notifications for retry
   */
  async getFailedNotifications(): Promise<QueuedNotification[]> {
    try {
      const db = getDatabase();
      
      const rows = await db(this.tableName)
        .where({ status: 'failed' })
        .where('attempts', '<', db.ref('max_attempts'))
        .orderBy('updated_at', 'desc')
        .select('*');

      return rows.map(row => this.mapFromDb(row));

    } catch (error) {
      this.logger.error('Failed to get failed notifications', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  /**
   * Retry failed notification
   */
  async retryNotification(id: string): Promise<boolean> {
    try {
      const db = getDatabase();
      
      await db(this.tableName)
        .where({ id })
        .update({
          status: 'pending',
          error_message: null,
          updated_at: db.fn.now()
        });

      this.logger.info('Notification retry scheduled', { id });
      return true;

    } catch (error) {
      this.logger.error('Failed to retry notification', { error: error instanceof Error ? error.message : String(error), id });
      return false;
    }
  }

  /**
   * Clean up old completed/failed notifications
   */
  async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    try {
      const db = getDatabase();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await db(this.tableName)
        .whereIn('status', ['completed', 'failed'])
        .where('updated_at', '<', cutoffDate)
        .del();

      this.logger.info('Cleaned up old notifications', { deleted: result, daysOld });
      return result;

    } catch (error) {
      this.logger.error('Failed to cleanup old notifications', { error: error instanceof Error ? error.message : String(error) });
      return 0;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStatistics(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    try {
      const db = getDatabase();
      
      const stats = await db(this.tableName)
        .select('status')
        .count('* as count')
        .groupBy('status');

      const result = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: 0
      };

      stats.forEach(stat => {
        const status = stat.status as string;
        const count = parseInt(stat.count as string);
        
        if (status in result) {
          result[status as keyof typeof result] = count;
        }
        result.total += count;
      });

      return result;

    } catch (error) {
      this.logger.error('Failed to get queue statistics', { error: error instanceof Error ? error.message : String(error) });
      return {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: 0
      };
    }
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(id: string): Promise<QueuedNotification | null> {
    try {
      const db = getDatabase();
      
      const row = await db(this.tableName)
        .where({ id })
        .select('*')
        .first();

      return row ? this.mapFromDb(row) : null;

    } catch (error) {
      this.logger.error('Failed to get notification by ID', { error: error instanceof Error ? error.message : String(error), id });
      return null;
    }
  }

  /**
   * Map database row to QueuedNotification
   */
  private mapFromDb(row: any): QueuedNotification {
    return {
      id: row.id,
      notificationId: row.notification_id,
      scheduledAt: new Date(row.scheduled_at),
      status: row.status,
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
      lastAttemptAt: row.last_attempt_at ? new Date(row.last_attempt_at) : undefined,
      errorMessage: row.error_message,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}
