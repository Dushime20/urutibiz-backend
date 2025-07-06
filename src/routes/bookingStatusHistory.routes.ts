// =====================================================
// BOOKING STATUS HISTORY ROUTES
// =====================================================

import { Router } from 'express';
import BookingsController from '@/controllers/bookings.controller';

const router = Router();

/**
 * @route   GET /api/v1/bookings/:id/status-history
 * @desc    Get booking status history
 * @access  Private (Booking participants or Admin)
 */
router.get('/:id/status-history', BookingsController.getBookingStatusHistory);

/**
 * @route   GET /api/v1/bookings/:id/status-analytics
 * @desc    Get booking status analytics
 * @access  Private (Booking participants or Admin)
 */
router.get('/:id/status-analytics', BookingsController.getBookingStatusAnalytics);

/**
 * @route   GET /api/v1/bookings/status-stats
 * @desc    Get global booking status statistics
 * @access  Private (Admin only)
 */
router.get('/status-stats', BookingsController.getGlobalStatusStats);

export default router;
