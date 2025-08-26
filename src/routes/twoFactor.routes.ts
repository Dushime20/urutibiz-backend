// =====================================================
// TWO-FACTOR AUTHENTICATION ROUTES
// =====================================================

import { Router } from 'express';
import { TwoFactorController } from '@/controllers/twoFactor.controller';
import { requireAuth } from '@/middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TwoFactorSetup:
 *       type: object
 *       properties:
 *         qrCode:
 *           type: string
 *           description: Base64 encoded QR code image
 *         backupCodes:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of backup codes
 *         secret:
 *           type: string
 *           description: TOTP secret key for manual entry
 *     
 *     TwoFactorStatus:
 *       type: object
 *       properties:
 *         enabled:
 *           type: boolean
 *           description: Whether 2FA is enabled
 *         verified:
 *           type: boolean
 *           description: Whether 2FA setup has been verified
 *         hasSecret:
 *           type: boolean
 *           description: Whether user has a 2FA secret
 *         hasBackupCodes:
 *           type: boolean
 *           description: Whether user has backup codes
 *     
 *     VerifyTwoFactorRequest:
 *       type: object
 *       required:
 *         - token
 *       properties:
 *         token:
 *           type: string
 *           description: 6-digit TOTP token
 *     
 *     DisableTwoFactorRequest:
 *       type: object
 *       required:
 *         - currentPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           description: User's current password
 *     
 *     GenerateBackupCodesRequest:
 *       type: object
 *       required:
 *         - currentPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           description: User's current password
 */

/**
 * @swagger
 * /api/v1/2fa/setup:
 *   post:
 *     summary: Generate 2FA setup (QR code and backup codes)
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA setup generated successfully
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
 *                   $ref: '#/components/schemas/TwoFactorSetup'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.post('/setup', requireAuth, TwoFactorController.generateSetup);

/**
 * @swagger
 * /api/v1/2fa/verify:
 *   post:
 *     summary: Verify 2FA token and enable 2FA
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyTwoFactorRequest'
 *     responses:
 *       200:
 *         description: 2FA enabled successfully
 *       400:
 *         description: Invalid token
 *       401:
 *         description: Unauthorized
 */
router.post('/verify', requireAuth, TwoFactorController.verifyAndEnable);

/**
 * @swagger
 * /api/v1/2fa/verify-token:
 *   post:
 *     summary: Verify 2FA token for login (public endpoint)
 *     tags: [Two-Factor Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - token
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID
 *               token:
 *                 type: string
 *                 description: 6-digit TOTP token
 *     responses:
 *       200:
 *         description: Token verified successfully
 *       400:
 *         description: Invalid token
 */
router.post('/verify-token', TwoFactorController.verifyToken);

/**
 * @swagger
 * /api/v1/2fa/verify-backup:
 *   post:
 *     summary: Verify backup code (public endpoint)
 *     tags: [Two-Factor Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - backupCode
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID
 *               backupCode:
 *                 type: string
 *                 description: Backup code
 *     responses:
 *       200:
 *         description: Backup code verified successfully
 *       400:
 *         description: Invalid backup code
 */
router.post('/verify-backup', TwoFactorController.verifyBackupCode);

/**
 * @swagger
 * /api/v1/2fa/disable:
 *   post:
 *     summary: Disable 2FA
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DisableTwoFactorRequest'
 *     responses:
 *       200:
 *         description: 2FA disabled successfully
 *       400:
 *         description: Invalid password
 *       401:
 *         description: Unauthorized
 */
router.post('/disable', requireAuth, TwoFactorController.disable);

/**
 * @swagger
 * /api/v1/2fa/status:
 *   get:
 *     summary: Get 2FA status
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA status retrieved successfully
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
 *                   $ref: '#/components/schemas/TwoFactorStatus'
 *       401:
 *         description: Unauthorized
 */
router.get('/status', requireAuth, TwoFactorController.getStatus);

/**
 * @swagger
 * /api/v1/2fa/backup-codes:
 *   post:
 *     summary: Generate new backup codes
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateBackupCodesRequest'
 *     responses:
 *       200:
 *         description: New backup codes generated successfully
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
 *                     backupCodes:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Invalid password
 *       401:
 *         description: Unauthorized
 */
router.post('/backup-codes', requireAuth, TwoFactorController.generateNewBackupCodes);

export default router;
