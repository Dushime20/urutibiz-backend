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
        created_at: 'createdAt',
        updated_at: 'updatedAt',
      };
      Object.entries(map).forEach(([snake, camel]) => {
        if (snake in mapped) {
          mapped[camel] = mapped[snake];
          delete mapped[snake];
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
      const updates: any = {};
      const map: Record<string, any> = {
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
      Object.entries(data as any).forEach(([k, v]) => {
        if (v !== undefined && map[k]) updates[map[k]] = v;
      });
      updates.updated_at = new Date();

      const [row] = await db(this.tableName).where('id', id).update(updates).returning('*');
      if (!row) return { success: false, error: 'Inspection not found' };
      return { success: true, data: (this.modelClass as any).fromDb(row) } as any;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

export default ProductInspectionRepository;

