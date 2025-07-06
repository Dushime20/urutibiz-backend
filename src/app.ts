import 'reflect-metadata';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
// Swagger/OpenAPI imports
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Import configurations
import { getConfig } from './config/config';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { configurePassport } from './config/passport';

// Import middleware
import { errorHandler } from './middleware/error.middleware';
import { corsMiddleware } from './middleware/cors.middleware';
import { securityMiddleware } from './middleware/security.middleware';
import { rateLimitMiddleware } from './middleware/rateLimitMiddleware';
import { loggingMiddleware } from './middleware/logging.middleware';

// Import routes - will be loaded after database initialization
// import routes from './routes';

// Import socket handlers
import { initializeSocket } from './socket';

// Import utilities
import logger from './utils/logger';

// Import types
import { AppConfig } from './types/database.types';

interface AppInitializationResult {
  success: boolean;
  message: string;
  errors?: Array<{ service: string; error: string }>;
}

class App {
  public app: express.Application;
  public server: any;
  public io: SocketServer;
  public config: AppConfig;
  private isInitialized: boolean = false;

  constructor() {
    this.config = getConfig();
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketServer(this.server, {
      cors: {
        origin: this.config.cors.origin,
        credentials: this.config.cors.credentials,
      },
    });

    this.initializeSwagger();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeSocket();
  }

  private initializeSwagger() {
    const swaggerDefinition = {
      openapi: '3.0.0',
      info: {
        title: 'UrutiBiz Backend API',
        version: '1.0.0',
        description: 'API documentation for UrutiBiz platform',
      },
      servers: [
        { url: '/api/v1', description: 'Main API server' },
      ],
      components: {},
    };
    const options = {
      swaggerDefinition,
      apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
    };
    const swaggerSpec = swaggerJsdoc(options);
    
    // Serve Swagger UI
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    
    // Serve Swagger JSON specification
    this.app.get('/api-docs.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: this.config.nodeEnv === 'production' ? undefined : false,
    }));
    this.app.use(compression());
    
    // CORS
    this.app.use(corsMiddleware);
    
    // Rate limiting
    this.app.use(rateLimitMiddleware);
    
    // Body parsing
    this.app.use(express.json({ 
      limit: `${Math.floor(this.config.upload.maxFileSize / 1024 / 1024)}mb` 
    }));
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: `${Math.floor(this.config.upload.maxFileSize / 1024 / 1024)}mb` 
    }));
    
    // Logging
    if (this.config.nodeEnv !== 'test') {
      this.app.use(loggingMiddleware);
      this.app.use(morgan(this.config.nodeEnv === 'production' ? 'combined' : 'dev'));
    }
    
    // Passport configuration
    configurePassport();
    
    // Security headers
    this.app.use(securityMiddleware);
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: this.config.nodeEnv,
        version: process.env.npm_package_version || '1.0.0',
        memory: process.memoryUsage(),
      });
    });

    // API routes - will be loaded after database initialization
    // this.app.use(this.config.apiPrefix, routes);

    // 404 handler will be added after API routes are loaded
  }

  private async loadApiRoutes(): Promise<void> {
    try {
      const { default: routes } = await import('./routes');
      console.log('🔧 [App] Mounting API routes at', this.config.apiPrefix);
      this.app.use(this.config.apiPrefix, routes);
      
      // Add 404 handler AFTER API routes are mounted
      this.app.use('*', (req, res) => {
        res.status(404).json({
          success: false,
          message: 'Route not found',
          path: req.originalUrl,
          timestamp: new Date().toISOString(),
        });
      });
      
      logger.info('✅ API routes loaded successfully');
    } catch (error) {
      logger.error('❌ Failed to load API routes:', error);
      throw error;
    }
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private initializeSocket(): void {
    initializeSocket(this.io);
  }

  public async initialize(): Promise<AppInitializationResult> {
    if (this.isInitialized) {
      return { success: true, message: 'Application already initialized' };
    }

    const errors: Array<{ service: string; error: string }> = [];
    
    // Check if we're in demo mode (completely skip external services)
    const isDemoMode = this.config.nodeEnv === 'demo';
    const isDevelopment = this.config.nodeEnv === 'development';
    
    if (isDemoMode) {
      logger.info('🚀 Running in DEMO mode - all external services disabled');
      
      // Seed demo data for demo mode
      try {
        const Product = (await import('@/models/Product.model')).default;
        const Booking = (await import('@/models/Booking.model')).default;
        
        await Product.seed();
        await Booking.seed();
        
        logger.info('✅ Demo data seeded successfully');
      } catch (seedError) {
        logger.warn('⚠️ Failed to seed demo data:', seedError instanceof Error ? seedError.message : 'Unknown error');
      }
      
      // Load API routes for demo mode
      await this.loadApiRoutes();
      
      this.isInitialized = true;
      return { success: true, message: 'Application initialized in demo mode (no external services)' };
    }
    
    try {
      // Connect to database
      await connectDatabase();
      logger.info('✅ Database connected successfully (before handling any requests)');
      
      // Load API routes after database is connected
      await this.loadApiRoutes();
    } catch (error) {
      const errorMessage = `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(`❌ ${errorMessage}`);
      errors.push({ service: 'database', error: errorMessage });
      
      if (isDevelopment) {
        logger.warn('⚠️ Development mode: continuing without database connection');
        // Load API routes even without database for testing
        try {
          await this.loadApiRoutes();
          logger.info('✅ API routes loaded in development mode (without database)');
        } catch (routeError) {
          logger.error('❌ Failed to load API routes even without database:', routeError);
          process.exit(1);
        }
      } else {
        // Hard exit if DB connection fails in production
        process.exit(1);
      }
    }

    // Connect to Redis (optional, continue if it fails)
    try {
      await connectRedis();
      logger.info('✅ Redis connected successfully');
    } catch (redisError) {
      const errorMessage = `Redis connection failed: ${redisError instanceof Error ? redisError.message : 'Unknown error'}`;
      
      if (isDevelopment) {
        logger.warn(`⚠️ ${errorMessage} (continuing in development mode)`);
      } else {
        logger.warn(`⚠️ ${errorMessage} (Redis is optional, continuing without caching)`);
      }
      errors.push({ service: 'redis', error: errorMessage });
    }

    this.isInitialized = true;

    if (errors.length > 0 && !isDevelopment) {
      logger.warn(`Application initialized with ${errors.length} service(s) failing`);
      return {
        success: false,
        message: `Application partially initialized with some services failing`,
        errors
      };
    }

    if (isDevelopment && errors.length > 0) {
      logger.info(`✅ Application initialized in development mode (${errors.length} services unavailable)`);
      return {
        success: true,
        message: `Application initialized in development mode with some services unavailable`,
        errors
      };
    }

    logger.info('✅ Application initialized successfully');
    return { success: true, message: 'Application initialized successfully' };
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down application...');
    
    // Close socket connections
    this.io.close();
    
    // Close server
    this.server.close(() => {
      logger.info('HTTP server closed');
    });
    
    // Additional cleanup can be added here
    logger.info('Application shutdown completed');
  }

  public getServer() {
    return this.server;
  }

  public getApp() {
    return this.app;
  }

  public getIO() {
    return this.io;
  }

  public getConfig() {
    return this.config;
  }

  public isAppInitialized(): boolean {
    return this.isInitialized;
  }
}

export default App;
