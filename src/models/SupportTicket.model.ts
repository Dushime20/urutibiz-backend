import { SupportTicket } from '@/types/communication.types';
import { getDatabase } from '@/config/database';

export class SupportTicketModel {
  static async create(data: Partial<SupportTicket>): Promise<SupportTicket> {
    const db = getDatabase();
    const [row] = await db('support_tickets').insert(data).returning('*');
    return row;
  }

  static async findById(id: string): Promise<SupportTicket | null> {
    const db = getDatabase();
    const row = await db('support_tickets').where({ id }).first();
    return row || null;
  }

  static async findByUser(userId: string): Promise<SupportTicket[]> {
    const db = getDatabase();
    return db('support_tickets').where({ user_id: userId }).orderBy('created_at', 'desc');
  }

  static async update(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket | null> {
    const db = getDatabase();
    const [row] = await db('support_tickets').where({ id }).update(updates).returning('*');
    return row || null;
  }

  static async assign(id: string, assignedTo: string): Promise<void> {
    const db = getDatabase();
    await db('support_tickets').where({ id }).update({ assigned_to: assignedTo, assigned_at: new Date() });
  }

  static async resolve(id: string, resolution: string): Promise<void> {
    const db = getDatabase();
    await db('support_tickets').where({ id }).update({ status: 'resolved', resolution, resolved_at: new Date() });
  }
}
