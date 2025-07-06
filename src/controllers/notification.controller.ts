import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { AuthenticatedRequest } from '@/types';
import { ResponseHelper } from '@/utils/response';
import NotificationService from '@/services/notification.service';
import { NotificationDeliveryService } from '@/services/notificationDelivery.service';
import { 
  CreateNotificationDTO, 
  BulkNotificationDTO, 
  NotificationFilters,
  NotificationChannelType,
  NotificationType 
} from '@/types/notification.types';
import { Notification } from '@/models/Notification.model';
import { NotificationTemplate } from '@/models/NotificationTemplate.model';
import logger from '@/utils/logger';

export class NotificationController extends BaseController {
  private deliveryService: NotificationDeliveryService;

  constructor() {
    super();
    this.deliveryService = new NotificationDeliveryService();
  }

  // Get user notifications with pagination and filtering
  public async getUserNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (this.handleValidationErrors(req, res)) return;

      const user = req.user!;
      const { page, limit } = this.getPaginationParams(req);
      const { sortBy, sortOrder } = this.getSortParams(req, 'created_at', 'desc');

      const filters: NotificationFilters = {
        type: req.query.type as NotificationType,
        channel: req.query.channel as NotificationChannelType,
        is_read: req.query.is_read === 'true' ? true : req.query.is_read === 'false' ? false : undefined,
        from_date: req.query.from_date ? new Date(req.query.from_date as string) : undefined,
        to_date: req.query.to_date ? new Date(req.query.to_date as string) : undefined,
        limit,
        offset: (page - 1) * limit,
        sortBy,
        sortOrder
      };

      const notifications = await NotificationService.getUserNotifications(user.id, filters);
      const totalCount = await Notification.getTotalCount(user.id, filters);
      const unreadCount = await NotificationService.getUserUnreadCount(user.id);

      ResponseHelper.success(res, 'Notifications retrieved successfully', {
        notifications,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        unreadCount
      });
    } catch (error: any) {
      logger.error('Error getting user notifications:', error);
      ResponseHelper.error(res, 'Failed to get notifications', error.message);
    }
  }

  // Get unread notifications count
  public async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const count = await NotificationService.getUserUnreadCount(user.id);
      
      ResponseHelper.success(res, 'Unread count retrieved successfully', { count });
    } catch (error: any) {
      logger.error('Error getting unread count:', error);
      ResponseHelper.error(res, 'Failed to get unread count', error.message);
    }
  }

  // Get unread notifications
  public async getUnreadNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const notifications = await NotificationService.getUserUnreadNotifications(user.id);
      
      ResponseHelper.success(res, 'Unread notifications retrieved successfully', { notifications });
    } catch (error: any) {
      logger.error('Error getting unread notifications:', error);
      ResponseHelper.error(res, 'Failed to get unread notifications', error.message);
    }
  }

  // Mark notification as read
  public async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (this.handleValidationErrors(req, res)) return;

      const { notificationId } = req.params;
      const user = req.user!;

      // Verify notification belongs to user
      const notification = await Notification.findById(notificationId);
      if (!notification || notification.user_id !== user.id) {
        ResponseHelper.error(res, 'Notification not found', null, 404);
        return;
      }

      await NotificationService.markAsRead(notificationId);
      ResponseHelper.success(res, 'Notification marked as read');
    } catch (error: any) {
      logger.error('Error marking notification as read:', error);
      ResponseHelper.error(res, 'Failed to mark notification as read', error.message);
    }
  }

  // Mark multiple notifications as read
  public async markMultipleAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (this.handleValidationErrors(req, res)) return;

      const { notificationIds } = req.body;
      const user = req.user!;

      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        ResponseHelper.error(res, 'Invalid notification IDs', null, 400);
        return;
      }

      // Verify all notifications belong to user
      const notifications = await Promise.all(
        notificationIds.map(id => Notification.findById(id))
      );

      const invalidNotifications = notifications.filter(
        notification => !notification || notification.user_id !== user.id
      );

      if (invalidNotifications.length > 0) {
        ResponseHelper.error(res, 'Some notifications not found or unauthorized', null, 403);
        return;
      }

      const count = await NotificationService.markMultipleAsRead(notificationIds);
      ResponseHelper.success(res, `${count} notifications marked as read`, { count });
    } catch (error: any) {
      logger.error('Error marking multiple notifications as read:', error);
      ResponseHelper.error(res, 'Failed to mark notifications as read', error.message);
    }
  }

  // Mark all notifications as read for user
  public async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const count = await NotificationService.markAllAsReadForUser(user.id);
      
      ResponseHelper.success(res, `All notifications marked as read`, { count });
    } catch (error: any) {
      logger.error('Error marking all notifications as read:', error);
      ResponseHelper.error(res, 'Failed to mark all notifications as read', error.message);
    }
  }

  // Delete notification
  public async deleteNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { notificationId } = req.params;
      const user = req.user!;

      // Verify notification belongs to user
      const notification = await Notification.findById(notificationId);
      if (!notification || notification.user_id !== user.id) {
        ResponseHelper.error(res, 'Notification not found', null, 404);
        return;
      }

      await NotificationService.deleteNotification(notificationId);
      ResponseHelper.success(res, 'Notification deleted successfully');
    } catch (error: any) {
      logger.error('Error deleting notification:', error);
      ResponseHelper.error(res, 'Failed to delete notification', error.message);
    }
  }

  // Get notification statistics
  public async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const stats = await NotificationService.getNotificationStats(user.id);
      
      ResponseHelper.success(res, 'Notification statistics retrieved successfully', stats);
    } catch (error: any) {
      logger.error('Error getting notification stats:', error);
      ResponseHelper.error(res, 'Failed to get notification statistics', error.message);
    }
  }

  // Admin: Create single notification
  public async createNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (this.handleValidationErrors(req, res)) return;

      const user = req.user!;
      
      // Check if user has admin privileges
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        ResponseHelper.error(res, 'Insufficient permissions', null, 403);
        return;
      }

      const notificationData: CreateNotificationDTO = req.body;
      const notification = await NotificationService.createNotification(notificationData);
      
      // Trigger delivery
      const deliveryResults = await this.deliveryService.deliverNotification(notification);
      
      ResponseHelper.success(res, 'Notification created and sent successfully', {
        notification,
        deliveryResults
      }, 201);
    } catch (error: any) {
      logger.error('Error creating notification:', error);
      ResponseHelper.error(res, 'Failed to create notification', error.message);
    }
  }

  // Admin: Create bulk notifications
  public async createBulkNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (this.handleValidationErrors(req, res)) return;

      const user = req.user!;
      
      // Check if user has admin privileges
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        ResponseHelper.error(res, 'Insufficient permissions', null, 403);
        return;
      }

      const bulkData: BulkNotificationDTO = req.body;
      const notifications = await NotificationService.createBulkNotifications(bulkData);
      
      // Trigger delivery for all notifications
      const deliveryResults = await Promise.all(
        notifications.map(notification => this.deliveryService.deliverNotification(notification))
      );
      
      ResponseHelper.success(res, 'Bulk notifications created and sent successfully', {
        count: notifications.length,
        notifications,
        deliveryResults
      }, 201);
    } catch (error: any) {
      logger.error('Error creating bulk notifications:', error);
      ResponseHelper.error(res, 'Failed to create bulk notifications', error.message);
    }
  }

  // Admin: Get notification templates
  public async getTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      
      // Check if user has admin privileges
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        ResponseHelper.error(res, 'Insufficient permissions', null, 403);
        return;
      }

      const { page, limit } = this.getPaginationParams(req);
      const templates = await NotificationTemplate.findAll({ 
        limit, 
        offset: (page - 1) * limit 
      });
      
      const totalCount = await NotificationTemplate.getTotalCount();
      
      ResponseHelper.success(res, 'Templates retrieved successfully', {
        templates,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      });
    } catch (error: any) {
      logger.error('Error getting templates:', error);
      ResponseHelper.error(res, 'Failed to get templates', error.message);
    }
  }

  // Admin: Create/Update notification template
  public async saveTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (this.handleValidationErrors(req, res)) return;

      const user = req.user!;
      
      // Check if user has admin privileges
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        ResponseHelper.error(res, 'Insufficient permissions', null, 403);
        return;
      }

      const templateData = req.body;
      const { templateId } = req.params;

      let template: NotificationTemplate;
      
      if (templateId) {
        // Update existing template
        template = await NotificationTemplate.findById(templateId);
        if (!template) {
          ResponseHelper.error(res, 'Template not found', null, 404);
          return;
        }
        
        Object.assign(template, templateData, { updated_at: new Date() });
        await template.save();
      } else {
        // Create new template
        template = new NotificationTemplate(templateData);
        await template.save();
      }
      
      ResponseHelper.success(res, 'Template saved successfully', template, templateId ? 200 : 201);
    } catch (error: any) {
      logger.error('Error saving template:', error);
      ResponseHelper.error(res, 'Failed to save template', error.message);
    }
  }

  // Admin: Get delivery statistics
  public async getDeliveryStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      
      // Check if user has admin privileges
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        ResponseHelper.error(res, 'Insufficient permissions', null, 403);
        return;
      }

      const { notificationId } = req.query;
      const stats = await this.deliveryService.getDeliveryStats(notificationId as string);
      
      ResponseHelper.success(res, 'Delivery statistics retrieved successfully', stats);
    } catch (error: any) {
      logger.error('Error getting delivery stats:', error);
      ResponseHelper.error(res, 'Failed to get delivery statistics', error.message);
    }
  }

  // Admin: Test notification providers
  public async testProviders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      
      // Check if user has admin privileges
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        ResponseHelper.error(res, 'Insufficient permissions', null, 403);
        return;
      }

      const results = await this.deliveryService.testAllProviders();
      const enabledChannels = this.deliveryService.getEnabledChannels();
      
      ResponseHelper.success(res, 'Provider test completed', {
        results,
        enabledChannels,
        summary: {
          total: Object.keys(results).length,
          working: Object.values(results).filter(Boolean).length,
          failed: Object.values(results).filter(r => !r).length
        }
      });
    } catch (error: any) {
      logger.error('Error testing providers:', error);
      ResponseHelper.error(res, 'Failed to test providers', error.message);
    }
  }

  // Admin: Retry failed deliveries
  public async retryFailedDeliveries(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      
      // Check if user has admin privileges
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        ResponseHelper.error(res, 'Insufficient permissions', null, 403);
        return;
      }

      await this.deliveryService.retryFailedDeliveries();
      ResponseHelper.success(res, 'Failed deliveries retry initiated');
    } catch (error: any) {
      logger.error('Error retrying failed deliveries:', error);
      ResponseHelper.error(res, 'Failed to retry deliveries', error.message);
    }
  }
}
