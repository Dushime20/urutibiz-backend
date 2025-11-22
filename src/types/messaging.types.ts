export interface Chat {
  id: string;
  participant_ids: string[];
  last_message?: Message;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  metadata?: Record<string, any>;
  // Enhanced fields
  product_id?: string;
  booking_id?: string;
  subject?: string;
  last_message_preview?: string;
  last_message_at?: Date;
  unread_count_user_1?: number;
  unread_count_user_2?: number;
  is_archived_user_1?: boolean;
  is_archived_user_2?: boolean;
  is_blocked?: boolean;
  blocked_by?: string;
  blocked_at?: Date;
  // User role in this conversation (determined based on product/booking ownership)
  userRole?: 'owner' | 'renter';
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageType = 'text' | 'image' | 'file' | 'system' | 'audio' | 'video';
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface MessageAttachment {
  id?: string;
  file_name: string;
  file_type: string;
  mime_type?: string;
  file_size: number;
  file_url: string;
  thumbnail_url?: string;
  storage_provider?: string;
}

export interface MessageReaction {
  user_id: string;
  emoji: string;
  created_at: Date;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, any>;
  // Enhanced fields
  message_status?: MessageStatus;
  delivered_at?: Date;
  read_at?: Date;
  read_by?: string;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  is_edited?: boolean;
  edited_content?: string;
  edited_at?: Date;
  is_deleted?: boolean;
  deleted_at?: Date;
  deleted_by?: string;
  translations?: Record<string, string>;
  original_language?: string;
  reply_to_message_id?: string;
  is_forwarded?: boolean;
  forwarded_from_chat_id?: string;
  forwarded_from_message_id?: string;
  priority?: MessagePriority;
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
  message_type?: MessageType;
  metadata?: Record<string, any>;
  reply_to_message_id?: string;
  attachments?: MessageAttachment[];
  priority?: MessagePriority;
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
