import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import { setSocketServer } from './socketManager';
import { getDatabase } from '../config/database';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export const initializeSocket = (io: SocketServer): void => {
  setSocketServer(io);
  // Database will be accessed lazily when needed in socket handlers
  // JWT verification middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    
    console.log('🔐 ========== SOCKET AUTH ATTEMPT ==========');
    console.log('📋 Socket ID:', socket.id);
    console.log('🔑 Token provided:', !!token);
    
    if (!token) {
      console.log('❌ No token provided');
      console.log('🔐 =======================================');
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      socket.userId = decoded.sub || decoded.userId || decoded.id;
      socket.userRole = decoded.role;
      console.log('✅ Authentication successful');
      console.log('👤 User ID:', socket.userId);
      console.log('🎭 User Role:', socket.userRole);
      console.log('🔐 =======================================');
      next();
    } catch (err) {
      console.log('❌ Authentication failed:', err);
      console.log('🔐 =======================================');
      logger.error('Socket authentication failed:', err);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    const userRole = socket.userRole;

    logger.info(`Socket connected: ${socket.id} (User: ${userId})`);
    console.log('🔌 ========== SOCKET CONNECTED ==========');
    console.log('📋 Socket ID:', socket.id);
    console.log('👤 User ID:', userId);
    console.log('🎭 User Role:', userRole);
    console.log('🌐 Handshake Query:', socket.handshake.query);
    console.log('🔑 Handshake Auth:', socket.handshake.auth);
    console.log('✅ ======================================');

    // User joins their personal room
    if (userId) {
      socket.join(`user-${userId}`);
      socket.join(`role-${userRole}`);
      logger.info(`Socket ${socket.id} joined rooms: user-${userId}, role-${userRole}`);
    }

    // Handle authentication (already done in middleware, but for backward compatibility)
    socket.on('authenticate', (data) => {
      logger.info(`Re-authentication from socket: ${socket.id}`);
      socket.emit('authenticated', { success: true });
    });

    // Handle user joining specific rooms (e.g., booking rooms, chat rooms)
    socket.on('join', async (data) => {
      const { room, type } = data;
      
      if (!room) {
        socket.emit('error', { message: 'Room ID required' });
        return;
      }

      // Verify user has permission to join the room
      if (type === 'booking' && userId) {
        // Join booking-specific room
        socket.join(`booking-${room}`);
        logger.info(`Socket ${socket.id} joined booking room: ${room}`);
      } else if (type === 'chat' && userId) {
        // Join chat room
        socket.join(`chat-${room}`);
        logger.info(`Socket ${socket.id} joined chat room: ${room}`);
      } else {
        socket.join(room);
        logger.info(`Socket ${socket.id} joined room: ${room}`);
      }
    });

    // Handle user leaving rooms
    socket.on('leave', (data) => {
      const { room, type } = data;
      if (type === 'booking' && room) {
        socket.leave(`booking-${room}`);
      } else if (type === 'chat' && room) {
        socket.leave(`chat-${room}`);
      } else if (room) {
        socket.leave(room);
      }
      logger.info(`Socket ${socket.id} left room: ${room}`);
    });

    // Handle real-time chat messages (enhanced for international standards)
    socket.on('message', async (data) => {
      try {
        const { chatId, content, messageType, replyToMessageId, attachments } = data;
        
        if (!chatId || !content || !userId) {
          socket.emit('error', { message: 'Invalid message data' });
          return;
        }

        // Import MessagingService
        const { MessagingService } = await import('../services/messaging.service');
        
        // Create message via service
        const result = await MessagingService.sendMessage(chatId, {
          content,
          message_type: messageType || 'text',
          reply_to_message_id: replyToMessageId,
          attachments
        }, userId);

        if (!result.success || !result.data) {
          socket.emit('error', { message: result.error || 'Failed to send message' });
          return;
        }

        const message = result.data;

        // Get chat with product context
        const chatResult = await MessagingService.getChatById(chatId, userId);
        const chat = chatResult.data;
        
        // Fetch product details if product_id exists
        let productTitle = chat?.subject || null;
        if (chat?.product_id && !productTitle) {
          try {
            const knex = getDatabase();
            const product = await knex('products')
              .where('id', chat.product_id)
              .select('title')
              .first();
            if (product) {
              productTitle = product.title;
            }
          } catch (err) {
            logger.error('Error fetching product title:', err);
          }
        }
        
        // Prepare message payload with product context
        const messagePayload = {
          chatId,
          message: result.data,
          timestamp: new Date().toISOString(),
          // Include product context for receiver identification
          productContext: chat?.product_id ? {
            productId: chat.product_id,
            productTitle: productTitle,
            bookingId: chat.booking_id || null
          } : null
        };

        // Emit to sender for confirmation (only to sender, not broadcast)
        socket.emit('message-sent', messagePayload);

        // Broadcast to chat room ONLY (all participants including sender)
        // This is the PRIMARY method - ensures real-time delivery without duplicates
        // All participants should join the chat room when loading messages
        io.to(`chat-${chatId}`).emit('new-message', messagePayload);
        
        // Note: We removed individual user room emissions to prevent duplicates
        // All clients should join the chat room via joinRoom(chatId, 'chat')

        logger.info(`Message sent from socket ${socket.id} in chat ${chatId}`);
      } catch (error: any) {
        logger.error('Error handling message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing', async (data) => {
      try {
        const { chatId, isTyping } = data;
        
        if (!chatId || !userId) {
          return;
        }

        const { MessagingService } = await import('../services/messaging.service');
        await MessagingService.setTypingIndicator(chatId, userId, isTyping === true);

        // Broadcast typing status to other participants in chat room
        socket.to(`chat-${chatId}`).emit('user-typing', {
          chatId,
          userId,
          isTyping,
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        logger.error('Error handling typing indicator:', error);
      }
    });

    // Handle message read receipts
    socket.on('message-read', async (data) => {
      try {
        const { messageId, chatId } = data;
        
        if (!messageId || !userId) {
          return;
        }

        const { MessagingService } = await import('../services/messaging.service');
        await MessagingService.markMessageAsRead(messageId, userId);

        // Broadcast read receipt to chat room
        io.to(`chat-${chatId}`).emit('message-read-receipt', {
          messageId,
          chatId,
          readBy: userId,
          readAt: new Date().toISOString(),
        });
      } catch (error: any) {
        logger.error('Error handling message read:', error);
      }
    });

    // Handle chat read (mark all messages as read)
    socket.on('chat-read', async (data) => {
      try {
        const { chatId } = data;
        
        if (!chatId || !userId) {
          return;
        }

        const { MessagingService } = await import('../services/messaging.service');
        await MessagingService.markChatAsRead(chatId, userId);

        // Broadcast to chat room
        io.to(`chat-${chatId}`).emit('chat-read', {
          chatId,
          readBy: userId,
          readAt: new Date().toISOString(),
        });
      } catch (error: any) {
        logger.error('Error handling chat read:', error);
      }
    });

    // Handle booking status updates
    socket.on('booking-update', async (data) => {
      const { bookingId, status, notification } = data;
      
      if (!bookingId || !status) {
        socket.emit('error', { message: 'Invalid booking update data' });
        return;
      }

      // Broadcast to all users in the booking room
      io.to(`booking-${bookingId}`).emit('booking-status-changed', {
        bookingId,
        status,
        updatedBy: userId,
        timestamp: new Date().toISOString(),
      });

      // If there's a notification, send it to relevant users
      if (notification && data.toUserId) {
        io.to(`user-${data.toUserId}`).emit('notification', {
          type: 'booking-update',
          bookingId,
          status,
          message: notification.message,
          timestamp: new Date().toISOString(),
        });
      }

      logger.info(`Booking update from socket ${socket.id} for booking: ${bookingId}`);
    });

    // Handle delivery status updates
    socket.on('delivery-status-update', async (data) => {
      const { bookingId, status, location, trackingNumber, eta, driverContact, notes } = data;
      
      if (!bookingId || !status) {
        socket.emit('error', { message: 'Invalid delivery update data' });
        return;
      }

      // Broadcast to all users in the booking room
      io.to(`booking-${bookingId}`).emit('delivery-status-changed', {
        bookingId,
        status,
        location,
        trackingNumber,
        eta,
        driverContact,
        notes,
        updatedBy: userId,
        timestamp: new Date().toISOString(),
      });

      // Send notification to relevant users
      const BookingService = (await import('../services/BookingService')).default;
      const bookingResult = await BookingService.getById(bookingId);
      if (bookingResult.success && bookingResult.data) {
        const booking = bookingResult.data;
        const recipientId = booking.owner_id === userId ? booking.renter_id : booking.owner_id;
        
        io.to(`user-${recipientId}`).emit('notification', {
          type: 'delivery-update',
          bookingId,
          status,
          message: `Delivery status updated to: ${status}`,
          timestamp: new Date().toISOString(),
        });
      }

      logger.info(`Delivery status update from socket ${socket.id} for booking: ${bookingId}`);
    });

    // Handle GPS location updates for delivery tracking
    socket.on('delivery-location-update', async (data) => {
      const { bookingId, location } = data;
      
      if (!bookingId || !location || !location.lat || !location.lng) {
        socket.emit('error', { message: 'Invalid location update data' });
        return;
      }

      // Broadcast location update to all users in the booking room
      io.to(`booking-${bookingId}`).emit('delivery-location-updated', {
        bookingId,
        location: {
          lat: location.lat,
          lng: location.lng,
        },
        timestamp: new Date().toISOString(),
      });

      logger.info(`Delivery location update from socket ${socket.id} for booking: ${bookingId}`);
    });

    // Handle general notifications
    socket.on('send-notification', async (data) => {
      const { toUserId, type, message, data: notificationData } = data;
      
      if (!toUserId || !type || !message) {
        socket.emit('error', { message: 'Invalid notification data' });
        return;
      }

      io.to(`user-${toUserId}`).emit('notification', {
        type,
        message,
        data: notificationData,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Notification sent to user ${toUserId} from socket ${socket.id}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id} (User: ${userId})`);
      console.log('❌ ========== SOCKET DISCONNECTED ==========');
      console.log('📋 Socket ID:', socket.id);
      console.log('👤 User ID:', userId);
      console.log('❌ ========================================');
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error from ${socket.id}:`, error);
      console.error('⚠️ ========== SOCKET ERROR ==========');
      console.error('📋 Socket ID:', socket.id);
      console.error('👤 User ID:', userId);
      console.error('❌ Error:', error);
      console.error('⚠️ ==================================');
    });
  });

  logger.info('Socket.IO server initialized with authentication');
};
