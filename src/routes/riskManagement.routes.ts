import { Router } from 'express';
import RiskManagementController from '@/controllers/riskManagement.controller';
import { requireAuth, requireRole } from '@/middleware/auth.middleware';

const router = Router();
const controller = RiskManagementController;

// =====================================================
// RISK MANAGEMENT ROUTES
// =====================================================

/**
 * @swagger
 * tags:
 *   name: Risk Management
 *   description: Risk management and compliance enforcement for platform safety
 * 
 * components:
 *   schemas:
 *     ProductRiskProfile:
 *       type: object
 *       required: [productId, categoryId, riskLevel]
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique risk profile identifier
 *         productId:
 *           type: string
 *           format: uuid
 *           description: ID of the product
 *         categoryId:
 *           type: string
 *           format: uuid
 *           description: ID of the product category
 *         riskLevel:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           description: Risk level of the product
 *         mandatoryRequirements:
 *           type: object
 *           properties:
 *             insurance:
 *               type: boolean
 *               description: Whether insurance is mandatory
 *             inspection:
 *               type: boolean
 *               description: Whether inspection is mandatory
 *             minCoverage:
 *               type: number
 *               description: Minimum insurance coverage amount
 *             inspectionTypes:
 *               type: array
 *               items:
 *                 type: string
 *               description: Types of inspections required
 *             complianceDeadlineHours:
 *               type: integer
 *               description: Hours before rental to complete compliance
 *         riskFactors:
 *           type: array
 *           items:
 *             type: string
 *           description: Identified risk factors
 *         mitigationStrategies:
 *           type: array
 *           items:
 *             type: string
 *           description: Strategies to mitigate risks
 *         enforcementLevel:
 *           type: string
 *           enum: [lenient, moderate, strict, very_strict]
 *           description: Level of enforcement
 *         autoEnforcement:
 *           type: boolean
 *           description: Whether to automatically enforce policies
 *         gracePeriodHours:
 *           type: integer
 *           description: Grace period in hours before enforcement
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     RiskAssessment:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           format: uuid
 *         renterId:
 *           type: string
 *           format: uuid
 *         bookingId:
 *           type: string
 *           format: uuid
 *         overallRiskScore:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           description: Overall risk score (0-100)
 *         riskFactors:
 *           type: object
 *           properties:
 *             productRisk:
 *               type: integer
 *             renterRisk:
 *               type: integer
 *             bookingRisk:
 *               type: integer
 *             seasonalRisk:
 *               type: integer
 *         recommendations:
 *           type: array
 *           items:
 *             type: string
 *         mandatoryRequirements:
 *           type: object
 *           properties:
 *             insurance:
 *               type: boolean
 *             inspection:
 *               type: boolean
 *             minCoverage:
 *               type: number
 *             inspectionTypes:
 *               type: array
 *               items:
 *                 type: string
 *         complianceStatus:
 *           type: string
 *           enum: [compliant, non_compliant, pending, grace_period, exempt]
 *         assessmentDate:
 *           type: string
 *           format: date-time
 *         expiresAt:
 *           type: string
 *           format: date-time
 * 
 *     ComplianceCheck:
 *       type: object
 *       properties:
 *         bookingId:
 *           type: string
 *           format: uuid
 *         productId:
 *           type: string
 *           format: uuid
 *         renterId:
 *           type: string
 *           format: uuid
 *         isCompliant:
 *           type: boolean
 *         missingRequirements:
 *           type: array
 *           items:
 *             type: string
 *         complianceScore:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         status:
 *           type: string
 *           enum: [compliant, non_compliant, pending, grace_period, exempt]
 *         gracePeriodEndsAt:
 *           type: string
 *           format: date-time
 *         enforcementActions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [block_booking, require_insurance, require_inspection, send_notification, escalate]
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               message:
 *                 type: string
 *               requiredAction:
 *                 type: string
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [pending, executed, failed, cancelled]
 *         lastCheckedAt:
 *           type: string
 *           format: date-time
 * 
 *     PolicyViolation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         bookingId:
 *           type: string
 *           format: uuid
 *         productId:
 *           type: string
 *           format: uuid
 *         renterId:
 *           type: string
 *           format: uuid
 *         violationType:
 *           type: string
 *           enum: [missing_insurance, missing_inspection, inadequate_coverage, expired_compliance]
 *         severity:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description:
 *           type: string
 *         detectedAt:
 *           type: string
 *           format: date-time
 *         resolvedAt:
 *           type: string
 *           format: date-time
 *         resolutionActions:
 *           type: array
 *           items:
 *             type: string
 *         penaltyAmount:
 *           type: number
 *         status:
 *           type: string
 *           enum: [active, resolved, escalated]
 */

// =====================================================
// RISK PROFILE MANAGEMENT
// =====================================================

/**
 * @swagger
 * /risk-management/profiles:
 *   post:
 *     summary: Create a new risk profile for a product
 *     description: Create a risk profile that defines mandatory requirements and enforcement policies for a product
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, categoryId, riskLevel]
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the product
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the product category
 *               riskLevel:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 description: Risk level of the product
 *               mandatoryRequirements:
 *                 type: object
 *                 properties:
 *                   insurance:
 *                     type: boolean
 *                     description: Whether insurance is mandatory
 *                   inspection:
 *                     type: boolean
 *                     description: Whether inspection is mandatory
 *                   minCoverage:
 *                     type: number
 *                     description: Minimum insurance coverage amount
 *                   inspectionTypes:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Types of inspections required
 *                   complianceDeadlineHours:
 *                     type: integer
 *                     description: Hours before rental to complete compliance
 *               riskFactors:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Identified risk factors
 *               mitigationStrategies:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Strategies to mitigate risks
 *               enforcementLevel:
 *                 type: string
 *                 enum: [lenient, moderate, strict, very_strict]
 *                 description: Level of enforcement
 *               autoEnforcement:
 *                 type: boolean
 *                 description: Whether to automatically enforce policies
 *               gracePeriodHours:
 *                 type: integer
 *                 description: Grace period in hours before enforcement
 *     responses:
 *       201:
 *         description: Risk profile created successfully
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
 *                   example: Risk profile created successfully
 *                 data:
 *                   $ref: '#/components/schemas/ProductRiskProfile'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/profiles', requireAuth, requireRole(['admin', 'super_admin']), controller.createRiskProfile);

/**
 * @swagger
 * /risk-management/profiles/product/{productId}:
 *   get:
 *     summary: Get risk profile by product ID
 *     description: Retrieve the risk profile for a specific product
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the product
 *     responses:
 *       200:
 *         description: Risk profile retrieved successfully
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
 *                   example: Risk profile retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/ProductRiskProfile'
 *       404:
 *         description: Risk profile not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/profiles/product/:productId', requireAuth, controller.getRiskProfileByProduct);

/**
 * @swagger
 * /risk-management/profiles/{id}:
 *   get:
 *     summary: Get risk profile by ID
 *     description: Retrieve a risk profile by its ID
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Risk profile ID
 *     responses:
 *       200:
 *         description: Risk profile retrieved successfully
 *       404:
 *         description: Risk profile not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/profiles/:id', requireAuth, controller.getRiskProfile);

/**
 * @swagger
 * /risk-management/profiles:
 *   get:
 *     summary: Get all risk profiles
 *     description: Retrieve a paginated list of all risk profiles
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Number of profiles per page
 *       - in: query
 *         name: riskLevel
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by risk level
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product names
 *     responses:
 *       200:
 *         description: Risk profiles retrieved successfully
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
 *                   example: Risk profiles retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     profiles:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ProductRiskProfile'
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
 *       500:
 *         description: Server error
 */
router.get('/profiles', requireAuth, controller.getRiskProfiles);

/**
 * @swagger
 * /risk-management/profiles/{id}:
 *   put:
 *     summary: Update a risk profile
 *     description: Update an existing risk profile
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Risk profile ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               riskLevel:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               mandatoryRequirements:
 *                 type: object
 *               riskFactors:
 *                 type: array
 *                 items:
 *                   type: string
 *               mitigationStrategies:
 *                 type: array
 *                 items:
 *                   type: string
 *               enforcementLevel:
 *                 type: string
 *                 enum: [lenient, moderate, strict, very_strict]
 *               autoEnforcement:
 *                 type: boolean
 *               gracePeriodHours:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Risk profile updated successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Risk profile not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/profiles/:id', requireAuth, requireRole(['admin', 'super_admin']), controller.updateRiskProfile);

/**
 * @swagger
 * /risk-management/profiles/{id}:
 *   delete:
 *     summary: Soft delete a risk profile
 *     description: Mark a risk profile as inactive (soft delete)
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Risk profile ID
 *     responses:
 *       200:
 *         description: Risk profile deleted successfully
 *       404:
 *         description: Risk profile not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/profiles/:id', requireAuth, requireRole(['admin', 'super_admin']), controller.deleteRiskProfile);

/**
 * @swagger
 * /risk-management/profiles/bulk:
 *   post:
 *     summary: Bulk create risk profiles
 *     description: Create multiple risk profiles in a single operation
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [profiles]
 *             properties:
 *               profiles:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productId, categoryId, riskLevel]
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                     categoryId:
 *                       type: string
 *                       format: uuid
 *                     riskLevel:
 *                       type: string
 *                       enum: [low, medium, high, critical]
 *                     mandatoryRequirements:
 *                       type: object
 *                       properties:
 *                         insurance:
 *                           type: boolean
 *                         inspection:
 *                           type: boolean
 *                         minCoverage:
 *                           type: number
 *                         inspectionTypes:
 *                           type: array
 *                           items:
 *                             type: string
 *                         complianceDeadlineHours:
 *                           type: integer
 *                     riskFactors:
 *                       type: array
 *                       items:
 *                         type: string
 *                     mitigationStrategies:
 *                       type: array
 *                       items:
 *                         type: string
 *                     enforcementLevel:
 *                       type: string
 *                       enum: [lenient, moderate, strict, very_strict]
 *                     autoEnforcement:
 *                       type: boolean
 *                     gracePeriodHours:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Bulk risk profile creation completed
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
 *                   example: Bulk risk profile creation completed
 *                 data:
 *                   type: object
 *                   properties:
 *                     successful:
 *                       type: integer
 *                       description: Number of successfully created profiles
 *                     failed:
 *                       type: integer
 *                       description: Number of failed creations
 *                     results:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ProductRiskProfile'
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           profile:
 *                             type: object
 *                           error:
 *                             type: string
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/profiles/bulk', requireAuth, requireRole(['admin', 'super_admin']), controller.bulkCreateRiskProfiles);

// =====================================================
// RISK ASSESSMENT
// =====================================================

/**
 * @swagger
 * /risk-management/assess:
 *   post:
 *     summary: Perform risk assessment
 *     description: Assess the risk level for a product-renter combination and determine mandatory requirements
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, renterId]
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the product
 *               renterId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the renter
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the booking (optional)
 *               includeRecommendations:
 *                 type: boolean
 *                 description: Whether to include risk mitigation recommendations
 *                 default: true
 *     responses:
 *       200:
 *         description: Risk assessment completed successfully
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
 *                   example: Risk assessment completed successfully
 *                 data:
 *                   $ref: '#/components/schemas/RiskAssessment'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/assess', requireAuth, controller.assessRisk);

/**
 * @swagger
 * /risk-management/assess/bulk:
 *   post:
 *     summary: Bulk risk assessment
 *     description: Perform risk assessment for multiple product-renter combinations
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assessments]
 *             properties:
 *               assessments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productId, renterId]
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                     renterId:
 *                       type: string
 *                       format: uuid
 *                     bookingId:
 *                       type: string
 *                       format: uuid
 *                     includeRecommendations:
 *                       type: boolean
 *                       default: true
 *     responses:
 *       200:
 *         description: Bulk risk assessment completed
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
 *                   example: Bulk risk assessment completed
 *                 data:
 *                   type: object
 *                   properties:
 *                     successful:
 *                       type: integer
 *                     failed:
 *                       type: integer
 *                     results:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/RiskAssessment'
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           assessment:
 *                             type: object
 *                           error:
 *                             type: string
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/assess/bulk', requireAuth, controller.bulkAssessRisk);

/**
 * @swagger
 * /risk-management/assessments:
 *   get:
 *     summary: Get risk assessments
 *     description: Retrieve a paginated list of risk assessments with filtering options
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: renterId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: bookingId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: riskLevel
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *       - in: query
 *         name: complianceStatus
 *         schema:
 *           type: string
 *           enum: [compliant, non_compliant, pending, grace_period, exempt]
 *     responses:
 *       200:
 *         description: Assessments retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/assessments', requireAuth, controller.getRiskAssessments);

/**
 * @swagger
 * /risk-management/assessments/{id}:
 *   get:
 *     summary: Get risk assessment by ID
 *     description: Retrieve a risk assessment by its ID
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Assessment ID
 *     responses:
 *       200:
 *         description: Assessment retrieved successfully
 *       404:
 *         description: Assessment not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/assessments/:id', requireAuth, controller.getRiskAssessment);

// =====================================================
// COMPLIANCE CHECKING
// =====================================================

/**
 * @swagger
 * /risk-management/compliance/check:
 *   post:
 *     summary: Check compliance for a booking
 *     description: Check if a booking meets all mandatory requirements and determine enforcement actions
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, productId, renterId]
 *             properties:
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the booking
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the product
 *               renterId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the renter
 *               forceCheck:
 *                 type: boolean
 *                 description: Whether to force a fresh compliance check
 *                 default: false
 *     responses:
 *       200:
 *         description: Compliance check completed successfully
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
 *                   example: Compliance check completed successfully
 *                 data:
 *                   $ref: '#/components/schemas/ComplianceCheck'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/compliance/check', requireAuth, controller.checkCompliance);

/**
 * @swagger
 * /risk-management/compliance/booking/{bookingId}:
 *   get:
 *     summary: Get compliance status for a booking
 *     description: Retrieve the current compliance status for a specific booking
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the booking
 *     responses:
 *       200:
 *         description: Compliance status retrieved successfully
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
 *                   example: Compliance status retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/ComplianceCheck'
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/compliance/booking/:bookingId', requireAuth, controller.getComplianceStatus);

/**
 * @swagger
 * /risk-management/compliance/checks:
 *   get:
 *     summary: Get compliance checks
 *     description: Retrieve a paginated list of compliance checks with filtering options
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: bookingId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: renterId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: complianceStatus
 *         schema:
 *           type: string
 *           enum: [compliant, non_compliant, pending, grace_period, exempt]
 *     responses:
 *       200:
 *         description: Compliance checks retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/compliance/checks', requireAuth, controller.getComplianceChecks);

// =====================================================
// POLICY VIOLATION MANAGEMENT
// =====================================================

/**
 * @swagger
 * /risk-management/violations:
 *   post:
 *     summary: Record a policy violation
 *     description: Record a policy violation and determine appropriate enforcement actions
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, productId, renterId, violationType, severity, description]
 *             properties:
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the booking
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the product
 *               renterId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the renter
 *               violationType:
 *                 type: string
 *                 enum: [missing_insurance, missing_inspection, inadequate_coverage, expired_compliance]
 *                 description: Type of violation
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 description: Severity of the violation
 *               description:
 *                 type: string
 *                 description: Description of the violation
 *               penaltyAmount:
 *                 type: number
 *                 description: Penalty amount for the violation
 *     responses:
 *       201:
 *         description: Policy violation recorded successfully
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
 *                   example: Policy violation recorded successfully
 *                 data:
 *                   $ref: '#/components/schemas/PolicyViolation'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/violations', requireAuth, requireRole(['admin', 'super_admin', 'inspector']), controller.recordViolation);

/**
 * @swagger
 * /risk-management/violations:
 *   get:
 *     summary: Get policy violations
 *     description: Retrieve a paginated list of policy violations with filtering options
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Number of violations per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, resolved, escalated]
 *         description: Filter by violation status
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by violation severity
 *       - in: query
 *         name: bookingId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by booking ID
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by product ID
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Violations retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     violations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           bookingId:
 *                             type: string
 *                             format: uuid
 *                           productId:
 *                             type: string
 *                             format: uuid
 *                           violatorId:
 *                             type: string
 *                             format: uuid
 *                           violationType:
 *                             type: string
 *                           description:
 *                             type: string
 *                           severity:
 *                             type: string
 *                             enum: [low, medium, high, critical]
 *                           status:
 *                             type: string
 *                             enum: [pending, resolved, escalated]
 *                           enforcementAction:
 *                             type: string
 *                           penaltyAmount:
 *                             type: number
 *                           resolutionNotes:
 *                             type: string
 *                           resolvedAt:
 *                             type: string
 *                             format: date-time
 *                           resolvedBy:
 *                             type: string
 *                             format: uuid
 *                           productName:
 *                             type: string
 *                           productDescription:
 *                             type: string
 *                           violatorName:
 *                             type: string
 *                           violatorEmail:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
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
 *       500:
 *         description: Server error
 */
router.get('/violations', requireAuth, controller.getViolations);

/**
 * @swagger
 * /risk-management/violations/{id}:
 *   get:
 *     summary: Get violation by ID
 *     description: Retrieve a policy violation by its ID
 *     tags: [Risk Management]
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
 *       404:
 *         description: Violation not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/violations/:id', requireAuth, controller.getViolation);

/**
 * @swagger
 * /risk-management/violations/{id}:
 *   put:
 *     summary: Update a policy violation
 *     description: Update violation details (severity, description, penalty, status)
 *     tags: [Risk Management]
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
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               description:
 *                 type: string
 *               penaltyAmount:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [active, resolved, escalated]
 *     responses:
 *       200:
 *         description: Violation updated successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Violation not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/violations/:id', requireAuth, requireRole(['admin', 'super_admin', 'inspector']), controller.updateViolation);

/**
 * @swagger
 * /risk-management/violations/{id}/assign:
 *   patch:
 *     summary: Assign violation to inspector
 *     description: Assign a policy violation to an inspector for investigation
 *     tags: [Risk Management]
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
 *             required: [inspectorId]
 *             properties:
 *               inspectorId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the inspector to assign the violation to
 *     responses:
 *       200:
 *         description: Violation assigned successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Violation not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch('/violations/:id/assign', requireAuth, requireRole(['admin', 'super_admin', 'inspector']), controller.assignViolation);

/**
 * @swagger
 * /risk-management/violations/{id}/resolve:
 *   post:
 *     summary: Resolve a policy violation
 *     description: Mark a violation as resolved with resolution actions
 *     tags: [Risk Management]
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
 *             required:
 *               - resolutionActions
 *             properties:
 *               resolutionActions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Actions taken to resolve the violation
 *               resolutionNotes:
 *                 type: string
 *                 description: Notes about the resolution
 *     responses:
 *       200:
 *         description: Violation resolved successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Violation not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/violations/:id/resolve', requireAuth, requireRole(['admin', 'super_admin', 'inspector']), controller.resolveViolation);

/**
 * @swagger
 * /risk-management/violations/{id}:
 *   delete:
 *     summary: Delete a policy violation
 *     description: Soft delete a policy violation (mark as deleted)
 *     tags: [Risk Management]
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
 *         description: Violation deleted successfully
 *       404:
 *         description: Violation not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/violations/:id', requireAuth, requireRole(['admin', 'super_admin', 'inspector']), controller.deleteViolation);

// =====================================================
// AUTOMATED ENFORCEMENT
// =====================================================

/**
 * @swagger
 * /risk-management/enforce:
 *   post:
 *     summary: Trigger automated compliance enforcement
 *     description: Trigger automated enforcement actions for a booking based on compliance status
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId]
 *             properties:
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the booking to enforce compliance for
 *     responses:
 *       200:
 *         description: Enforcement triggered successfully
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
 *                   example: Enforcement triggered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     compliance:
 *                       $ref: '#/components/schemas/ComplianceCheck'
 *                     violationsRecorded:
 *                       type: integer
 *                       description: Number of violations recorded
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/enforce', requireAuth, requireRole(['admin', 'super_admin']), controller.triggerEnforcement);

/**
 * @swagger
 * /risk-management/enforce/{actionId}:
 *   post:
 *     summary: Execute a specific enforcement action
 *     description: Manually execute a pending enforcement action
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: actionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Enforcement action ID
 *     responses:
 *       200:
 *         description: Enforcement action executed successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Enforcement action not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/enforce/:actionId', requireAuth, requireRole(['admin', 'super_admin']), controller.executeEnforcementAction);

/**
 * @swagger
 * /risk-management/enforce/{id}/approve:
 *   patch:
 *     summary: Approve enforcement action
 *     description: Approve a pending enforcement action
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Enforcement action ID
 *     responses:
 *       200:
 *         description: Enforcement action approved successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Enforcement action not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch('/enforce/:id/approve', requireAuth, requireRole(['admin', 'super_admin']), controller.approveEnforcementAction);

/**
 * @swagger
 * /risk-management/enforce:
 *   get:
 *     summary: Get all enforcement actions with filters and pagination
 *     description: Retrieve all enforcement actions with optional filters and pagination
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [pending, executed, failed, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: actionType
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by action type
 *       - in: query
 *         name: bookingId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by booking ID
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by product ID
 *       - in: query
 *         name: renterId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by renter ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in message and required action
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *     responses:
 *       200:
 *         description: Enforcement actions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/enforce', requireAuth, requireRole(['admin', 'super_admin']), controller.getAllEnforcementActions);

/**
 * @swagger
 * /risk-management/enforce/booking/{bookingId}:
 *   get:
 *     summary: Get enforcement actions for a booking
 *     description: Retrieve all enforcement actions for a specific booking
 *     tags: [Risk Management]
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
 *         description: Enforcement actions retrieved successfully
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/enforce/booking/:bookingId', requireAuth, controller.getEnforcementActions);

// =====================================================
// RISK MANAGEMENT CONFIGURATION
// =====================================================

/**
 * @swagger
 * /risk-management/configs:
 *   post:
 *     summary: Create risk management configuration
 *     description: Create a new risk management configuration for a category/country combination
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryId, countryId]
 *             properties:
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               countryId:
 *                 type: string
 *                 format: uuid
 *               lowRiskThreshold:
 *                 type: integer
 *                 default: 30
 *               mediumRiskThreshold:
 *                 type: integer
 *                 default: 60
 *               highRiskThreshold:
 *                 type: integer
 *                 default: 85
 *               criticalRiskThreshold:
 *                 type: integer
 *                 default: 95
 *               enforcementLevel:
 *                 type: string
 *                 enum: [lenient, moderate, strict, very_strict]
 *               autoEnforcement:
 *                 type: boolean
 *                 default: true
 *               gracePeriodHours:
 *                 type: integer
 *                 default: 24
 *               mandatoryInsurance:
 *                 type: boolean
 *                 default: false
 *               minCoverageAmount:
 *                 type: number
 *               mandatoryInspection:
 *                 type: boolean
 *                 default: false
 *               inspectionTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *               inspectionDeadlineHours:
 *                 type: integer
 *                 default: 24
 *     responses:
 *       201:
 *         description: Risk management config created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/configs', requireAuth, requireRole(['admin', 'super_admin']), controller.createRiskManagementConfig);

/**
 * @swagger
 * /risk-management/configs/{categoryId}/{countryId}:
 *   get:
 *     summary: Get risk management configuration
 *     description: Retrieve risk management configuration for a category/country combination
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
 *       - in: path
 *         name: countryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Country ID
 *     responses:
 *       200:
 *         description: Risk management config retrieved successfully
 *       404:
 *         description: Config not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/configs/:categoryId/:countryId', requireAuth, controller.getRiskManagementConfig);

/**
 * @swagger
 * /risk-management/configs:
 *   get:
 *     summary: Get all risk management configurations
 *     description: Retrieve paginated list of risk management configurations
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: countryId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Risk management configs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/configs', requireAuth, requireRole(['admin', 'super_admin']), controller.getRiskManagementConfigs);

/**
 * @swagger
 * /risk-management/configs/{id}:
 *   put:
 *     summary: Update risk management configuration
 *     description: Update an existing risk management configuration
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Config ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lowRiskThreshold:
 *                 type: integer
 *               mediumRiskThreshold:
 *                 type: integer
 *               highRiskThreshold:
 *                 type: integer
 *               criticalRiskThreshold:
 *                 type: integer
 *               enforcementLevel:
 *                 type: string
 *                 enum: [lenient, moderate, strict, very_strict]
 *               autoEnforcement:
 *                 type: boolean
 *               gracePeriodHours:
 *                 type: integer
 *               mandatoryInsurance:
 *                 type: boolean
 *               minCoverageAmount:
 *                 type: number
 *               mandatoryInspection:
 *                 type: boolean
 *               inspectionTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *               inspectionDeadlineHours:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Risk management config updated successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Config not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/configs/:id', requireAuth, requireRole(['admin', 'super_admin']), controller.updateRiskManagementConfig);

// =====================================================
// STATISTICS AND ANALYTICS
// =====================================================

/**
 * @swagger
 * /risk-management/stats:
 *   get:
 *     summary: Get risk management statistics
 *     description: Retrieve comprehensive statistics about risk management, compliance, and enforcement
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Risk management statistics retrieved successfully
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
 *                   example: Risk management statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRiskProfiles:
 *                       type: integer
 *                       description: Total number of risk profiles
 *                     complianceRate:
 *                       type: number
 *                       description: Overall compliance rate percentage
 *                     violationRate:
 *                       type: number
 *                       description: Overall violation rate percentage
 *                     averageRiskScore:
 *                       type: number
 *                       description: Average risk score across all assessments
 *                     enforcementActions:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         successful:
 *                           type: integer
 *                         failed:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                     riskDistribution:
 *                       type: object
 *                       properties:
 *                         low:
 *                           type: integer
 *                         medium:
 *                           type: integer
 *                         high:
 *                           type: integer
 *                         critical:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/stats', requireAuth, requireRole(['admin', 'super_admin']), controller.getRiskManagementStats);

/**
 * @swagger
 * /risk-management/trends:
 *   get:
 *     summary: Get risk management trends
 *     description: Retrieve trend data for violations, compliance, and assessments
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Time period for trends
 *     responses:
 *       200:
 *         description: Trends retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/trends', requireAuth, requireRole(['admin', 'super_admin']), controller.getRiskManagementTrends);

/**
 * @swagger
 * /risk-management/dashboard/widgets:
 *   get:
 *     summary: Get dashboard widgets data
 *     description: Retrieve data for dashboard widgets including quick stats and recent items
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard widgets retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/dashboard/widgets', requireAuth, requireRole(['admin', 'super_admin']), controller.getDashboardWidgets);

export default router;
