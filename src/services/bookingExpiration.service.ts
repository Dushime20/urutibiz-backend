import { getDatabase } from '../config/database';
import logger from '../utils/logger';

export interface BookingExpirationSettings {
  booking_expiration_hours: number;
  booking_expiration_enabled: boolean;
  booking_expiration_last_run?: Date;
}

export interface ExpiredBooking {
  id: string;
  reference_number?: string;
  user_id?: string;
  product_title?: string;
  created_at: Date;
  expires_at: Date;
  status: string;
  total_amount?: number;
  booking_data: any;
}

export interface ExpirationResult {
  expired_count: number;
  processed_bookings: string[];
  errors: string[];
}

export class BookingExpirationService {
  /**
   * Get current booking expiration settings
   */
  static async getExpirationSettings(): Promise<BookingExpirationSettings> {
    try {
      const knex = getDatabase();
      const [hoursRecord, enabledRecord, lastRunRecord] = await Promise.all([
        knex('system_settings')
          .select('value')
          .where('key', 'booking_expiration_hours')
          .where('category', 'booking')
          .first(),
        knex('system_settings')
          .select('value')
          .where('key', 'booking_expiration_enabled')
          .where('category', 'booking')
          .first(),
        knex('system_settings')
          .select('booking_expiration_last_run')
          .where('key', 'booking_expiration_hours')
          .where('category', 'booking')
          .first()
      ]);

      return {
        booking_expiration_hours: parseInt(hoursRecord?.value || '4'),
        booking_expiration_enabled: enabledRecord?.value === 'true',
        booking_expiration_last_run: lastRunRecord?.booking_expiration_last_run
      };
    } catch (error) {
      logger.error('Error fetching booking expiration settings:', error);
      throw new Error('Failed to fetch booking expiration settings');
    }
  }

  /**
   * Update booking expiration settings
   */
  static async updateExpirationSettings(settings: Partial<BookingExpirationSettings>): Promise<void> {
    try {
      const knex = getDatabase();
      const updates = [];

      if (settings.booking_expiration_hours !== undefined) {
        updates.push(
          knex('system_settings')
            .where('key', 'booking_expiration_hours')
            .where('category', 'booking')
            .update({
              value: settings.booking_expiration_hours.toString(),
              updated_at: knex.fn.now()
            })
        );
      }

      if (settings.booking_expiration_enabled !== undefined) {
        updates.push(
          knex('system_settings')
            .where('key', 'booking_expiration_enabled')
            .where('category', 'booking')
            .update({
              value: settings.booking_expiration_enabled.toString(),
              updated_at: knex.fn.now()
            })
        );
      }

      await Promise.all(updates);

      logger.info('Booking expiration settings updated:', settings);
    } catch (error) {
      logger.error('Error updating booking expiration settings:', error);
      throw new Error('Failed to update booking expiration settings');
    }
  }

  /**
   * Set expiration time for a booking when it's created
   */
  static async setBookingExpiration(bookingId: string): Promise<void> {
    try {
      const settings = await this.getExpirationSettings();
      
      if (!settings.booking_expiration_enabled) {
        return;
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + settings.booking_expiration_hours);

      const knex = getDatabase();
      await knex('bookings')
        .where('id', bookingId)
        .update({
          expires_at: expiresAt,
          updated_at: knex.fn.now()
        });

      logger.info(`Set expiration for booking ${bookingId} to ${expiresAt.toISOString()}`);
    } catch (error) {
      logger.error(`Error setting expiration for booking ${bookingId}:`, error);
      throw new Error('Failed to set booking expiration');
    }
  }

  /**
   * Find bookings that have expired and should be deleted
   */
  static async findExpiredBookings(): Promise<ExpiredBooking[]> {
    try {
      const now = new Date();
      
      const knex = getDatabase();
      const expiredBookings = await knex('bookings')
        .select([
          'bookings.id',
          'bookings.reference_number',
          'bookings.user_id',
          'bookings.status',
          'bookings.total_amount',
          'bookings.created_at',
          'bookings.expires_at',
          'products.title as product_title'
        ])
        .leftJoin('products', 'bookings.product_id', 'products.id')
        .where('bookings.expires_at', '<=', now)
        .where('bookings.is_expired', false)
        .where('bookings.status', 'confirmed') // Only confirmed but unpaid bookings
        .whereNotIn('bookings.status', ['completed', 'paid', 'active', 'checked_in', 'checked_out']);

      return expiredBookings.map(booking => ({
        ...booking,
        booking_data: booking // Store full booking data for logging
      }));
    } catch (error) {
      logger.error('Error finding expired bookings:', error);
      throw new Error('Failed to find expired bookings');
    }
  }

  /**
   * Log booking expiration for auditing
   */
  static async logBookingExpiration(booking: ExpiredBooking, reason: string = 'Automatic expiration'): Promise<void> {
    try {
      const settings = await this.getExpirationSettings();

      const knex = getDatabase();
      await knex('booking_expiration_logs').insert({
        booking_id: booking.id,
        booking_reference: booking.reference_number,
        user_id: booking.user_id,
        product_title: booking.product_title,
        booking_created_at: booking.created_at,
        booking_expires_at: booking.expires_at,
        expiration_hours_used: settings.booking_expiration_hours,
        booking_status: booking.status,
        booking_amount: booking.total_amount,
        deletion_reason: reason,
        booking_data: booking.booking_data,
        expired_at: knex.fn.now(),
        expired_by: 'system'
      });

      logger.info(`Logged expiration for booking ${booking.id}`);
    } catch (error) {
      logger.error(`Error logging expiration for booking ${booking.id}:`, error);
      // Don't throw here - logging failure shouldn't stop the expiration process
    }
  }

  /**
   * Mark booking as expired (soft delete approach)
   */
  static async markBookingAsExpired(bookingId: string): Promise<void> {
    try {
      const knex = getDatabase();
      await knex('bookings')
        .where('id', bookingId)
        .update({
          is_expired: true,
          expired_at: knex.fn.now(),
          status: 'expired',
          updated_at: knex.fn.now()
        });

      logger.info(`Marked booking ${bookingId} as expired`);
    } catch (error) {
      logger.error(`Error marking booking ${bookingId} as expired:`, error);
      throw new Error('Failed to mark booking as expired');
    }
  }

  /**
   * Hard delete expired booking from database
   */
  static async deleteExpiredBooking(bookingId: string): Promise<void> {
    try {
      const knex = getDatabase();
      // Delete related records first (if any)
      await knex('booking_items').where('booking_id', bookingId).del();
      await knex('booking_payments').where('booking_id', bookingId).del();
      
      // Delete the booking
      await knex('bookings').where('id', bookingId).del();

      logger.info(`Hard deleted expired booking ${bookingId}`);
    } catch (error) {
      logger.error(`Error deleting expired booking ${bookingId}:`, error);
      throw new Error('Failed to delete expired booking');
    }
  }

  /**
   * Free up reserved stock/availability when booking expires
   */
  static async freeReservedStock(booking: ExpiredBooking): Promise<void> {
    try {
      // If the booking had reserved product availability, free it up
      if (booking.booking_data?.product_id && booking.booking_data?.start_date && booking.booking_data?.end_date) {
        const knex = getDatabase();
        await knex('product_availability')
          .where('product_id', booking.booking_data.product_id)
          .where('booking_id', booking.id)
          .where('availability_type', 'reserved')
          .del();

        logger.info(`Freed reserved stock for expired booking ${booking.id}`);
      }
    } catch (error) {
      logger.error(`Error freeing reserved stock for booking ${booking.id}:`, error);
      // Don't throw - stock freeing failure shouldn't stop the expiration process
    }
  }

  /**
   * Process expired bookings - main cleanup function
   */
  static async processExpiredBookings(): Promise<ExpirationResult> {
    const result: ExpirationResult = {
      expired_count: 0,
      processed_bookings: [],
      errors: []
    };

    try {
      const settings = await this.getExpirationSettings();
      
      if (!settings.booking_expiration_enabled) {
        logger.info('Booking expiration is disabled, skipping cleanup');
        return result;
      }

      const expiredBookings = await this.findExpiredBookings();
      
      if (expiredBookings.length === 0) {
        logger.info('No expired bookings found');
        await this.updateLastRunTime();
        return result;
      }

      logger.info(`Found ${expiredBookings.length} expired bookings to process`);

      for (const booking of expiredBookings) {
        try {
          // Log the expiration for auditing
          await this.logBookingExpiration(booking);

          // Free up any reserved stock
          await this.freeReservedStock(booking);

          // Hard delete the booking (or mark as expired based on preference)
          await this.deleteExpiredBooking(booking.id);
          // Alternative: await this.markBookingAsExpired(booking.id);

          result.expired_count++;
          result.processed_bookings.push(booking.id);

          logger.info(`Successfully processed expired booking ${booking.id}`);
        } catch (error) {
          const errorMsg = `Failed to process expired booking ${booking.id}: ${error instanceof Error ? error.message : String(error)}`;
          logger.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      // Update last run time
      await this.updateLastRunTime();

      logger.info(`Booking expiration cleanup completed. Processed: ${result.expired_count}, Errors: ${result.errors.length}`);
      
      return result;
    } catch (error) {
      logger.error('Error in booking expiration cleanup:', error);
      result.errors.push(`Cleanup process failed: ${error instanceof Error ? error.message : String(error)}`);
      return result;
    }
  }

  /**
   * Update the last run timestamp
   */
  private static async updateLastRunTime(): Promise<void> {
    try {
      const knex = getDatabase();
      await knex('system_settings')
        .where('key', 'booking_expiration_hours')
        .where('category', 'booking')
        .update({
          booking_expiration_last_run: knex.fn.now(),
          updated_at: knex.fn.now()
        });
    } catch (error) {
      logger.error('Error updating last run time:', error);
    }
  }

  /**
   * Get expiration statistics for admin dashboard
   */
  static async getExpirationStats(): Promise<any> {
    try {
      const knex = getDatabase();
      const [totalExpired, recentExpired, upcomingExpired] = await Promise.all([
        // Total expired bookings (from logs)
        knex('booking_expiration_logs').count('* as count').first(),
        
        // Recently expired (last 24 hours)
        knex('booking_expiration_logs')
          .count('* as count')
          .where('expired_at', '>=', knex.raw("NOW() - INTERVAL '24 hours'"))
          .first(),
        
        // Bookings expiring in next 2 hours
        knex('bookings')
          .count('* as count')
          .where('expires_at', '<=', knex.raw("NOW() + INTERVAL '2 hours'"))
          .where('expires_at', '>', knex.fn.now())
          .where('is_expired', false)
          .where('status', 'confirmed')
          .first()
      ]);

      return {
        total_expired: parseInt((totalExpired?.count as string) || '0'),
        recent_expired: parseInt((recentExpired?.count as string) || '0'),
        upcoming_expired: parseInt((upcomingExpired?.count as string) || '0')
      };
    } catch (error) {
      logger.error('Error fetching expiration stats:', error);
      return {
        total_expired: 0,
        recent_expired: 0,
        upcoming_expired: 0
      };
    }
  }
}