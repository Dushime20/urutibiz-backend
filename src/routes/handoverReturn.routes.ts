import { Router } from 'express';
import HandoverReturnController from '@/controllers/handoverReturn.controller';
import { requireAuth, requireRole } from '@/middleware/auth.middleware';

const router = Router();
const controller = HandoverReturnController;

// =====================================================
// HANDOVER & RETURN WORKFLOW ROUTES
// =====================================================

/**
 * @swagger
 * tags:
 *   name: Handover & Return
 *   description: Handover and return workflow management for rental items
 * 
 * components:
 *   schemas:
 *     HandoverSession:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         bookingId:
 *           type: string
 *           format: uuid
 *         ownerId:
 *           type: string
 *           format: uuid
 *         renterId:
 *           type: string
 *           format: uuid
 *         productId:
 *           type: string
 *           format: uuid
 *         handoverType:
 *           type: string
 *           enum: [pickup, delivery, meetup]
 *         scheduledDateTime:
 *           type: string
 *           format: date-time
 *         actualDateTime:
 *           type: string
 *           format: date-time
 *         location:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [owner_location, renter_location, meeting_point]
 *             address:
 *               type: string
 *             coordinates:
 *               type: object
 *               properties:
 *                 lat:
 *                   type: number
 *                 lng:
 *                   type: number
 *             instructions:
 *               type: string
 *         status:
 *           type: string
 *           enum: [scheduled, in_progress, completed, cancelled, disputed]
 *         handoverCode:
 *           type: string
 *           description: 6-digit verification code
 *         conditionReport:
 *           type: object
 *         accessoryChecklist:
 *           type: array
 *           items:
 *             type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         completedAt:
 *           type: string
 *           format: date-time
 * 
 *     ReturnSession:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         bookingId:
 *           type: string
 *           format: uuid
 *         handoverSessionId:
 *           type: string
 *           format: uuid
 *         ownerId:
 *           type: string
 *           format: uuid
 *         renterId:
 *           type: string
 *           format: uuid
 *         productId:
 *           type: string
 *           format: uuid
 *         returnType:
 *           type: string
 *           enum: [pickup, delivery, meetup]
 *         scheduledDateTime:
 *           type: string
 *           format: date-time
 *         actualDateTime:
 *           type: string
 *           format: date-time
 *         location:
 *           type: object
 *         status:
 *           type: string
 *           enum: [scheduled, in_progress, completed, cancelled, disputed]
 *         returnCode:
 *           type: string
 *           description: 6-digit verification code
 *         conditionComparison:
 *           type: object
 *         accessoryVerification:
 *           type: array
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         completedAt:
 *           type: string
 *           format: date-time
 */

// =====================================================
// HANDOVER SESSION MANAGEMENT
// =====================================================

/**
 * @swagger
 * /handover-return/handover-sessions:
 *   post:
 *     summary: Create a new handover session
 *     description: Create a handover session for a booking with scheduled time and location
 *     tags: [Handover & Return]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, handoverType, scheduledDateTime, location]
 *             properties:
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the booking
 *               handoverType:
 *                 type: string
 *                 enum: [pickup, delivery, meetup]
 *                 description: Type of handover
 *               scheduledDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: Scheduled handover date and time
 *               location:
 *                 type: object
 *                 required: [type, address]
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [owner_location, renter_location, meeting_point]
 *                   address:
 *                     type: string
 *                   coordinates:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *                   instructions:
 *                     type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Handover session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Handover session created successfully
 *                 data:
 *                   $ref: '#/components/schemas/HandoverSession'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/handover-sessions', requireAuth, controller.createHandoverSession);

/**
 * @swagger
 * /handover-return/handover-sessions:
 *   get:
 *     summary: Get all handover sessions
 *     description: Retrieve a list of handover sessions with optional filtering
 *     tags: [Handover & Return]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, in_progress, completed, cancelled, disputed]
 *         description: Filter by handover status
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID (owner or renter)
 *     responses:
 *       200:
 *         description: List of handover sessions retrieved successfully
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HandoverSession'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/handover-sessions', requireAuth, controller.getHandoverSessions);

/**
 * @swagger
 * /handover-return/handover-sessions/{sessionId}:
 *   get:
 *     summary: Get handover session by ID
 *     description: Retrieve details of a specific handover session
 *     tags: [Handover & Return]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the handover session
 *     responses:
 *       200:
 *         description: Handover session retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Handover session retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/HandoverSession'
 *       404:
 *         description: Handover session not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/handover-sessions/:sessionId', requireAuth, controller.getHandoverSession);

/**
 * @swagger
 * /handover-return/handover-sessions/{sessionId}:
 *   patch:
 *     summary: Update handover session
 *     description: Update a handover session with new information
 *     tags: [Handover & Return]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Handover session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scheduledDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: New scheduled date and time
 *               location:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [owner_location, renter_location, meeting_point]
 *                   address:
 *                     type: string
 *                   coordinates:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *                   instructions:
 *                     type: string
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *               estimatedDurationMinutes:
 *                 type: integer
 *                 description: Estimated duration in minutes
 *     responses:
 *       200:
 *         description: Handover session updated successfully
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
 *                   $ref: '#/components/schemas/HandoverSession'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Handover session not found
 *       500:
 *         description: Server error
 */
router.patch('/handover-sessions/:sessionId', requireAuth, controller.updateHandoverSession);

/**
 * @swagger
 * /handover-return/handover-sessions/{sessionId}:
 *   put:
 *     summary: Replace handover session
 *     description: Replace a handover session with complete new information
 *     tags: [Handover & Return]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Handover session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, productId, ownerId, renterId, scheduledDateTime, location]
 *             properties:
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *                 description: Booking ID
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 description: Product ID
 *               ownerId:
 *                 type: string
 *                 format: uuid
 *                 description: Owner user ID
 *               renterId:
 *                 type: string
 *                 format: uuid
 *                 description: Renter user ID
 *               scheduledDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: Scheduled date and time
 *               location:
 *                 type: object
 *                 required: [type, address, coordinates]
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [owner_location, renter_location, meeting_point]
 *                   address:
 *                     type: string
 *                   coordinates:
 *                     type: object
 *                     required: [lat, lng]
 *                     properties:
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *                   instructions:
 *                     type: string
 *               handoverType:
 *                 type: string
 *                 enum: [pickup, delivery]
 *                 description: Type of handover
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *               estimatedDurationMinutes:
 *                 type: integer
 *                 description: Estimated duration in minutes
 *     responses:
 *       200:
 *         description: Handover session replaced successfully
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
 *                   $ref: '#/components/schemas/HandoverSession'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Handover session not found
 *       500:
 *         description: Server error
 */
router.put('/handover-sessions/:sessionId', requireAuth, controller.updateHandoverSession);

/**
 * @swagger
 * /handover-sessions/{sessionId}/complete:
 *   post:
 *     summary: Complete handover session
 *     description: Complete a handover session with verification code and documentation
 *     tags: [Handover & Return]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the handover session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [handoverCode, conditionReport, accessoryChecklist]
 *             properties:
 *               handoverCode:
 *                 type: string
 *                 description: 6-digit verification code
 *               conditionReport:
 *                 type: object
 *                 description: Condition assessment report
 *               accessoryChecklist:
 *                 type: array
 *                 description: List of accessories and their condition
 *               ownerSignature:
 *                 type: string
 *                 description: Digital signature from owner
 *               renterSignature:
 *                 type: string
 *                 description: Digital signature from renter
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Photo URLs
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Handover session completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Handover session completed successfully
 *                 data:
 *                   $ref: '#/components/schemas/HandoverSession'
 *       400:
 *         description: Invalid request data or verification code
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/handover-sessions/:sessionId/complete', requireAuth, controller.completeHandoverSession);

// =====================================================
// RETURN SESSION MANAGEMENT
// =====================================================

/**
 * @swagger
 * /handover-return/return-sessions:
 *   post:
 *     summary: Create a new return session
 *     description: Create a return session for a booking with scheduled time and location
 *     tags: [Handover & Return]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, handoverSessionId, returnType, scheduledDateTime, location]
 *             properties:
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the booking
 *               handoverSessionId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the related handover session
 *               returnType:
 *                 type: string
 *                 enum: [pickup, delivery, meetup]
 *                 description: Type of return
 *               scheduledDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: Scheduled return date and time
 *               location:
 *                 type: object
 *                 required: [type, address]
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [owner_location, renter_location, meeting_point]
 *                   address:
 *                     type: string
 *                   coordinates:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *                   instructions:
 *                     type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Return session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Return session created successfully
 *                 data:
 *                   $ref: '#/components/schemas/ReturnSession'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/return-sessions', requireAuth, controller.createReturnSession);

/**
 * @swagger
 * /handover-return/return-sessions:
 *   get:
 *     summary: Get all return sessions
 *     description: Retrieve a list of return sessions with optional filtering
 *     tags: [Handover & Return]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, in_progress, completed, cancelled, disputed]
 *         description: Filter by return status
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID (owner or renter)
 *     responses:
 *       200:
 *         description: List of return sessions retrieved successfully
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReturnSession'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/return-sessions', requireAuth, controller.getReturnSessions);

/**
 * @swagger
 * /handover-return/return-sessions/{sessionId}:
 *   get:
 *     summary: Get return session by ID
 *     description: Retrieve details of a specific return session
 *     tags: [Handover & Return]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the return session
 *     responses:
 *       200:
 *         description: Return session retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Return session retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/ReturnSession'
 *       404:
 *         description: Return session not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/return-sessions/:sessionId', requireAuth, controller.getReturnSession);

/**
 * @swagger
 * /handover-return/return-sessions/{sessionId}:
 *   patch:
 *     summary: Update return session
 *     description: Update a return session with new information
 *     tags: [Handover & Return]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Return session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scheduledDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: New scheduled date and time
 *               location:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [owner_location, renter_location, meeting_point]
 *                   address:
 *                     type: string
 *                   coordinates:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *                   instructions:
 *                     type: string
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *               estimatedDurationMinutes:
 *                 type: integer
 *                 description: Estimated duration in minutes
 *     responses:
 *       200:
 *         description: Return session updated successfully
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
 *                   $ref: '#/components/schemas/ReturnSession'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Return session not found
 *       500:
 *         description: Server error
 */
router.patch('/return-sessions/:sessionId', requireAuth, controller.updateReturnSession);

/**
 * @swagger
 * /handover-return/return-sessions/{sessionId}:
 *   put:
 *     summary: Replace return session
 *     description: Replace a return session with complete new information
 *     tags: [Handover & Return]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Return session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [handoverSessionId, scheduledDateTime, location]
 *             properties:
 *               handoverSessionId:
 *                 type: string
 *                 format: uuid
 *                 description: Associated handover session ID
 *               scheduledDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: Scheduled date and time
 *               location:
 *                 type: object
 *                 required: [type, address, coordinates]
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [owner_location, renter_location, meeting_point]
 *                   address:
 *                     type: string
 *                   coordinates:
 *                     type: object
 *                     required: [lat, lng]
 *                     properties:
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *                   instructions:
 *                     type: string
 *               returnType:
 *                 type: string
 *                 enum: [dropoff, pickup]
 *                 description: Type of return
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *               estimatedDurationMinutes:
 *                 type: integer
 *                 description: Estimated duration in minutes
 *     responses:
 *       200:
 *         description: Return session replaced successfully
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
 *                   $ref: '#/components/schemas/ReturnSession'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Return session not found
 *       500:
 *         description: Server error
 */
router.put('/return-sessions/:sessionId', requireAuth, controller.updateReturnSession);

/**
 * @swagger
 * /handover-return/return-sessions/{sessionId}/complete:
 *   post:
 *     summary: Complete return session
 *     description: Complete a return session with verification code and documentation
 *     tags: [Handover & Return]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the return session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [returnCode, conditionComparison, accessoryVerification]
 *             properties:
 *               returnCode:
 *                 type: string
 *                 description: 6-digit verification code
 *               conditionComparison:
 *                 type: object
 *                 description: Condition comparison report
 *               accessoryVerification:
 *                 type: array
 *                 description: List of accessories and their verification status
 *               ownerSignature:
 *                 type: string
 *                 description: Digital signature from owner
 *               renterSignature:
 *                 type: string
 *                 description: Digital signature from renter
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Photo URLs
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Return session completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Return session completed successfully
 *                 data:
 *                   $ref: '#/components/schemas/ReturnSession'
 *       400:
 *         description: Invalid request data or verification code
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/return-sessions/:sessionId/complete', requireAuth, controller.completeReturnSession);

// =====================================================
// MESSAGE MANAGEMENT
// =====================================================

/**
 * @swagger
 * /handover-return/messages:
 *   post:
 *     summary: Send message in handover or return session
 *     description: Send a message in a handover or return session
 *     tags: [Handover & Return]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               handoverSessionId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the handover session (optional)
 *               returnSessionId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the return session (optional)
 *               message:
 *                 type: string
 *                 description: Message content
 *               messageType:
 *                 type: string
 *                 enum: [text, image, voice, video, location]
 *                 default: text
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Attachment URLs
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Message sent successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     message:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/messages', requireAuth, controller.sendMessage);

// =====================================================
// STATISTICS AND ANALYTICS
// =====================================================

/**
 * @swagger
 * /handover-return/stats:
 *   get:
 *     summary: Get handover and return statistics
 *     description: Retrieve comprehensive statistics about handover and return operations
 *     tags: [Handover & Return]
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Handover and return statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalHandovers:
 *                       type: integer
 *                       description: Total number of handover sessions
 *                     totalReturns:
 *                       type: integer
 *                       description: Total number of return sessions
 *                     handoverSuccessRate:
 *                       type: number
 *                       description: Percentage of successful handovers
 *                     returnOnTimeRate:
 *                       type: number
 *                       description: Percentage of returns completed on time
 *                     averageHandoverTime:
 *                       type: number
 *                       description: Average handover time in minutes
 *                     averageReturnProcessingTime:
 *                       type: number
 *                       description: Average return processing time in minutes
 *                     disputeRate:
 *                       type: number
 *                       description: Percentage of sessions with disputes
 *                     userSatisfactionScore:
 *                       type: number
 *                       description: Average user satisfaction score
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/stats', requireAuth, controller.getHandoverReturnStats);

// =====================================================
// UTILITY ENDPOINTS
// =====================================================

/**
 * @swagger
 * /handover-return/handover-sessions/{sessionId}/generate-code:
 *   post:
 *     summary: Generate new handover code
 *     description: Generate a new 6-digit verification code for handover session
 *     tags: [Handover & Return]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the handover session
 *     responses:
 *       200:
 *         description: Handover code generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Handover code generated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     handoverCode:
 *                       type: string
 *                       description: New 6-digit verification code
 *       404:
 *         description: Handover session not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/handover-sessions/:sessionId/generate-code', requireAuth, controller.generateHandoverCode);

/**
 * @swagger
 * /handover-return/return-sessions/{sessionId}/generate-code:
 *   post:
 *     summary: Generate new return code
 *     description: Generate a new 6-digit verification code for return session
 *     tags: [Handover & Return]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the return session
 *     responses:
 *       200:
 *         description: Return code generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Return code generated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     returnCode:
 *                       type: string
 *                       description: New 6-digit verification code
 *       404:
 *         description: Return session not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/return-sessions/:sessionId/generate-code', requireAuth, controller.generateReturnCode);

/**
 * @swagger
 * /handover-return/handover-sessions/{sessionId}/verify-code:
 *   post:
 *     summary: Verify handover code
 *     description: Verify a 6-digit handover verification code
 *     tags: [Handover & Return]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the handover session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [handoverCode]
 *             properties:
 *               handoverCode:
 *                 type: string
 *                 description: 6-digit verification code to verify
 *     responses:
 *       200:
 *         description: Handover code verification completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Handover code verification completed
 *                 data:
 *                   type: object
 *                   properties:
 *                     isValid:
 *                       type: boolean
 *                       description: Whether the code is valid
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Handover session not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/handover-sessions/:sessionId/verify-code', requireAuth, controller.verifyHandoverCode);

/**
 * @swagger
 * /handover-return/return-sessions/{sessionId}/verify-code:
 *   post:
 *     summary: Verify return code
 *     description: Verify a 6-digit return verification code
 *     tags: [Handover & Return]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the return session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [returnCode]
 *             properties:
 *               returnCode:
 *                 type: string
 *                 description: 6-digit verification code to verify
 *     responses:
 *       200:
 *         description: Return code verification completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Return code verification completed
 *                 data:
 *                   type: object
 *                   properties:
 *                     isValid:
 *                       type: boolean
 *                       description: Whether the code is valid
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Return session not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/return-sessions/:sessionId/verify-code', requireAuth, controller.verifyReturnCode);

export default router;
