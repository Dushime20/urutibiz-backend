// Communication system types for conversations, messages, support tickets, and AI chat logs

export type MessageType = 'text' | 'image' | 'file' | 'system' | 'ai' | 'other';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed' | 'archived';

export interface Conversation {
  id: string;
  booking_id?: string;
  participant_1_id: string;
  participant_2_id: string;
  subject?: string;
  status: 'active' | 'archived' | 'blocked';
  ai_moderation_enabled: boolean;
  ai_translation_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: MessageType;
  content?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  ai_sentiment_score?: number;
  ai_language_detected?: string;
  ai_translation?: Record<string, string>;
  is_flagged: boolean;
  is_read: boolean;
  read_at?: string;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  booking_id?: string;
  subject: string;
  description: string;
  category?: string;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to?: string;
  assigned_at?: string;
  ai_category?: string;
  ai_urgency_score?: number;
  ai_suggested_response?: string;
  resolution?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  attachments?: string[];
  is_internal: boolean;
  created_at: string;
}

export interface AIChatLog {
  id: string;
  user_id?: string;
  session_id: string;
  user_message: string;
  ai_response: string;
  intent_detected?: string;
  confidence_score?: number;
  context?: Record<string, any>;
  processing_time_ms?: number;
  escalated_to_human: boolean;
  created_at: string;
}
