import dotenv from 'dotenv';
import { AppConfig, Environment } from '../types/database.types';
import logger from '../utils/logger';

// Load environment variables first
dotenv.config();

/**
 * Validates required environment variables
 */
function validateRequiredEnvVars(): void {
  const required = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'ENCRYPTION_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Parses a comma-separated string into an array
 */
function parseStringArray(value?: string, fallback: string[] = []): string[] {
  if (!value) return fallback;
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

/**
 * Parses a string to boolean
 */
function parseBoolean(value?: string, fallback = false): boolean {
  if (!value) return fallback;
  return value.toLowerCase() === 'true';
}

/**
 * Parses a string to number with fallback
 */
function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Gets and validates the application configuration
 */
export function getConfig(): AppConfig {
  // Validate required environment variables in production
  if (process.env.NODE_ENV === 'production') {
    validateRequiredEnvVars();
  }

  console.log('[DEBUG] process.env.DB_USER:', process.env.DB_USER);
  console.log('[DEBUG] process.env.DB_PASSWORD:', process.env.DB_PASSWORD);

  const config: AppConfig = {
    nodeEnv: (process.env.NODE_ENV as Environment) || 'development',
    port: parseNumber(process.env.PORT, 3000),
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseNumber(process.env.DB_PORT, 5432),
      name: process.env.DB_NAME || 'urutibiz_dev',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      ssl: parseBoolean(process.env.DB_SSL),
      maxConnections: parseNumber(process.env.DB_MAX_CONNECTIONS, 10),
      idleTimeoutMs: parseNumber(process.env.DB_IDLE_TIMEOUT, 10000),
      connectionTimeoutMs: parseNumber(process.env.DB_CONNECTION_TIMEOUT, 2000),
    },
    
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseNumber(process.env.REDIS_PORT, 6379),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseNumber(process.env.REDIS_DB, 0),
      maxRetriesPerRequest: parseNumber(process.env.REDIS_MAX_RETRIES, 3),
      retryDelayOnFailover: parseNumber(process.env.REDIS_RETRY_DELAY, 100),
      enableOfflineQueue: parseBoolean(process.env.REDIS_OFFLINE_QUEUE, false),
    },
    
    jwt: {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: process.env.JWT_ISSUER || 'urutibiz',
      audience: process.env.JWT_AUDIENCE || 'urutibiz-users',
    },
    
    encryption: {
      bcryptRounds: parseNumber(process.env.BCRYPT_ROUNDS, 12),
      encryptionKey: process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key',
    },
    
    email: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseNumber(process.env.SMTP_PORT, 587),
      secure: parseBoolean(process.env.SMTP_SECURE),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      fromEmail: process.env.FROM_EMAIL || 'noreply@urutibiz.com',
      fromName: process.env.FROM_NAME || 'UrutiBiz',
    },
    
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    },
    
    stripe: {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
    
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || 'us-east-1',
      s3Bucket: process.env.AWS_S3_BUCKET || 'urutibiz-uploads',
    },
    
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      apiKey: process.env.CLOUDINARY_API_KEY || '',
      apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    },
    
    rateLimit: {
      windowMs: parseNumber(process.env.RATE_LIMIT_WINDOW, 15) * 60 * 1000,
      maxRequests: parseNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
    },
    
    cors: {
      origin: parseStringArray(process.env.CORS_ORIGIN, ['http://localhost:3000']),
      credentials: parseBoolean(process.env.CORS_CREDENTIALS, true),
    },
    
    upload: {
      maxFileSize: parseNumber(process.env.MAX_FILE_SIZE, 10485760), // 10MB
      allowedFileTypes: parseStringArray(process.env.ALLOWED_FILE_TYPES, ['jpg', 'jpeg', 'png', 'gif', 'pdf']),
    },
    
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      file: process.env.LOG_FILE || 'logs/app.log',
    },
    
    ai: {
      openaiApiKey: process.env.OPENAI_API_KEY,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    },
    
    admin: {
      email: process.env.ADMIN_EMAIL || 'admin@urutibiz.com',
      password: process.env.ADMIN_PASSWORD || 'SecureAdminPassword123!',
    },
    
    swagger: {
      enabled: parseBoolean(process.env.SWAGGER_ENABLED, false),
    },
  };

  return config;
}

// Export singleton config instance
const config = getConfig();
export default config;
