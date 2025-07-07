import { ProductData, CreateProductData, UpdateProductData, ProductFilters } from '@/types/product.types';
import ProductRepository from '@/repositories/ProductRepository';
import { ValidationError } from '@/types';

class ProductService {
  async create(data: CreateProductData, ownerId: string) {
    const errors = await this.validateCreate(data);
    if (errors.length > 0) {
      return { success: false, error: errors.map(e => e.message).join(', ') };
    }
    // Add ownerId to data
    const productData = { ...data, ownerId } as any;
    const result = await ProductRepository.create(productData);
    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'Failed to create product' };
    }
    return { success: true, data: result.data };
  }

  async getById(id: string) {
    const result = await ProductRepository.findById(id);
    if (!result.success) return { success: false, error: result.error };
    return { success: true, data: result.data };
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

  async getPaginated(query: Partial<ProductData>, page = 1, limit = 10) {
    // For now, treat query as criteria for findPaginated
    const result = await ProductRepository.findPaginated(query, page, limit);
    return result;
  }

  // Validation helpers
  private async validateCreate(data: CreateProductData): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    if (!data.title) errors.push({ field: 'title', message: 'Title is required' });
    if (!data.description) errors.push({ field: 'description', message: 'Description is required' });
    if (!data.categoryId) errors.push({ field: 'categoryId', message: 'Category is required' });
    if (!data.basePrice) errors.push({ field: 'basePrice', message: 'Base price is required' });
    if (!data.baseCurrency) errors.push({ field: 'baseCurrency', message: 'Base currency is required' });
    if (!data.pickupMethods || !data.pickupMethods.length) errors.push({ field: 'pickupMethods', message: 'At least one pickup method is required' });
    if (!data.location) errors.push({ field: 'location', message: 'Location is required' });
    return errors;
  }

  private async validateUpdate(_data: UpdateProductData): Promise<ValidationError[]> {
    // Add update-specific validation as needed
    return [];
  }
}

export default new ProductService();
