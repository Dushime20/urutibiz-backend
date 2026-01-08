import { OptimizedBaseRepository } from './BaseRepository.optimized';
import Product from '@/models/Product.model';
import { ProductData, CreateProductData, UpdateProductData } from '@/types/product.types';

class ProductRepository extends OptimizedBaseRepository<ProductData, CreateProductData, UpdateProductData> {
  protected readonly tableName = 'products';
  protected readonly modelClass = Product;
  
  constructor() {
    super();
    
    // Configure search fields for the optimized search functionality
    this.searchFields = ['title', 'description'];
    
    // Configure cache settings for products
    this.defaultCacheTTL = 600; // 10 minutes
    this.cacheKeyPrefix = 'product';
  }

  /**
   * Overridden findPaginated to support search by Product Name OR Category Name
   */
  async findPaginated(
    criteria: Partial<ProductData> = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<any> {
    const { getDatabase } = await import('@/config/database');
    const db = getDatabase();

    const offset = (page - 1) * limit;
    
    let query = db(this.tableName)
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .leftJoin('product_images', 'products.id', 'product_images.product_id')
      .select(
        'products.*', 
        'categories.name as category_name',
        db.raw(`
          json_agg(
            json_build_object(
              'id', product_images.id,
              'image_url', product_images.image_url,
              'thumbnail_url', product_images.thumbnail_url,
              'is_primary', product_images.is_primary,
              'sort_order', product_images.sort_order
            ) ORDER BY product_images.sort_order, product_images.is_primary DESC
          ) FILTER (WHERE product_images.id IS NOT NULL) as images
        `)
      )
      .groupBy('products.id', 'categories.name');

    // Apply filters
    if ((criteria as any).search) {
      const searchTerm = `%${(criteria as any).search}%`;
      query = query.where((builder) => {
        builder.where('products.title', 'ILIKE', searchTerm) // Assuming 'title' is the product name column
          .orWhere('categories.name', 'ILIKE', searchTerm);
      });
      // Remove search from criteria to avoid double filtering if base logic uses it
      delete (criteria as any).search;
    }

    // Apply other strict filters
    Object.entries(criteria).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Handle mapped fields if necessary, or assume snake_case matching column names
        // Common filters: status, condition, owner_id
        if (key === 'status') query = query.where('products.status', value);
        else if (key === 'condition') query = query.where('products.condition', value);
        else if (key === 'owner_id') query = query.where('products.owner_id', value);
        else if (key === 'category_id') query = query.where('products.category_id', value);
        // Add other specific mappings as needed
      }
    });

    // Get total count
    const countQuery = db(this.tableName)
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .count(db.raw('DISTINCT products.id'))
      .first();
    
    // Apply same filters to count query
    if ((criteria as any).search) {
      const searchTerm = `%${(criteria as any).search}%`;
      countQuery.where((builder) => {
        builder.where('products.title', 'ILIKE', searchTerm)
          .orWhere('categories.name', 'ILIKE', searchTerm);
      });
    }
    Object.entries(criteria).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'status') countQuery.where('products.status', value);
        else if (key === 'condition') countQuery.where('products.condition', value);
        else if (key === 'owner_id') countQuery.where('products.owner_id', value);
        else if (key === 'category_id') countQuery.where('products.category_id', value);
      }
    });

    const countResult = await countQuery;
    const total = parseInt((countResult as any)?.count || '0', 10);

    // Get data
    const results = await query
      .orderBy(`products.${sortBy}`, sortOrder)
      .limit(limit)
      .offset(offset);

    const entities = results.map(result => (this.modelClass as any).fromDb ? (this.modelClass as any).fromDb(result) : new this.modelClass(result));

    return {
      success: true,
      data: {
        data: entities,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      metadata: { tableName: this.tableName, operation: 'findPaginated (custom)', count: entities.length }
    };
  }
}

export default new ProductRepository();
