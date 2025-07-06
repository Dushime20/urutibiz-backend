import { Knex } from 'knex';
import { Conversation } from '@/types/communication.types';
import { getDatabase } from '@/config/database';

export class ConversationModel {
  static async create(data: Partial<Conversation>): Promise<Conversation> {
    const db = getDatabase();
    const [row] = await db('conversations').insert(data).returning('*');
    return row;
  }

  static async findById(id: string): Promise<Conversation | null> {
    const db = getDatabase();
    const row = await db('conversations').where({ id }).first();
    return row || null;
  }

  static async findByUser(userId: string): Promise<Conversation[]> {
    const db = getDatabase();
    return db('conversations')
      .where('participant_1_id', userId)
      .orWhere('participant_2_id', userId)
      .orderBy('updated_at', 'desc');
  }

  static async update(id: string, updates: Partial<Conversation>): Promise<Conversation | null> {
    const db = getDatabase();
    const [row] = await db('conversations').where({ id }).update(updates).returning('*');
    return row || null;
  }

  static async archive(id: string): Promise<void> {
    const db = getDatabase();
    await db('conversations').where({ id }).update({ status: 'archived', updated_at: new Date() });
  }

  static async block(id: string): Promise<void> {
    const db = getDatabase();
    await db('conversations').where({ id }).update({ status: 'blocked', updated_at: new Date() });
  }
}
