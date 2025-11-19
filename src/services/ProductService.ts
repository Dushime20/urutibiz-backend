import { BaseService } from './BaseService';
import ProductRepository from '@/repositories/ProductRepository';
import { ProductData, CreateProductData, UpdateProductData } from '@/types/product.types';
import { ValidationError } from '@/types';

// ProductData uses snake_case (created_at, updated_at) but BaseService expects BaseModel with camelCase
// We'll use a type assertion to work around this
class ProductService extends BaseService<ProductData & { createdAt: Date; updatedAt: Date }, CreateProductData, UpdateProductData> {
  constructor() {
    super(ProductRepository);
  }

  protected async validateCreate(data: CreateProductData): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    if (!data.title) errors.push({ field: 'title', message: 'Title is required' });
    if (!data.description) errors.push({ field: 'description', message: 'Description is required' });
    if (!data.category_id) errors.push({ field: 'category_id', message: 'Category is required' });
    if (!data.location) errors.push({ field: 'location', message: 'Location is required' });
    if (!data.pickup_methods || !data.pickup_methods.length) errors.push({ field: 'pickup_methods', message: 'At least one pickup method is required' });
    // Add more advanced validation as needed
    return errors;
  }

  protected async validateUpdate(_data: UpdateProductData): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    // Add update-specific validation as needed
    return errors;
  }

  protected async applyCreateBusinessRules(data: CreateProductData): Promise<CreateProductData> {
    // Add business logic (e.g., set default values)
    return data;
  }

  protected async applyUpdateBusinessRules(data: UpdateProductData): Promise<UpdateProductData> {
    // Add business logic for updates if needed
    return data;
  }

  public async findById(id: string) {
    const productResult = await this.repository.findById(id);
    if (!productResult || !productResult.success || !productResult.data) {
      return { success: false, error: 'Product not found' };
    }

    // Fetch pricing information from product_prices table
    try {
      const { productPriceService } = await import('./productPrice.service');
      const prices = await productPriceService.getProductPrices({
        product_id: id,
        is_active: true
      });
      
      // Add pricing data to product - productResult.data is ProductData & { createdAt, updatedAt }
      const product = productResult.data as unknown as ProductData;
      const enhancedProduct = {
        ...product,
        pricing: prices.prices || [],
        // Ensure delivery fee is included (these properties may not exist on ProductData)
        delivery_fee: (product as any).delivery_fee || 0,
        delivery_available: (product as any).delivery_available || false,
        delivery_radius_km: (product as any).delivery_radius_km || 0
      };
      
      return { success: true, data: enhancedProduct };
    } catch (error) {
      // If pricing fetch fails, return product without pricing
      console.warn('Failed to fetch pricing for product:', id, error);
      return { success: true, data: productResult };
    }
  }
}

export default new ProductService();
