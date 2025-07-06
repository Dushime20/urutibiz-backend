// Notification System Types
export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationChannelType;
  subject_template?: string;
  body_template: string;
  language: string;
  is_active: boolean;
  created_at: Date;
}

export interface CreateNotificationTemplateDTO {
  name: string;
  type: NotificationChannelType;
  subject_template?: string;
  body_template: string;
  language?: string;
  is_active?: boolean;
}

export interface UpdateNotificationTemplateDTO {
  name?: string;
  type?: NotificationChannelType;
  subject_template?: string;
  body_template?: string;
  language?: string;
  is_active?: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  template_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  channels: NotificationChannelType[];
  is_read: boolean;
  read_at?: Date;
  sent_at?: Date;
  metadata?: Record<string, any>;
  action_url?: string;
  created_at: Date;
  expires_at?: Date;
}

export interface CreateNotificationDTO {
  user_id: string;
  template_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  channels?: NotificationChannelType[];
  metadata?: Record<string, any>;
  action_url?: string;
  expires_at?: Date;
}

export interface UpdateNotificationDTO {
  title?: string;
  message?: string;
  channels?: NotificationChannelType[];
  is_read?: boolean;
  metadata?: Record<string, any>;
  action_url?: string;
  expires_at?: Date;
}

export interface NotificationPreferences {
  user_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  notification_types: {
    [key in NotificationType]?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
      in_app?: boolean;
    };
  };
}

export interface BulkNotificationDTO {
  user_ids: string[];
  template_name?: string;
  type: NotificationType;
  title: string;
  message: string;
  channels?: NotificationChannelType[];
  metadata?: Record<string, any>;
  action_url?: string;
  expires_at?: Date;
}

export interface NotificationDeliveryStatus {
  notification_id: string;
  channel: NotificationChannelType;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  provider?: string;
  provider_id?: string;
  error_message?: string;
  delivered_at?: Date;
  created_at: Date;
}

export interface NotificationStats {
  total_sent: number;
  total_delivered: number;
  total_read: number;
  delivery_rate: number;
  read_rate: number;
  by_channel: {
    [K in NotificationChannelType]: {
      sent: number;
      delivered: number;
      failed: number;
    };
  };
  by_type: {
    [K in NotificationType]: {
      sent: number;
      delivered: number;
      read: number;
    };
  };
}

export interface TemplateVariables {
  [key: string]: string | number | boolean | Date;
}

export interface NotificationFilters {
  user_id?: string;
  type?: NotificationType;
  is_read?: boolean;
  channel?: NotificationChannelType;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
  offset?: number;
}

// Enums
export type NotificationChannelType = 'email' | 'sms' | 'push' | 'in_app';

export type NotificationType = 
  | 'booking_confirmed'
  | 'booking_cancelled' 
  | 'booking_reminder'
  | 'booking_updated'
  | 'payment_received'
  | 'payment_failed'
  | 'payment_refunded'
  | 'verification_complete'
  | 'verification_required'
  | 'new_review'
  | 'review_reminder'
  | 'account_welcome'
  | 'account_locked'
  | 'password_reset'
  | 'security_alert'
  | 'promotion_available'
  | 'system_maintenance'
  | 'custom';

export interface NotificationContext {
  user_name?: string;
  booking_reference?: string;
  booking_date?: string;
  location?: string;
  amount?: string;
  transaction_id?: string;
  payment_method?: string;
  rating?: number;
  review_text?: string;
  verification_link?: string;
  reset_link?: string;
  promotion_code?: string;
  maintenance_start?: string;
  maintenance_end?: string;
  [key: string]: any;
}

export interface NotificationProvider {
  name: string;
  sendEmail(to: string, subject: string, body: string, metadata?: any): Promise<void>;
  sendSMS(to: string, message: string, metadata?: any): Promise<void>;
  sendPush(token: string, title: string, body: string, metadata?: any): Promise<void>;
}

export interface EmailConfig {
  provider: 'sendgrid' | 'mailgun' | 'aws-ses' | 'smtp';
  api_key?: string;
  from_email: string;
  from_name?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
}

export interface SMSConfig {
  provider: 'twilio' | 'aws-sns' | 'nexmo';
  api_key?: string;
  api_secret?: string;
  from_number?: string;
}

export interface PushConfig {
  provider: 'firebase' | 'apns' | 'onesignal';
  server_key?: string;
  certificate_path?: string;
  app_id?: string;
}
