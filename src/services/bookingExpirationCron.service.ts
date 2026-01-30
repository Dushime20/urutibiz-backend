import cron from 'node-cron';
import { BookingExpirationService } from './bookingExpiration.service';
import logger from '../utils/logger';

/**
 * Booking Expiration Cron Service
 * 
 * Handles automated booking expiration cleanup via scheduled jobs
 */
export class BookingExpirationCronService {
  private static cronJob: cron.ScheduledTask | null = null;
  private static isRunning = false;

  /**
   * Start the booking expiration cron job
   * Runs every 5 minutes to check for expired bookings
   */
  static start(): void {
    if (this.cronJob) {
      logger.warn('Booking expiration cron job is already running');
      return;
    }

    // Run every 5 minutes: '*/5 * * * *'
    // For testing, you can use '*/1 * * * *' (every minute)
    this.cronJob = cron.schedule('*/5 * * * *', async () => {
      if (this.isRunning) {
        logger.info('Booking expiration cleanup already in progress, skipping...');
        return;
      }

      this.isRunning = true;
      
      try {
        logger.info('Starting automated booking expiration cleanup...');
        
        const result = await BookingExpirationService.processExpiredBookings();
        
        if (result.expired_count > 0) {
          logger.info(`Automated booking expiration cleanup completed: ${result.expired_count} bookings expired`);
        } else {
          logger.debug('Automated booking expiration cleanup completed: no expired bookings found');
        }

        if (result.errors.length > 0) {
          logger.error(`Booking expiration cleanup had ${result.errors.length} errors:`, result.errors);
        }
        
      } catch (error) {
        logger.error('Error in automated booking expiration cleanup:', error);
      } finally {
        this.isRunning = false;
      }
    }, {
      scheduled: false, // Don't start immediately
      timezone: 'UTC'   // Use UTC timezone for consistency
    });

    this.cronJob.start();
    logger.info('Booking expiration cron job started (runs every 5 minutes)');
  }

  /**
   * Stop the booking expiration cron job
   */
  static stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('Booking expiration cron job stopped');
    }
  }

  /**
   * Get the status of the cron job
   */
  static getStatus(): { isActive: boolean; isRunning: boolean; nextRun?: Date } {
    return {
      isActive: this.cronJob !== null,
      isRunning: this.isRunning,
      // Note: node-cron doesn't provide next run time directly
      // You could implement this by calculating based on the cron pattern
    };
  }

  /**
   * Manually trigger the cleanup process (for testing or admin use)
   */
  static async triggerManualCleanup(): Promise<any> {
    if (this.isRunning) {
      throw new Error('Cleanup is already in progress');
    }

    this.isRunning = true;
    
    try {
      logger.info('Manual booking expiration cleanup triggered');
      const result = await BookingExpirationService.processExpiredBookings();
      logger.info(`Manual booking expiration cleanup completed: ${result.expired_count} bookings expired`);
      return result;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Update cron schedule (requires restart)
   */
  static updateSchedule(cronPattern: string): void {
    if (!cron.validate(cronPattern)) {
      throw new Error('Invalid cron pattern');
    }

    this.stop();
    
    this.cronJob = cron.schedule(cronPattern, async () => {
      if (this.isRunning) {
        logger.info('Booking expiration cleanup already in progress, skipping...');
        return;
      }

      this.isRunning = true;
      
      try {
        logger.info('Starting automated booking expiration cleanup...');
        const result = await BookingExpirationService.processExpiredBookings();
        
        if (result.expired_count > 0) {
          logger.info(`Automated booking expiration cleanup completed: ${result.expired_count} bookings expired`);
        }

        if (result.errors.length > 0) {
          logger.error(`Booking expiration cleanup had ${result.errors.length} errors:`, result.errors);
        }
        
      } catch (error) {
        logger.error('Error in automated booking expiration cleanup:', error);
      } finally {
        this.isRunning = false;
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    logger.info(`Booking expiration cron job updated with new schedule: ${cronPattern}`);
  }
}

export default BookingExpirationCronService;