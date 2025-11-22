import { Chat, Message, MessageTemplate, AdminMessageStats, CreateMessageRequest, UpdateMessageRequest, CreateMessageTemplateRequest, UpdateMessageTemplateRequest } from '../types/messaging.types';
import { ResponseHelper } from '../utils/response';
import MessagingRepository from '../repositories/MessagingRepository';
import { getDatabase } from '../config/database';

export class MessagingService {
  private static repository = MessagingRepository;
  private static knex = getDatabase();

  // Chat Management
  static async getChats(userId?: string, page: number = 1, limit: number = 20): Promise<{ success: boolean; data: Chat[]; error?: string; total?: number }> {
    try {
      if (!userId) {
        return { success: false, data: [], error: 'User ID is required' };
      }

      const result = await this.repository.getUserChats(userId, page, limit);
      return { success: true, data: result.chats, total: result.total };
    } catch (error: any) {
      return { success: false, data: [], error: error.message };
    }
  }

  static async getChatById(chatId: string, userId?: string): Promise<{ success: boolean; data: Chat | null; error?: string }> {
    try {
      const chat = await this.repository.getChatById(chatId, userId);
      if (!chat) {
        return { success: false, data: null, error: 'Chat not found' };
      }
      return { success: true, data: chat };
    } catch (error: any) {
      return { success: false, data: null, error: error.message };
    }
  }

  static async getChatMessages(chatId: string, page = 1, limit = 50, beforeMessageId?: string): Promise<{ success: boolean; data: Message[]; error?: string; total?: number }> {
    try {
      const result = await this.repository.getChatMessages(chatId, page, limit, beforeMessageId);
      return { success: true, data: result.messages, total: result.total };
    } catch (error: any) {
      return { success: false, data: [], error: error.message };
    }
  }

  static async sendMessage(chatId: string, messageData: CreateMessageRequest, senderId: string): Promise<{ success: boolean; data: Message | null; error?: string }> {
    try {
      // Verify chat exists and user is participant
      const chat = await this.repository.getChatById(chatId, senderId);
      if (!chat) {
        return { success: false, data: null, error: 'Chat not found or access denied' };
      }

      // Check if user is blocked
      const isBlocked = await this.repository.isUserBlocked(senderId, chat.participant_ids);
      if (isBlocked) {
        return { success: false, data: null, error: 'Cannot send message. User is blocked.' };
      }

      // Create message
      // Filter messageType to only allow supported types
      const supportedTypes: ('text' | 'image' | 'file' | 'system')[] = ['text', 'image', 'file', 'system'];
      const messageType = messageData.message_type && supportedTypes.includes(messageData.message_type as any)
        ? messageData.message_type as 'text' | 'image' | 'file' | 'system'
        : 'text'; // Default to 'text' for unsupported types like 'audio' or 'video'
      
      const message = await this.repository.createMessage({
        chatId,
        senderId,
        content: messageData.content,
        messageType,
        replyToMessageId: messageData.reply_to_message_id,
        attachments: messageData.attachments,
        metadata: messageData.metadata
      });

      return { success: true, data: message };
    } catch (error: any) {
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Create or get chat between two users
   */
  static async findOrCreateChat(
    participant1Id: string,
    participant2Id: string,
    options?: {
      productId?: string;
      bookingId?: string;
      subject?: string;
    }
  ): Promise<{ success: boolean; data: Chat | null; error?: string }> {
    try {
      const chat = await this.repository.findOrCreateChat(participant1Id, participant2Id, options);
      return { success: true, data: chat };
    } catch (error: any) {
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Mark message as read
   */
  static async markMessageAsRead(messageId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.repository.markMessageAsRead(messageId, userId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark all messages in chat as read
   */
  static async markChatAsRead(chatId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.repository.markChatAsRead(chatId, userId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get total unread message count for a user
   */
  static async getTotalUnreadCount(userId: string): Promise<{ success: boolean; data: number; error?: string }> {
    try {
      const count = await this.repository.getTotalUnreadCount(userId);
      return { success: true, data: count };
    } catch (error: any) {
      return { success: false, data: 0, error: error.message };
    }
  }

  /**
   * Set typing indicator
   */
  static async setTypingIndicator(chatId: string, userId: string, isTyping: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      await this.repository.setTypingIndicator(chatId, userId, isTyping);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get typing indicators for a chat
   */
  static async getTypingIndicators(chatId: string): Promise<{ success: boolean; data: string[]; error?: string }> {
    try {
      const userIds = await this.repository.getTypingIndicators(chatId);
      return { success: true, data: userIds };
    } catch (error: any) {
      return { success: false, data: [], error: error.message };
    }
  }

  /**
   * Block a user
   */
  static async blockUser(blockerId: string, blockedId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.repository.blockUser(blockerId, blockedId, reason);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Search messages in a chat
   */
  static async searchMessages(chatId: string, query: string, page: number = 1, limit: number = 20): Promise<{ success: boolean; data: Message[]; total?: number; error?: string }> {
    try {
      if (!query || query.trim().length === 0) {
        return { success: false, data: [], error: 'Search query is required' };
      }

      const result = await this.repository.searchMessages(chatId, query.trim(), page, limit);
      return { success: true, data: result.messages, total: result.total };
    } catch (error: any) {
      return { success: false, data: [], error: error.message };
    }
  }

  static async updateMessage(messageId: string, updates: UpdateMessageRequest): Promise<{ success: boolean; data: Message | null; error?: string }> {
    try {
      // Update message content
      const message = await this.knex('messages')
        .where('id', messageId)
        .first();

      if (!message) {
        return { success: false, data: null, error: 'Message not found' };
      }

      const updatedMessage = await this.knex('messages')
        .where('id', messageId)
        .update({
          content: updates.content || message.content,
          edited_content: updates.content || message.content,
          is_edited: true,
          edited_at: new Date(),
          updated_at: new Date(),
          metadata: updates.metadata ? JSON.stringify(updates.metadata) : message.metadata
        })
        .returning('*')
        .then(rows => rows[0]);

      // Get attachments
      const attachments = await this.knex('message_attachments')
        .where('message_id', messageId);

      return { 
        success: true, 
        data: {
          ...updatedMessage,
          attachments: attachments,
          is_read: updatedMessage.message_status === 'read'
        } as Message
      };
    } catch (error: any) {
      return { success: false, data: null, error: error.message };
    }
  }

  static async deleteMessage(messageId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const message = await this.knex('messages')
        .where('id', messageId)
        .first();

      if (!message) {
        return { success: false, error: 'Message not found' };
      }

      // Soft delete
      await this.knex('messages')
        .where('id', messageId)
        .update({
          is_deleted: true,
          deleted_at: new Date(),
          deleted_by: userId,
          updated_at: new Date()
        });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Message Templates
  static async getMessageTemplates(): Promise<{ success: boolean; data: MessageTemplate[]; error?: string }> {
    try {
      // Mock data - replace with actual database query
      const mockTemplates: MessageTemplate[] = [
        {
          id: '1',
          name: 'Welcome Message',
          content: 'Welcome to our platform! We\'re glad to have you here.',
          category: 'welcome',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '2',
          name: 'Support Response',
          content: 'Thank you for contacting support. We\'ll get back to you soon.',
          category: 'support',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      return { success: true, data: mockTemplates };
    } catch (error: any) {
      return { success: false, data: [], error: error.message };
    }
  }

  static async createMessageTemplate(templateData: CreateMessageTemplateRequest): Promise<{ success: boolean; data: MessageTemplate | null; error?: string }> {
    try {
      // Mock template creation - replace with actual database insert
      const newTemplate: MessageTemplate = {
        id: `template_${Date.now()}`,
        name: templateData.name,
        content: templateData.content,
        category: templateData.category,
        is_active: templateData.is_active ?? true,
        created_at: new Date(),
        updated_at: new Date()
      };

      return { success: true, data: newTemplate };
    } catch (error: any) {
      return { success: false, data: null, error: error.message };
    }
  }

  static async updateMessageTemplate(templateId: string, updates: UpdateMessageTemplateRequest): Promise<{ success: boolean; data: MessageTemplate | null; error?: string }> {
    try {
      // Mock template update - replace with actual database update
      const updatedTemplate: MessageTemplate = {
        id: templateId,
        name: updates.name || 'Updated Template',
        content: updates.content || 'Updated content',
        category: updates.category || 'general',
        is_active: updates.is_active ?? true,
        created_at: new Date(),
        updated_at: new Date()
      };

      return { success: true, data: updatedTemplate };
    } catch (error: any) {
      return { success: false, data: null, error: error.message };
    }
  }

  static async deleteMessageTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Mock template deletion - replace with actual database delete
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Messaging Statistics
  static async getMessageStats(): Promise<{ success: boolean; data: AdminMessageStats | null; error?: string }> {
    try {
      // Mock stats - replace with actual database aggregation
      const mockStats: AdminMessageStats = {
        total_chats: 150,
        total_messages: 1250,
        active_chats: 45,
        unread_messages: 89,
        messages_today: 23,
        messages_this_week: 156,
        messages_this_month: 678
      };

      return { success: true, data: mockStats };
    } catch (error: any) {
      return { success: false, data: null, error: error.message };
    }
  }

  // AI Features
  static async analyzeSentiment(messageId: string): Promise<{ success: boolean; data: any; error?: string }> {
    try {
      // Mock sentiment analysis - replace with actual AI service
      const mockAnalysis = {
        sentiment: 'positive',
        confidence: 0.85,
        emotions: ['joy', 'excitement'],
        score: 0.75
      };

      return { success: true, data: mockAnalysis };
    } catch (error: any) {
      return { success: false, data: null, error: error.message };
    }
  }

  static async detectConflict(chatId: string): Promise<{ success: boolean; data: any; error?: string }> {
    try {
      // Mock conflict detection - replace with actual AI service
      const mockDetection = {
        has_conflict: false,
        confidence: 0.92,
        risk_level: 'low',
        suggestions: ['Continue monitoring the conversation']
      };

      return { success: true, data: mockDetection };
    } catch (error: any) {
      return { success: false, data: null, error: error.message };
    }
  }

  static async generateResponseSuggestions(chatId: string, context: string): Promise<{ success: boolean; data: string[]; error?: string }> {
    try {
      // Mock response suggestions - replace with actual AI service
      const mockSuggestions = [
        'Thank you for your message. How can I help you today?',
        'I understand your concern. Let me assist you with that.',
        'That\'s a great question! Here\'s what I can tell you...'
      ];

      return { success: true, data: mockSuggestions };
    } catch (error: any) {
      return { success: false, data: [], error: error.message };
    }
  }
}
