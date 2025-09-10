// =====================================================
// VIOLATION ROUTES
// =====================================================

/**
 * @swagger
 * tags:
 *   name: Violations
 *   description: Violation Management API
 * 
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Violation:
 *       type: object
 *       required: [userId, violationType, severity, category, title, description]
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Violation unique identifier
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user who committed the violation
 *         productId:
 *           type: string
 *           format: uuid
 *           description: ID of the product involved (if applicable)
 *         bookingId:
 *           type: string
 *           format: uuid
 *           description: ID of the booking involved (if applicable)
 *         violationType:
 *           type: string
 *           enum: [fraud, harassment, property_damage, payment_fraud, fake_listing, safety_violation, terms_violation, spam, inappropriate_content, unauthorized_use, other]
 *           description: Type of violation
 *         severity:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           description: Severity level of the violation
 *         category:
 *           type: string
 *           enum: [user_behavior, product_quality, payment_issues, safety_concerns, content_policy, fraud, technical, other]
 *           description: Category of the violation
 *         title:
 *           type: string
 *           maxLength: 255
 *           description: Title of the violation
 *         description:
 *           type: string
 *           description: Detailed description of the violation
 *         evidence:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [image, video, document, audio, text]
 *               url:
 *                 type: string
 *                 format: uri
 *               filename:
 *                 type: string
 *               description:
 *                 type: string
 *               uploadedAt:
 *                 type: string
 *                 format: date-time
 *               uploadedBy:
 *                 type: string
 *                 format: uuid
 *         location:
 *           type: object
 *           properties:
 *             address:
 *               type: string
 *             coordinates:
 *               type: object
 *               properties:
 *                 latitude:
 *                   type: number
 *                 longitude:
 *                   type: number
 *         reportedBy:
 *           type: string
 *           format: uuid
 *           description: ID of the user who reported the violation
 *         assignedTo:
 *           type: string
 *           format: uuid
 *           description: ID of the moderator/admin assigned to handle the violation
 *         status:
 *           type: string
 *           enum: [reported, under_review, investigating, resolved, dismissed, escalated, closed]
 *           description: Current status of the violation
 *         resolution:
 *           type: object
 *           properties:
 *             action:
 *               type: string
 *               enum: [warning, fine, suspension, ban, restriction, dismiss, escalate, no_action]
 *             reason:
 *               type: string
 *             penalty:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   enum: [warning, fine, suspension, ban, restriction]
 *                 amount:
 *                   type: number
 *                 duration:
 *                   type: number
 *                   description: Duration in days
 *                 details:
 *                   type: string
 *             resolvedBy:
 *               type: string
 *               format: uuid
 *             resolvedAt:
 *               type: string
 *               format: date-time
 *             notes:
 *               type: string
 *         metadata:
 *           type: object
 *           description: Additional metadata
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         resolvedAt:
 *           type: string
 *           format: date-time
 */

import express from 'express';
import controller from '@/controllers/violation.controller';
import { requireAuth, requireRole } from '@/middleware/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * /api/v1/violations:
 *   post:
 *     summary: Create a new violation
 *     tags: [Violations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, violationType, severity, category, title, description]
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the user who committed the violation
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the product involved (optional)
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the booking involved (optional)
 *               violationType:
 *                 type: string
 *                 enum: [fraud, harassment, property_damage, payment_fraud, fake_listing, safety_violation, terms_violation, spam, inappropriate_content, unauthorized_use, other]
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               category:
 *                 type: string
 *                 enum: [user_behavior, product_quality, payment_issues, safety_concerns, content_policy, fraud, technical, other]
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   address:
 *                     type: string
 *                   coordinates:
 *                     type: object
 *                     properties:
 *                       latitude:
 *                         type: number
 *                       longitude:
 *                         type: number
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Violation created successfully
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
 *                   $ref: '#/components/schemas/Violation'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', requireAuth, controller.createViolation);

/**
 * @swagger
 * /api/v1/violations:
 *   get:
 *     summary: Get violations with filters and pagination
 *     tags: [Violations]
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
 *         description: Number of results per page
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *       - in: query
 *         name: violationType
 *         schema:
 *           type: string
 *           enum: [fraud, harassment, property_damage, payment_fraud, fake_listing, safety_violation, terms_violation, spam, inappropriate_content, unauthorized_use, other]
 *         description: Filter by violation type
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by severity
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [reported, under_review, investigating, resolved, dismissed, escalated, closed]
 *         description: Filter by status
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by assigned moderator/admin
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date (YYYY-MM-DD)
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date (YYYY-MM-DD)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *     responses:
 *       200:
 *         description: Violations retrieved successfully
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
 *                     violations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Violation'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or moderator access required
 *       500:
 *         description: Server error
 */
router.get('/', requireAuth, requireRole(['admin', 'moderator']), controller.getViolations);

/**
 * @swagger
 * /api/v1/violations/stats:
 *   get:
 *     summary: Get violation statistics
 *     tags: [Violations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Violation statistics retrieved successfully
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
 *                     byStatus:
 *                       type: object
 *                     bySeverity:
 *                       type: object
 *                     byCategory:
 *                       type: object
 *                     byType:
 *                       type: object
 *                     resolved:
 *                       type: integer
 *                     pending:
 *                       type: integer
 *                     escalated:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or moderator access required
 *       500:
 *         description: Server error
 */
router.get('/stats', requireAuth, requireRole(['admin', 'moderator']), controller.getViolationStats);

/**
 * @swagger
 * /api/v1/violations/assigned:
 *   get:
 *     summary: Get violations assigned to current user
 *     tags: [Violations]
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
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Assigned violations retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or moderator access required
 *       500:
 *         description: Server error
 */
router.get('/assigned', requireAuth, requireRole(['admin', 'moderator']), controller.getAssignedViolations);

/**
 * @swagger
 * /api/v1/violations/reported:
 *   get:
 *     summary: Get violations reported by current user
 *     tags: [Violations]
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
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Reported violations retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/reported', requireAuth, controller.getReportedViolations);

/**
 * @swagger
 * /api/v1/violations/user/{userId}:
 *   get:
 *     summary: Get violations by user
 *     tags: [Violations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
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
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: User violations retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Can only view own violations unless admin/moderator
 *       500:
 *         description: Server error
 */
router.get('/user/:userId', requireAuth, controller.getViolationsByUser);

/**
 * @swagger
 * /api/v1/violations/{id}:
 *   get:
 *     summary: Get violation by ID
 *     tags: [Violations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Violation ID
 *     responses:
 *       200:
 *         description: Violation retrieved successfully
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
 *                   $ref: '#/components/schemas/Violation'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to view this violation
 *       404:
 *         description: Violation not found
 *       500:
 *         description: Server error
 */
router.get('/:id', requireAuth, controller.getViolation);

/**
 * @swagger
 * /api/v1/violations/{id}:
 *   put:
 *     summary: Update violation
 *     tags: [Violations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Violation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [reported, under_review, investigating, resolved, dismissed, escalated, closed]
 *               assignedTo:
 *                 type: string
 *                 format: uuid
 *               resolution:
 *                 type: object
 *                 properties:
 *                   action:
 *                     type: string
 *                     enum: [warning, fine, suspension, ban, restriction, dismiss, escalate, no_action]
 *                   reason:
 *                     type: string
 *                   penalty:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [warning, fine, suspension, ban, restriction]
 *                       amount:
 *                         type: number
 *                       duration:
 *                         type: number
 *                       details:
 *                         type: string
 *                   notes:
 *                     type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Violation updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or moderator access required
 *       404:
 *         description: Violation not found
 *       500:
 *         description: Server error
 */
router.put('/:id', requireAuth, requireRole(['admin', 'moderator']), controller.updateViolation);

/**
 * @swagger
 * /api/v1/violations/{id}/assign:
 *   post:
 *     summary: Assign violation to moderator/admin
 *     tags: [Violations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Violation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assignedTo]
 *             properties:
 *               assignedTo:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the moderator/admin to assign to
 *     responses:
 *       200:
 *         description: Violation assigned successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Violation not found
 *       500:
 *         description: Server error
 */
router.post('/:id/assign', requireAuth, requireRole(['admin']), controller.assignViolation);

/**
 * @swagger
 * /api/v1/violations/{id}/resolve:
 *   post:
 *     summary: Resolve violation
 *     tags: [Violations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Violation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action, reason]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [warning, fine, suspension, ban, restriction, dismiss, escalate, no_action]
 *               reason:
 *                 type: string
 *               penalty:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [warning, fine, suspension, ban, restriction]
 *                   amount:
 *                     type: number
 *                   duration:
 *                     type: number
 *                   details:
 *                     type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Violation resolved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or moderator access required
 *       404:
 *         description: Violation not found
 *       500:
 *         description: Server error
 */
router.post('/:id/resolve', requireAuth, requireRole(['admin', 'moderator']), controller.resolveViolation);

/**
 * @swagger
 * /api/v1/violations/{id}/evidence:
 *   post:
 *     summary: Add evidence to violation
 *     tags: [Violations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Violation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [image, video, document, audio, text]
 *               filename:
 *                 type: string
 *               url:
 *                 type: string
 *                 format: uri
 *               description:
 *                 type: string
 *               fileSizeBytes:
 *                 type: integer
 *               mimeType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Evidence added successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Violation not found
 *       500:
 *         description: Server error
 */
router.post('/:id/evidence', requireAuth, controller.addEvidence);

/**
 * @swagger
 * /api/v1/violations/{id}/comments:
 *   post:
 *     summary: Add comment to violation
 *     tags: [Violations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Violation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [investigation, resolution, escalation, general]
 *                 default: general
 *               isInternal:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Comment added successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Violation not found
 *       500:
 *         description: Server error
 */
router.post('/:id/comments', requireAuth, controller.addComment);

export default router;
