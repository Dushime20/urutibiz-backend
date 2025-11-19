import { NotificationPreferences, NotificationType } from '../types';
import { Logger } from '@/utils/logger';
import { getDatabase } from '@/config/database';

export class NotificationPreferencesService {
  private logger: Logger;
  private tableName = 'notification_preferences';

  constructor() {
    this.logger = new Logger('NotificationPreferencesService');
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const db = getDatabase();
      
      const row = await db(this.tableName)
        .where({ user_id: userId })
        .select('*')
        .first();

      if (!row) {
        // Return default preferences if none exist
        return this.getDefaultPreferences(userId);
      }

      return this.mapFromDb(row);

    } catch (error) {
      this.logger.error('Failed to get user preferences', { error: error instanceof Error ? error.message : String(error), userId });
      return this.getDefaultPreferences(userId);
    }
  }

  /**
   * Create or update user notification preferences
   */
  async updateUserPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences | null> {
    try {
      const db = getDatabase();
      
      // Check if preferences exist
      const existing = await db(this.tableName)
        .where({ user_id: userId })
        .select('id')
        .first();

      if (existing) {
        // Update existing preferences
        const [row] = await db(this.tableName)
          .where({ user_id: userId })
          .update({
            email: preferences.email,
            sms: preferences.sms,
            push: preferences.push,
            webhook: preferences.webhook,
            in_app: preferences.inApp,
            quiet_hours_enabled: preferences.quietHours?.enabled,
            quiet_hours_start: preferences.quietHours?.startTime,
            quiet_hours_end: preferences.quietHours?.endTime,
            timezone: preferences.quietHours?.timezone,
            type_preferences: preferences.types ? JSON.stringify(preferences.types) : null,
            updated_at: db.fn.now()
          })
          .returning('*');

        return row ? this.mapFromDb(row) : null;
      } else {
        // Create new preferences
        const [row] = await db(this.tableName)
          .insert({
            user_id: userId,
            email: preferences.email !== undefined ? preferences.email : true,
            sms: preferences.sms !== undefined ? preferences.sms : false,
            push: preferences.push !== undefined ? preferences.push : true,
            webhook: preferences.webhook !== undefined ? preferences.webhook : false,
            in_app: preferences.inApp !== undefined ? preferences.inApp : true,
            quiet_hours_enabled: preferences.quietHours?.enabled || false,
            quiet_hours_start: preferences.quietHours?.startTime || null,
            quiet_hours_end: preferences.quietHours?.endTime || null,
            timezone: preferences.quietHours?.timezone || 'UTC',
            type_preferences: preferences.types ? JSON.stringify(preferences.types) : null,
            created_at: db.fn.now(),
            updated_at: db.fn.now()
          })
          .returning('*');

        return row ? this.mapFromDb(row) : null;
      }

    } catch (error) {
      this.logger.error('Failed to update user preferences', { error: error instanceof Error ? error.message : String(error), userId });
      return null;
    }
  }

  /**
   * Check if user should receive notification based on preferences
   */
  async shouldReceiveNotification(
    userId: string,
    channel: string,
    type: string
  ): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences) {
        return true; // Default to allowing notifications
      }

      // Check if channel is enabled
      const channelEnabled = preferences[channel as keyof NotificationPreferences] as boolean;
      if (!channelEnabled) {
        return false;
      }

      // Check quiet hours
      if (preferences.quietHours.enabled && this.isInQuietHours(preferences.quietHours)) {
        return false;
      }

      // Check type-specific preferences
      if (preferences.types && type in preferences.types && Object.values(NotificationType).includes(type as NotificationType)) {
        const typePrefs = preferences.types[type as NotificationType];
        if (typePrefs && channel in typePrefs) {
          return typePrefs[channel as keyof typeof typePrefs] !== false;
        }
      }

      return true;

    } catch (error) {
      this.logger.error('Failed to check notification preferences', { error: error instanceof Error ? error.message : String(error), userId });
      return true; // Default to allowing notifications
    }
  }

  /**
   * Get users who should receive notifications for a specific type
   */
  async getUsersForNotificationType(
    type: string,
    channel: string
  ): Promise<string[]> {
    try {
      const db = getDatabase();
      
      const rows = await db(this.tableName)
        .where(`${channel}`, true)
        .select('user_id');

      const userIds = rows.map(row => row.user_id);

      // Filter by type-specific preferences if they exist
      const filteredUserIds: string[] = [];
      
      for (const userId of userIds) {
        const shouldReceive = await this.shouldReceiveNotification(userId, channel, type);
        if (shouldReceive) {
          filteredUserIds.push(userId);
        }
      }

      return filteredUserIds;

    } catch (error) {
      this.logger.error('Failed to get users for notification type', { error: error instanceof Error ? error.message : String(error), type });
      return [];
    }
  }

  /**
   * Bulk update preferences for multiple users
   */
  async bulkUpdatePreferences(
    updates: Array<{ userId: string; preferences: Partial<NotificationPreferences> }>
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const update of updates) {
      try {
        const result = await this.updateUserPreferences(update.userId, update.preferences);
        if (!result) {
          errors.push(`Failed to update preferences for user ${update.userId}`);
        }
      } catch (error) {
        errors.push(`Error updating preferences for user ${update.userId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      success: errors.length === 0,
      errors
    };
  }

  /**
   * Delete user preferences
   */
  async deleteUserPreferences(userId: string): Promise<boolean> {
    try {
      const db = getDatabase();
      
      await db(this.tableName)
        .where({ user_id: userId })
        .del();

      this.logger.info('User preferences deleted', { userId });
      return true;

    } catch (error) {
      this.logger.error('Failed to delete user preferences', { error: error instanceof Error ? error.message : String(error), userId });
      return false;
    }
  }

  /**
   * Get notification preferences statistics
   */
  async getPreferencesStatistics(): Promise<{
    totalUsers: number;
    emailEnabled: number;
    smsEnabled: number;
    pushEnabled: number;
    webhookEnabled: number;
    inAppEnabled: number;
    quietHoursEnabled: number;
  }> {
    try {
      const db = getDatabase();
      
      const stats = await db(this.tableName)
        .select(
          db.raw('COUNT(*) as total_users'),
          db.raw('SUM(CASE WHEN email = true THEN 1 ELSE 0 END) as email_enabled'),
          db.raw('SUM(CASE WHEN sms = true THEN 1 ELSE 0 END) as sms_enabled'),
          db.raw('SUM(CASE WHEN push = true THEN 1 ELSE 0 END) as push_enabled'),
          db.raw('SUM(CASE WHEN webhook = true THEN 1 ELSE 0 END) as webhook_enabled'),
          db.raw('SUM(CASE WHEN in_app = true THEN 1 ELSE 0 END) as in_app_enabled'),
          db.raw('SUM(CASE WHEN quiet_hours_enabled = true THEN 1 ELSE 0 END) as quiet_hours_enabled')
        )
        .first();

      return {
        totalUsers: parseInt(stats.total_users as string) || 0,
        emailEnabled: parseInt(stats.email_enabled as string) || 0,
        smsEnabled: parseInt(stats.sms_enabled as string) || 0,
        pushEnabled: parseInt(stats.push_enabled as string) || 0,
        webhookEnabled: parseInt(stats.webhook_enabled as string) || 0,
        inAppEnabled: parseInt(stats.in_app_enabled as string) || 0,
        quietHoursEnabled: parseInt(stats.quiet_hours_enabled as string) || 0
      };

    } catch (error) {
      this.logger.error('Failed to get preferences statistics', { error: error instanceof Error ? error.message : String(error) });
      return {
        totalUsers: 0,
        emailEnabled: 0,
        smsEnabled: 0,
        pushEnabled: 0,
        webhookEnabled: 0,
        inAppEnabled: 0,
        quietHoursEnabled: 0
      };
    }
  }

  /**
   * Private methods
   */
  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      email: true,
      sms: false,
      push: true,
      webhook: false,
      inApp: true,
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        timezone: 'UTC'
      },
      types: {} as any, // Will be populated based on notification types
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private isInQuietHours(quietHours: NotificationPreferences['quietHours']): boolean {
    if (!quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      timeZone: quietHours.timezone 
    });

    const startTime = quietHours.startTime;
    const endTime = quietHours.endTime;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  private mapFromDb(row: any): NotificationPreferences {
    return {
      userId: row.user_id,
      email: row.email,
      sms: row.sms,
      push: row.push,
      webhook: row.webhook,
      inApp: row.in_app,
      quietHours: {
        enabled: row.quiet_hours_enabled,
        startTime: row.quiet_hours_start,
        endTime: row.quiet_hours_end,
        timezone: row.timezone
      },
      types: row.type_preferences ? JSON.parse(row.type_preferences) : {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}
