// =====================================================
// TWO-FACTOR AUTHENTICATION CONTROLLER
// =====================================================

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/types';
import TwoFactorService from '@/services/twoFactor.service';
import { ResponseHelper } from '@/utils/response';



export class TwoFactorController {
  /**
   * Generate 2FA setup (QR code and backup codes)
   */
  static async generateSetup(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        ResponseHelper.unauthorized(res, 'User not authenticated');
        return;
      }

      const setup = await TwoFactorService.generateSetup(userId);
      
      ResponseHelper.success(res, '2FA setup generated successfully', {
        qrCode: setup.qrCode,
        backupCodes: setup.backupCodes,
        secret: setup.secret // Include secret for manual entry
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      ResponseHelper.error(res, errorMessage, 400);
    }
  }

  /**
   * Verify 2FA token and enable 2FA
   */
  static async verifyAndEnable(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { token } = req.body;

      if (!userId) {
        ResponseHelper.unauthorized(res, 'User not authenticated');
        return;
      }

      if (!token) {
        ResponseHelper.badRequest(res, 'Token is required');
        return;
      }

      const isValid = await TwoFactorService.verifyAndEnable(userId, token);
      
      if (isValid) {
        ResponseHelper.success(res, '2FA enabled successfully');
      } else {
        ResponseHelper.badRequest(res, 'Invalid 2FA token');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      ResponseHelper.error(res, errorMessage, 400);
    }
  }

  /**
   * Verify 2FA token for login
   */
  static async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      const { userId, token } = req.body;

      if (!userId || !token) {
        ResponseHelper.badRequest(res, 'User ID and token are required');
        return;
      }

      const isValid = await TwoFactorService.verifyToken(userId, token);
      
      if (isValid) {
        ResponseHelper.success(res, '2FA token verified successfully');
      } else {
        ResponseHelper.badRequest(res, 'Invalid 2FA token');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      ResponseHelper.error(res, errorMessage, 400);
    }
  }

  /**
   * Verify backup code
   */
  static async verifyBackupCode(req: Request, res: Response): Promise<void> {
    try {
      const { userId, backupCode } = req.body;

      if (!userId || !backupCode) {
        ResponseHelper.badRequest(res, 'User ID and backup code are required');
        return;
      }

      const isValid = await TwoFactorService.verifyBackupCode(userId, backupCode);
      
      if (isValid) {
        ResponseHelper.success(res, 'Backup code verified successfully');
      } else {
        ResponseHelper.badRequest(res, 'Invalid backup code');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      ResponseHelper.error(res, errorMessage, 400);
    }
  }

  /**
   * Disable 2FA
   */
  static async disable(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { currentPassword } = req.body;

      if (!userId) {
        ResponseHelper.unauthorized(res, 'User not authenticated');
        return;
      }

      if (!currentPassword) {
        ResponseHelper.badRequest(res, 'Current password is required');
        return;
      }

      const success = await TwoFactorService.disable(userId, currentPassword);
      
      if (success) {
        ResponseHelper.success(res, '2FA disabled successfully');
      } else {
        ResponseHelper.badRequest(res, 'Invalid current password');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      ResponseHelper.error(res, errorMessage, 400);
    }
  }

  /**
   * Get 2FA status
   */
  static async getStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        ResponseHelper.unauthorized(res, 'User not authenticated');
        return;
      }

      const status = await TwoFactorService.getStatus(userId);
      
      ResponseHelper.success(res, '2FA status retrieved successfully', status);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      ResponseHelper.error(res, errorMessage, 400);
    }
  }

  /**
   * Generate new backup codes
   */
  static async generateNewBackupCodes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { currentPassword } = req.body;

      if (!userId) {
        ResponseHelper.unauthorized(res, 'User not authenticated');
        return;
      }

      if (!currentPassword) {
        ResponseHelper.badRequest(res, 'Current password is required');
        return;
      }

      const backupCodes = await TwoFactorService.generateNewBackupCodes(userId, currentPassword);
      
      ResponseHelper.success(res, 'New backup codes generated successfully', {
        backupCodes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      ResponseHelper.error(res, errorMessage, 400);
    }
  }
}

export default TwoFactorController;
