import { BaseService } from './BaseService';
import ProductRepository from '@/repositories/ProductRepository';
import { ProductData, CreateProductData, UpdateProductData } from '@/types/product.types';
import { ValidationError } from '@/types';

class ProductService extends BaseService<ProductData, CreateProductData, UpdateProductData> {
  constructor() {
    super(ProductRepository);
  }

  protected async validateCreate(data: CreateProductData): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    if (!data.title) errors.push({ field: 'title', message: 'Title is required' });
    if (!data.description) errors.push({ field: 'description', message: 'Description is required' });
    if (!data.categoryId) errors.push({ field: 'categoryId', message: 'Category is required' });
    if (!data.basePrice) errors.push({ field: 'basePrice', message: 'Base price is required' });
    if (!data.baseCurrency) errors.push({ field: 'baseCurrency', message: 'Base currency is required' });
    if (!data.pickupMethods || !data.pickupMethods.length) errors.push({ field: 'pickupMethods', message: 'At least one pickup method is required' });
    if (!data.location) errors.push({ field: 'location', message: 'Location is required' });
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
    const product = await this.repository.findById(id);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    // Fetch pricing information from product_prices table
    try {
      const { productPriceService } = await import('./productPrice.service');
      const prices = await productPriceService.getProductPrices({
        product_id: id,
        is_active: true
      });
      
      // Add pricing data to product
      const enhancedProduct = {
        ...product,
        pricing: prices.prices || [],
        // Ensure delivery fee is included
        delivery_fee: product.delivery_fee || 0,
        delivery_available: product.delivery_available || false,
        delivery_radius_km: product.delivery_radius_km || 0
      };
      
      return { success: true, data: enhancedProduct };
    } catch (error) {
      // If pricing fetch fails, return product without pricing
      console.warn('Failed to fetch pricing for product:', id, error);
      return { success: true, data: product };
    }
  }
}

export default new ProductService();
