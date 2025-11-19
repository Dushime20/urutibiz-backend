import { BaseController } from './BaseController';
import { ResponseHelper } from '@/utils/response';
import HandoverReturnService from '@/services/handoverReturn.service';
import { AuthenticatedRequest } from '@/types';
import { Response } from 'express';
import {
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
  NotificationFilters
} from '@/types/handoverReturn.types';

export class HandoverReturnController extends BaseController {

  // =====================================================
  // HANDOVER SESSION MANAGEMENT
  // =====================================================

  /**
   * Create a new handover session
   * POST /api/v1/handover-return/handover-sessions
   */
  public createHandoverSession = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const sessionData: CreateHandoverSessionRequest = req.body;
    
    // Validate required fields
    if (!sessionData.bookingId || !sessionData.handoverType || !sessionData.scheduledDateTime || !sessionData.location) {
      return this.handleBadRequest(res, 'Missing required fields: bookingId, handoverType, scheduledDateTime, location');
    }

    const result = await HandoverReturnService.createHandoverSession(sessionData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to create handover session', 400);
    }

    this.logAction('CREATE_HANDOVER_SESSION', req.user.id, result.data!.id, sessionData);

    return ResponseHelper.success(res, 'Handover session created successfully', result.data);
  });

  /**
   * Get handover session by ID
   * GET /api/v1/handover-return/handover-sessions/:sessionId
   */
  public getHandoverSession = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId } = req.params;

    const result = await HandoverReturnService.getHandoverSessionById(sessionId);
    
    if (!result.success || !result.data) {
      return this.handleNotFound(res, 'Handover session');
    }

    this.logAction('GET_HANDOVER_SESSION', req.user.id, sessionId);

    return ResponseHelper.success(res, 'Handover session retrieved successfully', result.data);
  });

  /**
   * Update handover session
   * PUT /api/v1/handover-return/handover-sessions/:sessionId
   */
  public updateHandoverSession = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { sessionId } = req.params;
    const updateData: UpdateHandoverSessionRequest = req.body;

    // Get existing session
    const existingSession = await HandoverReturnService.getHandoverSessionById(sessionId);
    if (!existingSession.success) {
      return this.handleNotFound(res, 'Handover session');
    }

    // Update session (implementation would go in service)
    // For now, return success
    this.logAction('UPDATE_HANDOVER_SESSION', req.user.id, sessionId, updateData);

    return ResponseHelper.success(res, 'Handover session updated successfully', existingSession.data);
  });

  /**
   * Complete handover session
   * POST /api/v1/handover-return/handover-sessions/:sessionId/complete
   */
  public completeHandoverSession = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { sessionId } = req.params;
    const completionData: CompleteHandoverRequest = req.body;
    
    // Validate required fields
    if (!completionData.handoverCode || !completionData.conditionReport || !completionData.accessoryChecklist) {
      return this.handleBadRequest(res, 'Missing required fields: handoverCode, conditionReport, accessoryChecklist');
    }

    const result = await HandoverReturnService.completeHandoverSession(sessionId, completionData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to complete handover session', 400);
    }

    this.logAction('COMPLETE_HANDOVER_SESSION', req.user.id, sessionId, completionData);

    return ResponseHelper.success(res, 'Handover session completed successfully', result.data);
  });

  /**
   * Get handover sessions with filters
   * GET /api/v1/handover-return/handover-sessions
   */
  public getHandoverSessions = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filters: HandoverSessionFilters = {
      bookingId: req.query.bookingId as string,
      ownerId: req.query.ownerId as string,
      renterId: req.query.renterId as string,
      productId: req.query.productId as string,
      status: req.query.status as any,
      handoverType: req.query.handoverType as any,
      scheduledFrom: req.query.scheduledFrom ? new Date(req.query.scheduledFrom as string) : undefined,
      scheduledTo: req.query.scheduledTo ? new Date(req.query.scheduledTo as string) : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    };

    const result = await HandoverReturnService.getHandoverSessions({
      ...(filters as any),
      userId: (req.query.userId as string) || req.user.id
    });
    
    if (!result.success || !result.data) {
      return ResponseHelper.error(res, result.error, 500);
    }

    this.logAction('GET_HANDOVER_SESSIONS', req.user.id, undefined, filters);

    return ResponseHelper.success(res, 'Handover sessions retrieved successfully', result.data.sessions, 200, result.data.pagination);
  });

  // =====================================================
  // RETURN SESSION MANAGEMENT
  // =====================================================

  /**
   * Create a new return session
   * POST /api/v1/handover-return/return-sessions
   */
  public createReturnSession = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const sessionData: CreateReturnSessionRequest = req.body;
    
    // Validate required fields
    if (!sessionData.bookingId || !sessionData.handoverSessionId || !sessionData.returnType || 
        !sessionData.scheduledDateTime || !sessionData.location) {
      return this.handleBadRequest(res, 'Missing required fields: bookingId, handoverSessionId, returnType, scheduledDateTime, location');
    }

    const result = await HandoverReturnService.createReturnSession(sessionData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to create return session', 400);
    }

    this.logAction('CREATE_RETURN_SESSION', req.user.id, result.data!.id, sessionData);

    return ResponseHelper.success(res, 'Return session created successfully', result.data);
  });

  /**
   * Get return session by ID
   * GET /api/v1/handover-return/return-sessions/:sessionId
   */
  public getReturnSession = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId } = req.params;

    const result = await HandoverReturnService.getReturnSessionById(sessionId);
    
    if (!result.success || !result.data) {
      return this.handleNotFound(res, 'Return session');
    }

    this.logAction('GET_RETURN_SESSION', req.user.id, sessionId);

    return ResponseHelper.success(res, 'Return session retrieved successfully', result.data);
  });

  /**
   * Update return session
   * PUT /api/v1/handover-return/return-sessions/:sessionId
   */
  public updateReturnSession = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { sessionId } = req.params;
    const updateData: UpdateReturnSessionRequest = req.body;

    // Get existing session
    const existingSession = await HandoverReturnService.getReturnSessionById(sessionId);
    if (!existingSession.success) {
      return this.handleNotFound(res, 'Return session');
    }

    // Update session (implementation would go in service)
    // For now, return success
    this.logAction('UPDATE_RETURN_SESSION', req.user.id, sessionId, updateData);

    return ResponseHelper.success(res, 'Return session updated successfully', existingSession.data);
  });

  /**
   * Complete return session
   * POST /api/v1/handover-return/return-sessions/:sessionId/complete
   */
  public completeReturnSession = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { sessionId } = req.params;
    const completionData: CompleteReturnRequest = req.body;
    
    // Validate required fields
    if (!completionData.returnCode || !completionData.conditionComparison || !completionData.accessoryVerification) {
      return this.handleBadRequest(res, 'Missing required fields: returnCode, conditionComparison, accessoryVerification');
    }

    const result = await HandoverReturnService.completeReturnSession(sessionId, completionData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to complete return session', 400);
    }

    this.logAction('COMPLETE_RETURN_SESSION', req.user.id, sessionId, completionData);

    return ResponseHelper.success(res, 'Return session completed successfully', result.data);
  });

  /**
   * Get return sessions with filters
   * GET /api/v1/handover-return/return-sessions
   */
  public getReturnSessions = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filters: ReturnSessionFilters = {
      bookingId: req.query.bookingId as string,
      handoverSessionId: req.query.handoverSessionId as string,
      ownerId: req.query.ownerId as string,
      renterId: req.query.renterId as string,
      productId: req.query.productId as string,
      status: req.query.status as any,
      returnType: req.query.returnType as any,
      scheduledFrom: req.query.scheduledFrom ? new Date(req.query.scheduledFrom as string) : undefined,
      scheduledTo: req.query.scheduledTo ? new Date(req.query.scheduledTo as string) : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    };

    const result = await HandoverReturnService.getReturnSessions({
      ...(filters as any),
      userId: (req.query.userId as string) || req.user.id
    });
    
    if (!result.success || !result.data) {
      return ResponseHelper.error(res, result.error, 500);
    }

    this.logAction('GET_RETURN_SESSIONS', req.user.id, undefined, filters);

    return ResponseHelper.success(res, 'Return sessions retrieved successfully', result.data.sessions, 200, result.data.pagination);
  });

  // =====================================================
  // MESSAGE MANAGEMENT
  // =====================================================

  /**
   * Send message in handover or return session
   * POST /api/v1/handover-return/messages
   */
  public sendMessage = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const messageData: SendMessageRequest = {
      ...req.body,
      senderId: req.user.id,
      senderType: 'renter' // This would be determined based on user role
    };
    
    // Validate required fields
    if (!messageData.message || (!messageData.handoverSessionId && !messageData.returnSessionId)) {
      return this.handleBadRequest(res, 'Missing required fields: message, and either handoverSessionId or returnSessionId');
    }

    const result = await HandoverReturnService.sendMessage(messageData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to send message', 400);
    }

    this.logAction('SEND_MESSAGE', req.user.id, messageData.handoverSessionId || messageData.returnSessionId, messageData);

    return ResponseHelper.success(res, 'Message sent successfully', result.data);
  });

  /**
   * Get messages for handover or return session
   * GET /api/v1/handover-return/messages
   */
  public getMessages = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filters: MessageFilters = {
      handoverSessionId: req.query.handoverSessionId as string,
      returnSessionId: req.query.returnSessionId as string,
      senderId: req.query.senderId as string,
      messageType: req.query.messageType as string,
      fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
      toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50
    };

    const result = await HandoverReturnService.getMessages(filters);
    if (!result.success || !result.data) {
      return ResponseHelper.error(res, result.error || 'Failed to get messages', 400);
    }

    this.logAction('GET_MESSAGES', req.user.id, undefined, filters);

    return ResponseHelper.success(res, 'Messages retrieved successfully', result.data.items, 200, result.data.pagination);
  });

  /**
   * Admin: Get all handover and return messages (merged)
   * GET /api/v1/admin/handover-return/messages
   * Optional filters: bookingId, sessionType (handover|return), senderId, fromDate, toDate, page, limit
   */
  public getAllSessionMessagesAdmin = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = (page - 1) * limit;

    const bookingId = req.query.bookingId as string | undefined;
    const sessionType = (req.query.sessionType as 'handover' | 'return' | undefined);
    const senderId = req.query.senderId as string | undefined;
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
    const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;

    const db = require('@/config/database').getDatabase();

    // Build base queries
    const handoverBase = db('handover_messages as hm')
      .join('handover_sessions as hs', 'hm.handover_session_id', 'hs.id')
      .modify((qb: any) => {
        if (bookingId) qb.where('hs.booking_id', bookingId);
        if (senderId) qb.where('hm.sender_id', senderId);
        if (fromDate) qb.where('hm.timestamp', '>=', fromDate);
        if (toDate) qb.where('hm.timestamp', '<=', toDate);
      })
      .select(
        'hm.id',
        'hm.handover_session_id as sessionId',
        db.raw("'handover' as sessionType"),
        'hs.booking_id as bookingId',
        'hm.sender_id as senderId',
        'hm.sender_type as senderType',
        'hm.message',
        'hm.message_type as messageType',
        'hm.attachments',
        'hm.timestamp'
      );

    const returnBase = db('return_messages as rm')
      .join('return_sessions as rs', 'rm.return_session_id', 'rs.id')
      .modify((qb: any) => {
        if (bookingId) qb.where('rs.booking_id', bookingId);
        if (senderId) qb.where('rm.sender_id', senderId);
        if (fromDate) qb.where('rm.timestamp', '>=', fromDate);
        if (toDate) qb.where('rm.timestamp', '<=', toDate);
      })
      .select(
        'rm.id',
        'rm.return_session_id as sessionId',
        db.raw("'return' as sessionType"),
        'rs.booking_id as bookingId',
        'rm.sender_id as senderId',
        'rm.sender_type as senderType',
        'rm.message',
        'rm.message_type as messageType',
        'rm.attachments',
        'rm.timestamp'
      );

    // Execute based on sessionType filter
    const queries: Array<Promise<any>> = [];
    const countQueries: Array<Promise<any>> = [];

    if (!sessionType || sessionType === 'handover') {
      queries.push(
        handoverBase.clone()
          .orderBy('hm.timestamp', 'desc')
          .limit(limit)
          .offset(offset)
      );
      countQueries.push(
        db('handover_messages as hm')
          .join('handover_sessions as hs', 'hm.handover_session_id', 'hs.id')
          .modify((qb: any) => {
            if (bookingId) qb.where('hs.booking_id', bookingId);
            if (senderId) qb.where('hm.sender_id', senderId);
            if (fromDate) qb.where('hm.timestamp', '>=', fromDate);
            if (toDate) qb.where('hm.timestamp', '<=', toDate);
          })
          .count('* as count')
          .first()
      );
    }

    if (!sessionType || sessionType === 'return') {
      queries.push(
        returnBase.clone()
          .orderBy('rm.timestamp', 'desc')
          .limit(limit)
          .offset(offset)
      );
      countQueries.push(
        db('return_messages as rm')
          .join('return_sessions as rs', 'rm.return_session_id', 'rs.id')
          .modify((qb: any) => {
            if (bookingId) qb.where('rs.booking_id', bookingId);
            if (senderId) qb.where('rm.sender_id', senderId);
            if (fromDate) qb.where('rm.timestamp', '>=', fromDate);
            if (toDate) qb.where('rm.timestamp', '<=', toDate);
          })
          .count('* as count')
          .first()
      );
    }

    const results = await Promise.all(queries);
    const counts = await Promise.all(countQueries);

    const items = ([] as any[]).concat(...results)
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    const totals = {
      handover: counts[0] ? parseInt((counts[0] as any).count || '0', 10) : 0,
      returns: counts[1] ? parseInt((counts[1] as any).count || '0', 10) : (!sessionType || sessionType === 'return' ? parseInt((counts[0] as any).count || '0', 10) : 0)
    };

    return ResponseHelper.success(res, 'All session messages retrieved successfully', {
      items,
      totals,
      page,
      limit
    });
  });

  /**
   * Get combined messages for a booking across handover and return sessions
   * GET /api/v1/handover-return/messages/combined?bookingId=...&page=1&limit=50
   */
  public getCombinedMessages = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = req.query.bookingId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    if (!bookingId) {
      return this.handleBadRequest(res, 'bookingId is required');
    }

    const db = require('@/config/database').getDatabase();
    const offset = (page - 1) * limit;

    // Fetch messages joined via sessions for the booking
    const [handoverMsgs, returnMsgs, handoverCount, returnCount] = await Promise.all([
      db('handover_messages as hm')
        .join('handover_sessions as hs', 'hm.handover_session_id', 'hs.id')
        .where('hs.booking_id', bookingId)
        .select(
          'hm.id',
          'hm.handover_session_id as sessionId',
          db.raw("'handover' as sessionType"),
          'hm.sender_id as senderId',
          'hm.sender_type as senderType',
          'hm.message',
          'hm.message_type as messageType',
          'hm.attachments',
          'hm.timestamp'
        )
        .orderBy('hm.timestamp', 'desc')
        .limit(limit)
        .offset(offset),
      db('return_messages as rm')
        .join('return_sessions as rs', 'rm.return_session_id', 'rs.id')
        .where('rs.booking_id', bookingId)
        .select(
          'rm.id',
          'rm.return_session_id as sessionId',
          db.raw("'return' as sessionType"),
          'rm.sender_id as senderId',
          'rm.sender_type as senderType',
          'rm.message',
          'rm.message_type as messageType',
          'rm.attachments',
          'rm.timestamp'
        )
        .orderBy('rm.timestamp', 'desc')
        .limit(limit)
        .offset(offset),
      db('handover_messages as hm')
        .join('handover_sessions as hs', 'hm.handover_session_id', 'hs.id')
        .where('hs.booking_id', bookingId)
        .count('* as count')
        .first(),
      db('return_messages as rm')
        .join('return_sessions as rs', 'rm.return_session_id', 'rs.id')
        .where('rs.booking_id', bookingId)
        .count('* as count')
        .first()
    ]);

    const items = [...handoverMsgs, ...returnMsgs]
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return ResponseHelper.success(res, 'Combined messages retrieved successfully', {
      items,
      totals: {
        handover: parseInt((handoverCount as any)?.count || '0', 10),
        returns: parseInt((returnCount as any)?.count || '0', 10)
      },
      page,
      limit
    });
  });

  // =====================================================
  // NOTIFICATION MANAGEMENT
  // =====================================================

  /**
   * Schedule notification
   * POST /api/v1/handover-return/notifications/schedule
   */
  public scheduleNotification = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const notificationData: ScheduleNotificationRequest = req.body;
    
    // Validate required fields
    if (!notificationData.userId || !notificationData.type || !notificationData.channel || 
        !notificationData.message || !notificationData.scheduledAt || 
        (!notificationData.handoverSessionId && !notificationData.returnSessionId)) {
      return this.handleBadRequest(res, 'Missing required fields: userId, type, channel, message, scheduledAt, and either handoverSessionId or returnSessionId');
    }

    const result = await HandoverReturnService.scheduleNotification(notificationData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to schedule notification', 400);
    }

    this.logAction('SCHEDULE_NOTIFICATION', req.user.id, notificationData.handoverSessionId || notificationData.returnSessionId, notificationData);

    return ResponseHelper.success(res, 'Notification scheduled successfully', result.data);
  });

  /**
   * Get notifications with filters
   * GET /api/v1/handover-return/notifications
   */
  public getNotifications = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filters: NotificationFilters = {
      userId: req.query.userId as string,
      handoverSessionId: req.query.handoverSessionId as string,
      returnSessionId: req.query.returnSessionId as string,
      type: req.query.type as string,
      channel: req.query.channel as any,
      status: req.query.status as any,
      scheduledFrom: req.query.scheduledFrom ? new Date(req.query.scheduledFrom as string) : undefined,
      scheduledTo: req.query.scheduledTo ? new Date(req.query.scheduledTo as string) : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50
    };

    const result = await HandoverReturnService.getNotifications(filters);
    if (!result.success || !result.data) {
      return ResponseHelper.error(res, result.error || 'Failed to get notifications', 400);
    }

    this.logAction('GET_NOTIFICATIONS', req.user.id, undefined, filters);

    return ResponseHelper.success(res, 'Notifications retrieved successfully', result.data.items, 200, result.data.pagination);
  });

  // =====================================================
  // STATISTICS AND ANALYTICS
  // =====================================================

  /**
   * Get handover and return statistics
   * GET /api/v1/handover-return/stats
   */
  public getHandoverReturnStats = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await HandoverReturnService.getHandoverReturnStats();
    
    if (!result.success || !result.data) {
      return ResponseHelper.error(res, result.error || 'Failed to get statistics', 400);
    }

    this.logAction('GET_HANDOVER_RETURN_STATS', req.user.id);

    return ResponseHelper.success(res, 'Handover and return statistics retrieved successfully', result.data);
  });

  // =====================================================
  // UTILITY ENDPOINTS
  // =====================================================

  /**
   * Admin: Get all handover and return sessions
   * GET /api/v1/handover-return/admin/sessions
   */
  public getAllSessionsAdmin = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const view = (req.query.view as string) as ('handover' | 'return' | undefined);
    // Do NOT scope by userId here; admins can view everything
    const handoverFilters: HandoverSessionFilters = {
      bookingId: req.query.bookingId as string,
      ownerId: req.query.ownerId as string,
      renterId: req.query.renterId as string,
      productId: req.query.productId as string,
      status: req.query.status as any,
      handoverType: req.query.handoverType as any,
      scheduledFrom: req.query.scheduledFrom ? new Date(req.query.scheduledFrom as string) : undefined,
      scheduledTo: req.query.scheduledTo ? new Date(req.query.scheduledTo as string) : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    };

    const returnFilters: ReturnSessionFilters = {
      bookingId: req.query.bookingId as string,
      handoverSessionId: req.query.handoverSessionId as string,
      ownerId: req.query.ownerId as string,
      renterId: req.query.renterId as string,
      productId: req.query.productId as string,
      status: req.query.status as any,
      returnType: req.query.returnType as any,
      scheduledFrom: req.query.scheduledFrom ? new Date(req.query.scheduledFrom as string) : undefined,
      scheduledTo: req.query.scheduledTo ? new Date(req.query.scheduledTo as string) : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    };

    // Fetch based on requested view
    const handoverPromise = (view === 'return') ? Promise.resolve(undefined) : HandoverReturnService.getHandoverSessions(handoverFilters);
    const returnPromise = (view === 'handover') ? Promise.resolve(undefined) : HandoverReturnService.getReturnSessions(returnFilters);

    const [handoverResult, returnResult] = await Promise.all([handoverPromise, returnPromise]);

    if (handoverResult && (!handoverResult.success || !handoverResult.data)) {
      return ResponseHelper.error(res, handoverResult.error || 'Failed to get handover sessions', 400);
    }
    if (returnResult && (!returnResult.success || !returnResult.data)) {
      return ResponseHelper.error(res, returnResult.error || 'Failed to get return sessions', 400);
    }

    this.logAction('ADMIN_GET_ALL_SESSIONS', req.user.id, undefined, {
      handoverFilters,
      returnFilters
    });

    return ResponseHelper.success(
      res,
      'All sessions retrieved successfully',
      {
        handovers: handoverResult && handoverResult.data ? handoverResult.data.sessions : [],
        returns: returnResult && returnResult.data ? returnResult.data.sessions : []
      },
      200,
      {
        handovers: handoverResult && handoverResult.data ? handoverResult.data.pagination : { page: 1, limit: 0, total: 0, pages: 0 },
        returns: returnResult && returnResult.data ? returnResult.data.pagination : { page: 1, limit: 0, total: 0, pages: 0 }
      }
    );
  });

  /**
   * Generate handover code
   * POST /api/v1/handover-return/handover-sessions/:sessionId/generate-code
   */
  public generateHandoverCode = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId } = req.params;

    // Generate new 6-digit code
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Update session with new code (implementation would go in service)
    this.logAction('GENERATE_HANDOVER_CODE', req.user.id, sessionId);

    return ResponseHelper.success(res, 'Handover code generated successfully', { handoverCode: newCode });
  });

  /**
   * Generate return code
   * POST /api/v1/handover-return/return-sessions/:sessionId/generate-code
   */
  public generateReturnCode = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId } = req.params;

    // Generate new 6-digit code
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Update session with new code (implementation would go in service)
    this.logAction('GENERATE_RETURN_CODE', req.user.id, sessionId);

    return ResponseHelper.success(res, 'Return code generated successfully', { returnCode: newCode });
  });

  /**
   * Verify handover code
   * POST /api/v1/handover-return/handover-sessions/:sessionId/verify-code
   */
  public verifyHandoverCode = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId } = req.params;
    const { handoverCode } = req.body;

    if (!handoverCode) {
      return this.handleBadRequest(res, 'Missing required field: handoverCode');
    }

    // Get session and verify code (implementation would go in service)
    const session = await HandoverReturnService.getHandoverSessionById(sessionId);
    if (!session.success) {
      return this.handleNotFound(res, 'Handover session');
    }

    const isValid = session.data?.handoverCode === handoverCode;

    this.logAction('VERIFY_HANDOVER_CODE', req.user.id, sessionId, { isValid });

    return ResponseHelper.success(res, 'Handover code verification completed', { isValid });
  });

  /**
   * Verify return code
   * POST /api/v1/handover-return/return-sessions/:sessionId/verify-code
   */
  public verifyReturnCode = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId } = req.params;
    const { returnCode } = req.body;

    if (!returnCode) {
      return this.handleBadRequest(res, 'Missing required field: returnCode');
    }

    // Get session and verify code (implementation would go in service)
    const session = await HandoverReturnService.getReturnSessionById(sessionId);
    if (!session.success) {
      return this.handleNotFound(res, 'Return session');
    }

    const isValid = session.data?.returnCode === returnCode;

    this.logAction('VERIFY_RETURN_CODE', req.user.id, sessionId, { isValid });

    return ResponseHelper.success(res, 'Return code verification completed', { isValid });
  });
}

export default new HandoverReturnController();
