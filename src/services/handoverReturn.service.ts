import { getDatabase } from '@/config/database';
import { ServiceResponse } from '@/types';
import {
  HandoverSession,
  ReturnSession,
  HandoverMessage,
  ReturnMessage,
  HandoverNotification,
  ReturnNotification,
  CreateHandoverSessionRequest,
  UpdateHandoverSessionRequest,
  CompleteHandoverRequest,
  CreateReturnSessionRequest,
  UpdateReturnSessionRequest,
  CompleteReturnRequest,
  SendMessageRequest,
  ScheduleNotificationRequest,
  HandoverSessionFilters,
  ReturnSessionFilters,
  MessageFilters,
  NotificationFilters,
  HandoverReturnStats,
  HandoverStatus,
  ReturnStatus,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus
} from '@/types/handoverReturn.types';

export class HandoverReturnService {
  private db = getDatabase();

  // =====================================================
  // HANDOVER SESSION MANAGEMENT
  // =====================================================

  /**
   * Create a new handover session
   */
  async createHandoverSession(data: CreateHandoverSessionRequest): Promise<ServiceResponse<HandoverSession>> {
    try {
      // Generate 6-digit verification code
      const handoverCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const handoverSession: HandoverSession = {
        id: require('uuid').v4(),
        bookingId: data.bookingId,
        ownerId: '', // Will be populated from booking
        renterId: '', // Will be populated from booking
        productId: '', // Will be populated from booking
        handoverType: data.handoverType,
        scheduledDateTime: data.scheduledDateTime,
        location: data.location,
        status: 'scheduled' as HandoverStatus,
        handoverCode,
        preHandoverPhotos: [],
        postHandoverPhotos: [],
        conditionReport: {
          overallCondition: 'excellent',
          damages: [],
          wearAndTear: [],
          functionality: [],
          cleanliness: 'excellent',
          inspectionDate: new Date()
        },
        accessoryChecklist: [],
        messages: [],
        notifications: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Get booking details
      const booking = await this.db('bookings')
        .where('id', data.bookingId)
        .first();

      if (!booking) {
        return { success: false, error: 'Booking not found' };
      }

      handoverSession.ownerId = booking.owner_id;
      handoverSession.renterId = booking.renter_id;
      handoverSession.productId = booking.product_id;

      await this.db('handover_sessions').insert({
        id: handoverSession.id,
        booking_id: handoverSession.bookingId,
        owner_id: handoverSession.ownerId,
        renter_id: handoverSession.renterId,
        product_id: handoverSession.productId,
        handover_type: handoverSession.handoverType,
        scheduled_date_time: handoverSession.scheduledDateTime,
        location_type: handoverSession.location.type,
        location_address: handoverSession.location.address,
        location_lat: handoverSession.location.coordinates.lat,
        location_lng: handoverSession.location.coordinates.lng,
        location_instructions: handoverSession.location.instructions,
        status: handoverSession.status,
        handover_code: handoverSession.handoverCode,
        pre_handover_photos: JSON.stringify(handoverSession.preHandoverPhotos),
        post_handover_photos: JSON.stringify(handoverSession.postHandoverPhotos),
        condition_report: JSON.stringify(handoverSession.conditionReport),
        accessory_checklist: JSON.stringify(handoverSession.accessoryChecklist),
        notes: data.notes,
        created_at: handoverSession.createdAt,
        updated_at: handoverSession.updatedAt
      });

      // Schedule initial notifications
      await this.scheduleHandoverNotifications(handoverSession);

      return { success: true, data: handoverSession };
    } catch (error) {
      console.error('[HandoverReturnService] Create handover session error:', error);
      return { success: false, error: 'Failed to create handover session' };
    }
  }

  /**
   * Get handover session by ID
   */
  async getHandoverSessionById(sessionId: string): Promise<ServiceResponse<HandoverSession>> {
    try {
      const result = await this.db('handover_sessions')
        .where('id', sessionId)
        .first();

      if (!result) {
        return { success: false, error: 'Handover session not found' };
      }

      const handoverSession: HandoverSession = {
        id: result.id,
        bookingId: result.booking_id,
        ownerId: result.owner_id,
        renterId: result.renter_id,
        productId: result.product_id,
        handoverType: result.handover_type,
        scheduledDateTime: result.scheduled_date_time,
        actualDateTime: result.actual_date_time,
        location: {
          type: result.location_type,
          address: result.location_address,
          coordinates: {
            lat: result.location_lat,
            lng: result.location_lng
          },
          instructions: result.location_instructions
        },
        status: result.status,
        handoverCode: result.handover_code,
        preHandoverPhotos: JSON.parse(result.pre_handover_photos || '[]'),
        postHandoverPhotos: JSON.parse(result.post_handover_photos || '[]'),
        conditionReport: JSON.parse(result.condition_report || '{}'),
        accessoryChecklist: JSON.parse(result.accessory_checklist || '[]'),
        ownerSignature: result.owner_signature,
        renterSignature: result.renter_signature,
        witnessId: result.witness_id,
        messages: [], // Will be loaded separately
        notifications: [], // Will be loaded separately
        createdAt: result.created_at,
        updatedAt: result.updated_at,
        completedAt: result.completed_at
      };

      return { success: true, data: handoverSession };
    } catch (error) {
      console.error('[HandoverReturnService] Get handover session error:', error);
      return { success: false, error: 'Failed to get handover session' };
    }
  }

  /**
   * Complete handover session
   */
  async completeHandoverSession(sessionId: string, data: CompleteHandoverRequest): Promise<ServiceResponse<HandoverSession>> {
    try {
      const session = await this.getHandoverSessionById(sessionId);
      if (!session.success) {
        return session;
      }

      const handoverSession = session.data!;

      // Verify handover code
      if (data.handoverCode !== handoverSession.handoverCode) {
        return { success: false, error: 'Invalid handover code' };
      }

      // Update handover session
      await this.db('handover_sessions')
        .where('id', sessionId)
        .update({
          status: 'completed',
          actual_date_time: new Date(),
          post_handover_photos: JSON.stringify(data.photos || []),
          condition_report: JSON.stringify(data.conditionReport),
          accessory_checklist: JSON.stringify(data.accessoryChecklist),
          owner_signature: data.ownerSignature,
          renter_signature: data.renterSignature,
          completed_at: new Date(),
          updated_at: new Date()
        });

      // Send completion notifications
      await this.sendHandoverCompletionNotifications(handoverSession);

      return { success: true, data: handoverSession };
    } catch (error) {
      console.error('[HandoverReturnService] Complete handover session error:', error);
      return { success: false, error: 'Failed to complete handover session' };
    }
  }

  // =====================================================
  // RETURN SESSION MANAGEMENT
  // =====================================================

  /**
   * Create a new return session
   */
  async createReturnSession(data: CreateReturnSessionRequest): Promise<ServiceResponse<ReturnSession>> {
    try {
      // Generate 6-digit verification code
      const returnCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const returnSession: ReturnSession = {
        id: require('uuid').v4(),
        bookingId: data.bookingId,
        handoverSessionId: data.handoverSessionId,
        ownerId: '', // Will be populated from booking
        renterId: '', // Will be populated from booking
        productId: '', // Will be populated from booking
        returnType: data.returnType,
        scheduledDateTime: data.scheduledDateTime,
        location: data.location,
        status: 'scheduled' as ReturnStatus,
        returnCode,
        preReturnPhotos: [],
        postReturnPhotos: [],
        conditionComparison: {
          overallConditionChange: 'same',
          newDamages: [],
          resolvedDamages: [],
          wearProgression: [],
          functionalityChanges: [],
          cleanlinessChange: 'same'
        },
        accessoryVerification: [],
        messages: [],
        notifications: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Get booking details
      const booking = await this.db('bookings')
        .where('id', data.bookingId)
        .first();

      if (!booking) {
        return { success: false, error: 'Booking not found' };
      }

      returnSession.ownerId = booking.owner_id;
      returnSession.renterId = booking.renter_id;
      returnSession.productId = booking.product_id;

      await this.db('return_sessions').insert({
        id: returnSession.id,
        booking_id: returnSession.bookingId,
        handover_session_id: returnSession.handoverSessionId,
        owner_id: returnSession.ownerId,
        renter_id: returnSession.renterId,
        product_id: returnSession.productId,
        return_type: returnSession.returnType,
        scheduled_date_time: returnSession.scheduledDateTime,
        location_type: returnSession.location.type,
        location_address: returnSession.location.address,
        location_lat: returnSession.location.coordinates.lat,
        location_lng: returnSession.location.coordinates.lng,
        location_instructions: returnSession.location.instructions,
        status: returnSession.status,
        return_code: returnSession.returnCode,
        pre_return_photos: JSON.stringify(returnSession.preReturnPhotos),
        post_return_photos: JSON.stringify(returnSession.postReturnPhotos),
        condition_comparison: JSON.stringify(returnSession.conditionComparison),
        accessory_verification: JSON.stringify(returnSession.accessoryVerification),
        notes: data.notes,
        created_at: returnSession.createdAt,
        updated_at: returnSession.updatedAt
      });

      // Schedule initial notifications
      await this.scheduleReturnNotifications(returnSession);

      return { success: true, data: returnSession };
    } catch (error) {
      console.error('[HandoverReturnService] Create return session error:', error);
      return { success: false, error: 'Failed to create return session' };
    }
  }

  /**
   * Complete return session
   */
  async completeReturnSession(sessionId: string, data: CompleteReturnRequest): Promise<ServiceResponse<ReturnSession>> {
    try {
      const session = await this.getReturnSessionById(sessionId);
      if (!session.success) {
        return session;
      }

      const returnSession = session.data!;

      // Verify return code
      if (data.returnCode !== returnSession.returnCode) {
        return { success: false, error: 'Invalid return code' };
      }

      // Update return session
      await this.db('return_sessions')
        .where('id', sessionId)
        .update({
          status: 'completed',
          actual_date_time: new Date(),
          post_return_photos: JSON.stringify(data.photos || []),
          condition_comparison: JSON.stringify(data.conditionComparison),
          accessory_verification: JSON.stringify(data.accessoryVerification),
          owner_signature: data.ownerSignature,
          renter_signature: data.renterSignature,
          completed_at: new Date(),
          updated_at: new Date()
        });

      // Send completion notifications
      await this.sendReturnCompletionNotifications(returnSession);

      return { success: true, data: returnSession };
    } catch (error) {
      console.error('[HandoverReturnService] Complete return session error:', error);
      return { success: false, error: 'Failed to complete return session' };
    }
  }

  /**
   * Get return session by ID
   */
  async getReturnSessionById(sessionId: string): Promise<ServiceResponse<ReturnSession>> {
    try {
      const result = await this.db('return_sessions')
        .where('id', sessionId)
        .first();

      if (!result) {
        return { success: false, error: 'Return session not found' };
      }

      const returnSession: ReturnSession = {
        id: result.id,
        bookingId: result.booking_id,
        handoverSessionId: result.handover_session_id,
        ownerId: result.owner_id,
        renterId: result.renter_id,
        productId: result.product_id,
        returnType: result.return_type,
        scheduledDateTime: result.scheduled_date_time,
        actualDateTime: result.actual_date_time,
        location: {
          type: result.location_type,
          address: result.location_address,
          coordinates: {
            lat: result.location_lat,
            lng: result.location_lng
          },
          instructions: result.location_instructions
        },
        status: result.status,
        returnCode: result.return_code,
        preReturnPhotos: JSON.parse(result.pre_return_photos || '[]'),
        postReturnPhotos: JSON.parse(result.post_return_photos || '[]'),
        conditionComparison: JSON.parse(result.condition_comparison || '{}'),
        accessoryVerification: JSON.parse(result.accessory_verification || '[]'),
        damageAssessment: result.damage_assessment ? JSON.parse(result.damage_assessment) : undefined,
        cleaningAssessment: result.cleaning_assessment ? JSON.parse(result.cleaning_assessment) : undefined,
        maintenanceRequired: JSON.parse(result.maintenance_required || '[]'),
        ownerSignature: result.owner_signature,
        renterSignature: result.renter_signature,
        inspectorId: result.inspector_id,
        messages: [], // Will be loaded separately
        notifications: [], // Will be loaded separately
        createdAt: result.created_at,
        updatedAt: result.updated_at,
        completedAt: result.completed_at
      };

      return { success: true, data: returnSession };
    } catch (error) {
      console.error('[HandoverReturnService] Get return session error:', error);
      return { success: false, error: 'Failed to get return session' };
    }
  }

  // =====================================================
  // MESSAGE MANAGEMENT
  // =====================================================

  /**
   * Send message in handover or return session
   */
  async sendMessage(data: SendMessageRequest): Promise<ServiceResponse<HandoverMessage | ReturnMessage>> {
    try {
      if (data.handoverSessionId) {
        return await this.sendHandoverMessage(data);
      } else if (data.returnSessionId) {
        return await this.sendReturnMessage(data);
      } else {
        return { success: false, error: 'Either handoverSessionId or returnSessionId is required' };
      }
    } catch (error) {
      console.error('[HandoverReturnService] Send message error:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }

  private async sendHandoverMessage(data: SendMessageRequest): Promise<ServiceResponse<HandoverMessage>> {
    const message: HandoverMessage = {
      id: require('uuid').v4(),
      senderId: '', // Will be set by controller
      senderType: 'renter', // Will be set by controller
      message: data.message,
      messageType: data.messageType,
      attachments: data.attachments || [],
      timestamp: new Date(),
      readBy: []
    };

    await this.db('handover_messages').insert({
      id: message.id,
      handover_session_id: data.handoverSessionId,
      sender_id: message.senderId,
      sender_type: message.senderType,
      message: message.message,
      message_type: message.messageType,
      attachments: JSON.stringify(message.attachments),
      timestamp: message.timestamp,
      read_by: JSON.stringify(message.readBy)
    });

    return { success: true, data: message };
  }

  private async sendReturnMessage(data: SendMessageRequest): Promise<ServiceResponse<ReturnMessage>> {
    const message: ReturnMessage = {
      id: require('uuid').v4(),
      senderId: '', // Will be set by controller
      senderType: 'renter', // Will be set by controller
      message: data.message,
      messageType: data.messageType,
      attachments: data.attachments || [],
      timestamp: new Date(),
      readBy: []
    };

    await this.db('return_messages').insert({
      id: message.id,
      return_session_id: data.returnSessionId,
      sender_id: message.senderId,
      sender_type: message.senderType,
      message: message.message,
      message_type: message.messageType,
      attachments: JSON.stringify(message.attachments),
      timestamp: message.timestamp,
      read_by: JSON.stringify(message.readBy)
    });

    return { success: true, data: message };
  }

  // =====================================================
  // NOTIFICATION MANAGEMENT
  // =====================================================

  /**
   * Schedule notification
   */
  async scheduleNotification(data: ScheduleNotificationRequest): Promise<ServiceResponse<HandoverNotification | ReturnNotification>> {
    try {
      if (data.handoverSessionId) {
        return await this.scheduleHandoverNotification(data);
      } else if (data.returnSessionId) {
        return await this.scheduleReturnNotification(data);
      } else {
        return { success: false, error: 'Either handoverSessionId or returnSessionId is required' };
      }
    } catch (error) {
      console.error('[HandoverReturnService] Schedule notification error:', error);
      return { success: false, error: 'Failed to schedule notification' };
    }
  }

  private async scheduleHandoverNotification(data: ScheduleNotificationRequest): Promise<ServiceResponse<HandoverNotification>> {
    const notification: HandoverNotification = {
      id: require('uuid').v4(),
      userId: data.userId,
      handoverSessionId: data.handoverSessionId!,
      type: data.type as any,
      channel: data.channel,
      message: data.message,
      priority: data.priority,
      scheduledAt: data.scheduledAt,
      status: 'pending' as NotificationStatus,
      metadata: data.metadata || {}
    };

    await this.db('handover_notifications').insert({
      id: notification.id,
      user_id: notification.userId,
      handover_session_id: notification.handoverSessionId,
      type: notification.type,
      channel: notification.channel,
      message: notification.message,
      priority: notification.priority,
      scheduled_at: notification.scheduledAt,
      status: notification.status,
      metadata: JSON.stringify(notification.metadata)
    });

    return { success: true, data: notification };
  }

  private async scheduleReturnNotification(data: ScheduleNotificationRequest): Promise<ServiceResponse<ReturnNotification>> {
    const notification: ReturnNotification = {
      id: require('uuid').v4(),
      userId: data.userId,
      returnSessionId: data.returnSessionId!,
      type: data.type as any,
      channel: data.channel,
      message: data.message,
      priority: data.priority,
      scheduledAt: data.scheduledAt,
      status: 'pending' as NotificationStatus,
      metadata: data.metadata || {}
    };

    await this.db('return_notifications').insert({
      id: notification.id,
      user_id: notification.userId,
      return_session_id: notification.returnSessionId,
      type: notification.type,
      channel: notification.channel,
      message: notification.message,
      priority: notification.priority,
      scheduled_at: notification.scheduledAt,
      status: notification.status,
      metadata: JSON.stringify(notification.metadata)
    });

    return { success: true, data: notification };
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  private async scheduleHandoverNotifications(handoverSession: HandoverSession): Promise<void> {
    // Schedule reminder notification (24 hours before)
    const reminderTime = new Date(handoverSession.scheduledDateTime.getTime() - 24 * 60 * 60 * 1000);
    
    await this.scheduleHandoverNotification({
      userId: handoverSession.renterId,
      handoverSessionId: handoverSession.id,
      type: 'reminder',
      channel: 'push',
      message: `Handover reminder: Your rental starts tomorrow at ${handoverSession.scheduledDateTime.toLocaleTimeString()}`,
      priority: 'medium',
      scheduledAt: reminderTime
    });

    await this.scheduleHandoverNotification({
      userId: handoverSession.ownerId,
      handoverSessionId: handoverSession.id,
      type: 'reminder',
      channel: 'push',
      message: `Handover reminder: You have a handover scheduled tomorrow at ${handoverSession.scheduledDateTime.toLocaleTimeString()}`,
      priority: 'medium',
      scheduledAt: reminderTime
    });
  }

  private async scheduleReturnNotifications(returnSession: ReturnSession): Promise<void> {
    // Schedule reminder notification (24 hours before)
    const reminderTime = new Date(returnSession.scheduledDateTime.getTime() - 24 * 60 * 60 * 1000);
    
    await this.scheduleReturnNotification({
      userId: returnSession.renterId,
      returnSessionId: returnSession.id,
      type: 'reminder',
      channel: 'push',
      message: `Return reminder: Your rental ends tomorrow at ${returnSession.scheduledDateTime.toLocaleTimeString()}`,
      priority: 'medium',
      scheduledAt: reminderTime
    });

    await this.scheduleReturnNotification({
      userId: returnSession.ownerId,
      returnSessionId: returnSession.id,
      type: 'reminder',
      channel: 'push',
      message: `Return reminder: You have a return scheduled tomorrow at ${returnSession.scheduledDateTime.toLocaleTimeString()}`,
      priority: 'medium',
      scheduledAt: reminderTime
    });
  }

  private async sendHandoverCompletionNotifications(handoverSession: HandoverSession): Promise<void> {
    await this.scheduleHandoverNotification({
      userId: handoverSession.renterId,
      handoverSessionId: handoverSession.id,
      type: 'completion',
      channel: 'push',
      message: 'Handover completed successfully! Enjoy your rental.',
      priority: 'high',
      scheduledAt: new Date()
    });

    await this.scheduleHandoverNotification({
      userId: handoverSession.ownerId,
      handoverSessionId: handoverSession.id,
      type: 'completion',
      channel: 'push',
      message: 'Handover completed successfully! Your item has been rented.',
      priority: 'high',
      scheduledAt: new Date()
    });
  }

  private async sendReturnCompletionNotifications(returnSession: ReturnSession): Promise<void> {
    await this.scheduleReturnNotification({
      userId: returnSession.renterId,
      returnSessionId: returnSession.id,
      type: 'completion',
      channel: 'push',
      message: 'Return completed successfully! Thank you for using our platform.',
      priority: 'high',
      scheduledAt: new Date()
    });

    await this.scheduleReturnNotification({
      userId: returnSession.ownerId,
      returnSessionId: returnSession.id,
      type: 'completion',
      channel: 'push',
      message: 'Return completed successfully! Your item has been returned.',
      priority: 'high',
      scheduledAt: new Date()
    });
  }

  // =====================================================
  // STATISTICS AND ANALYTICS
  // =====================================================

  /**
   * Get handover and return statistics
   */
  async getHandoverReturnStats(): Promise<ServiceResponse<HandoverReturnStats>> {
    try {
      const [
        totalHandovers,
        totalReturns,
        completedHandovers,
        completedReturns,
        cancelledHandovers,
        cancelledReturns,
        disputedHandovers,
        disputedReturns
      ] = await Promise.all([
        this.db('handover_sessions').count('* as count').first(),
        this.db('return_sessions').count('* as count').first(),
        this.db('handover_sessions').where('status', 'completed').count('* as count').first(),
        this.db('return_sessions').where('status', 'completed').count('* as count').first(),
        this.db('handover_sessions').where('status', 'cancelled').count('* as count').first(),
        this.db('return_sessions').where('status', 'cancelled').count('* as count').first(),
        this.db('handover_sessions').where('status', 'disputed').count('* as count').first(),
        this.db('return_sessions').where('status', 'disputed').count('* as count').first()
      ]);

      const stats: HandoverReturnStats = {
        totalHandovers: parseInt(totalHandovers?.count as string || '0'),
        totalReturns: parseInt(totalReturns?.count as string || '0'),
        handoverSuccessRate: 0, // Will be calculated
        returnOnTimeRate: 0, // Will be calculated
        averageHandoverTime: 0, // Will be calculated
        averageReturnProcessingTime: 0, // Will be calculated
        disputeRate: 0, // Will be calculated
        userSatisfactionScore: 0, // Will be calculated
        statusDistribution: {
          scheduled: 0,
          in_progress: 0,
          completed: parseInt(completedHandovers?.count as string || '0'),
          cancelled: parseInt(cancelledHandovers?.count as string || '0'),
          disputed: parseInt(disputedHandovers?.count as string || '0')
        },
        typeDistribution: {
          pickup: 0,
          delivery: 0,
          meetup: 0
        }
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('[HandoverReturnService] Get stats error:', error);
      return { success: false, error: 'Failed to get statistics' };
    }
  }
}

export default new HandoverReturnService();
