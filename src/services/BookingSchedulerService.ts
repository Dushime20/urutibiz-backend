// =====================================================
// BOOKING SCHEDULER SERVICE
// =====================================================
// Automated status transitions for bookings based on dates
// Runs scheduled jobs to update booking statuses automatically

// @ts-ignore - node-cron types may not be available
import cron from 'node-cron';
import { getDatabase } from '../config/database';
import { NotificationEngine } from './notification/NotificationEngine';
import { NotificationType, NotificationPriority } from './notification/types';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class BookingSchedulerService {
  private isRunning: boolean = false;
  private cronJob: cron.ScheduledTask | null = null;
  private notificationEngine: NotificationEngine;
  private db: any | null = null;
  private systemUserId: string | null = null;

  constructor() {
    this.notificationEngine = new NotificationEngine();
    // Lazy database initialization - don't access database in constructor
    // Database will be initialized on first use via getDb()
  }

  /**
   * Lazy database initialization
   * Returns the database instance, initializing it on first access
   * This prevents errors when database is not yet initialized (e.g., in demo mode)
   */
  private getDb(): any {
    if (!this.db) {
      this.db = getDatabase();
    }
    return this.db;
  }

  /**
   * Ensure system user is initialized before operations
   */
  private async ensureSystemUserInitialized(): Promise<void> {
    if (!this.systemUserId) {
      await this.initializeSystemUser();
    }
  }

  /**
   * Get or create system user for automated status changes
   * Creates a system user if one doesn't exist
   */
  private async initializeSystemUser(): Promise<void> {
    try {
      // Try to find existing system user by email or role
      let systemUser = await this.getDb()('users')
        .where('email', 'system@urutibiz.com')
        .first();

      if (!systemUser) {
        systemUser = await this.getDb()('users')
          .where('role', 'system')
          .first();
      }

      if (systemUser) {
        this.systemUserId = systemUser.id;
        logger.info('✅ Found system user for automated status changes');
        return;
      }

      // System user doesn't exist - create one
      logger.info('📝 Creating system user for automated status changes...');
      
      const systemUserId = uuidv4();
      const now = new Date();
      
      await this.getDb()('users').insert({
        id: systemUserId,
        email: 'system@urutibiz.com',
        username: 'system',
        first_name: 'System',
        last_name: 'Automation',
        role: 'system',
        status: 'active',
        email_verified: true,
        phone_verified: false,
        kyc_status: 'verified',
        created_at: now,
        updated_at: now
      });

      this.systemUserId = systemUserId;
      logger.info(`✅ Created system user (${systemUserId}) for automated status changes`);
    } catch (error: any) {
      logger.error('❌ Failed to initialize system user:', error);
      // If we can't create system user, we can't proceed - this is critical
      throw new Error(`Failed to initialize system user: ${error.message}`);
    }
  }

  /**
   * Start the booking scheduler
   * Runs every hour to check and update booking statuses
   */
  async start(): Promise<void> {
    if (this.cronJob) {
      logger.warn('⚠️ Booking scheduler is already running');
      return;
    }

    // Ensure system user exists before starting scheduler
    await this.ensureSystemUserInitialized();

    // Run every hour at minute 0 (e.g., 1:00, 2:00, 3:00)
    this.cronJob = cron.schedule('0 * * * *', async () => {
      // Ensure system user is still initialized before each run
      await this.ensureSystemUserInitialized();
      await this.updateBookingStatuses();
    });

    logger.info('✅ Booking scheduler started (runs every hour)');
  }

  /**
   * Stop the booking scheduler
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('🛑 Booking scheduler stopped');
    }
  }

  /**
   * Update booking statuses automatically
   * Handles both auto-start and auto-complete transitions
   * Also sends rental reminders for upcoming rental endings
   */
  async updateBookingStatuses(): Promise<{ startedCount: number; completedCount: number; reminderCount: number }> {
    if (this.isRunning) {
      logger.warn('⚠️ Previous booking status update job still running, skipping...');
      return { startedCount: 0, completedCount: 0, reminderCount: 0 };
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('🔄 Running scheduled booking status updates...');

      // Run all updates in parallel for efficiency
      const [startedCount, completedCount, reminderCount] = await Promise.all([
        this.autoStartBookings(),
        this.autoCompleteBookings(),
        this.sendRentalReminders()
      ]);

      const duration = Date.now() - startTime;
      logger.info(
        `✅ Status updates completed: ${startedCount} started, ${completedCount} completed, ${reminderCount} reminders sent (${duration}ms)`
      );

      return { startedCount, completedCount, reminderCount };
    } catch (error: any) {
      logger.error('❌ Error in booking status update job:', error);
      // Send alert to monitoring system (if available)
      return { startedCount: 0, completedCount: 0, reminderCount: 0 };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Auto-start bookings: confirmed → in_progress
   * Updates bookings where start_date has arrived
   */
  private async autoStartBookings(): Promise<number> {
    try {
      // Ensure system user is initialized
      await this.ensureSystemUserInitialized();
      
      const now = new Date();

      // Find all confirmed bookings where start_date has arrived
      // Include product and user details for notifications
      // Safety checks:
      // - Only confirmed bookings
      // - Payment must be completed
      // - Start date has passed
      // - Not already started (idempotent)
      // - End date hasn't passed (safety check)
      const bookingsToStart = await this.getDb()('bookings')
        .select(
          'bookings.id',
          'bookings.booking_number',
          'bookings.renter_id',
          'bookings.owner_id',
          'bookings.product_id',
          'bookings.start_date',
          'bookings.end_date',
          'bookings.pickup_method',
          'bookings.pickup_address',
          'bookings.delivery_address',
          'products.title as product_title',
          'products.description as product_description',
          'renters.first_name as renter_first_name',
          'renters.last_name as renter_last_name',
          'renters.email as renter_email',
          'owners.first_name as owner_first_name',
          'owners.last_name as owner_last_name',
          'owners.email as owner_email'
        )
        .leftJoin('products', 'bookings.product_id', 'products.id')
        .leftJoin('users as renters', 'bookings.renter_id', 'renters.id')
        .leftJoin('users as owners', 'bookings.owner_id', 'owners.id')
        .where('bookings.status', 'confirmed')
        .where('bookings.payment_status', 'completed') // Only if paid
        .where('bookings.start_date', '<=', now) // Start date has arrived
        .whereNull('bookings.started_at') // Not already started (idempotent)
        .where('bookings.end_date', '>', now); // Safety: Don't start if already past end

      if (bookingsToStart.length === 0) {
        return 0;
      }

      logger.info(`📋 Found ${bookingsToStart.length} booking(s) to auto-start`);

      // Process in batches for better performance
      const batchSize = 50;
      let processedCount = 0;

      for (let i = 0; i < bookingsToStart.length; i += batchSize) {
        const batch = bookingsToStart.slice(i, i + batchSize);

        await this.getDb().transaction(async (trx: any) => {
          // Update booking statuses
          const bookingIds = batch.map((b: any) => b.id);
          
          await trx('bookings')
            .whereIn('id', bookingIds)
            .update({
              status: 'in_progress',
              started_at: now,
              updated_at: now
            });

          // Record status changes in audit trail
          // Insert directly into database for better performance
          const statusHistoryEntries = batch.map((booking: any) => ({
            id: uuidv4(),
            booking_id: booking.id,
            previous_status: 'confirmed',
            new_status: 'in_progress',
            changed_by: this.systemUserId!,
            reason: 'Automatically started at rental start date',
            metadata: { source: 'booking_scheduler', timestamp: now.toISOString() },
            changed_at: now
          }));

          // Insert status history records
          if (statusHistoryEntries.length > 0) {
            await trx('booking_status_history').insert(statusHistoryEntries);
          }
        });

        // Send notifications in background (don't block transaction)
        for (const booking of batch) {
          this.sendBookingStartedNotifications(booking).catch((error) => {
            logger.error(`Failed to send notification for booking ${booking.booking_number}:`, error);
          });
        }

        processedCount += batch.length;
        logger.info(`✅ Auto-started ${processedCount}/${bookingsToStart.length} booking(s)`);
      }

      return processedCount;
    } catch (error: any) {
      logger.error('❌ Error in autoStartBookings:', error);
      throw error;
    }
  }

  /**
   * Auto-complete bookings: in_progress → completed
   * Updates bookings where end_date has passed
   */
  private async autoCompleteBookings(): Promise<number> {
    try {
      // Ensure system user is initialized
      await this.ensureSystemUserInitialized();
      
      const now = new Date();

      // Find all in_progress bookings where end_date has passed
      // Include product and user details for notifications
      // Safety checks:
      // - Only in_progress bookings
      // - End date has passed
      // - Not already completed (idempotent)
      const bookingsToComplete = await this.getDb()('bookings')
        .select(
          'bookings.id',
          'bookings.booking_number',
          'bookings.renter_id',
          'bookings.owner_id',
          'bookings.product_id',
          'bookings.start_date',
          'bookings.end_date',
          'bookings.pickup_method',
          'bookings.pickup_address',
          'bookings.delivery_address',
          'bookings.return_time',
          'products.title as product_title',
          'products.description as product_description',
          'renters.first_name as renter_first_name',
          'renters.last_name as renter_last_name',
          'renters.email as renter_email',
          'owners.first_name as owner_first_name',
          'owners.last_name as owner_last_name',
          'owners.email as owner_email'
        )
        .leftJoin('products', 'bookings.product_id', 'products.id')
        .leftJoin('users as renters', 'bookings.renter_id', 'renters.id')
        .leftJoin('users as owners', 'bookings.owner_id', 'owners.id')
        .where('bookings.status', 'in_progress')
        .where('bookings.end_date', '<', now) // End date has passed
        .whereNull('bookings.completed_at'); // Not already completed (idempotent)

      if (bookingsToComplete.length === 0) {
        return 0;
      }

      logger.info(`📋 Found ${bookingsToComplete.length} booking(s) to auto-complete`);

      // Process in batches
      const batchSize = 50;
      let processedCount = 0;

      for (let i = 0; i < bookingsToComplete.length; i += batchSize) {
        const batch = bookingsToComplete.slice(i, i + batchSize);

        await this.getDb().transaction(async (trx: any) => {
          // Update booking statuses
          const bookingIds = batch.map((b: any) => b.id);
          
          await trx('bookings')
            .whereIn('id', bookingIds)
            .update({
              status: 'completed',
              completed_at: now,
              updated_at: now
            });

          // Record status changes in audit trail
          const statusHistoryEntries = batch.map((booking: any) => ({
            id: uuidv4(),
            booking_id: booking.id,
            previous_status: 'in_progress',
            new_status: 'completed',
            changed_by: this.systemUserId!,
            reason: 'Automatically completed at rental end date',
            metadata: { source: 'booking_scheduler', timestamp: now.toISOString() },
            changed_at: now
          }));

          // Insert status history records
          if (statusHistoryEntries.length > 0) {
            await trx('booking_status_history').insert(statusHistoryEntries);
          }
        });

        // Send notifications in background
        for (const booking of batch) {
          this.sendBookingCompletedNotifications(booking).catch((error) => {
            logger.error(`Failed to send notification for booking ${booking.booking_number}:`, error);
          });
        }

        processedCount += batch.length;
        logger.info(`✅ Auto-completed ${processedCount}/${bookingsToComplete.length} booking(s)`);
      }

      return processedCount;
    } catch (error: any) {
      logger.error('❌ Error in autoCompleteBookings:', error);
      throw error;
    }
  }

  /**
   * Send rental reminders for upcoming rental endings
   * Sends reminders 24 hours before and 2 hours before end date
   */
  private async sendRentalReminders(): Promise<number> {
    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
      const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
      
      // Find in_progress bookings ending in 24 hours (within next hour window)
      // Calculate time until end date to find bookings ending in ~24 hours
      const bookings24HourReminder = await this.getDb()('bookings')
        .select(
          'bookings.id',
          'bookings.booking_number',
          'bookings.renter_id',
          'bookings.owner_id',
          'bookings.product_id',
          'bookings.end_date',
          'bookings.pickup_method',
          'bookings.pickup_address',
          'bookings.delivery_address',
          'bookings.return_time',
          'products.title as product_title',
          'renters.first_name as renter_first_name',
          'renters.last_name as renter_last_name',
          'renters.email as renter_email'
        )
        .leftJoin('products', 'bookings.product_id', 'products.id')
        .leftJoin('users as renters', 'bookings.renter_id', 'renters.id')
        .where('bookings.status', 'in_progress')
        .whereBetween('bookings.end_date', [
          new Date(in24Hours.getTime() - 60 * 60 * 1000),
          new Date(in24Hours.getTime() + 60 * 60 * 1000)
        ])
        // Only send if we haven't sent a 24-hour reminder yet (check in metadata)
        .whereRaw(`NOT EXISTS (
          SELECT 1 FROM notifications 
          WHERE notifications.recipient_id = bookings.renter_id 
          AND notifications.type = ?
          AND notifications.metadata->>'reminderType' = '24_hours'
          AND notifications.metadata->>'bookingId' = bookings.id::text
        )`, [NotificationType.BOOKING_REMINDER]);

      // Find in_progress bookings ending in 2 hours
      const bookings2HourReminder = await this.getDb()('bookings')
        .select(
          'bookings.id',
          'bookings.booking_number',
          'bookings.renter_id',
          'bookings.owner_id',
          'bookings.product_id',
          'bookings.end_date',
          'bookings.pickup_method',
          'bookings.pickup_address',
          'bookings.delivery_address',
          'bookings.return_time',
          'products.title as product_title',
          'renters.first_name as renter_first_name',
          'renters.last_name as renter_last_name',
          'renters.email as renter_email'
        )
        .leftJoin('products', 'bookings.product_id', 'products.id')
        .leftJoin('users as renters', 'bookings.renter_id', 'renters.id')
        .where('bookings.status', 'in_progress')
        .whereBetween('bookings.end_date', [
          new Date(in2Hours.getTime() - 60 * 60 * 1000),
          new Date(in2Hours.getTime() + 60 * 60 * 1000)
        ])
        // Only send if we haven't sent a 2-hour reminder yet
        .whereRaw(`NOT EXISTS (
          SELECT 1 FROM notifications 
          WHERE notifications.recipient_id = bookings.renter_id 
          AND notifications.type = ?
          AND notifications.metadata->>'reminderType' = '2_hours'
          AND notifications.metadata->>'bookingId' = bookings.id::text
        )`, [NotificationType.BOOKING_REMINDER]);

      let reminderCount = 0;

      // Send 24-hour reminders
      for (const booking of bookings24HourReminder) {
        await this.sendRentalReminderNotification(booking, '24_hours');
        reminderCount++;
      }

      // Send 2-hour reminders
      for (const booking of bookings2HourReminder) {
        await this.sendRentalReminderNotification(booking, '2_hours');
        reminderCount++;
      }

      if (reminderCount > 0) {
        logger.info(`📧 Sent ${reminderCount} rental reminder notification(s)`);
      }

      return reminderCount;
    } catch (error: any) {
      logger.error('❌ Error in sendRentalReminders:', error);
      return 0;
    }
  }

  /**
   * Send rental reminder notification to renter
   */
  private async sendRentalReminderNotification(booking: any, reminderType: '24_hours' | '2_hours'): Promise<void> {
    try {
      const endDate = new Date(booking.end_date);
      const hoursRemaining = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60));
      const productName = booking.product_title || 'the product';
      const renterName = booking.renter_first_name || 'there';

      let title: string;
      let message: string;

      if (reminderType === '24_hours') {
        title = `Reminder: Return ${productName} Tomorrow`;
        message = `Hello ${renterName}, your rental period for ${productName} (Booking ${booking.booking_number}) ends in approximately ${hoursRemaining} hours. Please ensure you return the product on time to avoid late fees.`;
      } else {
        title = `Urgent: Return ${productName} Soon`;
        message = `Hello ${renterName}, your rental period for ${productName} (Booking ${booking.booking_number}) ends in approximately ${hoursRemaining} hours. Please return the product immediately to avoid late fees.`;
      }

      // Add return instructions based on pickup method
      if (booking.pickup_method === 'delivery') {
        message += ` Please prepare the product for pickup at ${booking.delivery_address || 'the specified address'}.`;
      } else if (booking.pickup_method === 'pickup') {
        message += ` Please return the product to ${booking.pickup_address || 'the pickup location'} by ${endDate.toLocaleString()}.`;
      }

      await this.notificationEngine.sendNotification({
        type: NotificationType.BOOKING_REMINDER,
        recipientId: booking.renter_id,
        recipientEmail: booking.renter_email,
        title,
        message,
        data: {
          bookingId: booking.id,
          bookingNumber: booking.booking_number,
          productTitle: productName,
          endDate: booking.end_date,
          hoursRemaining,
          reminderType,
          pickupMethod: booking.pickup_method,
          returnAddress: booking.pickup_address || booking.delivery_address
        },
        priority: reminderType === '2_hours' ? NotificationPriority.URGENT : NotificationPriority.HIGH,
        metadata: {
          source: 'booking_scheduler',
          action: 'rental_reminder',
          reminderType
        }
      });
    } catch (error: any) {
      logger.error(`Failed to send rental reminder for booking ${booking.booking_number}:`, error);
    }
  }

  /**
   * Send notifications when booking starts
   */
  private async sendBookingStartedNotifications(booking: any): Promise<void> {
    try {
      const productName = booking.product_title || 'the product';
      const renterName = booking.renter_first_name || 'there';
      const endDate = new Date(booking.end_date);
      const returnDate = endDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Notify renter
      let renterMessage = `Hello ${renterName}, your rental for ${productName} (Booking ${booking.booking_number}) has started. The rental period is now in progress.`;
      
      if (booking.pickup_method === 'delivery' && booking.delivery_address) {
        renterMessage += ` The product will be delivered to ${booking.delivery_address}.`;
      } else if (booking.pickup_method === 'pickup' && booking.pickup_address) {
        renterMessage += ` Please pick up the product from ${booking.pickup_address}.`;
      }

      renterMessage += ` Remember to return the product by ${returnDate} to avoid late fees.`;

      await this.notificationEngine.sendNotification({
        type: NotificationType.BOOKING_CONFIRMED,
        recipientId: booking.renter_id,
        recipientEmail: booking.renter_email,
        title: `Your Rental Has Started - ${productName}`,
        message: renterMessage,
        data: {
          bookingId: booking.id,
          bookingNumber: booking.booking_number,
          productTitle: productName,
          status: 'in_progress',
          startDate: booking.start_date,
          endDate: booking.end_date,
          returnDate,
          pickupMethod: booking.pickup_method,
          pickupAddress: booking.pickup_address,
          deliveryAddress: booking.delivery_address
        },
        priority: NotificationPriority.HIGH,
        metadata: {
          source: 'booking_scheduler',
          action: 'auto_start'
        }
      });

      // Notify owner
      const ownerName = booking.owner_first_name || 'there';
      const ownerMessage = `Hello ${ownerName}, the rental period for ${productName} (Booking ${booking.booking_number}) has started. The renter should return the product by ${returnDate}.`;

      await this.notificationEngine.sendNotification({
        type: NotificationType.BOOKING_CONFIRMED,
        recipientId: booking.owner_id,
        recipientEmail: booking.owner_email,
        title: `Rental Period Started - ${productName}`,
        message: ownerMessage,
        data: {
          bookingId: booking.id,
          bookingNumber: booking.booking_number,
          productTitle: productName,
          status: 'in_progress',
          startDate: booking.start_date,
          endDate: booking.end_date,
          returnDate
        },
        priority: NotificationPriority.NORMAL,
        metadata: {
          source: 'booking_scheduler',
          action: 'auto_start'
        }
      });
    } catch (error: any) {
      logger.error(`Failed to send started notifications for booking ${booking.booking_number}:`, error);
      // Don't throw - notification failures shouldn't break the scheduler
    }
  }

  /**
   * Send notifications when booking completes
   */
  private async sendBookingCompletedNotifications(booking: any): Promise<void> {
    try {
      const productName = booking.product_title || 'the product';
      const renterName = booking.renter_first_name || 'there';
      const ownerName = booking.owner_first_name || 'there';

      // Notify renter - emphasize returning the product
      let renterMessage = `Hello ${renterName}, your rental period for ${productName} (Booking ${booking.booking_number}) has ended.`;
      
      if (booking.pickup_method === 'delivery' && booking.delivery_address) {
        renterMessage += ` Please prepare the product for pickup at ${booking.delivery_address}.`;
      } else if (booking.pickup_method === 'pickup' && booking.pickup_address) {
        renterMessage += ` Please return the product to ${booking.pickup_address} as soon as possible.`;
      } else {
        renterMessage += ` Please return the product as soon as possible to avoid late fees.`;
      }

      renterMessage += ` Late returns may incur additional charges.`;

      await this.notificationEngine.sendNotification({
        type: NotificationType.BOOKING_CONFIRMED,
        recipientId: booking.renter_id,
        recipientEmail: booking.renter_email,
        title: `Return ${productName} - Rental Period Ended`,
        message: renterMessage,
        data: {
          bookingId: booking.id,
          bookingNumber: booking.booking_number,
          productTitle: productName,
          status: 'completed',
          startDate: booking.start_date,
          endDate: booking.end_date,
          returnTime: booking.return_time,
          pickupMethod: booking.pickup_method,
          returnAddress: booking.pickup_address || booking.delivery_address
        },
        priority: NotificationPriority.URGENT,
        metadata: {
          source: 'booking_scheduler',
          action: 'auto_complete'
        }
      });

      // Notify owner
      const ownerMessage = `Hello ${ownerName}, the rental period for ${productName} (Booking ${booking.booking_number}) has ended. Please inspect the product when it is returned.`;

      await this.notificationEngine.sendNotification({
        type: NotificationType.BOOKING_CONFIRMED,
        recipientId: booking.owner_id,
        recipientEmail: booking.owner_email,
        title: `Rental Period Ended - ${productName}`,
        message: ownerMessage,
        data: {
          bookingId: booking.id,
          bookingNumber: booking.booking_number,
          productTitle: productName,
          status: 'completed',
          startDate: booking.start_date,
          endDate: booking.end_date,
          returnTime: booking.return_time
        },
        priority: NotificationPriority.NORMAL,
        metadata: {
          source: 'booking_scheduler',
          action: 'auto_complete'
        }
      });
    } catch (error: any) {
      logger.error(`Failed to send completed notifications for booking ${booking.booking_number}:`, error);
      // Don't throw - notification failures shouldn't break the scheduler
    }
  }

  /**
   * Manually trigger status update (for testing or manual runs)
   */
  async triggerManualUpdate(): Promise<{ startedCount: number; completedCount: number; reminderCount: number }> {
    logger.info('🔧 Manual trigger: Running booking status updates...');
    return await this.updateBookingStatuses();
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; isScheduled: boolean } {
    return {
      isRunning: this.isRunning,
      isScheduled: this.cronJob !== null
    };
  }
}

// Export singleton instance
export default new BookingSchedulerService();

