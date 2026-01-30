/**
 * @swagger
 * tags:
 *   name: Booking Expiration
 *   description: Admin-configurable booking expiration lifecycle management
 * 
 * components:
 *   schemas:
 *     BookingExpirationSettings:
 *       type: object
 *       properties:
 *         booking_expiration_hours:
 *           type: integer
 *           enum: [2, 4, 8, 12, 24, 48]
 *           description: Hours after which unbooked confirmed bookings expire
 *         booking_expiration_enabled:
 *           type: boolean
 *           description: Enable/disable booking expiration
 *         booking_expiration_last_run:
 *           type: string
 *           format: date-time
 *           description: Last time expiration cleanup was run
 *     
 *     BookingExpirationStats:
 *       type: object
 *       properties:
 *         total_expired:
 *           type: integer
 *           description: Total number of bookings expired
 *         recent_expired:
 *           type: integer
 *           description: Bookings expired in last 24 hours
 *         upcoming_expired:
 *           type: integer
 *           description: Bookings expiring in next 2 hours
 *     
 *     BookingExpirationLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         booking_id:
 *           type: string
 *           format: uuid
 *         booking_reference:
 *           type: string
 *         user_id:
 *           type: string
 *           format: uuid
 *         product_title:
 *           type: string
 *         booking_created_at:
 *           type: string
 *           format: date-time
 *         booking_expires_at:
 *           type: string
 *           format: date-time
 *         expiration_hours_used:
 *           type: integer
 *         booking_status:
 *           type: string
 *         booking_amount:
 *           type: number
 *         deletion_reason:
 *           type: string
 *         expired_at:
 *           type: string
 *           format: date-time
 *         expired_by:
 *           type: string
 *     
 *     ExpirationCleanupResult:
 *       type: object
 *       properties:
 *         expired_count:
 *           type: integer
 *           description: Number of bookings expired
 *         processed_bookings:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs of processed bookings
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *           description: Any errors encountered during cleanup
 */

import { Router } from 'express';
import controller from '../controllers/bookingExpiration.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /booking-expiration/settings:
 *   get:
 *     summary: Get booking expiration settings (Admin only)
 *     description: Retrieve current booking expiration configuration
 *     tags: [Booking Expiration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking expiration settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BookingExpirationSettings'
 *                 message:
 *                   type: string
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/settings', requireAuth, controller.getExpirationSettings);

/**
 * @swagger
 * /booking-expiration/settings:
 *   put:
 *     summary: Update booking expiration settings (Admin only)
 *     description: |
 *       Update booking expiration configuration. Admin can set:
 *       - Expiration duration (2, 4, 8, 12, 24, or 48 hours)
 *       - Enable/disable expiration system
 *     tags: [Booking Expiration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               booking_expiration_hours:
 *                 type: integer
 *                 enum: [2, 4, 8, 12, 24, 48]
 *                 description: Hours after which unbooked confirmed bookings expire
 *               booking_expiration_enabled:
 *                 type: boolean
 *                 description: Enable/disable booking expiration
 *           example:
 *             booking_expiration_hours: 4
 *             booking_expiration_enabled: true
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BookingExpirationSettings'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid expiration hours value
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.put('/settings', requireAuth, controller.updateExpirationSettings);

/**
 * @swagger
 * /booking-expiration/stats:
 *   get:
 *     summary: Get booking expiration statistics (Admin only)
 *     description: Retrieve statistics about booking expiration for admin dashboard
 *     tags: [Booking Expiration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking expiration statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BookingExpirationStats'
 *                 message:
 *                   type: string
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/stats', requireAuth, controller.getExpirationStats);

/**
 * @swagger
 * /booking-expiration/cleanup:
 *   post:
 *     summary: Manually trigger booking expiration cleanup (Admin only)
 *     description: |
 *       Manually trigger the booking expiration cleanup process.
 *       This will find and delete all expired bookings according to current settings.
 *       Normally this runs automatically via background job.
 *     tags: [Booking Expiration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cleanup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ExpirationCleanupResult'
 *                 message:
 *                   type: string
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.post('/cleanup', requireAuth, controller.triggerExpirationCleanup);

/**
 * @swagger
 * /booking-expiration/logs:
 *   get:
 *     summary: Get booking expiration logs (Admin only)
 *     description: Retrieve paginated list of booking expiration logs for auditing
 *     tags: [Booking Expiration]
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
 *         description: Number of logs per page
 *     responses:
 *       200:
 *         description: Booking expiration logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/BookingExpirationLog'
 *                     meta:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPrevPage:
 *                           type: boolean
 *                 message:
 *                   type: string
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/logs', requireAuth, controller.getExpirationLogs);

/**
 * @swagger
 * /booking-expiration/logs/{logId}:
 *   get:
 *     summary: Get detailed expiration log (Admin only)
 *     description: Retrieve detailed information about a specific booking expiration log
 *     tags: [Booking Expiration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Expiration log ID
 *     responses:
 *       200:
 *         description: Expiration log details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BookingExpirationLog'
 *                 message:
 *                   type: string
 *       404:
 *         description: Expiration log not found
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/logs/:logId', requireAuth, controller.getExpirationLogDetails);

/**
 * @swagger
 * /booking-expiration/set/{bookingId}:
 *   post:
 *     summary: Set expiration for a booking (Internal use)
 *     description: |
 *       Set expiration time for a specific booking. 
 *       This is typically called internally when a booking is created.
 *     tags: [Booking Expiration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking expiration set successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookingId:
 *                       type: string
 *                       format: uuid
 *                 message:
 *                   type: string
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.post('/set/:bookingId', requireAuth, controller.setBookingExpiration);

export default router;