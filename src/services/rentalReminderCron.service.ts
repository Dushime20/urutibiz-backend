import cron from 'node-cron';
import RentalReminderService from './rentalReminder.service';
import logger from '../utils/logger';

/**
 * Rental Reminder Cron Service
 * 
 * Handles automated rental return reminder processing via scheduled jobs
 */
export class RentalReminderCronService {
  private static cronJob: cron.ScheduledTask | null = null;
  private static isRunning = false;

  /**
   * Start the rental reminder cron job
   * Runs every 15 minutes to check for due reminders
   */
  static start(): void {
    if (this.cronJob) {
      logger.warn('Rental reminder cron job is already running');
      return;
    }

    // Run every 15 minutes: '*/15 * * * *'
    // For testing, you can use '*/1 * * * *' (every minute)
    this.cronJob = cron.schedule('*/15 * * * *', async () => {
      if (this.isRunning) {
        logger.info('Rental reminder processing already in progress, skipping...');
        return;
      }

      this.isRunning = true;
      
      try {
        logger.info('Starting automated rental reminder processing...');
        
        const result = await RentalReminderService.processReminders();
        
        if (result.processed > 0) {
          logger.info(`Automated rental reminder processing completed: ${result.processed} reminders sent`);
        } else {
          logger.debug('Automated rental reminder processing completed: no reminders due');
        }

        if (result.errors.length > 0) {
          logger.error(`Rental reminder processing had ${result.errors.length} errors:`, result.errors);
        }
        
      } catch (error) {
        logger.error('Error in automated rental reminder processing:', error);
      } finally {
        this.isRunning = false;
      }
    }, {
      scheduled: false, // Don't start immediately
      timezone: 'UTC'   // Use UTC timezone for consistency
    });

    this.cronJob.start();
    logger.info('Rental reminder cron job started (runs every 15 minutes)');
  }

  /**
   * Stop the rental reminder cron job
   */
  static stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('Rental reminder cron job stopped');
    }
  }

  /**
   * Get the status of the cron job
   */
  static getStatus(): { isActive: boolean; isRunning: boolean; schedule: string } {
    return {
      isActive: this.cronJob !== null,
      isRunning: this.isRunning,
      schedule: '*/15 * * * *' // Every 15 minutes
    };
  }

  /**
   * Manually trigger the reminder processing (for testing or admin use)
   */
  static async triggerManualProcessing(): Promise<any> {
    if (this.isRunning) {
      throw new Error('Reminder processing is already in progress');
    }

    this.isRunning = true;
    
    try {
      logger.info('Manual rental reminder processing triggered');
      const result = await RentalReminderService.processReminders();
      logger.info(`Manual rental reminder processing completed: ${result.processed} reminders sent`);
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
        logger.info('Rental reminder processing already in progress, skipping...');
        return;
      }

      this.isRunning = true;
      
      try {
        logger.info('Starting automated rental reminder processing...');
        const result = await RentalReminderService.processReminders();
        
        if (result.processed > 0) {
          logger.info(`Automated rental reminder processing completed: ${result.processed} reminders sent`);
        }

        if (result.errors.length > 0) {
          logger.error(`Rental reminder processing had ${result.errors.length} errors:`, result.errors);
        }
        
      } catch (error) {
        logger.error('Error in automated rental reminder processing:', error);
      } finally {
        this.isRunning = false;
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    logger.info(`Rental reminder cron job updated with new schedule: ${cronPattern}`);
  }

  /**
   * Get next few scheduled run times (estimated)
   */
  static getNextRuns(count: number = 5): Date[] {
    const now = new Date();
    const nextRuns: Date[] = [];
    
    // Calculate next runs based on 15-minute intervals
    for (let i = 1; i <= count; i++) {
      const nextRun = new Date(now);
      const currentMinutes = now.getMinutes();
      const nextInterval = Math.ceil(currentMinutes / 15) * 15;
      
      if (nextInterval === 60) {
        nextRun.setHours(nextRun.getHours() + 1);
        nextRun.setMinutes(0);
      } else {
        nextRun.setMinutes(nextInterval);
      }
      
      nextRun.setSeconds(0);
      nextRun.setMilliseconds(0);
      
      // Add additional intervals
      nextRun.setMinutes(nextRun.getMinutes() + ((i - 1) * 15));
      
      nextRuns.push(new Date(nextRun));
    }
    
    return nextRuns;
  }
}

export default RentalReminderCronService;