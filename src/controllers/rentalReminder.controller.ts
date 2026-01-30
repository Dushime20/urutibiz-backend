import { Response } from 'express';
import { BaseController } from './BaseController';
import RentalReminderService from '@/services/rentalReminder.service';
import RentalReminderCronService from '@/services/rentalReminderCron.service';
import { AuthenticatedRequest } from '@/types';
import { ResponseHelper } from '@/utils/response';
import logger from '@/utils/logger';
import { getDatabase } from '@/config/database';

/**
 * Rental Reminder Management Controller
 * 
 * Handles admin management and monitoring of rental return reminders
 */
export class RentalReminderController extends BaseController {
  
  /**
   * Get reminder configurations
   */
  public getReminderConfigurations = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Only admin can access reminder configurations
      if (req.user.role !== 'admin') {
        return ResponseHelper.forbidden(res, 'Admin access required');
      }

      const knex = getDatabase();
      const configurations = await knex('reminder_configurations')
        .select('*')
        .orderBy('hours_before', 'desc');
      
      return ResponseHelper.success(res, 'Reminder configurations retrieved successfully', configurations);
    } catch (error) {
      logger.error('Error fetching reminder configurations:', error);
      return ResponseHelper.error(res, 'Failed to fetch reminder configurations', error, 500);
    }
  });

  /**
   * Update reminder configuration
   */
  public updateReminderConfiguration = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Only admin can update reminder configurations
      if (req.user.role !== 'admin') {
        return ResponseHelper.forbidden(res, 'Admin access required');
      }

      const { id } = req.params;
      const { enabled, email_template, sms_template, in_app_template } = req.body;

      const knex = getDatabase();
      const updateData: any = {
        updated_at: knex.fn.now()
      };

      if (enabled !== undefined) updateData.enabled = enabled;
      if (email_template !== undefined) updateData.email_template = email_template;
      if (sms_template !== undefined) updateData.sms_template = sms_template;
      if (in_app_template !== undefined) updateData.in_app_template = in_app_template;

      const [updatedConfig] = await knex('reminder_configurations')
        .where('id', id)
        .update(updateData)
        .returning('*');

      if (!updatedConfig) {
        return ResponseHelper.notFound(res, 'Reminder configuration not found');
      }

      this.logAction('UPDATE_REMINDER_CONFIGURATION', req.user.id, id, updateData);
      
      return ResponseHelper.success(res, 'Reminder configuration updated successfully', updatedConfig);
    } catch (error) {
      logger.error('Error updating reminder configuration:', error);
      return ResponseHelper.error(res, 'Failed to update reminder configuration', error, 500);
    }
  });

  /**
   * Get reminder statistics for admin dashboard
   */
  public getReminderStats = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Only admin can access reminder stats
      if (req.user.role !== 'admin') {
        return ResponseHelper.forbidden(res, 'Admin access required');
      }

      const stats = await RentalReminderService.getReminderStats();
      
      return ResponseHelper.success(res, 'Reminder statistics retrieved successfully', stats);
    } catch (error) {
      logger.error('Error fetching reminder stats:', error);
      return ResponseHelper.error(res, 'Failed to fetch reminder statistics', error, 500);
    }
  });

  /**
   * Manually trigger reminder processing (Admin only)
   */
  public triggerReminderProcessing = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Only admin can trigger manual processing
      if (req.user.role !== 'admin') {
        return ResponseHelper.forbidden(res, 'Admin access required');
      }

      logger.info(`Manual reminder processing triggered by admin: ${req.user.id}`);
      
      const result = await RentalReminderCronService.triggerManualProcessing();
      
      this.logAction('TRIGGER_REMINDER_PROCESSING', req.user.id, undefined, result);
      
      return ResponseHelper.success(res, 'Reminder processing completed successfully', result);
    } catch (error) {
      logger.error('Error triggering reminder processing:', error);
      return ResponseHelper.error(res, 'Failed to trigger reminder processing', error, 500);
    }
  });

  /**
   * Get reminder logs for auditing
   */
  public getReminderLogs = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Only admin can access reminder logs
      if (req.user.role !== 'admin') {
        return ResponseHelper.forbidden(res, 'Admin access required');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = (page - 1) * limit;
      const status = req.query.status as string;
      const channel = req.query.channel as string;
      const reminderType = req.query.reminder_type as string;

      const knex = getDatabase();
      let query = knex('rental_reminder_logs')
        .select([
          'rental_reminder_logs.*',
          'bookings.booking_number',
          'products.title as product_name',
          'users.first_name',
          'users.last_name',
          'users.email'
        ])
        .leftJoin('bookings', 'rental_reminder_logs.booking_id', 'bookings.id')
        .leftJoin('products', 'bookings.product_id', 'products.id')
        .leftJoin('users', 'bookings.renter_id', 'users.id')
        .orderBy('rental_reminder_logs.created_at', 'desc');

      if (status) query = query.where('rental_reminder_logs.status', status);
      if (channel) query = query.where('rental_reminder_logs.channel', channel);
      if (reminderType) query = query.where('rental_reminder_logs.reminder_type', reminderType);

      const [logs, totalCount] = await Promise.all([
        query.clone().limit(limit).offset(offset),
        query.clone().count('* as count').first()
      ]);

      const totalPages = Math.ceil(parseInt((totalCount?.count as string) || '0') / limit);

      const response = {
        data: logs,
        meta: {
          total: parseInt((totalCount?.count as string) || '0'),
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
      
      return ResponseHelper.success(res, 'Reminder logs retrieved successfully', response);
    } catch (error) {
      logger.error('Error fetching reminder logs:', error);
      return ResponseHelper.error(res, 'Failed to fetch reminder logs', error, 500);
    }
  });

  /**
   * Get cron job status
   */
  public getCronStatus = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Only admin can access cron status
      if (req.user.role !== 'admin') {
        return ResponseHelper.forbidden(res, 'Admin access required');
      }

      const status = RentalReminderCronService.getStatus();
      const nextRuns = RentalReminderCronService.getNextRuns(5);
      
      return ResponseHelper.success(res, 'Cron status retrieved successfully', { ...status, nextRuns });
    } catch (error) {
      logger.error('Error fetching cron status:', error);
      return ResponseHelper.error(res, 'Failed to fetch cron status', error, 500);
    }
  });

  /**
   * Cancel pending reminders for a booking
   */
  public cancelBookingReminders = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bookingId } = req.params;
      const { reason } = req.body;

      // Check if user has access to this booking
      const knex = getDatabase();
      const booking = await knex('bookings')
        .where('id', bookingId)
        .first();

      if (!booking) {
        return ResponseHelper.notFound(res, 'Booking not found');
      }

      // Allow admin or booking owner/renter to cancel reminders
      if (req.user.role !== 'admin' && booking.renter_id !== req.user.id && booking.owner_id !== req.user.id) {
        return ResponseHelper.forbidden(res, 'Not authorized to cancel reminders for this booking');
      }

      await RentalReminderService.cancelPendingReminders(bookingId, reason || 'Cancelled by user');
      
      this.logAction('CANCEL_BOOKING_REMINDERS', req.user.id, bookingId, { reason });
      
      return ResponseHelper.success(res, 'Booking reminders cancelled successfully', { bookingId });
    } catch (error) {
      logger.error('Error cancelling booking reminders:', error);
      return ResponseHelper.error(res, 'Failed to cancel booking reminders', error, 500);
    }
  });

  /**
   * Reset reminder schedule for a booking
   */
  public resetBookingReminderSchedule = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bookingId } = req.params;

      // Check if user has access to this booking
      const knex = getDatabase();
      const booking = await knex('bookings')
        .where('id', bookingId)
        .first();

      if (!booking) {
        return ResponseHelper.notFound(res, 'Booking not found');
      }

      // Allow admin or booking owner/renter to reset schedule
      if (req.user.role !== 'admin' && booking.renter_id !== req.user.id && booking.owner_id !== req.user.id) {
        return ResponseHelper.forbidden(res, 'Not authorized to reset reminder schedule for this booking');
      }

      await RentalReminderService.resetReminderSchedule(bookingId);
      
      this.logAction('RESET_REMINDER_SCHEDULE', req.user.id, bookingId);
      
      return ResponseHelper.success(res, 'Reminder schedule reset successfully', { bookingId });
    } catch (error) {
      logger.error('Error resetting reminder schedule:', error);
      return ResponseHelper.error(res, 'Failed to reset reminder schedule', error, 500);
    }
  });

  /**
   * Mark booking as returned early
   */
  public markBookingReturnedEarly = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bookingId } = req.params;
      const { actualReturnDate } = req.body;

      // Check if user has access to this booking
      const knex = getDatabase();
      const booking = await knex('bookings')
        .where('id', bookingId)
        .first();

      if (!booking) {
        return ResponseHelper.notFound(res, 'Booking not found');
      }

      // Allow admin or booking owner/renter to mark as returned
      if (req.user.role !== 'admin' && booking.renter_id !== req.user.id && booking.owner_id !== req.user.id) {
        return ResponseHelper.forbidden(res, 'Not authorized to mark this booking as returned');
      }

      const returnDate = actualReturnDate ? new Date(actualReturnDate) : new Date();
      await RentalReminderService.markBookingReturnedEarly(bookingId, returnDate);
      
      this.logAction('MARK_BOOKING_RETURNED_EARLY', req.user.id, bookingId, { actualReturnDate: returnDate });
      
      return ResponseHelper.success(res, 'Booking marked as returned early successfully', { bookingId, actualReturnDate: returnDate });
    } catch (error) {
      logger.error('Error marking booking as returned early:', error);
      return ResponseHelper.error(res, 'Failed to mark booking as returned early', error, 500);
    }
  });

  /**
   * Get eligible bookings for reminders (for testing/debugging)
   */
  public getEligibleBookings = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Only admin can access this endpoint
      if (req.user.role !== 'admin') {
        return ResponseHelper.forbidden(res, 'Admin access required');
      }

      const bookings = await RentalReminderService.getEligibleBookings();
      
      return ResponseHelper.success(res, 'Eligible bookings retrieved successfully', bookings);
    } catch (error) {
      logger.error('Error fetching eligible bookings:', error);
      return ResponseHelper.error(res, 'Failed to fetch eligible bookings', error, 500);
    }
  });
}

export default new RentalReminderController();