import { Request, Response } from 'express';
import { CommunicationService } from '@/services/communication.service';
import logger from '@/utils/logger';

export class CommunicationController {
  // Conversations
  async startConversation(req: Request, res: Response) {
    try {
      const conversation = await CommunicationService.startConversation(req.body);
      res.status(201).json({ success: true, data: conversation });
    } catch (error) {
      logger.error('Error starting conversation:', error);
      res.status(500).json({ success: false, message: 'Failed to start conversation' });
    }
  }

  async getConversation(req: Request, res: Response): Promise<void> {
    try {
      const conversation = await CommunicationService.getConversation(req.params.id);
      if (!conversation) {
        res.status(404).json({ success: false, message: 'Conversation not found' });
        return;
      }
      res.json({ success: true, data: conversation });
    } catch (error) {
      logger.error('Error getting conversation:', error);
      res.status(500).json({ success: false, message: 'Failed to get conversation' });
    }
  }

  async getUserConversations(req: Request, res: Response) {
    try {
      const conversations = await CommunicationService.getUserConversations(req.params.userId);
      res.json({ success: true, data: conversations });
    } catch (error) {
      logger.error('Error getting user conversations:', error);
      res.status(500).json({ success: false, message: 'Failed to get conversations' });
    }
  }

  async archiveConversation(req: Request, res: Response) {
    try {
      await CommunicationService.archiveConversation(req.params.id);
      res.json({ success: true, message: 'Conversation archived' });
    } catch (error) {
      logger.error('Error archiving conversation:', error);
      res.status(500).json({ success: false, message: 'Failed to archive conversation' });
    }
  }

  async blockConversation(req: Request, res: Response) {
    try {
      await CommunicationService.blockConversation(req.params.id);
      res.json({ success: true, message: 'Conversation blocked' });
    } catch (error) {
      logger.error('Error blocking conversation:', error);
      res.status(500).json({ success: false, message: 'Failed to block conversation' });
    }
  }

  // Messages
  async sendMessage(req: Request, res: Response) {
    try {
      const message = await CommunicationService.sendMessage(req.body);
      res.status(201).json({ success: true, data: message });
    } catch (error) {
      logger.error('Error sending message:', error);
      res.status(500).json({ success: false, message: 'Failed to send message' });
    }
  }

  async getMessage(req: Request, res: Response): Promise<void> {
    try {
      const message = await CommunicationService.getMessage(req.params.id);
      if (!message) {
        res.status(404).json({ success: false, message: 'Message not found' });
        return;
      }
      res.json({ success: true, data: message });
    } catch (error) {
      logger.error('Error getting message:', error);
      res.status(500).json({ success: false, message: 'Failed to get message' });
    }
  }

  async getConversationMessages(req: Request, res: Response) {
    try {
      const messages = await CommunicationService.getConversationMessages(req.params.conversationId);
      res.json({ success: true, data: messages });
    } catch (error) {
      logger.error('Error getting conversation messages:', error);
      res.status(500).json({ success: false, message: 'Failed to get messages' });
    }
  }

  async markMessageAsRead(req: Request, res: Response) {
    try {
      await CommunicationService.markMessageAsRead(req.params.id);
      res.json({ success: true, message: 'Message marked as read' });
    } catch (error) {
      logger.error('Error marking message as read:', error);
      res.status(500).json({ success: false, message: 'Failed to mark as read' });
    }
  }

  async flagMessage(req: Request, res: Response) {
    try {
      await CommunicationService.flagMessage(req.params.id);
      res.json({ success: true, message: 'Message flagged' });
    } catch (error) {
      logger.error('Error flagging message:', error);
      res.status(500).json({ success: false, message: 'Failed to flag message' });
    }
  }

  async editMessage(req: Request, res: Response) {
    try {
      await CommunicationService.editMessage(req.params.id, req.body.content);
      res.json({ success: true, message: 'Message edited' });
    } catch (error) {
      logger.error('Error editing message:', error);
      res.status(500).json({ success: false, message: 'Failed to edit message' });
    }
  }

  // Support Tickets
  async createTicket(req: Request, res: Response) {
    try {
      const ticket = await CommunicationService.createTicket(req.body);
      res.status(201).json({ success: true, data: ticket });
    } catch (error) {
      logger.error('Error creating ticket:', error);
      res.status(500).json({ success: false, message: 'Failed to create ticket' });
    }
  }

  async getTicket(req: Request, res: Response): Promise<void> {
    try {
      const ticket = await CommunicationService.getTicket(req.params.id);
      if (!ticket) {
        res.status(404).json({ success: false, message: 'Ticket not found' });
        return;
      }
      res.json({ success: true, data: ticket });
    } catch (error) {
      logger.error('Error getting ticket:', error);
      res.status(500).json({ success: false, message: 'Failed to get ticket' });
    }
  }

  async getUserTickets(req: Request, res: Response) {
    try {
      const tickets = await CommunicationService.getUserTickets(req.params.userId);
      res.json({ success: true, data: tickets });
    } catch (error) {
      logger.error('Error getting user tickets:', error);
      res.status(500).json({ success: false, message: 'Failed to get tickets' });
    }
  }

  async updateTicket(req: Request, res: Response) {
    try {
      const ticket = await CommunicationService.updateTicket(req.params.id, req.body);
      res.json({ success: true, data: ticket });
    } catch (error) {
      logger.error('Error updating ticket:', error);
      res.status(500).json({ success: false, message: 'Failed to update ticket' });
    }
  }

  async assignTicket(req: Request, res: Response) {
    try {
      await CommunicationService.assignTicket(req.params.id, req.body.assigned_to);
      res.json({ success: true, message: 'Ticket assigned' });
    } catch (error) {
      logger.error('Error assigning ticket:', error);
      res.status(500).json({ success: false, message: 'Failed to assign ticket' });
    }
  }

  async resolveTicket(req: Request, res: Response) {
    try {
      await CommunicationService.resolveTicket(req.params.id, req.body.resolution);
      res.json({ success: true, message: 'Ticket resolved' });
    } catch (error) {
      logger.error('Error resolving ticket:', error);
      res.status(500).json({ success: false, message: 'Failed to resolve ticket' });
    }
  }

  // Support Ticket Messages
  async addTicketMessage(req: Request, res: Response) {
    try {
      const message = await CommunicationService.addTicketMessage(req.body);
      res.status(201).json({ success: true, data: message });
    } catch (error) {
      logger.error('Error adding ticket message:', error);
      res.status(500).json({ success: false, message: 'Failed to add ticket message' });
    }
  }

  async getTicketMessages(req: Request, res: Response) {
    try {
      const messages = await CommunicationService.getTicketMessages(req.params.ticketId);
      res.json({ success: true, data: messages });
    } catch (error) {
      logger.error('Error getting ticket messages:', error);
      res.status(500).json({ success: false, message: 'Failed to get ticket messages' });
    }
  }

  // AI Chat Logs
  async logAIChat(req: Request, res: Response) {
    try {
      const log = await CommunicationService.logAIChat(req.body);
      res.status(201).json({ success: true, data: log });
    } catch (error) {
      logger.error('Error logging AI chat:', error);
      res.status(500).json({ success: false, message: 'Failed to log AI chat' });
    }
  }

  async getAIChatLogsBySession(req: Request, res: Response) {
    try {
      const logs = await CommunicationService.getAIChatLogsBySession(req.params.sessionId);
      res.json({ success: true, data: logs });
    } catch (error) {
      logger.error('Error getting AI chat logs by session:', error);
      res.status(500).json({ success: false, message: 'Failed to get AI chat logs' });
    }
  }

  async getAIChatLogsByUser(req: Request, res: Response) {
    try {
      const logs = await CommunicationService.getAIChatLogsByUser(req.params.userId);
      res.json({ success: true, data: logs });
    } catch (error) {
      logger.error('Error getting AI chat logs by user:', error);
      res.status(500).json({ success: false, message: 'Failed to get AI chat logs' });
    }
  }
}
