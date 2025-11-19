import { OptimizedBaseRepository } from '@/repositories/BaseRepository.optimized';
import { ServiceResponse } from '@/types';
import { InspectionPhoto } from '@/types/productInspection.types';

export class InspectionPhotoRepository extends OptimizedBaseRepository<any, Partial<InspectionPhoto>, Partial<InspectionPhoto>> {
  protected readonly tableName = 'inspection_photos';
  protected readonly modelClass = class {
    static fromDb(row: any): any { return row; }
    constructor(public data: any) {}
  } as any;

  async getByInspectionId(inspectionId: string): Promise<ServiceResponse<InspectionPhoto[]>> {
    return this.findMany({ inspectionId } as any);
  }
}

export default InspectionPhotoRepository;

