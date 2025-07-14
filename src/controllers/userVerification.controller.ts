import { Request, Response } from 'express';
import UserVerificationService from '@/services/userVerification.service';
import { SubmitVerificationRequest, ReviewVerificationRequest } from '@/types/userVerification.types';
import { ResponseHelper } from '@/utils/response';

export default class UserVerificationController {
  /**
   * Submit documents for verification
   */
  static async submitDocuments(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const data: SubmitVerificationRequest = req.body;
      const verification = await UserVerificationService.submitVerification(userId, data);
      return ResponseHelper.success(res, 'Documents submitted for verification', verification);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Get user verification status
   */
  static async getVerificationStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const status = await UserVerificationService.getUserVerificationStatus(userId);
      return ResponseHelper.success(res, 'Verification status retrieved', status);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Resubmit verification documents
   */
  static async resubmitVerification(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { verificationId, ...data } = req.body;
      const verification = await UserVerificationService.resubmitVerification(userId, verificationId, data);
      return ResponseHelper.success(res, 'Documents resubmitted for verification', verification);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Get user verification documents
   */
  static async getVerificationDocuments(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const documents = await UserVerificationService.getUserVerificationDocuments(userId);
      return ResponseHelper.success(res, 'Verification documents retrieved', documents);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Get user verification history
   */
  static async getVerificationHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const history = await UserVerificationService.getUserVerificationHistory(userId);
      return ResponseHelper.success(res, 'Verification history retrieved', history);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Submit user verification
   * @swagger
   * /api/v1/user-verification/submit:
   *   post:
   *     summary: Submit user verification
   *     tags: [User Verification]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
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
   *         description: Verification submitted successfully
   *       401:
   *         description: Unauthorized
   */
  static async submitVerification(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const data: SubmitVerificationRequest = req.body;
      const verification = await UserVerificationService.submitVerification(userId, data);
      return ResponseHelper.success(res, 'Verification submitted', verification);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Get user verifications
   * @swagger
   * /api/v1/user-verification:
   *   get:
   *     summary: Get user verifications
   *     tags: [User Verification]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User verifications fetched successfully
   *       401:
   *         description: Unauthorized
   */
  static async getUserVerifications(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const verifications = await UserVerificationService.getUserVerifications(userId);
      return ResponseHelper.success(res, 'User verifications fetched', verifications);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Review user verification
   * @swagger
   * /api/v1/user-verification/review:
   *   post:
   *     summary: Review user verification
   *     tags: [User Verification]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               verificationId:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [approved, rejected]
   *               remarks:
   *                 type: string
   *     responses:
   *       200:
   *         description: Verification reviewed successfully
   *       401:
   *         description: Unauthorized
   */
  static async reviewVerification(req: Request, res: Response) {
    try {
      const adminId = (req as any).user.id;
      const data: ReviewVerificationRequest = req.body;
      const verification = await UserVerificationService.reviewVerification(adminId, data);
      return ResponseHelper.success(res, 'Verification reviewed', verification);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Request OTP for phone number update
   */
  static async requestPhoneOtp(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        return ResponseHelper.error(res, 'Phone number is required');
      }
      await UserVerificationService.requestPhoneOtp(userId, phoneNumber);
      return ResponseHelper.success(res, 'OTP sent to phone number');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Verify OTP and update phone number
   */
  static async verifyPhoneOtp(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { phoneNumber, otp } = req.body;
      if (!phoneNumber || !otp) {
        return ResponseHelper.error(res, 'Phone number and OTP are required');
      }
      await UserVerificationService.verifyPhoneOtp(userId, phoneNumber, otp);
      return ResponseHelper.success(res, 'Phone number updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }
}
