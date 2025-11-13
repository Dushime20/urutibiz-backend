import { ProductInspectionRepository } from '@/repositories/ProductInspectionRepository';
import { InspectionItemRepository } from '@/repositories/InspectionItemRepository';
import { InspectionPhotoRepository } from '@/repositories/InspectionPhotoRepository';
import { InspectionDisputeRepository } from '@/repositories/InspectionDisputeRepository';
import UserRepository from '@/repositories/UserRepository';
import BookingServiceInstance from '@/services/BookingService';
import { NotificationEngine } from '@/services/notification/NotificationEngine';
import { NotificationType } from '@/services/notification/types';
import { 
  ProductInspection, 
  InspectionItem, 
  InspectionPhoto, 
  InspectionDispute,
  CreateInspectionRequest,
  UpdateInspectionRequest,
  CreateInspectionItemRequest,
  CreateDisputeRequest,
  ResolveDisputeRequest,
  InspectionFilters,
  InspectionSummary,
  DamageAssessment,
  InspectionReport,
  InspectionType,
  InspectionStatus,
  ItemCondition
} from '@/types/productInspection.types';
import { ServiceResponse } from '@/types';
import { getDatabase } from '@/config/database';

export class ProductInspectionService {
  private inspectionRepo: ProductInspectionRepository;
  private itemRepo: InspectionItemRepository;
  private photoRepo: InspectionPhotoRepository;
  private disputeRepo: InspectionDisputeRepository;
  private userRepo: any;
  private bookingService: any;
  private notificationEngine: NotificationEngine;

  constructor() {
    this.inspectionRepo = new ProductInspectionRepository();
    this.itemRepo = new InspectionItemRepository();
    this.photoRepo = new InspectionPhotoRepository();
    this.disputeRepo = new InspectionDisputeRepository();
    this.userRepo = UserRepository;
    this.bookingService = BookingServiceInstance;
    this.notificationEngine = new NotificationEngine();
  }

  // =====================================================
  // INSPECTORS LISTING (for frontend selection)
  // =====================================================
  public async getInspectors(params: {
    role?: string;
    search?: string;
    take?: number;
    skip?: number;
  }): Promise<ServiceResponse<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
    specializations?: string[];
  }>>> {
    try {
      const role = (params.role || 'inspector').toLowerCase();
      const take = Number.isFinite(params.take as any) ? Math.max(0, Math.min(Number(params.take), 200)) : 50;
      const skip = Number.isFinite(params.skip as any) ? Math.max(0, Number(params.skip)) : 0;

      const db = getDatabase();

      let query = db('users')
        .select(
          'id',
          db.raw("COALESCE(NULLIF(TRIM(first_name || ' ' || last_name), ''), email) as name"),
          'email',
          'role',
          db.raw('created_at as "createdAt"'),
          db.raw('NULL::text[] as specializations')
        )
        .where('role', role)
        .orderBy('created_at', 'desc')
        .limit(take)
        .offset(skip);

      if (params.search && params.search.trim().length > 0) {
        const term = `%${params.search.trim()}%`;
        query = query.andWhere((qb: any) => {
          qb.whereILike('first_name', term)
            .orWhereILike('last_name', term)
            .orWhereILike('email', term);
        });
      }

      const rows = await query;

      const mapped = rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        role: r.role,
        createdAt: r.createdAt,
        specializations: Array.isArray(r.specializations) ? r.specializations : undefined,
      }));

      return { success: true, data: mapped };
    } catch (error) {
      console.error('[ProductInspectionService] Get inspectors error:', error);
      return { success: false, error: 'Failed to fetch inspectors' };
    }
  }

  /**
   * Get all disputes (admin only)
   */
  async getAllDisputes(filters: {
    status?: string;
    inspectionId?: string;
    disputeType?: string;
    page?: number;
    limit?: number;
  }): Promise<ServiceResponse<any>> {
    try {
      const { status, inspectionId, disputeType, page = 1, limit = 20 } = filters;
      
      // Build query filters (no user filtering for admins)
      const queryFilters: any = {};
      if (status) queryFilters.status = status;
      if (inspectionId) queryFilters.inspectionId = inspectionId;
      if (disputeType) queryFilters.disputeType = disputeType;

      const result = await this.disputeRepo.findPaginated(
        queryFilters,
        page,
        limit,
        'createdAt',
        'desc'
      );

      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to fetch disputes' };
      }

      // Get inspection and user details for each dispute
      const disputesWithDetails = await Promise.all(
        result.data.data.map(async (dispute: any) => {
          try {
            // Get inspection details
            const inspection = await this.inspectionRepo.getById(dispute.inspectionId);
            const inspectionDetails = inspection.success && inspection.data ? {
              id: inspection.data.id,
              productId: inspection.data.productId,
              inspectionType: inspection.data.inspectionType,
              status: inspection.data.status,
              scheduledAt: inspection.data.scheduledAt
            } : null;

            // Get user details for the person who raised the dispute
            const user = await this.userRepo.getById(dispute.raisedBy);
            const userDetails = user.success && user.data ? {
              id: user.data.id,
              name: `${user.data.firstName} ${user.data.lastName}`,
              email: user.data.email,
              role: user.data.role
            } : null;

            return {
              ...dispute,
              inspection: inspectionDetails,
              raisedByUser: userDetails
            };
          } catch (error) {
            console.error(`[ProductInspectionService] Error fetching details for dispute ${dispute.id}:`, error);
            return dispute;
          }
        })
      );

      return {
        success: true,
        data: {
          disputes: disputesWithDetails,
          pagination: {
            page: result.data.page,
            limit: result.data.limit,
            total: result.data.total,
            totalPages: result.data.totalPages
          }
        }
      };
    } catch (error) {
      console.error('[ProductInspectionService] Get all disputes error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Get disputes raised by a specific user
   */
  async getMyDisputes(userId: string, filters: {
    status?: string;
    inspectionId?: string;
    disputeType?: string;
    page?: number;
    limit?: number;
  }): Promise<ServiceResponse<any>> {
    try {
      const { status, inspectionId, disputeType, page = 1, limit = 20 } = filters;
      
      // Build query filters
      const queryFilters: any = { raisedBy: userId };
      if (status) queryFilters.status = status;
      if (inspectionId) queryFilters.inspectionId = inspectionId;
      if (disputeType) queryFilters.disputeType = disputeType;

      const result = await this.disputeRepo.findPaginated(
        queryFilters,
        page,
        limit,
        'createdAt',
        'desc'
      );

      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to fetch disputes' };
      }

      // Get inspection details for each dispute
      const disputesWithDetails = await Promise.all(
        result.data.data.map(async (dispute: any) => {
          try {
            const inspection = await this.inspectionRepo.getById(dispute.inspectionId);
            if (inspection.success && inspection.data) {
              return {
                ...dispute,
                inspection: {
                  id: inspection.data.id,
                  productId: inspection.data.productId,
                  inspectionType: inspection.data.inspectionType,
                  status: inspection.data.status,
                  scheduledAt: inspection.data.scheduledAt
                }
              };
            }
            return dispute;
          } catch (error) {
            console.error(`[ProductInspectionService] Error fetching inspection for dispute ${dispute.id}:`, error);
            return dispute;
          }
        })
      );

      return {
        success: true,
        data: {
          disputes: disputesWithDetails,
          pagination: {
            page: result.data.page,
            limit: result.data.limit,
            total: result.data.total,
            totalPages: result.data.totalPages
          }
        }
      };
    } catch (error) {
      console.error('[ProductInspectionService] Get my disputes error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Get all disputes for a specific inspection
   */
  async getInspectionDisputes(inspectionId: string): Promise<ServiceResponse<any>> {
    try {
      const result = await this.disputeRepo.getByInspectionId(inspectionId);
      
      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to fetch inspection disputes' };
      }

      // Get user details for each dispute
      const disputesWithUserDetails = await Promise.all(
        result.data.map(async (dispute: any) => {
          try {
            const user = await this.userRepo.getById(dispute.raisedBy);
            if (user.success && user.data) {
              return {
                ...dispute,
                raisedByUser: {
                  id: user.data.id,
                  name: `${user.data.firstName} ${user.data.lastName}`,
                  email: user.data.email,
                  role: user.data.role
                }
              };
            }
            return dispute;
          } catch (error) {
            console.error(`[ProductInspectionService] Error fetching user for dispute ${dispute.id}:`, error);
            return dispute;
          }
        })
      );

      return {
        success: true,
        data: disputesWithUserDetails
      };
    } catch (error) {
      console.error('[ProductInspectionService] Get inspection disputes error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // =====================================================
  // INSPECTION MANAGEMENT
  // =====================================================

  /**
   * Create a new inspection (pre-rental or post-return)
   */
  async createInspection(data: CreateInspectionRequest): Promise<ServiceResponse<ProductInspection>> {
    try {
      console.debug('[CreateInspection] Incoming payload:', {
        productId: data?.productId,
        bookingId: data?.bookingId,
        inspectorId: data?.inspectorId,
        inspectionType: data?.inspectionType,
        scheduledAt: data?.scheduledAt
      });
      // Validate booking exists and is in correct state
      const booking = await this.bookingService.getById(data.bookingId);
      console.debug('[CreateInspection] Booking lookup result:', {
        success: booking?.success,
        hasData: !!booking?.data,
        error: booking?.error
      });
      if (!booking.success) {
        return { success: false, error: 'Booking not found' };
      }

      // Validate inspection timing (only if scheduledAt is provided)
      if (data.scheduledAt) {
        const validation = this.validateInspectionTiming(data, booking.data);
        if (!validation.isValid) {
          console.debug('[CreateInspection] Timing validation failed:', validation.errors);
          return { success: false, error: validation.errors.join(', ') };
        }
      }

      // Extract owner pre-inspection data if provided (from combined form)
      const ownerPreInspectionData = (data as any).ownerPreInspectionData;
      
      // Prepare inspection data
      const inspectionData: any = {
        ...data,
        renterId: (booking.data as any).renter_id,
        ownerId: (booking.data as any).owner_id,
        status: InspectionStatus.PENDING,
      };

      // Only include workflow fields if owner pre-inspection data is provided
      // This avoids errors if the migration hasn't been run yet
      if (ownerPreInspectionData) {
        inspectionData.ownerPreInspectionData = ownerPreInspectionData;
        inspectionData.ownerPreInspectionConfirmed = true;
        inspectionData.ownerPreInspectionConfirmedAt = new Date();
      }
      
      // Create inspection (map renter/owner from booking snake_case fields)
      const inspection = await this.inspectionRepo.create(inspectionData);

      if (!inspection.success) {
        console.error('[CreateInspection] Repo create failed:', inspection.error);
        return { success: false, error: inspection.error || 'Failed to create inspection' };
      }

      // Send notifications
      if (inspection.data) {
        await this.sendInspectionNotifications('scheduled', inspection.data);
      }

      return { success: true, data: inspection.data };
    } catch (error) {
      console.error('[ProductInspectionService] Create inspection error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Start an inspection
   */
  async startInspection(inspectionId: string, userId: string, allowAdminOverride: boolean = false): Promise<ServiceResponse<ProductInspection>> {
    try {
      const inspection = await this.inspectionRepo.getById(inspectionId);
      if (!inspection.success || !inspection.data) {
        return { success: false, error: 'Inspection not found' };
      }

      if (inspection.data.status !== InspectionStatus.PENDING) {
        return { success: false, error: 'Inspection cannot be started' };
      }

      if (!allowAdminOverride && inspection.data.inspectorId !== userId) {
        return { success: false, error: 'Not authorized to start this inspection' };
      }

      const updated = await this.inspectionRepo.update(inspectionId, {
        status: InspectionStatus.IN_PROGRESS,
        startedAt: new Date()
      });

      if (!updated.success || !updated.data) {
        return { success: false, error: 'Failed to start inspection' };
      }

      // Send notifications
      await this.sendInspectionNotifications('started', updated.data);

      return { success: true, data: updated.data };
    } catch (error) {
      console.error('[ProductInspectionService] Start inspection error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Complete an inspection
   */
  async completeInspection(
    inspectionId: string,
    userId: string,
    items: CreateInspectionItemRequest[],
    inspectionData?: {
      inspectorNotes?: string;
      generalNotes?: string;
      ownerNotes?: string;
      renterNotes?: string;
      inspectionLocation?: string;
    },
    allowAdminOverride: boolean = false
  ): Promise<ServiceResponse<InspectionReport>> {
    try {
      const inspection = await this.inspectionRepo.getById(inspectionId);
      if (!inspection.success || !inspection.data) {
        return { success: false, error: 'Inspection not found' };
      }

      if (inspection.data.status !== InspectionStatus.IN_PROGRESS) {
        return { success: false, error: 'Inspection is not in progress' };
      }

      if (!allowAdminOverride && inspection.data.inspectorId !== userId) {
        return { success: false, error: 'Not authorized to complete this inspection' };
      }

      // Create inspection items
      const createdItems: InspectionItem[] = [];
      for (const itemData of items) {
        const item = await this.itemRepo.create({
          ...itemData,
          inspectionId
        });
        if (item.success && item.data) {
          createdItems.push(item.data);
        }
      }

      // Update inspection status and additional data
      const updateData: any = {
        status: InspectionStatus.COMPLETED,
        completedAt: new Date()
      };

      // Add inspection notes and location if provided
      if (inspectionData) {
        if (inspectionData.inspectorNotes) updateData.inspectorNotes = inspectionData.inspectorNotes;
        if (inspectionData.generalNotes) updateData.generalNotes = inspectionData.generalNotes;
        if (inspectionData.ownerNotes) updateData.ownerNotes = inspectionData.ownerNotes;
        if (inspectionData.renterNotes) updateData.renterNotes = inspectionData.renterNotes;
        if (inspectionData.inspectionLocation) updateData.inspectionLocation = inspectionData.inspectionLocation;
      }

      const updated = await this.inspectionRepo.update(inspectionId, updateData);

      if (!updated.success || !updated.data) {
        return { success: false, error: 'Failed to complete inspection' };
      }

      // Generate report
      const report = await this.generateInspectionReport(updated.data);

      // Send notifications
      await this.sendInspectionNotifications('completed', updated.data);

      return { success: true, data: report };
    } catch (error) {
      console.error('[ProductInspectionService] Complete inspection error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Get inspection by ID with full details
   */
  async getInspectionById(inspectionId: string): Promise<ServiceResponse<InspectionReport>> {
    try {
      const inspection = await this.inspectionRepo.getById(inspectionId);
      if (!inspection.success || !inspection.data) {
        return { success: false, error: 'Inspection not found' };
      }

      const report = await this.generateInspectionReport(inspection.data);
      return { success: true, data: report };
    } catch (error) {
      console.error('[ProductInspectionService] Get inspection error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Get inspections with filters
   */
  async getInspections(filters: InspectionFilters, page = 1, limit = 20): Promise<ServiceResponse<any>> {
    try {
      const inspections = await this.inspectionRepo.getPaginated(filters, page, limit);
      
      if (!inspections.success || !inspections.data) {
        return inspections;
      }

      // Fetch booking data for each inspection and include it in the response
      const inspectionsWithBookings = await Promise.all(
        inspections.data.data.map(async (inspection: any) => {
          const bookingId = inspection.bookingId || inspection.booking_id;
          if (bookingId) {
            try {
              const booking = await this.bookingService.getById(bookingId);
              if (booking.success && booking.data) {
                return {
                  ...inspection,
                  booking: {
                    id: booking.data.id,
                    booking_number: (booking.data as any).booking_number,
                    status: (booking.data as any).status,
                    start_date: (booking.data as any).start_date,
                    end_date: (booking.data as any).end_date,
                    rental_start_date: (booking.data as any).rental_start_date,
                    rental_end_date: (booking.data as any).rental_end_date,
                    renter_id: (booking.data as any).renter_id,
                    owner_id: (booking.data as any).owner_id,
                    product_id: (booking.data as any).product_id
                  }
                };
              }
            } catch (error) {
              console.error(`[ProductInspectionService] Error fetching booking ${bookingId} for inspection ${inspection.id}:`, error);
            }
          }
          return inspection;
        })
      );

      return {
        success: true,
        data: {
          ...inspections.data,
          data: inspectionsWithBookings
        }
      };
    } catch (error) {
      console.error('[ProductInspectionService] Get inspections error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Update inspection
   */
  async updateInspection(inspectionId: string, updateData: UpdateInspectionRequest): Promise<ServiceResponse<ProductInspection>> {
    try {
      const inspection = await this.inspectionRepo.getById(inspectionId);
      if (!inspection.success || !inspection.data) {
        return { success: false, error: 'Inspection not found' };
      }

      const updated = await this.inspectionRepo.update(inspectionId, updateData);
      if (!updated.success || !updated.data) {
        return { success: false, error: 'Failed to update inspection' };
      }

      return { success: true, data: updated.data };
    } catch (error) {
      console.error('[ProductInspectionService] Update inspection error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // =====================================================
  // INSPECTION ITEMS MANAGEMENT
  // =====================================================

  /**
   * Add item to inspection
   */
  async addInspectionItem(
    inspectionId: string, 
    itemData: CreateInspectionItemRequest
  ): Promise<ServiceResponse<InspectionItem>> {
    try {
      const inspection = await this.inspectionRepo.getById(inspectionId);
      if (!inspection.success || !inspection.data) {
        return { success: false, error: 'Inspection not found' };
      }

      if (inspection.data.status === InspectionStatus.COMPLETED) {
        return { success: false, error: 'Cannot add items to completed inspection' };
      }

      const item = await this.itemRepo.create({
        ...itemData,
        inspectionId
      });

      return item;
    } catch (error) {
      console.error('[ProductInspectionService] Add item error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Update inspection item
   */
  async updateInspectionItem(
    itemId: string, 
    updates: Partial<InspectionItem>
  ): Promise<ServiceResponse<InspectionItem>> {
    try {
      const item = await this.itemRepo.updateById(itemId, updates);
      if (!item.success || !item.data) {
        return { success: false, error: item.error || 'Failed to update inspection item' };
      }
      return { success: true, data: item.data };
    } catch (error) {
      console.error('[ProductInspectionService] Update item error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // =====================================================
  // DISPUTE MANAGEMENT
  // =====================================================

  /**
   * Raise a dispute for an inspection
   */
  async raiseDispute(
    inspectionId: string, 
    userId: string, 
    disputeData: CreateDisputeRequest
  ): Promise<ServiceResponse<InspectionDispute>> {
    try {
      const inspection = await this.inspectionRepo.getById(inspectionId);
      if (!inspection.success || !inspection.data) {
        return { success: false, error: 'Inspection not found' };
      }

      // Validate user can raise dispute
      if (!this.canRaiseDispute(inspection.data, userId)) {
        return { success: false, error: 'Not authorized to raise dispute' };
      }

      // Create dispute
      const dispute = await this.disputeRepo.create({
        ...disputeData,
        inspectionId,
        raisedBy: userId,
        status: 'open' as any
      });

      if (!dispute.success) {
        return { success: false, error: 'Failed to create dispute' };
      }

      // Update inspection status
      await this.inspectionRepo.update(inspectionId, {
        status: InspectionStatus.DISPUTED,
        hasDispute: true,
        disputeReason: disputeData.reason
      });

      // Send notifications
      await this.sendInspectionNotifications('disputed', inspection.data);

      return dispute;
    } catch (error) {
      console.error('[ProductInspectionService] Raise dispute error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Resolve a dispute
   */
  async resolveDispute(
    disputeId: string, 
    resolverId: string, 
    resolutionData: ResolveDisputeRequest
  ): Promise<ServiceResponse<InspectionDispute>> {
    try {
      const dispute = await this.disputeRepo.getById(disputeId);
      if (!dispute.success || !dispute.data) {
        return { success: false, error: 'Dispute not found' };
      }

      // Update dispute
      const updated = await this.disputeRepo.update(disputeId, {
        ...resolutionData,
        status: 'resolved' as any,
        resolvedBy: resolverId,
        resolvedAt: new Date()
      });

      if (!updated.success) {
        return { success: false, error: 'Failed to resolve dispute' };
      }

      // Update inspection status
      await this.inspectionRepo.update(dispute.data.inspectionId, {
        status: InspectionStatus.RESOLVED,
        disputeResolvedAt: new Date(),
        resolvedBy: resolverId
      });

      // Send notifications
      const inspection = await this.inspectionRepo.getById(dispute.data.inspectionId);
      if (inspection.success && inspection.data) {
        await this.sendInspectionNotifications('resolved', inspection.data);
      }

      return updated;
    } catch (error) {
      console.error('[ProductInspectionService] Resolve dispute error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // =====================================================
  // BUSINESS LOGIC METHODS
  // =====================================================

  /**
   * Generate comprehensive inspection report
   */
  private async generateInspectionReport(inspection: ProductInspection): Promise<InspectionReport> {
    const items = await this.itemRepo.getByInspectionId(inspection.id);
    const photos = await this.photoRepo.getByInspectionId(inspection.id);
    const disputes = await this.disputeRepo.getByInspectionId(inspection.id);

    const damageAssessment = this.calculateDamageAssessment(items.data || []);

    const timeline = {
      scheduled: inspection.scheduledAt,
      started: inspection.startedAt,
      completed: inspection.completedAt,
      duration: inspection.startedAt && inspection.completedAt 
        ? inspection.completedAt.getTime() - inspection.startedAt.getTime()
        : undefined
    };

    // Populate participants from user IDs to ensure availability even on completed inspections
    let inspectorUser: any = null;
    let renterUser: any = null;
    let ownerUser: any = null;
    try {
      if (inspection.inspectorId) {
        const res = await this.userRepo.findById(inspection.inspectorId);
        if (res?.success && res.data) {
          inspectorUser = {
            id: res.data.id,
            name: `${res.data.firstName ?? ''} ${res.data.lastName ?? ''}`.trim() || res.data.email,
            email: res.data.email,
            role: res.data.role,
          };
        }
      }
      if (inspection.renterId) {
        const res = await this.userRepo.findById(inspection.renterId);
        if (res?.success && res.data) {
          renterUser = {
            id: res.data.id,
            name: `${res.data.firstName ?? ''} ${res.data.lastName ?? ''}`.trim() || res.data.email,
            email: res.data.email,
            role: res.data.role,
          };
        }
      }
      if (inspection.ownerId) {
        const res = await this.userRepo.findById(inspection.ownerId);
        if (res?.success && res.data) {
          ownerUser = {
            id: res.data.id,
            name: `${res.data.firstName ?? ''} ${res.data.lastName ?? ''}`.trim() || res.data.email,
            email: res.data.email,
            role: res.data.role,
          };
        }
      }
    } catch (e) {
      console.error('[ProductInspectionService] Failed to populate participants:', e);
    }

    const participants = {
      inspector: inspectorUser,
      renter: renterUser,
      owner: ownerUser,
    };

    return {
      inspection,
      items: items.data || [],
      photos: photos.data || [],
      damageAssessment,
      timeline,
      participants
    };
  }

  /**
   * Calculate damage assessment from inspection items
   */
  private calculateDamageAssessment(items: InspectionItem[]): DamageAssessment {
    const totalRepairCost = items.reduce((sum, item) => sum + item.repairCost, 0);
    const totalReplacementCost = items.reduce((sum, item) => sum + item.replacementCost, 0);
    const itemsRequiringRepair = items.filter(item => item.requiresRepair).length;
    const itemsRequiringReplacement = items.filter(item => item.requiresReplacement).length;

    return {
      totalRepairCost,
      totalReplacementCost,
      itemsRequiringRepair,
      itemsRequiringReplacement,
      damageDetails: items.filter(item => item.condition === ItemCondition.DAMAGED)
    };
  }

  /**
   * Validate inspection timing based on booking
   */
  private validateInspectionTiming(data: CreateInspectionRequest, booking: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const now = new Date();
    
    // Ensure scheduledAt is a Date object
    let scheduledAt: Date;
    try {
      scheduledAt = data.scheduledAt instanceof Date 
        ? data.scheduledAt 
        : new Date(data.scheduledAt);
      
      // Validate that scheduledAt is a valid date
      if (isNaN(scheduledAt.getTime())) {
        errors.push('Invalid scheduled date format');
        return { isValid: false, errors };
      }
    } catch (error) {
      errors.push('Invalid scheduled date format');
      return { isValid: false, errors };
    }
    
    // Handle both camelCase and snake_case booking fields
    const bookingStartDateRaw = booking.startDate || booking.start_date;
    const bookingEndDateRaw = booking.endDate || booking.end_date;
    
    // Convert booking dates to Date objects if they exist
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    
    if (bookingStartDateRaw) {
      try {
        startDate = bookingStartDateRaw instanceof Date 
          ? bookingStartDateRaw 
          : new Date(bookingStartDateRaw);
        
        // Validate that startDate is a valid date
        if (isNaN(startDate.getTime())) {
          startDate = null; // Invalid date, ignore it
        }
      } catch (error) {
        // Invalid date format, ignore it
        startDate = null;
      }
    }
    
    if (bookingEndDateRaw) {
      try {
        endDate = bookingEndDateRaw instanceof Date 
          ? bookingEndDateRaw 
          : new Date(bookingEndDateRaw);
        
        // Validate that endDate is a valid date
        if (isNaN(endDate.getTime())) {
          endDate = null; // Invalid date, ignore it
        }
      } catch (error) {
        // Invalid date format, ignore it
        endDate = null;
      }
    }

    if (data.inspectionType === InspectionType.PRE_RENTAL) {
      if (scheduledAt < now) {
        errors.push('Pre-rental inspection cannot be scheduled in the past');
      }
      if (startDate && scheduledAt > startDate) {
        errors.push('Pre-rental inspection must be before rental start date');
      }
    } else if (data.inspectionType === InspectionType.POST_RETURN) {
      if (endDate && scheduledAt < endDate) {
        errors.push('Post-return inspection cannot be scheduled before rental end date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if user can raise dispute
   */
  private canRaiseDispute(inspection: ProductInspection, userId: string): boolean {
    return inspection.renterId === userId || 
           inspection.ownerId === userId || 
           inspection.inspectorId === userId;
  }

  /**
   * Send inspection notifications
   */
  private async sendInspectionNotifications(
    type: 'scheduled' | 'started' | 'completed' | 'disputed' | 'resolved',
    inspection: ProductInspection
  ) {
    try {
      // Map inspection notification type to NotificationType enum
      const notificationTypeMap: Record<string, NotificationType> = {
        'scheduled': NotificationType.INSPECTION_SCHEDULED,
        'started': NotificationType.INSPECTION_STARTED,
        'completed': NotificationType.INSPECTION_COMPLETED,
        'disputed': NotificationType.DISPUTE_RAISED,
        'resolved': NotificationType.DISPUTE_RESOLVED
      };

      const notificationType = notificationTypeMap[type] || NotificationType.INSPECTION_SCHEDULED;
      const message = this.getNotificationMessage(type, inspection);
      const title = this.getNotificationTitle(type, inspection);
      
      // Get recipients (filter out null/undefined values)
      const recipients = [
        inspection.renterId,
        inspection.ownerId,
        inspection.inspectorId
      ].filter((id): id is string => id !== null && id !== undefined);
      
      // Send notification to each recipient individually
      const notificationPromises = recipients.map(async (recipientId) => {
        try {
          await this.notificationEngine.sendNotification({
            type: notificationType,
            recipientId,
            title,
            message,
            data: {
              inspectionId: inspection.id,
              productId: inspection.productId,
              bookingId: inspection.bookingId,
              inspection
            }
          });
        } catch (error) {
          console.error(`[ProductInspectionService] Failed to send notification to ${recipientId}:`, error);
        }
      });

      await Promise.allSettled(notificationPromises);
    } catch (error) {
      console.error('[ProductInspectionService] Send notification error:', error);
    }
  }

  /**
   * Get notification title based on type
   */
  private getNotificationTitle(type: string, inspection: ProductInspection): string {
    const typeText = inspection.inspectionType === InspectionType.PRE_RENTAL ? 'Pre-rental' : 'Post-return';
    
    switch (type) {
      case 'scheduled':
        return `${typeText} Inspection Scheduled`;
      case 'started':
        return `${typeText} Inspection Started`;
      case 'completed':
        return `${typeText} Inspection Completed`;
      case 'disputed':
        return `Dispute Raised for ${typeText} Inspection`;
      case 'resolved':
        return `Dispute Resolved for ${typeText} Inspection`;
      default:
        return `Inspection Update`;
    }
  }

  /**
   * Get notification message based on type
   */
  private getNotificationMessage(type: string, inspection: ProductInspection): string {
    const typeText = inspection.inspectionType === InspectionType.PRE_RENTAL ? 'Pre-rental' : 'Post-return';
    
    switch (type) {
      case 'scheduled':
        return `${typeText} inspection scheduled for ${inspection.product?.title || 'product'}`;
      case 'started':
        return `${typeText} inspection has started for ${inspection.product?.title || 'product'}`;
      case 'completed':
        return `${typeText} inspection completed for ${inspection.product?.title || 'product'}`;
      case 'disputed':
        return `Dispute raised for ${typeText.toLowerCase()} inspection of ${inspection.product?.title || 'product'}`;
      case 'resolved':
        return `Dispute resolved for ${typeText.toLowerCase()} inspection of ${inspection.product?.title || 'product'}`;
      default:
        return `Inspection update for ${inspection.product?.title || 'product'}`;
    }
  }

  /**
   * Get inspection summary statistics
   */
  async getInspectionSummary(filters?: InspectionFilters): Promise<ServiceResponse<InspectionSummary>> {
    try {
      const inspections = await this.inspectionRepo.getAll(filters);
      if (!inspections.success || !inspections.data) {
        return { success: false, error: 'Failed to fetch inspections' };
      }

      const data = inspections.data;
      const totalInspections = data.length;
      const completedInspections = data.filter(i => i.status === InspectionStatus.COMPLETED).length;
      const pendingInspections = data.filter(i => i.status === InspectionStatus.PENDING).length;
      const disputedInspections = data.filter(i => i.status === InspectionStatus.DISPUTED).length;

      // Calculate total damage cost
      let totalDamageCost = 0;
      for (const inspection of data) {
        if (inspection.status === InspectionStatus.COMPLETED) {
          const items = await this.itemRepo.getByInspectionId(inspection.id);
          if (items.success && items.data) {
            totalDamageCost += items.data.reduce((sum, item) => sum + item.repairCost + item.replacementCost, 0);
          }
        }
      }

      // Calculate average inspection time
      const completedWithTime = data.filter(i => 
        i.status === InspectionStatus.COMPLETED && i.startedAt && i.completedAt
      );
      const averageInspectionTime = completedWithTime.length > 0
        ? completedWithTime.reduce((sum, i) => 
            sum + (i.completedAt!.getTime() - i.startedAt!.getTime()), 0
          ) / completedWithTime.length
        : 0;

      return {
        success: true,
        data: {
          totalInspections,
          completedInspections,
          pendingInspections,
          disputedInspections,
          totalDamageCost,
          averageInspectionTime
        }
      };
    } catch (error) {
      console.error('[ProductInspectionService] Get summary error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // =====================================================
  // NEW WORKFLOW METHODS - OWNER PRE-INSPECTION
  // =====================================================

  /**
   * Owner submits pre-inspection data
   * POST /api/v1/inspections/:id/owner-pre-inspection
   */
  async submitOwnerPreInspection(inspectionId: string, data: {
    photos?: string[];
    condition?: any;
    notes?: string;
    location?: any;
    timestamp?: string;
  }): Promise<ServiceResponse<ProductInspection>> {
    try {
      const inspection = await this.inspectionRepo.getById(inspectionId);
      if (!inspection.success || !inspection.data) {
        return { success: false, error: 'Inspection not found' };
      }

      // Prepare owner pre-inspection data
      const ownerPreInspectionData = {
        photos: data.photos || [],
        condition: data.condition,
        notes: data.notes || '',
        location: data.location,
        timestamp: data.timestamp || new Date().toISOString(),
        confirmed: false
      };

      // Update inspection with owner pre-inspection data
      const updated = await this.inspectionRepo.update(inspectionId, {
        ownerPreInspectionData,
        ownerPreInspectionConfirmed: false
      });

      if (!updated.success) {
        return { success: false, error: updated.error || 'Failed to submit pre-inspection' };
      }

      // Send notifications
      if (updated.data) {
        await this.sendInspectionNotifications('scheduled', updated.data);
      }

      return { success: true, data: updated.data };
    } catch (error) {
      console.error('[ProductInspectionService] Submit owner pre-inspection error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Owner confirms pre-inspection
   * POST /api/v1/inspections/:id/owner-pre-inspection/confirm
   */
  async confirmOwnerPreInspection(inspectionId: string): Promise<ServiceResponse<ProductInspection>> {
    try {
      const inspection = await this.inspectionRepo.getById(inspectionId);
      if (!inspection.success || !inspection.data) {
        return { success: false, error: 'Inspection not found' };
      }

      if (!inspection.data.ownerPreInspectionData) {
        return { success: false, error: 'Pre-inspection data not found' };
      }

      // Update inspection to confirm pre-inspection
      const updated = await this.inspectionRepo.update(inspectionId, {
        ownerPreInspectionConfirmed: true,
        ownerPreInspectionConfirmedAt: new Date()
      });

      if (!updated.success) {
        return { success: false, error: updated.error || 'Failed to confirm pre-inspection' };
      }

      // Send notifications to renter
      if (updated.data) {
        await this.sendInspectionNotifications('scheduled', updated.data);
      }

      return { success: true, data: updated.data };
    } catch (error) {
      console.error('[ProductInspectionService] Confirm owner pre-inspection error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // =====================================================
  // NEW WORKFLOW METHODS - RENTER PRE-REVIEW
  // =====================================================

  /**
   * Renter reviews and accepts/rejects owner pre-inspection
   * POST /api/v1/inspections/:id/renter-pre-review
   */
  async submitRenterPreReview(inspectionId: string, data: {
    accepted: boolean;
    concerns?: string[];
    additionalRequests?: string[];
    timestamp?: string;
  }): Promise<ServiceResponse<ProductInspection>> {
    try {
      const inspection = await this.inspectionRepo.getById(inspectionId);
      if (!inspection.success || !inspection.data) {
        return { success: false, error: 'Inspection not found' };
      }

      // Check if owner has provided pre-inspection data (either confirmed or data exists)
      const hasOwnerPreInspection = inspection.data.ownerPreInspectionConfirmed || 
                                    inspection.data.ownerPreInspectionData;
      
      if (!hasOwnerPreInspection) {
        return { success: false, error: 'Owner pre-inspection not provided yet' };
      }

      // Update inspection with renter review
      const updateData: any = {
        renterPreReviewAccepted: data.accepted,
        renterPreReviewAcceptedAt: new Date()
      };

      // For pre-rental inspections, update status based on renter's response:
      // - If renter accepts: status becomes IN_PROGRESS (pre-inspection workflow complete, rental can proceed)
      // - If renter rejects: status remains PENDING (owner needs to address concerns)
      if (inspection.data.inspectionType === InspectionType.PRE_RENTAL) {
        if (data.accepted) {
          // Renter accepted - pre-inspection workflow is complete, rental can proceed
          // Only update status if it's still PENDING (don't override if already in progress or completed)
          if (inspection.data.status === InspectionStatus.PENDING) {
            updateData.status = InspectionStatus.IN_PROGRESS;
          }
        } else {
          // Renter rejected - status remains PENDING so owner can address concerns
          // Status stays PENDING until owner resolves the issues
        }
      }

      const updated = await this.inspectionRepo.update(inspectionId, updateData);

      if (!updated.success) {
        console.error('[ProductInspectionService] Update failed:', updated.error);
        return { success: false, error: updated.error || 'Failed to submit review' };
      }

      // Send notifications (don't fail if notification fails)
      if (updated.data) {
        try {
          await this.sendInspectionNotifications('scheduled', updated.data);
        } catch (notifError) {
          console.warn('[ProductInspectionService] Notification failed (non-critical):', notifError);
          // Continue even if notification fails
        }
      }

      return { success: true, data: updated.data };
    } catch (error) {
      console.error('[ProductInspectionService] Submit renter pre-review error:', error);
      console.error('[ProductInspectionService] Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        inspectionId
      });
      return { success: false, error: (error as Error).message || 'Internal server error' };
    }
  }

  /**
   * Renter reports discrepancy with owner pre-inspection
   * POST /api/v1/inspections/:id/renter-discrepancy
   */
  async reportRenterDiscrepancy(inspectionId: string, data: {
    issues: string[];
    notes: string;
    photos?: string[];
    timestamp?: string;
  }): Promise<ServiceResponse<ProductInspection>> {
    try {
      const inspection = await this.inspectionRepo.getById(inspectionId);
      if (!inspection.success || !inspection.data) {
        return { success: false, error: 'Inspection not found' };
      }

      // Prepare discrepancy data
      const discrepancyData = {
        inspectionId,
        issues: data.issues,
        photos: data.photos || [],
        notes: data.notes,
        timestamp: data.timestamp || new Date().toISOString()
      };

      // Update inspection with discrepancy report
      const updateData: any = {
        renterDiscrepancyReported: true,
        renterDiscrepancyData: discrepancyData
      };

      const updated = await this.inspectionRepo.update(inspectionId, updateData);

      if (!updated.success) {
        console.error('[ProductInspectionService] Update failed:', updated.error);
        return { success: false, error: updated.error || 'Failed to report discrepancy' };
      }

      // Send notifications (don't fail if notification fails)
      if (updated.data) {
        try {
          await this.sendInspectionNotifications('disputed', updated.data);
        } catch (notifError) {
          console.warn('[ProductInspectionService] Notification failed (non-critical):', notifError);
          // Continue even if notification fails
        }
      }

      return { success: true, data: updated.data };
    } catch (error) {
      console.error('[ProductInspectionService] Report renter discrepancy error:', error);
      console.error('[ProductInspectionService] Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        inspectionId
      });
      return { success: false, error: (error as Error).message || 'Internal server error' };
    }
  }

  // =====================================================
  // NEW WORKFLOW METHODS - RENTER POST-INSPECTION
  // =====================================================

  /**
   * Renter submits post-inspection data (after returning the product)
   * POST /api/v1/inspections/:id/renter-post-inspection
   */
  async submitRenterPostInspection(inspectionId: string, data: {
    returnPhotos: string[];
    condition: any;
    notes: string;
    returnLocation: any;
    timestamp?: string;
    confirmed?: boolean;
  }): Promise<ServiceResponse<ProductInspection>> {
    try {
      const inspection = await this.inspectionRepo.getById(inspectionId);
      if (!inspection.success || !inspection.data) {
        return { success: false, error: 'Inspection not found' };
      }

      // Prepare post-inspection data
      const postInspectionData = {
        inspectionId,
        returnPhotos: data.returnPhotos || [],
        condition: data.condition,
        notes: data.notes,
        returnLocation: data.returnLocation,
        timestamp: data.timestamp || new Date().toISOString(),
        confirmed: data.confirmed ?? false
      };

      // Update inspection with post-inspection data
      const updateData: any = {
        renterPostInspectionData: postInspectionData,
        renterPostInspectionConfirmed: data.confirmed ?? false,
        renterPostInspectionConfirmedAt: new Date()
      };

      const updated = await this.inspectionRepo.update(inspectionId, updateData);

      if (!updated.success) {
        console.error('[ProductInspectionService] Update failed:', updated.error);
        return { success: false, error: updated.error || 'Failed to submit post-inspection' };
      }

      // Send notifications (don't fail if notification fails)
      if (updated.data) {
        try {
          await this.sendInspectionNotifications('completed', updated.data);
        } catch (notifError) {
          console.warn('[ProductInspectionService] Notification failed (non-critical):', notifError);
          // Continue even if notification fails
        }
      }

      return { success: true, data: updated.data };
    } catch (error) {
      console.error('[ProductInspectionService] Submit renter post-inspection error:', error);
      console.error('[ProductInspectionService] Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        inspectionId
      });
      return { success: false, error: (error as Error).message || 'Internal server error' };
    }
  }

  /**
   * Renter confirms post-inspection
   * POST /api/v1/inspections/:id/renter-post-inspection/confirm
   */
  async confirmRenterPostInspection(inspectionId: string): Promise<ServiceResponse<ProductInspection>> {
    try {
      const inspection = await this.inspectionRepo.getById(inspectionId);
      if (!inspection.success || !inspection.data) {
        return { success: false, error: 'Inspection not found' };
      }

      if (!inspection.data.renterPostInspectionData) {
        return { success: false, error: 'Post-inspection data not submitted yet' };
      }

      // Update inspection with confirmation
      const updated = await this.inspectionRepo.update(inspectionId, {
        renterPostInspectionConfirmed: true,
        renterPostInspectionConfirmedAt: new Date()
      });

      if (!updated.success) {
        return { success: false, error: updated.error || 'Failed to confirm post-inspection' };
      }

      // Send notifications
      if (updated.data) {
        try {
          await this.sendInspectionNotifications('completed', updated.data);
        } catch (notifError) {
          console.warn('[ProductInspectionService] Notification failed (non-critical):', notifError);
        }
      }

      return { success: true, data: updated.data };
    } catch (error) {
      console.error('[ProductInspectionService] Confirm renter post-inspection error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // =====================================================
  // NEW WORKFLOW METHODS - OWNER POST-REVIEW
  // =====================================================

  /**
   * Owner reviews post-inspection (accept or dispute)
   * POST /api/v1/inspections/:id/owner-post-review
   */
  async submitOwnerPostReview(inspectionId: string, data: {
    accepted: boolean;
    disputeRaised?: boolean;
    disputeReason?: string;
    disputeEvidence?: string[];
    confirmedAt?: Date;
  }): Promise<ServiceResponse<ProductInspection>> {
    try {
      const inspection = await this.inspectionRepo.getById(inspectionId);
      if (!inspection.success || !inspection.data) {
        return { success: false, error: 'Inspection not found' };
      }

      // Validate that renter has submitted post-inspection
      if (!inspection.data.renterPostInspectionData) {
        return { success: false, error: 'Renter has not submitted post-inspection yet' };
      }

      if (!inspection.data.renterPostInspectionConfirmed) {
        return { success: false, error: 'Renter has not confirmed post-inspection yet' };
      }

      // Prepare update data
      const updateData: any = {
        ownerPostReviewAccepted: data.accepted && !data.disputeRaised,
        ownerPostReviewAcceptedAt: data.accepted && !data.disputeRaised ? (data.confirmedAt || new Date()) : undefined,
        ownerDisputeRaised: data.disputeRaised ?? false,
        ownerDisputeRaisedAt: data.disputeRaised ? new Date() : undefined
      };

      // If dispute is raised, we might want to create a dispute record
      if (data.disputeRaised) {
        // Optionally create a dispute record in the disputes table
        // For now, we'll just update the inspection fields
        // The dispute can be handled through the existing dispute system if needed
      }

      const updated = await this.inspectionRepo.update(inspectionId, updateData);

      if (!updated.success) {
        console.error('[ProductInspectionService] Update failed:', updated.error);
        return { success: false, error: updated.error || 'Failed to submit owner post-review' };
      }

      // Send notifications (don't fail if notification fails)
      if (updated.data) {
        try {
          if (data.accepted && !data.disputeRaised) {
            await this.sendInspectionNotifications('completed', updated.data);
          } else if (data.disputeRaised) {
            await this.sendInspectionNotifications('disputed', updated.data);
          }
        } catch (notifError) {
          console.warn('[ProductInspectionService] Notification failed (non-critical):', notifError);
          // Continue even if notification fails
        }
      }

      return { success: true, data: updated.data };
    } catch (error) {
      console.error('[ProductInspectionService] Submit owner post-review error:', error);
      console.error('[ProductInspectionService] Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        inspectionId
      });
      return { success: false, error: (error as Error).message || 'Internal server error' };
    }
  }
}

export default new ProductInspectionService();
