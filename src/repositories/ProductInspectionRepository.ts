import { OptimizedBaseRepository } from '@/repositories/BaseRepository.optimized';
import { ServiceResponse } from '@/types';
import { ProductInspection } from '@/types/productInspection.types';

export class ProductInspectionRepository extends OptimizedBaseRepository<ProductInspection, Partial<ProductInspection>, Partial<ProductInspection>> {
  protected readonly tableName = 'product_inspections';
  protected readonly modelClass = class {
    static fromDb(row: any): any { return row; }
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
}

export default ProductInspectionRepository;

