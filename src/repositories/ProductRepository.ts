import { OptimizedBaseRepository } from './BaseRepository.optimized';
import Product from '@/models/Product.model';
import { ProductData, CreateProductData, UpdateProductData } from '@/types/product.types';
import logger from '../utils/logger';

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
    criteria: Partial<ProductData> & {
      search?: string;
      min_price?: number;
      max_price?: number;
      location?: { latitude: number; longitude: number; radius: number };
      text_embedding?: number[];
    } = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<any> {
    const { getDatabase } = await import('@/config/database');
    const db = getDatabase();

    const offset = (page - 1) * limit;
    const { search, min_price, max_price, location: geoLoc, text_embedding, ...otherCriteria } = criteria as any;

    // 1. Base Query Construction
    let query = db(this.tableName)
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .leftJoin('product_images', 'products.id', 'product_images.product_id');

    // 2. Build Selection and Relevance Scoring
    let selectFields: any[] = [
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
    ];

    let relevanceExpr = '0';
    if (search) {
      const keywords = search.split(/\s+/).filter((k: string) => k.length > 0);
      keywords.forEach((word: string) => {
        const escaped = word.replace(/'/g, "''");
        // Title Exact Match: 10 points
        relevanceExpr += ` + (CASE WHEN products.title ILIKE '${escaped}' THEN 10 ELSE 0 END)`;
        // Title Partial: 5 points
        relevanceExpr += ` + (CASE WHEN products.title ILIKE '%${escaped}%' THEN 5 ELSE 0 END)`;
        // Category: 4 points
        relevanceExpr += ` + (CASE WHEN categories.name ILIKE '%${escaped}%' THEN 4 ELSE 0 END)`;
        // Description: 1 point
        relevanceExpr += ` + (CASE WHEN products.description ILIKE '%${escaped}%' THEN 1 ELSE 0 END)`;
      });

      // Popularity & Quality Boost (Deep Search refinement)
      relevanceExpr += ` + (COALESCE(products.view_count, 0) * 0.001)`; // 1 point per 1000 views
      relevanceExpr += ` + (COALESCE(products.average_rating, 0) * 0.5)`; // 0.5 point per star

      selectFields.push(db.raw(`(${relevanceExpr}) as relevance_score`));
    }

    // Step 3 & 5: Semantic Score (pgvector cosine similarity)
    if (text_embedding && Array.isArray(text_embedding) && text_embedding.length > 0) {
      const vectorStr = `[${text_embedding.join(',')}]`;
      // In pgvector, <=> is cosine distance, so 1 - <=> is similarity
      selectFields.push(db.raw(`(1 - (products.text_embedding <=> ?)) as semantic_score`, [vectorStr]));
    }

    // Distance calculation if geoLoc is provided
    if (geoLoc?.latitude && geoLoc?.longitude) {
      const distanceExpr = `ST_DistanceSphere(products.location, ST_GeomFromText('SRID=4326;POINT(${geoLoc.longitude} ${geoLoc.latitude})'))`;
      selectFields.push(db.raw(`${distanceExpr} as distance_meters`));
    }

    query = query.select(selectFields).groupBy('products.id', 'categories.name');

    // 3. Apply Filters (to both Data and Count query)
    const applyFilters = (qb: any) => {
      // Keyword Filtering (Deep Search: each keyword must match at least something)
      // Keyword Filtering (Relaxed for Deep Search: at least one core keyword must match)
      if (search) {
        const noiseWords = new Set(['i', 'want', 'for', 'and', 'also', 'the', 'in', 'at', 'with', 'a', 'an']);
        const keywords = search.split(/\s+/).filter((k: string) => k.length > 1 && !noiseWords.has(k.toLowerCase()));

        if (keywords.length > 0) {
          qb.where((builder: any) => {
            keywords.forEach((word: string) => {
              const pattern = `%${word}%`;
              builder.orWhere('products.title', 'ILIKE', pattern)
                .orWhere('categories.name', 'ILIKE', pattern)
                .orWhere('products.description', 'ILIKE', pattern);
            });
          });
        }
      }

      // Deep Search: Technical Specifications Filtering
      if (otherCriteria.specifications) {
        const specs = otherCriteria.specifications;
        if (Object.keys(specs).length > 0) {
          qb.whereRaw('products.specifications @> ?', [JSON.stringify(specs)]);
        }
      }

      // Price Filtering
      if (min_price !== undefined) qb.where('products.price', '>=', min_price);
      if (max_price !== undefined) qb.where('products.price', '<=', max_price);

      // Geo-Radius Filtering
      if (geoLoc?.latitude && geoLoc?.longitude && geoLoc.radius) {
        qb.whereRaw(
          `ST_DistanceSphere(products.location, ST_GeomFromText('SRID=4326;POINT(${geoLoc.longitude} ${geoLoc.latitude})')) <= ?`,
          [geoLoc.radius * 1000] // Convert km to meters
        );
      }

      // Rest of strict filters
      Object.entries(otherCriteria).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (['status', 'condition', 'owner_id', 'category_id', 'country_id'].includes(key)) {
            if (value === 'all') return;
            qb.where(`products.${key}`, value);
          }
        }
      });

      // Exclude soft-deleted products from public queries
      qb.whereNot('products.status', 'deleted');
    };

    applyFilters(query);

    // 4. Build Count Query and Related Categories Query
    const countQuery = db(this.tableName)
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .count(db.raw('DISTINCT products.id'))
      .first();
    applyFilters(countQuery);

    // Aggregate related categories for smart suggestions
    let relatedCategories: any[] = [];
    if (search || !otherCriteria.category_id || otherCriteria.category_id === 'all') {
      const relCatQuery = db(this.tableName)
        .leftJoin('categories', 'products.category_id', 'categories.id')
        .select('categories.id', 'categories.name', 'categories.slug')
        .count('products.id as count')
        .whereNotNull('categories.id')
        .groupBy('categories.id', 'categories.name', 'categories.slug')
        .orderBy('count', 'desc')
        .limit(6);
      applyFilters(relCatQuery);
      relatedCategories = await relCatQuery;
    }

    const countResult = await countQuery;
    let total = parseInt((countResult as any)?.count || '0', 10);

    // Step 4: Soft Filtering Recovery
    // If no results match the strict filters, relax them to maintain recall
    if (total === 0 && (min_price || max_price || geoLoc || otherCriteria.category_id)) {
      logger.info('[ProductRepository] Zero results with strict filters, relaxing for better recall...');
      query = db(this.tableName)
        .leftJoin('categories', 'products.category_id', 'categories.id')
        .leftJoin('product_images', 'products.id', 'product_images.product_id')
        .select(selectFields)
        .groupBy('products.id', 'categories.name');

      // Relax filters: Keep only keywords and text embedding, remove price/location constraints
      if (search) {
        const keywords = search.split(/\s+/).filter((k: string) => k.length > 0);
        keywords.forEach((word: string) => {
          const pattern = `%${word}%`;
          query.where((builder: any) => {
            builder.where('products.title', 'ILIKE', pattern)
              .orWhere('categories.name', 'ILIKE', pattern);
          });
        });
      }
      query.whereNot('products.status', 'deleted');

      const relaxedCount = await db(this.tableName).count('id as count').whereNot('status', 'deleted').first();
      total = parseInt((relaxedCount as any)?.count || '0', 10);
    }

    // 5. Handle Sorting
    let finalSortBy = `products.${sortBy}`;

    // Fix: If sorting by relevance but no search term, fallback to created_at
    // "relevance" column only exists as a computed column when searching
    // Fix: If sorting by relevance but no search term, fallback to created_at
    // "relevance" column only exists as a computed column when searching
    if (sortBy === 'relevance' || sortBy === 'relevance_score' || sortBy === 'relevancy') {
      if (text_embedding) {
        finalSortBy = 'semantic_score';
        sortOrder = 'desc'; // Force desc for similarity
      } else if (search) {
        finalSortBy = 'relevance_score';
      } else {
        finalSortBy = 'products.created_at';
      }
    } else if (sortBy === 'distance' && geoLoc) {
      finalSortBy = 'distance_meters';
    }

    // 6. Execute Main Query
    const results = await query
      .orderBy(finalSortBy, sortOrder)
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
      metadata: {
        tableName: this.tableName,
        operation: 'Alibaba Deep Search',
        count: entities.length,
        searchParams: { search, min_price, max_price, geoLoc },
        relatedCategories // Pass these back for frontend suggestions
      }
    };
  }
}

export default new ProductRepository();
