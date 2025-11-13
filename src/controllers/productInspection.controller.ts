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
   * Create a new inspection (supports multipart/form-data with pre-inspection photos)
   * POST /api/v1/inspections
   */
  public createInspection = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const files = (req as any).files as Express.Multer.File[];
    const isMultipart = req.headers['content-type']?.includes('multipart/form-data');
    
    let inspectionData: CreateInspectionRequest;
    let ownerPreInspectionData: any = undefined;

    // Handle multipart/form-data (for pre-inspection with photos)
    // Check if multipart request (even if no files yet, FormData might have other fields)
    if (isMultipart) {
      // Handle multipart/form-data (with pre-inspection photos)
      const body = req.body;
      
      // Validate required fields - bookingId is required (productId will be auto-populated from booking)
      if (!body.bookingId) {
        return this.handleBadRequest(res, 'Missing required field: bookingId (pre-inspection can only be done on confirmed bookings)');
      }

      // Validate inspection type
      const validInspectionTypes = ['pre_rental', 'post_return', 'damage_assessment', 'post_rental_maintenance_check', 'quality_verification'];
      if (!body.inspectionType || !validInspectionTypes.includes(body.inspectionType)) {
        return this.handleBadRequest(res, `Invalid inspection type. Must be one of: ${validInspectionTypes.join(', ')}`);
      }

      // Upload photos to Cloudinary if files are provided
      let photoUrls: string[] = [];
      if (files && files.length > 0) {
        try {
          const cloudinary = (await import('@/config/cloudinary')).default;
          const uploadPromises = files.map(async (file) => {
            const result = await cloudinary.uploader.upload(file.path, {
              folder: 'inspection-pre-inspection',
              resource_type: 'auto',
              transformation: [
                { width: 1200, height: 1200, crop: 'limit' },
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

      // Parse ownerPreInspectionData from FormData
      if (body.ownerPreInspectionData) {
        try {
          const parsed = typeof body.ownerPreInspectionData === 'string' 
            ? JSON.parse(body.ownerPreInspectionData) 
            : body.ownerPreInspectionData;
          
          ownerPreInspectionData = {
            ...parsed,
            photos: photoUrls.length > 0 ? photoUrls : (parsed.photos || [])
          };
        } catch (error) {
          console.error('Failed to parse ownerPreInspectionData:', error);
          return ResponseHelper.error(res, 'Invalid ownerPreInspectionData format', 400);
        }
      } else if (photoUrls.length > 0) {
        // If photos uploaded but no ownerPreInspectionData, create it
        ownerPreInspectionData = {
          photos: photoUrls,
          condition: body.condition ? (typeof body.condition === 'string' ? JSON.parse(body.condition) : body.condition) : undefined,
          notes: body.notes || '',
          location: body.location ? (typeof body.location === 'string' ? JSON.parse(body.location) : body.location) : undefined,
          timestamp: body.timestamp || new Date().toISOString(),
          confirmed: body.confirmed === 'true' || body.confirmed === true
        };
      }

      // Convert scheduledAt to Date and validate
      let scheduledAtDate: Date;
      try {
        scheduledAtDate = body.scheduledAt instanceof Date 
          ? body.scheduledAt 
          : new Date(body.scheduledAt);
        
        // Validate that it's a valid date
        if (isNaN(scheduledAtDate.getTime())) {
          return this.handleBadRequest(res, 'Invalid scheduled date format');
        }
      } catch (error) {
        return this.handleBadRequest(res, 'Invalid scheduled date format');
      }

      inspectionData = {
        productId: body.productId,
        bookingId: body.bookingId,
        inspectorId: body.inspectorId || undefined, // Optional
        inspectionType: body.inspectionType,
        scheduledAt: scheduledAtDate,
        inspectionLocation: body.location || body.inspectionLocation,
        generalNotes: body.notes || body.generalNotes,
        ownerPreInspectionData
      };
    } else {
      // Handle JSON request (regular inspection creation)
      inspectionData = req.body;
      
      // Validate required fields - bookingId is required (productId will be auto-populated from booking)
      if (!inspectionData.bookingId) {
        return this.handleBadRequest(res, 'Missing required field: bookingId (pre-inspection can only be done on confirmed bookings)');
      }

      // Validate inspection type
      const validInspectionTypes = ['pre_rental', 'post_return', 'damage_assessment', 'post_rental_maintenance_check', 'quality_verification'];
      if (!inspectionData.inspectionType || !validInspectionTypes.includes(inspectionData.inspectionType)) {
        return this.handleBadRequest(res, `Invalid inspection type. Must be one of: ${validInspectionTypes.join(', ')}`);
      }

      // Convert scheduledAt to Date if it's a string
      if (inspectionData.scheduledAt && typeof inspectionData.scheduledAt === 'string') {
        try {
          inspectionData.scheduledAt = new Date(inspectionData.scheduledAt);
          // Validate that it's a valid date
          if (isNaN(inspectionData.scheduledAt.getTime())) {
            return this.handleBadRequest(res, 'Invalid scheduled date format');
          }
        } catch (error) {
          return this.handleBadRequest(res, 'Invalid scheduled date format');
        }
      }

      // inspectorId is optional now
      if (inspectionData.ownerPreInspectionData) {
        ownerPreInspectionData = inspectionData.ownerPreInspectionData;
      }
    }

    const result = await ProductInspectionService.createInspection(inspectionData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to create inspection', 400);
    }

    this.logAction('CREATE_INSPECTION', req.user.id, result.data.id, { 
      ...inspectionData, 
      hasPreInspectionData: !!ownerPreInspectionData,
      photoCount: ownerPreInspectionData?.photos?.length || 0
    });

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

    const isAdmin = (req.user.role === 'admin' || req.user.role === 'super_admin');
    const result = await ProductInspectionService.startInspection(id, req.user.id, isAdmin);
    
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
    const { items, inspectorNotes, generalNotes, ownerNotes, renterNotes, inspectionLocation } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return this.handleBadRequest(res, 'Inspection items are required');
    }

    // Validate that each item has required fields including description
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.itemName) {
        return this.handleBadRequest(res, `Item ${i + 1}: itemName is required`);
      }
      if (!item.condition) {
        return this.handleBadRequest(res, `Item ${i + 1}: condition is required`);
      }
      if (!item.description || item.description.trim().length === 0) {
        return this.handleBadRequest(res, `Item ${i + 1}: description is required`);
      }
    }

    // Prepare additional inspection data
    const inspectionData = {
      inspectorNotes,
      generalNotes,
      ownerNotes,
      renterNotes,
      inspectionLocation
    };

    const isAdmin = (req.user.role === 'admin' || req.user.role === 'super_admin');
    const result = await ProductInspectionService.completeInspection(id, req.user.id, items, inspectionData, isAdmin);
    
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

  // =====================================================
  // NEW WORKFLOW CONTROLLERS - OWNER PRE-INSPECTION
  // =====================================================

  /**
   * Owner submits pre-inspection data with photos
   * POST /api/v1/inspections/:id/owner-pre-inspection
   */
  public submitOwnerPreInspection = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;
    const userId = req.user.id;
    const files = (req as any).files as Express.Multer.File[];

    // Check if user is the owner of this inspection
    const inspection = await ProductInspectionService.getInspectionById(id);
    if (!inspection.success || !inspection.data) {
      return ResponseHelper.error(res, 'Inspection not found', 404);
    }

    if (inspection.data.ownerId !== userId) {
      return ResponseHelper.error(res, 'Not authorized. Only the product owner can submit pre-inspection.', 403);
    }

    // Upload photos to Cloudinary if files are provided
    let photoUrls: string[] = [];
    if (files && files.length > 0) {
      try {
        const cloudinary = (await import('@/config/cloudinary')).default;
        const uploadPromises = files.map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'inspection-pre-inspection',
            resource_type: 'auto',
            transformation: [
              { width: 1200, height: 1200, crop: 'limit' },
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

    // Parse JSON fields from body
    const condition = req.body.condition ? JSON.parse(req.body.condition) : undefined;
    const location = req.body.location ? JSON.parse(req.body.location) : undefined;
    const notes = req.body.notes || '';
    const timestamp = req.body.timestamp || new Date().toISOString();

    // Prepare pre-inspection data
    const preInspectionData = {
      photos: photoUrls,
      condition,
      notes,
      location,
      timestamp
    };

    const result = await ProductInspectionService.submitOwnerPreInspection(id, preInspectionData);

    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to submit pre-inspection', 400);
    }

    this.logAction('SUBMIT_OWNER_PRE_INSPECTION', userId, id, { photoCount: photoUrls.length });

    return ResponseHelper.success(res, 'Pre-inspection submitted successfully', result.data);
  });

  /**
   * Owner confirms pre-inspection
   * POST /api/v1/inspections/:id/owner-pre-inspection/confirm
   */
  public confirmOwnerPreInspection = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is the owner of this inspection
    const inspection = await ProductInspectionService.getInspectionById(id);
    if (!inspection.success || !inspection.data) {
      return ResponseHelper.error(res, 'Inspection not found', 404);
    }

    if (inspection.data.ownerId !== userId) {
      return ResponseHelper.error(res, 'Not authorized. Only the product owner can confirm pre-inspection.', 403);
    }

    const result = await ProductInspectionService.confirmOwnerPreInspection(id);

    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to confirm pre-inspection', 400);
    }

    this.logAction('CONFIRM_OWNER_PRE_INSPECTION', userId, id);

    return ResponseHelper.success(res, 'Pre-inspection confirmed successfully', result.data);
  });

  // =====================================================
  // NEW WORKFLOW CONTROLLERS - RENTER PRE-REVIEW
  // =====================================================

  /**
   * Renter reviews and accepts/rejects owner pre-inspection
   * POST /api/v1/inspections/:id/renter-pre-review
   */
  public submitRenterPreReview = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;
    const userId = req.user.id;
    const { accepted, concerns, additionalRequests, timestamp } = req.body;

    // Check if user is the renter of this inspection
    const inspectionResult = await ProductInspectionService.getInspectionById(id);
    if (!inspectionResult.success || !inspectionResult.data) {
      return ResponseHelper.error(res, 'Inspection not found', 404);
    }

    // getInspectionById returns InspectionReport which has inspection nested in data.inspection
    const inspectionData = inspectionResult.data.inspection || inspectionResult.data;
    
    // Handle both camelCase and snake_case, and ensure string comparison
    const inspectionRenterId = String(inspectionData.renterId || inspectionData.renter_id || '');
    const currentUserId = String(userId || '');
    
    console.log('[ProductInspectionController] Authorization check:', {
      inspectionId: id,
      inspectionRenterId,
      currentUserId,
      match: inspectionRenterId === currentUserId,
      inspectionData: {
        renterId: inspectionData.renterId,
        renter_id: inspectionData.renter_id,
        ownerId: inspectionData.ownerId,
        owner_id: inspectionData.owner_id
      },
      fullInspectionResult: inspectionResult.data
    });

    if (inspectionRenterId !== currentUserId) {
      return ResponseHelper.error(res, 'Not authorized. Only the renter can review pre-inspection.', 403);
    }

    // Validate required fields
    if (typeof accepted !== 'boolean') {
      return ResponseHelper.error(res, 'Missing required field: accepted (boolean)', 400);
    }

    const reviewData = {
      accepted,
      concerns: concerns ? (Array.isArray(concerns) ? concerns : JSON.parse(concerns)) : undefined,
      additionalRequests: additionalRequests ? (Array.isArray(additionalRequests) ? additionalRequests : JSON.parse(additionalRequests)) : undefined,
      timestamp: timestamp || new Date().toISOString()
    };

    const result = await ProductInspectionService.submitRenterPreReview(id, reviewData);

    if (!result.success) {
      // Check if it's a migration error (should be 500) or validation error (400)
      const isMigrationError = result.error?.includes('Database migration required');
      const statusCode = isMigrationError ? 500 : 400;
      console.error('[ProductInspectionController] Submit renter pre-review failed:', {
        inspectionId: id,
        error: result.error,
        statusCode
      });
      return ResponseHelper.error(res, result.error || 'Failed to submit review', statusCode);
    }

    this.logAction('SUBMIT_RENTER_PRE_REVIEW', userId, id, { accepted });

    return ResponseHelper.success(res, 'Pre-inspection review submitted successfully', result.data);
  });

  /**
   * Renter reports discrepancy with owner pre-inspection
   * POST /api/v1/inspections/:id/renter-discrepancy
   */
  public reportRenterDiscrepancy = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;
    const userId = req.user.id;
    const files = (req as any).files as Express.Multer.File[];

    // Check if user is the renter of this inspection
    const inspectionResult = await ProductInspectionService.getInspectionById(id);
    if (!inspectionResult.success || !inspectionResult.data) {
      return ResponseHelper.error(res, 'Inspection not found', 404);
    }

    // getInspectionById returns InspectionReport which has inspection nested in data.inspection
    const inspectionData = inspectionResult.data.inspection || inspectionResult.data;
    
    // Handle both camelCase and snake_case, and ensure string comparison
    const inspectionRenterId = String(inspectionData.renterId || inspectionData.renter_id || '');
    const currentUserId = String(userId || '');
    
    console.log('[ProductInspectionController] Report discrepancy authorization check:', {
      inspectionId: id,
      inspectionRenterId,
      currentUserId,
      match: inspectionRenterId === currentUserId,
      inspectionData: {
        renterId: inspectionData.renterId,
        renter_id: inspectionData.renter_id,
        ownerId: inspectionData.ownerId,
        owner_id: inspectionData.owner_id
      }
    });

    if (inspectionRenterId !== currentUserId) {
      return ResponseHelper.error(res, 'Not authorized. Only the renter can report discrepancies.', 403);
    }

    // Validate required fields
    let issues: string[] = [];
    try {
      if (req.body.issues) {
        if (Array.isArray(req.body.issues)) {
          issues = req.body.issues;
        } else if (typeof req.body.issues === 'string') {
          issues = JSON.parse(req.body.issues);
        }
      }
    } catch (error) {
      console.error('[ProductInspectionController] Error parsing issues:', error);
      return ResponseHelper.error(res, 'Invalid issues format. Must be a JSON array.', 400);
    }
    
    const notes = req.body.notes || '';

    if (!issues || issues.length === 0) {
      return ResponseHelper.error(res, 'Missing required field: issues (array)', 400);
    }

    console.log('[ProductInspectionController] Report discrepancy payload:', {
      inspectionId: id,
      issuesCount: issues.length,
      notesLength: notes.length,
      photosCount: files?.length || 0
    });

    // Upload photos to Cloudinary if files are provided
    let photoUrls: string[] = [];
    if (files && files.length > 0) {
      try {
        const cloudinary = (await import('@/config/cloudinary')).default;
        const uploadPromises = files.map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'inspection-discrepancies',
            resource_type: 'auto',
            transformation: [
              { width: 1200, height: 1200, crop: 'limit' },
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

    const discrepancyData = {
      issues,
      notes,
      photos: photoUrls,
      timestamp: req.body.timestamp || new Date().toISOString()
    };

    const result = await ProductInspectionService.reportRenterDiscrepancy(id, discrepancyData);

    if (!result.success) {
      // Check if it's a migration error (should be 500) or validation error (400)
      const isMigrationError = result.error?.includes('Database migration required');
      const statusCode = isMigrationError ? 500 : 400;
      console.error('[ProductInspectionController] Report discrepancy failed:', {
        inspectionId: id,
        error: result.error,
        statusCode
      });
      return ResponseHelper.error(res, result.error || 'Failed to report discrepancy', statusCode);
    }

    this.logAction('REPORT_RENTER_DISCREPANCY', userId, id, { issueCount: issues.length, photoCount: photoUrls.length });

    return ResponseHelper.success(res, 'Discrepancy reported successfully', result.data);
  });

  /**
   * Renter submits post-inspection data (after returning the product)
   * POST /api/v1/inspections/:id/renter-post-inspection
   */
  public submitRenterPostInspection = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;
    const userId = req.user.id;
    const files = (req as any).files as Express.Multer.File[];

    // Check if user is the renter of this inspection
    const inspectionResult = await ProductInspectionService.getInspectionById(id);
    if (!inspectionResult.success || !inspectionResult.data) {
      return ResponseHelper.error(res, 'Inspection not found', 404);
    }

    // getInspectionById returns InspectionReport which has inspection nested in data.inspection
    const inspectionData = inspectionResult.data.inspection || inspectionResult.data;
    
    // Handle both camelCase and snake_case, and ensure string comparison
    const inspectionRenterId = String(inspectionData.renterId || inspectionData.renter_id || '');
    const currentUserId = String(userId || '');
    
    console.log('[ProductInspectionController] Submit post-inspection authorization check:', {
      inspectionId: id,
      inspectionRenterId,
      currentUserId,
      match: inspectionRenterId === currentUserId
    });

    if (inspectionRenterId !== currentUserId) {
      return ResponseHelper.error(res, 'Not authorized. Only the renter can submit post-inspection.', 403);
    }

    // Upload photos to Cloudinary if files are provided
    let photoUrls: string[] = [];
    if (files && files.length > 0) {
      try {
        const cloudinary = (await import('@/config/cloudinary')).default;
        const uploadPromises = files.map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'inspection-post-return',
            resource_type: 'auto',
            transformation: [
              { width: 1200, height: 1200, crop: 'limit' },
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

    // Parse JSON fields from body
    let condition: any = undefined;
    let returnLocation: any = undefined;
    try {
      if (req.body.condition) {
        condition = typeof req.body.condition === 'string' ? JSON.parse(req.body.condition) : req.body.condition;
      }
      if (req.body.returnLocation) {
        returnLocation = typeof req.body.returnLocation === 'string' ? JSON.parse(req.body.returnLocation) : req.body.returnLocation;
      }
    } catch (error) {
      console.error('[ProductInspectionController] Error parsing JSON fields:', error);
      return ResponseHelper.error(res, 'Invalid JSON format in request body', 400);
    }

    const notes = req.body.notes || '';
    const timestamp = req.body.timestamp || new Date().toISOString();
    const confirmed = req.body.confirmed === 'true' || req.body.confirmed === true;

    // Validate required fields
    if (!condition) {
      return ResponseHelper.error(res, 'Missing required field: condition', 400);
    }

    if (!returnLocation) {
      return ResponseHelper.error(res, 'Missing required field: returnLocation', 400);
    }

    if (photoUrls.length < 2) {
      return ResponseHelper.error(res, 'At least 2 photos are required', 400);
    }

    const postInspectionData = {
      returnPhotos: photoUrls,
      condition,
      notes,
      returnLocation,
      timestamp,
      confirmed
    };

    console.log('[ProductInspectionController] Submit post-inspection payload:', {
      inspectionId: id,
      photosCount: photoUrls.length,
      hasCondition: !!condition,
      hasLocation: !!returnLocation,
      notesLength: notes.length
    });

    const result = await ProductInspectionService.submitRenterPostInspection(id, postInspectionData);

    if (!result.success) {
      // Check if it's a migration error (should be 500) or validation error (400)
      const isMigrationError = result.error?.includes('Database migration required');
      const statusCode = isMigrationError ? 500 : 400;
      console.error('[ProductInspectionController] Submit post-inspection failed:', {
        inspectionId: id,
        error: result.error,
        statusCode
      });
      return ResponseHelper.error(res, result.error || 'Failed to submit post-inspection', statusCode);
    }

    this.logAction('SUBMIT_RENTER_POST_INSPECTION', userId, id, { photoCount: photoUrls.length });

    return ResponseHelper.success(res, 'Post-inspection submitted successfully', result.data);
  });

  /**
   * Renter confirms post-inspection
   * POST /api/v1/inspections/:id/renter-post-inspection/confirm
   */
  public confirmRenterPostInspection = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is the renter of this inspection
    const inspectionResult = await ProductInspectionService.getInspectionById(id);
    if (!inspectionResult.success || !inspectionResult.data) {
      return ResponseHelper.error(res, 'Inspection not found', 404);
    }

    const inspectionData = inspectionResult.data.inspection || inspectionResult.data;
    const inspectionRenterId = String(inspectionData.renterId || inspectionData.renter_id || '');
    const currentUserId = String(userId || '');

    if (inspectionRenterId !== currentUserId) {
      return ResponseHelper.error(res, 'Not authorized. Only the renter can confirm post-inspection.', 403);
    }

    const result = await ProductInspectionService.confirmRenterPostInspection(id);

    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to confirm post-inspection', 400);
    }

    this.logAction('CONFIRM_RENTER_POST_INSPECTION', userId, id, {});

    return ResponseHelper.success(res, 'Post-inspection confirmed successfully', result.data);
  });

  /**
   * Owner reviews post-inspection (accept or dispute)
   * POST /api/v1/inspections/:id/owner-post-review
   */
  public submitOwnerPostReview = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;
    const userId = req.user.id;
    const files = (req as any).files as Express.Multer.File[];

    // Check if user is the owner of this inspection
    const inspectionResult = await ProductInspectionService.getInspectionById(id);
    if (!inspectionResult.success || !inspectionResult.data) {
      return ResponseHelper.error(res, 'Inspection not found', 404);
    }

    // getInspectionById returns InspectionReport which has inspection nested in data.inspection
    const inspectionData = inspectionResult.data.inspection || inspectionResult.data;
    
    // Handle both camelCase and snake_case, and ensure string comparison
    const inspectionOwnerId = String(inspectionData.ownerId || inspectionData.owner_id || '');
    const currentUserId = String(userId || '');
    
    console.log('[ProductInspectionController] Submit owner post-review authorization check:', {
      inspectionId: id,
      inspectionOwnerId,
      currentUserId,
      match: inspectionOwnerId === currentUserId
    });

    if (inspectionOwnerId !== currentUserId) {
      return ResponseHelper.error(res, 'Not authorized. Only the owner can review post-inspection.', 403);
    }

    // Upload dispute evidence photos to Cloudinary if files are provided
    let disputeEvidenceUrls: string[] = [];
    if (files && files.length > 0) {
      try {
        const cloudinary = (await import('@/config/cloudinary')).default;
        const uploadPromises = files.map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'inspection-owner-dispute',
            resource_type: 'auto',
            transformation: [
              { width: 1200, height: 1200, crop: 'limit' },
              { quality: 'auto:good' }
            ]
          });
          return result.secure_url;
        });

        disputeEvidenceUrls = await Promise.all(uploadPromises);
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        return ResponseHelper.error(res, 'Failed to upload dispute evidence photos', 500);
      }
    }

    // Parse request body
    const accepted = req.body.accepted === 'true' || req.body.accepted === true;
    const disputeRaised = req.body.disputeRaised === 'true' || req.body.disputeRaised === true;
    const disputeType = req.body.disputeType || 'other';
    const disputeReason = req.body.disputeReason || '';
    const disputeEvidence = req.body.disputeEvidence || ''; // Additional evidence/notes
    const confirmedAt = req.body.confirmedAt ? new Date(req.body.confirmedAt) : new Date();

    // Validate that either accepted or disputeRaised is true
    if (!accepted && !disputeRaised) {
      return ResponseHelper.error(res, 'Either accepted or disputeRaised must be true', 400);
    }

    // If dispute is raised, require dispute reason and type
    if (disputeRaised) {
      if (!disputeReason.trim()) {
        return ResponseHelper.error(res, 'Dispute reason is required when raising a dispute', 400);
      }
      if (!disputeType) {
        return ResponseHelper.error(res, 'Dispute type is required when raising a dispute', 400);
      }
    }

    const reviewData = {
      accepted,
      disputeRaised,
      disputeType: disputeRaised ? disputeType : undefined,
      disputeReason: disputeRaised ? disputeReason : undefined,
      disputeEvidence: disputeRaised && disputeEvidenceUrls.length > 0 ? disputeEvidenceUrls : undefined,
      disputeEvidenceNotes: disputeRaised ? disputeEvidence : undefined, // Additional notes
      confirmedAt
    };

    console.log('[ProductInspectionController] Submit owner post-review payload:', {
      inspectionId: id,
      accepted,
      disputeRaised,
      hasDisputeReason: !!disputeReason,
      disputeEvidenceCount: disputeEvidenceUrls.length
    });

    const result = await ProductInspectionService.submitOwnerPostReview(id, reviewData);

    if (!result.success) {
      // Check if it's a migration error (should be 500) or validation error (400)
      const isMigrationError = result.error?.includes('Database migration required');
      const statusCode = isMigrationError ? 500 : 400;
      console.error('[ProductInspectionController] Submit owner post-review failed:', {
        inspectionId: id,
        error: result.error,
        statusCode
      });
      return ResponseHelper.error(res, result.error || 'Failed to submit owner post-review', statusCode);
    }

    this.logAction('SUBMIT_OWNER_POST_REVIEW', userId, id, { 
      accepted, 
      disputeRaised,
      disputeEvidenceCount: disputeEvidenceUrls.length 
    });

    return ResponseHelper.success(res, 'Owner post-review submitted successfully', result.data);
  });
}

export default new ProductInspectionController();
