// =====================================================
// WALLET ROUTES
// =====================================================

import { NextFunction, Request, Response, Router } from 'express';
import { WalletController } from '@/controllers/wallet.controller';
import { requireAuth } from '@/middleware/auth.middleware';
import { AuthenticatedRequest } from '@/types';

const router = Router();
const controller = new WalletController();

// =====================================================
// WALLET ENDPOINTS
// =====================================================

const wrapAuthController = (
  handler: (req: AuthenticatedRequest, res: Response) => Promise<void>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req as AuthenticatedRequest, res);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * @route   GET /api/v1/wallet/earnings/:ownerId
 * @desc    Get owner's earnings from their items being booked
 * @access  Private (owner can view own earnings, admin can view anyone's)
 * @params  ownerId - Owner's user ID
 */
router.get('/earnings/:ownerId', requireAuth, wrapAuthController(controller.getOwnerEarnings));

/**
 * @route   GET /api/v1/wallet/balance/:ownerId
 * @desc    Get owner's wallet balance (simplified)
 * @access  Private (owner can view own balance, admin can view anyone's)
 * @params  ownerId - Owner's user ID
 */
router.get('/balance/:ownerId', requireAuth, wrapAuthController(controller.getWalletBalance));

export default router;
