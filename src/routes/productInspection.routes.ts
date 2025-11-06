import { Router } from 'express';
import { requireAuth } from '@/middleware/auth.middleware';
import { uploadSingle, uploadMultiple } from '@/middleware/upload.middleware';
import controller from '@/controllers/productInspection.controller';
import { requireRole } from '@/middleware/role.middleware';

const router = Router();

// List inspectors (requires auth)
router.get('/inspectors', requireAuth, controller.getInspectors);

// Get disputes raised by the authenticated user
router.get('/disputes', requireAuth, controller.getMyDisputes);

/**
 * @swagger
 * /inspections/admin/disputes:
 *   get:
 *     summary: Get all disputes (admin only)
 *     description: Retrieve all disputes across all inspections. Admin role required.
 *     tags: [Product Inspection - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, under_review, resolved, closed]
 *         description: Filter disputes by status
 *       - in: query
 *         name: inspectionId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter disputes by specific inspection
 *       - in: query
 *         name: disputeType
 *         schema:
 *           type: string
 *           enum: [damage_assessment, condition_disagreement, cost_dispute, other]
 *         description: Filter disputes by type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of disputes per page
 *     responses:
 *       200:
 *         description: All disputes retrieved successfully
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
 *                   example: All disputes retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     disputes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/InspectionDispute'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResult'
 *       403:
 *         description: Access denied. Admin role required.
 *       401:
 *         description: Unauthorized. Valid JWT token required.
 */

// Admin route to get all disputes
router.get('/admin/disputes', requireAuth, requireRole(['admin', 'super_admin']), controller.getAllDisputes);

/**
 * @swagger
 * /inspections/admin/disputes/{disputeId}/resolve:
 *   put:
 *     summary: Resolve a dispute (admin only)
 *     description: Resolve an inspection dispute directly by dispute ID (admin only)
 *     tags: [Product Inspection - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: disputeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Dispute ID to resolve
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
 *         description: Dispute not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied. Admin role required.
 *       500:
 *         description: Server error
 */
router.put('/admin/disputes/:disputeId/resolve', requireAuth, requireRole(['admin', 'super_admin']), controller.resolveDisputeByAdmin);

/**
 * @swagger
 * /inspections/{id}/disputes:
 *   get:
 *     summary: Get inspection disputes
 *     description: Retrieve all disputes for a specific inspection
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
 *           description: Inspection ID
 *     responses:
 *       200:
 *         description: Disputes retrieved successfully
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
 *                     $ref: '#/components/schemas/InspectionDispute'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to view this inspection
 *       404:
 *         description: Inspection not found
 *       500:
 *         description: Server error
 */
router.get('/:id/disputes', requireAuth, controller.getInspectionDisputes);

// Create inspection item with photo uploads
router.post('/:id/items/with-photos', requireAuth, uploadMultiple, controller.addInspectionItemWithPhotos);

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
 *           enum: [pre_rental, post_return, damage_assessment, post_rental_maintenance_check, quality_verification]
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

/**
 * @swagger
 * /inspections/disputes:
 *   get:
 *     summary: Get disputes (role-based)
 *     description: |
 *       Retrieve disputes based on user role:
 *       - **Inspector**: Gets all disputes (like admin)
 *       - **Renter/Owner**: Gets only disputes raised by the authenticated user
 *     tags: [Product Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, under_review, resolved, closed]
 *           description: Filter disputes by status
 *       - in: query
 *         name: inspectionId
 *         schema:
 *           type: string
 *           format: uuid
 *           description: Filter disputes by specific inspection
 *       - in: query
 *         name: disputeType
 *         schema:
 *           type: string
 *           enum: [damage_assessment, condition_disagreement, cost_dispute, other]
 *           description: Filter disputes by type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *           description: Number of disputes per page
 *     responses:
 *       200:
 *         description: Disputes retrieved successfully
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
 *                     disputes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/InspectionDispute'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResult'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/disputes', requireAuth, controller.getMyDisputes);

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
 *           enum: [pre_rental, post_return, damage_assessment, post_rental_maintenance_check, quality_verification]
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
// Create inspection route - supports both JSON and multipart/form-data (for pre-inspection with photos)
router.post('/', requireAuth, uploadMultiple, controller.createInspection);

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
 *           enum: [pre_rental, post_return, damage_assessment, post_rental_maintenance_check, quality_verification]
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
 * /inspections/my-inspections:
 *   get:
 *     summary: Get user's inspections for my_account section
 *     description: |
 *       Retrieve inspections for the authenticated user based on their role.
 *       **Features:**
 *       - Role-based filtering (inspector, renter, owner)
 *       - Advanced filtering by type, status, and date range
 *       - Pagination support
 *       - Performance optimized with caching
 *     tags: [Product Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [inspector, renter, owner]
 *           default: inspector
 *         description: User role to filter inspections by
 *       - in: query
 *         name: inspectionType
 *         schema:
 *           type: string
 *           enum: [pre_rental, post_return, damage_assessment, post_rental_maintenance_check, quality_verification]
 *         description: Filter by inspection type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, disputed, resolved]
 *         description: Filter by inspection status
 *       - in: query
 *         name: hasDispute
 *         schema:
 *           type: boolean
 *         description: Filter inspections with active disputes
 *       - in: query
 *         name: scheduledFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter inspections scheduled from this date
 *       - in: query
 *         name: scheduledTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter inspections scheduled until this date
 *       - in: query
 *         name: completedFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter inspections completed from this date
 *       - in: query
 *         name: completedTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter inspections completed until this date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of inspections per page
 *     responses:
 *       200:
 *         description: User inspections retrieved successfully
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
 *                   example: User inspections retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     inspections:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ProductInspection'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResult'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/my-inspections', requireAuth, controller.getMyInspections);

/**
 * @swagger
 * /inspections/user/{userId}:
 *   get:
 *     summary: Get inspections by user ID (renter)
 *     description: Retrieve inspections where the specified user is the renter
 *     tags: [Product Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to fetch inspections for (as renter)
 *       - in: query
 *         name: inspectionType
 *         schema:
 *           type: string
 *           enum: [pre_rental, post_return, damage_assessment, post_rental_maintenance_check, quality_verification]
 *         description: Filter by inspection type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, disputed, resolved]
 *         description: Filter by inspection status
 *       - in: query
 *         name: hasDispute
 *         schema:
 *           type: boolean
 *         description: Filter by dispute status
 *       - in: query
 *         name: scheduledFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter inspections scheduled from this date
 *       - in: query
 *         name: scheduledTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter inspections scheduled to this date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of inspections per page
 *     responses:
 *       200:
 *         description: User inspections retrieved successfully
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
 *                   example: User inspections retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     inspections:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Inspection'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResult'
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/user/:userId', requireAuth, controller.getUserInspections);

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
router.post('/:id/start', requireAuth, requireRole(['inspector', 'admin', 'super_admin']), controller.startInspection);

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
 *               inspectorNotes:
 *                 type: string
 *                 description: Inspector's notes about the overall inspection
 *               generalNotes:
 *                 type: string
 *                 description: General notes about the inspection
 *               ownerNotes:
 *                 type: string
 *                 description: Notes from the product owner
 *               renterNotes:
 *                 type: string
 *                 description: Notes from the renter
 *               inspectionLocation:
 *                 type: string
 *                 description: Location where the inspection took place
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [itemName, condition, description]
 *                   properties:
 *                     itemName:
 *                       type: string
 *                       description: Name of the item being inspected
 *                     description:
 *                       type: string
 *                       description: Detailed description of the item condition (REQUIRED)
 *                     condition:
 *                       type: string
 *                       enum: [excellent, good, fair, poor, damaged]
 *                       description: Current condition of the item
 *                     notes:
 *                       type: string
 *                       description: Additional notes about the item
 *                     photos:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Array of photo URLs
 *                     damageEvidence:
 *                       type: object
 *                       description: Evidence of damage if applicable
 *                     repairCost:
 *                       type: number
 *                       description: Cost to repair the item
 *                     replacementCost:
 *                       type: number
 *                       description: Cost to replace the item
 *                     requiresRepair:
 *                       type: boolean
 *                       description: Whether the item needs repair
 *                     requiresReplacement:
 *                       type: boolean
 *                       description: Whether the item needs replacement
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
// NEW WORKFLOW ROUTES - OWNER PRE-INSPECTION
// =====================================================

/**
 * @swagger
 * /inspections/{id}/owner-pre-inspection:
 *   post:
 *     summary: Owner submits pre-inspection data with photos
 *     description: Submit pre-inspection data including photos, condition assessment, notes, and GPS location
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
 *         description: Inspection ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [condition, notes]
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Pre-inspection photos (10-20 photos)
 *               condition:
 *                 type: string
 *                 description: JSON string of condition assessment
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *               location:
 *                 type: string
 *                 description: JSON string of GPS location
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: Timestamp of inspection
 *     responses:
 *       200:
 *         description: Pre-inspection submitted successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Not authorized (only owner can submit)
 *       404:
 *         description: Inspection not found
 *       500:
 *         description: Server error
 */
router.post('/:id/owner-pre-inspection', requireAuth, uploadMultiple, controller.submitOwnerPreInspection);

/**
 * @swagger
 * /inspections/{id}/owner-pre-inspection/confirm:
 *   post:
 *     summary: Owner confirms pre-inspection
 *     description: Confirm the submitted pre-inspection data
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
 *         description: Inspection ID
 *     responses:
 *       200:
 *         description: Pre-inspection confirmed successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Not authorized (only owner can confirm)
 *       404:
 *         description: Inspection not found
 *       500:
 *         description: Server error
 */
router.post('/:id/owner-pre-inspection/confirm', requireAuth, controller.confirmOwnerPreInspection);

// =====================================================
// NEW WORKFLOW ROUTES - RENTER PRE-REVIEW
// =====================================================

/**
 * @swagger
 * /inspections/{id}/renter-pre-review:
 *   post:
 *     summary: Renter reviews and accepts/rejects owner pre-inspection
 *     description: Submit review of owner's pre-inspection data
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
 *         description: Inspection ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accepted]
 *             properties:
 *               accepted:
 *                 type: boolean
 *                 description: Whether renter accepts the pre-inspection
 *               concerns:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of concerns
 *               additionalRequests:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Additional requests
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: Timestamp of review
 *     responses:
 *       200:
 *         description: Review submitted successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Not authorized (only renter can review)
 *       404:
 *         description: Inspection not found
 *       500:
 *         description: Server error
 */
router.post('/:id/renter-pre-review', requireAuth, controller.submitRenterPreReview);

/**
 * @swagger
 * /inspections/{id}/renter-discrepancy:
 *   post:
 *     summary: Renter reports discrepancy with owner pre-inspection
 *     description: Report discrepancies found when receiving the product
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
 *         description: Inspection ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [issues, notes]
 *             properties:
 *               issues:
 *                 type: string
 *                 description: JSON array of issue strings
 *               notes:
 *                 type: string
 *                 description: Detailed notes about discrepancies
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Photos of discrepancies
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: Timestamp of discrepancy report
 *     responses:
 *       200:
 *         description: Discrepancy reported successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Not authorized (only renter can report)
 *       404:
 *         description: Inspection not found
 *       500:
 *         description: Server error
 */
router.post('/:id/renter-discrepancy', requireAuth, uploadMultiple, controller.reportRenterDiscrepancy);

/**
 * @swagger
 * /inspections/{id}/renter-post-inspection:
 *   post:
 *     summary: Renter submits post-inspection data (after returning product)
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inspection ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - condition
 *               - returnLocation
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Return photos (minimum 2, maximum 20)
 *               condition:
 *                 type: string
 *                 description: JSON string of condition assessment
 *               notes:
 *                 type: string
 *                 description: Return notes
 *               returnLocation:
 *                 type: string
 *                 description: JSON string of GPS location
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               confirmed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Post-inspection submitted successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Not authorized (only renter can submit)
 *       404:
 *         description: Inspection not found
 *       500:
 *         description: Server error
 */
router.post('/:id/renter-post-inspection', requireAuth, uploadMultiple, controller.submitRenterPostInspection);

/**
 * @swagger
 * /inspections/{id}/renter-post-inspection/confirm:
 *   post:
 *     summary: Renter confirms post-inspection
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inspection ID
 *     responses:
 *       200:
 *         description: Post-inspection confirmed successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Not authorized (only renter can confirm)
 *       404:
 *         description: Inspection not found
 *       500:
 *         description: Server error
 */
router.post('/:id/renter-post-inspection/confirm', requireAuth, controller.confirmRenterPostInspection);

export default router;
