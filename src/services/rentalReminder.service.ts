import { getDatabase } from '../config/database';
import logger from '../utils/logger';
import NotificationEngine from './notification/NotificationEngine';
import { NotificationType, NotificationPriority, NotificationChannel } from './notification/types';
import Handlebars from 'handlebars';

export interface ReminderConfiguration {
  id: string;
  name: string;
  hours_before: number;
  enabled: boolean;
  email_template: string;
  sms_template: string;
  in_app_template: string;
}

export interface RentalBooking {
  id: string;
  booking_reference: string;
  product_id: string;
  product_name: string;
  renter_id: string;
  renter_name: string;
  renter_email: string;
  renter_phone: string;
  return_date: Date;
  return_location?: string;
  status: string;
  reminders_enabled: boolean;
  returned_early: boolean;
  actual_return_date?: Date;
}

export interface ReminderLog {
  id: string;
  booking_id: string;
  reminder_type: string;
  channel: 'email' | 'sms' | 'in_app';
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  scheduled_at: Date;
  sent_at?: Date;
  recipient?: string;
  message_content?: string;
  error_message?: string;
  metadata?: any;
}

export class RentalReminderService {
  private notificationEngine: typeof NotificationEngine;

  constructor() {
    this.notificationEngine = NotificationEngine;
  }

  /**
   * Get all active reminder configurations
   */
  async getReminderConfigurations(): Promise<ReminderConfiguration[]> {
    try {
      const knex = getDatabase();
      const configs = await knex('reminder_configurations')
        .where('enabled', true)
        .orderBy('hours_before', 'desc');
      
      return configs;
    } catch (error) {
      logger.error('Error fetching reminder configurations:', error);
      throw new Error('Failed to fetch reminder configurations');
    }
  }

  /**
   * Get all eligible bookings for reminders
   */
  async getEligibleBookings(): Promise<RentalBooking[]> {
    try {
      const knex = getDatabase();
      const bookings = await knex('bookings')
        .select([
          'bookings.id',
          'bookings.booking_number as booking_reference',
          'bookings.product_id',
          'bookings.renter_id',
          'bookings.return_date',
          'bookings.return_location',
          'bookings.status',
          'bookings.reminders_enabled',
          'bookings.returned_early',
          'bookings.actual_return_date',
          'products.title as product_name',
          'users.first_name',
          'users.last_name',
          'users.email as renter_email',
          'users.phone as renter_phone'
        ])
        .leftJoin('products', 'bookings.product_id', 'products.id')
        .leftJoin('users', 'bookings.renter_id', 'users.id')
        .whereIn('bookings.status', ['confirmed', 'in_progress']) // Valid enum values: confirmed or in_progress
        .where('bookings.reminders_enabled', true)
        .where('bookings.returned_early', false)
        .whereNull('bookings.actual_return_date')
        .whereNotNull('bookings.return_date')
        .where('bookings.return_date', '>', knex.fn.now());

      return bookings.map(booking => ({
        ...booking,
        renter_name: `${booking.first_name} ${booking.last_name}`.trim(),
        return_date: new Date(booking.return_date)
      }));
    } catch (error) {
      logger.error('Error fetching eligible bookings:', error);
      throw new Error('Failed to fetch eligible bookings');
    }
  }

  /**
   * Calculate which reminders should be sent for a booking
   */
  async calculateDueReminders(booking: RentalBooking, configurations: ReminderConfiguration[]): Promise<{ config: ReminderConfiguration; scheduledAt: Date }[]> {
    const now = new Date();
    const returnDate = new Date(booking.return_date);
    const dueReminders: { config: ReminderConfiguration; scheduledAt: Date }[] = [];

    for (const config of configurations) {
      const reminderTime = new Date(returnDate.getTime() - (config.hours_before * 60 * 60 * 1000));
      
      // Check if reminder time has passed or is within the next 30 minutes (processing window)
      const timeDiff = reminderTime.getTime() - now.getTime();
      const isWithinWindow = timeDiff <= 30 * 60 * 1000 && timeDiff >= -15 * 60 * 1000; // 30 min future, 15 min past
      
      if (isWithinWindow) {
        // Check if this reminder has already been sent
        const knex = getDatabase();
        const existingLog = await knex('rental_reminder_logs')
          .where('booking_id', booking.id)
          .where('reminder_type', config.name)
          .whereIn('status', ['sent', 'pending'])
          .first();

        if (!existingLog) {
          dueReminders.push({
            config,
            scheduledAt: reminderTime
          });
        }
      }
    }

    return dueReminders;
  }

  /**
   * Process all due reminders
   */
  async processReminders(): Promise<{ processed: number; errors: string[] }> {
    const result: { processed: number; errors: string[] } = { processed: 0, errors: [] };

    try {
      logger.info('Starting rental reminder processing...');

      const [configurations, bookings] = await Promise.all([
        this.getReminderConfigurations(),
        this.getEligibleBookings()
      ]);

      logger.info(`Found ${bookings.length} eligible bookings and ${configurations.length} reminder configurations`);

      for (const booking of bookings) {
        try {
          const dueReminders = await this.calculateDueReminders(booking, configurations);
          
          for (const { config, scheduledAt } of dueReminders) {
            await this.sendReminderForAllChannels(booking, config, scheduledAt);
            result.processed++;
          }
        } catch (error) {
          const errorMsg = `Error processing reminders for booking ${booking.id}: ${error instanceof Error ? error.message : String(error)}`;
          logger.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      logger.info(`Rental reminder processing completed. Processed: ${result.processed}, Errors: ${result.errors.length}`);
      return result;
    } catch (error) {
      logger.error('Error in rental reminder processing:', error);
      result.errors.push(`Processing failed: ${error instanceof Error ? error.message : String(error)}`);
      return result;
    }
  }

  /**
   * Send reminder across all channels (email, SMS, in-app)
   */
  private async sendReminderForAllChannels(booking: RentalBooking, config: ReminderConfiguration, scheduledAt: Date): Promise<void> {
    const channels: Array<'email' | 'sms' | 'in_app'> = ['email', 'sms', 'in_app'];
    
    // Create template variables
    const templateVars = {
      renter_name: booking.renter_name,
      product_name: booking.product_name,
      booking_reference: booking.booking_reference,
      return_date: booking.return_date.toLocaleDateString(),
      return_time: booking.return_date.toLocaleTimeString(),
      return_location: booking.return_location
    };

    for (const channel of channels) {
      try {
        await this.sendReminderForChannel(booking, config, channel, scheduledAt, templateVars);
      } catch (error) {
        logger.error(`Error sending ${channel} reminder for booking ${booking.id}:`, error);
        // Continue with other channels even if one fails
      }
    }
  }

  /**
   * Send reminder for a specific channel
   */
  private async sendReminderForChannel(
    booking: RentalBooking,
    config: ReminderConfiguration,
    channel: 'email' | 'sms' | 'in_app',
    scheduledAt: Date,
    templateVars: any
  ): Promise<void> {
    // Create reminder log entry
    const logId = await this.createReminderLog(booking, config, channel, scheduledAt, templateVars);

    try {
      let message: string;
      let recipient: string;

      // Get template and recipient based on channel
      switch (channel) {
        case 'email':
          message = this.renderTemplate(config.email_template, templateVars);
          recipient = booking.renter_email;
          break;
        case 'sms':
          message = this.renderTemplate(config.sms_template, templateVars);
          recipient = booking.renter_phone;
          break;
        case 'in_app':
          message = this.renderTemplate(config.in_app_template, templateVars);
          recipient = booking.renter_id;
          break;
      }

      // Validate recipient
      if (!recipient) {
        throw new Error(`No ${channel} recipient available for booking ${booking.id}`);
      }

      // Send notification based on channel
      await this.sendNotification(channel, recipient, message, booking, config);

      // Update log as sent
      await this.updateReminderLog(logId, 'sent', message, recipient);

      logger.info(`${channel} reminder sent successfully for booking ${booking.id}, reminder type ${config.name}`);
    } catch (error) {
      // Update log as failed
      await this.updateReminderLog(logId, 'failed', undefined, undefined, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Render template with variables
   */
  private renderTemplate(template: string, variables: any): string {
    try {
      const compiledTemplate = Handlebars.compile(template);
      return compiledTemplate(variables);
    } catch (error) {
      logger.error('Error rendering template:', error);
      return template; // Return original template if rendering fails
    }
  }

  /**
   * Send notification via appropriate channel
   */
  private async sendNotification(
    channel: 'email' | 'sms' | 'in_app',
    recipient: string,
    message: string,
    booking: RentalBooking,
    config: ReminderConfiguration
  ): Promise<void> {
    const title = `Rental Return Reminder - ${config.name.replace('_', ' ').toUpperCase()}`;

    const payload: any = {
      type: NotificationType.RENTAL_REMINDER,
      recipientId: booking.renter_id,
      title,
      message,
      priority: this.getReminderPriority(config.name),
      channels: [channel === 'email' ? NotificationChannel.EMAIL : 
                channel === 'sms' ? NotificationChannel.SMS : 
                NotificationChannel.IN_APP],
      data: {
        booking_id: booking.id,
        booking_reference: booking.booking_reference,
        return_date: booking.return_date.toISOString(),
        reminder_type: config.name
      }
    };

    switch (channel) {
      case 'email':
        payload.recipientEmail = recipient;
        break;
      case 'sms':
        // Only send SMS if phone is verified
        const knex = getDatabase();
        const user = await knex('users').where('id', booking.renter_id).first();
        if (!user?.phone_verified) {
          throw new Error('Phone number not verified');
        }
        payload.recipientPhone = recipient;
        break;
      case 'in_app':
        // recipientId is already set
        break;
    }

    await this.notificationEngine.sendNotification(payload);
  }

  /**
   * Get notification priority based on reminder type
   */
  private getReminderPriority(reminderType: string): NotificationPriority {
    switch (reminderType) {
      case 'same_day':
        return NotificationPriority.HIGH;
      case '6h_before':
        return NotificationPriority.MEDIUM;
      case '24h_before':
        return NotificationPriority.LOW;
      default:
        return NotificationPriority.MEDIUM;
    }
  }

  /**
   * Create reminder log entry
   */
  private async createReminderLog(
    booking: RentalBooking,
    config: ReminderConfiguration,
    channel: 'email' | 'sms' | 'in_app',
    scheduledAt: Date,
    templateVars: any
  ): Promise<string> {
    const knex = getDatabase();
    const [logEntry] = await knex('rental_reminder_logs')
      .insert({
        booking_id: booking.id,
        reminder_type: config.name,
        channel: channel,
        status: 'pending',
        scheduled_at: scheduledAt,
        metadata: {
          template_vars: templateVars,
          config_id: config.id
        }
      })
      .returning('id');

    return logEntry.id;
  }

  /**
   * Update reminder log entry
   */
  private async updateReminderLog(
    logId: string,
    status: 'sent' | 'failed' | 'cancelled',
    messageContent?: string,
    recipient?: string,
    errorMessage?: string
  ): Promise<void> {
    const knex = getDatabase();
    const updateData: any = {
      status,
      updated_at: knex.fn.now()
    };

    if (status === 'sent') {
      updateData.sent_at = knex.fn.now();
      updateData.message_content = messageContent;
      updateData.recipient = recipient;
    } else if (status === 'failed') {
      updateData.error_message = errorMessage;
    }

    await knex('rental_reminder_logs')
      .where('id', logId)
      .update(updateData);
  }

  /**
   * Cancel pending reminders for a booking (when returned early or cancelled)
   */
  async cancelPendingReminders(bookingId: string, reason: string = 'Booking status changed'): Promise<void> {
    try {
      const knex = getDatabase();
      await knex('rental_reminder_logs')
        .where('booking_id', bookingId)
        .where('status', 'pending')
        .update({
          status: 'cancelled',
          error_message: reason,
          updated_at: knex.fn.now()
        });

      logger.info(`Cancelled pending reminders for booking ${bookingId}: ${reason}`);
    } catch (error) {
      logger.error(`Error cancelling reminders for booking ${bookingId}:`, error);
    }
  }

  /**
   * Reset reminder schedule for a booking (when return date is updated)
   */
  async resetReminderSchedule(bookingId: string): Promise<void> {
    try {
      // Cancel all pending reminders
      await this.cancelPendingReminders(bookingId, 'Return date updated - schedule reset');

      // Update booking to mark reminders as reset
      const knex = getDatabase();
      await knex('bookings')
        .where('id', bookingId)
        .update({
          reminders_reset_at: knex.fn.now(),
          updated_at: knex.fn.now()
        });

      logger.info(`Reset reminder schedule for booking ${bookingId}`);
    } catch (error) {
      logger.error(`Error resetting reminder schedule for booking ${bookingId}:`, error);
    }
  }

  /**
   * Mark booking as returned early
   */
  async markBookingReturnedEarly(bookingId: string, actualReturnDate: Date): Promise<void> {
    try {
      const knex = getDatabase();
      await knex('bookings')
        .where('id', bookingId)
        .update({
          returned_early: true,
          actual_return_date: actualReturnDate,
          updated_at: knex.fn.now()
        });

      // Cancel pending reminders
      await this.cancelPendingReminders(bookingId, 'Product returned early');

      logger.info(`Marked booking ${bookingId} as returned early`);
    } catch (error) {
      logger.error(`Error marking booking ${bookingId} as returned early:`, error);
    }
  }

  /**
   * Get reminder statistics
   */
  async getReminderStats(): Promise<any> {
    try {
      const knex = getDatabase();
      const [totalReminders, recentReminders, failedReminders, upcomingReminders] = await Promise.all([
        knex('rental_reminder_logs').count('* as count').first(),
        knex('rental_reminder_logs')
          .count('* as count')
          .where('sent_at', '>=', knex.raw("NOW() - INTERVAL '24 hours'"))
          .first(),
        knex('rental_reminder_logs')
          .count('* as count')
          .where('status', 'failed')
          .where('created_at', '>=', knex.raw("NOW() - INTERVAL '24 hours'"))
          .first(),
        knex('bookings')
          .count('* as count')
          .whereIn('status', ['active', 'ongoing', 'confirmed'])
          .where('reminders_enabled', true)
          .where('returned_early', false)
          .whereNull('actual_return_date')
          .where('return_date', '>', knex.fn.now())
          .where('return_date', '<=', knex.raw("NOW() + INTERVAL '24 hours'"))
          .first()
      ]);

      return {
        total_reminders: parseInt((totalReminders?.count as string) || '0'),
        recent_reminders: parseInt((recentReminders?.count as string) || '0'),
        failed_reminders: parseInt((failedReminders?.count as string) || '0'),
        upcoming_reminders: parseInt((upcomingReminders?.count as string) || '0')
      };
    } catch (error) {
      logger.error('Error fetching reminder stats:', error);
      return {
        total_reminders: 0,
        recent_reminders: 0,
        failed_reminders: 0,
        upcoming_reminders: 0
      };
    }
  }
}

export default new RentalReminderService();