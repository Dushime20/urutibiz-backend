// server.ts - UrutiBiz Backend Server
import dotenv from 'dotenv';
import App from './app';
import { getConfig } from './config/config';
import logger from './utils/logger';
import { connectDatabase } from './config/database';
import sequelize from './config/sequelize';
import { initProductPriceModel } from './models/ProductPrice.model';
import { initPaymentProviderModel } from './models/PaymentProvider.model';
import { initInsuranceProviderModel } from './models/InsuranceProvider.model';
import { initializeCategoryRegulationModel } from './models/CategoryRegulation.model';


const config = getConfig();
dotenv.config();

async function startServer(): Promise<void> {
  let app: App | null = null;
  console.log('DB_HOST:', process.env.DB_HOST); 
  
  try {
    // Connect to the database before initializing the app
    await connectDatabase();

    // Initialize Sequelize models used by specific services (e.g., product prices)
    try {
      initProductPriceModel(sequelize);
      initPaymentProviderModel(sequelize);
      initInsuranceProviderModel(sequelize);
      initializeCategoryRegulationModel(sequelize);
      await sequelize.authenticate();
      // Do not sync schema automatically in production; rely on Knex migrations
    } catch (seqErr) {
      logger.error('❌ Failed to initialize Sequelize models:', seqErr);
      // Continue startup; product price endpoints will fail if model is not available
    }
    app = new App();
    
    // Initialize the application
    const initResult = await app.initialize();
    
    if (!initResult.success) {
      logger.warn('Application initialization completed with warnings:', initResult.message);
      if (initResult.errors) {
        initResult.errors.forEach(error => {
          logger.warn(`${error.service}: ${error.error}`);
        });
      }
    }
    
    // Start the server
    const server = app.getServer();
    
    server.listen(config.port, async () => {
      logger.info(`🚀 UrutiBiz API server running on port ${config.port}`);
      logger.info(`📱 Environment: ${config.nodeEnv}`);
      logger.info(`🔗 API Base URL: http://localhost:${config.port}${config.apiPrefix}`);
      
      if (config.swagger.enabled) {
        logger.info(`📖 API Documentation: http://localhost:${config.port}/api-docs`);
      }
      
      logger.info(`💚 Health Check: http://localhost:${config.port}/health`);
      logger.info(`🌐 Frontend URL: ${config.frontendUrl}`);

      // Start booking expiration cron service
      try {
        const { BookingExpirationCronService } = await import('./services/bookingExpirationCron.service');
        BookingExpirationCronService.start();
        logger.info('✅ Booking expiration cron service started');
      } catch (error) {
        logger.error('❌ Failed to start booking expiration cron service:', error);
        // Don't block server startup
      }

      // Start rental reminder cron service
      try {
        const { RentalReminderCronService } = await import('./services/rentalReminderCron.service');
        RentalReminderCronService.start();
        logger.info('✅ Rental reminder cron service started');
      } catch (error) {
        logger.error('❌ Failed to start rental reminder cron service:', error);
        // Don't block server startup
      }

      // Load AI model and precompute embeddings in background (non-blocking)
      setTimeout(async () => {
        try {
          const embeddingService = (await import('./services/embeddingPrecomputation.service')).default;
          
          // Load model first
          logger.info('🔄 Loading AI model for image search...');
          await embeddingService.loadModel();
          
          // Precompute embeddings for all product images
          logger.info('🔄 Precomputing embeddings for product images...');
          const result = await embeddingService.precomputeEmbeddings();
          
          if (result.success) {
            logger.info(`✅ Embedding precomputation complete: ${result.processed} images processed`);
            if (result.failed > 0) {
              logger.warn(`⚠️ ${result.failed} images failed to process`);
            }
          } else {
            logger.warn('⚠️ Embedding precomputation completed with errors');
          }
        } catch (error) {
          logger.error('❌ Failed to precompute embeddings:', error);
          // Don't block server startup - embeddings will be computed on-demand
        }
      }, 2000); // Wait 2 seconds after server starts
    });

    // Graceful shutdown function
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      // Stop booking expiration cron service
      try {
        const { BookingExpirationCronService } = await import('./services/bookingExpirationCron.service');
        BookingExpirationCronService.stop();
        logger.info('✅ Booking expiration cron service stopped');
      } catch (error) {
        logger.error('❌ Error stopping booking expiration cron service:', error);
      }

      // Stop rental reminder cron service
      try {
        const { RentalReminderCronService } = await import('./services/rentalReminderCron.service');
        RentalReminderCronService.stop();
        logger.info('✅ Rental reminder cron service stopped');
      } catch (error) {
        logger.error('❌ Error stopping rental reminder cron service:', error);
      }
      
      if (app) {
        await app.shutdown();
      }
      
      server.close((err: any) => {
        if (err) {
          logger.error('Error during server shutdown:', err);
          process.exit(1);
        }
        
        logger.info('✅ Server closed successfully');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    
    if (app) {
      try {
        await app.shutdown();
      } catch (shutdownError) {
        logger.error('❌ Error during emergency shutdown:', shutdownError);
      }
    }
    
    process.exit(1);
  }
}

// Start the server
startServer();
