import { ProductData, CreateProductData, UpdateProductData, ProductFilters } from '@/types/product.types';
import ProductRepository from '@/repositories/ProductRepository';
import { ValidationError } from '@/types';

console.log('[DEBUG] ProductService file loaded');

class ProductService {
  async create(data: CreateProductData, ownerId: string) {
    try {
      console.log('[DEBUG] ProductService.create called with:', data, ownerId);
      const errors = await this.validateCreate(data);
      console.log('[DEBUG] ProductService.create validation errors:', errors);
      if (errors.length > 0) {
        return { success: false, error: errors.map(e => e.message).join(', ') };
      }
      // Add owner_id to data in snake_case
      const productData = { ...data, owner_id: ownerId } as any;
      const result = await ProductRepository.create(productData);
      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to create product' };
      }
      return { success: true, data: result.data };
    } catch (err) {
      console.error('[DEBUG] Error in ProductService.create:', err);
      throw err;
    }
  }

  async getById(id: string) {
    const result = await ProductRepository.findById(id);
    if (!result.success) return { success: false, error: result.error };

    // Enhance product with pricing information from product_prices
    try {
      const { productPriceService } = await import('./productPrice.service');
      const pricesResult = await productPriceService.getProductPrices({
        product_id: id,
        is_active: true,
        limit: 100
      });

      const enhanced = {
        ...result.data,
        pricing: pricesResult.prices || []
      } as any;

      return { success: true, data: enhanced };
    } catch (e) {
      console.warn('[DEBUG] Failed to attach pricing to product', id, e);
      return { success: true, data: result.data };
    }
  }

  async update(id: string, data: UpdateProductData) {
    const result = await ProductRepository.updateById(id, data);
    if (!result.success) return { success: false, error: result.error };
    return { success: true, data: result.data };
  }

  async delete(id: string) {
    const result = await ProductRepository.deleteById(id, true);
    if (!result.success) return { success: false, error: result.error };
    return { success: true };
  }

  async getPaginated(query: any, page = 1, limit = 10, sortBy = 'created_at', sortOrder: 'asc' | 'desc' = 'desc') {
    // For now, treat query as criteria for findPaginated
    const result = await ProductRepository.findPaginated(query, page, limit, sortBy, sortOrder);
    return result;
  }

  // Validation helpers
  private async validateCreate(data: CreateProductData): Promise<ValidationError[]> {
    try {
      console.log('[DEBUG] validateCreate received data:', data);
      const errors: ValidationError[] = [];
      if (!data.title) errors.push({ field: 'title', message: 'Title is required' });
      if (!data.slug) errors.push({ field: 'slug', message: 'Slug is required' });
      if (!data.description) errors.push({ field: 'description', message: 'Description is required' });
      if (!data.category_id) errors.push({ field: 'category_id', message: 'Category is required' });
      if (!data.pickup_methods || !data.pickup_methods.length) errors.push({ field: 'pickup_methods', message: 'At least one pickup method is required' });
      if (!data.country_id) errors.push({ field: 'country_id', message: 'Country is required' });
      console.log('[DEBUG] validateCreate errors:', errors);
      return errors;
    } catch (err) {
      console.error('[DEBUG] Error in validateCreate:', err);
      throw err;
    }
  }

  private async validateUpdate(_data: UpdateProductData): Promise<ValidationError[]> {
    // Add update-specific validation as needed
    return [];
  }
}

export default new ProductService();
