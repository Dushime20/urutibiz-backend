import { EventEmitter } from 'events';
import { NotificationChannel, NotificationPriority, NotificationStatus, NotificationType } from './types';
import { EmailService } from '../email.service';
import { SMSService } from './channels/SMSService';
import { PushNotificationService } from './channels/PushNotificationService';
import { WebhookService } from './channels/WebhookService';
import { NotificationTemplateService } from './templates/NotificationTemplateService';
import { NotificationQueueService } from './queue/NotificationQueueService';
import { NotificationRepository } from './repositories/NotificationRepository';
import { NotificationPreferencesService } from './preferences/NotificationPreferencesService';
import { Logger } from '@/utils/logger';
import { getDatabase } from '@/config/database';

export interface NotificationPayload {
  type: NotificationType;
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  scheduledAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  channelResults: Record<NotificationChannel, {
    success: boolean;
    messageId?: string;
    error?: string;
    deliveredAt?: Date;
  }>;
  errors?: string[];
}

export class NotificationEngine extends EventEmitter {
  private emailService: EmailService;
  private smsService: SMSService;
  private pushService: PushNotificationService;
  private webhookService: WebhookService;
  private templateService: NotificationTemplateService;
  private queueService: NotificationQueueService;
  private repository: NotificationRepository;
  private preferencesService: NotificationPreferencesService;
  private logger: Logger;

  constructor() {
    super();
    
    this.emailService = new EmailService();
    this.smsService = new SMSService();
    this.pushService = new PushNotificationService();
    this.webhookService = new WebhookService();
    this.templateService = new NotificationTemplateService();
    this.queueService = new NotificationQueueService();
    this.repository = new NotificationRepository();
    this.preferencesService = new NotificationPreferencesService();
    this.logger = new Logger('NotificationEngine');

    this.setupEventHandlers();
    
    // Initialize default templates asynchronously
    this.initializeTemplates();
  }

  /**
   * Initialize default templates
   */
  private async initializeTemplates(): Promise<void> {
    try {
      await this.templateService.initializeDefaultTemplates();
      this.logger.info('Default templates initialized successfully');
    } catch (error: any) {
      this.logger.error('Failed to initialize default templates', { error: error.message });
    }
  }

  /**
   * Send notification immediately
   */
  async sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      this.logger.info('Sending notification', { type: payload.type, recipientId: payload.recipientId });

      // Validate payload
      const validation = this.validatePayload(payload);
      if (!validation.isValid) {
        throw new Error(`Invalid notification payload: ${validation.errors.join(', ')}`);
      }

      // Get user preferences
      const preferences = await this.preferencesService.getUserPreferences(payload.recipientId);
      
      // Determine channels based on preferences and payload
      const channels = this.determineChannels(payload, preferences);
      
      // Create notification record
      const notification = await this.repository.create({
        type: payload.type,
        recipientId: payload.recipientId,
        title: payload.title,
        message: payload.message,
        data: payload.data,
        priority: payload.priority || NotificationPriority.NORMAL,
        channels: channels,
        status: NotificationStatus.PENDING,
        scheduledAt: payload.scheduledAt || new Date(),
        expiresAt: payload.expiresAt,
        metadata: payload.metadata
      });

      if (!notification.success) {
        throw new Error(notification.error || 'Failed to create notification record');
      }

      // Send through all channels
      const channelResults = await this.sendThroughChannels(notification.data, channels, payload);
      
      // Update notification status
      const hasFailures = Object.values(channelResults).some(result => !result.success);
      await this.repository.update(notification.data.id, {
        status: hasFailures ? NotificationStatus.PARTIALLY_DELIVERED : NotificationStatus.DELIVERED,
        deliveredAt: new Date(),
        channelResults: channelResults
      });

      const result: NotificationResult = {
        success: !hasFailures,
        notificationId: notification.data.id,
        channelResults,
        errors: hasFailures ? Object.values(channelResults)
          .filter(r => !r.success)
          .map(r => r.error)
          .filter(Boolean) : undefined
      };

      this.emit('notification:sent', result);
      this.logger.info('Notification sent successfully', { notificationId: notification.data.id });
      
      return result;

    } catch (error) {
      this.logger.error('Failed to send notification', { error: error.message, payload });
      this.emit('notification:error', { error, payload });
      
      return {
        success: false,
        channelResults: {},
        errors: [error.message]
      };
    }
  }

  /**
   * Send notification using template
   */
  async sendTemplatedNotification(
    templateName: string,
    recipientId: string,
    templateData: Record<string, any>,
    options?: Partial<NotificationPayload>
  ): Promise<NotificationResult> {
    try {
      const template = await this.templateService.getTemplate(templateName);
      if (!template) {
        throw new Error(`Template not found: ${templateName}`);
      }

      const { title, message } = await this.templateService.renderTemplate(templateName, templateData);
      
      const payload: NotificationPayload = {
        type: template.type,
        recipientId,
        title,
        message,
        data: templateData,
        priority: template.priority,
        channels: template.channels,
        ...options
      };

      return await this.sendNotification(payload);

    } catch (error) {
      this.logger.error('Failed to send templated notification', { error: error.message, templateName });
      throw error;
    }
  }

  /**
   * Schedule notification for later
   */
  async scheduleNotification(
    payload: NotificationPayload,
    scheduledAt: Date
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      payload.scheduledAt = scheduledAt;
      
      const notification = await this.repository.create({
        ...payload,
        status: NotificationStatus.SCHEDULED,
        scheduledAt
      });

      if (!notification.success) {
        throw new Error('Failed to schedule notification');
      }

      // Add to queue for processing
      await this.queueService.scheduleNotification(notification.data.id, scheduledAt);
      
      this.logger.info('Notification scheduled', { notificationId: notification.data.id, scheduledAt });
      this.emit('notification:scheduled', { notificationId: notification.data.id, scheduledAt });
      
      return { success: true, notificationId: notification.data.id };

    } catch (error) {
      this.logger.error('Failed to schedule notification', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(
    payloads: NotificationPayload[]
  ): Promise<{ success: boolean; results: NotificationResult[]; errors: string[] }> {
    const results: NotificationResult[] = [];
    const errors: string[] = [];

    for (const payload of payloads) {
      try {
        const result = await this.sendNotification(payload);
        results.push(result);
        
        if (!result.success) {
          errors.push(`Failed to send notification to ${payload.recipientId}: ${result.errors?.join(', ')}`);
        }
      } catch (error) {
        errors.push(`Error sending notification to ${payload.recipientId}: ${error.message}`);
        results.push({
          success: false,
          channelResults: {},
          errors: [error.message]
        });
      }
    }

    const success = results.every(r => r.success);
    
    this.logger.info('Bulk notifications completed', { 
      total: payloads.length, 
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

    return { success, results, errors };
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications(): Promise<void> {
    try {
      const scheduledNotifications = await this.queueService.getDueNotifications();
      
      for (const notification of scheduledNotifications) {
        try {
          await this.sendNotification(notification);
          await this.queueService.markProcessed(notification.id);
        } catch (error) {
          this.logger.error('Failed to process scheduled notification', { 
            notificationId: notification.id, 
            error: error.message 
          });
          await this.queueService.markFailed(notification.id, error.message);
        }
      }

      this.logger.info('Processed scheduled notifications', { count: scheduledNotifications.length });
      
    } catch (error) {
      this.logger.error('Failed to process scheduled notifications', { error: error.message });
    }
  }

  /**
   * Get notification statistics
   */
  async getStatistics(userId?: string): Promise<{
    total: number;
    delivered: number;
    pending: number;
    failed: number;
    byType: Record<NotificationType, number>;
    byChannel: Record<NotificationChannel, number>;
  }> {
    return await this.repository.getStatistics(userId);
  }

  /**
   * Get repository instance
   */
  getRepository(): NotificationRepository {
    return this.repository;
  }

  /**
   * Get template service instance
   */
  getTemplateService(): NotificationTemplateService {
    return this.templateService;
  }

  /**
   * Get email service instance
   */
  getEmailService(): EmailService {
    return this.emailService;
  }

  /**
   * Get push service instance
   */
  getPushService(): PushNotificationService {
    return this.pushService;
  }

  /**
   * Private methods
   */
  private setupEventHandlers(): void {
    this.on('notification:sent', (result) => {
      this.logger.info('Notification sent event', { notificationId: result.notificationId });
    });

    this.on('notification:error', (data) => {
      this.logger.error('Notification error event', { error: data.error.message });
    });

    this.on('notification:scheduled', (data) => {
      this.logger.info('Notification scheduled event', { notificationId: data.notificationId });
    });
  }

  private validatePayload(payload: NotificationPayload): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!payload.type) errors.push('Type is required');
    if (!payload.recipientId) errors.push('Recipient ID is required');
    if (!payload.title) errors.push('Title is required');
    if (!payload.message) errors.push('Message is required');

    return { isValid: errors.length === 0, errors };
  }

  private determineChannels(
    payload: NotificationPayload, 
    preferences: any
  ): NotificationChannel[] {
    // Use payload channels if specified, otherwise use user preferences
    if (payload.channels && payload.channels.length > 0) {
      return payload.channels;
    }

    // Default channels based on notification type
    const defaultChannels: Record<NotificationType, NotificationChannel[]> = {
      [NotificationType.INSPECTION_SCHEDULED]: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
      [NotificationType.INSPECTION_STARTED]: [NotificationChannel.PUSH, NotificationChannel.SMS],
      [NotificationType.INSPECTION_COMPLETED]: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
      [NotificationType.DISPUTE_RAISED]: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.SMS],
      [NotificationType.DISPUTE_RESOLVED]: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
      [NotificationType.REMINDER]: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
      [NotificationType.SYSTEM]: [NotificationChannel.EMAIL],
      [NotificationType.SECURITY]: [NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH]
    };

    return defaultChannels[payload.type] || [NotificationChannel.EMAIL];
  }

  private async sendThroughChannels(
    notification: any,
    channels: NotificationChannel[],
    payload: NotificationPayload
  ): Promise<Record<NotificationChannel, any>> {
    const results: Record<NotificationChannel, any> = {} as any;

    const sendPromises = channels.map(async (channel) => {
      try {
        let result;
        
        switch (channel) {
          case NotificationChannel.EMAIL:
            // Get user email if not provided
            let recipientEmail = payload.recipientEmail;
            if (!recipientEmail) {
              try {
                const db = getDatabase();
                const user = await db('users').where('id', payload.recipientId).select('email').first();
                recipientEmail = user?.email || '';
                this.logger.info('Fetched user email', { userId: payload.recipientId, email: recipientEmail });
              } catch (error) {
                this.logger.error('Failed to fetch user email', { error: error.message, userId: payload.recipientId });
                recipientEmail = '';
              }
            }
            
            if (!recipientEmail) {
              this.logger.error('No recipient email found', { userId: payload.recipientId });
              result = { success: false, error: 'No recipient email found' };
            } else {
              try {
                this.logger.info('Sending email', { to: recipientEmail, subject: payload.title });
                const emailResult = await this.emailService.sendEmail({
                  to: recipientEmail,
                  subject: payload.title,
                  html: payload.message,
                  text: payload.message.replace(/<[^>]*>/g, ''), // Strip HTML for text version
                  data: payload.data
                });
                
                // Convert boolean result to proper structure
                result = {
                  success: emailResult,
                  messageId: emailResult ? `email-${Date.now()}` : undefined,
                  error: emailResult ? undefined : 'Email service failed'
                };
                
                this.logger.info('Email service result', { success: result.success, recipientEmail });
              } catch (emailError: any) {
                this.logger.error('Email service error', { error: emailError.message, recipientEmail });
                result = { success: false, error: emailError.message };
              }
            }
            break;

          case NotificationChannel.SMS:
            result = await this.smsService.send({
              to: payload.recipientPhone || '',
              message: payload.message,
              data: payload.data
            });
            break;

          case NotificationChannel.PUSH:
            result = await this.pushService.send({
              userId: payload.recipientId,
              title: payload.title,
              body: payload.message,
              data: payload.data
            });
            break;

          case NotificationChannel.WEBHOOK:
            result = await this.webhookService.send({
              url: payload.metadata?.webhookUrl || '',
              payload: {
                type: payload.type,
                recipientId: payload.recipientId,
                title: payload.title,
                message: payload.message,
                data: payload.data
              }
            });
            break;

          default:
            result = { success: false, error: `Unsupported channel: ${channel}` };
        }

        results[channel] = {
          success: result.success,
          messageId: result.messageId,
          error: result.error,
          deliveredAt: result.success ? new Date() : undefined
        };

      } catch (error) {
        results[channel] = {
          success: false,
          error: error.message
        };
      }
    });

    await Promise.all(sendPromises);
    return results;
  }
}

export default new NotificationEngine();
