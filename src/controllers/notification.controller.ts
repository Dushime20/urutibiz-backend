import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { ResponseHelper } from '../utils/response';
import { 
  CreateEmailTemplateRequest, 
  UpdateEmailTemplateRequest, 
  CreateScheduledNotificationRequest, 
  UpdateScheduledNotificationRequest,
  SendPushNotificationRequest 
} from '../types/messaging.types';

export class NotificationController {
  // System Notifications
  static async getSystemNotifications(req: Request, res: Response): Promise<void> {
    try {
      const result = await NotificationService.getSystemNotifications();
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to fetch system notifications');
        return;
      }

      ResponseHelper.success(res, result.data, 'System notifications fetched successfully');
    } catch (error: any) {
      ResponseHelper.internalServerError(res, error.message);
    }
  }

  static async markNotificationAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { notificationId } = req.params;
      const result = await NotificationService.markNotificationAsRead(notificationId);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to mark notification as read');
        return;
      }

      ResponseHelper.success(res, null, 'Notification marked as read');
    } catch (error: any) {
      ResponseHelper.internalServerError(res, error.message);
    }
  }

  static async markAllNotificationsAsRead(req: Request, res: Response): Promise<void> {
    try {
      const result = await NotificationService.markAllNotificationsAsRead();
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to mark all notifications as read');
        return;
      }

      ResponseHelper.success(res, null, 'All notifications marked as read');
    } catch (error: any) {
      ResponseHelper.internalServerError(res, error.message);
    }
  }

  // Push Notifications
  static async sendPushNotification(req: Request, res: Response): Promise<void> {
    try {
      const notificationData: SendPushNotificationRequest = req.body;

      if (!notificationData.title || !notificationData.body || !notificationData.user_ids) {
        ResponseHelper.badRequest(res, 'Title, body, and user_ids are required');
        return;
      }

      const result = await NotificationService.sendPushNotification(notificationData);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to send push notification');
        return;
      }

      ResponseHelper.success(res, null, 'Push notification sent successfully');
    } catch (error: any) {
      ResponseHelper.internalServerError(res, error.message);
    }
  }

  // Email Templates
  static async getEmailTemplates(req: Request, res: Response): Promise<void> {
    try {
      const result = await NotificationService.getEmailTemplates();
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to fetch email templates');
        return;
      }

      ResponseHelper.success(res, result.data, 'Email templates fetched successfully');
    } catch (error: any) {
      ResponseHelper.internalServerError(res, error.message);
    }
  }

  static async createEmailTemplate(req: Request, res: Response): Promise<void> {
    try {
      const templateData: CreateEmailTemplateRequest = req.body;

      if (!templateData.name || !templateData.subject || !templateData.html_content || !templateData.text_content) {
        ResponseHelper.badRequest(res, 'Name, subject, html_content, and text_content are required');
        return;
      }

      const result = await NotificationService.createEmailTemplate(templateData);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to create email template');
        return;
      }

      ResponseHelper.created(res, result.data, 'Email template created successfully');
    } catch (error: any) {
      ResponseHelper.internalServerError(res, error.message);
    }
  }

  static async updateEmailTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;
      const updates: UpdateEmailTemplateRequest = req.body;

      const result = await NotificationService.updateEmailTemplate(templateId, updates);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to update email template');
        return;
      }

      ResponseHelper.success(res, result.data, 'Email template updated successfully');
    } catch (error: any) {
      ResponseHelper.internalServerError(res, error.message);
    }
  }

  static async deleteEmailTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;
      const result = await NotificationService.deleteEmailTemplate(templateId);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to delete email template');
        return;
      }

      ResponseHelper.success(res, null, 'Email template deleted successfully');
    } catch (error: any) {
      ResponseHelper.internalServerError(res, error.message);
    }
  }

  // Scheduled Notifications
  static async getScheduledNotifications(req: Request, res: Response): Promise<void> {
    try {
      const result = await NotificationService.getScheduledNotifications();
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to fetch scheduled notifications');
        return;
      }

      ResponseHelper.success(res, result.data, 'Scheduled notifications fetched successfully');
    } catch (error: any) {
      ResponseHelper.internalServerError(res, error.message);
    }
  }

  static async createScheduledNotification(req: Request, res: Response): Promise<void> {
    try {
      const notificationData: CreateScheduledNotificationRequest = req.body;

      if (!notificationData.title || !notificationData.message || !notificationData.notification_type || !notificationData.target_users || !notificationData.scheduled_at) {
        ResponseHelper.badRequest(res, 'Title, message, notification_type, target_users, and scheduled_at are required');
        return;
      }

      const result = await NotificationService.createScheduledNotification(notificationData);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to create scheduled notification');
        return;
      }

      ResponseHelper.created(res, result.data, 'Scheduled notification created successfully');
    } catch (error: any) {
      ResponseHelper.internalServerError(res, error.message);
    }
  }

  static async updateScheduledNotification(req: Request, res: Response): Promise<void> {
    try {
      const { notificationId } = req.params;
      const updates: UpdateScheduledNotificationRequest = req.body;

      const result = await NotificationService.updateScheduledNotification(notificationId, updates);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to update scheduled notification');
        return;
      }

      ResponseHelper.success(res, result.data, 'Scheduled notification updated successfully');
    } catch (error: any) {
      ResponseHelper.internalServerError(res, error.message);
    }
  }

  static async deleteScheduledNotification(req: Request, res: Response): Promise<void> {
    try {
      const { notificationId } = req.params;
      const result = await NotificationService.deleteScheduledNotification(notificationId);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to delete scheduled notification');
        return;
      }

      ResponseHelper.success(res, null, 'Scheduled notification deleted successfully');
    } catch (error: any) {
      ResponseHelper.internalServerError(res, error.message);
    }
  }

  // Notification Statistics
  static async getNotificationStats(req: Request, res: Response): Promise<void> {
    try {
      const result = await NotificationService.getNotificationStats();
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to fetch notification stats');
        return;
      }

      ResponseHelper.success(res, result.data, 'Notification stats fetched successfully');
    } catch (error: any) {
      ResponseHelper.internalServerError(res, error.message);
    }
  }
}
