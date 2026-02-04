import { getDatabase } from '../config/database';
import logger from '../utils/logger';
import NotificationEngine from './notification/NotificationEngine';
import { NotificationType, NotificationPriority, NotificationChannel } from './notification/types';
import { sendEmail } from '../utils/email';
import { sendSMS } from '../utils/sms';

export interface BookingExpirationSettings {
  booking_expiration_hours: number;
  booking_expiration_enabled: boolean;
  booking_expiration_last_run?: Date;
}

export interface ExpiredBooking {
  id: string;
  booking_number?: string;
  renter_id?: string;
  owner_id?: string;
  product_title?: string;
  created_at: Date;
  expires_at: Date;
  status: string;
  payment_status?: string;
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
        booking_expiration_hours: parseInt(hoursRecord?.value || '2'),
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
   * Set expiration time for a booking when it's confirmed
   * Uses confirmed_at timestamp as the base, or current time if not set
   */
  static async setBookingExpiration(bookingId: string): Promise<void> {
    try {
      const settings = await this.getExpirationSettings();
      
      if (!settings.booking_expiration_enabled) {
        return;
      }

      const knex = getDatabase();
      
      // Get the booking to check owner confirmation status
      const booking = await knex('bookings')
        .select('confirmed_at', 'status', 'owner_confirmed', 'owner_confirmation_status', 'owner_confirmed_at')
        .where('id', bookingId)
        .first();

      if (!booking) {
        throw new Error(`Booking ${bookingId} not found`);
      }

      // Only set expiration for owner-confirmed bookings
      if (!booking.owner_confirmed || booking.owner_confirmation_status !== 'confirmed' || !booking.owner_confirmed_at) {
        logger.info(`Booking ${bookingId} is not owner-confirmed yet, skipping expiration setup`);
        return;
      }

      // Calculate expiration from owner_confirmed_at timestamp
      const baseTime = new Date(booking.owner_confirmed_at);
      const expiresAt = new Date(baseTime);
      expiresAt.setHours(expiresAt.getHours() + settings.booking_expiration_hours);

      await knex('bookings')
        .where('id', bookingId)
        .update({
          expires_at: expiresAt,
          updated_at: knex.fn.now()
        });

      logger.info(`Set expiration for booking ${bookingId} to ${expiresAt.toISOString()} (base time: ${baseTime.toISOString()})`);
    } catch (error) {
      logger.error(`Error setting expiration for booking ${bookingId}:`, error);
      throw new Error('Failed to set booking expiration');
    }
  }

  /**
   * Find bookings that have expired and should be deleted
   * Looks for bookings that have confirmed_at timestamp (regardless of status)
   * and where payment is still pending/failed
   */
  static async findExpiredBookings(): Promise<ExpiredBooking[]> {
    try {
      const now = new Date();
      
      const knex = getDatabase();
      const expiredBookings = await knex('bookings')
        .select([
          'bookings.id',
          'bookings.booking_number',
          'bookings.renter_id',
          'bookings.owner_id',
          'bookings.status',
          'bookings.payment_status',
          'bookings.total_amount',
          'bookings.created_at',
          'bookings.expires_at',
          'bookings.confirmed_at',
          'bookings.owner_confirmed_at',
          'products.title as product_title'
        ])
        .leftJoin('products', 'bookings.product_id', 'products.id')
        .where('bookings.expires_at', '<=', now)
        .where('bookings.is_expired', false)
        .where('bookings.owner_confirmed', true) // Owner has confirmed
        .where('bookings.owner_confirmation_status', 'confirmed') // Confirmation status is confirmed
        .whereNotNull('bookings.owner_confirmed_at') // Has owner_confirmed_at timestamp
        .whereIn('bookings.payment_status', ['pending', 'failed']); // Only unpaid bookings

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
        booking_reference: booking.booking_number,
        user_id: booking.renter_id, // Use renter_id as the user who made the booking
        renter_id: booking.renter_id,
        owner_id: booking.owner_id,
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
   * Send notifications to renter when booking expires
   * Sends: Email, In-App Notification, and SMS
   */
  static async notifyRenterOfExpiration(booking: ExpiredBooking): Promise<void> {
    try {
      if (!booking.renter_id) {
        logger.warn(`No renter_id found for booking ${booking.id}, skipping notifications`);
        return;
      }

      const knex = getDatabase();
      
      // Get renter details
      const renter = await knex('users')
        .select('id', 'email', 'phone', 'first_name', 'last_name', 'full_name')
        .where('id', booking.renter_id)
        .first();

      if (!renter) {
        logger.warn(`Renter ${booking.renter_id} not found for booking ${booking.id}`);
        return;
      }

      const renterName = renter.full_name || `${renter.first_name || ''} ${renter.last_name || ''}`.trim() || 'Valued Customer';
      const bookingNumber = booking.booking_number || booking.id;
      const productTitle = booking.product_title || 'Product';

      // 1. Send In-App Notification
      try {
        await NotificationEngine.sendNotification({
          type: NotificationType.BOOKING_EXPIRED,
          recipientId: booking.renter_id,
          recipientEmail: renter.email,
          recipientPhone: renter.phone,
          priority: NotificationPriority.HIGH,
          title: 'Booking Expired',
          message: `Your booking #${bookingNumber} for "${productTitle}" has expired due to non-payment. Please create a new booking if you still wish to rent this item.`,
          data: {
            booking_id: booking.id,
            booking_number: bookingNumber,
            product_title: productTitle,
            expired_at: new Date().toISOString(),
            total_amount: booking.total_amount
          },
          metadata: {
            action_url: `/my-account/bookings/${booking.id}`
          },
          channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH]
        });
        logger.info(`Sent in-app notification to renter ${booking.renter_id} for expired booking ${booking.id}`);
      } catch (error) {
        logger.error(`Failed to send in-app notification for booking ${booking.id}:`, error);
      }

      // 2. Send Email Notification
      if (renter.email) {
        try {
          await sendEmail({
            to: renter.email,
            subject: `Booking Expired - #${bookingNumber}`,
            template: 'booking-expired',
            data: {
              renterName,
              bookingNumber,
              productTitle,
              totalAmount: booking.total_amount,
              expiresAt: booking.expires_at,
              expiredAt: new Date().toISOString(),
              bookingUrl: `${process.env.FRONTEND_URL}/my-account/bookings/${booking.id}`,
              supportEmail: process.env.SUPPORT_EMAIL || 'support@urutibiz.com'
            }
          });
          logger.info(`Sent email notification to ${renter.email} for expired booking ${booking.id}`);
        } catch (error) {
          logger.error(`Failed to send email notification for booking ${booking.id}:`, error);
        }
      }

      // 3. Send SMS Notification
      if (renter.phone) {
        try {
          const smsMessage = `UrutiBiz: Your booking #${bookingNumber} for "${productTitle}" has expired due to non-payment. Please create a new booking if you still wish to rent this item. Visit: ${process.env.FRONTEND_URL}/my-account/bookings`;
          
          await sendSMS({
            to: renter.phone,
            message: smsMessage
          });
          logger.info(`Sent SMS notification to ${renter.phone} for expired booking ${booking.id}`);
        } catch (error) {
          logger.error(`Failed to send SMS notification for booking ${booking.id}:`, error);
        }
      }

      logger.info(`Successfully sent all notifications to renter ${booking.renter_id} for expired booking ${booking.id}`);
    } catch (error) {
      logger.error(`Error sending notifications for expired booking ${booking.id}:`, error);
      // Don't throw - notification failure shouldn't stop the expiration process
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

          // Mark booking as expired (soft delete - keeps data for reference)
          await this.markBookingAsExpired(booking.id);

          // Send notifications to renter (email, in-app, SMS)
          await this.notifyRenterOfExpiration(booking);

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
          .where('owner_confirmed', true) // Owner has confirmed
          .where('owner_confirmation_status', 'confirmed') // Confirmation status is confirmed
          .whereNotNull('owner_confirmed_at') // Has owner_confirmed_at timestamp
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