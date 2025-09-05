import { BaseController } from './BaseController';
import { ResponseHelper } from '@/utils/response';
import HandoverReturnService from '@/services/handoverReturn.service';
import { AuthenticatedRequest } from '@/types';
import { Request, Response } from 'express';
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

    this.logAction('CREATE_HANDOVER_SESSION', req.user.id, result.data.id, sessionData);

    return ResponseHelper.success(res, 'Handover session created successfully', result.data);
  });

  /**
   * Get handover session by ID
   * GET /api/v1/handover-return/handover-sessions/:sessionId
   */
  public getHandoverSession = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId } = req.params;

    const result = await HandoverReturnService.getHandoverSessionById(sessionId);
    
    if (!result.success) {
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

    // Implementation would go in service
    // For now, return empty array
    this.logAction('GET_HANDOVER_SESSIONS', req.user.id, null, filters);

    return ResponseHelper.success(res, 'Handover sessions retrieved successfully', []);
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

    this.logAction('CREATE_RETURN_SESSION', req.user.id, result.data.id, sessionData);

    return ResponseHelper.success(res, 'Return session created successfully', result.data);
  });

  /**
   * Get return session by ID
   * GET /api/v1/handover-return/return-sessions/:sessionId
   */
  public getReturnSession = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId } = req.params;

    const result = await HandoverReturnService.getReturnSessionById(sessionId);
    
    if (!result.success) {
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

    // Implementation would go in service
    // For now, return empty array
    this.logAction('GET_RETURN_SESSIONS', req.user.id, null, filters);

    return ResponseHelper.success(res, 'Return sessions retrieved successfully', []);
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

    // Implementation would go in service
    // For now, return empty array
    this.logAction('GET_MESSAGES', req.user.id, null, filters);

    return ResponseHelper.success(res, 'Messages retrieved successfully', []);
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

    // Implementation would go in service
    // For now, return empty array
    this.logAction('GET_NOTIFICATIONS', req.user.id, null, filters);

    return ResponseHelper.success(res, 'Notifications retrieved successfully', []);
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
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to get statistics', 400);
    }

    this.logAction('GET_HANDOVER_RETURN_STATS', req.user.id);

    return ResponseHelper.success(res, 'Handover and return statistics retrieved successfully', result.data);
  });

  // =====================================================
  // UTILITY ENDPOINTS
  // =====================================================

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
