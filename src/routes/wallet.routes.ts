// =====================================================
// WALLET ROUTES
// =====================================================

import { Router } from 'express';
import { WalletController } from '@/controllers/wallet.controller';
import { requireAuth } from '@/middleware/auth.middleware';

const router = Router();
const controller = new WalletController();

// =====================================================
// WALLET ENDPOINTS
// =====================================================

/**
 * @route   GET /api/v1/wallet/earnings/:ownerId
 * @desc    Get owner's earnings from their items being booked
 * @access  Private (owner can view own earnings, admin can view anyone's)
 * @params  ownerId - Owner's user ID
 */
router.get('/earnings/:ownerId', requireAuth, controller.getOwnerEarnings);

/**
 * @route   GET /api/v1/wallet/balance/:ownerId
 * @desc    Get owner's wallet balance (simplified)
 * @access  Private (owner can view own balance, admin can view anyone's)
 * @params  ownerId - Owner's user ID
 */
router.get('/balance/:ownerId', requireAuth, controller.getWalletBalance);

export default router;
