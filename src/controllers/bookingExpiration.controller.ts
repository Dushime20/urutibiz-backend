import { Response } from 'express';
import { BaseController } from './BaseController';
import { BookingExpirationService } from '@/services/bookingExpiration.service';
import { AuthenticatedRequest } from '@/types';
import { ResponseHelper } from '@/utils/response';
import logger from '@/utils/logger';

/**
 * Booking Expiration Management Controller
 * 
 * Handles admin configuration and monitoring of booking expiration lifecycle
 */
export class BookingExpirationController extends BaseController {
  
  /**
   * Get current booking expiration settings
   */
  public getExpirationSettings = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Only admin can access expiration settings
      if (req.user.role !== 'admin') {
        return ResponseHelper.forbidden(res, 'Admin access required');
      }

      const settings = await BookingExpirationService.getExpirationSettings();
      
      return ResponseHelper.success(res, 'Booking expiration settings retrieved successfully', settings);
    } catch (error) {
      logger.error('Error fetching booking expiration settings:', error);
      return ResponseHelper.error(res, 'Failed to fetch booking expiration settings', 500);
    }
  });

  /**
   * Update booking expiration settings
   */
  public updateExpirationSettings = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Only admin can update expiration settings
      if (req.user.role !== 'admin') {
        return ResponseHelper.forbidden(res, 'Admin access required');
      }

      const { booking_expiration_hours, booking_expiration_enabled } = req.body;

      // Validate expiration hours
      const allowedHours = [2, 4, 8, 12, 24, 48];
      if (booking_expiration_hours && !allowedHours.includes(booking_expiration_hours)) {
        return ResponseHelper.error(res, `Invalid expiration hours. Allowed values: ${allowedHours.join(', ')}`, 400);
      }

      const updateData: any = {};
      if (booking_expiration_hours !== undefined) {
        updateData.booking_expiration_hours = booking_expiration_hours;
      }
      if (booking_expiration_enabled !== undefined) {
        updateData.booking_expiration_enabled = booking_expiration_enabled;
      }

      await BookingExpirationService.updateExpirationSettings(updateData);

      const updatedSettings = await BookingExpirationService.getExpirationSettings();
      
      this.logAction('UPDATE_BOOKING_EXPIRATION_SETTINGS', req.user.id, undefined, updateData);
      
      return ResponseHelper.success(res, 'Booking expiration settings updated successfully', updatedSettings);
    } catch (error) {
      logger.error('Error updating booking expiration settings:', error);
      return ResponseHelper.error(res, 'Failed to update booking expiration settings', 500);
    }
  });

  /**
   * Get booking expiration statistics for admin dashboard
   */
  public getExpirationStats = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Only admin can access expiration stats
      if (req.user.role !== 'admin') {
        return ResponseHelper.forbidden(res, 'Admin access required');
      }

      const stats = await BookingExpirationService.getExpirationStats();
      
      return ResponseHelper.success(res, 'Booking expiration statistics retrieved successfully', stats);
    } catch (error) {
      logger.error('Error fetching booking expiration stats:', error);
      return ResponseHelper.error(res, 'Failed to fetch booking expiration statistics', 500);
    }
  });

  /**
   * Manually trigger booking expiration cleanup (Admin only)
   */
  public triggerExpirationCleanup = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Only admin can trigger manual cleanup
      if (req.user.role !== 'admin') {
        return ResponseHelper.forbidden(res, 'Admin access required');
      }

      logger.info(`Manual booking expiration cleanup triggered by admin: ${req.user.id}`);
      
      const result = await BookingExpirationService.processExpiredBookings();
      
      this.logAction('TRIGGER_BOOKING_EXPIRATION_CLEANUP', req.user.id, undefined, result);
      
      return ResponseHelper.success(res, 'Booking expiration cleanup completed successfully', result);
    } catch (error) {
      logger.error('Error triggering booking expiration cleanup:', error);
      return ResponseHelper.error(res, 'Failed to trigger booking expiration cleanup', 500);
    }
  });

  /**
   * Get booking expiration logs for auditing
   */
  public getExpirationLogs = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Only admin can access expiration logs
      if (req.user.role !== 'admin') {
        return ResponseHelper.forbidden(res, 'Admin access required');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = (page - 1) * limit;

      const { getDatabase } = await import('@/config/database');
      const knex = getDatabase();
      
      // Get logs with pagination
      const [logs, totalCount] = await Promise.all([
        knex('booking_expiration_logs')
          .select([
            'id',
            'booking_id',
            'booking_reference',
            'user_id',
            'product_title',
            'booking_created_at',
            'booking_expires_at',
            'expiration_hours_used',
            'booking_status',
            'booking_amount',
            'deletion_reason',
            'expired_at',
            'expired_by'
          ])
          .orderBy('expired_at', 'desc')
          .limit(limit)
          .offset(offset),
        
        knex('booking_expiration_logs').count('* as count').first()
      ]);

      const totalPages = Math.ceil(parseInt(String(totalCount?.count || '0')) / limit);

      const response = {
        data: logs,
        meta: {
          total: parseInt(String(totalCount?.count || '0')),
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
      
      return ResponseHelper.success(res, 'Booking expiration logs retrieved successfully', response);
    } catch (error) {
      logger.error('Error fetching booking expiration logs:', error);
      return ResponseHelper.error(res, 'Failed to fetch booking expiration logs', 500);
    }
  });

  /**
   * Get detailed expiration log for a specific booking
   */
  public getExpirationLogDetails = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Only admin can access detailed expiration logs
      if (req.user.role !== 'admin') {
        return ResponseHelper.forbidden(res, 'Admin access required');
      }

      const { logId } = req.params;

      const { getDatabase } = await import('@/config/database');
      const knex = getDatabase();
      
      const log = await knex('booking_expiration_logs')
        .where('id', logId)
        .first();

      if (!log) {
        return ResponseHelper.notFound(res, 'Expiration log not found');
      }
      
      return ResponseHelper.success(res, 'Booking expiration log details retrieved successfully', log);
    } catch (error) {
      logger.error('Error fetching booking expiration log details:', error);
      return ResponseHelper.error(res, 'Failed to fetch booking expiration log details', 500);
    }
  });

  /**
   * Set expiration for a specific booking (used internally when booking is created)
   */
  public setBookingExpiration = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bookingId } = req.params;

      await BookingExpirationService.setBookingExpiration(bookingId);
      
      return ResponseHelper.success(res, 'Booking expiration set successfully', { bookingId });
    } catch (error) {
      logger.error('Error setting booking expiration:', error);
      return ResponseHelper.error(res, 'Failed to set booking expiration', 500);
    }
  });
}

export default new BookingExpirationController();