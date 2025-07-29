import { Router } from 'express';
import adminController from '@/controllers/admin.controller';
import ModerationController from '@/controllers/moderation.controller';
import { authenticateToken as authenticate, requireRole } from '@/middleware/auth.middleware';

const router = Router();

// All admin routes require admin or super_admin role
router.use(authenticate);
router.use(requireRole(['admin', 'super_admin']));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin dashboard and management endpoints
 */

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get main dashboard stats
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */

/**
 * @swagger
 * /admin/analytics:
 *   get:
 *     summary: Get advanced analytics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Analytics data
 */

/**
 * @swagger
 * /admin/metrics/realtime:
 *   get:
 *     summary: Get live metrics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Real-time metrics
 */

/**
 * @swagger
 * /admin/activity:
 *   get:
 *     summary: Get activity feed
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Activity feed
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: List users with stats
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of users
 */

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get user details
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 */

/**
 * @swagger
 * /admin/users/{id}/moderate:
 *   post:
 *     summary: Moderate user
 *     tags: [Admin]
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
 *             properties:
 *               action:
 *                 type: string
 *               reason:
 *                 type: string
 *               duration:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Moderation result
 */

/**
 * @swagger
 * /admin/products:
 *   get:
 *     summary: List products
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of products
 */

/**
 * @swagger
 * /admin/products/{id}:
 *   get:
 *     summary: Get product details
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 */

/**
 * @swagger
 * /admin/products/{id}/moderate:
 *   post:
 *     summary: Moderate product
 *     tags: [Admin]
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
 *             properties:
 *               action:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Moderation result
 */

/**
 * @swagger
 * /admin/bookings:
 *   get:
 *     summary: List bookings
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of bookings
 */

/**
 * @swagger
 * /admin/bookings/{id}:
 *   get:
 *     summary: Get booking details
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking details
 */

/**
 * @swagger
 * /admin/bookings/{id}/override:
 *   post:
 *     summary: Override booking status
 *     tags: [Admin]
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
 *             properties:
 *               status:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Override result
 */

/**
 * @swagger
 * /admin/disputes:
 *   get:
 *     summary: List disputes
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of disputes
 */

/**
 * @swagger
 * /admin/disputes/{id}/assign:
 *   post:
 *     summary: Assign dispute
 *     tags: [Admin]
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
 *             properties:
 *               assigneeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Assignment result
 */

/**
 * @swagger
 * /admin/disputes/{id}/resolve:
 *   post:
 *     summary: Resolve dispute
 *     tags: [Admin]
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
 *             properties:
 *               resolution:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resolution result
 */

/**
 * @swagger
 * /admin/financial/reports:
 *   get:
 *     summary: Get financial reports
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Financial report
 */

/**
 * @swagger
 * /admin/financial/payouts/process:
 *   post:
 *     summary: Process payouts
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payoutIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Payout processing result
 */

/**
 * @swagger
 * /admin/system/health:
 *   get:
 *     summary: Get system health
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: System health
 */

/**
 * @swagger
 * /admin/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Audit logs
 */

/**
 * @swagger
 * /admin/config:
 *   get:
 *     summary: Get configuration (super admin only)
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Configuration data
 */

/**
 * @swagger
 * /admin/config:
 *   put:
 *     summary: Update configuration (super admin only)
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: string
 *     responses:
 *       200:
 *         description: Update result
 */

/**
 * @swagger
 * /admin/announcements:
 *   post:
 *     summary: Send announcement (super admin only)
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               targetUsers:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Announcement result
 */

/**
 * @swagger
 * /admin/export:
 *   post:
 *     summary: Export data
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               filters:
 *                 type: object
 *               format:
 *                 type: string
 *     responses:
 *       200:
 *         description: Export result
 */

/**
 * @swagger
 * tags:
 *   name: Moderation
 *   description: Automated Moderation Management
 */

// Moderation Configuration
/**
 * @swagger
 * /admin/moderation/config:
 *   get:
 *     summary: Get current moderation config
 *     tags: [Moderation]
 *     responses:
 *       200:
 *         description: Moderation config
 */
router.get('/moderation/config', ModerationController.getConfig);
/**
 * @swagger
 * /admin/moderation/config:
 *   put:
 *     summary: Update moderation config
 *     tags: [Moderation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ModerationConfig'
 *     responses:
 *       200:
 *         description: Updated config
 */
router.put('/moderation/config', ModerationController.updateConfig);

// Moderation Rules
/**
 * @swagger
 * /admin/moderation/rules:
 *   get:
 *     summary: List moderation rules
 *     tags: [Moderation]
 *     responses:
 *       200:
 *         description: List of rules
 */
router.get('/moderation/rules', ModerationController.listRules);
/**
 * @swagger
 * /admin/moderation/rules:
 *   post:
 *     summary: Create moderation rule
 *     tags: [Moderation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ModerationRule'
 *     responses:
 *       201:
 *         description: Created rule
 */
router.post('/moderation/rules', ModerationController.createRule);
/**
 * @swagger
 * /admin/moderation/rules/{id}:
 *   put:
 *     summary: Update moderation rule
 *     tags: [Moderation]
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
 *             $ref: '#/components/schemas/ModerationRule'
 *     responses:
 *       200:
 *         description: Updated rule
 */
router.put('/moderation/rules/:id', ModerationController.updateRule);
/**
 * @swagger
 * /admin/moderation/rules/{id}:
 *   delete:
 *     summary: Delete moderation rule
 *     tags: [Moderation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Deleted
 */
router.delete('/moderation/rules/:id', ModerationController.deleteRule);

// Moderation Queue & Analytics
/**
 * @swagger
 * /admin/moderation/queue:
 *   get:
 *     summary: Get moderation review queue
 *     tags: [Moderation]
 *     responses:
 *       200:
 *         description: Moderation queue
 */
router.get('/moderation/queue', ModerationController.getQueue);
/**
 * @swagger
 * /admin/moderation/metrics:
 *   get:
 *     summary: Get moderation analytics
 *     tags: [Moderation]
 *     responses:
 *       200:
 *         description: Moderation metrics
 */
router.get('/moderation/metrics', ModerationController.getMetrics);
/**
 * @swagger
 * /admin/moderation/trigger:
 *   post:
 *     summary: Manually trigger moderation
 *     tags: [Moderation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Moderation result
 */
router.post('/moderation/trigger', ModerationController.triggerModeration);

// Products routes
router.get('/products', adminController.getProducts);
router.get('/products/:id', adminController.getProductDetails);
router.post('/products/:id/moderate', adminController.moderateProduct);

// Bookings routes
router.get('/bookings', adminController.getBookings);
router.get('/bookings/:id', adminController.getBookingDetails);
router.post('/bookings/:id/override', adminController.overrideBookingStatus);

// Users routes
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetails);
router.post('/users/:id/moderate', adminController.moderateUser);

// Disputes routes
router.get('/disputes', adminController.getDisputes);
router.post('/disputes/:id/assign', adminController.assignDispute);
router.post('/disputes/:id/resolve', adminController.resolveDispute);

// Dashboard and Analytics routes
router.get('/dashboard', adminController.getDashboard);
router.get('/analytics', adminController.getAnalytics);
router.get('/metrics/realtime', adminController.getRealTimeMetrics);
router.get('/activity', adminController.getActivity);

// Financial routes
router.get('/financial/reports', adminController.getFinancialReports);
router.post('/financial/payouts/process', adminController.processPayouts);

export default router;
