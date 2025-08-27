import { OptimizedBaseRepository } from '@/repositories/BaseRepository.optimized';
import { ServiceResponse } from '@/types';
import { InspectionItem } from '@/types/productInspection.types';
import { getDatabase } from '@/config/database';

export class InspectionItemRepository extends OptimizedBaseRepository<InspectionItem, Partial<InspectionItem>, Partial<InspectionItem>> {
  protected readonly tableName = 'inspection_items';
  protected readonly modelClass = class {
    static fromDb(row: any): any {
      if (!row) return row;
      // Map snake_case DB columns to camelCase expected by services/controllers
      const mapped: any = { ...row };
      const map: Record<string, string> = {
        inspection_id: 'inspectionId',
        item_name: 'itemName',
        damage_evidence: 'damageEvidence',
        repair_cost: 'repairCost',
        replacement_cost: 'replacementCost',
        requires_repair: 'requiresRepair',
        requires_replacement: 'requiresReplacement',
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

  async getByInspectionId(inspectionId: string): Promise<ServiceResponse<InspectionItem[]>> {
    return this.findMany({ inspectionId } as any);
  }

  /**
   * Create inspection item with explicit columns to avoid unrelated fields.
   */
  async create(data: Partial<InspectionItem>): Promise<ServiceResponse<InspectionItem>> {
    try {
      const db = getDatabase();
      const payload: any = {
        inspection_id: data.inspectionId,
        item_name: data.itemName,
        description: data.description,
        condition: data.condition,
        notes: data.notes,
        photos: data.photos ? JSON.stringify(data.photos) : null,
        damage_evidence: (data as any).damageEvidence ? JSON.stringify((data as any).damageEvidence) : null,
        repair_cost: data.repairCost || 0,
        replacement_cost: data.replacementCost || 0,
        requires_repair: data.requiresRepair || false,
        requires_replacement: data.requiresReplacement || false,
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

export default InspectionItemRepository;

