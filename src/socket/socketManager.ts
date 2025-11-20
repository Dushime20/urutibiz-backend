import { Server as SocketServer } from 'socket.io';

let io: SocketServer | null = null;

export const setSocketServer = (server: SocketServer): void => {
  io = server;
};

export const emitNotificationToUser = (
  userId: string | undefined,
  payload: Record<string, any>
): void => {
  if (!io || !userId) return;

  try {
    io.to(`user-${userId}`).emit('notification', payload);
  } catch (error) {
    console.error('[Socket] Failed to emit notification:', error);
  }
};

