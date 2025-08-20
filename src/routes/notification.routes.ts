import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all notification routes
router.use(authenticateToken);

// System Notifications
router.get('/system', NotificationController.getSystemNotifications);
router.put('/:notificationId/read', NotificationController.markNotificationAsRead);
router.put('/mark-all-read', NotificationController.markAllNotificationsAsRead);

// Push Notifications
router.post('/push', NotificationController.sendPushNotification);

// Email Templates
router.get('/email-templates', NotificationController.getEmailTemplates);
router.post('/email-templates', NotificationController.createEmailTemplate);
router.put('/email-templates/:templateId', NotificationController.updateEmailTemplate);
router.delete('/email-templates/:templateId', NotificationController.deleteEmailTemplate);

// Scheduled Notifications
router.get('/scheduled', NotificationController.getScheduledNotifications);
router.post('/scheduled', NotificationController.createScheduledNotification);
router.put('/scheduled/:notificationId', NotificationController.updateScheduledNotification);
router.delete('/scheduled/:notificationId', NotificationController.deleteScheduledNotification);

// Notification Statistics
router.get('/stats', NotificationController.getNotificationStats);

export default router;
