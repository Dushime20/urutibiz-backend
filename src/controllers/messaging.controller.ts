import { Request, Response } from 'express';
import { MessagingService } from '../services/messaging.service';
import { ResponseHelper } from '../utils/response';
import { CreateMessageRequest, UpdateMessageRequest, CreateMessageTemplateRequest, UpdateMessageTemplateRequest } from '../types/messaging.types';

export class MessagingController {
  // Chat Management
  static async getChats(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        ResponseHelper.unauthorized(res, 'User authentication required');
        return;
      }

      const result = await MessagingService.getChats(userId, page, limit);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to fetch chats');
        return;
      }

      ResponseHelper.success(res, 'Chats fetched successfully', {
        chats: result.data,
        pagination: {
          page,
          limit,
          total: result.total || 0,
          totalPages: Math.ceil((result.total || 0) / limit)
        }
      });
    } catch (error: any) {
      ResponseHelper.error(res, 'Failed to fetch chats', error, 500);
    }
  }

  /**
   * Create or get chat between users
   * POST /api/v1/messaging/chats
   */
  static async createOrGetChat(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { participant_id, product_id, booking_id, subject } = req.body;

      if (!userId) {
        ResponseHelper.unauthorized(res, 'User authentication required');
        return;
      }

      if (!participant_id) {
        ResponseHelper.badRequest(res, 'Participant ID is required');
        return;
      }

      const result = await MessagingService.findOrCreateChat(userId, participant_id, {
        productId: product_id,
        bookingId: booking_id,
        subject
      });

      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to create/get chat');
        return;
      }

      ResponseHelper.success(res, 'Chat retrieved successfully', result.data);
    } catch (error: any) {
      ResponseHelper.error(res, 'Failed to create/get chat', error, 500);
    }
  }

  static async getChatById(req: Request, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        ResponseHelper.unauthorized(res, 'User authentication required');
        return;
      }

      const result = await MessagingService.getChatById(chatId, userId);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to fetch chat');
        return;
      }

      if (!result.data) {
        ResponseHelper.notFound(res, 'Chat not found');
        return;
      }

      ResponseHelper.success(res, 'Chat fetched successfully', result.data);
    } catch (error: any) {
      ResponseHelper.error(res, 'Failed to fetch chat', error, 500);
    }
  }

  static async getChatMessages(req: Request, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const beforeMessageId = req.query.before_message_id as string | undefined;
      
      const result = await MessagingService.getChatMessages(chatId, page, limit, beforeMessageId);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to fetch messages');
        return;
      }

      ResponseHelper.success(res, 'Messages fetched successfully', {
        messages: result.data,
        pagination: {
          page,
          limit,
          total: result.total || 0,
          totalPages: Math.ceil((result.total || 0) / limit)
        }
      });
    } catch (error: any) {
      ResponseHelper.error(res, 'Failed to fetch messages', error, 500);
    }
  }

  /**
   * List messages across all chats (admin)
   * GET /api/v1/admin/chats/messages
   */
  static async getAllChatMessages(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const offset = (page - 1) * limit;
      const db = require('@/config/database').getDatabase();

      const [messages, count] = await Promise.all([
        db('messages')
          .select(
            'messages.id',
            'messages.chat_id as chatId',
            'messages.sender_id as senderId',
            'messages.content',
            'messages.message_type as messageType',
            'messages.is_read as isRead',
            'messages.created_at as createdAt',
            'messages.updated_at as updatedAt'
          )
          .orderBy('messages.created_at', 'desc')
          .limit(limit)
          .offset(offset),
        db('messages').count('* as count').first()
      ]);

      ResponseHelper.success(res, 'All chat messages fetched successfully', {
        items: messages,
        total: parseInt((count as any)?.count || '0', 10),
        page,
        limit
      });
    } catch (error: any) {
      ResponseHelper.error(res, 'Failed to fetch all chat messages', error, 500);
    }
  }

  static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const messageData: CreateMessageRequest = req.body;
      const senderId = (req as any).user?.id || 'admin'; // Get from auth middleware

      if (!messageData.content) {
        ResponseHelper.badRequest(res, 'Message content is required');
        return;
      }

      const result = await MessagingService.sendMessage(chatId, messageData, senderId);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to send message');
        return;
      }

      ResponseHelper.created(res, 'Message sent successfully', result.data);
    } catch (error: any) {
      ResponseHelper.error(res, 'Failed to send message', error, 500);
    }
  }

  static async updateMessage(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const updates: UpdateMessageRequest = req.body;

      const result = await MessagingService.updateMessage(messageId, updates);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to update message');
        return;
      }

      ResponseHelper.success(res, 'Message updated successfully', result.data);
    } catch (error: any) {
      ResponseHelper.error(res, 'Failed to update message', error, 500);
    }
  }

  static async deleteMessage(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        ResponseHelper.unauthorized(res, 'User authentication required');
        return;
      }

      const result = await MessagingService.deleteMessage(messageId, userId);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to delete message');
        return;
      }

      ResponseHelper.success(res, 'Message deleted successfully', null);
    } catch (error: any) {
      ResponseHelper.error(res, 'Failed to delete message', error, 500);
    }
  }

  /**
   * Mark message as read
   * PATCH /api/v1/messaging/messages/:messageId/read
   */
  static async markMessageAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        ResponseHelper.unauthorized(res, 'User authentication required');
        return;
      }

      const result = await MessagingService.markMessageAsRead(messageId, userId);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to mark message as read');
        return;
      }

      ResponseHelper.success(res, 'Message marked as read', null);
    } catch (error: any) {
      ResponseHelper.error(res, 'Failed to mark message as read', error, 500);
    }
  }

  /**
   * Mark all messages in chat as read
   * PATCH /api/v1/messaging/chats/:chatId/read
   */
  static async markChatAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        ResponseHelper.unauthorized(res, 'User authentication required');
        return;
      }

      const result = await MessagingService.markChatAsRead(chatId, userId);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to mark chat as read');
        return;
      }

      ResponseHelper.success(res, 'Chat marked as read', null);
    } catch (error: any) {
      ResponseHelper.error(res, 'Failed to mark chat as read', error, 500);
    }
  }

  /**
   * Set typing indicator
   * POST /api/v1/messaging/chats/:chatId/typing
   */
  static async setTypingIndicator(req: Request, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const userId = (req as any).user?.id;
      const { is_typing } = req.body;

      if (!userId) {
        ResponseHelper.unauthorized(res, 'User authentication required');
        return;
      }

      const result = await MessagingService.setTypingIndicator(chatId, userId, is_typing === true);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to set typing indicator');
        return;
      }

      ResponseHelper.success(res, 'Typing indicator updated', null);
    } catch (error: any) {
      ResponseHelper.error(res, 'Failed to set typing indicator', error, 500);
    }
  }

  /**
   * Get total unread message count for user
   * GET /api/v1/messaging/unread-count
   */
  static async getTotalUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        ResponseHelper.unauthorized(res, 'User authentication required');
        return;
      }

      const result = await MessagingService.getTotalUnreadCount(userId);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to fetch unread count');
        return;
      }

      ResponseHelper.success(res, 'Unread count fetched successfully', {
        unreadCount: result.data
      });
    } catch (error: any) {
      ResponseHelper.error(res, 'Failed to fetch unread count', error, 500);
    }
  }

  /**
   * Get typing indicators for a chat
   * GET /api/v1/messaging/chats/:chatId/typing
   */
  static async getTypingIndicators(req: Request, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const result = await MessagingService.getTypingIndicators(chatId);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to get typing indicators');
        return;
      }

      ResponseHelper.success(res, 'Typing indicators fetched', result.data);
    } catch (error: any) {
      ResponseHelper.error(res, 'Failed to get typing indicators', error, 500);
    }
  }

  /**
   * Block a user
   * POST /api/v1/messaging/users/:userId/block
   */
  static async blockUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId: blockedId } = req.params;
      const blockerId = (req as any).user?.id;
      const { reason } = req.body;

      if (!blockerId) {
        ResponseHelper.unauthorized(res, 'User authentication required');
        return;
      }

      if (blockerId === blockedId) {
        ResponseHelper.badRequest(res, 'Cannot block yourself');
        return;
      }

      const result = await MessagingService.blockUser(blockerId, blockedId, reason);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to block user');
        return;
      }

      ResponseHelper.success(res, 'User blocked successfully', null);
    } catch (error: any) {
      ResponseHelper.error(res, 'Failed to block user', error, 500);
    }
  }

  /**
   * Search messages in a chat
   * GET /api/v1/messaging/chats/:chatId/search
   */
  static async searchMessages(req: Request, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const query = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!query) {
        ResponseHelper.badRequest(res, 'Search query is required');
        return;
      }

      const result = await MessagingService.searchMessages(chatId, query, page, limit);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to search messages');
        return;
      }

      ResponseHelper.success(res, 'Messages found', {
        messages: result.data,
        pagination: {
          page,
          limit,
          total: result.total || 0,
          totalPages: Math.ceil((result.total || 0) / limit)
        }
      });
    } catch (error: any) {
      ResponseHelper.error(res, 'Failed to search messages', error, 500);
    }
  }

  // Message Templates
  static async getMessageTemplates(_req: Request, res: Response): Promise<void> {
    try {
      const result = await MessagingService.getMessageTemplates();
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to fetch message templates');
        return;
      }

      ResponseHelper.success(res, 'Message templates fetched successfully', result.data);
    } catch (error: any) {
      ResponseHelper.error(res, 'Failed to fetch message templates', error, 500);
    }
  }

  static async createMessageTemplate(req: Request, res: Response): Promise<void> {
    try {
      const templateData: CreateMessageTemplateRequest = req.body;

      if (!templateData.name || !templateData.content || !templateData.category) {
        ResponseHelper.badRequest(res, 'Name, content, and category are required');
        return;
      }

      const result = await MessagingService.createMessageTemplate(templateData);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to create message template');
        return;
      }

      ResponseHelper.created(res, 'Message template created successfully', result.data);
    } catch (error: any) {
      ResponseHelper.error(res, 'Failed to create message template', error, 500);
    }
  }

  static async updateMessageTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;
      const updates: UpdateMessageTemplateRequest = req.body;

      const result = await MessagingService.updateMessageTemplate(templateId, updates);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to update message template');
        return;
      }

      ResponseHelper.success(res, 'Message template updated successfully', result.data);
    } catch (error: any) {
      ResponseHelper.error(res, 'Failed to update message template', error, 500);
    }
  }

  static async deleteMessageTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;
      const result = await MessagingService.deleteMessageTemplate(templateId);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to delete message template');
        return;
      }

      ResponseHelper.success(res, 'Message template deleted successfully', null);
    } catch (error: any) {
      ResponseHelper.error(res, 'Failed to delete message template', error, 500);
    }
  }

  // Messaging Statistics
  static async getMessageStats(_req: Request, res: Response): Promise<void> {
    try {
      const result = await MessagingService.getMessageStats();
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to fetch message stats');
        return;
      }

      ResponseHelper.success(res, 'Message stats fetched successfully', result.data);
    } catch (error: any) {
      ResponseHelper.error(res, 'Failed to fetch message stats', error, 500);
    }
  }

  // AI Features
  static async analyzeSentiment(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const result = await MessagingService.analyzeSentiment(messageId);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to analyze sentiment');
        return;
      }

      ResponseHelper.success(res, 'Sentiment analysis completed', result.data);
    } catch (error: any) {
      ResponseHelper.error(res, 'Failed to analyze sentiment', error, 500);
    }
  }

  static async detectConflict(req: Request, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const result = await MessagingService.detectConflict(chatId);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to detect conflict');
        return;
      }

      ResponseHelper.success(res, 'Conflict detection completed', result.data);
    } catch (error: any) {
      ResponseHelper.error(res, 'Failed to detect conflict', error, 500);
    }
  }

  static async generateResponseSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const { context } = req.body;

      if (!context) {
        ResponseHelper.badRequest(res, 'Context is required');
        return;
      }

      const result = await MessagingService.generateResponseSuggestions(chatId, context);
      
      if (!result.success) {
        ResponseHelper.badRequest(res, result.error || 'Failed to generate response suggestions');
        return;
      }

      ResponseHelper.success(res, 'Response suggestions generated', result.data);
    } catch (error: any) {
      ResponseHelper.error(res, 'Failed to generate response suggestions', error, 500);
    }
  }
}
