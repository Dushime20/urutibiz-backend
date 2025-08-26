import { Router } from 'express';
import { requireAuth } from '@/middleware/auth.middleware';
import { uploadSingle } from '@/middleware/upload.middleware';
import controller from '@/controllers/productInspection.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Product Inspections
 *   description: Product inspection management for rental business
 * 
 * components:
 *   schemas:
 *     ProductInspection:
 *       type: object
 *       required: [productId, bookingId, inspectorId, inspectionType, scheduledAt]
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique inspection identifier
 *         productId:
 *           type: string
 *           format: uuid
 *           description: ID of the product being inspected
 *         bookingId:
 *           type: string
 *           format: uuid
 *           description: ID of the related booking
 *         inspectorId:
 *           type: string
 *           format: uuid
 *           description: ID of the inspector conducting the inspection
 *         renterId:
 *           type: string
 *           format: uuid
 *           description: ID of the renter
 *         ownerId:
 *           type: string
 *           format: uuid
 *           description: ID of the product owner
 *         inspectionType:
 *           type: string
 *           enum: [pre_rental, post_return]
 *           description: Type of inspection
 *         status:
 *           type: string
 *           enum: [pending, in_progress, completed, disputed, resolved]
 *           description: Current inspection status
 *         scheduledAt:
 *           type: string
 *           format: date-time
 *           description: Scheduled inspection time
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: When inspection started
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: When inspection completed
 *         inspectionLocation:
 *           type: string
 *           description: Location where inspection will take place
 *         generalNotes:
 *           type: string
 *           description: General notes about the inspection
 *         ownerNotes:
 *           type: string
 *           description: Notes from the product owner
 *         renterNotes:
 *           type: string
 *           description: Notes from the renter
 *         inspectorNotes:
 *           type: string
 *           description: Notes from the inspector
 *         hasDispute:
 *           type: boolean
 *           description: Whether there's an active dispute
 *         disputeReason:
 *           type: string
 *           description: Reason for dispute if applicable
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     InspectionItem:
 *       type: object
 *       required: [itemName, condition]
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         inspectionId:
 *           type: string
 *           format: uuid
 *         itemName:
 *           type: string
 *           description: Name of the item being inspected
 *         description:
 *           type: string
 *           description: Detailed description of the item
 *         condition:
 *           type: string
 *           enum: [excellent, good, fair, poor, damaged]
 *           description: Current condition of the item
 *         notes:
 *           type: string
 *           description: Additional notes about the item
 *         photos:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of photo URLs
 *         damageEvidence:
 *           type: object
 *           description: Evidence of damage if applicable
 *         repairCost:
 *           type: number
 *           description: Cost to repair the item
 *         replacementCost:
 *           type: number
 *           description: Cost to replace the item
 *         requiresRepair:
 *           type: boolean
 *           description: Whether the item needs repair
 *         requiresReplacement:
 *           type: boolean
 *           description: Whether the item needs replacement
 * 
 *     InspectionDispute:
 *       type: object
 *       required: [disputeType, reason]
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         inspectionId:
 *           type: string
 *           format: uuid
 *         raisedBy:
 *           type: string
 *           format: uuid
 *         disputeType:
 *           type: string
 *           enum: [damage_assessment, condition_disagreement, cost_dispute, other]
 *         reason:
 *           type: string
 *           description: Reason for the dispute
 *         evidence:
 *           type: object
 *           description: Supporting evidence
 *         status:
 *           type: string
 *           enum: [open, under_review, resolved, closed]
 *         resolutionNotes:
 *           type: string
 *           description: Notes on how dispute was resolved
 *         agreedAmount:
 *           type: number
 *           description: Agreed upon amount for resolution
 *         resolvedBy:
 *           type: string
 *           format: uuid
 *         resolvedAt:
 *           type: string
 *           format: date-time
 */

// =====================================================
// INSPECTION MANAGEMENT ROUTES
// =====================================================

/**
 * @swagger
 * /inspections:
 *   post:
 *     summary: Create a new inspection
 *     description: Schedule a pre-rental or post-return inspection for a product
 *     tags: [Product Inspections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, bookingId, inspectorId, inspectionType, scheduledAt]
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *               inspectorId:
 *                 type: string
 *                 format: uuid
 *               inspectionType:
 *                 type: string
 *                 enum: [pre_rental, post_return]
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               inspectionLocation:
 *                 type: string
 *               generalNotes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Inspection created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', requireAuth, controller.createInspection);

/**
 * @swagger
 * /inspections:
 *   get:
 *     summary: Get inspections with filters
 *     description: Retrieve inspections with optional filtering and pagination
 *     tags: [Product Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: bookingId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: inspectionType
 *         schema:
 *           type: string
 *           enum: [pre_rental, post_return]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, disputed, resolved]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Inspections retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', requireAuth, controller.getInspections);

/**
 * @swagger
 * /inspections/{id}:
 *   get:
 *     summary: Get inspection by ID
 *     description: Retrieve detailed inspection information including items and photos
 *     tags: [Product Inspections]
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
 *         description: Inspection retrieved successfully
 *       404:
 *         description: Inspection not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id', requireAuth, controller.getInspection);

/**
 * @swagger
 * /inspections/{id}:
 *   put:
 *     summary: Update inspection
 *     description: Update inspection details (notes, location, etc.)
 *     tags: [Product Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inspectionLocation:
 *                 type: string
 *               generalNotes:
 *                 type: string
 *               ownerNotes:
 *                 type: string
 *               renterNotes:
 *                 type: string
 *               inspectorNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inspection updated successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Inspection not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/:id', requireAuth, controller.updateInspection);

/**
 * @swagger
 * /inspections/{id}/start:
 *   post:
 *     summary: Start inspection
 *     description: Mark inspection as in progress (inspector only)
 *     tags: [Product Inspections]
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
 *         description: Inspection started successfully
 *       400:
 *         description: Inspection cannot be started
 *       404:
 *         description: Inspection not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/:id/start', requireAuth, controller.startInspection);

/**
 * @swagger
 * /inspections/{id}/complete:
 *   post:
 *     summary: Complete inspection
 *     description: Mark inspection as completed with detailed item assessments
 *     tags: [Product Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/InspectionItem'
 *     responses:
 *       200:
 *         description: Inspection completed successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Inspection not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/:id/complete', requireAuth, controller.completeInspection);

// =====================================================
// INSPECTION ITEMS ROUTES
// =====================================================

/**
 * @swagger
 * /inspections/{id}/items:
 *   post:
 *     summary: Add inspection item
 *     description: Add a new item to an inspection checklist
 *     tags: [Product Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InspectionItem'
 *     responses:
 *       201:
 *         description: Item added successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Inspection not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/:id/items', requireAuth, controller.addInspectionItem);

/**
 * @swagger
 * /inspections/{id}/items/{itemId}:
 *   put:
 *     summary: Update inspection item
 *     description: Update details of a specific inspection item
 *     tags: [Product Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InspectionItem'
 *     responses:
 *       200:
 *         description: Item updated successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Inspection or item not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/:id/items/:itemId', requireAuth, controller.updateInspectionItem);

// =====================================================
// DISPUTE MANAGEMENT ROUTES
// =====================================================

/**
 * @swagger
 * /inspections/{id}/disputes:
 *   post:
 *     summary: Raise a dispute
 *     description: Raise a dispute for an inspection (participants only)
 *     tags: [Product Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InspectionDispute'
 *     responses:
 *       201:
 *         description: Dispute raised successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Inspection not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/:id/disputes', requireAuth, controller.raiseDispute);

/**
 * @swagger
 * /inspections/{id}/disputes/{disputeId}/resolve:
 *   put:
 *     summary: Resolve a dispute
 *     description: Resolve an inspection dispute (inspector or admin only)
 *     tags: [Product Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: disputeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resolutionNotes]
 *             properties:
 *               resolutionNotes:
 *                 type: string
 *                 description: Notes on how the dispute was resolved
 *               agreedAmount:
 *                 type: number
 *                 description: Agreed upon amount for resolution
 *     responses:
 *       200:
 *         description: Dispute resolved successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Inspection or dispute not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/:id/disputes/:disputeId/resolve', requireAuth, controller.resolveDispute);

// =====================================================
// ANALYTICS AND REPORTS ROUTES
// =====================================================

/**
 * @swagger
 * /inspections/summary:
 *   get:
 *     summary: Get inspection summary
 *     description: Retrieve summary statistics for inspections
 *     tags: [Product Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: inspectionType
 *         schema:
 *           type: string
 *           enum: [pre_rental, post_return]
 *       - in: query
 *         name: scheduledFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: scheduledTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalInspections:
 *                   type: integer
 *                 completedInspections:
 *                   type: integer
 *                 pendingInspections:
 *                   type: integer
 *                 disputedInspections:
 *                   type: integer
 *                 totalDamageCost:
 *                   type: number
 *                 averageInspectionTime:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/summary', requireAuth, controller.getInspectionSummary);

export default router;
