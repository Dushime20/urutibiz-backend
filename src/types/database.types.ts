import { Environment } from './common.types';

// Re-export Environment for convenience
export { Environment };

// Database Configuration Types
export interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  ssl: boolean;
  maxConnections?: number;
  idleTimeoutMs?: number;
  connectionTimeoutMs?: number;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  maxRetriesPerRequest?: number;
  retryDelayOnFailover?: number;
  enableOfflineQueue?: boolean;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
  issuer?: string;
  audience?: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
}

export interface AwsConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  s3Bucket: string;
}

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface CorsConfig {
  origin: string[];
  credentials: boolean;
}

export interface UploadConfig {
  maxFileSize: number;
  allowedFileTypes: string[];
}

export interface LoggingConfig {
  level: string;
  file: string;
}

export interface AiConfig {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
  groqApiKey?: string;
}

export interface AdminConfig {
  email: string;
  password: string;
}

export interface SwaggerConfig {
  enabled: boolean;
}

// Main Application Configuration
export interface AppConfig {
  nodeEnv: Environment;
  port: number;
  apiPrefix: string;
  frontendUrl: string;
  database: DatabaseConfig;
  redis: RedisConfig;
  jwt: JwtConfig;
  encryption: {
    bcryptRounds: number;
    encryptionKey: string;
  };
  email: EmailConfig;
  twilio: TwilioConfig;
  stripe: StripeConfig;
  aws: AwsConfig;
  cloudinary: CloudinaryConfig;
  rateLimit: RateLimitConfig;
  cors: CorsConfig;
  upload: UploadConfig;
  logging: LoggingConfig;
  ai: AiConfig;
  admin: AdminConfig;
  swagger: SwaggerConfig;
}

// Database Query Types
export interface DatabaseConnection {
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string;
  ssl?: boolean;
}

export interface QueryOptions {
  select?: string[];
  where?: Record<string, any>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  limit?: number;
  offset?: number;
  include?: string[];
}

export interface TransactionOptions {
  isolationLevel?: 'read_uncommitted' | 'read_committed' | 'repeatable_read' | 'serializable';
  timeout?: number;
}
