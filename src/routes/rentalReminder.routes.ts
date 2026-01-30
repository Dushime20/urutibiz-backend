/**
 * @swagger
 * tags:
 *   name: Rental Reminders
 *   description: Multi-channel rental return reminder system
 * 
 * components:
 *   schemas:
 *     ReminderConfiguration:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           enum: [24h_before, 6h_before, same_day]
 *         hours_before:
 *           type: integer
 *           description: Hours before return date to send reminder
 *         enabled:
 *           type: boolean
 *         email_template:
 *           type: string
 *         sms_template:
 *           type: string
 *         in_app_template:
 *           type: string
 *     
 *     ReminderLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         booking_id:
 *           type: string
 *           format: uuid
 *         reminder_type:
 *           type: string
 *           enum: [24h_before, 6h_before, same_day]
 *         channel:
 *           type: string
 *           enum: [email, sms, in_app]
 *         status:
 *           type: string
 *           enum: [pending, sent, failed, cancelled]
 *         scheduled_at:
 *           type: string
 *           format: date-time
 *         sent_at:
 *           type: string
 *           format: date-time
 *         recipient:
 *           type: string
 *         message_content:
 *           type: string
 *         error_message:
 *           type: string
 *     
 *     ReminderStats:
 *       type: object
 *       properties:
 *         total_reminders:
 *           type: integer
 *         recent_reminders:
 *           type: integer
 *           description: Reminders sent in last 24 hours
 *         failed_reminders:
 *           type: integer
 *           description: Failed reminders in last 24 hours
 *         upcoming_reminders:
 *           type: integer
 *           description: Bookings with return date in next 24 hours
 *     
 *     ProcessingResult:
 *       type: object
 *       properties:
 *         processed:
 *           type: integer
 *           description: Number of reminders processed
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *           description: Any errors encountered during processing
 */

import { Router } from 'express';
import controller from '../controllers/rentalReminder.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /rental-reminders/configurations:
 *   get:
 *     summary: Get reminder configurations (Admin only)
 *     description: Retrieve all reminder configurations with templates
 *     tags: [Rental Reminders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reminder configurations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReminderConfiguration'
 *                 message:
 *                   type: string
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/configurations', requireAuth, controller.getReminderConfigurations);

/**
 * @swagger
 * /rental-reminders/configurations/{id}:
 *   put:
 *     summary: Update reminder configuration (Admin only)
 *     description: Update reminder configuration settings and templates
 *     tags: [Rental Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Configuration ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *               email_template:
 *                 type: string
 *               sms_template:
 *                 type: string
 *               in_app_template:
 *                 type: string
 *           example:
 *             enabled: true
 *             email_template: "<h2>Return Reminder</h2><p>Your rental {{product_name}} is due for return.</p>"
 *             sms_template: "Reminder: Your rental {{product_name}} is due for return on {{return_date}}"
 *             in_app_template: "Your rental {{product_name}} is due for return on {{return_date}}"
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *       404:
 *         description: Configuration not found
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.put('/configurations/:id', requireAuth, controller.updateReminderConfiguration);

/**
 * @swagger
 * /rental-reminders/stats:
 *   get:
 *     summary: Get reminder statistics (Admin only)
 *     description: Retrieve reminder statistics for admin dashboard
 *     tags: [Rental Reminders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reminder statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ReminderStats'
 *                 message:
 *                   type: string
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/stats', requireAuth, controller.getReminderStats);

/**
 * @swagger
 * /rental-reminders/process:
 *   post:
 *     summary: Manually trigger reminder processing (Admin only)
 *     description: |
 *       Manually trigger the reminder processing job.
 *       This will check all eligible bookings and send due reminders.
 *       Normally this runs automatically every 15 minutes.
 *     tags: [Rental Reminders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Processing completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ProcessingResult'
 *                 message:
 *                   type: string
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.post('/process', requireAuth, controller.triggerReminderProcessing);

/**
 * @swagger
 * /rental-reminders/logs:
 *   get:
 *     summary: Get reminder logs (Admin only)
 *     description: Retrieve paginated list of reminder logs for auditing
 *     tags: [Rental Reminders]
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, sent, failed, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: channel
 *         schema:
 *           type: string
 *           enum: [email, sms, in_app]
 *         description: Filter by channel
 *       - in: query
 *         name: reminder_type
 *         schema:
 *           type: string
 *           enum: [24h_before, 6h_before, same_day]
 *         description: Filter by reminder type
 *     responses:
 *       200:
 *         description: Reminder logs retrieved successfully
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
 *                         $ref: '#/components/schemas/ReminderLog'
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
router.get('/logs', requireAuth, controller.getReminderLogs);

/**
 * @swagger
 * /rental-reminders/cron/status:
 *   get:
 *     summary: Get cron job status (Admin only)
 *     description: Get the status of the automated reminder processing cron job
 *     tags: [Rental Reminders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cron status retrieved successfully
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
 *                     isActive:
 *                       type: boolean
 *                     isRunning:
 *                       type: boolean
 *                     schedule:
 *                       type: string
 *                     nextRuns:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: date-time
 *                 message:
 *                   type: string
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/cron/status', requireAuth, controller.getCronStatus);

/**
 * @swagger
 * /rental-reminders/bookings/{bookingId}/cancel:
 *   post:
 *     summary: Cancel pending reminders for a booking
 *     description: Cancel all pending reminders for a specific booking
 *     tags: [Rental Reminders]
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
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *           example:
 *             reason: "Product returned early"
 *     responses:
 *       200:
 *         description: Reminders cancelled successfully
 *       404:
 *         description: Booking not found
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post('/bookings/:bookingId/cancel', requireAuth, controller.cancelBookingReminders);

/**
 * @swagger
 * /rental-reminders/bookings/{bookingId}/reset:
 *   post:
 *     summary: Reset reminder schedule for a booking
 *     description: Reset the reminder schedule when return date is updated
 *     tags: [Rental Reminders]
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
 *         description: Reminder schedule reset successfully
 *       404:
 *         description: Booking not found
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post('/bookings/:bookingId/reset', requireAuth, controller.resetBookingReminderSchedule);

/**
 * @swagger
 * /rental-reminders/bookings/{bookingId}/returned:
 *   post:
 *     summary: Mark booking as returned early
 *     description: Mark a booking as returned early and cancel pending reminders
 *     tags: [Rental Reminders]
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
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               actualReturnDate:
 *                 type: string
 *                 format: date-time
 *                 description: Actual return date (defaults to now)
 *           example:
 *             actualReturnDate: "2024-03-15T14:30:00Z"
 *     responses:
 *       200:
 *         description: Booking marked as returned early successfully
 *       404:
 *         description: Booking not found
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post('/bookings/:bookingId/returned', requireAuth, controller.markBookingReturnedEarly);

/**
 * @swagger
 * /rental-reminders/eligible-bookings:
 *   get:
 *     summary: Get eligible bookings for reminders (Admin only)
 *     description: Get all bookings that are eligible for reminder processing (for testing/debugging)
 *     tags: [Rental Reminders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Eligible bookings retrieved successfully
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/eligible-bookings', requireAuth, controller.getEligibleBookings);

export default router;