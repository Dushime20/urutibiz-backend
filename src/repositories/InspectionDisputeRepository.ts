import { OptimizedBaseRepository } from '@/repositories/BaseRepository.optimized';
import { ServiceResponse } from '@/types';
import { InspectionDispute } from '@/types/productInspection.types';

export class InspectionDisputeRepository extends OptimizedBaseRepository<InspectionDispute, Partial<InspectionDispute>, Partial<InspectionDispute>> {
  protected readonly tableName = 'inspection_disputes';
  protected readonly modelClass = class {
    static fromDb(row: any): any { return row; }
    constructor(public data: any) {}
  } as any;

  async getByInspectionId(inspectionId: string): Promise<ServiceResponse<InspectionDispute[]>> {
    return this.findMany({ inspectionId } as any);
  }
}

export default InspectionDisputeRepository;

