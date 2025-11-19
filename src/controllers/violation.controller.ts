// =====================================================
// VIOLATION CONTROLLER
// =====================================================

import { BaseController } from './BaseController';
import { ResponseHelper } from '@/utils/response';
import ViolationService from '@/services/violation.service';
import { AuthenticatedRequest } from '@/types';
import { Response } from 'express';
import { 
  CreateViolationRequest,
  UpdateViolationRequest,
  ViolationFilters
} from '@/types/violation.types';

export class ViolationController extends BaseController {
  
  // =====================================================
  // VIOLATION MANAGEMENT
  // =====================================================

  /**
   * Create a new violation
   * POST /api/v1/violations
   */
  public createViolation = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const violationData: CreateViolationRequest = {
      ...req.body,
      reportedBy: req.user.id // Set the reporter as the authenticated user
    };
    
    // Validate required fields
    if (!violationData.userId || !violationData.title || !violationData.description) {
      return ResponseHelper.badRequest(res, 'Missing required fields: userId, title, description');
    }

    const result = await ViolationService.createViolation(violationData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to create violation', 400);
    }

    this.logAction('CREATE_VIOLATION', req.user.id, result.data?.id, violationData);

    return ResponseHelper.success(res, 'Violation created successfully', result.data);
  });

  /**
   * Get violation by ID
   * GET /api/v1/violations/:id
   */
  public getViolation = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const result = await ViolationService.getViolationById(id);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Violation not found', 404);
    }

    // Check if user can view this violation
    const violation = result.data!;
    const canView = req.user.role === 'admin' || 
                   req.user.role === 'moderator' || 
                   req.user.id === violation.reportedBy ||
                   req.user.id === violation.userId;

    if (!canView) {
      return ResponseHelper.unauthorized(res, 'You are not authorized to view this violation');
    }

    this.logAction('GET_VIOLATION', req.user.id, id);

    return ResponseHelper.success(res, 'Violation retrieved successfully', violation);
  });

  /**
   * Get violations with filters and pagination
   * GET /api/v1/violations
   */
  public getViolations = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Only admins and moderators can view all violations
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return ResponseHelper.unauthorized(res, 'Admin or moderator access required');
    }

    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
    
    const filters: ViolationFilters = {
      userId: req.query.userId as string,
      productId: req.query.productId as string,
      bookingId: req.query.bookingId as string,
      violationType: req.query.violationType as any,
      severity: req.query.severity as any,
      category: req.query.category as any,
      status: req.query.status as any,
      reportedBy: req.query.reportedBy as string,
      assignedTo: req.query.assignedTo as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      search: req.query.search as string
    };

    const result = await ViolationService.getViolations(
      filters,
      parseInt(page as string),
      parseInt(limit as string),
      sortBy as string,
      sortOrder as 'asc' | 'desc'
    );
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to get violations', 400);
    }

    this.logAction('GET_VIOLATIONS', req.user.id, undefined, { filters, pagination: { page, limit } });

    return ResponseHelper.success(res, 'Violations retrieved successfully', result.data);
  });

  /**
   * Update violation
   * PUT /api/v1/violations/:id
   */
  public updateViolation = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;
    const updateData: UpdateViolationRequest = req.body;

    // Only admins and moderators can update violations
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return ResponseHelper.unauthorized(res, 'Admin or moderator access required');
    }

    const result = await ViolationService.updateViolation(id, updateData, req.user.id);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to update violation', 400);
    }

    this.logAction('UPDATE_VIOLATION', req.user.id, id, updateData);

    return ResponseHelper.success(res, 'Violation updated successfully', result.data);
  });

  /**
   * Assign violation to moderator/admin
   * POST /api/v1/violations/:id/assign
   */
  public assignViolation = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;
    const { assignedTo } = req.body;

    // Only admins can assign violations
    if (req.user.role !== 'admin') {
      return ResponseHelper.unauthorized(res, 'Admin access required');
    }

    if (!assignedTo) {
      return ResponseHelper.badRequest(res, 'assignedTo is required');
    }

    const result = await ViolationService.assignViolation(id, assignedTo, req.user.id);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to assign violation', 400);
    }

    this.logAction('ASSIGN_VIOLATION', req.user.id, id, { assignedTo });

    return ResponseHelper.success(res, 'Violation assigned successfully', result.data);
  });

  /**
   * Resolve violation
   * POST /api/v1/violations/:id/resolve
   */
  public resolveViolation = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;
    const { action, reason, penalty, notes } = req.body;

    // Only admins and moderators can resolve violations
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return ResponseHelper.unauthorized(res, 'Admin or moderator access required');
    }

    if (!action || !reason) {
      return ResponseHelper.badRequest(res, 'action and reason are required');
    }

    const resolution = {
      action,
      reason,
      penalty,
      notes
    };

    const result = await ViolationService.resolveViolation(id, resolution, req.user.id);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to resolve violation', 400);
    }

    this.logAction('RESOLVE_VIOLATION', req.user.id, id, resolution);

    return ResponseHelper.success(res, 'Violation resolved successfully', result.data);
  });

  /**
   * Add evidence to violation
   * POST /api/v1/violations/:id/evidence
   */
  public addEvidence = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;
    const { type, filename, url, description, fileSizeBytes, mimeType } = req.body;

    if (!type) {
      return ResponseHelper.badRequest(res, 'type is required');
    }

    const evidence = {
      type,
      filename,
      url,
      description,
      fileSizeBytes,
      mimeType
    };

    const result = await ViolationService.addEvidence(id, evidence, req.user.id);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to add evidence', 400);
    }

    this.logAction('ADD_VIOLATION_EVIDENCE', req.user.id, id, evidence);

    return ResponseHelper.success(res, 'Evidence added successfully');
  });

  /**
   * Add comment to violation
   * POST /api/v1/violations/:id/comments
   */
  public addComment = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;
    const { content, type = 'general', isInternal = false } = req.body;

    if (!content) {
      return ResponseHelper.badRequest(res, 'content is required');
    }

    const comment = {
      content,
      type,
      isInternal
    };

    const result = await ViolationService.addComment(id, comment, req.user.id);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to add comment', 400);
    }

    this.logAction('ADD_VIOLATION_COMMENT', req.user.id, id, comment);

    return ResponseHelper.success(res, 'Comment added successfully');
  });

  /**
   * Get violation statistics
   * GET /api/v1/violations/stats
   */
  public getViolationStats = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Only admins and moderators can view statistics
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return ResponseHelper.unauthorized(res, 'Admin or moderator access required');
    }

    const result = await ViolationService.getViolationStats();
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to get violation statistics', 400);
    }

    this.logAction('GET_VIOLATION_STATS', req.user.id);

    return ResponseHelper.success(res, 'Violation statistics retrieved successfully', result.data);
  });

  /**
   * Get violations by user
   * GET /api/v1/violations/user/:userId
   */
  public getViolationsByUser = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Users can only view their own violations, admins/moderators can view any
    const canView = req.user.role === 'admin' || 
                   req.user.role === 'moderator' || 
                   req.user.id === userId;

    if (!canView) {
      return ResponseHelper.unauthorized(res, 'You are not authorized to view these violations');
    }

    const result = await ViolationService.getViolationsByUser(
      userId,
      parseInt(page as string),
      parseInt(limit as string)
    );
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to get user violations', 400);
    }

    this.logAction('GET_USER_VIOLATIONS', req.user.id, userId, { pagination: { page, limit } });

    return ResponseHelper.success(res, 'User violations retrieved successfully', result.data);
  });

  /**
   * Get violations assigned to current user
   * GET /api/v1/violations/assigned
   */
  public getAssignedViolations = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Only admins and moderators can have assigned violations
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return ResponseHelper.unauthorized(res, 'Admin or moderator access required');
    }

    const { page = 1, limit = 20 } = req.query;

    const result = await ViolationService.getViolationsByAssignee(
      req.user.id,
      parseInt(page as string),
      parseInt(limit as string)
    );
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to get assigned violations', 400);
    }

    this.logAction('GET_ASSIGNED_VIOLATIONS', req.user.id, undefined, { pagination: { page, limit } });

    return ResponseHelper.success(res, 'Assigned violations retrieved successfully', result.data);
  });

  /**
   * Get violations reported by current user
   * GET /api/v1/violations/reported
   */
  public getReportedViolations = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 20 } = req.query;

    const result = await ViolationService.getViolationsByUser(
      req.user.id,
      parseInt(page as string),
      parseInt(limit as string)
    );
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to get reported violations', 400);
    }

    this.logAction('GET_REPORTED_VIOLATIONS', req.user.id, undefined, { pagination: { page, limit } });

    return ResponseHelper.success(res, 'Reported violations retrieved successfully', result.data);
  });
}

export default new ViolationController();
