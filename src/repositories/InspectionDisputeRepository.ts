import { OptimizedBaseRepository } from '@/repositories/BaseRepository.optimized';
import { ServiceResponse } from '@/types';
import { InspectionDispute } from '@/types/productInspection.types';
import { getDatabase } from '@/config/database';

export class InspectionDisputeRepository extends OptimizedBaseRepository<InspectionDispute, Partial<InspectionDispute>, Partial<InspectionDispute>> {
  protected readonly tableName = 'inspection_disputes';
  protected readonly modelClass = class {
    static fromDb(row: any): any {
      if (!row) return row;
      // Map snake_case DB columns to camelCase expected by services/controllers
      const mapped: any = { ...row };
      const map: Record<string, string> = {
        inspection_id: 'inspectionId',
        raised_by: 'raisedBy',
        dispute_type: 'disputeType',
        resolution_notes: 'resolutionNotes',
        agreed_amount: 'agreedAmount',
        resolved_by: 'resolvedBy',
        resolved_at: 'resolvedAt',
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

  async getByInspectionId(inspectionId: string): Promise<ServiceResponse<InspectionDispute[]>> {
    return this.findMany({ inspectionId } as any);
  }

  /**
   * Get dispute by ID
   */
  async getById(id: string): Promise<ServiceResponse<InspectionDispute>> {
    try {
      const db = getDatabase();
      const [row] = await db(this.tableName).where({ id }).select('*');
      
      if (!row) {
        return { success: false, error: 'Dispute not found' };
      }
      
      return { success: true, data: (this.modelClass as any).fromDb(row) } as any;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Update inspection dispute
   */
  async update(id: string, data: Partial<InspectionDispute>): Promise<ServiceResponse<InspectionDispute>> {
    try {
      const db = getDatabase();
      const payload: any = {
        inspection_id: data.inspectionId,
        raised_by: (data as any).raisedBy,
        dispute_type: (data as any).disputeType,
        reason: data.reason,
        evidence: (data as any).evidence,
        status: data.status,
        resolution_notes: (data as any).resolutionNotes,
        agreed_amount: (data as any).agreedAmount,
        resolved_by: (data as any).resolvedBy,
        resolved_at: (data as any).resolvedAt,
        updated_at: db.fn.now(),
      };

      // Filter out undefined values from payload
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

      const [row] = await db(this.tableName).where({ id }).update(payload).returning('*');
      if (!row) {
        return { success: false, error: 'Dispute not found' };
      }
      
      return { success: true, data: (this.modelClass as any).fromDb(row) } as any;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Create inspection dispute with explicit columns to avoid unrelated fields.
   */
  async create(data: Partial<InspectionDispute>): Promise<ServiceResponse<InspectionDispute>> {
    try {
      const db = getDatabase();
      const payload: any = {
        inspection_id: data.inspectionId,
        raised_by: (data as any).raisedBy,
        dispute_type: (data as any).disputeType,
        reason: data.reason,
        evidence: (data as any).evidence,
        status: 'open',
        resolution_notes: (data as any).resolutionNotes,
        agreed_amount: (data as any).agreedAmount,
        resolved_by: (data as any).resolvedBy,
        resolved_at: (data as any).resolvedAt,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      };

      const [row] = await db(this.tableName).insert(payload).returning('*');
      return { success: true, data: (this.modelClass as any).fromDb(row) } as any;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

export default InspectionDisputeRepository;

