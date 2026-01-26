/**
 * Redis Configuration and Connection Management
 * 
 * Provides a centralized Redis client with connection lifecycle management,
 * utility functions, and robust error handling. Supports both ESM and CommonJS.
 * 
 * @module RedisConfig
 * @version 1.0.0
 * @author UrutiBiz Backend Team
 */

import { createClient, RedisClientOptions, RedisClientType } from 'redis';
import { getConfig } from './config';
import logger from '../utils/logger';

// Types and Interfaces
interface RedisConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  lastConnectionAttempt?: number; // Use timestamp instead of Date object
  connectionAttempts: number;
  reconnectPromise?: Promise<void>; // Track ongoing reconnection
}

interface RedisMetrics {
  totalCommands: number;
  failedCommands: number;
  connectionUptime: number;
  lastResetTime: number;
}

interface RedisOperationQueue {
  operations: Array<() => Promise<any>>;
  isProcessing: boolean;
}

// Performance optimized cached regex patterns
const INVALID_KEY_CHARS_REGEX = /[\n\r]/;
const MAX_KEY_LENGTH = 512;

/**
 * Custom Redis error types for better error handling
 */
export class RedisConnectionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'RedisConnectionError';
  }
}

export class RedisOperationError extends Error {
  constructor(message: string, public readonly operation: string, public readonly cause?: Error) {
    super(message);
    this.name = 'RedisOperationError';
  }
}

// Configuration and state management
const config = getConfig();

// Performance: Cache frequently accessed config values
const REDIS_CONFIG = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  enabled: process.env.REDIS_ENABLED !== 'false',
} as const;

let redisClient: RedisClientType | null = null;
let connectionState: RedisConnectionState = {
  isConnected: false,
  isConnecting: false,
  connectionAttempts: 0,
};
let metrics: RedisMetrics = {
  totalCommands: 0,
  failedCommands: 0,
  connectionUptime: 0,
  lastResetTime: Date.now(),
};

// Operation queue for handling requests during reconnection
let operationQueue: RedisOperationQueue = {
  operations: [],
  isProcessing: false,
};

// Constants
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000; // Base delay for exponential backoff
const CONNECTION_TIMEOUT_MS = 10000;
const MAX_QUEUE_SIZE = 1000; // Prevent memory overflow

/**
 * High-performance Redis key validation with cached regex
 * @param key - The Redis key to validate
 * @throws {RedisOperationError} When key is invalid
 */
const validateRedisKey = (key: string): void => {
  // Fast path: type and length check first (most common cases)
  if (!key) {
    throw new RedisOperationError('Redis key must be a non-empty string', 'validation');
  }
  if (typeof key !== 'string') {
    throw new RedisOperationError('Redis key must be a string', 'validation');
  }
  if (key.length > MAX_KEY_LENGTH) {
    throw new RedisOperationError(`Redis key exceeds maximum length of ${MAX_KEY_LENGTH} characters`, 'validation');
  }

  // More expensive regex check last
  if (INVALID_KEY_CHARS_REGEX.test(key)) {
    throw new RedisOperationError('Redis key contains invalid characters', 'validation');
  }
};

/**
 * Optimized exponential backoff delay calculation
 * @param attempt - Current attempt number
 * @returns Delay in milliseconds
 */
const calculateBackoffDelay = (attempt: number): number => {
  const exponentialDelay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
  return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
};

/**
 * Process queued operations during reconnection
 */
const processOperationQueue = async (): Promise<void> => {
  if (operationQueue.isProcessing || !connectionState.isConnected) {
    return;
  }

  operationQueue.isProcessing = true;

  try {
    while (operationQueue.operations.length > 0 && connectionState.isConnected) {
      const operation = operationQueue.operations.shift();
      if (operation) {
        try {
          await operation();
        } catch (error) {
          logger.error('Queued Redis operation failed:', error);
        }
      }
    }
  } finally {
    operationQueue.isProcessing = false;
  }
};

/**
 * Fast client getter with minimal validation
 * @returns {RedisClientType} The active Redis client
 * @throws {RedisConnectionError} When client is not available
 */
const getClientFast = (): RedisClientType => {
  if (!redisClient || !connectionState.isConnected) {
    throw new RedisConnectionError('Redis client not available');
  }
  return redisClient;
};

/**
 * Sleep utility for retry delays
 * @param ms - Milliseconds to sleep
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Establishes connection to Redis server with retry logic and comprehensive error handling
 * @param retryAttempt - Current retry attempt (internal use)
 * @throws {RedisConnectionError} When connection fails after all retry attempts
 */
export const connectRedis = async (retryAttempt: number = 0): Promise<void> => {
  // Fast path: Check if Redis is disabled
  if (!REDIS_CONFIG.enabled) {
    logger.info('Redis is disabled by configuration. Skipping Redis connection.');
    return;
  }

  // Prevent concurrent connection attempts with promise reuse
  if (connectionState.isConnecting && connectionState.reconnectPromise) {
    logger.debug('Redis connection attempt already in progress, reusing promise');
    return connectionState.reconnectPromise;
  }

  // Fast path: Check if already connected
  if (redisClient && connectionState.isConnected) {
    logger.debug('Redis client already connected');
    return;
  }

  // Set connection state immediately to prevent race conditions
  connectionState.isConnecting = true;
  connectionState.lastConnectionAttempt = Date.now();
  connectionState.connectionAttempts++;

  // Create and cache the connection promise
  const connectionPromise = async (): Promise<void> => {
    try {
      const redisConfig: RedisClientOptions = {
        socket: {
          host: REDIS_CONFIG.host,
          port: REDIS_CONFIG.port,
          connectTimeout: CONNECTION_TIMEOUT_MS,
          // Performance optimizations
          reconnectStrategy: (retries) => {
            if (retries > MAX_RETRY_ATTEMPTS) {
              logger.error(`Redis reconnection failed after ${retries} attempts`);
              return false;
            }
            return calculateBackoffDelay(retries);
          },
        },
        database: REDIS_CONFIG.db,
        // Performance: Optimize for high throughput
        commandsQueueMaxLength: 1000,
      };

      if (REDIS_CONFIG.password) {
        redisConfig.password = REDIS_CONFIG.password;
      }

      redisClient = createClient(redisConfig) as RedisClientType;

      // Optimized event listeners
      redisClient.on('error', (error) => {
        connectionState.isConnected = false;
        metrics.failedCommands++;
        logger.error('Redis Client Error:', {
          error: error.message,
          attempt: connectionState.connectionAttempts,
        });
      });

      redisClient.on('connect', () => {
        connectionState.isConnected = true;
        connectionState.isConnecting = false;
        metrics.connectionUptime = Date.now();

        // Process any queued operations
        setImmediate(() => processOperationQueue());

        logger.info('✅ Redis Client Connected', {
          host: REDIS_CONFIG.host,
          port: REDIS_CONFIG.port,
          attempt: connectionState.connectionAttempts,
        });
      });

      redisClient.on('reconnecting', () => {
        connectionState.isConnected = false;
        logger.info('🔄 Redis Client Reconnecting...', {
          attempts: connectionState.connectionAttempts,
        });
      });

      redisClient.on('ready', () => {
        connectionState.isConnected = true;
        logger.info('✅ Redis Client Ready for commands');
      });

      redisClient.on('end', () => {
        connectionState.isConnected = false;
        connectionState.isConnecting = false;
        logger.info('Redis Client Connection Ended');
      });

      await redisClient.connect();

    } catch (error) {
      connectionState.isConnecting = false;
      connectionState.isConnected = false;

      logger.error(`Failed to connect to Redis (attempt ${retryAttempt + 1}/${MAX_RETRY_ATTEMPTS})`, {
        error: error instanceof Error ? error.message : String(error),
        host: REDIS_CONFIG.host,
        port: REDIS_CONFIG.port,
      });

      // Exponential backoff retry logic
      if (retryAttempt < MAX_RETRY_ATTEMPTS - 1) {
        const delay = calculateBackoffDelay(retryAttempt);
        logger.info(`Retrying Redis connection in ${delay}ms...`);
        await sleep(delay);
        return connectRedis(retryAttempt + 1);
      }

      throw new RedisConnectionError(
        `Failed to connect to Redis after ${MAX_RETRY_ATTEMPTS} attempts`,
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      connectionState.reconnectPromise = undefined;
    }
  };

  connectionState.reconnectPromise = connectionPromise();
  return connectionState.reconnectPromise;
};

/**
 * Gets the Redis client instance
 * @returns {RedisClientType} The active Redis client
 * @throws {RedisConnectionError} When client is not initialized or not connected
 */
export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new RedisConnectionError('Redis client not initialized. Call connectRedis() first.');
  }
  if (!connectionState.isConnected) {
    throw new RedisConnectionError('Redis client not connected. Check connection status.');
  }
  return redisClient;
};

/**
 * Gracefully closes the Redis connection
 * @param timeout - Maximum time to wait for graceful shutdown (ms)
 */
export const closeRedis = async (timeout: number = 5000): Promise<void> => {
  if (!redisClient) {
    logger.info('Redis client not initialized, nothing to close');
    return;
  }

  try {
    // Set a timeout for graceful shutdown
    const closePromise = redisClient.quit();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Redis close timeout')), timeout)
    );

    await Promise.race([closePromise, timeoutPromise]);

    connectionState.isConnected = false;
    connectionState.isConnecting = false;
    redisClient = null;

    logger.info('Redis connection closed gracefully');
  } catch (error) {
    logger.error('Error during Redis shutdown:', error);
    // Force close if graceful shutdown fails
    if (redisClient) {
      try {
        await redisClient.disconnect();
        redisClient = null;
      } catch (forceCloseError) {
        logger.error('Failed to force close Redis connection:', forceCloseError);
      }
    }
    throw new RedisConnectionError(
      'Failed to close Redis connection gracefully',
      error instanceof Error ? error : new Error(String(error))
    );
  }
};

/**
 * Checks if Redis is connected and ready
 * @returns {boolean} True if connected and ready
 */
export const isRedisConnected = (): boolean => {
  return redisClient !== null && connectionState.isConnected;
};

/**
 * Gets current Redis connection metrics (optimized to avoid object creation)
 * @returns {RedisMetrics & RedisConnectionState} Current metrics and connection state
 */
const cachedMetrics = {} as RedisMetrics & RedisConnectionState;
export const getRedisMetrics = (): RedisMetrics & RedisConnectionState => {
  // Reuse the same object to avoid memory allocation
  cachedMetrics.totalCommands = metrics.totalCommands;
  cachedMetrics.failedCommands = metrics.failedCommands;
  cachedMetrics.connectionUptime = connectionState.isConnected ? Date.now() - metrics.connectionUptime : 0;
  cachedMetrics.lastResetTime = metrics.lastResetTime;
  cachedMetrics.isConnected = connectionState.isConnected;
  cachedMetrics.isConnecting = connectionState.isConnecting;
  cachedMetrics.lastConnectionAttempt = connectionState.lastConnectionAttempt;
  cachedMetrics.connectionAttempts = connectionState.connectionAttempts;

  return cachedMetrics;
};

/**
 * High-performance Redis GET operation
 * @param key - The Redis key to retrieve
 * @returns {Promise<string | null>} The value or null if key doesn't exist
 * @throws {RedisOperationError} When operation fails
 */
export const get = async (key: string): Promise<string | null> => {
  validateRedisKey(key);

  try {
    const client = getClientFast();
    metrics.totalCommands++;
    const result = await client.get(key);

    // Only log in development/debug mode to avoid performance hit
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Redis GET operation', { key, hasValue: result !== null });
    }

    return result;
  } catch (error) {
    metrics.failedCommands++;

    // Queue operation if connection is lost
    if (!connectionState.isConnected && operationQueue.operations.length < MAX_QUEUE_SIZE) {
      return new Promise((resolve, reject) => {
        operationQueue.operations.push(async () => {
          try {
            const result = await get(key);
            resolve(result);
          } catch (retryError) {
            reject(retryError);
          }
        });
      });
    }

    logger.error('Redis GET operation failed', { key, error: error instanceof Error ? error.message : String(error) });
    throw new RedisOperationError(
      `Failed to get key: ${key}`,
      'GET',
      error instanceof Error ? error : new Error(String(error))
    );
  }
};

/**
 * High-performance Redis SET operation with batch optimization
 * @param key - The Redis key to set
 * @param value - The value to store (will be converted to string)
 * @param expireInSeconds - Optional expiration time in seconds
 * @throws {RedisOperationError} When operation fails
 */
export const set = async (
  key: string,
  value: string | number | boolean,
  expireInSeconds?: number
): Promise<void> => {
  validateRedisKey(key);

  if (value === null || value === undefined) {
    throw new RedisOperationError('Redis value cannot be null or undefined', 'SET');
  }

  // Pre-convert to string to avoid repeated conversion
  const stringValue = String(value);

  try {
    const client = getClientFast();
    metrics.totalCommands++;

    // Use more efficient SETEX when expiration is provided
    if (expireInSeconds && expireInSeconds > 0) {
      await client.setEx(key, expireInSeconds, stringValue);
    } else {
      await client.set(key, stringValue);
    }

    // Performance logging only in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Redis SET operation', {
        key,
        expireInSeconds,
        valueLength: stringValue.length
      });
    }

  } catch (error) {
    metrics.failedCommands++;

    // Queue operation if connection is lost
    if (!connectionState.isConnected && operationQueue.operations.length < MAX_QUEUE_SIZE) {
      operationQueue.operations.push(() => set(key, value, expireInSeconds));
      return;
    }

    logger.error('Redis SET operation failed', {
      key,
      error: error instanceof Error ? error.message : String(error)
    });
    throw new RedisOperationError(
      `Failed to set key: ${key}`,
      'SET',
      error instanceof Error ? error : new Error(String(error))
    );
  }
};

/**
 * High-performance Redis DEL operation
 * @param key - The Redis key to delete
 * @returns {Promise<number>} Number of keys deleted (0 or 1)
 * @throws {RedisOperationError} When operation fails
 */
export const del = async (key: string): Promise<number> => {
  validateRedisKey(key);

  try {
    const client = getClientFast();
    metrics.totalCommands++;
    const result = await client.del(key);

    if (process.env.NODE_ENV === 'development') {
      logger.debug('Redis DEL operation', { key, deleted: result });
    }

    return result;
  } catch (error) {
    metrics.failedCommands++;
    logger.error('Redis DEL operation failed', {
      key,
      error: error instanceof Error ? error.message : String(error)
    });
    throw new RedisOperationError(
      `Failed to delete key: ${key}`,
      'DEL',
      error instanceof Error ? error : new Error(String(error))
    );
  }
};

/**
 * High-performance Redis EXISTS operation
 * @param key - The Redis key to check
 * @returns {Promise<boolean>} True if key exists, false otherwise
 * @throws {RedisOperationError} When operation fails
 */
export const exists = async (key: string): Promise<boolean> => {
  validateRedisKey(key);

  try {
    const client = getClientFast();
    metrics.totalCommands++;
    const result = await client.exists(key);

    if (process.env.NODE_ENV === 'development') {
      logger.debug('Redis EXISTS operation', { key, exists: result === 1 });
    }

    return result === 1;
  } catch (error) {
    metrics.failedCommands++;
    logger.error('Redis EXISTS operation failed', {
      key,
      error: error instanceof Error ? error.message : String(error)
    });
    throw new RedisOperationError(
      `Failed to check if key exists: ${key}`,
      'EXISTS',
      error instanceof Error ? error : new Error(String(error))
    );
  }
};

/**
 * High-performance Redis EXPIRE operation
 * @param key - The Redis key
 * @param seconds - Expiration time in seconds
 * @returns {Promise<boolean>} True if expiration was set, false if key doesn't exist
 * @throws {RedisOperationError} When operation fails
 */
export const expire = async (key: string, seconds: number): Promise<boolean> => {
  validateRedisKey(key);

  if (seconds <= 0) {
    throw new RedisOperationError('Expiration time must be positive', 'EXPIRE');
  }

  try {
    const client = getClientFast();
    metrics.totalCommands++;
    const result = await client.expire(key, seconds);

    if (process.env.NODE_ENV === 'development') {
      logger.debug('Redis EXPIRE operation', { key, seconds, success: result });
    }

    return result;
  } catch (error) {
    metrics.failedCommands++;
    logger.error('Redis EXPIRE operation failed', {
      key,
      seconds,
      error: error instanceof Error ? error.message : String(error)
    });
    throw new RedisOperationError(
      `Failed to set expiration for key: ${key}`,
      'EXPIRE',
      error instanceof Error ? error : new Error(String(error))
    );
  }
};

/**
 * Batch Redis operations for improved performance
 * @param operations - Array of Redis operations to execute
 * @returns Promise of results array
 */
export const batchOperations = async (
  operations: Array<{ type: 'GET' | 'SET' | 'DEL' | 'EXISTS', key: string, value?: any, ttl?: number }>
): Promise<any[]> => {
  if (operations.length === 0) return [];

  try {
    const client = getClientFast();
    const pipeline = client.multi();

    for (const op of operations) {
      validateRedisKey(op.key);

      switch (op.type) {
        case 'GET':
          pipeline.get(op.key);
          break;
        case 'SET':
          if (op.ttl) {
            pipeline.setEx(op.key, op.ttl, String(op.value));
          } else {
            pipeline.set(op.key, String(op.value));
          }
          break;
        case 'DEL':
          pipeline.del(op.key);
          break;
        case 'EXISTS':
          pipeline.exists(op.key);
          break;
      }
    }

    metrics.totalCommands += operations.length;
    const results = await pipeline.exec();

    if (process.env.NODE_ENV === 'development') {
      logger.debug('Redis batch operation completed', {
        operationCount: operations.length,
        success: true
      });
    }

    return results;
  } catch (error) {
    metrics.failedCommands += operations.length;
    logger.error('Redis batch operation failed', {
      operationCount: operations.length,
      error: error instanceof Error ? error.message : String(error)
    });
    throw new RedisOperationError(
      'Failed to execute batch operations',
      'BATCH',
      error instanceof Error ? error : new Error(String(error))
    );
  }
};

/**
 * Reset metrics for monitoring
 */
export const resetMetrics = (): void => {
  metrics.totalCommands = 0;
  metrics.failedCommands = 0;
  metrics.lastResetTime = Date.now();
};

// Legacy function aliases for backward compatibility
/** @deprecated Use `get` instead */
export const redisGet = get;
/** @deprecated Use `set` instead */
export const redisSet = set;
/** @deprecated Use `del` instead */
export const redisDel = del;
/** @deprecated Use `exists` instead */
export const redisExists = exists;

// Default export for backward compatibility
export default getRedisClient;

// Named exports for modern usage
export {
  connectRedis as connect,
  closeRedis as close,
  getRedisClient as client,
  isRedisConnected as isConnected,
  getRedisMetrics as metrics,
};