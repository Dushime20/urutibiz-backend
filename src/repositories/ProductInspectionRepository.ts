import { OptimizedBaseRepository } from '@/repositories/BaseRepository.optimized';
import { ServiceResponse } from '@/types';
import { ProductInspection } from '@/types/productInspection.types';
import { getDatabase } from '@/config/database';

export class ProductInspectionRepository extends OptimizedBaseRepository<ProductInspection, Partial<ProductInspection>, Partial<ProductInspection>> {
  protected readonly tableName = 'product_inspections';
  protected readonly modelClass = class {
    static fromDb(row: any): any {
      if (!row) return row;
      // Map snake_case DB columns to camelCase expected by services/controllers
      const mapped: any = { ...row };
      const map: Record<string, string> = {
        product_id: 'productId',
        booking_id: 'bookingId',
        inspector_id: 'inspectorId',
        renter_id: 'renterId',
        owner_id: 'ownerId',
        inspection_type: 'inspectionType',
        scheduled_at: 'scheduledAt',
        started_at: 'startedAt',
        completed_at: 'completedAt',
        inspection_location: 'inspectionLocation',
        general_notes: 'generalNotes',
        owner_notes: 'ownerNotes',
        renter_notes: 'renterNotes',
        inspector_notes: 'inspectorNotes',
        has_dispute: 'hasDispute',
        dispute_reason: 'disputeReason',
        dispute_resolved_at: 'disputeResolvedAt',
        resolved_by: 'resolvedBy',
        // New workflow fields
        owner_pre_inspection_data: 'ownerPreInspectionData',
        owner_pre_inspection_confirmed: 'ownerPreInspectionConfirmed',
        owner_pre_inspection_confirmed_at: 'ownerPreInspectionConfirmedAt',
        renter_pre_review_accepted: 'renterPreReviewAccepted',
        renter_pre_review_accepted_at: 'renterPreReviewAcceptedAt',
        renter_discrepancy_reported: 'renterDiscrepancyReported',
        renter_discrepancy_data: 'renterDiscrepancyData',
        renter_post_inspection_data: 'renterPostInspectionData',
        renter_post_inspection_confirmed: 'renterPostInspectionConfirmed',
        renter_post_inspection_confirmed_at: 'renterPostInspectionConfirmedAt',
        owner_post_review_accepted: 'ownerPostReviewAccepted',
        owner_post_review_accepted_at: 'ownerPostReviewAcceptedAt',
        owner_dispute_raised: 'ownerDisputeRaised',
        owner_dispute_raised_at: 'ownerDisputeRaisedAt',
        created_at: 'createdAt',
        updated_at: 'updatedAt',
      };
      Object.entries(map).forEach(([snake, camel]) => {
        if (snake in mapped) {
          mapped[camel] = mapped[snake];
          delete mapped[snake];
        }
      });
      
      // Parse JSONB fields if they are strings (PostgreSQL JSONB should auto-parse, but handle edge cases)
      const jsonbFields = ['ownerPreInspectionData', 'renterDiscrepancyData', 'renterPostInspectionData'];
      jsonbFields.forEach(field => {
        if (mapped[field] && typeof mapped[field] === 'string') {
          try {
            mapped[field] = JSON.parse(mapped[field]);
          } catch (e) {
            // If parsing fails, keep as is (might already be an object)
            console.warn(`[ProductInspectionRepository] Failed to parse JSONB field ${field}:`, e);
          }
        }
      });
      
      return mapped;
    }
    constructor(public data: any) {}
  } as any;

  async getById(id: string): Promise<ServiceResponse<ProductInspection>> {
    return (await this.findById(id)) as unknown as ServiceResponse<ProductInspection>;
  }

  async getAll(filters: Partial<ProductInspection> = {}): Promise<ServiceResponse<ProductInspection[]>> {
    return (await this.findMany(filters)) as unknown as ServiceResponse<ProductInspection[]>;
  }

  async getPaginated(filters: Partial<ProductInspection> = {}, page = 1, limit = 20): Promise<ServiceResponse<any>> {
    return this.findPaginated(filters as any, page, limit);
  }

  /**
   * Check if workflow migration columns exist in the database
   * This verifies that the migration 20250130_add_workflow_fields_to_product_inspections has been run
   */
  private async hasWorkflowColumns(): Promise<boolean> {
    try {
      const db = getDatabase();
      // Check for one of the key workflow columns to verify migration status
      const hasColumn = await db.schema.hasColumn(this.tableName, 'owner_pre_inspection_data');
      return hasColumn;
    } catch (error) {
      console.error('[ProductInspectionRepository] Error checking workflow columns:', error);
      return false;
    }
  }

  /**
   * Create inspection with explicit columns to avoid unrelated fields.
   */
  async create(data: Partial<ProductInspection>): Promise<ServiceResponse<ProductInspection>> {
    try {
      const db = getDatabase();
      const payload: any = {
        product_id: data.productId,
        booking_id: data.bookingId,
        inspector_id: data.inspectorId,
        renter_id: data.renterId,
        owner_id: data.ownerId,
        inspection_type: data.inspectionType,
        status: data.status,
        scheduled_at: data.scheduledAt,
        started_at: data.startedAt,
        completed_at: data.completedAt,
        inspection_location: (data as any).inspectionLocation,
        general_notes: (data as any).generalNotes,
        owner_notes: (data as any).ownerNotes,
        renter_notes: (data as any).renterNotes,
        inspector_notes: (data as any).inspectorNotes,
        has_dispute: (data as any).hasDispute,
        dispute_reason: (data as any).disputeReason,
        dispute_resolved_at: (data as any).disputeResolvedAt,
        resolved_by: (data as any).resolvedBy,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      };

      // Add new workflow fields only if they are provided (to avoid errors if migration hasn't run)
      // These fields will be added by the migration: 20250130_add_workflow_fields_to_product_inspections
      if ((data as any).ownerPreInspectionData !== undefined) {
        payload.owner_pre_inspection_data = JSON.stringify((data as any).ownerPreInspectionData);
      }
      if ((data as any).ownerPreInspectionConfirmed !== undefined) {
        payload.owner_pre_inspection_confirmed = (data as any).ownerPreInspectionConfirmed ?? false;
      }
      if ((data as any).ownerPreInspectionConfirmedAt !== undefined) {
        payload.owner_pre_inspection_confirmed_at = (data as any).ownerPreInspectionConfirmedAt;
      }
      if ((data as any).renterPreReviewAccepted !== undefined) {
        payload.renter_pre_review_accepted = (data as any).renterPreReviewAccepted ?? false;
      }
      if ((data as any).renterPreReviewAcceptedAt !== undefined) {
        payload.renter_pre_review_accepted_at = (data as any).renterPreReviewAcceptedAt;
      }
      if ((data as any).renterDiscrepancyReported !== undefined) {
        payload.renter_discrepancy_reported = (data as any).renterDiscrepancyReported ?? false;
      }
      if ((data as any).renterDiscrepancyData !== undefined) {
        payload.renter_discrepancy_data = (data as any).renterDiscrepancyData ? JSON.stringify((data as any).renterDiscrepancyData) : null;
      }
      if ((data as any).renterPostInspectionData !== undefined) {
        payload.renter_post_inspection_data = (data as any).renterPostInspectionData ? JSON.stringify((data as any).renterPostInspectionData) : null;
      }
      if ((data as any).renterPostInspectionConfirmed !== undefined) {
        payload.renter_post_inspection_confirmed = (data as any).renterPostInspectionConfirmed ?? false;
      }
      if ((data as any).renterPostInspectionConfirmedAt !== undefined) {
        payload.renter_post_inspection_confirmed_at = (data as any).renterPostInspectionConfirmedAt;
      }
      if ((data as any).ownerPostReviewAccepted !== undefined) {
        payload.owner_post_review_accepted = (data as any).ownerPostReviewAccepted ?? false;
      }
      if ((data as any).ownerPostReviewAcceptedAt !== undefined) {
        payload.owner_post_review_accepted_at = (data as any).ownerPostReviewAcceptedAt;
      }
      if ((data as any).ownerDisputeRaised !== undefined) {
        payload.owner_dispute_raised = (data as any).ownerDisputeRaised ?? false;
      }
      if ((data as any).ownerDisputeRaisedAt !== undefined) {
        payload.owner_dispute_raised_at = (data as any).ownerDisputeRaisedAt;
      }

      const [row] = await db(this.tableName).insert(payload).returning('*');
      return { success: true, data: (this.modelClass as any).fromDb(row) } as any;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Convenience update by id wrapper using explicit column mapping
   */
  async update(id: string, data: Partial<ProductInspection>): Promise<ServiceResponse<ProductInspection>> {
    try {
      const db = getDatabase();
      
      // Check if workflow migration has been run
      const hasWorkflowColumns = await this.hasWorkflowColumns();
      
      // Check if any workflow fields are being updated
      const workflowFields = [
        'ownerPreInspectionData', 'ownerPreInspectionConfirmed', 'ownerPreInspectionConfirmedAt',
        'renterPreReviewAccepted', 'renterPreReviewAcceptedAt', 'renterDiscrepancyReported',
        'renterDiscrepancyData', 'renterPostInspectionData', 'renterPostInspectionConfirmed',
        'renterPostInspectionConfirmedAt', 'ownerPostReviewAccepted', 'ownerPostReviewAcceptedAt',
        'ownerDisputeRaised', 'ownerDisputeRaisedAt'
      ];
      const hasWorkflowFields = workflowFields.some(field => (data as any)[field] !== undefined);
      
      // If workflow fields are being updated but migration hasn't run, return error
      if (hasWorkflowFields && !hasWorkflowColumns) {
        return { 
          success: false, 
          error: 'Database migration required: Please run migration 20250130_add_workflow_fields_to_product_inspections to add workflow columns to product_inspections table' 
        };
      }

      const updates: any = {};
      // JSONB fields that need stringification
      const jsonbFields = ['ownerPreInspectionData', 'renterDiscrepancyData', 'renterPostInspectionData'];
      
      const map: Record<string, string> = {
        productId: 'product_id',
        bookingId: 'booking_id',
        inspectorId: 'inspector_id',
        renterId: 'renter_id',
        ownerId: 'owner_id',
        inspectionType: 'inspection_type',
        status: 'status',
        scheduledAt: 'scheduled_at',
        startedAt: 'started_at',
        completedAt: 'completed_at',
        inspectionLocation: 'inspection_location',
        generalNotes: 'general_notes',
        ownerNotes: 'owner_notes',
        renterNotes: 'renter_notes',
        inspectorNotes: 'inspector_notes',
        hasDispute: 'has_dispute',
        disputeReason: 'dispute_reason',
        disputeResolvedAt: 'dispute_resolved_at',
        resolvedBy: 'resolved_by',
      };

      // Add workflow fields to map only if migration has been run
      if (hasWorkflowColumns) {
        map.ownerPreInspectionConfirmed = 'owner_pre_inspection_confirmed';
        map.ownerPreInspectionConfirmedAt = 'owner_pre_inspection_confirmed_at';
        map.renterPreReviewAccepted = 'renter_pre_review_accepted';
        map.renterPreReviewAcceptedAt = 'renter_pre_review_accepted_at';
        map.renterDiscrepancyReported = 'renter_discrepancy_reported';
        map.renterPostInspectionConfirmed = 'renter_post_inspection_confirmed';
        map.renterPostInspectionConfirmedAt = 'renter_post_inspection_confirmed_at';
        map.ownerPostReviewAccepted = 'owner_post_review_accepted';
        map.ownerPostReviewAcceptedAt = 'owner_post_review_accepted_at';
        map.ownerDisputeRaised = 'owner_dispute_raised';
        map.ownerDisputeRaisedAt = 'owner_dispute_raised_at';
      }
      
      Object.entries(data as any).forEach(([k, v]) => {
        if (v !== undefined && map[k]) {
          // Handle Date objects - ensure they're properly converted
          if (v instanceof Date) {
            updates[map[k]] = v;
          } else if (typeof v === 'string' && (k.includes('At') || k.includes('Date'))) {
            // Try to parse date strings
            try {
              updates[map[k]] = new Date(v);
            } catch (e) {
              updates[map[k]] = v; // Fallback to original value
            }
          } else {
            updates[map[k]] = v;
          }
        } else if (v !== undefined && jsonbFields.includes(k)) {
          // Handle JSONB fields only if migration has been run
          if (hasWorkflowColumns) {
            const dbField = k.replace(/([A-Z])/g, '_$1').toLowerCase();
            updates[dbField] = v ? JSON.stringify(v) : null;
          }
        }
      });
      updates.updated_at = new Date();

      console.log('[ProductInspectionRepository] Update payload:', {
        id,
        updates: Object.keys(updates),
        hasWorkflowColumns,
        workflowFieldsBeingUpdated: Object.keys(data).filter(k => workflowFields.includes(k))
      });

      const [row] = await db(this.tableName).where('id', id).update(updates).returning('*');
      if (!row) return { success: false, error: 'Inspection not found' };
      return { success: true, data: (this.modelClass as any).fromDb(row) } as any;
    } catch (error) {
      console.error('[ProductInspectionRepository] Update error:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}

export default ProductInspectionRepository;

