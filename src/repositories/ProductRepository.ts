import { OptimizedBaseRepository } from './BaseRepository.optimized';
import Product from '@/models/Product.model';
import { ProductData, CreateProductData, UpdateProductData } from '@/types/product.types';

class ProductRepository extends OptimizedBaseRepository<ProductData, CreateProductData, UpdateProductData> {
  protected readonly tableName = 'products';
  protected readonly modelClass = Product;
  
  constructor() {
    super();
    
    // Configure search fields for the optimized search functionality
    this.searchFields = ['name', 'description', 'category', 'location'];
    
    // Configure cache settings for products
    this.defaultCacheTTL = 600; // 10 minutes
    this.cacheKeyPrefix = 'product';
  }
}

export default new ProductRepository();
