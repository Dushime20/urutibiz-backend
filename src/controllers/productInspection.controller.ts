import { BaseController } from './BaseController';
import { ResponseHelper } from '@/utils/response';
import ProductInspectionService from '@/services/productInspection.service';
import { AuthenticatedRequest } from '@/types';
import { Request, Response } from 'express';
import { 
  CreateInspectionRequest,
  UpdateInspectionRequest,
  CreateInspectionItemRequest,
  CreateDisputeRequest,
  ResolveDisputeRequest,
  InspectionFilters
} from '@/types/productInspection.types';

export class ProductInspectionController extends BaseController {
  
  // =====================================================
  // INSPECTION MANAGEMENT
  // =====================================================

  /**
   * Create a new inspection
   * POST /api/v1/inspections
   */
  public createInspection = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const inspectionData: CreateInspectionRequest = req.body;
    
    // Validate required fields
    if (!inspectionData.productId || !inspectionData.bookingId || !inspectionData.inspectorId) {
      return this.handleBadRequest(res, 'Missing required fields: productId, bookingId, inspectorId');
    }

    // Validate inspection type
    if (!['pre_rental', 'post_return'].includes(inspectionData.inspectionType)) {
      return this.handleBadRequest(res, 'Invalid inspection type. Must be pre_rental or post_return');
    }

    const result = await ProductInspectionService.createInspection(inspectionData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to create inspection', 400);
    }

    this.logAction('CREATE_INSPECTION', req.user.id, result.data.id, inspectionData);

    return ResponseHelper.success(res, 'Inspection created successfully', result.data);
  });

  /**
   * Get inspection by ID
   * GET /api/v1/inspections/:id
   */
  public getInspection = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const result = await ProductInspectionService.getInspectionById(id);
    
    if (!result.success) {
      return this.handleNotFound(res, 'Inspection');
    }

    // Check authorization - only participants can view inspection
    const inspection = result.data.inspection;
    if (!this.canViewInspection(inspection, req.user.id)) {
      return this.handleUnauthorized(res, 'Not authorized to view this inspection');
    }

    this.logAction('GET_INSPECTION', req.user.id, id);

    return ResponseHelper.success(res, 'Inspection retrieved successfully', result.data);
  });

  /**
   * Get inspections with filters
   * GET /api/v1/inspections
   */
  public getInspections = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page, limit } = this.getPaginationParams(req as any);
    const filters = this.buildInspectionFilters(req.query);

    const result = await ProductInspectionService.getInspections(filters, page, limit);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to fetch inspections', 400);
    }

    this.logAction('GET_INSPECTIONS', req.user.id, undefined, { filters, pagination: { page, limit } });

    return this.formatPaginatedResponse(res, 'Inspections retrieved successfully', result.data);
  });

  /**
   * Start an inspection
   * POST /api/v1/inspections/:id/start
   */
  public startInspection = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const result = await ProductInspectionService.startInspection(id, req.user.id);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to start inspection', 400);
    }

    this.logAction('START_INSPECTION', req.user.id, id);

    return ResponseHelper.success(res, 'Inspection started successfully', result.data);
  });

  /**
   * Complete an inspection
   * POST /api/v1/inspections/:id/complete
   */
  public completeInspection = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return this.handleBadRequest(res, 'Inspection items are required');
    }

    const result = await ProductInspectionService.completeInspection(id, req.user.id, items);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to complete inspection', 400);
    }

    this.logAction('COMPLETE_INSPECTION', req.user.id, id, { itemCount: items.length });

    return ResponseHelper.success(res, 'Inspection completed successfully', result.data);
  });

  /**
   * Update inspection
   * PUT /api/v1/inspections/:id
   */
  public updateInspection = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;
    const updateData: UpdateInspectionRequest = req.body;

    // Get current inspection to check authorization
    const currentInspection = await ProductInspectionService.getInspectionById(id);
    if (!currentInspection.success) {
      return this.handleNotFound(res, 'Inspection');
    }

    if (!this.canUpdateInspection(currentInspection.data.inspection, req.user.id)) {
      return this.handleUnauthorized(res, 'Not authorized to update this inspection');
    }

    // Update inspection
    const result = await ProductInspectionService.updateInspection(id, updateData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to update inspection', 400);
    }

    this.logAction('UPDATE_INSPECTION', req.user.id, id, updateData);

    return ResponseHelper.success(res, 'Inspection updated successfully', result.data);
  });

  // =====================================================
  // INSPECTION ITEMS MANAGEMENT
  // =====================================================

  /**
   * Add item to inspection
   * POST /api/v1/inspections/:id/items
   */
  public addInspectionItem = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;
    const itemData: CreateInspectionItemRequest = req.body;

    // Validate required fields
    if (!itemData.itemName || !itemData.condition) {
      return this.handleBadRequest(res, 'Missing required fields: itemName, condition');
    }

    // Validate condition enum
    if (!['excellent', 'good', 'fair', 'poor', 'damaged'].includes(itemData.condition)) {
      return this.handleBadRequest(res, 'Invalid condition. Must be excellent, good, fair, poor, or damaged');
    }

    const result = await ProductInspectionService.addInspectionItem(id, itemData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to add inspection item', 400);
    }

    this.logAction('ADD_INSPECTION_ITEM', req.user.id, id, itemData);

    return ResponseHelper.success(res, 'Inspection item added successfully', result.data);
  });

  /**
   * Update inspection item
   * PUT /api/v1/inspections/:id/items/:itemId
   */
  public updateInspectionItem = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id, itemId } = req.params;
    const updateData = req.body;

    // Get current inspection to check authorization
    const currentInspection = await ProductInspectionService.getInspectionById(id);
    if (!currentInspection.success) {
      return this.handleNotFound(res, 'Inspection');
    }

    if (!this.canUpdateInspection(currentInspection.data.inspection, req.user.id)) {
      return this.handleUnauthorized(res, 'Not authorized to update this inspection');
    }

    const result = await ProductInspectionService.updateInspectionItem(itemId, updateData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to update inspection item', 400);
    }

    this.logAction('UPDATE_INSPECTION_ITEM', req.user.id, id, { itemId, updates: updateData });

    return ResponseHelper.success(res, 'Inspection item updated successfully', result.data);
  });

  // =====================================================
  // DISPUTE MANAGEMENT
  // =====================================================

  /**
   * Raise a dispute
   * POST /api/v1/inspections/:id/disputes
   */
  public raiseDispute = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;
    const disputeData: CreateDisputeRequest = req.body;

    // Validate required fields
    if (!disputeData.disputeType || !disputeData.reason) {
      return this.handleBadRequest(res, 'Missing required fields: disputeType, reason');
    }

    // Validate dispute type enum
    if (!['damage_assessment', 'condition_disagreement', 'cost_dispute', 'other'].includes(disputeData.disputeType)) {
      return this.handleBadRequest(res, 'Invalid dispute type');
    }

    const result = await ProductInspectionService.raiseDispute(id, req.user.id, disputeData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to raise dispute', 400);
    }

    this.logAction('RAISE_DISPUTE', req.user.id, id, disputeData);

    return ResponseHelper.success(res, 'Dispute raised successfully', result.data);
  });

  /**
   * Resolve a dispute
   * PUT /api/v1/inspections/:id/disputes/:disputeId/resolve
   */
  public resolveDispute = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id, disputeId } = req.params;
    const resolutionData: ResolveDisputeRequest = req.body;

    // Validate required fields
    if (!resolutionData.resolutionNotes) {
      return this.handleBadRequest(res, 'Missing required field: resolutionNotes');
    }

    // Get current inspection to check authorization
    const currentInspection = await ProductInspectionService.getInspectionById(id);
    if (!currentInspection.success) {
      return this.handleNotFound(res, 'Inspection');
    }

    // Only inspectors and admins can resolve disputes
    if (!this.canResolveDispute(currentInspection.data.inspection, req.user)) {
      return this.handleUnauthorized(res, 'Not authorized to resolve disputes');
    }

    const result = await ProductInspectionService.resolveDispute(disputeId, req.user.id, resolutionData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to resolve dispute', 400);
    }

    this.logAction('RESOLVE_DISPUTE', req.user.id, id, { disputeId, resolution: resolutionData });

    return ResponseHelper.success(res, 'Dispute resolved successfully', result.data);
  });

  // =====================================================
  // ANALYTICS AND REPORTS
  // =====================================================

  /**
   * Get inspection summary
   * GET /api/v1/inspections/summary
   */
  public getInspectionSummary = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filters = this.buildInspectionFilters(req.query);

    const result = await ProductInspectionService.getInspectionSummary(filters);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to get inspection summary', 400);
    }

    this.logAction('GET_INSPECTION_SUMMARY', req.user.id, undefined, { filters });

    return ResponseHelper.success(res, 'Inspection summary retrieved successfully', result.data);
  });

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  /**
   * Build inspection filters from query parameters
   */
  private buildInspectionFilters(query: any): InspectionFilters {
    const filters: InspectionFilters = {};

    if (query.productId) filters.productId = query.productId;
    if (query.bookingId) filters.bookingId = query.bookingId;
    if (query.inspectorId) filters.inspectorId = query.inspectorId;
    if (query.renterId) filters.renterId = query.renterId;
    if (query.ownerId) filters.ownerId = query.ownerId;
    if (query.inspectionType) filters.inspectionType = query.inspectionType;
    if (query.status) filters.status = query.status;
    if (query.hasDispute) filters.hasDispute = query.hasDispute === 'true';
    
    if (query.scheduledFrom) filters.scheduledFrom = new Date(query.scheduledFrom);
    if (query.scheduledTo) filters.scheduledTo = new Date(query.scheduledTo);
    if (query.completedFrom) filters.completedFrom = new Date(query.completedFrom);
    if (query.completedTo) filters.completedTo = new Date(query.completedTo);

    return filters;
  }

  /**
   * Check if user can view inspection
   */
  private canViewInspection(inspection: any, userId: string): boolean {
    return inspection.inspectorId === userId || 
           inspection.renterId === userId || 
           inspection.ownerId === userId ||
           (req as any).user.role === 'admin';
  }

  /**
   * Check if user can update inspection
   */
  private canUpdateInspection(inspection: any, userId: string): boolean {
    return inspection.inspectorId === userId || 
           (req as any).user.role === 'admin';
  }

  /**
   * Check if user can resolve disputes
   */
  private canResolveDispute(inspection: any, user: any): boolean {
    return inspection.inspectorId === user.id || 
           user.role === 'admin';
  }
}

export default new ProductInspectionController();
