import { Router } from 'express';
import { requireAuth } from '@/middleware/auth.middleware';
import controller from '@/controllers/notification.controller';

const router = Router();

// =====================================================
// NOTIFICATION ROUTES
// =====================================================

/**
 * @swagger
 * /notifications/send:
 *   post:
 *     summary: Send notification
 *     description: Send a notification immediately
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - recipientId
 *               - title
 *               - message
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [inspection_scheduled, inspection_started, inspection_completed, dispute_raised, dispute_resolved, reminder, system, security]
 *               recipientId:
 *                 type: string
 *                 format: uuid
 *               recipientEmail:
 *                 type: string
 *                 format: email
 *               recipientPhone:
 *                 type: string
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               data:
 *                 type: object
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *                 default: normal
 *               channels:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [email, sms, push, webhook, in_app]
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/send', requireAuth, controller.sendNotification);

/**
 * @swagger
 * /notifications/send-templated:
 *   post:
 *     summary: Send templated notification
 *     description: Send a notification using a predefined template
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - templateName
 *               - recipientId
 *               - templateData
 *             properties:
 *               templateName:
 *                 type: string
 *               recipientId:
 *                 type: string
 *                 format: uuid
 *               templateData:
 *                 type: object
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Templated notification sent successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/send-templated', requireAuth, controller.sendTemplatedNotification);

/**
 * @swagger
 * /notifications/schedule:
 *   post:
 *     summary: Schedule notification
 *     description: Schedule a notification for later delivery
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - recipientId
 *               - title
 *               - message
 *               - scheduledAt
 *             properties:
 *               type:
 *                 type: string
 *               recipientId:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Notification scheduled successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/schedule', requireAuth, controller.scheduleNotification);

/**
 * @swagger
 * /notifications/send-bulk:
 *   post:
 *     summary: Send bulk notifications
 *     description: Send multiple notifications at once
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notifications
 *             properties:
 *               notifications:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Bulk notifications processed
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/send-bulk', requireAuth, controller.sendBulkNotifications);

/**
 * @swagger
 * /notifications/my:
 *   get:
 *     summary: Get my notifications
 *     description: Retrieve notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, scheduled, sending, delivered, partially_delivered, failed, cancelled, expired]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/my', requireAuth, controller.getMyNotifications);

/**
 * @swagger
 * /notifications/statistics:
 *   get:
 *     summary: Get notification statistics
 *     description: Retrieve notification statistics (admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *           description: Filter statistics by specific user
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/statistics', requireAuth, controller.getNotificationStatistics);

/**
 * @swagger
 * /notifications/templates:
 *   get:
 *     summary: Get notification templates
 *     description: Retrieve available notification templates
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           description: Filter templates by notification type
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/templates', requireAuth, controller.getNotificationTemplates);

// Device registration for push notifications
router.post('/register-device', requireAuth, controller.registerDevice);
router.post('/unregister-device', requireAuth, controller.unregisterDevice);

/**
 * @swagger
 * /notifications/templates:
 *   post:
 *     summary: Create notification template
 *     description: Create a new notification template (admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - title
 *               - message
 *               - channels
 *               - priority
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               channels:
 *                 type: array
 *                 items:
 *                   type: string
 *               priority:
 *                 type: string
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Template created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/templates', requireAuth, controller.createNotificationTemplate);

/**
 * @swagger
 * /notifications/templates/{id}:
 *   put:
 *     summary: Update notification template
 *     description: Update an existing notification template (admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Template updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Template not found
 *       500:
 *         description: Internal server error
 */
router.put('/templates/:id', requireAuth, controller.updateNotificationTemplate);

/**
 * @swagger
 * /notifications/templates/{id}:
 *   delete:
 *     summary: Delete notification template
 *     description: Delete a notification template (admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Template not found
 *       500:
 *         description: Internal server error
 */
router.delete('/templates/:id', requireAuth, controller.deleteNotificationTemplate);

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     description: Mark a notification as read by the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/read', requireAuth, controller.markNotificationAsRead);

/**
 * @swagger
 * /notifications/process-scheduled:
 *   post:
 *     summary: Process scheduled notifications
 *     description: Process all scheduled notifications (admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scheduled notifications processed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.post('/process-scheduled', requireAuth, controller.processScheduledNotifications);

/**
 * @swagger
 * /notifications/cleanup:
 *   post:
 *     summary: Clean up expired notifications
 *     description: Remove expired notifications from the system (admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expired notifications cleaned up successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.post('/cleanup', requireAuth, controller.cleanupExpiredNotifications);

/**
 * @swagger
 * /notifications/status:
 *   get:
 *     summary: Get notification service status
 *     description: Check the status of notification services
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service status retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/status', requireAuth, controller.getNotificationStatus);

export default router;
