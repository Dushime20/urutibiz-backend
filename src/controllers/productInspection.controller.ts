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
  InspectionFilters,
  InspectionType,
  InspectionStatus
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
    const validInspectionTypes = ['pre_rental', 'post_return', 'damage_assessment', 'post_rental_maintenance_check', 'quality_verification'];
    if (!validInspectionTypes.includes(inspectionData.inspectionType)) {
      return this.handleBadRequest(res, `Invalid inspection type. Must be one of: ${validInspectionTypes.join(', ')}`);
    }

    const result = await ProductInspectionService.createInspection(inspectionData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to create inspection', 400);
    }

    this.logAction('CREATE_INSPECTION', req.user.id, result.data.id, inspectionData);

    return ResponseHelper.success(res, 'Inspection created successfully', result.data);
  });

  /**
   * List inspectors for inspections
   * GET /api/v1/inspections/inspectors
   */
  public getInspectors = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Auth is enforced by middleware at route level
    const role = typeof req.query.role === 'string' && req.query.role.length > 0 ? req.query.role : 'inspector';
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const take = req.query.take ? Number(req.query.take) : undefined;
    const skip = req.query.skip ? Number(req.query.skip) : undefined;

    const result = await ProductInspectionService.getInspectors({ role, search, take, skip });
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to fetch inspectors', 400);
    }

    return ResponseHelper.success(res, 'Inspectors retrieved successfully', result.data);
  });

  /**
   * Get disputes raised by the authenticated user
   * GET /api/v1/inspections/disputes
   */
  public getMyDisputes = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const inspectionId = typeof req.query.inspectionId === 'string' ? req.query.inspectionId : undefined;
    const disputeType = typeof req.query.disputeType === 'string' ? req.query.disputeType : undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    // If user is inspector, get all disputes (like admin)
    if (userRole === 'inspector') {
      const result = await ProductInspectionService.getAllDisputes({
        status,
        inspectionId,
        disputeType,
        page,
        limit
      });

      if (!result.success) {
        return ResponseHelper.error(res, result.error || 'Failed to fetch disputes', 400);
      }

      return ResponseHelper.success(res, 'All disputes retrieved successfully', result.data);
    }

    // For other roles (renter, owner), get only their own disputes
    const result = await ProductInspectionService.getMyDisputes(userId, {
      status,
      inspectionId,
      disputeType,
      page,
      limit
    });

    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to fetch disputes', 400);
    }

    return ResponseHelper.success(res, 'Disputes retrieved successfully', result.data);
  });

  /**
   * Get all disputes (admin only)
   * GET /api/v1/inspections/admin/disputes
   */
  public getAllDisputes = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return ResponseHelper.error(res, 'Access denied. Admin role required.', 403);
    }

    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const inspectionId = typeof req.query.inspectionId === 'string' ? req.query.inspectionId : undefined;
    const disputeType = typeof req.query.disputeType === 'string' ? req.query.disputeType : undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const result = await ProductInspectionService.getAllDisputes({
      status,
      inspectionId,
      disputeType,
      page,
      limit
    });

    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to fetch disputes', 400);
    }

    return ResponseHelper.success(res, 'All disputes retrieved successfully', result.data);
  });

  /**
   * Get all disputes for a specific inspection
   * GET /api/v1/inspections/:id/disputes
   */
  public getInspectionDisputes = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user can view this inspection
    const inspection = await ProductInspectionService.getInspectionById(id);
    if (!inspection.success || !inspection.data) {
      return ResponseHelper.error(res, 'Inspection not found', 404);
    }

    if (!this.canViewInspection(inspection.data, req.user)) {
      return ResponseHelper.error(res, 'Not authorized to view this inspection', 403);
    }

    const result = await ProductInspectionService.getInspectionDisputes(id);
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to fetch disputes', 400);
    }

    return ResponseHelper.success(res, 'Inspection disputes retrieved successfully', result.data);
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
    if (!this.canViewInspection(inspection, req.user)) {
      return this.handleUnauthorized(res, 'Not authorized to view this inspection');
    }

    this.logAction('GET_INSPECTION', req.user.id, id);

    return ResponseHelper.success(res, 'Inspection retrieved successfully', result.data);
  });

  /**
   * Get user's inspections for my_account section
   * GET /api/v1/inspections/my-inspections
   */
  public getMyInspections = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user.id;
    const { page, limit } = this.getPaginationParams(req as any);
    const role = (req.query.role as 'inspector' | 'renter' | 'owner') || 'inspector';
    
    // Build user-specific filters
    const filters: InspectionFilters = {};
    
    if (role === 'inspector') {
      filters.inspectorId = userId;
    } else if (role === 'renter') {
      filters.renterId = userId;
    } else if (role === 'owner') {
      filters.ownerId = userId;
    }

    // Add additional filters from query params
    if (req.query.inspectionType) filters.inspectionType = req.query.inspectionType as InspectionType;
    if (req.query.status) filters.status = req.query.status as InspectionStatus;
    if (req.query.hasDispute) filters.hasDispute = req.query.hasDispute === 'true';
    
    if (req.query.scheduledFrom) filters.scheduledFrom = new Date(req.query.scheduledFrom as string);
    if (req.query.scheduledTo) filters.scheduledTo = new Date(req.query.scheduledTo as string);
    if (req.query.completedFrom) filters.completedFrom = new Date(req.query.completedFrom as string);
    if (req.query.completedTo) filters.completedTo = new Date(req.query.completedTo as string);

    const result = await ProductInspectionService.getInspections(filters, page, limit);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to fetch user inspections', 400);
    }

    this.logAction('GET_MY_INSPECTIONS', userId, undefined, { role, filters, pagination: { page, limit } });

    return this.formatPaginatedResponse(res, 'User inspections retrieved successfully', result.data);
  });

  /**
   * Get inspections by user ID (renter_id)
   * GET /api/v1/inspections/user/:userId
   */
  public getUserInspections = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.params;
    const { page, limit } = this.getPaginationParams(req as any);
    
    // Build filters for inspections where user is the renter
    const filters: InspectionFilters = {
      renterId: userId
    };
    
    // Add additional filters from query params
    if (req.query.inspectionType) filters.inspectionType = req.query.inspectionType as InspectionType;
    if (req.query.status) filters.status = req.query.status as InspectionStatus;
    if (req.query.hasDispute) filters.hasDispute = req.query.hasDispute === 'true';
    
    if (req.query.scheduledFrom) filters.scheduledFrom = new Date(req.query.scheduledFrom as string);
    if (req.query.scheduledTo) filters.scheduledTo = new Date(req.query.scheduledTo as string);
    if (req.query.completedFrom) filters.completedFrom = new Date(req.query.completedFrom as string);
    if (req.query.completedTo) filters.completedTo = new Date(req.query.completedTo as string);

    const result = await ProductInspectionService.getInspections(filters, page, limit);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to fetch user inspections', 400);
    }

    this.logAction('GET_USER_INSPECTIONS', req.user.id, userId, { filters, pagination: { page, limit } });

    return this.formatPaginatedResponse(res, 'User inspections retrieved successfully', result.data);
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

    if (!this.canUpdateInspection(currentInspection.data.inspection, req.user)) {
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
   * Add inspection item with photo uploads to Cloudinary
   * POST /api/v1/inspections/:id/items/with-photos
   */
  public addInspectionItemWithPhotos = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;
    const itemData: CreateInspectionItemRequest = req.body;
    const files = (req as any).files as Express.Multer.File[];

    // Validate required fields
    if (!itemData.itemName || !itemData.condition) {
      return this.handleBadRequest(res, 'Missing required fields: itemName, condition');
    }

    // Validate condition enum
    if (!['excellent', 'good', 'fair', 'poor', 'damaged'].includes(itemData.condition)) {
      return this.handleBadRequest(res, 'Invalid condition. Must be excellent, good, fair, poor, or damaged');
    }

    // Upload photos to Cloudinary if files are provided
    let photoUrls: string[] = [];
    if (files && files.length > 0) {
      try {
        const uploadPromises = files.map(async (file) => {
          const cloudinary = (await import('@/config/cloudinary')).default;
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'inspection-items',
            resource_type: 'auto',
            transformation: [
              { width: 800, height: 600, crop: 'limit' },
              { quality: 'auto:good' }
            ]
          });
          return result.secure_url;
        });

        photoUrls = await Promise.all(uploadPromises);
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        return ResponseHelper.error(res, 'Failed to upload photos', 500);
      }
    }

    // Add photo URLs to item data
    const itemDataWithPhotos = {
      ...itemData,
      photos: photoUrls
    };

    const result = await ProductInspectionService.addInspectionItem(id, itemDataWithPhotos);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to add inspection item', 400);
    }

    this.logAction('ADD_INSPECTION_ITEM_WITH_PHOTOS', req.user.id, id, { ...itemData, photoCount: photoUrls.length });

    return ResponseHelper.success(res, 'Inspection item with photos added successfully', result.data);
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

    if (!this.canUpdateInspection(currentInspection.data.inspection, req.user)) {
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

  /**
   * Resolve a dispute by admin (direct dispute ID)
   * PUT /api/v1/inspections/admin/disputes/:disputeId/resolve
   */
  public resolveDisputeByAdmin = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { disputeId } = req.params;
    const resolutionData: ResolveDisputeRequest = req.body;

    // Validate required fields
    if (!resolutionData.resolutionNotes) {
      return this.handleBadRequest(res, 'Missing required field: resolutionNotes');
    }

    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return ResponseHelper.error(res, 'Access denied. Admin role required.', 403);
    }

    const result = await ProductInspectionService.resolveDispute(disputeId, req.user.id, resolutionData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to resolve dispute', 400);
    }

    this.logAction('RESOLVE_DISPUTE_BY_ADMIN', req.user.id, disputeId, { resolution: resolutionData });

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
  private canViewInspection(inspection: any, user: any): boolean {
    return inspection.inspectorId === user.id || 
           inspection.renterId === user.id || 
           inspection.ownerId === user.id ||
           user.role === 'admin';
  }

  /**
   * Check if user can update inspection
   */
  private canUpdateInspection(inspection: any, user: any): boolean {
    return inspection.inspectorId === user.id || 
           user.role === 'admin';
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
