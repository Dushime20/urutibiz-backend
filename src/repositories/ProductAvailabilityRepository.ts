import { BaseRepository } from './BaseRepository';
import ProductAvailability from '@/models/ProductAvailability.model';
import { ProductAvailabilityData, CreateProductAvailabilityData } from '@/types/productAvailability.types';
import { getDatabase } from '@/config/database';

class ProductAvailabilityRepository extends BaseRepository<ProductAvailabilityData, CreateProductAvailabilityData, Partial<ProductAvailabilityData>> {
  protected readonly tableName = 'product_availability';
  protected readonly modelClass = ProductAvailability;

  async findMany(filters: { productId?: string; date?: string }) {
    const db = getDatabase();
    let query = db('product_availability');
    if (filters.productId) query = query.where('product_id', filters.productId);
    if (filters.date) query = query.where('date', filters.date);
    const results = await query.select('id', 'product_id', 'date', 'availability_type', 'price_override', 'notes', 'created_at');
    return { success: true, data: results };
  }
}

export default new ProductAvailabilityRepository();
