import { ProductInspectionRepository } from '@/repositories/ProductInspectionRepository';
import { InspectionItemRepository } from '@/repositories/InspectionItemRepository';
import { InspectionPhotoRepository } from '@/repositories/InspectionPhotoRepository';
import { InspectionDisputeRepository } from '@/repositories/InspectionDisputeRepository';
import UserRepository from '@/repositories/UserRepository';
import BookingServiceInstance from '@/services/BookingService';
import { NotificationService } from '@/services/notification.service';
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
  private notificationService: NotificationService;

  constructor() {
    this.inspectionRepo = new ProductInspectionRepository();
    this.itemRepo = new InspectionItemRepository();
    this.photoRepo = new InspectionPhotoRepository();
    this.disputeRepo = new InspectionDisputeRepository();
    this.userRepo = UserRepository;
    this.bookingService = BookingServiceInstance;
    this.notificationService = new NotificationService();
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

      // Validate inspection timing
      const validation = this.validateInspectionTiming(data, booking.data);
      if (!validation.isValid) {
        console.debug('[CreateInspection] Timing validation failed:', validation.errors);
      }
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      // Create inspection (map renter/owner from booking snake_case fields)
      const inspection = await this.inspectionRepo.create({
        ...data,
        renterId: (booking.data as any).renter_id,
        ownerId: (booking.data as any).owner_id,
        status: InspectionStatus.PENDING
      });

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
      return inspections;
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
      const item = await this.itemRepo.update(itemId, updates);
      return item;
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

    if (data.inspectionType === InspectionType.PRE_RENTAL) {
      if (data.scheduledAt < now) {
        errors.push('Pre-rental inspection cannot be scheduled in the past');
      }
      if (data.scheduledAt > booking.startDate) {
        errors.push('Pre-rental inspection must be before rental start date');
      }
    } else if (data.inspectionType === InspectionType.POST_RETURN) {
      if (data.scheduledAt < booking.endDate) {
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
      const recipients = [inspection.renterId, inspection.ownerId, inspection.inspectorId];
      
      const message = this.getNotificationMessage(type, inspection);
      
      await this.notificationService.sendNotification({
        type,
        inspectionId: inspection.id,
        productId: inspection.productId,
        bookingId: inspection.bookingId,
        recipients,
        message,
        data: { inspection }
      });
    } catch (error) {
      console.error('[ProductInspectionService] Send notification error:', error);
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
      if (!inspections.success) {
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
}

export default new ProductInspectionService();
