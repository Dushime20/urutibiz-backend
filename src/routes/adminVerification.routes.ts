import { Router } from 'express';
import AdminVerificationController from '@/controllers/adminVerification.controller';
import UserVerificationController from '@/controllers/userVerification.controller';
import { requireAuth, requireAdmin } from '@/middleware/auth.middleware';

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminVerificationReview:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [verified, rejected]
 *         notes:
 *           type: string
 *     BulkVerificationReview:
 *       type: object
 *       required:
 *         - verificationIds
 *         - status
 *       properties:
 *         verificationIds:
 *           type: array
 *           items:
 *             type: string
 *         status:
 *           type: string
 *           enum: [verified, rejected]
 *         notes:
 *           type: string
 *     UpdateKycStatus:
 *       type: object
 *       required:
 *         - kycStatus
 *       properties:
 *         kycStatus:
 *           type: string
 *           enum: [unverified, basic, pending_review, verified, rejected, suspended, expired]
 *         notes:
 *           type: string
 * tags:
 *   - name: Admin Verification
 *     description: Admin verification management and KYC operations
 */

const router = Router();

/**
 * @swagger
 * /api/v1/admin/verifications:
 *   get:
 *     summary: List all verifications with pagination and filters
 *     tags: [Admin Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, verified, rejected, expired]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [national_id, passport, driving_license, address, selfie]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Verifications list retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/', requireAuth, requireAdmin, AdminVerificationController.listVerifications);

/**
 * @swagger
 * /api/v1/admin/verifications/pending:
 *   get:
 *     summary: Get pending verifications
 *     tags: [Admin Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Pending verifications retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/pending', requireAuth, requireAdmin, AdminVerificationController.getPendingVerifications);

/**
 * @swagger
 * /api/v1/admin/verifications/stats:
 *   get:
 *     summary: Get verification statistics
 *     tags: [Admin Verification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification statistics retrieved successfully
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
 *                     statusBreakdown:
 *                       type: object
 *                     typeBreakdown:
 *                       type: object
 *                     totalUsers:
 *                       type: number
 *                     verifiedUsers:
 *                       type: number
 *                     verificationRate:
 *                       type: string
 *                     recentActivity:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/stats', requireAuth, requireAdmin, AdminVerificationController.getVerificationStats);

/**
 * @swagger
 * /api/v1/admin/verifications/bulk-review:
 *   post:
 *     summary: Bulk review verifications
 *     tags: [Admin Verification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkVerificationReview'
 *     responses:
 *       200:
 *         description: Bulk review completed successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/bulk-review', requireAuth, requireAdmin, AdminVerificationController.bulkReviewVerifications);

/**
 * @swagger
 * /api/v1/admin/verifications/{id}:
 *   get:
 *     summary: Get verification details
 *     tags: [Admin Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Verification details retrieved successfully
 *       404:
 *         description: Verification not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/:id', requireAuth, requireAdmin, AdminVerificationController.getVerification);

/**
 * @swagger
 * /api/v1/admin/verifications/{id}/approve:
 *   post:
 *     summary: Approve a verification
 *     tags: [Admin Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification approved successfully
 *       404:
 *         description: Verification not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/:id/approve', requireAuth, requireAdmin, AdminVerificationController.approveVerification);

/**
 * @swagger
 * /api/v1/admin/verifications/{id}/reject:
 *   post:
 *     summary: Reject a verification
 *     tags: [Admin Verification]
 *     security:
 *       - bearerAuth: []
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
 *             required:
 *               - notes
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Reason for rejection
 *     responses:
 *       200:
 *         description: Verification rejected successfully
 *       400:
 *         description: Rejection reason is required
 *       404:
 *         description: Verification not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/:id/reject', requireAuth, requireAdmin, AdminVerificationController.rejectVerification);

/**
 * @swagger
 * /api/v1/admin/verifications/{id}/review:
 *   post:
 *     summary: Review a verification (legacy endpoint)
 *     tags: [Admin Verification]
 *     security:
 *       - bearerAuth: []
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
 *             $ref: '#/components/schemas/AdminVerificationReview'
 *     responses:
 *       200:
 *         description: Verification reviewed successfully
 *       404:
 *         description: Verification not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/:id/review', requireAuth, requireAdmin, UserVerificationController.reviewVerification);

/**
 * @swagger
 * /api/v1/admin/users/{id}/verifications:
 *   get:
 *     summary: Get all verifications for a specific user
 *     tags: [Admin Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User verifications retrieved successfully
 *       404:
 *         description: User not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/users/:id/verifications', requireAuth, requireAdmin, AdminVerificationController.getUserVerifications);

export default router;
