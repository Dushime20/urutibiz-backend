import { OptimizedBaseRepository } from '@/repositories/BaseRepository.optimized';
import { ServiceResponse } from '@/types';
import { InspectionItem } from '@/types/productInspection.types';

export class InspectionItemRepository extends OptimizedBaseRepository<InspectionItem, Partial<InspectionItem>, Partial<InspectionItem>> {
  protected readonly tableName = 'inspection_items';
  protected readonly modelClass = class {
    static fromDb(row: any): any { return row; }
    constructor(public data: any) {}
  } as any;

  async getByInspectionId(inspectionId: string): Promise<ServiceResponse<InspectionItem[]>> {
    return this.findMany({ inspectionId } as any);
  }
}

export default InspectionItemRepository;

