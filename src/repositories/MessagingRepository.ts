import { getDatabase } from '@/config/database';
import { Chat, Message } from '@/types/messaging.types';

export class MessagingRepository {
  private knex = getDatabase();

  /**
   * Create or get existing chat between two users
   */
  async findOrCreateChat(
    participant1Id: string,
    participant2Id: string,
    options?: {
      productId?: string;
      bookingId?: string;
      subject?: string;
    }
  ): Promise<Chat> {
    // Sort participant IDs to ensure consistent chat lookup
    const participants = [participant1Id, participant2Id].sort();
    
    // Try to find existing chat - PostgreSQL JSONB contains operator
    let chat = await this.knex('chats')
      .whereRaw("participant_ids @> ?", [JSON.stringify(participants)])
      .whereRaw("participant_ids <@ ?", [JSON.stringify(participants)])
      .where('is_active', true)
      .first();

    if (chat) {
      const formattedChat = this.formatChat(chat);
      // Determine role for participant1 (the caller)
      const userRole = await this.determineUserRole(chat, participant1Id);
      return { ...formattedChat, userRole };
    }

    // Create new chat
    // Properly format participant_ids as JSONB for PostgreSQL
    // Use knex.raw to explicitly cast the JSON string to jsonb
    const participantIdsJson = JSON.stringify(participants);
    const [newChat] = await this.knex('chats')
      .insert({
        participant_ids: this.knex.raw('?::jsonb', [participantIdsJson]),
        is_active: true,
        product_id: options?.productId || null,
        booking_id: options?.bookingId || null,
        subject: options?.subject || null,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    // Create participant records
    await this.knex('conversation_participants').insert([
      {
        chat_id: newChat.id,
        user_id: participant1Id,
        joined_at: new Date()
      },
      {
        chat_id: newChat.id,
        user_id: participant2Id,
        joined_at: new Date()
      }
    ]);

    const formattedChat = this.formatChat(newChat);
    // Determine role for participant1 (the caller)
    const userRole = await this.determineUserRole(newChat, participant1Id);
    return { ...formattedChat, userRole };
  }

  /**
   * Get chat by ID with participants
   */
  async getChatById(chatId: string, userId?: string): Promise<Chat | null> {
    const chat = await this.knex('chats')
      .where('id', chatId)
      .first();

    if (!chat) return null;

    // Check if user is blocked
    if (userId) {
      const isBlocked = await this.isUserBlocked(userId, chat.participant_ids);
      if (isBlocked) {
        throw new Error('Cannot access this conversation. User is blocked.');
      }
    }

    const formattedChat = this.formatChat(chat);
    
    // Determine user role if userId is provided
    if (userId) {
      const userRole = await this.determineUserRole(chat, userId);
      return { ...formattedChat, userRole };
    }

    return formattedChat;
  }

  /**
   * Get user's chats with pagination
   */
  async getUserChats(
    userId: string,
    page: number = 1,
    limit: number = 20,
    includeArchived: boolean = false
  ): Promise<{ chats: Chat[]; total: number }> {
    const offset = (page - 1) * limit;

    // Get participant records for user
    const participantQuery = this.knex('conversation_participants')
      .where('user_id', userId)
      .where('left_at', null);

    if (!includeArchived) {
      participantQuery.where('is_archived', false);
    }

    const participants = await participantQuery;

    const chatIds = participants.map(p => p.chat_id);

    if (chatIds.length === 0) {
      return { chats: [], total: 0 };
    }

    // Get chats
    const [chats, countResult] = await Promise.all([
      this.knex('chats')
        .whereIn('id', chatIds)
        .where('is_active', true)
        .orderBy('last_message_at', 'desc')
        .limit(limit)
        .offset(offset),
      this.knex('chats')
        .whereIn('id', chatIds)
        .where('is_active', true)
        .count('* as count')
        .first()
    ]);

    const total = parseInt((countResult as any)?.count || '0', 10);

    // Determine user role for each chat and format
    const chatsWithRole = await Promise.all(
      chats.map(async (chat) => {
        const formattedChat = this.formatChat(chat);
        const userRole = await this.determineUserRole(chat, userId);
        return { ...formattedChat, userRole };
      })
    );

    return {
      chats: chatsWithRole,
      total
    };
  }

  /**
   * Determine user's role (owner or renter) in a conversation
   */
  private async determineUserRole(chat: any, userId: string): Promise<'owner' | 'renter' | undefined> {
    try {
      // If chat has a product_id, check if user is the product owner
      if (chat.product_id) {
        const product = await this.knex('products')
          .where('id', chat.product_id)
          .select('owner_id')
          .first();
        
        if (product) {
          return product.owner_id === userId ? 'owner' : 'renter';
        }
      }
      
      // If chat has a booking_id but no product_id, check booking
      if (chat.booking_id && !chat.product_id) {
        const booking = await this.knex('bookings')
          .where('id', chat.booking_id)
          .select('owner_id', 'renter_id')
          .first();
        
        if (booking) {
          if (booking.owner_id === userId) {
            return 'owner';
          } else if (booking.renter_id === userId) {
            return 'renter';
          }
        }
      }
      
      // If chat has booking_id, try to get product from booking
      if (chat.booking_id) {
        const booking = await this.knex('bookings')
          .where('id', chat.booking_id)
          .select('product_id')
          .first();
        
        if (booking?.product_id) {
          const product = await this.knex('products')
            .where('id', booking.product_id)
            .select('owner_id')
            .first();
          
          if (product) {
            return product.owner_id === userId ? 'owner' : 'renter';
          }
        }
      }
      
      return undefined;
    } catch (error) {
      console.error('Error determining user role:', error);
      return undefined;
    }
  }

  /**
   * Get messages for a chat with pagination
   */
  async getChatMessages(
    chatId: string,
    page: number = 1,
    limit: number = 50,
    beforeMessageId?: string
  ): Promise<{ messages: Message[]; total: number }> {
    const offset = (page - 1) * limit;

    let query = this.knex('messages')
      .where('chat_id', chatId)
      .where('is_deleted', false)
      .orderBy('created_at', 'desc');

    if (beforeMessageId) {
      const beforeMessage = await this.knex('messages')
        .where('id', beforeMessageId)
        .first();
      if (beforeMessage) {
        query = query.where('created_at', '<', beforeMessage.created_at);
      }
    }

    const [messages, countResult] = await Promise.all([
      query.limit(limit).offset(offset),
      this.knex('messages')
        .where('chat_id', chatId)
        .where('is_deleted', false)
        .count('* as count')
        .first()
    ]);

    const total = parseInt((countResult as any)?.count || '0', 10);

    // Get attachments for messages
    const messageIds = messages.map(m => m.id);
    const attachments = messageIds.length > 0
      ? await this.knex('message_attachments')
          .whereIn('message_id', messageIds)
      : [];

    const attachmentsMap = attachments.reduce((acc: any, att: any) => {
      if (!acc[att.message_id]) acc[att.message_id] = [];
      acc[att.message_id].push({
        id: att.id,
        file_name: att.file_name,
        file_type: att.file_type,
        file_size: att.file_size,
        file_url: att.file_url,
        thumbnail_url: att.thumbnail_url
      });
      return acc;
    }, {});

    return {
      messages: messages.map(msg => this.formatMessage(msg, attachmentsMap[msg.id] || [])),
      total
    };
  }

  /**
   * Create a new message
   */
  async createMessage(data: {
    chatId: string;
    senderId: string;
    content: string;
    messageType?: 'text' | 'image' | 'file' | 'system';
    replyToMessageId?: string;
    attachments?: Array<{
      file_name: string;
      file_type: string;
      mime_type?: string;
      file_size: number;
      file_url: string;
      thumbnail_url?: string;
      storage_provider?: string;
    }>;
    metadata?: Record<string, any>;
  }): Promise<Message> {
    const db = this.knex;

    return await db.transaction(async (trx) => {
      // Create message
      const [message] = await trx('messages')
        .insert({
          chat_id: data.chatId,
          sender_id: data.senderId,
          content: data.content,
          message_type: data.messageType || 'text',
          message_status: 'sent',
          reply_to_message_id: data.replyToMessageId,
          metadata: data.metadata || null,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      // Create attachments if provided
      if (data.attachments && data.attachments.length > 0) {
        await trx('message_attachments').insert(
          data.attachments.map(att => ({
            message_id: message.id,
            file_name: att.file_name,
            file_type: att.file_type,
            mime_type: att.mime_type,
            file_size: att.file_size,
            file_url: att.file_url,
            thumbnail_url: att.thumbnail_url,
            storage_provider: att.storage_provider || 'local',
            uploaded_at: new Date()
          }))
        );
      }

      // Update chat last message
      await trx('chats')
        .where('id', data.chatId)
        .update({
          last_message_preview: data.content.substring(0, 500),
          last_message_at: new Date(),
          updated_at: new Date()
        });

      // Increment unread count for other participants
      const chat = await trx('chats').where('id', data.chatId).first();
      if (chat) {
        const otherParticipants = (chat.participant_ids as string[]).filter(id => id !== data.senderId);
        for (const participantId of otherParticipants) {
          await trx('conversation_participants')
            .where({ chat_id: data.chatId, user_id: participantId })
            .increment('unread_count', 1);
        }
      }

      // Get attachments for response
      const attachments = await trx('message_attachments')
        .where('message_id', message.id);

      return this.formatMessage(message, attachments);
    });
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    const message = await this.knex('messages')
      .where('id', messageId)
      .first();

    if (!message) return;

    // Update message read status
    await this.knex('messages')
      .where('id', messageId)
      .update({
        message_status: 'read',
        read_at: new Date(),
        read_by: userId,
        updated_at: new Date()
      });

    // Decrement unread count for participant
    await this.knex('conversation_participants')
      .where({ chat_id: message.chat_id, user_id: userId })
      .where('unread_count', '>', 0)
      .decrement('unread_count', 1);

    // Update last read timestamp
    await this.knex('conversation_participants')
      .where({ chat_id: message.chat_id, user_id: userId })
      .update({ last_read_at: new Date() });
  }

  /**
   * Mark all messages in chat as read
   */
  async markChatAsRead(chatId: string, userId: string): Promise<void> {
    const db = this.knex;

    await db.transaction(async (trx) => {
      // Mark all unread messages as read
      await trx('messages')
        .where('chat_id', chatId)
        .where('sender_id', '!=', userId)
        .where('message_status', '!=', 'read')
        .update({
          message_status: 'read',
          read_at: new Date(),
          read_by: userId,
          updated_at: new Date()
        });

      // Reset unread count
      await trx('conversation_participants')
        .where({ chat_id: chatId, user_id: userId })
        .update({
          unread_count: 0,
          last_read_at: new Date()
        });
    });
  }

  /**
   * Update typing indicator
   */
  async setTypingIndicator(chatId: string, userId: string, isTyping: boolean): Promise<void> {
    if (isTyping) {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + 5); // Expire after 5 seconds

      await this.knex('typing_indicators')
        .insert({
          chat_id: chatId,
          user_id: userId,
          started_at: new Date(),
          expires_at: expiresAt
        })
        .onConflict(['chat_id', 'user_id'])
        .merge({
          started_at: new Date(),
          expires_at: expiresAt
        });
    } else {
      await this.knex('typing_indicators')
        .where({ chat_id: chatId, user_id: userId })
        .delete();
    }
  }

  /**
   * Get active typing indicators for a chat
   */
  async getTypingIndicators(chatId: string): Promise<string[]> {
    const now = new Date();
    const indicators = await this.knex('typing_indicators')
      .where('chat_id', chatId)
      .where('expires_at', '>', now)
      .select('user_id');

    return indicators.map(i => i.user_id);
  }

  /**
   * Block a user
   */
  async blockUser(blockerId: string, blockedId: string, reason?: string): Promise<void> {
    await this.knex('blocked_users')
      .insert({
        blocker_id: blockerId,
        blocked_id: blockedId,
        reason,
        blocked_at: new Date()
      })
      .onConflict(['blocker_id', 'blocked_id'])
      .merge({
        reason,
        blocked_at: new Date()
      });

    // Update chat blocked status
    await this.knex('chats')
      .whereRaw("participant_ids @> ?", [JSON.stringify([blockerId, blockedId].sort())])
      .update({
        is_blocked: true,
        blocked_by: blockerId,
        blocked_at: new Date()
      });
  }

  /**
   * Check if user is blocked
   */
  async isUserBlocked(userId: string, participantIds: string[]): Promise<boolean> {
    if (participantIds.length < 2) return false;

    const [user1, user2] = participantIds;
    const blocked = await this.knex('blocked_users')
      .where(function() {
        this.where({ blocker_id: user1, blocked_id: user2 })
          .orWhere({ blocker_id: user2, blocked_id: user1 });
      })
      .first();

    return !!blocked;
  }

  /**
   * Search messages
   */
  async searchMessages(
    chatId: string,
    query: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ messages: Message[]; total: number }> {
    const offset = (page - 1) * limit;

    const [messages, countResult] = await Promise.all([
      this.knex('messages')
        .where('chat_id', chatId)
        .where('is_deleted', false)
        .whereRaw("search_vector @@ plainto_tsquery('english', ?)", [query])
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset),
      this.knex('messages')
        .where('chat_id', chatId)
        .where('is_deleted', false)
        .whereRaw("search_vector @@ plainto_tsquery('english', ?)", [query])
        .count('* as count')
        .first()
    ]);

    const total = parseInt((countResult as any)?.count || '0', 10);

    return {
      messages: messages.map(msg => this.formatMessage(msg, [])),
      total
    };
  }

  /**
   * Format chat from database
   */
  private formatChat(chat: any): Chat {
    return {
      id: chat.id,
      participant_ids: Array.isArray(chat.participant_ids) 
        ? chat.participant_ids 
        : JSON.parse(chat.participant_ids || '[]'),
      created_at: chat.created_at,
      updated_at: chat.updated_at,
      is_active: chat.is_active,
      metadata: chat.metadata || {},
      product_id: chat.product_id,
      booking_id: chat.booking_id,
      subject: chat.subject,
      last_message_preview: chat.last_message_preview,
      last_message_at: chat.last_message_at
    };
  }

  /**
   * Get total unread message count for a user
   */
  async getTotalUnreadCount(userId: string): Promise<number> {
    const result = await this.knex('conversation_participants')
      .where('user_id', userId)
      .sum('unread_count as total')
      .first();

    return parseInt((result as any)?.total || '0', 10);
  }

  /**
   * Format message from database
   */
  private formatMessage(message: any, attachments: any[] = []): Message {
    return {
      id: message.id,
      chat_id: message.chat_id,
      sender_id: message.sender_id,
      content: message.content,
      message_type: message.message_type,
      is_read: message.message_status === 'read',
      created_at: message.created_at,
      updated_at: message.updated_at,
      metadata: message.metadata || {},
      message_status: message.message_status,
      delivered_at: message.delivered_at,
      read_at: message.read_at,
      read_by: message.read_by,
      attachments: attachments.length > 0 ? attachments : (message.attachments || []),
      reactions: message.reactions ? (typeof message.reactions === 'string' ? JSON.parse(message.reactions) : message.reactions) : [],
      is_edited: message.is_edited,
      edited_content: message.edited_content,
      edited_at: message.edited_at,
      reply_to_message_id: message.reply_to_message_id
    };
  }
}

export default new MessagingRepository();

