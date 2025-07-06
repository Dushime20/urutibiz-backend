import { ConversationModel } from '@/models/Conversation.model';
import { MessageModel } from '@/models/Message.model';
import { SupportTicketModel } from '@/models/SupportTicket.model';
import { SupportTicketMessageModel } from '@/models/SupportTicketMessage.model';
import { AIChatLogModel } from '@/models/AIChatLog.model';
import { Conversation, Message, SupportTicket, SupportTicketMessage, AIChatLog } from '@/types/communication.types';

export class CommunicationService {
  // Conversations
  static async startConversation(data: Partial<Conversation>): Promise<Conversation> {
    return ConversationModel.create(data);
  }

  static async getConversation(id: string): Promise<Conversation | null> {
    return ConversationModel.findById(id);
  }

  static async getUserConversations(userId: string): Promise<Conversation[]> {
    return ConversationModel.findByUser(userId);
  }

  static async archiveConversation(id: string): Promise<void> {
    return ConversationModel.archive(id);
  }

  static async blockConversation(id: string): Promise<void> {
    return ConversationModel.block(id);
  }

  // Messages
  static async sendMessage(data: Partial<Message>): Promise<Message> {
    return MessageModel.create(data);
  }

  static async getMessage(id: string): Promise<Message | null> {
    return MessageModel.findById(id);
  }

  static async getConversationMessages(conversationId: string): Promise<Message[]> {
    return MessageModel.findByConversation(conversationId);
  }

  static async markMessageAsRead(id: string): Promise<void> {
    return MessageModel.markAsRead(id);
  }

  static async flagMessage(id: string): Promise<void> {
    return MessageModel.flag(id);
  }

  static async editMessage(id: string, content: string): Promise<void> {
    return MessageModel.edit(id, content);
  }

  // Support Tickets
  static async createTicket(data: Partial<SupportTicket>): Promise<SupportTicket> {
    return SupportTicketModel.create(data);
  }

  static async getTicket(id: string): Promise<SupportTicket | null> {
    return SupportTicketModel.findById(id);
  }

  static async getUserTickets(userId: string): Promise<SupportTicket[]> {
    return SupportTicketModel.findByUser(userId);
  }

  static async updateTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket | null> {
    return SupportTicketModel.update(id, updates);
  }

  static async assignTicket(id: string, assignedTo: string): Promise<void> {
    return SupportTicketModel.assign(id, assignedTo);
  }

  static async resolveTicket(id: string, resolution: string): Promise<void> {
    return SupportTicketModel.resolve(id, resolution);
  }

  // Support Ticket Messages
  static async addTicketMessage(data: Partial<SupportTicketMessage>): Promise<SupportTicketMessage> {
    return SupportTicketMessageModel.create(data);
  }

  static async getTicketMessages(ticketId: string): Promise<SupportTicketMessage[]> {
    return SupportTicketMessageModel.findByTicket(ticketId);
  }

  // AI Chat Logs
  static async logAIChat(data: Partial<AIChatLog>): Promise<AIChatLog> {
    return AIChatLogModel.create(data);
  }

  static async getAIChatLogsBySession(sessionId: string): Promise<AIChatLog[]> {
    return AIChatLogModel.findBySession(sessionId);
  }

  static async getAIChatLogsByUser(userId: string): Promise<AIChatLog[]> {
    return AIChatLogModel.findByUser(userId);
  }
}
