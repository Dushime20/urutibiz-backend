import { EmailProvider } from '../providers/EmailProvider';
import { SMSProvider } from '../providers/SMSProvider';
import { PushProvider } from '../providers/PushProvider';
import { InAppProvider } from '../providers/InAppProvider';
import { BaseNotificationProvider, DeliveryResult, NotificationPayload } from '../providers/BaseNotificationProvider';
import { NotificationChannelType } from '@/types/notification.types';
import { Notification } from '@/models/Notification.model';
import { getDatabase } from '@/config/database';
import logger from '@/utils/logger';

export interface DeliveryAttempt {
  id: string;
  notification_id: string;
  channel: NotificationChannelType;
  provider: string;
  status: 'pending' | 'sent' | 'failed' | 'retry';
  message_id?: string;
  error_message?: string;
  attempts: number;
  last_attempted_at: Date;
  sent_at?: Date;
  metadata?: Record<string, any>;
}

export class NotificationDeliveryService {
  private providers: Map<NotificationChannelType, BaseNotificationProvider>;
  private maxRetries: number;
  private retryDelay: number;

  constructor() {
    this.providers = new Map();
    this.maxRetries = parseInt(process.env.NOTIFICATION_MAX_RETRIES || '3');
    this.retryDelay = parseInt(process.env.NOTIFICATION_RETRY_DELAY || '300000'); // 5 minutes
    
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize all providers
    const emailProvider = new EmailProvider();
    const smsProvider = new SMSProvider();
    const pushProvider = new PushProvider();
    const inAppProvider = new InAppProvider();

    // Register providers
    this.providers.set('email', emailProvider);
    this.providers.set('sms', smsProvider);
    this.providers.set('push', pushProvider);
    this.providers.set('in_app', inAppProvider);

    // Log provider status
    this.providers.forEach((provider, channel) => {
      const status = provider.enabled() ? 'enabled' : 'disabled';
      logger.info(`Notification provider ${provider.getProviderName()} (${channel}): ${status}`);
    });
  }

  public getProvider(channel: NotificationChannelType): BaseNotificationProvider | undefined {
    return this.providers.get(channel);
  }

  public getEnabledChannels(): NotificationChannelType[] {
    const enabledChannels: NotificationChannelType[] = [];
    this.providers.forEach((provider, channel) => {
      if (provider.enabled()) {
        enabledChannels.push(channel);
      }
    });
    return enabledChannels;
  }

  async deliverNotification(notification: Notification): Promise<DeliveryResult[]> {
    const results: DeliveryResult[] = [];
    
    try {
      // Get user delivery preferences (could be from database)
      const userPreferences = await this.getUserDeliveryPreferences(notification.user_id);
      
      // Filter channels based on user preferences
      const channelsToSend = notification.channels.filter(channel => 
        userPreferences.enabledChannels.includes(channel)
      );

      logger.info(`Delivering notification ${notification.id} via channels: ${channelsToSend.join(', ')}`);

      // Send via each channel
      for (const channel of channelsToSend) {
        const provider = this.providers.get(channel);
        
        if (!provider || !provider.enabled()) {
          const error = `Provider not available for channel: ${channel}`;
          logger.warn(error);
          results.push({
            success: false,
            error,
            details: { channel, notificationId: notification.id }
          });
          continue;
        }

        try {
          const deliveryAddress = await this.getDeliveryAddress(notification.user_id, channel);
          if (!deliveryAddress) {
            const error = `No delivery address for channel ${channel}`;
            logger.warn(error);
            results.push({
              success: false,
              error,
              details: { channel, notificationId: notification.id }
            });
            continue;
          }

          const payload: NotificationPayload = {
            to: deliveryAddress,
            subject: notification.title,
            message: notification.message,
            metadata: {
              notificationId: notification.id,
              type: notification.type,
              action_url: notification.action_url,
              ...notification.metadata
            },
            templateId: notification.template_id,
            variables: notification.metadata
          };

          const result = await provider.send(payload);
          results.push(result);

          // Record delivery attempt
          await this.recordDeliveryAttempt(notification.id, channel, provider.getProviderName(), result);

          // Update notification delivery status
          if (result.success) {
            await this.updateNotificationDeliveryStatus(notification.id, channel, 'sent', result.messageId);
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error(`Delivery failed for channel ${channel}:`, error);
          
          results.push({
            success: false,
            error: errorMessage,
            details: { channel, notificationId: notification.id }
          });

          await this.recordDeliveryAttempt(notification.id, channel, provider.getProviderName(), {
            success: false,
            error: errorMessage
          });
        }
      }

      // Mark notification as processed
      await notification.markAsSent();

    } catch (error) {
      logger.error('Error in notification delivery:', error);
      results.push({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown delivery error',
        details: { notificationId: notification.id }
      });
    }

    return results;
  }

  private async getUserDeliveryPreferences(userId: string): Promise<{
    enabledChannels: NotificationChannelType[];
    preferences: Record<string, any>;
  }> {
    try {
      const db = getDatabase();
      const preferences = await db('user_notification_preferences')
        .where({ user_id: userId })
        .first();

      if (preferences) {
        return {
          enabledChannels: preferences.enabled_channels || ['in_app'],
          preferences: preferences.preferences || {}
        };
      }

      // Default preferences
      return {
        enabledChannels: ['in_app', 'email'],
        preferences: {}
      };
    } catch (error) {
      logger.warn('Error getting user preferences, using defaults:', error);
      return {
        enabledChannels: ['in_app'],
        preferences: {}
      };
    }
  }

  private async getDeliveryAddress(userId: string, channel: NotificationChannelType): Promise<string | null> {
    try {
      const db = getDatabase();
      const user = await db('users').where({ id: userId }).first();

      if (!user) {
        return null;
      }

      switch (channel) {
        case 'email':
          return user.email;
        case 'sms':
          return user.phone_number;
        case 'push':
          // Get FCM token from user_devices table
          const device = await db('user_devices')
            .where({ user_id: userId, is_active: true })
            .orderBy('last_used_at', 'desc')
            .first();
          return device?.push_token || null;
        case 'in_app':
          return userId; // For in-app, we use the user ID
        default:
          return null;
      }
    } catch (error) {
      logger.error(`Error getting delivery address for ${channel}:`, error);
      return null;
    }
  }

  private async recordDeliveryAttempt(
    notificationId: string,
    channel: NotificationChannelType,
    provider: string,
    result: DeliveryResult
  ): Promise<void> {
    try {
      const db = getDatabase();
      
      await db('notification_delivery_attempts').insert({
        id: `${notificationId}_${channel}_${Date.now()}`,
        notification_id: notificationId,
        channel,
        provider,
        status: result.success ? 'sent' : 'failed',
        message_id: result.messageId,
        error_message: result.error,
        attempts: 1,
        last_attempted_at: new Date(),
        sent_at: result.success ? new Date() : null,
        metadata: result.details
      });
    } catch (error) {
      logger.error('Error recording delivery attempt:', error);
    }
  }

  private async updateNotificationDeliveryStatus(
    notificationId: string,
    channel: NotificationChannelType,
    status: string,
    messageId?: string
  ): Promise<void> {
    try {
      const db = getDatabase();
      
      // Update or insert delivery status
      const existingStatus = await db('notification_delivery_status')
        .where({ notification_id: notificationId, channel })
        .first();

      const updateData = {
        status,
        message_id: messageId,
        delivered_at: status === 'sent' ? new Date() : null,
        updated_at: new Date()
      };

      if (existingStatus) {
        await db('notification_delivery_status')
          .where({ notification_id: notificationId, channel })
          .update(updateData);
      } else {
        await db('notification_delivery_status').insert({
          notification_id: notificationId,
          channel,
          ...updateData,
          created_at: new Date()
        });
      }
    } catch (error) {
      logger.error('Error updating delivery status:', error);
    }
  }

  async retryFailedDeliveries(): Promise<void> {
    try {
      const db = getDatabase();
      
      // Get failed deliveries that are eligible for retry
      const failedDeliveries = await db('notification_delivery_attempts')
        .where('status', 'failed')
        .where('attempts', '<', this.maxRetries)
        .where('last_attempted_at', '<', new Date(Date.now() - this.retryDelay))
        .limit(100);

      logger.info(`Found ${failedDeliveries.length} failed deliveries to retry`);

      for (const delivery of failedDeliveries) {
        try {
          const notification = await Notification.findById(delivery.notification_id);
          if (!notification) {
            continue;
          }

          const provider = this.providers.get(delivery.channel);
          if (!provider || !provider.enabled()) {
            continue;
          }

          const deliveryAddress = await this.getDeliveryAddress(notification.user_id, delivery.channel);
          if (!deliveryAddress) {
            continue;
          }

          const payload: NotificationPayload = {
            to: deliveryAddress,
            subject: notification.title,
            message: notification.message,
            metadata: {
              notificationId: notification.id,
              type: notification.type,
              action_url: notification.action_url,
              ...notification.metadata
            }
          };

          const result = await provider.send(payload);

          // Update delivery attempt
          await db('notification_delivery_attempts')
            .where({ id: delivery.id })
            .update({
              status: result.success ? 'sent' : 'failed',
              message_id: result.messageId,
              error_message: result.error,
              attempts: delivery.attempts + 1,
              last_attempted_at: new Date(),
              sent_at: result.success ? new Date() : null
            });

          if (result.success) {
            await this.updateNotificationDeliveryStatus(
              notification.id,
              delivery.channel,
              'sent',
              result.messageId
            );
          }

        } catch (error) {
          logger.error(`Error retrying delivery ${delivery.id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error in retry failed deliveries:', error);
    }
  }

  async getDeliveryStats(notificationId?: string): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
    byChannel: Record<string, { sent: number; failed: number; pending: number }>;
  }> {
    try {
      const db = getDatabase();
      
      let query = db('notification_delivery_attempts');
      if (notificationId) {
        query = query.where({ notification_id: notificationId });
      }

      const attempts = await query.select('*');
      
      const stats = {
        total: attempts.length,
        sent: attempts.filter(a => a.status === 'sent').length,
        failed: attempts.filter(a => a.status === 'failed').length,
        pending: attempts.filter(a => a.status === 'pending').length,
        byChannel: {} as Record<string, { sent: number; failed: number; pending: number }>
      };

      // Group by channel
      attempts.forEach(attempt => {
        if (!stats.byChannel[attempt.channel]) {
          stats.byChannel[attempt.channel] = { sent: 0, failed: 0, pending: 0 };
        }
        stats.byChannel[attempt.channel][attempt.status as keyof typeof stats.byChannel[string]]++;
      });

      return stats;
    } catch (error) {
      logger.error('Error getting delivery stats:', error);
      return { total: 0, sent: 0, failed: 0, pending: 0, byChannel: {} };
    }
  }

  async testAllProviders(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [channel, provider] of this.providers) {
      try {
        results[channel] = await provider.testConnection();
      } catch (error) {
        logger.error(`Error testing provider ${channel}:`, error);
        results[channel] = false;
      }
    }
    
    return results;
  }
}
