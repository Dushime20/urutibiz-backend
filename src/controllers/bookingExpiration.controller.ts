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
      
      // Filter parameters
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const search = req.query.search as string;

      const { getDatabase } = await import('@/config/database');
      const knex = getDatabase();
      
      // Build query with filters and join users for renter and owner info
      let query = knex('booking_expiration_logs')
        .select([
          'booking_expiration_logs.id',
          'booking_expiration_logs.booking_id',
          'booking_expiration_logs.booking_reference',
          'booking_expiration_logs.user_id',
          'booking_expiration_logs.renter_id',
          'booking_expiration_logs.owner_id',
          'booking_expiration_logs.product_title',
          'booking_expiration_logs.booking_created_at',
          'booking_expiration_logs.booking_expires_at',
          'booking_expiration_logs.expiration_hours_used',
          'booking_expiration_logs.booking_status',
          'booking_expiration_logs.booking_amount',
          'booking_expiration_logs.deletion_reason',
          'booking_expiration_logs.booking_data',
          'booking_expiration_logs.expired_at',
          'booking_expiration_logs.expired_by',
          // Renter info
          knex.raw(`CONCAT(renter.first_name, ' ', renter.last_name) as renter_name`),
          'renter.email as renter_email',
          'renter.phone as renter_phone',
          // Owner info
          knex.raw(`CONCAT(owner.first_name, ' ', owner.last_name) as owner_name`),
          'owner.email as owner_email',
          'owner.phone as owner_phone'
        ])
        .leftJoin('users as renter', 'booking_expiration_logs.renter_id', 'renter.id')
        .leftJoin('users as owner', 'booking_expiration_logs.owner_id', 'owner.id');

      let countQuery = knex('booking_expiration_logs');

      // Apply filters
      if (startDate) {
        query = query.where('booking_expiration_logs.expired_at', '>=', startDate);
        countQuery = countQuery.where('expired_at', '>=', startDate);
      }
      if (endDate) {
        query = query.where('booking_expiration_logs.expired_at', '<=', endDate);
        countQuery = countQuery.where('expired_at', '<=', endDate);
      }
      if (search) {
        query = query.where(function() {
          this.where('booking_expiration_logs.booking_reference', 'ilike', `%${search}%`)
            .orWhere('booking_expiration_logs.product_title', 'ilike', `%${search}%`)
            .orWhere('booking_expiration_logs.deletion_reason', 'ilike', `%${search}%`)
            .orWhere('renter.first_name', 'ilike', `%${search}%`)
            .orWhere('renter.last_name', 'ilike', `%${search}%`)
            .orWhere('renter.email', 'ilike', `%${search}%`)
            .orWhere('owner.first_name', 'ilike', `%${search}%`)
            .orWhere('owner.last_name', 'ilike', `%${search}%`)
            .orWhere('owner.email', 'ilike', `%${search}%`);
        });
        countQuery = countQuery.where(function() {
          this.where('booking_reference', 'ilike', `%${search}%`)
            .orWhere('product_title', 'ilike', `%${search}%`)
            .orWhere('deletion_reason', 'ilike', `%${search}%`);
        });
      }

      // Get logs with pagination
      const [logs, totalCount] = await Promise.all([
        query.orderBy('booking_expiration_logs.expired_at', 'desc').limit(limit).offset(offset),
        countQuery.count('* as count').first()
      ]);

      const total = parseInt(String(totalCount?.count || '0'));
      const totalPages = Math.ceil(total / limit);

      const response = {
        logs,
        pagination: {
          total,
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

  /**
   * Delete a specific expiration log
   */
  public deleteExpirationLog = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Only admin can delete expiration logs
      if (req.user.role !== 'admin') {
        return ResponseHelper.forbidden(res, 'Admin access required');
      }

      const { logId } = req.params;

      const { getDatabase } = await import('@/config/database');
      const knex = getDatabase();
      
      const deleted = await knex('booking_expiration_logs')
        .where('id', logId)
        .del();

      if (!deleted) {
        return ResponseHelper.notFound(res, 'Expiration log not found');
      }

      this.logAction('DELETE_EXPIRATION_LOG', req.user.id, undefined, { logId });
      
      return ResponseHelper.success(res, 'Expiration log deleted successfully', { logId });
    } catch (error) {
      logger.error('Error deleting expiration log:', error);
      return ResponseHelper.error(res, 'Failed to delete expiration log', 500);
    }
  });

  /**
   * Clear all expiration logs
   */
  public clearAllExpirationLogs = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Only admin can clear all expiration logs
      if (req.user.role !== 'admin') {
        return ResponseHelper.forbidden(res, 'Admin access required');
      }

      const { getDatabase } = await import('@/config/database');
      const knex = getDatabase();
      
      const deletedCount = await knex('booking_expiration_logs').del();

      this.logAction('CLEAR_ALL_EXPIRATION_LOGS', req.user.id, undefined, { deletedCount });
      
      return ResponseHelper.success(res, 'All expiration logs cleared successfully', { deletedCount });
    } catch (error) {
      logger.error('Error clearing all expiration logs:', error);
      return ResponseHelper.error(res, 'Failed to clear all expiration logs', 500);
    }
  });

  /**
   * Export expiration logs to CSV
   */
  public exportExpirationLogs = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Only admin can export expiration logs
      if (req.user.role !== 'admin') {
        return ResponseHelper.forbidden(res, 'Admin access required');
      }

      // Filter parameters
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const search = req.query.search as string;

      const { getDatabase } = await import('@/config/database');
      const knex = getDatabase();
      
      // Build query with filters
      let query = knex('booking_expiration_logs').select([
        'id',
        'booking_reference',
        'product_title',
        'booking_created_at',
        'booking_expires_at',
        'expiration_hours_used',
        'booking_status',
        'booking_amount',
        'deletion_reason',
        'expired_at',
        'expired_by'
      ]);

      // Apply filters
      if (startDate) {
        query = query.where('expired_at', '>=', startDate);
      }
      if (endDate) {
        query = query.where('expired_at', '<=', endDate);
      }
      if (search) {
        query = query.where(function() {
          this.where('booking_reference', 'ilike', `%${search}%`)
            .orWhere('product_title', 'ilike', `%${search}%`)
            .orWhere('deletion_reason', 'ilike', `%${search}%`);
        });
      }

      const logs = await query.orderBy('expired_at', 'desc');

      // Convert to CSV
      const headers = [
        'ID',
        'Booking Reference',
        'Product',
        'Booking Created',
        'Booking Expires',
        'Expiration Hours',
        'Status',
        'Amount',
        'Reason',
        'Expired At',
        'Expired By'
      ];

      const csvRows = [headers.join(',')];

      logs.forEach(log => {
        const row = [
          log.id,
          log.booking_reference || '',
          `"${(log.product_title || '').replace(/"/g, '""')}"`,
          log.booking_created_at ? new Date(log.booking_created_at).toISOString() : '',
          log.booking_expires_at ? new Date(log.booking_expires_at).toISOString() : '',
          log.expiration_hours_used || '',
          log.booking_status || '',
          log.booking_amount || '',
          `"${(log.deletion_reason || '').replace(/"/g, '""')}"`,
          new Date(log.expired_at).toISOString(),
          log.expired_by || ''
        ];
        csvRows.push(row.join(','));
      });

      const csv = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=booking-expiration-logs-${new Date().toISOString().split('T')[0]}.csv`);
      
      return res.send(csv);
    } catch (error) {
      logger.error('Error exporting expiration logs:', error);
      return ResponseHelper.error(res, 'Failed to export expiration logs', 500);
    }
  });
}

export default new BookingExpirationController();