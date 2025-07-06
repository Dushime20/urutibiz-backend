/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification Management API
 * 
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Notification ID
 *         user_id:
 *           type: string
 *           description: User ID
 *         template_id:
 *           type: string
 *           description: Template ID (if used)
 *         type:
 *           type: string
 *           enum: [booking_confirmed, booking_cancelled, booking_reminder, payment_received, payment_failed, verification_complete, new_review, account_welcome, password_reset, custom]
 *           description: Notification type
 *         title:
 *           type: string
 *           description: Notification title
 *         message:
 *           type: string
 *           description: Notification message
 *         channels:
 *           type: array
 *           items:
 *             type: string
 *             enum: [email, sms, push, in_app]
 *           description: Delivery channels
 *         action_url:
 *           type: string
 *           description: Action URL (optional)
 *         is_read:
 *           type: boolean
 *           description: Read status
 *         expires_at:
 *           type: string
 *           format: date-time
 *           description: Expiration date (optional)
 *         metadata:
 *           type: object
 *           description: Additional metadata
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation date
 *         read_at:
 *           type: string
 *           format: date-time
 *           description: Read date (optional)
 *         sent_at:
 *           type: string
 *           format: date-time
 *           description: Sent date (optional)
 * 
 *     CreateNotificationRequest:
 *       type: object
 *       required: [user_id, title, message]
 *       properties:
 *         user_id:
 *           type: string
 *           description: Target user ID
 *         template_id:
 *           type: string
 *           description: Template ID (optional)
 *         type:
 *           type: string
 *           enum: [booking_confirmed, booking_cancelled, booking_reminder, payment_received, payment_failed, verification_complete, new_review, account_welcome, password_reset, custom]
 *           description: Notification type
 *         title:
 *           type: string
 *           description: Notification title
 *         message:
 *           type: string
 *           description: Notification message
 *         channels:
 *           type: array
 *           items:
 *             type: string
 *             enum: [email, sms, push, in_app]
 *           description: Delivery channels
 *         action_url:
 *           type: string
 *           description: Action URL (optional)
 *         expires_at:
 *           type: string
 *           format: date-time
 *           description: Expiration date (optional)
 *         metadata:
 *           type: object
 *           description: Additional metadata
 * 
 *     BulkNotificationRequest:
 *       type: object
 *       required: [user_ids]
 *       properties:
 *         user_ids:
 *           type: array
 *           items:
 *             type: string
 *           description: Target user IDs
 *         template_name:
 *           type: string
 *           description: Template name (alternative to direct fields)
 *         type:
 *           type: string
 *           enum: [booking_confirmed, booking_cancelled, booking_reminder, payment_received, payment_failed, verification_complete, new_review, account_welcome, password_reset, custom]
 *           description: Notification type
 *         title:
 *           type: string
 *           description: Notification title
 *         message:
 *           type: string
 *           description: Notification message
 *         channels:
 *           type: array
 *           items:
 *             type: string
 *             enum: [email, sms, push, in_app]
 *           description: Delivery channels
 *         action_url:
 *           type: string
 *           description: Action URL (optional)
 *         expires_at:
 *           type: string
 *           format: date-time
 *           description: Expiration date (optional)
 *         metadata:
 *           type: object
 *           description: Additional metadata and template variables
 * 
 *     NotificationTemplate:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Template ID
 *         name:
 *           type: string
 *           description: Template name
 *         type:
 *           type: string
 *           enum: [email, sms, push, in_app]
 *           description: Template type
 *         subject_template:
 *           type: string
 *           description: Subject template with variables
 *         body_template:
 *           type: string
 *           description: Body template with variables
 *         variables:
 *           type: array
 *           items:
 *             type: string
 *           description: Available variables
 *         is_active:
 *           type: boolean
 *           description: Active status
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation date
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update date
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { NotificationController } from '@/controllers/notification.controller';
import { authenticateToken, requireRole } from '@/middleware/auth.middleware';

const router = Router();
const notificationController = new NotificationController();

// User notification routes
/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [booking_confirmed, booking_cancelled, booking_reminder, payment_received, payment_failed, verification_complete, new_review, account_welcome, password_reset, custom]
 *         description: Filter by notification type
 *       - in: query
 *         name: channel
 *         schema:
 *           type: string
 *           enum: [email, sms, push, in_app]
 *         description: Filter by channel
 *       - in: query
 *         name: is_read
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: created_at
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *                     unreadCount:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', 
  authenticateToken,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(['booking_confirmed', 'booking_cancelled', 'booking_reminder', 'payment_received', 'payment_failed', 'verification_complete', 'new_review', 'account_welcome', 'password_reset', 'custom']),
  query('channel').optional().isIn(['email', 'sms', 'push', 'in_app']),
  query('is_read').optional().isBoolean(),
  query('from_date').optional().isISO8601(),
  query('to_date').optional().isISO8601(),
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  notificationController.getUserNotifications.bind(notificationController) as any
);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get unread notifications count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/unread-count', 
  authenticateToken,
  notificationController.getUnreadCount.bind(notificationController) as any
);

/**
 * @swagger
 * /api/notifications/unread:
 *   get:
 *     summary: Get unread notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/unread', 
  authenticateToken,
  notificationController.getUnreadNotifications.bind(notificationController) as any
);

/**
 * @swagger
 * /api/notifications/stats:
 *   get:
 *     summary: Get notification statistics
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     unread:
 *                       type: integer
 *                     byType:
 *                       type: object
 *                     byChannel:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/stats', 
  authenticateToken,
  notificationController.getStats.bind(notificationController) as any
);

/**
 * @swagger
 * /api/notifications/{notificationId}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.patch('/:notificationId/read', 
  authenticateToken,
  param('notificationId').isUUID(),
  notificationController.markAsRead.bind(notificationController) as any
);

/**
 * @swagger
 * /api/notifications/mark-multiple-read:
 *   patch:
 *     summary: Mark multiple notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [notificationIds]
 *             properties:
 *               notificationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of notification IDs
 *     responses:
 *       200:
 *         description: Notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch('/mark-multiple-read', 
  authenticateToken,
  body('notificationIds').isArray().notEmpty(),
  body('notificationIds.*').isUUID(),
  notificationController.markMultipleAsRead.bind(notificationController) as any
);

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   patch:
 *     summary: Mark all notifications as read for user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch('/mark-all-read', 
  authenticateToken,
  notificationController.markAllAsRead.bind(notificationController) as any
);

/**
 * @swagger
 * /api/notifications/{notificationId}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.delete('/:notificationId', 
  authenticateToken,
  param('notificationId').isUUID(),
  notificationController.deleteNotification.bind(notificationController) as any
);

// Admin routes
/**
 * @swagger
 * /api/notifications/admin/create:
 *   post:
 *     summary: Create single notification (Admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateNotificationRequest'
 *     responses:
 *       201:
 *         description: Notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     notification:
 *                       $ref: '#/components/schemas/Notification'
 *                     deliveryResults:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.post('/admin/create', 
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  body('user_id').isUUID(),
  body('template_id').optional().isUUID(),
  body('type').isIn(['booking_confirmed', 'booking_cancelled', 'booking_reminder', 'payment_received', 'payment_failed', 'verification_complete', 'new_review', 'account_welcome', 'password_reset', 'custom']),
  body('title').isString().trim().isLength({ min: 1, max: 255 }),
  body('message').isString().trim().isLength({ min: 1 }),
  body('channels').optional().isArray(),
  body('channels.*').optional().isIn(['email', 'sms', 'push', 'in_app']),
  body('action_url').optional().isURL(),
  body('expires_at').optional().isISO8601(),
  body('metadata').optional().isObject(),
  notificationController.createNotification.bind(notificationController) as any
);

/**
 * @swagger
 * /api/notifications/admin/bulk:
 *   post:
 *     summary: Create bulk notifications (Admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkNotificationRequest'
 *     responses:
 *       201:
 *         description: Bulk notifications created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     deliveryResults:
 *                       type: array
 *                       items:
 *                         type: array
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.post('/admin/bulk', 
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  body('user_ids').isArray().notEmpty(),
  body('user_ids.*').isUUID(),
  body('template_name').optional().isString(),
  body('type').optional().isIn(['booking_confirmed', 'booking_cancelled', 'booking_reminder', 'payment_received', 'payment_failed', 'verification_complete', 'new_review', 'account_welcome', 'password_reset', 'custom']),
  body('title').optional().isString().trim().isLength({ min: 1, max: 255 }),
  body('message').optional().isString().trim().isLength({ min: 1 }),
  body('channels').optional().isArray(),
  body('channels.*').optional().isIn(['email', 'sms', 'push', 'in_app']),
  body('action_url').optional().isURL(),
  body('expires_at').optional().isISO8601(),
  body('metadata').optional().isObject(),
  notificationController.createBulkNotifications.bind(notificationController) as any
);

/**
 * @swagger
 * /api/notifications/admin/templates:
 *   get:
 *     summary: Get notification templates (Admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     templates:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/NotificationTemplate'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/admin/templates', 
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  notificationController.getTemplates.bind(notificationController) as any
);

/**
 * @swagger
 * /api/notifications/admin/templates:
 *   post:
 *     summary: Create notification template (Admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type, subject_template, body_template]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Template name
 *               type:
 *                 type: string
 *                 enum: [email, sms, push, in_app]
 *                 description: Template type
 *               subject_template:
 *                 type: string
 *                 description: Subject template with variables
 *               body_template:
 *                 type: string
 *                 description: Body template with variables
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Available variables
 *               is_active:
 *                 type: boolean
 *                 default: true
 *                 description: Active status
 *     responses:
 *       201:
 *         description: Template created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.post('/admin/templates', 
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  body('name').isString().trim().isLength({ min: 1, max: 100 }),
  body('type').isIn(['email', 'sms', 'push', 'in_app']),
  body('subject_template').isString().trim().isLength({ min: 1 }),
  body('body_template').isString().trim().isLength({ min: 1 }),
  body('variables').optional().isArray(),
  body('variables.*').optional().isString(),
  body('is_active').optional().isBoolean(),
  notificationController.saveTemplate.bind(notificationController) as any
);

/**
 * @swagger
 * /api/notifications/admin/templates/{templateId}:
 *   put:
 *     summary: Update notification template (Admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Template name
 *               type:
 *                 type: string
 *                 enum: [email, sms, push, in_app]
 *                 description: Template type
 *               subject_template:
 *                 type: string
 *                 description: Subject template with variables
 *               body_template:
 *                 type: string
 *                 description: Body template with variables
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Available variables
 *               is_active:
 *                 type: boolean
 *                 description: Active status
 *     responses:
 *       200:
 *         description: Template updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Template not found
 *       500:
 *         description: Server error
 */
router.put('/admin/templates/:templateId', 
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  param('templateId').isUUID(),
  body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('type').optional().isIn(['email', 'sms', 'push', 'in_app']),
  body('subject_template').optional().isString().trim().isLength({ min: 1 }),
  body('body_template').optional().isString().trim().isLength({ min: 1 }),
  body('variables').optional().isArray(),
  body('variables.*').optional().isString(),
  body('is_active').optional().isBoolean(),
  notificationController.saveTemplate.bind(notificationController) as any
);

/**
 * @swagger
 * /api/notifications/admin/delivery-stats:
 *   get:
 *     summary: Get delivery statistics (Admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: notificationId
 *         schema:
 *           type: string
 *         description: Filter by specific notification ID
 *     responses:
 *       200:
 *         description: Delivery statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     sent:
 *                       type: integer
 *                     failed:
 *                       type: integer
 *                     pending:
 *                       type: integer
 *                     byChannel:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/admin/delivery-stats', 
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  query('notificationId').optional().isUUID(),
  notificationController.getDeliveryStats.bind(notificationController) as any
);

/**
 * @swagger
 * /api/notifications/admin/test-providers:
 *   post:
 *     summary: Test notification providers (Admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Provider test completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: object
 *                     enabledChannels:
 *                       type: array
 *                       items:
 *                         type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         working:
 *                           type: integer
 *                         failed:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.post('/admin/test-providers', 
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  notificationController.testProviders.bind(notificationController) as any
);

/**
 * @swagger
 * /api/notifications/admin/retry-failed:
 *   post:
 *     summary: Retry failed deliveries (Admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Failed deliveries retry initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.post('/admin/retry-failed', 
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  notificationController.retryFailedDeliveries.bind(notificationController) as any
);

export default router;
