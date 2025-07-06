import { SupportTicketMessage } from '@/types/communication.types';
import { getDatabase } from '@/config/database';

export class SupportTicketMessageModel {
  static async create(data: Partial<SupportTicketMessage>): Promise<SupportTicketMessage> {
    const db = getDatabase();
    const [row] = await db('support_ticket_messages').insert(data).returning('*');
    return row;
  }

  static async findByTicket(ticketId: string): Promise<SupportTicketMessage[]> {
    const db = getDatabase();
    return db('support_ticket_messages')
      .where({ ticket_id: ticketId })
      .orderBy('created_at', 'asc');
  }
}
