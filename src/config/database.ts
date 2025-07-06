import knex, { Knex } from 'knex';
import { getConfig } from './config';
import logger from '../utils/logger';

const config = getConfig();

// Build connection string for cloud databases like Neon
const buildConnectionString = (): string => {
  const { host, port, name, user, password, ssl } = config.database;
  const sslMode = ssl ? 'require' : 'prefer';
  return `postgresql://${user}:${password}@${host}:${port}/${name}?sslmode=${sslMode}`;
};

// Database configuration with graceful failure handling
const dbConfig: Knex.Config = {
  client: 'postgresql',
  connection: config.database.ssl ? 
    buildConnectionString() : 
    {
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
    },
  pool: {
    // Dynamic pool sizing based on environment
    min: process.env.NODE_ENV === 'production' ? 5 : 2,
    max: config.database.maxConnections || (process.env.NODE_ENV === 'production' ? 25 : 10),
    
    // Connection timeouts - much shorter for development
    createTimeoutMillis: config.database.connectionTimeoutMs || 3000,
    acquireTimeoutMillis: 5000,
    idleTimeoutMillis: config.database.idleTimeoutMs || 10000,
    
    // Health check after connection creation
    afterCreate: (conn: any, done: any) => {
      // Validate connection with a simple query
      conn.query('SELECT 1 as health_check', (err: any) => {
        if (err) {
          logger.error('Database connection health check failed:', err);
        } else {
          logger.debug('Database connection validated successfully');
        }
        done(err, conn);
      });
    }
  },
  acquireConnectionTimeout: 10000, // Reduced from 60 seconds
  migrations: {
    directory: './database/migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './database/seeds',
  },
};

// Create database instance
let database: Knex | undefined;

export const connectDatabase = async (): Promise<void> => {
  try {
    database = knex(dbConfig);
    
    // Set up pool monitoring
    setupPoolMonitoring();
    
    // Test the connection with health check with timeout
    const healthCheckStart = Date.now();
    
    // Create a promise that rejects after 5 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timeout after 5 seconds')), 5000);
    });
    
    // Race between the health check and timeout
    await Promise.race([
      database.raw('SELECT 1+1 as result, NOW() as timestamp'),
      timeoutPromise
    ]);
    
    const healthCheckTime = Date.now() - healthCheckStart;
    
    dbMetrics.lastHealthCheck = new Date();
    dbMetrics.avgQueryTime = healthCheckTime;
    
    logger.info(`Database connected successfully (health check: ${healthCheckTime}ms)`);
  } catch (error) {
    dbMetrics.connectionErrors++;
    logger.error('Failed to connect to database:', error);
    throw error;
  }
};

// Performance monitoring for database pool
interface DatabaseMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
  totalQueries: number;
  avgQueryTime: number;
  connectionErrors: number;
  lastHealthCheck: Date;
}

let dbMetrics: DatabaseMetrics = {
  totalConnections: 0,
  activeConnections: 0,
  idleConnections: 0,
  waitingClients: 0,
  totalQueries: 0,
  avgQueryTime: 0,
  connectionErrors: 0,
  lastHealthCheck: new Date()
};

// Pool monitoring setup
const setupPoolMonitoring = (): void => {
  if (!database) return;
  
  // Monitor pool statistics
  setInterval(() => {
    try {
      const pool = (database as any).client?.pool;
      if (pool) {
        dbMetrics.totalConnections = pool.numUsed() + pool.numFree();
        dbMetrics.activeConnections = pool.numUsed();
        dbMetrics.idleConnections = pool.numFree();
        dbMetrics.waitingClients = pool.numPendingAcquires();
        
        // Log warning if pool is under stress
        const utilizationRate = dbMetrics.activeConnections / (dbConfig.pool?.max || 10);
        if (utilizationRate > 0.8) {
          logger.warn(`High database pool utilization: ${(utilizationRate * 100).toFixed(1)}%`);
        }
      }
    } catch (error) {
      logger.debug('Pool monitoring error:', (error instanceof Error ? error.message : String(error)));
    }
  }, 30000); // Check every 30 seconds
  
  // Health check interval
  setInterval(async () => {
    try {
      const healthCheckStart = Date.now();
      await database?.raw('SELECT 1 as health_check');
      const healthCheckTime = Date.now() - healthCheckStart;
      
      dbMetrics.lastHealthCheck = new Date();
      
      // Update average query time
      dbMetrics.totalQueries++;
      dbMetrics.avgQueryTime = 
        (dbMetrics.avgQueryTime * (dbMetrics.totalQueries - 1) + healthCheckTime) / 
        dbMetrics.totalQueries;
        
      // Log warning for slow health checks
      if (healthCheckTime > 1000) {
        logger.warn(`Slow database health check: ${healthCheckTime}ms`);
      }
    } catch (error) {
      dbMetrics.connectionErrors++;
      logger.error('Database health check failed:', error);
    }
  }, 60000); // Health check every minute
};

/**
 * Get database performance metrics
 */
export const getDatabaseMetrics = (): DatabaseMetrics & { 
  utilizationRate: number; 
  performance: string;
  connectionPoolStatus: string;
} => {
  const utilizationRate = dbMetrics.totalConnections > 0 
    ? dbMetrics.activeConnections / dbMetrics.totalConnections 
    : 0;
    
  const performance = dbMetrics.avgQueryTime < 100 ? 'Excellent'
    : dbMetrics.avgQueryTime < 250 ? 'Good'
    : dbMetrics.avgQueryTime < 500 ? 'Fair'
    : 'Poor';
    
  const connectionPoolStatus = utilizationRate < 0.5 ? 'Healthy'
    : utilizationRate < 0.8 ? 'Busy'
    : 'Overloaded';
  
  return {
    ...dbMetrics,
    utilizationRate,
    performance,
    connectionPoolStatus
  };
};

/**
 * Database health check with detailed diagnostics
 */
export const performDatabaseHealthCheck = async (): Promise<{
  healthy: boolean;
  responseTime: number;
  poolStatus: any;
  errors: string[];
}> => {
  const errors: string[] = [];
  const startTime = Date.now();
  
  try {
    // Basic connectivity test
    await database?.raw('SELECT 1 as test');
    
    // Pool status check
    const pool = (database as any)?.client?.pool;
    const poolStatus = pool ? {
      used: pool.numUsed(),
      free: pool.numFree(),
      pending: pool.numPendingAcquires(),
      min: pool.min,
      max: pool.max
    } : null;
    
    const responseTime = Date.now() - startTime;
    
    // Health criteria
    if (responseTime > 1000) {
      errors.push(`Slow response time: ${responseTime}ms`);
    }
    
    if (poolStatus && poolStatus.used / poolStatus.max > 0.9) {
      errors.push('Connection pool near capacity');
    }
    
    if (poolStatus && poolStatus.pending > 5) {
      errors.push(`High pending connections: ${poolStatus.pending}`);
    }
    
    return {
      healthy: errors.length === 0,
      responseTime,
      poolStatus,
      errors
    };
    
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    errors.push(`Database connection failed: ${errorMessage}`);
    return {
      healthy: false,
      responseTime: Date.now() - startTime,
      poolStatus: null,
      errors
    };
  }
};

export { dbConfig };

/**
 * Get database instance for repositories
 */
export const getDatabase = (): Knex => {
  if (!database) {
    database = knex(dbConfig);
  }
  return database;
};

// Export the database instance directly as well
export { database as knex };
