import { 
  CreateNotificationDTO, 
  BulkNotificationDTO, 
  NotificationFilters,
  // NotificationStats,
  NotificationChannelType,
  NotificationType,
  TemplateVariables,
  NotificationContext
} from '@/types/notification.types';
import { Notification } from '@/models/Notification.model';
import { NotificationTemplate } from '@/models/NotificationTemplate.model';
import { NotificationDeliveryService } from '@/services/notificationDelivery.service';
import { getDatabase } from '@/config/database';
import logger from '@/utils/logger';

export default class NotificationService {
  private static deliveryService: NotificationDeliveryService | null = null;

  private static getDeliveryService(): NotificationDeliveryService {
    if (!this.deliveryService) {
      this.deliveryService = new NotificationDeliveryService();
    }
    return this.deliveryService;
  }
  
  // Create a single notification
  static async createNotification(data: CreateNotificationDTO): Promise<Notification> {
    try {
      const notification = new Notification({
        ...data,
        channels: data.channels || ['in_app']
      });
      
      await notification.save();
      logger.info(`Notification created: ${notification.id} for user ${notification.user_id}`);
      
      // Trigger delivery
      const deliveryService = this.getDeliveryService();
      await deliveryService.deliverNotification(notification);
      
      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  // Create notification from template
  static async createFromTemplate(
    templateName: string,
    userId: string,
    variables: TemplateVariables,
    options: {
      channels?: NotificationChannelType[];
      action_url?: string;
      expires_at?: Date;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<Notification> {
    try {
      const template = await NotificationTemplate.findByName(templateName);
      if (!template) {
        throw new Error(`Template not found: ${templateName}`);
      }

      const title = template.renderSubject(variables);
      const message = template.renderBody(variables);

      const notification = await this.createNotification({
        user_id: userId,
        template_id: template.id,
        type: this.getNotificationTypeFromTemplate(templateName),
        title: title || templateName,
        message,
        channels: options.channels || [template.type as NotificationChannelType],
        action_url: options.action_url,
        expires_at: options.expires_at,
        metadata: options.metadata
      });

      return notification;
    } catch (error) {
      logger.error('Error creating notification from template:', error);
      throw error;
    }
  }

  // Create bulk notifications
  static async createBulkNotifications(data: BulkNotificationDTO): Promise<Notification[]> {
    try {
      const notifications: Notification[] = [];
      
      for (const userId of data.user_ids) {
        if (data.template_name) {
          // Use template
          const notification = await this.createFromTemplate(
            data.template_name,
            userId,
            data.metadata || {},
            {
              channels: data.channels,
              action_url: data.action_url,
              expires_at: data.expires_at,
              metadata: data.metadata
            }
          );
          notifications.push(notification);
        } else {
          // Direct notification
          const notification = await this.createNotification({
            user_id: userId,
            type: data.type,
            title: data.title,
            message: data.message,
            channels: data.channels,
            action_url: data.action_url,
            expires_at: data.expires_at,
            metadata: data.metadata
          });
          notifications.push(notification);
        }
      }

      logger.info(`Bulk notifications created: ${notifications.length} notifications`);
      return notifications;
    } catch (error) {
      logger.error('Error creating bulk notifications:', error);
      throw new Error('Failed to create bulk notifications');
    }
  }

  // Get notifications for a user
  static async getUserNotifications(
    userId: string,
    filters: NotificationFilters = {}
  ): Promise<Notification[]> {
    try {
      return await Notification.findByUserId(userId, filters);
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      throw new Error('Failed to get user notifications');
    }
  }

  // Get unread notifications for a user
  static async getUserUnreadNotifications(userId: string): Promise<Notification[]> {
    try {
      return await Notification.findUnread(userId);
    } catch (error) {
      logger.error('Error getting unread notifications:', error);
      throw new Error('Failed to get unread notifications');
    }
  }

  // Get unread count for a user
  static async getUserUnreadCount(userId: string): Promise<number> {
    try {
      return await Notification.getUnreadCount(userId);
    } catch (error) {
      logger.error('Error getting unread count:', error);
      throw new Error('Failed to get unread count');
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.markAsRead();
      logger.info(`Notification marked as read: ${notificationId}`);
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark multiple notifications as read
  static async markMultipleAsRead(notificationIds: string[]): Promise<number> {
    try {
      const count = await Notification.markMultipleAsRead(notificationIds);
      logger.info(`Marked ${count} notifications as read`);
      return count;
    } catch (error) {
      logger.error('Error marking multiple notifications as read:', error);
      throw new Error('Failed to mark notifications as read');
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsReadForUser(userId: string): Promise<number> {
    try {
      const db = getDatabase();
      const count = await db('notifications')
        .where({ user_id: userId, is_read: false })
        .update({
          is_read: true,
          read_at: new Date()
        });

      logger.info(`Marked all notifications as read for user ${userId}: ${count} notifications`);
      return count;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.delete();
      logger.info(`Notification deleted: ${notificationId}`);
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Context-specific notification creators
  static async notifyBookingConfirmed(
    userId: string,
    context: NotificationContext
  ): Promise<Notification> {
    return this.createFromTemplate('booking_confirmed', userId, context, {
      channels: ['email', 'push', 'in_app'],
      action_url: `/bookings/${context.booking_reference}`
    });
  }

  static async notifyPaymentReceived(
    userId: string,
    context: NotificationContext
  ): Promise<Notification> {
    return this.createFromTemplate('payment_received', userId, context, {
      channels: ['email', 'in_app'],
      action_url: `/payments/${context.transaction_id}`
    });
  }

  static async notifyVerificationComplete(
    userId: string,
    context: NotificationContext = {}
  ): Promise<Notification> {
    return this.createFromTemplate('verification_complete', userId, context, {
      channels: ['email', 'in_app'],
      action_url: '/dashboard'
    });
  }

  // Legacy methods for backward compatibility
  static async sendModerationNotification(result: any, action: any) {
    logger.info('Moderation notification triggered', { result, action });
    // Implementation would create notification for moderators
  }

  static async sendFraudAlert(bookingId: string, fraudAnalysis: any) {
    logger.info('Fraud alert triggered', { bookingId, fraudAnalysis });
    // Implementation would create notification for admins
  }

  static async sendKycStatusChange(userId: string, newStatus: string) {
    try {
      await this.createNotification({
        user_id: userId,
        type: 'verification_complete',
        title: 'Verification Status Updated',
        message: `Your verification status has been updated to: ${newStatus}`,
        channels: ['email', 'in_app'],
        action_url: '/profile/verification'
      });
      
      logger.info('KYC status notification sent', { userId, newStatus });
    } catch (error) {
      logger.error('Error sending KYC notification:', error);
    }
  }

  // Helper methods
  private static getNotificationTypeFromTemplate(templateName: string): NotificationType {
    const typeMapping: Record<string, NotificationType> = {
      'booking_confirmed': 'booking_confirmed',
      'booking_cancelled': 'booking_cancelled',
      'booking_reminder': 'booking_reminder',
      'payment_received': 'payment_received',
      'payment_failed': 'payment_failed',
      'verification_complete': 'verification_complete',
      'new_review': 'new_review',
      'account_welcome': 'account_welcome',
      'password_reset': 'password_reset'
    };

    return typeMapping[templateName] || 'custom';
  }
}
