export enum NotificationType {
  // Messaging related
  MESSAGE_RECEIVED = 'message_received',

  // Inspection related
  INSPECTION_SCHEDULED = 'inspection_scheduled',
  INSPECTION_STARTED = 'inspection_started',
  INSPECTION_COMPLETED = 'inspection_completed',
  INSPECTION_CANCELLED = 'inspection_cancelled',
  INSPECTION_REMINDER = 'inspection_reminder',
  
  // Dispute related
  DISPUTE_RAISED = 'dispute_raised',
  DISPUTE_RESOLVED = 'dispute_resolved',
  DISPUTE_ESCALATED = 'dispute_escalated',
  
  // Booking related
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_REMINDER = 'booking_reminder',
  
  // Payment related
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_REMINDER = 'payment_reminder',
  
  // System related
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SYSTEM_UPDATE = 'system_update',
  SECURITY_ALERT = 'security_alert',
  
  // User related
  ACCOUNT_VERIFIED = 'account_verified',
  PASSWORD_RESET = 'password_reset',
  PROFILE_UPDATED = 'profile_updated',
  
  // General
  REMINDER = 'reminder',
  SYSTEM = 'system',
  SECURITY = 'security',
  
  // Risk Management related
  RISK_COMPLIANCE_REQUIRED = 'risk_compliance_required',
  RISK_ESCALATION = 'risk_escalation',
  RISK_VIOLATION_DETECTED = 'risk_violation_detected',
  RISK_VIOLATION_RESOLVED = 'risk_violation_resolved',
  
  // Product related
  PRODUCT_CREATED = 'product_created',
  PRODUCT_MODERATED = 'product_moderated',
  PRODUCT_APPROVED = 'product_approved',
  PRODUCT_REJECTED = 'product_rejected',
  PRODUCT_FLAGGED = 'product_flagged',
  PRODUCT_QUARANTINED = 'product_quarantined'
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WEBHOOK = 'webhook',
  IN_APP = 'in_app'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  DELIVERED = 'delivered',
  PARTIALLY_DELIVERED = 'partially_delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export interface NotificationData {
  id: string;
  type: NotificationType;
  recipientId: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  status: NotificationStatus;
  scheduledAt: Date;
  deliveredAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  channelResults?: Record<NotificationChannel, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationData {
  type: NotificationType;
  recipientId: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  status?: NotificationStatus;
  scheduledAt?: Date;
  deliveredAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  channelResults?: Record<NotificationChannel, any>;
}

export interface UpdateNotificationData {
  title?: string;
  message?: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  status?: NotificationStatus;
  scheduledAt?: Date;
  deliveredAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  channelResults?: Record<NotificationChannel, any>;
  // Read status fields
  isRead?: boolean;
  readAt?: Date;
}

export interface NotificationPreferences {
  userId: string;
  email: boolean;
  sms: boolean;
  push: boolean;
  webhook: boolean;
  inApp: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;   // HH:mm format
    timezone: string;
  };
  types: Record<NotificationType, {
    email: boolean;
    sms: boolean;
    push: boolean;
    webhook: boolean;
    inApp: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  title: string;
  message: string;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationStatistics {
  total: number;
  delivered: number;
  pending: number;
  failed: number;
  byType: Record<NotificationType, number>;
  byChannel: Record<NotificationChannel, number>;
  byStatus: Record<NotificationStatus, number>;
  byPriority: Record<NotificationPriority, number>;
}

// Channel-specific interfaces
export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  data?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType: string;
  }>;
}

export interface SMSPayload {
  to: string;
  message: string;
  data?: Record<string, any>;
}

export interface PushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  image?: string;
}

export interface WebhookPayload {
  url: string;
  payload: Record<string, any>;
  headers?: Record<string, string>;
  method?: 'POST' | 'PUT' | 'PATCH';
}

// Service response interfaces
export interface ChannelResult {
  success: boolean;
  messageId?: string;
  error?: string;
  deliveredAt?: Date;
}

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  channelResults: Record<NotificationChannel, ChannelResult>;
  errors?: string[];
}

// Queue interfaces
export interface QueuedNotification {
  id: string;
  notificationId: string;
  scheduledAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}
