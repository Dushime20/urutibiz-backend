import { Router } from 'express';
import ThirdPartyInspectionController from '@/controllers/thirdPartyInspection.controller';
import { requireAuth, requireRole } from '@/middleware/auth.middleware';

const router = Router();
const controller = ThirdPartyInspectionController;

/**
 * @swagger
 * tags:
 *   name: Third-Party Inspections
 *   description: Professional third-party inspection system (Dubizzle-style)
 */

/**
 * @swagger
 * /third-party-inspections:
 *   post:
 *     summary: Create a third-party professional inspection
 *     description: Request a professional inspection by a certified inspector
 *     tags: [Third-Party Inspections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, categoryId, bookingId, scheduledAt]
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *                 description: Required - third-party inspections must be linked to a booking
 *               inspectorId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional - will be auto-assigned if not provided
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               notes:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high]
 *     responses:
 *       201:
 *         description: Inspection created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/', requireAuth, controller.createThirdPartyInspection);

/**
 * @swagger
 * /third-party-inspections/{id}/complete:
 *   post:
 *     summary: Complete a third-party inspection
 *     description: Inspector completes inspection with scores and ratings
 *     tags: [Third-Party Inspections]
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
 *             required: [scores, isPassed]
 *             properties:
 *               scores:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     criterionId:
 *                       type: string
 *                     criterionName:
 *                       type: string
 *                     score:
 *                       type: number
 *                     maxScore:
 *                       type: number
 *                     notes:
 *                       type: string
 *                     evidence:
 *                       type: object
 *               inspectorNotes:
 *                 type: string
 *               recommendations:
 *                 type: string
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *               isPassed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Inspection completed successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/complete', requireAuth, requireRole(['inspector', 'admin', 'super_admin']), controller.completeThirdPartyInspection);

/**
 * @swagger
 * /third-party-inspections/criteria/{categoryId}:
 *   get:
 *     summary: Get inspection criteria template for a category
 *     description: Retrieve the inspection checklist/criteria for a product category
 *     tags: [Third-Party Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Criteria template retrieved successfully
 *       404:
 *         description: Template not found
 */
router.get('/criteria/:categoryId', requireAuth, controller.getCriteriaTemplate);

/**
 * @swagger
 * /third-party-inspections/public-reports/{productId}:
 *   get:
 *     summary: Get latest public inspection report for a product
 *     description: Public endpoint to view inspection report (no auth required)
 *     tags: [Third-Party Inspections]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Public report retrieved successfully
 *       404:
 *         description: Report not found
 */
router.get('/public-reports/:productId', controller.getPublicReport);

/**
 * @swagger
 * /third-party-inspections/public-reports/{productId}/all:
 *   get:
 *     summary: Get all public inspection reports for a product
 *     description: Get all historical inspection reports for a product
 *     tags: [Third-Party Inspections]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Public reports retrieved successfully
 */
router.get('/public-reports/:productId/all', controller.getPublicReports);

/**
 * @swagger
 * /third-party-inspections/{id}/pay:
 *   post:
 *     summary: Process payment for inspection
 *     description: Pay the required fees for a third-party inspection
 *     tags: [Third-Party Inspections]
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
 *             required: [paymentMethodId, amount, currency]
 *             properties:
 *               paymentMethodId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               provider:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       400:
 *         description: Invalid request data or payment failed
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/pay', requireAuth, controller.processInspectionPayment);

/**
 * @swagger
 * /third-party-inspections/bookings/{productId}:
 *   get:
 *     summary: Get bookings for product owner
 *     description: Retrieve bookings for a product to select one for inspection
 *     tags: [Third-Party Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.get('/bookings/:productId', requireAuth, controller.getOwnerBookings);

/**
 * @swagger
 * /third-party-inspections/available-inspectors:
 *   get:
 *     summary: Get available inspectors for a category and location
 *     description: Retrieve list of available inspectors that can perform inspection for a given category and location
 *     tags: [Third-Party Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: countryId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *       - in: query
 *         name: preferredLanguage
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Available inspectors retrieved successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.get('/available-inspectors', requireAuth, controller.getAvailableInspectors);

export default router;

