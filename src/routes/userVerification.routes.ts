import { Router } from 'express';
import UserVerificationController from '@/controllers/userVerification.controller';
import { EnhancedUserVerificationController } from '@/controllers/userVerification.controller.enhanced';
import { requireAuth, requireAdmin } from '@/middleware/auth.middleware';
import { cacheMiddleware, cacheInvalidationMiddleware } from '@/middleware/cache.middleware';
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * components:
 *   schemas:
 *     VerificationStatus:
 *       type: string
 *       enum: [unverified, pending, verified, rejected, expired]
 *     VerificationType:
 *       type: string
 *       enum: [national_id, passport, driving_license, address, selfie]
 *     UserVerification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         verificationType:
 *           $ref: '#/components/schemas/VerificationType'
 *         documentNumber:
 *           type: string
 *         documentImageUrl:
 *           type: string
 *         verificationStatus:
 *           $ref: '#/components/schemas/VerificationStatus'
 *         verifiedBy:
 *           type: string
 *         verifiedAt:
 *           type: string
 *           format: date-time
 *         notes:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         addressLine:
 *           type: string
 *         city:
 *           type: string
 *         district:
 *           type: string
 *         country:
 *           type: string
 *         selfieImageUrl:
 *           type: string
 *         livenessScore:
 *           type: number
 *         aiProfileScore:
 *           type: number
 *     SubmitVerificationRequest:
 *       type: object
 *       required:
 *         - verificationType
 *       properties:
 *         verificationType:
 *           $ref: '#/components/schemas/VerificationType'
 *         documentNumber:
 *           type: string
 *         documentImageUrl:
 *           type: string
 *         addressLine:
 *           type: string
 *         city:
 *           type: string
 *         district:
 *           type: string
 *         country:
 *           type: string
 *         selfieImageUrl:
 *           type: string
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   responses:
 *     UnauthorizedError:
 *       description: Access token is missing or invalid
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "Access token required"
 *     ForbiddenError:
 *       description: Insufficient permissions
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "Insufficient permissions"
 * tags:
 *   - name: User Verification
 *     description: User identity verification and KYC operations
 */

const router = Router();

// Cache configuration for user verification
const verificationCacheOptions = {
  duration: 60, // Short cache for verification data (1 minute)
  keyPrefix: 'verification',
  varyBy: ['authorization'], // Vary by user
  excludeParams: ['_t', 'timestamp']
};

/**
 * @swagger
 * /api/v1/user-verification/submit-documents:
 *   post:
 *     summary: Submit documents for verification
 *     tags: [User Verification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubmitVerificationRequest'
 *     responses:
 *       200:
 *         description: Documents submitted successfully
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
 *                   example: "Documents submitted for verification"
 *                 data:
 *                   $ref: '#/components/schemas/UserVerification'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal server error
 */
router.post('/submit-documents', requireAuth, cacheInvalidationMiddleware(['verification:*']), 
  upload.fields([{ name: 'documentImage' }, { name: 'selfieImage' }]),
  EnhancedUserVerificationController.submitDocuments);

/**
 * @swagger
 * /api/v1/user-verification/status:
 *   get:
 *     summary: Get user verification status
 *     tags: [User Verification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification status retrieved successfully
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
 *                   example: "Verification status retrieved"
 *                 data:
 *                   type: object
 *                   properties:
 *                     overall_status:
 *                       $ref: '#/components/schemas/VerificationStatus'
 *                     kyc_status:
 *                       type: string
 *                     verification_types:
 *                       type: object
 *                     pending_count:
 *                       type: number
 *                     verified_count:
 *                       type: number
 *                     rejected_count:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/status', requireAuth, cacheMiddleware(verificationCacheOptions), 
  EnhancedUserVerificationController.getVerificationStatus);

/**
 * @swagger
 * /api/v1/user-verification/resubmit:
 *   put:
 *     summary: Resubmit verification documents
 *     tags: [User Verification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - type: object
 *                 required:
 *                   - verificationId
 *                 properties:
 *                   verificationId:
 *                     type: string
 *               - $ref: '#/components/schemas/SubmitVerificationRequest'
 *     responses:
 *       200:
 *         description: Documents resubmitted successfully
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
 *                   example: "Documents resubmitted for verification"
 *                 data:
 *                   $ref: '#/components/schemas/UserVerification'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Verification not found
 */
router.put('/resubmit', requireAuth, UserVerificationController.resubmitVerification);

/**
 * @swagger
 * /api/v1/user-verification/documents:
 *   get:
 *     summary: Get user verification documents
 *     tags: [User Verification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification documents retrieved successfully
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
 *                   example: "Verification documents retrieved"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       verification_type:
 *                         $ref: '#/components/schemas/VerificationType'
 *                       document_number:
 *                         type: string
 *                       document_image_url:
 *                         type: string
 *                       selfie_image_url:
 *                         type: string
 *                       verification_status:
 *                         $ref: '#/components/schemas/VerificationStatus'
 *                       submitted_at:
 *                         type: string
 *                         format: date-time
 *                       ai_profile_score:
 *                         type: number
 *                       liveness_score:
 *                         type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/documents', requireAuth, cacheMiddleware(verificationCacheOptions), UserVerificationController.getVerificationDocuments);

/**
 * @swagger
 * /api/v1/user-verification/history:
 *   get:
 *     summary: Get user verification history
 *     tags: [User Verification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification history retrieved successfully
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
 *                   example: "Verification history retrieved"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       verification_type:
 *                         $ref: '#/components/schemas/VerificationType'
 *                       verification_status:
 *                         $ref: '#/components/schemas/VerificationStatus'
 *                       submitted_at:
 *                         type: string
 *                         format: date-time
 *                       verified_at:
 *                         type: string
 *                         format: date-time
 *                       verified_by:
 *                         type: string
 *                       notes:
 *                         type: string
 *                       document_number:
 *                         type: string
 *                         description: "Masked document number for privacy"
 *                       ai_profile_score:
 *                         type: number
 *                       liveness_score:
 *                         type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/history', requireAuth, cacheMiddleware(verificationCacheOptions), UserVerificationController.getVerificationHistory);

// Legacy endpoints (for backwards compatibility)
router.post('/user-verification', requireAuth, cacheInvalidationMiddleware(['verification:*']), UserVerificationController.submitVerification);
router.get('/user-verification', requireAuth, cacheMiddleware(verificationCacheOptions), UserVerificationController.getUserVerifications);

// Admin endpoints
router.post('/user-verification/review', requireAuth, requireAdmin, cacheInvalidationMiddleware(['verification:*']), UserVerificationController.reviewVerification);

/**
 * @swagger
 * /api/v1/user-verification/ai-processing-metrics:
 *   get:
 *     summary: Get AI processing queue metrics
 *     tags: [User Verification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI processing metrics retrieved successfully
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
 *                   example: "AI processing metrics retrieved"
 *                 data:
 *                   type: object
 *                   properties:
 *                     queueSize:
 *                       type: number
 *                     activeJobs:
 *                       type: number
 *                     completedJobs:
 *                       type: number
 *                     failedJobs:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/ai-processing-metrics', requireAuth, 
  EnhancedUserVerificationController.getAIProcessingMetrics);

/**
 * @swagger
 * /api/v1/user-verification/{verificationId}:
 *   put:
 *     summary: Update user verification data
 *     tags: [User Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: verificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Verification ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               verificationType:
 *                 type: string
 *                 enum: [national_id, passport, driving_license, address, selfie]
 *               documentNumber:
 *                 type: string
 *               documentImage:
 *                 type: string
 *                 format: binary
 *                 description: Document image file
 *               documentImageUrl:
 *                 type: string
 *                 description: Direct URL to document image
 *               addressLine:
 *                 type: string
 *               city:
 *                 type: string
 *               district:
 *                 type: string
 *               country:
 *                 type: string
 *               selfieImage:
 *                 type: string
 *                 format: binary
 *                 description: Selfie image file
 *               selfieImageUrl:
 *                 type: string
 *                 description: Direct URL to selfie image
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               verificationType:
 *                 type: string
 *                 enum: [national_id, passport, driving_license, address, selfie]
 *               documentNumber:
 *                 type: string
 *               documentImageUrl:
 *                 type: string
 *               addressLine:
 *                 type: string
 *               city:
 *                 type: string
 *               district:
 *                 type: string
 *               country:
 *                 type: string
 *               selfieImageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification updated successfully
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
 *                   example: "Verification updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     verification:
 *                       $ref: '#/components/schemas/UserVerification'
 *                     message:
 *                       type: string
 *                       example: "Verification data updated. Status reset to pending for review."
 *       400:
 *         description: Invalid request data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to update this verification
 *       404:
 *         description: Verification not found
 *       409:
 *         description: Cannot update already verified documents
 */
router.put('/:verificationId', requireAuth, cacheInvalidationMiddleware(['verification:*']), 
  upload.fields([{ name: 'documentImage' }, { name: 'selfieImage' }]),
  EnhancedUserVerificationController.updateVerification);

/**
 * @swagger
 * /api/v1/user-verification/{verificationId}/cancel-ai:
 *   post:
 *     summary: Cancel AI processing for a verification
 *     tags: [User Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: verificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Verification ID to cancel AI processing for
 *     responses:
 *       200:
 *         description: AI processing cancelled successfully
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
 *                   example: "AI processing cancelled"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to cancel this verification
 *       404:
 *         description: Verification not found
 */
router.post('/:verificationId/cancel-ai', requireAuth, cacheInvalidationMiddleware(['verification:*']), 
  EnhancedUserVerificationController.cancelAIProcessing);

export default router;
