import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export const initializeSocket = (io: SocketServer): void => {
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

    // Handle real-time chat messages
    socket.on('message', async (data) => {
      const { chatId, message, toUserId } = data;
      
      if (!chatId || !message || !toUserId) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      // Broadcast to recipient
      io.to(`user-${toUserId}`).emit('new-message', {
        chatId,
        message,
        fromUserId: userId,
        timestamp: new Date().toISOString(),
      });

      // Also emit to sender for confirmation
      socket.emit('message-sent', {
        chatId,
        message,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Message from socket ${socket.id} to user ${toUserId}`);
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
