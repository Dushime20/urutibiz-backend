import { AIChatLog } from '@/types/communication.types';
import { getDatabase } from '@/config/database';

export class AIChatLogModel {
  static async create(data: Partial<AIChatLog>): Promise<AIChatLog> {
    const db = getDatabase();
    const [row] = await db('ai_chat_logs').insert(data).returning('*');
    return row;
  }

  static async findBySession(sessionId: string): Promise<AIChatLog[]> {
    const db = getDatabase();
    return db('ai_chat_logs')
      .where({ session_id: sessionId })
      .orderBy('created_at', 'asc');
  }

  static async findByUser(userId: string): Promise<AIChatLog[]> {
    const db = getDatabase();
    return db('ai_chat_logs')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');
  }
}
