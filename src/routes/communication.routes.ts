import { Router } from 'express';
import { CommunicationController } from '@/controllers/communication.controller';

const router = Router();
const controller = new CommunicationController();

// Conversations
router.post('/conversations', controller.startConversation.bind(controller));
router.get('/conversations/:id', controller.getConversation.bind(controller));
router.get('/conversations/user/:userId', controller.getUserConversations.bind(controller));
router.patch('/conversations/:id/archive', controller.archiveConversation.bind(controller));
router.patch('/conversations/:id/block', controller.blockConversation.bind(controller));

// Messages
router.post('/messages', controller.sendMessage.bind(controller));
router.get('/messages/:id', controller.getMessage.bind(controller));
router.get('/messages/conversation/:conversationId', controller.getConversationMessages.bind(controller));
router.patch('/messages/:id/read', controller.markMessageAsRead.bind(controller));
router.patch('/messages/:id/flag', controller.flagMessage.bind(controller));
router.patch('/messages/:id/edit', controller.editMessage.bind(controller));

// Support Tickets
router.post('/tickets', controller.createTicket.bind(controller));
router.get('/tickets/:id', controller.getTicket.bind(controller));
router.get('/tickets/user/:userId', controller.getUserTickets.bind(controller));
router.patch('/tickets/:id', controller.updateTicket.bind(controller));
router.patch('/tickets/:id/assign', controller.assignTicket.bind(controller));
router.patch('/tickets/:id/resolve', controller.resolveTicket.bind(controller));

// Support Ticket Messages
router.post('/ticket-messages', controller.addTicketMessage.bind(controller));
router.get('/ticket-messages/ticket/:ticketId', controller.getTicketMessages.bind(controller));

// AI Chat Logs
router.post('/ai-chat-logs', controller.logAIChat.bind(controller));
router.get('/ai-chat-logs/session/:sessionId', controller.getAIChatLogsBySession.bind(controller));
router.get('/ai-chat-logs/user/:userId', controller.getAIChatLogsByUser.bind(controller));

export default router;
