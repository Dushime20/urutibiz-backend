export interface Chat {
  id: string;
  participant_ids: string[];
  last_message?: Message;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, any>;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AdminMessageStats {
  total_chats: number;
  total_messages: number;
  active_chats: number;
  unread_messages: number;
  messages_today: number;
  messages_this_week: number;
  messages_this_month: number;
}

export interface AdminNotificationStats {
  total_notifications: number;
  unread_notifications: number;
  notifications_today: number;
  notifications_this_week: number;
  notifications_this_month: number;
  delivery_success_rate: number;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  created_at: Date;
  read_at?: Date;
  metadata?: Record<string, any>;
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  user_ids: string[];
  data?: Record<string, any>;
  scheduled_at?: Date;
  sent_at?: Date;
  status: 'pending' | 'sent' | 'failed';
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ScheduledNotification {
  id: string;
  title: string;
  message: string;
  notification_type: 'push' | 'email' | 'sms';
  target_users: string[];
  scheduled_at: Date;
  sent_at?: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// Request types
export interface CreateMessageRequest {
  content: string;
  message_type?: 'text' | 'image' | 'file' | 'system';
  metadata?: Record<string, any>;
}

export interface UpdateMessageRequest {
  content?: string;
  message_type?: 'text' | 'image' | 'file' | 'system';
  metadata?: Record<string, any>;
}

export interface CreateMessageTemplateRequest {
  name: string;
  content: string;
  category: string;
  is_active?: boolean;
}

export interface UpdateMessageTemplateRequest {
  name?: string;
  content?: string;
  category?: string;
  is_active?: boolean;
}

export interface CreateEmailTemplateRequest {
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables?: string[];
  is_active?: boolean;
}

export interface UpdateEmailTemplateRequest {
  name?: string;
  subject?: string;
  html_content?: string;
  text_content?: string;
  variables?: string[];
  is_active?: boolean;
}

export interface CreateScheduledNotificationRequest {
  title: string;
  message: string;
  notification_type: 'push' | 'email' | 'sms';
  target_users: string[];
  scheduled_at: Date;
  metadata?: Record<string, any>;
}

export interface UpdateScheduledNotificationRequest {
  title?: string;
  message?: string;
  notification_type?: 'push' | 'email' | 'sms';
  target_users?: string[];
  scheduled_at?: Date;
  status?: 'pending' | 'sent' | 'failed' | 'cancelled';
  metadata?: Record<string, any>;
}

export interface SendPushNotificationRequest {
  title: string;
  body: string;
  user_ids: string[];
  data?: Record<string, any>;
  scheduled_at?: Date;
}
