import { Router } from 'express';
import { MessagingController } from '../controllers/messaging.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all messaging routes
router.use(authenticateToken);

// Chat Management
router.get('/chats', MessagingController.getChats);
router.post('/chats', MessagingController.createOrGetChat); // Create or get chat
// Admin: list messages across all chats (must be before :chatId route)
router.get('/chats/messages', MessagingController.getAllChatMessages);
router.get('/chats/:chatId', MessagingController.getChatById);
router.get('/chats/:chatId/messages', MessagingController.getChatMessages);
router.post('/chats/:chatId/messages', MessagingController.sendMessage);
router.patch('/chats/:chatId/read', MessagingController.markChatAsRead); // Mark chat as read
router.post('/chats/:chatId/typing', MessagingController.setTypingIndicator); // Set typing indicator
router.get('/chats/:chatId/typing', MessagingController.getTypingIndicators); // Get typing indicators
router.get('/chats/:chatId/search', MessagingController.searchMessages); // Search messages

// Message Management
router.get('/unread-count', MessagingController.getTotalUnreadCount); // Get total unread count
router.put('/messages/:messageId', MessagingController.updateMessage);
router.delete('/messages/:messageId', MessagingController.deleteMessage);
router.patch('/messages/:messageId/read', MessagingController.markMessageAsRead); // Mark message as read

// User Management
router.post('/users/:userId/block', MessagingController.blockUser); // Block a user

// Message Templates
router.get('/message-templates', MessagingController.getMessageTemplates);
router.post('/message-templates', MessagingController.createMessageTemplate);
router.put('/message-templates/:templateId', MessagingController.updateMessageTemplate);
router.delete('/message-templates/:templateId', MessagingController.deleteMessageTemplate);

// Messaging Statistics
router.get('/messaging/stats', MessagingController.getMessageStats);

// AI Features
router.post('/messages/:messageId/analyze-sentiment', MessagingController.analyzeSentiment);
router.post('/chats/:chatId/detect-conflict', MessagingController.detectConflict);
router.post('/chats/:chatId/generate-suggestions', MessagingController.generateResponseSuggestions);

export default router;
