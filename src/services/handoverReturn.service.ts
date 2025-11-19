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
  NotificationStatus,
  AccessoryItem,
  MaintenanceItem
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
      // Validate required fields
      if (!data.bookingId) {
        return { success: false, error: 'Booking ID is required' };
      }
      
      if (!data.location) {
        return { success: false, error: 'Location information is required' };
      }

      if (!data.scheduledDateTime) {
        return { success: false, error: 'Scheduled date and time is required' };
      }

      // Validate scheduledDateTime is a valid date
      const scheduledDate = new Date(data.scheduledDateTime);
      if (isNaN(scheduledDate.getTime())) {
        return { success: false, error: 'Invalid scheduled date and time format' };
      }

      // Generate 6-digit verification code
      const handoverCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const handoverSession: HandoverSession = {
        id: require('uuid').v4(),
        bookingId: data.bookingId,
        ownerId: '', // Will be populated from booking
        renterId: '', // Will be populated from booking
        productId: '', // Will be populated from booking
        handoverType: data.handoverType,
        scheduledDateTime: new Date(data.scheduledDateTime),
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
        location_type: handoverSession.location?.type || 'meeting_point',
        location_address: handoverSession.location?.address || '',
        location_lat: handoverSession.location?.coordinates?.lat || null,
        location_lng: handoverSession.location?.coordinates?.lng || null,
        location_instructions: handoverSession.location?.instructions || '',
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
        preHandoverPhotos: this.safeParseJsonArray(result.pre_handover_photos),
        postHandoverPhotos: this.safeParseJsonArray(result.post_handover_photos),
        conditionReport: this.safeParseJsonObject(result.condition_report),
        accessoryChecklist: this.safeParseTypedArray<AccessoryItem>(result.accessory_checklist),
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
      // Validate required fields
      if (!data.bookingId) {
        return { success: false, error: 'Booking ID is required' };
      }
      
      if (!data.location) {
        return { success: false, error: 'Location information is required' };
      }

      if (!data.scheduledDateTime) {
        return { success: false, error: 'Scheduled date and time is required' };
      }

      if (!data.handoverSessionId) {
        return { success: false, error: 'Handover session ID is required' };
      }

      // Validate scheduledDateTime is a valid date
      const scheduledDate = new Date(data.scheduledDateTime);
      if (isNaN(scheduledDate.getTime())) {
        return { success: false, error: 'Invalid scheduled date and time format' };
      }

      // Validate that handover session exists
      const handoverSession = await this.db('handover_sessions')
        .where('id', data.handoverSessionId)
        .first();

      if (!handoverSession) {
        return { success: false, error: 'Handover session not found' };
      }

      // Generate 6-digit verification code
      const returnCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const returnSession: ReturnSession = {
        id: require('uuid').v4(),
        bookingId: data.bookingId,
        handoverSessionId: data.handoverSessionId,
        ownerId: handoverSession.owner_id,
        renterId: handoverSession.renter_id,
        productId: handoverSession.product_id,
        returnType: data.returnType,
        scheduledDateTime: new Date(data.scheduledDateTime),
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

      // Validate booking exists (optional check for consistency)
      const booking = await this.db('bookings')
        .where('id', data.bookingId)
        .first();

      if (!booking) {
        return { success: false, error: 'Booking not found' };
      }

      await this.db('return_sessions').insert({
        id: returnSession.id,
        booking_id: returnSession.bookingId,
        handover_session_id: returnSession.handoverSessionId,
        owner_id: returnSession.ownerId,
        renter_id: returnSession.renterId,
        product_id: returnSession.productId,
        return_type: returnSession.returnType,
        scheduled_date_time: returnSession.scheduledDateTime,
        location_type: returnSession.location?.type || 'meeting_point',
        location_address: returnSession.location?.address || '',
        location_lat: returnSession.location?.coordinates?.lat || null,
        location_lng: returnSession.location?.coordinates?.lng || null,
        location_instructions: returnSession.location?.instructions || '',
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
        preReturnPhotos: this.safeParseJsonArray(result.pre_return_photos),
        postReturnPhotos: this.safeParseJsonArray(result.post_return_photos),
        conditionComparison: this.safeParseJsonObject(result.condition_comparison),
        accessoryVerification: this.safeParseTypedArray<AccessoryItem>(result.accessory_verification),
        damageAssessment: result.damage_assessment ? this.safeParseJsonObject(result.damage_assessment) : undefined,
        cleaningAssessment: result.cleaning_assessment ? this.safeParseJsonObject(result.cleaning_assessment) : undefined,
        maintenanceRequired: result.maintenance_required ? this.safeParseTypedArray<MaintenanceItem>(result.maintenance_required) : undefined,
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

  async getMessages(filters: MessageFilters): Promise<ServiceResponse<{ items: (HandoverMessage|ReturnMessage)[], pagination: any }>> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const offset = (page - 1) * limit;

      const table = filters.handoverSessionId ? 'handover_messages' : 'return_messages';
      const sessionColumn = filters.handoverSessionId ? 'handover_session_id' : 'return_session_id';
      const sessionId = filters.handoverSessionId || filters.returnSessionId;
      if (!sessionId) {
        return { success: false, error: 'handoverSessionId or returnSessionId is required' };
      }

      let query = this.db(table).select('*').where(sessionColumn, sessionId).orderBy('timestamp', 'asc');
      let countQuery = this.db(table).where(sessionColumn, sessionId);

      if (filters.senderId) {
        query = query.andWhere('sender_id', filters.senderId);
        countQuery = countQuery.andWhere('sender_id', filters.senderId);
      }
      if (filters.messageType) {
        query = query.andWhere('message_type', filters.messageType);
        countQuery = countQuery.andWhere('message_type', filters.messageType);
      }
      if (filters.fromDate) {
        query = query.andWhere('timestamp', '>=', filters.fromDate);
        countQuery = countQuery.andWhere('timestamp', '>=', filters.fromDate);
      }
      if (filters.toDate) {
        query = query.andWhere('timestamp', '<=', filters.toDate);
        countQuery = countQuery.andWhere('timestamp', '<=', filters.toDate);
      }

      const count = await countQuery.count('* as count').first();
      const rows = await query.limit(limit).offset(offset);

      const items = rows.map((r: any) => ({
        id: r.id,
        senderId: r.sender_id,
        senderType: r.sender_type,
        message: r.message,
        messageType: r.message_type,
        attachments: this.safeParseJsonArray(r.attachments),
        timestamp: r.timestamp,
        readBy: this.safeParseJsonArray(r.read_by)
      }));

      return {
        success: true,
        data: {
          items,
          pagination: {
            page,
            limit,
            total: parseInt((count?.count as string) || '0'),
            pages: Math.ceil(parseInt((count?.count as string) || '0') / limit)
          }
        }
      };
    } catch (error) {
      console.error('[HandoverReturnService] Get messages error:', error);
      return { success: false, error: 'Failed to get messages' };
    }
  }

  private async sendHandoverMessage(data: SendMessageRequest): Promise<ServiceResponse<HandoverMessage>> {
    const message: HandoverMessage = {
      id: require('uuid').v4(),
      senderId: (data as any).senderId, // populated by controller/auth
      senderType: (data as any).senderType || 'renter',
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
      senderId: (data as any).senderId, // populated by controller/auth
      senderType: (data as any).senderType || 'renter',
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

  async getNotifications(filters: NotificationFilters): Promise<ServiceResponse<{ items: (HandoverNotification|ReturnNotification)[], pagination: any }>> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const offset = (page - 1) * limit;

      const isHandover = !!filters.handoverSessionId;
      const table = isHandover ? 'handover_notifications' : 'return_notifications';
      const sessionColumn = isHandover ? 'handover_session_id' : 'return_session_id';
      const sessionId = filters.handoverSessionId || filters.returnSessionId;

      let query = this.db(table).select('*').orderBy('scheduled_at', 'desc');
      let countQuery = this.db(table);

      if (sessionId) {
        query = query.where(sessionColumn, sessionId);
        countQuery = countQuery.where(sessionColumn, sessionId);
      }
      if (filters.userId) {
        query = query.andWhere('user_id', filters.userId);
        countQuery = countQuery.andWhere('user_id', filters.userId);
      }
      if (filters.type) {
        query = query.andWhere('type', filters.type);
        countQuery = countQuery.andWhere('type', filters.type);
      }
      if (filters.channel) {
        query = query.andWhere('channel', filters.channel);
        countQuery = countQuery.andWhere('channel', filters.channel);
      }
      if (filters.status) {
        query = query.andWhere('status', filters.status);
        countQuery = countQuery.andWhere('status', filters.status);
      }
      if (filters.scheduledFrom) {
        query = query.andWhere('scheduled_at', '>=', filters.scheduledFrom);
        countQuery = countQuery.andWhere('scheduled_at', '>=', filters.scheduledFrom);
      }
      if (filters.scheduledTo) {
        query = query.andWhere('scheduled_at', '<=', filters.scheduledTo);
        countQuery = countQuery.andWhere('scheduled_at', '<=', filters.scheduledTo);
      }

      const count = await countQuery.count('* as count').first();
      const rows = await query.limit(limit).offset(offset);

      const items = rows.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        handoverSessionId: r.handover_session_id,
        returnSessionId: r.return_session_id,
        type: r.type,
        channel: r.channel,
        message: r.message,
        priority: r.priority,
        scheduledAt: r.scheduled_at,
        status: r.status,
        metadata: this.safeParseJsonObject(r.metadata)
      }));

      return {
        success: true,
        data: {
          items,
          pagination: {
            page,
            limit,
            total: parseInt((count?.count as string) || '0'),
            pages: Math.ceil(parseInt((count?.count as string) || '0') / limit)
          }
        }
      };
    } catch (error) {
      console.error('[HandoverReturnService] Get notifications error:', error);
      return { success: false, error: 'Failed to get notifications' };
    }
  }
  private async scheduleHandoverNotification(data: ScheduleNotificationRequest): Promise<ServiceResponse<HandoverNotification>> {
    try {
      // Normalize type to satisfy DB constraint, while preserving original intent in metadata
      const originalType = data.type as any;
      const normalizedType = (originalType === 'handover' || originalType === 'return') ? 'reminder' : originalType;

      // If userId not provided, notify both renter and owner of the session
      if (!data.userId) {
        const session = await this.db('handover_sessions').select('owner_id', 'renter_id').where('id', data.handoverSessionId!).first();
        if (!session) {
          return { success: false, error: 'Handover session not found' };
        }

        const recipients = [session.renter_id, session.owner_id].filter(Boolean);
        let firstNotification: HandoverNotification | null = null;

        for (const recipientId of recipients) {
          const n: HandoverNotification = {
            id: require('uuid').v4(),
            userId: recipientId,
            handoverSessionId: data.handoverSessionId!,
            type: normalizedType,
            channel: data.channel,
            message: data.message,
            priority: data.priority,
            scheduledAt: data.scheduledAt,
            status: 'pending' as NotificationStatus,
            metadata: { ...(data.metadata || {}), category: originalType }
          };

          await this.db('handover_notifications').insert({
            id: n.id,
            user_id: n.userId,
            handover_session_id: n.handoverSessionId,
            type: n.type,
            channel: n.channel,
            message: n.message,
            priority: n.priority,
            scheduled_at: n.scheduledAt,
            status: n.status,
            metadata: JSON.stringify(n.metadata)
          });

          // Immediately send email if channel is email
          if (n.channel === 'email') {
            try {
              const user = await this.db('users').select('email').where('id', n.userId).first();
              if (user?.email) {
                const { EmailService } = require('@/services/email.service');
                const emailSvc = new EmailService();
                emailSvc.sendEmail({ to: user.email, subject: 'Handover Notification', html: n.message, text: n.message });
              }
            } catch (e) {
              // swallow email errors to not block API
            }
          }

          if (!firstNotification) firstNotification = n;
        }

        return { success: true, data: firstNotification! };
      }

      // Single recipient path
      const notification: HandoverNotification = {
        id: require('uuid').v4(),
        userId: data.userId,
        handoverSessionId: data.handoverSessionId!,
        type: normalizedType,
        channel: data.channel,
        message: data.message,
        priority: data.priority,
        scheduledAt: data.scheduledAt,
        status: 'pending' as NotificationStatus,
        metadata: { ...(data.metadata || {}), category: originalType }
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

      if (notification.channel === 'email') {
        try {
          const user = await this.db('users').select('email').where('id', notification.userId).first();
          if (user?.email) {
            const { EmailService } = require('@/services/email.service');
            const emailSvc = new EmailService();
            emailSvc.sendEmail({ to: user.email, subject: 'Handover Notification', html: notification.message, text: notification.message });
          }
        } catch (e) {
          // ignore email errors
        }
      }

      return { success: true, data: notification };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async scheduleReturnNotification(data: ScheduleNotificationRequest): Promise<ServiceResponse<ReturnNotification>> {
    try {
      const originalType = data.type as any;
      const normalizedType = (originalType === 'handover' || originalType === 'return') ? 'reminder' : originalType;

      if (!data.userId) {
        const session = await this.db('return_sessions').select('owner_id', 'renter_id').where('id', data.returnSessionId!).first();
        if (!session) {
          return { success: false, error: 'Return session not found' };
        }

        const recipients = [session.renter_id, session.owner_id].filter(Boolean);
        let firstNotification: ReturnNotification | null = null;

        for (const recipientId of recipients) {
          const n: ReturnNotification = {
            id: require('uuid').v4(),
            userId: recipientId,
            returnSessionId: data.returnSessionId!,
            type: normalizedType,
            channel: data.channel,
            message: data.message,
            priority: data.priority,
            scheduledAt: data.scheduledAt,
            status: 'pending' as NotificationStatus,
            metadata: { ...(data.metadata || {}), category: originalType }
          };

          await this.db('return_notifications').insert({
            id: n.id,
            user_id: n.userId,
            return_session_id: n.returnSessionId,
            type: n.type,
            channel: n.channel,
            message: n.message,
            priority: n.priority,
            scheduled_at: n.scheduledAt,
            status: n.status,
            metadata: JSON.stringify(n.metadata)
          });

          if (n.channel === 'email') {
            try {
              const user = await this.db('users').select('email').where('id', n.userId).first();
              if (user?.email) {
                const { EmailService } = require('@/services/email.service');
                const emailSvc = new EmailService();
                emailSvc.sendEmail({ to: user.email, subject: 'Return Notification', html: n.message, text: n.message });
              }
            } catch (e) {}
          }

          if (!firstNotification) firstNotification = n;
        }

        return { success: true, data: firstNotification! };
      }

      const notification: ReturnNotification = {
        id: require('uuid').v4(),
        userId: data.userId,
        returnSessionId: data.returnSessionId!,
        type: normalizedType,
        channel: data.channel,
        message: data.message,
        priority: data.priority,
        scheduledAt: data.scheduledAt,
        status: 'pending' as NotificationStatus,
        metadata: { ...(data.metadata || {}), category: originalType }
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

      if (notification.channel === 'email') {
        try {
          const user = await this.db('users').select('email').where('id', notification.userId).first();
          if (user?.email) {
            const { EmailService } = require('@/services/email.service');
            const emailSvc = new EmailService();
            emailSvc.sendEmail({ to: user.email, subject: 'Return Notification', html: notification.message, text: notification.message });
          }
        } catch (e) {}
      }

      return { success: true, data: notification };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
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
      channel: NotificationChannel.PUSH,
      message: `Handover reminder: Your rental starts tomorrow at ${handoverSession.scheduledDateTime.toLocaleTimeString()}`,
      priority: NotificationPriority.MEDIUM,
      scheduledAt: reminderTime
    });

    await this.scheduleHandoverNotification({
      userId: handoverSession.ownerId,
      handoverSessionId: handoverSession.id,
      type: 'reminder',
      channel: NotificationChannel.PUSH,
      message: `Handover reminder: You have a handover scheduled tomorrow at ${handoverSession.scheduledDateTime.toLocaleTimeString()}`,
      priority: NotificationPriority.MEDIUM,
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
      channel: NotificationChannel.PUSH,
      message: `Return reminder: Your rental ends tomorrow at ${returnSession.scheduledDateTime.toLocaleTimeString()}`,
      priority: NotificationPriority.MEDIUM,
      scheduledAt: reminderTime
    });

    await this.scheduleReturnNotification({
      userId: returnSession.ownerId,
      returnSessionId: returnSession.id,
      type: 'reminder',
      channel: NotificationChannel.PUSH,
      message: `Return reminder: You have a return scheduled tomorrow at ${returnSession.scheduledDateTime.toLocaleTimeString()}`,
      priority: NotificationPriority.MEDIUM,
      scheduledAt: reminderTime
    });
  }

  private async sendHandoverCompletionNotifications(handoverSession: HandoverSession): Promise<void> {
    await this.scheduleHandoverNotification({
      userId: handoverSession.renterId,
      handoverSessionId: handoverSession.id,
      type: 'completion',
      channel: NotificationChannel.PUSH,
      message: 'Handover completed successfully! Enjoy your rental.',
      priority: NotificationPriority.HIGH,
      scheduledAt: new Date()
    });

    await this.scheduleHandoverNotification({
      userId: handoverSession.ownerId,
      handoverSessionId: handoverSession.id,
      type: 'completion',
      channel: NotificationChannel.PUSH,
      message: 'Handover completed successfully! Your item has been rented.',
      priority: NotificationPriority.HIGH,
      scheduledAt: new Date()
    });
  }

  private async sendReturnCompletionNotifications(returnSession: ReturnSession): Promise<void> {
    await this.scheduleReturnNotification({
      userId: returnSession.renterId,
      returnSessionId: returnSession.id,
      type: 'completion',
      channel: NotificationChannel.PUSH,
      message: 'Return completed successfully! Thank you for using our platform.',
      priority: NotificationPriority.HIGH,
      scheduledAt: new Date()
    });

    await this.scheduleReturnNotification({
      userId: returnSession.ownerId,
      returnSessionId: returnSession.id,
      type: 'completion',
      channel: NotificationChannel.PUSH,
      message: 'Return completed successfully! Your item has been returned.',
      priority: NotificationPriority.HIGH,
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

  /**
   * Get handover sessions with filters
   */
  async getHandoverSessions(filters: HandoverSessionFilters): Promise<ServiceResponse<{ sessions: HandoverSession[], pagination: any }>> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;

      let query = this.db('handover_sessions')
        .select('*')
        .orderBy('created_at', 'desc');

      // Apply filters
      if (filters.bookingId) {
        query = query.where('booking_id', filters.bookingId);
      }
      // Implicit user scoping: if userId is provided (controller passes req.user.id by default),
      // restrict to sessions where user is owner or renter
      if ((filters as any).userId) {
        query = query.where((qb: any) => {
          qb.where('owner_id', (filters as any).userId).orWhere('renter_id', (filters as any).userId);
        });
      }
      if (filters.ownerId) {
        query = query.where('owner_id', filters.ownerId);
      }
      if (filters.renterId) {
        query = query.where('renter_id', filters.renterId);
      }
      if (filters.productId) {
        query = query.where('product_id', filters.productId);
      }
      if (filters.status) {
        query = query.where('status', filters.status);
      }
      if (filters.handoverType) {
        query = query.where('handover_type', filters.handoverType);
      }
      if (filters.scheduledFrom) {
        query = query.where('scheduled_date_time', '>=', filters.scheduledFrom);
      }
      if (filters.scheduledTo) {
        query = query.where('scheduled_date_time', '<=', filters.scheduledTo);
      }

      // Get total count for pagination
      const countQuery = this.db('handover_sessions');
      
      // Apply same filters to count query
      if (filters.bookingId) {
        countQuery.where('booking_id', filters.bookingId);
      }
      if ((filters as any).userId) {
        countQuery.where((qb: any) => {
          qb.where('owner_id', (filters as any).userId).orWhere('renter_id', (filters as any).userId);
        });
      }
      if (filters.ownerId) {
        countQuery.where('owner_id', filters.ownerId);
      }
      if (filters.renterId) {
        countQuery.where('renter_id', filters.renterId);
      }
      if (filters.productId) {
        countQuery.where('product_id', filters.productId);
      }
      if (filters.status) {
        countQuery.where('status', filters.status);
      }
      if (filters.handoverType) {
        countQuery.where('handover_type', filters.handoverType);
      }
      if (filters.scheduledFrom) {
        countQuery.where('scheduled_date_time', '>=', filters.scheduledFrom);
      }
      if (filters.scheduledTo) {
        countQuery.where('scheduled_date_time', '<=', filters.scheduledTo);
      }
      
      const countResult = await countQuery.count('* as count').first();
      const total = parseInt(countResult?.count as string || '0');

      // Apply pagination
      const sessions = await query.limit(limit).offset(offset);

      // Transform database results to HandoverSession objects
      const transformedSessions: HandoverSession[] = sessions.map(session => ({
        id: session.id,
        bookingId: session.booking_id,
        ownerId: session.owner_id,
        renterId: session.renter_id,
        productId: session.product_id,
        handoverType: session.handover_type,
        scheduledDateTime: new Date(session.scheduled_date_time),
        actualDateTime: session.actual_date_time ? new Date(session.actual_date_time) : undefined,
        location: {
          type: session.location_type,
          address: session.location_address,
          coordinates: {
            lat: session.location_lat,
            lng: session.location_lng
          },
          instructions: session.location_instructions
        },
        status: session.status,
        handoverCode: session.handover_code,
        preHandoverPhotos: this.safeParseJsonArray(session.pre_handover_photos),
        postHandoverPhotos: this.safeParseJsonArray(session.post_handover_photos),
        conditionReport: this.safeParseJsonObject(session.condition_report),
        accessoryChecklist: this.safeParseTypedArray<AccessoryItem>(session.accessory_checklist),
        ownerSignature: session.owner_signature,
        renterSignature: session.renter_signature,
        witnessId: session.witness_id,
        notes: session.notes,
        estimatedDurationMinutes: session.estimated_duration_minutes,
        createdAt: new Date(session.created_at),
        updatedAt: new Date(session.updated_at),
        completedAt: session.completed_at ? new Date(session.completed_at) : undefined,
        messages: [],
        notifications: []
      }));

      const pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      };

      return { success: true, data: { sessions: transformedSessions, pagination } };
    } catch (error) {
      console.error('[HandoverReturnService] Get handover sessions error:', error);
      return { success: false, error: 'Failed to get handover sessions' };
    }
  }

  /**
   * Get return sessions with filters
   */
  async getReturnSessions(filters: ReturnSessionFilters): Promise<ServiceResponse<{ sessions: ReturnSession[], pagination: any }>> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;

      let query = this.db('return_sessions')
        .select('*')
        .orderBy('created_at', 'desc');

      // Apply filters
      if (filters.bookingId) {
        query = query.where('booking_id', filters.bookingId);
      }
      if (filters.handoverSessionId) {
        query = query.where('handover_session_id', filters.handoverSessionId);
      }
      if ((filters as any).userId) {
        query = query.where((qb: any) => {
          qb.where('owner_id', (filters as any).userId).orWhere('renter_id', (filters as any).userId);
        });
      }
      if (filters.ownerId) {
        query = query.where('owner_id', filters.ownerId);
      }
      if (filters.renterId) {
        query = query.where('renter_id', filters.renterId);
      }
      if (filters.productId) {
        query = query.where('product_id', filters.productId);
      }
      if (filters.status) {
        query = query.where('status', filters.status);
      }
      if (filters.returnType) {
        query = query.where('return_type', filters.returnType);
      }
      if (filters.scheduledFrom) {
        query = query.where('scheduled_date_time', '>=', filters.scheduledFrom);
      }
      if (filters.scheduledTo) {
        query = query.where('scheduled_date_time', '<=', filters.scheduledTo);
      }

      // Get total count for pagination
      const countQuery = this.db('return_sessions');
      
      // Apply same filters to count query
      if (filters.bookingId) {
        countQuery.where('booking_id', filters.bookingId);
      }
      if (filters.handoverSessionId) {
        countQuery.where('handover_session_id', filters.handoverSessionId);
      }
      if ((filters as any).userId) {
        countQuery.where((qb: any) => {
          qb.where('owner_id', (filters as any).userId).orWhere('renter_id', (filters as any).userId);
        });
      }
      if (filters.ownerId) {
        countQuery.where('owner_id', filters.ownerId);
      }
      if (filters.renterId) {
        countQuery.where('renter_id', filters.renterId);
      }
      if (filters.productId) {
        countQuery.where('product_id', filters.productId);
      }
      if (filters.status) {
        countQuery.where('status', filters.status);
      }
      if (filters.returnType) {
        countQuery.where('return_type', filters.returnType);
      }
      if (filters.scheduledFrom) {
        countQuery.where('scheduled_date_time', '>=', filters.scheduledFrom);
      }
      if (filters.scheduledTo) {
        countQuery.where('scheduled_date_time', '<=', filters.scheduledTo);
      }
      
      const countResult = await countQuery.count('* as count').first();
      const total = parseInt(countResult?.count as string || '0');

      // Apply pagination
      const sessions = await query.limit(limit).offset(offset);

      // Transform database results to ReturnSession objects
      const transformedSessions: ReturnSession[] = sessions.map(session => ({
        id: session.id,
        bookingId: session.booking_id,
        handoverSessionId: session.handover_session_id,
        ownerId: session.owner_id,
        renterId: session.renter_id,
        productId: session.product_id,
        returnType: session.return_type,
        scheduledDateTime: new Date(session.scheduled_date_time),
        actualDateTime: session.actual_date_time ? new Date(session.actual_date_time) : undefined,
        location: {
          type: session.location_type,
          address: session.location_address,
          coordinates: {
            lat: session.location_lat,
            lng: session.location_lng
          },
          instructions: session.location_instructions
        },
        status: session.status,
        returnCode: session.return_code,
        preReturnPhotos: this.safeParseJsonArray(session.pre_return_photos),
        postReturnPhotos: this.safeParseJsonArray(session.post_return_photos),
        conditionComparison: this.safeParseJsonObject(session.condition_comparison),
        accessoryVerification: this.safeParseTypedArray<AccessoryItem>(session.accessory_verification),
        ownerSignature: session.owner_signature,
        renterSignature: session.renter_signature,
        witnessId: session.witness_id,
        notes: session.notes,
        estimatedDurationMinutes: session.estimated_duration_minutes,
        createdAt: new Date(session.created_at),
        updatedAt: new Date(session.updated_at),
        completedAt: session.completed_at ? new Date(session.completed_at) : undefined,
        messages: [],
        notifications: []
      }));

      const pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      };

      return { success: true, data: { sessions: transformedSessions, pagination } };
    } catch (error) {
      console.error('[HandoverReturnService] Get return sessions error:', error);
      return { success: false, error: 'Failed to get return sessions' };
    }
  }

  /**
   * Safely parse JSON array with fallback handling
   */
  private safeParseJsonArray(value: any): string[] {
    try {
      if (Array.isArray(value)) {
        return value;
      } else if (typeof value === 'string') {
        if (!value || value.trim() === '') {
          return [];
        }
        try {
          return JSON.parse(value);
        } catch {
          // If not JSON, treat as comma-separated string
          return value.split(',').map((s: string) => s.trim());
        }
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  }

  /**
   * Safely parse JSON array as typed array
   */
  private safeParseTypedArray<T>(value: any): T[] {
    try {
      if (Array.isArray(value)) {
        return value as T[];
      } else if (typeof value === 'string') {
        if (!value || value.trim() === '') {
          return [];
        }
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed as T[] : [];
        } catch {
          return [];
        }
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  }

  /**
   * Safely parse JSON object with fallback handling
   */
  private safeParseJsonObject(value: any): any {
    try {
      if (typeof value === 'object' && value !== null) {
        return value;
      } else if (typeof value === 'string') {
        if (!value || value.trim() === '') {
          return {};
        }
        try {
          return JSON.parse(value);
        } catch {
          return {};
        }
      } else {
        return {};
      }
    } catch (error) {
      return {};
    }
  }
}

export default new HandoverReturnService();
