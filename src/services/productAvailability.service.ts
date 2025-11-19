import ProductAvailabilityRepository from '@/repositories/ProductAvailabilityRepository';
import { ProductAvailabilityData, CreateProductAvailabilityData, AvailabilityType } from '@/types/productAvailability.types';
import { ValidationError } from '@/types';
import { getDatabase } from '@/config/database';

class ProductAvailabilityService {
  async create(data: CreateProductAvailabilityData) {
    // Basic validation
    const errors: ValidationError[] = [];
    if (!data.productId) errors.push({ field: 'productId', message: 'Product ID is required' });
    if (!data.date) errors.push({ field: 'date', message: 'Date is required' });
    if (errors.length > 0) return { success: false, error: errors.map(e => e.message).join(', ') };
    return ProductAvailabilityRepository.create(data);
  }

  async getByProduct(productId: string) {
    return ProductAvailabilityRepository.findMany({ productId });
  }

  async setAvailability(productId: string, date: string, type: AvailabilityType, priceOverride?: number, notes?: string) {
    // Upsert logic: if exists, update; else, create
    const existing = await ProductAvailabilityRepository.findMany({ productId, date });
    if (existing.data && existing.data.length > 0) {
      return ProductAvailabilityRepository.updateMany({ productId, date }, { availabilityType: type, priceOverride, notes });
    } else {
      return ProductAvailabilityRepository.create({ productId, date, availabilityType: type, priceOverride, notes });
    }
  }

  async delete(id: string) {
    return ProductAvailabilityRepository.deleteById(id, false);
  }

  /**
   * Automatically restore past unavailable dates to available status
   * This ensures that dates that have passed are automatically restored
   * Also updates product status to 'active' if it was 'inactive' and now has available dates
   */
  async restorePastUnavailableDates(): Promise<{ restored: number; errors: number; productsActivated: number }> {
    try {
      const db = getDatabase();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      // Find all unavailable dates that are in the past (before today)
      const pastUnavailable = await db('product_availability')
        .where('availability_type', 'unavailable')
        .where('date', '<', todayStr)
        .select('id', 'product_id', 'date');

      if (!pastUnavailable || pastUnavailable.length === 0) {
        return { restored: 0, errors: 0, productsActivated: 0 };
      }

      console.log(`[Auto-Restore] Found ${pastUnavailable.length} past unavailable date(s) to restore`);

      let restored = 0;
      let errors = 0;
      const affectedProductIds = new Set<string>();

      // Restore each past unavailable date
      for (const record of pastUnavailable) {
        try {
          await db('product_availability')
            .where('id', record.id)
            .update({
              availability_type: 'available',
              notes: 'auto_restored_past_date'
            });
          restored++;
          affectedProductIds.add(record.product_id);
          console.log(`[Auto-Restore] Restored date ${record.date} for product ${record.product_id}`);
        } catch (error: any) {
          console.error(`[Auto-Restore] Error restoring date ${record.date} for product ${record.product_id}:`, error);
          errors++;
        }
      }

      // Check and update product status for affected products
      let productsActivated = 0;
      for (const productId of affectedProductIds) {
        try {
          // Get product current status
          const product = await db('products')
            .where('id', productId)
            .select('id', 'status')
            .first();

          if (!product) continue;

          // Only update if product is inactive
          if (product.status === 'inactive') {
            // Check if product has any available future dates
            const futureAvailableDates = await db('product_availability')
              .where('product_id', productId)
              .where('availability_type', 'available')
              .where('date', '>=', todayStr)
              .first();

            // If product has available future dates, activate it
            if (futureAvailableDates) {
              await db('products')
                .where('id', productId)
                .update({
                  status: 'active'
                });
              productsActivated++;
              console.log(`[Auto-Restore] Activated product ${productId} - has available future dates`);
            }
          }
        } catch (error: any) {
          console.error(`[Auto-Restore] Error checking/updating product status for ${productId}:`, error);
        }
      }

      if (restored > 0) {
        console.log(`[Auto-Restore] Successfully restored ${restored} past unavailable date(s), activated ${productsActivated} product(s)`);
      }

      return { restored, errors, productsActivated };
    } catch (error: any) {
      console.error('Error in restorePastUnavailableDates:', error);
      // Return safe default on error
      return { restored: 0, errors: 0, productsActivated: 0 };
    }
  }
}

export default new ProductAvailabilityService();
