import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { AuthenticatedRequest } from '@/types';
import { ResponseHelper } from '@/utils/response';
import NotificationEngine from '@/services/notification/NotificationEngine';
import { NotificationType, NotificationChannel, NotificationPriority } from '@/services/notification/types';
import { Logger } from '@/utils/logger';

export class NotificationController extends BaseController {
  private logger: Logger;

  constructor() {
    super();
    this.logger = new Logger('NotificationController');
  }

  /**
   * Send notification
   * POST /api/v1/notifications/send
   */
  public sendNotification = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const {
      type,
      recipientId,
      recipientEmail,
      recipientPhone,
      title,
      message,
      data,
      priority,
      channels,
      scheduledAt,
      expiresAt,
      metadata
    } = req.body;

    // Validate required fields
    if (!type || !recipientId || !title || !message) {
      return this.handleBadRequest(res, 'Missing required fields: type, recipientId, title, message');
    }

    // Validate notification type
    if (!Object.values(NotificationType).includes(type)) {
      return this.handleBadRequest(res, 'Invalid notification type');
    }

    // Validate priority
    if (priority && !Object.values(NotificationPriority).includes(priority)) {
      return this.handleBadRequest(res, 'Invalid priority level');
    }

    // Validate channels
    if (channels && (!Array.isArray(channels) || !channels.every(c => Object.values(NotificationChannel).includes(c)))) {
      return this.handleBadRequest(res, 'Invalid notification channels');
    }

    try {
      const result = await NotificationEngine.sendNotification({
        type,
        recipientId,
        recipientEmail,
        recipientPhone,
        title,
        message,
        data,
        priority,
        channels,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        metadata
      });

      // Return partial success (do not 500) when some channels fail but record is created
      if (!result.success) {
        this.logAction('SEND_NOTIFICATION', req.user.id, recipientId, { type, title });
        return ResponseHelper.success(res, 'Notification processed with partial failures', {
          notificationId: result.notificationId,
          channelResults: result.channelResults,
          errors: result.errors
        });
      }

      this.logAction('SEND_NOTIFICATION', req.user.id, recipientId, { type, title });

      return ResponseHelper.success(res, 'Notification sent successfully', {
        notificationId: result.notificationId,
        channelResults: result.channelResults
      });

    } catch (error) {
      this.logger.error('Failed to send notification', { error: error instanceof Error ? error.message : String(error) });
      return ResponseHelper.error(res, 'Internal server error', null, 500);
    }
  });

  /**
   * Send templated notification
   * POST /api/v1/notifications/send-templated
   */
  public sendTemplatedNotification = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const {
      templateName,
      recipientId,
      templateData,
      options
    } = req.body;

    // Validate required fields
    if (!templateName || !recipientId || !templateData) {
      return this.handleBadRequest(res, 'Missing required fields: templateName, recipientId, templateData');
    }

    try {
      const result = await NotificationEngine.sendTemplatedNotification(
        templateName,
        recipientId,
        templateData,
        options
      );
      
      if (!result.success) {
        return ResponseHelper.error(res, 'Failed to send templated notification', result.errors, 500);
      }

      this.logAction('SEND_TEMPLATED_NOTIFICATION', req.user.id, recipientId, { templateName });

      return ResponseHelper.success(res, 'Templated notification sent successfully', {
        notificationId: result.notificationId,
        channelResults: result.channelResults
      });

    } catch (error) {
      this.logger.error('Failed to send templated notification', { error: error instanceof Error ? error.message : String(error) });
      return ResponseHelper.error(res, 'Internal server error', null, 500);
    }
  });

  /**
   * Schedule notification
   * POST /api/v1/notifications/schedule
   */
  public scheduleNotification = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const {
      type,
      recipientId,
      recipientEmail,
      recipientPhone,
      title,
      message,
      data,
      priority,
      channels,
      scheduledAt,
      expiresAt,
      metadata
    } = req.body;

    // Validate required fields
    if (!type || !recipientId || !title || !message || !scheduledAt) {
      return this.handleBadRequest(res, 'Missing required fields: type, recipientId, title, message, scheduledAt');
    }

    // Validate scheduledAt is in the future
    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return this.handleBadRequest(res, 'Scheduled time must be in the future');
    }

    try {
      const result = await NotificationEngine.scheduleNotification({
        type,
        recipientId,
        recipientEmail,
        recipientPhone,
        title,
        message,
        data,
        priority,
        channels,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        metadata
      }, scheduledDate);
      
      if (!result.success) {
        return ResponseHelper.error(res, 'Failed to schedule notification', result.error, 500);
      }

      this.logAction('SCHEDULE_NOTIFICATION', req.user.id, recipientId, { type, title, scheduledAt });

      return ResponseHelper.success(res, 'Notification scheduled successfully', {
        notificationId: result.notificationId,
        scheduledAt
      });

    } catch (error) {
      this.logger.error('Failed to schedule notification', { error: error instanceof Error ? error.message : String(error) });
      return ResponseHelper.error(res, 'Internal server error', null, 500);
    }
  });

  /**
   * Send bulk notifications
   * POST /api/v1/notifications/send-bulk
   */
  public sendBulkNotifications = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { notifications } = req.body;

    // Validate required fields
    if (!Array.isArray(notifications) || notifications.length === 0) {
      return this.handleBadRequest(res, 'Notifications array is required and must not be empty');
    }

    // Validate each notification
    for (const notification of notifications) {
      if (!notification.type || !notification.recipientId || !notification.title || !notification.message) {
        return this.handleBadRequest(res, 'Each notification must have type, recipientId, title, and message');
      }
    }

    try {
      const result = await NotificationEngine.sendBulkNotifications(notifications);

      this.logAction('SEND_BULK_NOTIFICATIONS', req.user.id, null, { count: notifications.length });

      return ResponseHelper.success(res, 'Bulk notifications processed', {
        total: notifications.length,
        successful: result.results.filter(r => r.success).length,
        failed: result.results.filter(r => !r.success).length,
        errors: result.errors
      });

    } catch (error) {
      this.logger.error('Failed to send bulk notifications', { error: error.message });
      return ResponseHelper.error(res, 'Internal server error', null, 500);
    }
  });

  /**
   * Get user notifications
   * GET /api/v1/notifications/my
   */
  public getMyNotifications = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user.id;
    const status = req.query.status as string;
    const type = req.query.type as string;
    const priority = req.query.priority as string;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    try {
      const result = await NotificationEngine.getRepository().getByRecipient(userId, {
        status: status as any,
        type: type as any,
        priority: priority as any,
        page,
        limit
      });
      
      if (!result.success) {
        return ResponseHelper.error(res, 'Failed to fetch notifications', null, 500);
      }

      return ResponseHelper.success(res, 'Notifications retrieved successfully', result.data);

    } catch (error) {
      this.logger.error('Failed to get user notifications', { error: error.message });
      return ResponseHelper.error(res, 'Internal server error', null, 500);
    }
  });

  /**
   * Get notification statistics
   * GET /api/v1/notifications/statistics
   */
  public getNotificationStatistics = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.query.userId as string;

    try {
      const stats = await NotificationEngine.getStatistics(userId);
      return ResponseHelper.success(res, 'Statistics retrieved successfully', stats);

    } catch (error) {
      this.logger.error('Failed to get notification statistics', { error: error.message });
      return ResponseHelper.error(res, 'Internal server error', null, 500);
    }
  });

  /**
   * Get notification templates
   * GET /api/v1/notifications/templates
   */
  public getNotificationTemplates = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const type = req.query.type as string;

    try {
      let templates;
      if (type) {
        templates = await NotificationEngine.getTemplateService().getTemplatesByType(type as any);
      } else {
        templates = await NotificationEngine.getTemplateService().getAllTemplates();
      }

      return ResponseHelper.success(res, 'Templates retrieved successfully', templates);

    } catch (error) {
      this.logger.error('Failed to get notification templates', { error: error.message });
      return ResponseHelper.error(res, 'Internal server error', null, 500);
    }
  });

  /**
   * Register a device token for push notifications
   * POST /api/v1/notifications/register-device
   */
  public registerDevice = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user.id;
    const { deviceToken, platform } = req.body || {};

    if (!deviceToken) {
      return this.handleBadRequest(res, 'Missing required field: deviceToken');
    }

    try {
      const ok = await NotificationEngine.getPushService().registerToken(userId, deviceToken, (platform || 'web'));
      if (!ok) {
        return ResponseHelper.error(res, 'Failed to register device token', null, 500);
      }
      this.logAction('REGISTER_DEVICE_TOKEN', userId, null, { platform: platform || 'web' });
      return ResponseHelper.success(res, 'Device token registered successfully');
    } catch (error) {
      this.logger.error('Failed to register device token', { error: (error as Error).message });
      return ResponseHelper.error(res, 'Internal server error', null, 500);
    }
  });

  /**
   * Unregister a device token for push notifications
   * POST /api/v1/notifications/unregister-device
   */
  public unregisterDevice = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user.id;
    const { deviceToken } = req.body || {};

    if (!deviceToken) {
      return this.handleBadRequest(res, 'Missing required field: deviceToken');
    }

    try {
      const ok = await NotificationEngine.getPushService().unregisterToken(userId, deviceToken);
      if (!ok) {
        return ResponseHelper.error(res, 'Failed to unregister device token', null, 500);
      }
      this.logAction('UNREGISTER_DEVICE_TOKEN', userId);
      return ResponseHelper.success(res, 'Device token unregistered successfully');
    } catch (error) {
      this.logger.error('Failed to unregister device token', { error: (error as Error).message });
      return ResponseHelper.error(res, 'Internal server error', null, 500);
    }
  });

  /**
   * Create notification template
   * POST /api/v1/notifications/templates
   */
  public createNotificationTemplate = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const {
      name,
      type,
      title,
      message,
      channels,
      priority,
      variables,
      isActive
    } = req.body;

    // Validate required fields
    if (!name || !type || !title || !message || !channels || !priority) {
      return this.handleBadRequest(res, 'Missing required fields: name, type, title, message, channels, priority');
    }

    try {
      const template = await NotificationEngine.getTemplateService().createTemplate({
        name,
        type,
        title,
        message,
        channels,
        priority,
        variables: variables || [],
        isActive: isActive !== undefined ? isActive : true
      });

      this.logAction('CREATE_NOTIFICATION_TEMPLATE', req.user.id, template.id, { name, type });

      return ResponseHelper.success(res, 'Template created successfully', template);

    } catch (error) {
      this.logger.error('Failed to create notification template', { error: error.message });
      return ResponseHelper.error(res, 'Internal server error', null, 500);
    }
  });

  /**
   * Update notification template
   * PUT /api/v1/notifications/templates/:id
   */
  public updateNotificationTemplate = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;
    const updates = req.body;

    try {
      const template = await NotificationEngine.getTemplateService().updateTemplate(id, updates);

      if (!template) {
        return ResponseHelper.error(res, 'Template not found', null, 404);
      }

      this.logAction('UPDATE_NOTIFICATION_TEMPLATE', req.user.id, id, { name: template.name });

      return ResponseHelper.success(res, 'Template updated successfully', template);

    } catch (error) {
      this.logger.error('Failed to update notification template', { error: error.message });
      return ResponseHelper.error(res, 'Internal server error', null, 500);
    }
  });

  /**
   * Delete notification template
   * DELETE /api/v1/notifications/templates/:id
   */
  public deleteNotificationTemplate = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    try {
      const success = await NotificationEngine.getTemplateService().deleteTemplate(id);

      if (!success) {
        return ResponseHelper.error(res, 'Template not found', null, 404);
      }

      this.logAction('DELETE_NOTIFICATION_TEMPLATE', req.user.id, id);

      return ResponseHelper.success(res, 'Template deleted successfully');

    } catch (error) {
      this.logger.error('Failed to delete notification template', { error: error.message });
      return ResponseHelper.error(res, 'Internal server error', null, 500);
    }
  });

  /**
   * Mark notification as read
   * PUT /api/v1/notifications/:id/read
   */
  public markNotificationAsRead = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      // Verify notification belongs to user
      const notification = await NotificationEngine.getRepository().getById(id);
      if (!notification.success || !notification.data) {
        return ResponseHelper.error(res, 'Notification not found', null, 404);
      }

      if (notification.data.recipientId !== userId) {
        return ResponseHelper.error(res, 'Not authorized to access this notification', null, 403);
      }

      // Update read status and timestamp
      const result = await NotificationEngine.getRepository().update(id, {
        isRead: true,
        readAt: new Date(),
        metadata: { ...notification.data.metadata, readAt: new Date() }
      });
      
      if (!result.success) {
        return ResponseHelper.error(res, 'Failed to mark notification as read', null, 500);
      }

      this.logAction('MARK_NOTIFICATION_READ', userId, id);

      return ResponseHelper.success(res, 'Notification marked as read');

    } catch (error) {
      this.logger.error('Failed to mark notification as read', { error: error.message });
      return ResponseHelper.error(res, 'Internal server error', null, 500);
    }
  });

  /**
   * Process scheduled notifications (admin only)
   * POST /api/v1/notifications/process-scheduled
   */
  public processScheduledNotifications = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return ResponseHelper.error(res, 'Admin access required', null, 403);
    }

    try {
      await NotificationEngine.processScheduledNotifications();
      return ResponseHelper.success(res, 'Scheduled notifications processed successfully');

    } catch (error) {
      this.logger.error('Failed to process scheduled notifications', { error: error.message });
      return ResponseHelper.error(res, 'Internal server error', null, 500);
    }
  });

  /**
   * Clean up expired notifications (admin only)
   * POST /api/v1/notifications/cleanup
   */
  public cleanupExpiredNotifications = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return ResponseHelper.error(res, 'Admin access required', null, 403);
    }

    try {
      const result = await NotificationEngine.getRepository().cleanupExpiredNotifications();
      
      if (!result.success) {
        return ResponseHelper.error(res, 'Failed to cleanup expired notifications', null, 500);
      }

      this.logAction('CLEANUP_EXPIRED_NOTIFICATIONS', req.user.id, null, { deleted: result.data.deleted });

      return ResponseHelper.success(res, 'Expired notifications cleaned up successfully', {
        deleted: result.data.deleted
      });

    } catch (error) {
      this.logger.error('Failed to cleanup expired notifications', { error: error.message });
      return ResponseHelper.error(res, 'Internal server error', null, 500);
    }
  });

  /**
   * Get notification service status
   * GET /api/v1/notifications/status
   */
  public getNotificationStatus = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const emailStatus = await NotificationEngine.getEmailService().getStatus();
      const pushStatus = await NotificationEngine.getPushService().getStatus();

      return ResponseHelper.success(res, 'Service status retrieved successfully', {
        email: emailStatus,
        push: pushStatus,
        timestamp: new Date()
      });

    } catch (error) {
      this.logger.error('Failed to get notification status', { error: error.message });
      return ResponseHelper.error(res, 'Internal server error', null, 500);
    }
  });
}

export default new NotificationController();
