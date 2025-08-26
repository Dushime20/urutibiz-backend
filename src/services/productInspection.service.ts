import { ProductInspectionRepository } from '@/repositories/ProductInspectionRepository';
import { InspectionItemRepository } from '@/repositories/InspectionItemRepository';
import { InspectionPhotoRepository } from '@/repositories/InspectionPhotoRepository';
import { InspectionDisputeRepository } from '@/repositories/InspectionDisputeRepository';
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

export class ProductInspectionService {
  private inspectionRepo: ProductInspectionRepository;
  private itemRepo: InspectionItemRepository;
  private photoRepo: InspectionPhotoRepository;
  private disputeRepo: InspectionDisputeRepository;
  private bookingService: any;
  private notificationService: NotificationService;

  constructor() {
    this.inspectionRepo = new ProductInspectionRepository();
    this.itemRepo = new InspectionItemRepository();
    this.photoRepo = new InspectionPhotoRepository();
    this.disputeRepo = new InspectionDisputeRepository();
    this.bookingService = BookingServiceInstance;
    this.notificationService = new NotificationService();
  }

  // =====================================================
  // INSPECTION MANAGEMENT
  // =====================================================

  /**
   * Create a new inspection (pre-rental or post-return)
   */
  async createInspection(data: CreateInspectionRequest): Promise<ServiceResponse<ProductInspection>> {
    try {
      // Validate booking exists and is in correct state
      const booking = await this.bookingService.getById(data.bookingId);
      if (!booking.success) {
        return { success: false, error: 'Booking not found' };
      }

      // Validate inspection timing
      const validation = this.validateInspectionTiming(data, booking.data);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      // Create inspection
      const inspection = await this.inspectionRepo.create({
        ...data,
        renterId: booking.data.renterId,
        ownerId: booking.data.ownerId,
        status: InspectionStatus.PENDING
      });

      if (!inspection.success) {
        return { success: false, error: 'Failed to create inspection' };
      }

      // Send notifications
      await this.sendInspectionNotifications('scheduled', inspection.data);

      return { success: true, data: inspection.data };
    } catch (error) {
      console.error('[ProductInspectionService] Create inspection error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Start an inspection
   */
  async startInspection(inspectionId: string, inspectorId: string): Promise<ServiceResponse<ProductInspection>> {
    try {
      const inspection = await this.inspectionRepo.getById(inspectionId);
      if (!inspection.success) {
        return { success: false, error: 'Inspection not found' };
      }

      if (inspection.data.status !== InspectionStatus.PENDING) {
        return { success: false, error: 'Inspection cannot be started' };
      }

      if (inspection.data.inspectorId !== inspectorId) {
        return { success: false, error: 'Not authorized to start this inspection' };
      }

      const updated = await this.inspectionRepo.update(inspectionId, {
        status: InspectionStatus.IN_PROGRESS,
        startedAt: new Date()
      });

      if (!updated.success) {
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
    inspectorId: string,
    items: CreateInspectionItemRequest[]
  ): Promise<ServiceResponse<InspectionReport>> {
    try {
      const inspection = await this.inspectionRepo.getById(inspectionId);
      if (!inspection.success) {
        return { success: false, error: 'Inspection not found' };
      }

      if (inspection.data.status !== InspectionStatus.IN_PROGRESS) {
        return { success: false, error: 'Inspection is not in progress' };
      }

      if (inspection.data.inspectorId !== inspectorId) {
        return { success: false, error: 'Not authorized to complete this inspection' };
      }

      // Create inspection items
      const createdItems: InspectionItem[] = [];
      for (const itemData of items) {
        const item = await this.itemRepo.create({
          ...itemData,
          inspectionId
        });
        if (item.success) {
          createdItems.push(item.data);
        }
      }

      // Update inspection status
      const updated = await this.inspectionRepo.update(inspectionId, {
        status: InspectionStatus.COMPLETED,
        completedAt: new Date()
      });

      if (!updated.success) {
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
      if (!inspection.success) {
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
      if (!inspection.success) {
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
      if (!inspection.success) {
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
        status: 'open'
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
      if (!dispute.success) {
        return { success: false, error: 'Dispute not found' };
      }

      // Update dispute
      const updated = await this.disputeRepo.update(disputeId, {
        ...resolutionData,
        status: 'resolved',
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
      if (inspection.success) {
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

    const participants = {
      inspector: inspection.inspector,
      renter: inspection.renter,
      owner: inspection.owner
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
