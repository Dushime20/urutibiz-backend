import { Message } from '@/types/communication.types';
import { getDatabase } from '@/config/database';

export class MessageModel {
  static async create(data: Partial<Message>): Promise<Message> {
    const db = getDatabase();
    const [row] = await db('messages').insert(data).returning('*');
    return row;
  }

  static async findById(id: string): Promise<Message | null> {
    const db = getDatabase();
    const row = await db('messages').where({ id }).first();
    return row || null;
  }

  static async findByConversation(conversationId: string): Promise<Message[]> {
    const db = getDatabase();
    return db('messages')
      .where({ conversation_id: conversationId })
      .orderBy('created_at', 'asc');
  }

  static async markAsRead(id: string): Promise<void> {
    const db = getDatabase();
    await db('messages').where({ id }).update({ is_read: true, read_at: new Date() });
  }

  static async flag(id: string): Promise<void> {
    const db = getDatabase();
    await db('messages').where({ id }).update({ is_flagged: true });
  }

  static async edit(id: string, content: string): Promise<void> {
    const db = getDatabase();
    await db('messages').where({ id }).update({ content, is_edited: true, edited_at: new Date() });
  }
}
