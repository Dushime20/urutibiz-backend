/**
 * High-Performance Product Management Controller
 * 
 * Optimized for enterprise-scale workloads with:
 * - Database query optimization and connection pooling
 * - Intelligent caching with TTL management
 * - Parallel processing and async optimization
 * - Memory-efficient data structures
 * 
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - price
 *         - currency
 *         - category
 *         - condition
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique product identifier
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 200
 *           description: Product name
 *         description:
 *           type: string
 *           maxLength: 2000
 *           description: Product description
 *         price:
 *           type: number
 *           minimum: 0
 *           maximum: 999999.99
 *           description: Product price
 *         currency:
 *           type: string
 *           enum: [USD, EUR, GBP, NGN, GHS, KES]
 *           description: Price currency
 *         category:
 *           type: string
 *           description: Product category
 *         condition:
 *           type: string
 *           enum: [new, like_new, good, fair, poor]
 *           description: Product condition
 *         status:
 *           type: string
 *           enum: [active, inactive, draft, under_review]
 *           description: Product status
 *         stock:
 *           type: integer
 *           minimum: 0
 *           description: Available stock quantity
 *         images:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *               alt:
 *                 type: string
 *               isPrimary:
 *                 type: boolean
 *         specifications:
 *           type: object
 *           description: Product specifications
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         location:
 *           type: object
 *           properties:
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             country:
 *               type: string
 *         ownerId:
 *           type: string
 *           format: uuid
 *           description: Product owner ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ProductFilters:
 *       type: object
 *       properties:
 *         category:
 *           type: string
 *         condition:
 *           type: string
 *           enum: [new, like_new, good, fair, poor]
 *         minPrice:
 *           type: number
 *         maxPrice:
 *           type: number
 *         location:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *     PerformanceMetrics:
 *       type: object
 *       properties:
 *         responseTime:
 *           type: number
 *           description: Response time in milliseconds
 *         cacheHit:
 *           type: boolean
 *           description: Whether data was served from cache
 *         optimizationScore:
 *           type: string
 *           enum: [A+, A, B+, B, C]
 *           description: Performance grade
 *   responses:
 *     ProductResponse:
 *       description: Successful product operation
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *               message:
 *                 type: string
 *               data:
 *                 $ref: '#/components/schemas/Product'
 *               meta:
 *                 $ref: '#/components/schemas/PerformanceMetrics'
 *     ProductListResponse:
 *       description: Successful product list operation
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *               message:
 *                 type: string
 *               data:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Product'
 *               pagination:
 *                 type: object
 *                 properties:
 *                   page:
 *                     type: integer
 *                   limit:
 *                     type: integer
 *                   total:
 *                     type: integer
 *                   totalPages:
 *                     type: integer
 *               meta:
 *                 $ref: '#/components/schemas/PerformanceMetrics'
 * 
 * @version 2.0.0 - Performance Optimized
 */

import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import ProductService from '@/services/product.service'
import UserVerificationService from '@/services/userVerification.service';
import { 
  AuthenticatedRequest,
  UpdateProductData,
  ProductFilters,
  ProductData
} from '@/types';
import { ResponseHelper } from '@/utils/response';
import { FavoriteEnhancer } from '@/utils/favoriteEnhancer.util';
import { getDatabase } from '@/config/database';
import { v4 as uuidv4 } from 'uuid';
import ProductAvailabilityService from '@/services/productAvailability.service';
import imageSimilarityService from '@/services/imageSimilarity.service';
import ProductImageRepository from '@/repositories/ProductImageRepository';

// Performance: Cache configuration
const CACHE_TTL = {
  PRODUCT_DETAILS: 180,     // 3 minutes
  PRODUCT_LIST: 120,        // 2 minutes
  AVAILABILITY: 60,         // 1 minute
  ANALYTICS: 300,           // 5 minutes
} as const;

// Performance: Pre-allocated caches
const productCache = new Map<string, { data: any; timestamp: number }>();
const availabilityCache = new Map<string, { data: any; timestamp: number }>();
const analyticsCache = new Map<string, { data: any; timestamp: number }>();

// Performance: Optimized filter sets
const VALID_CONDITIONS = new Set(['new', 'like_new', 'good', 'fair', 'poor']);
const VALID_STATUSES = new Set(['active', 'inactive', 'draft', 'under_review']);
const VALID_CURRENCIES = new Set(['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES']);

// Define OptionalAuthRequest for endpoints that may or may not require auth
interface OptionalAuthRequest extends Request {
  user?: any;
}

/**
 * High-performance filter normalization
 */
const normalizeProductFilters = (query: any): Partial<ProductFilters> & { sort?: string; sortOrder?: 'asc' | 'desc' } => {
  const filters: any = {};
  
  // Fast string validation
  if (query.search && typeof query.search === 'string' && query.search.trim().length > 0) {
    filters.search = query.search.trim().toLowerCase();
  } else if (query.q && typeof query.q === 'string' && query.q.trim().length > 0) {
    // Handle 'q' from header search
    filters.search = query.q.trim().toLowerCase();
  }
  
  // Fast set-based validation
  if (query.condition && VALID_CONDITIONS.has(query.condition)) {
    filters.condition = query.condition;
  }
  if (query.status && VALID_STATUSES.has(query.status)) {
    filters.status = query.status;
  }
  if (query.currency && VALID_CURRENCIES.has(query.currency)) {
    filters.currency = query.currency;
  }
  
  // Numeric validation with fast parsing - support both snake_case and camelCase
  const minP = query.min_price || query.priceMin;
  if (minP) {
    const price = parseFloat(minP);
    if (!isNaN(price) && price >= 0) filters.min_price = price;
  }
  const maxP = query.max_price || query.priceMax;
  if (maxP) {
    const price = parseFloat(maxP);
    if (!isNaN(price) && price >= 0) filters.max_price = price;
  }
  
  // Location optimization - support lat/lng/radiusKm from frontend
  const lat = query.latitude || query.lat;
  const lng = query.longitude || query.lng;
  const rad = query.radius || query.radiusKm;
  
  if (lat && lng) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radius = parseFloat(rad) || 10;
    
    if (!isNaN(latitude) && !isNaN(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
      filters.location = { latitude, longitude, radius };
    }
  }
  
  if (query.country_id && typeof query.country_id === 'string') {
    filters.country_id = query.country_id;
  }
  if ((query.category_id || query.category) && typeof (query.category_id || query.category) === 'string') {
    filters.category_id = query.category_id || query.category;
  }
  if (query.owner_id && typeof query.owner_id === 'string') {
    filters.owner_id = query.owner_id;
  }

  // Sort parameters
  if (query.sort) {
    filters.sort = query.sort;
    filters.sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
  }
  
  return filters;
};

/**
 * Convert filters to database query format
 * Simple conversion - maps filter keys to database column names
 * Note: Location-based filtering is handled separately and not included here
 * to avoid creating invalid SQL queries with object values
 */
const convertFiltersToQuery = (filters: Partial<ProductFilters> & { sort?: string; sortOrder?: 'asc' | 'desc' }): any => {
  const query: any = {};
  
  if (filters.owner_id) query.owner_id = filters.owner_id;
  if (filters.category_id) query.category_id = filters.category_id;
  if (filters.status) query.status = filters.status;
  if (filters.condition) query.condition = filters.condition;
  if (filters.search) query.search = filters.search;
  
  // Include deep search filters
  if (filters.min_price !== undefined) query.min_price = filters.min_price;
  if (filters.max_price !== undefined) query.max_price = filters.max_price;
  if (filters.location) query.location = filters.location;
  
  return query;
};

export class ProductsController extends BaseController {
  /**
   * High-performance product creation with KYC validation
   * POST /api/v1/products
   */
  public createProduct = this.asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
    console.log('[DEBUG] Entered createProduct controller');
    console.log('[DEBUG] req.body:', req.body);
    console.log('[DEBUG] pickup_methods in req.body:', req.body.pickup_methods, typeof req.body.pickup_methods);
    try {
      const owner_id = req.user.id;
      const product_data = { ...req.body };
      
      // Map old condition values to new enum values for backward compatibility
      if (product_data.condition) {
        const conditionMapping: Record<string, string> = {
          'used': 'good',          // Map old 'used' to 'good'
          'refurbished': 'like_new' // Map old 'refurbished' to 'like_new'
        };
        
        if (conditionMapping[product_data.condition]) {
          console.log(`[DEBUG] Mapping old condition value "${product_data.condition}" to "${conditionMapping[product_data.condition]}"`);
          product_data.condition = conditionMapping[product_data.condition];
        }
      }
      
      // Force pickup_methods to be a plain JSON array
      if (product_data.pickup_methods) {
        product_data.pickup_methods = JSON.parse(JSON.stringify(product_data.pickup_methods));
        console.log('[DEBUG] pickup_methods after JSON serialization:', product_data.pickup_methods, typeof product_data.pickup_methods);
      }

      console.log('[DEBUG] Before KYC check');
      const is_verified = await UserVerificationService.isUserFullyKycVerified(owner_id);
      console.log('[DEBUG] After KYC check, before validation');

      if (!is_verified) {
        return ResponseHelper.error(res, 'You must complete KYC verification to create a product.', 403);
      }

      console.log('[DEBUG] Before calling ProductService.create');
      const created = await ProductService.create(product_data, owner_id);
      console.log('[DEBUG] After ProductService.create');

      if (!created.success) {
        console.log('[DEBUG] Product creation failed. Error:', created.error);
        return ResponseHelper.error(res, created.error || 'Failed to create product', 400);
      }

      this.invalidateProductCaches(owner_id);
      this.logAction('CREATE_PRODUCT', owner_id, created.data?.id, product_data);

      // Send notification to all admins about new product listing
      try {
        const NotificationEngine = (await import('../services/notification/NotificationEngine')).default;
        const UserRepository = (await import('../repositories/UserRepository')).default;
        const { NotificationType, NotificationPriority } = await import('../services/notification/types');
        
        // Get all admin users
        const admins = await UserRepository.findByRole('admin', 100);
        
        if (!admins || admins.length === 0) {
          console.log('No admin users found to notify');
          return;
        }
        
        // Get owner info for notification
        const ownerResult = await UserRepository.findById(owner_id);
        const owner = ownerResult?.success && ownerResult?.data ? ownerResult.data : null;
        const ownerName = owner?.firstName 
          ? `${owner.firstName}${owner.lastName ? ' ' + owner.lastName : ''}` 
          : 'A user';
        const productTitle = created.data?.title || 'New product';
        
        // Send notification to each admin
        const notificationPromises = admins.map((admin: any) => {
          const adminId = admin.id || admin.data?.id;
          if (!adminId) return Promise.resolve();
          
          return NotificationEngine.sendNotification({
            type: NotificationType.PRODUCT_CREATED,
            recipientId: adminId,
            title: 'New Product Listing',
            message: `${ownerName} has created a new product listing: "${productTitle}"`,
            data: {
              productId: created.data?.id,
              productTitle: productTitle,
              ownerId: owner_id,
              ownerName: ownerName,
              action: 'review_required'
            },
            priority: NotificationPriority.NORMAL,
            metadata: {
              source: 'products_controller',
              event: 'product_created',
              productId: created.data?.id
            }
          }).catch((error: any) => {
            console.error(`Failed to send notification to admin ${adminId}:`, error);
            return null;
          });
        });
        
        // Send notifications in parallel (don't wait for all to complete)
        Promise.all(notificationPromises).catch((error) => {
          console.error('Error sending notifications to admins:', error);
        });
      } catch (notificationError) {
        // Don't fail product creation if notification fails
        console.error('Failed to send notifications to admins:', notificationError);
      }

      return ResponseHelper.success(res, 'Product created successfully', created.data, 201);
    } catch (error) {
      console.error('[DEBUG] Error in createProduct:', error);
      return ResponseHelper.error(res, 'Internal server error', 500);
    }
  });

  /**
   * Get approved products - Public endpoint for e-rental marketplace
   * GET /api/v1/products
   * 
   * Simple logic:
   * - Public endpoint (no authentication required)
   * - Returns ONLY approved products (status='active')
   * - Used by: Home page, Items page, Browse page
   * 
   * Note: Admins should use /admin/products to see all products
   */
  public getProducts = this.asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    console.log('[ProductsController] getProducts called', { query: req.query });
    
    try {
      const { page, limit } = this.getPaginationParams(req);
      let filters = normalizeProductFilters(req.query);
      
      // Check if this is an AI search (search param starts with "🔍 AI Search:")
      if (filters.search && filters.search.includes('🔍 ai search:')) {
        // Extract the actual prompt from the search string
        const promptMatch = filters.search.match(/🔍 ai search:\s*["']?(.+?)["']?$/i);
        if (promptMatch && promptMatch[1]) {
          const prompt = promptMatch[1].trim();
          console.log('[ProductsController] AI Search detected, prompt:', prompt);
          
          // Use AI search service to parse the prompt
          const AISearchService = (await import('@/services/aiSearch.service')).default;
          const aiFilters = await AISearchService.parseNaturalLanguageQuery(prompt);
          
          console.log('[ProductsController] AI Filters derived:', aiFilters);
          
          // Merge AI filters with existing filters
          filters = { ...filters, ...aiFilters };
          // Remove the AI search prefix from search term
          if (aiFilters.search) {
            filters.search = aiFilters.search;
          } else {
            delete filters.search;
          }
        }
      }
      
      // SIMPLE E-RENTAL LOGIC: Always return only approved (active) products for public
      // This ensures only admin-approved products are visible in the marketplace
      // Admins should use /admin/products endpoint to see all products
      if (!filters.status) {
        filters.status = 'active';
      }
      
      console.log('[ProductsController] Filters applied:', filters, 'page:', page, 'limit:', limit);
      
      // Optional: Get user ID if authenticated (for favorite status only)
      const userId = (req as any).user?.id;
      
      // Check cache
      const cacheKey = `products_${JSON.stringify({ filters, page, limit, userId })}`;
      const cached = productCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL.PRODUCT_LIST * 1000) {
        console.log('[ProductsController] Returning cached data');
        return this.formatPaginatedResponse(res, 'Products retrieved successfully (cached)', cached.data);
      }

      // Convert filters to query format
      const query = convertFiltersToQuery(filters);
      console.log('[ProductsController] Query object:', query);
      
      // Check database connection first
      try {
        const { getDatabase } = await import('@/config/database');
        const db = getDatabase();
        if (!db) {
          console.error('[ProductsController] Database not initialized');
          return ResponseHelper.error(res, 'Database connection not available', 503);
        }
        console.log('[ProductsController] Database connection OK');
      } catch (dbError: any) {
        console.error('[ProductsController] Database connection check failed:', dbError);
        return ResponseHelper.error(res, 'Database connection error: ' + (dbError?.message || 'Unknown error'), 503);
      }
      
      // Fetch products from database
      console.log('[ProductsController] Starting database query...');
      const queryStartTime = Date.now();
      
      let result;
      try {
        const { sort, sortOrder } = filters;
        result = await ProductService.getPaginated(query, page, limit, sort, sortOrder);
        const queryTime = Date.now() - queryStartTime;
        console.log('[ProductsController] Database query completed in', queryTime, 'ms');
      } catch (queryError: any) {
        const queryTime = Date.now() - queryStartTime;
        console.error('[ProductsController] Database query failed after', queryTime, 'ms:', queryError);
        return ResponseHelper.error(res, 'Database query failed: ' + (queryError?.message || 'Unknown error'), 500);
      }
      
      if (!result || !result.success) {
        console.error('[ProductsController] Query returned error:', result?.error);
        return ResponseHelper.error(res, result?.error || 'Failed to fetch products', 500);
      }
      
      if (!result.data) {
        console.warn('[ProductsController] No data returned from query');
        // Return empty result instead of error
        const emptyResult = {
          data: [],
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        };
        return this.formatPaginatedResponse(res, 'No products found', emptyResult);
      }

      console.log('[ProductsController] Products fetched:', result.data.data?.length || 0);

      // Add favorite status if user is authenticated
      let enhancedData = result.data;
      if (enhancedData.data && Array.isArray(enhancedData.data) && userId) {
        console.log('[ProductsController] Enhancing with favorite status for user:', userId);
        const enhancedProducts = await FavoriteEnhancer.enhanceProducts(enhancedData.data, userId);
        enhancedData = {
          ...enhancedData,
          data: enhancedProducts
        };
      }

      // Cache the result
      productCache.set(cacheKey, {
        data: enhancedData,
        timestamp: Date.now()
      });

      const totalTime = Date.now() - startTime;
      console.log('[ProductsController] Request completed in', totalTime, 'ms');
      
      return this.formatPaginatedResponse(res, 'Products retrieved successfully', enhancedData);
    } catch (error: any) {
      const totalTime = Date.now() - startTime;
      console.error('[ProductsController] Error in getProducts after', totalTime, 'ms:', error);
      const errorMessage = error?.message || 'Internal server error';
      
      if (errorMessage.includes('timeout')) {
        return ResponseHelper.error(res, 'Request timeout - database may be slow or unavailable', 504);
      }
      
      if (errorMessage.includes('Database') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('not initialized')) {
        return ResponseHelper.error(res, 'Database connection error. Please check your database configuration.', 503);
      }
      
      return ResponseHelper.error(res, errorMessage, 500);
    }
  });

  /**
   * AI-Powered Product Search
   * GET /api/v1/products/ai-search
   */
  public searchByAI = this.asyncHandler(async (req: Request, res: Response) => {
    const { prompt } = req.query;
    if (!prompt || typeof prompt !== 'string') {
      return ResponseHelper.error(res, 'Prompt is required', 400);
    }

    try {
      const AISearchService = (await import('@/services/aiSearch.service')).default;
      
      // 1. Parse prompt into filters
      const aiFilters = await AISearchService.parseNaturalLanguageQuery(prompt);
      
      console.log('[ProductsController] AI Filters derived:', aiFilters);

      // 2. Normalize and combine with defaults
      const filters = normalizeProductFilters({ ...aiFilters });
      if (!filters.status) filters.status = 'active'; // Public search only shows active

      // 3. Convert to query
      const query = convertFiltersToQuery(filters);
      
      // 4. Execute Search
      const { page, limit } = this.getPaginationParams(req);
      const result = await ProductService.getPaginated(query, page, limit);

      if (!result.success) {
        return ResponseHelper.error(res, result.error || 'Search failed', 500);
      }

      // 5. Enhance with metadata about the AI interpretation
      const responseData = {
        ...result.data,
        aiInterpretation: {
          originalPrompt: prompt,
          derivedFilters: aiFilters
        }
      };

      return this.formatPaginatedResponse(res, 'AI Search results', responseData);

    } catch (error: any) {
      console.error('[ProductsController] AI Search error:', error);
      return ResponseHelper.error(res, 'AI Search failed', 500);
    }
  });

  /**
   * High-performance single product retrieval with favorite status
   * GET /api/v1/products/:id
   */
  public getProduct = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    // Check if user is authenticated for favorite status
    const userId = (req as any).user?.id;
    
    // Performance: Check cache first (include userId for personalized caching)
    const cacheKey = `product_${id}_${userId || 'anonymous'}`;
    const cached = productCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL.PRODUCT_DETAILS * 1000) {
      return ResponseHelper.success(res, 'Product retrieved successfully (cached)', cached.data);
    }

    const result = await ProductService.getById(id);
    if (!result.success || !result.data) {
      return ResponseHelper.error(res, result.error || 'Product not found', 404);
    }

    // Automatically restore past unavailable dates (non-blocking)
    ProductAvailabilityService.restorePastUnavailableDates().catch(err => {
      console.error('Error restoring past unavailable dates (non-blocking):', err);
    });

    // Enhance product with favorite status
    const enhancedProduct = await FavoriteEnhancer.enhanceProduct(result.data, userId);

    // Cache the result
    productCache.set(cacheKey, {
      data: enhancedProduct,
      timestamp: Date.now()
    });

    return ResponseHelper.success(res, 'Product retrieved successfully', enhancedProduct);
  });

  /**
   * Optimized product update with selective field updates
   * PUT /api/v1/products/:id
   */
  public updateProduct = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;
    
    const { id } = req.params;
    const user_id = req.user.id;

    // Performance: Parallel authorization and update preparation
    const [product_result, update_data] = await Promise.all([
      ProductService.getById(id),
      this.prepareUpdateData(req.body)
    ]);

    if (!product_result.success || !product_result.data) {
      return this.handleNotFound(res, 'Product');
    }

    if (!this.checkResourceOwnership(req, product_result.data.owner_id)) {
      return this.handleUnauthorized(res, 'Not authorized');
    }

    const updated_product = await ProductService.update(id, update_data);
    if (!updated_product.success) {
      return ResponseHelper.error(res, updated_product.error || 'Failed to update product', 400);
    }

    // Performance: Invalidate related caches
    this.invalidateProductCaches(product_result.data.owner_id, id);

    this.logAction('UPDATE_PRODUCT', user_id, id, update_data);
    return ResponseHelper.success(res, 'Product updated successfully', updated_product.data);
  });

  /**
   * Optimized product deletion (soft delete)
   * DELETE /api/v1/products/:id
   */
  public deleteProduct = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user_id = req.user.id;

    // Performance: Get product ownership info only
    const product_result = await ProductService.getById(id);
    if (!product_result.success || !product_result.data) {
      return this.handleNotFound(res, 'Product');
    }

    if (!this.checkResourceOwnership(req, product_result.data.owner_id)) {
      return this.handleUnauthorized(res, 'Not authorized to delete this product');
    }

    // Performance: Direct status update
    const deleted_product = await ProductService.update(id, { status: 'inactive' });
    
    // Performance: Invalidate caches
    this.invalidateProductCaches(product_result.data.owner_id, id);

    this.logAction('DELETE_PRODUCT', user_id, id);
    return ResponseHelper.success(res, 'Product deleted successfully', deleted_product.data);
  });

  /**
   * Optimized user products with filtering
   * GET /api/v1/products/my-products
   */
  public getUserProducts = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user_id = req.user.id;
    const { page, limit } = this.getPaginationParams(req as any);
    const status = req.query.status as ProductFilters['status'];

    // Performance: Generate cache key
    const cacheKey = `user_products_${user_id}_${status || 'all'}_${page}_${limit}`;
    const cached = productCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL.PRODUCT_LIST * 1000) {
      return this.formatPaginatedResponse(res, 'User products retrieved successfully (cached)', cached.data);
    }

    // Transform to optimized query
    const query: Partial<ProductData> = { owner_id: user_id };
    if (status && VALID_STATUSES.has(status)) {
      query.status = status;
    }

    const result = await ProductService.getPaginated(query, page, limit);

    // Automatically restore past unavailable dates (non-blocking)
    ProductAvailabilityService.restorePastUnavailableDates().catch(err => {
      console.error('Error restoring past unavailable dates (non-blocking):', err);
    });

    this.logAction('GET_USER_PRODUCTS', user_id);

    if (!result.success || !result.data) {
      return ResponseHelper.error(res, result.error || 'Failed to fetch user products', 400);
    }

    // Cache the result
    productCache.set(cacheKey, {
      data: result.data,
      timestamp: Date.now()
    });

    return this.formatPaginatedResponse(res, 'User products retrieved successfully', result.data);
  });

  /**
   * High-performance availability checking with caching
   * GET /api/v1/products/:id/availability
   */
  public checkAvailability = this.asyncHandler(async (req: OptionalAuthRequest, res: Response) => {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return this.handleBadRequest(res, 'Start date and end date are required');
    }

    // Performance: Check availability cache
    const cacheKey = `availability_${id}_${start_date}_${end_date}`;
    const cached = availabilityCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL.AVAILABILITY * 1000) {
      return ResponseHelper.success(res, 'Availability checked successfully (cached)', cached.data);
    }

    const product_result = await ProductService.getById(id);
    if (!product_result.success || !product_result.data) {
      return this.handleNotFound(res, 'Product');
    }

    // Automatically restore past unavailable dates before fetching (non-blocking)
    ProductAvailabilityService.restorePastUnavailableDates().catch(err => {
      console.error('Error restoring past unavailable dates (non-blocking):', err);
    });

    // Fetch actual availability records from database
    const db = getDatabase();
    const availabilityRecords = await db('product_availability')
      .where({ product_id: id })
      .whereBetween('date', [start_date as string, end_date as string])
      .select('id', 'product_id', 'date', 'availability_type', 'price_override', 'notes', 'created_at')
      .orderBy('date', 'asc');

    // Format availability records to match frontend expectations
    const availability = availabilityRecords.map((record: any) => ({
      id: record.id,
      product_id: record.product_id,
      date: record.date,
      availability_type: record.availability_type,
      price_override: record.price_override,
      notes: record.notes,
      created_at: record.created_at
    }));

    // Cache the result
    availabilityCache.set(cacheKey, {
      data: availability,
      timestamp: Date.now()
    });

    this.logAction('CHECK_AVAILABILITY', req.user?.id || 'anonymous', id, { start_date, end_date });

    return ResponseHelper.success(res, 'Availability checked successfully', availability);
  });

  /**
   * Optimized image upload with batch processing
   * POST /api/v1/products/:id/images
   */
  public uploadImages = this.asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
    const { id } = req.params;
    const user_id = req.user.id;

    // Performance: Parallel product validation and file processing
    const [product_result] = await Promise.all([
      ProductService.getById(id),
    ]);

    if (!product_result.success || !product_result.data) {
      return this.handleNotFound(res, 'Product');
    }

    if (!this.checkResourceOwnership(req, product_result.data.owner_id)) {
      return this.handleUnauthorized(res, 'Not authorized to update this product');
    }

    const filesReq = req as any;
    const files = Array.isArray(filesReq.files) ? filesReq.files : [];
    if (files.length === 0) {
      return this.handleBadRequest(res, 'No image files provided');
    }

    // Performance: Optimized image processing
    const uploaded_images = this.processUploadedImages(files, id);

    // Performance: Invalidate product cache
    this.invalidateProductCaches(product_result.data.owner_id, id);

    this.logAction('UPLOAD_PRODUCT_IMAGES', user_id, id, { image_count: files.length });

    return ResponseHelper.success(res, 'Images uploaded successfully', { images: uploaded_images });
  });

  /**
   * Optimized product analytics with caching
   * GET /api/v1/products/:id/analytics
   */
  public getProductAnalytics = this.asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
    const { id } = req.params;
    const user_id = req.user.id;

    // Performance: Check analytics cache
    const cacheKey = `analytics_${id}`;
    const cached = analyticsCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL.ANALYTICS * 1000) {
      return ResponseHelper.success(res, 'Product analytics retrieved successfully (cached)', cached.data);
    }

    const product_result = await ProductService.getById(id);
    if (!product_result.success || !product_result.data) {
      return this.handleNotFound(res, 'Product');
    }

    if (!this.checkResourceOwnership(req, product_result.data.owner_id)) {
      return this.handleUnauthorized(res, 'Not authorized to view analytics for this product');
    }

    // Performance: Calculate analytics efficiently
    const analytics = await this.calculateProductAnalytics(id);

    // Cache the result
    analyticsCache.set(cacheKey, {
      data: analytics,
      timestamp: Date.now()
    });

    this.logAction('GET_PRODUCT_ANALYTICS', user_id, id);

    return ResponseHelper.success(res, 'Product analytics retrieved successfully', analytics);
  });

  /**
   * High-performance product search with relevance scoring
   * POST /api/v1/products/search
   */
  public searchProducts = this.asyncHandler(async (req: OptionalAuthRequest, res: Response): Promise<Response | void> => {
    const { page, limit } = this.getPaginationParams(req);
    const search_criteria = req.body;

    // Performance: Generate search cache key
    const cacheKey = `search_${JSON.stringify({ search_criteria, page, limit })}`;
    const cached = productCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL.PRODUCT_LIST * 1000) {
      return this.formatPaginatedResponse(res, 'Search completed successfully (cached)', cached.data);
    }

    // Performance: Execute optimized search
    const results = await this.executeOptimizedSearch(search_criteria, page, limit);

    // Cache the result
    productCache.set(cacheKey, {
      data: results,
      timestamp: Date.now()
    });

    this.logAction('SEARCH_PRODUCTS', req.user?.id || 'anonymous', undefined, search_criteria);

    return this.formatPaginatedResponse(res, 'Search completed successfully', results);
  });

  /**
   * AI-powered image search - Find similar products by image
   * POST /api/v1/products/search-by-image
   * Similar to Alibaba.com's image search functionality
   */
  public searchByImage = this.asyncHandler(async (req: OptionalAuthRequest, res: Response): Promise<Response | void> => {
    const { page = 1, limit = 20, threshold = 0.3, category_id, category_boost } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 50); // Max 50 results
    // Lower default threshold (0.3 instead of 0.5) to find more similar products
    // This ensures exact matches and very similar products are returned
    const similarityThreshold = parseFloat(threshold as string) || 0.3;
    
    // Category filtering options
    // category_boost: Boost products in same category (default: true)
    // category_id: Optional filter to specific category
    const enableCategoryBoost = category_boost !== 'false'; // Default: true
    const categoryFilter = category_id as string | undefined;

    // Get image from request (either file upload or URL)
    let imageUrl: string | undefined;
    let imageBuffer: Buffer | undefined;

    const filesReq = req as any;
    const crypto = require('crypto');
    
    if (filesReq.file) {
      // Image uploaded as file
      const fs = require('fs');
      const filePath = filesReq.file.path;
      console.log(`📤 Image upload received:`);
      console.log(`   - File path: ${filePath}`);
      console.log(`   - Original name: ${filesReq.file.originalname}`);
      console.log(`   - File size: ${filesReq.file.size} bytes`);
      
      // Read the file
      const buffer = fs.readFileSync(filePath);
      
      // Verify buffer is not empty
      if (!buffer || buffer.length === 0) {
        return this.handleBadRequest(res, 'Uploaded image file is empty or invalid');
      }
      
      imageBuffer = buffer;
      
      // Calculate hash to verify each image is unique
      const imageHash = crypto.createHash('sha256').update(buffer).digest('hex');
      console.log(`   - Image hash: ${imageHash.substring(0, 32)}...`);
      console.log(`   - Buffer size: ${buffer.length} bytes`);
      
      // Clean up uploaded file after reading (optional, to save disk space)
      try {
        fs.unlinkSync(filePath);
        console.log(`   - Temporary file cleaned up: ${filePath}`);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    } else if (req.body.image_url) {
      // Image provided as URL
      imageUrl = req.body.image_url;
      console.log(`📤 Image URL received: ${imageUrl}`);
      
      // Calculate hash of URL for logging
      const urlHash = crypto.createHash('sha256').update(imageUrl).digest('hex');
      console.log(`   - URL hash: ${urlHash.substring(0, 32)}...`);
    } else {
      return this.handleBadRequest(res, 'Please provide an image file or image_url');
    }

    try {
      // Use production-grade image search service (Alibaba.com approach)
      const imageSearchService = (await import('../services/imageSearch.service')).default;
      
      console.log(`🔍 Starting image search with:`);
      console.log(`   - Image type: ${imageBuffer ? 'Buffer' : 'URL'}`);
      console.log(`   - Threshold: ${similarityThreshold}`);
      console.log(`   - Page: ${pageNum}, Limit: ${limitNum}`);
      
      // DISABLE CACHING to ensure fresh results for each image
      if (!imageBuffer && !imageUrl) {
        return this.handleBadRequest(res, 'No image provided');
      }
      
      const searchResults = await imageSearchService.searchByImage(
        imageBuffer || imageUrl!,
        {
          threshold: similarityThreshold,
          page: pageNum,
          limit: limitNum,
          enableCaching: false, // DISABLED: Force fresh search for each image
          cacheTTL: 3600,
          categoryBoost: enableCategoryBoost,
          categoryFilter: categoryFilter
        }
      );
      
      console.log(`✅ Image search completed:`);
      console.log(`   - Results found: ${searchResults.items.length}`);
      console.log(`   - Cache hit: ${searchResults.metadata.cache_hit}`);
      console.log(`   - Processing time: ${searchResults.metadata.processing_time_ms}ms`);

      this.logAction('SEARCH_BY_IMAGE', req.user?.id || 'anonymous', undefined, {
        results_count: searchResults.items.length,
        threshold: similarityThreshold,
        processing_time_ms: searchResults.metadata.processing_time_ms,
        cache_hit: searchResults.metadata.cache_hit,
        match_distribution: searchResults.metadata.match_distribution
      });

      // Format response to match frontend expectations
      // Frontend expects: { success: true, data: { items: [...], pagination: {...}, search_metadata: {...} } }
      return ResponseHelper.success(res, 'Image search completed successfully', {
        items: searchResults.items, // Frontend expects 'items' not 'data'
        pagination: {
          page: searchResults.pagination.page,
          limit: searchResults.pagination.limit,
          total: searchResults.pagination.total,
          totalPages: searchResults.pagination.totalPages,
          hasNext: searchResults.pagination.page < searchResults.pagination.totalPages,
          hasPrev: searchResults.pagination.page > 1
        },
        search_metadata: {
          threshold: similarityThreshold,
          processing_time_ms: searchResults.metadata.processing_time_ms,
          cache_hit: searchResults.metadata.cache_hit,
          match_distribution: searchResults.metadata.match_distribution,
          query_features_dimension: searchResults.metadata.query_features_dimension
        }
      });
    } catch (error) {
      console.error('Image search error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return ResponseHelper.error(res, `Image search failed: ${errorMessage}`, 500);
    }
  });


  /**
   * Optimized product reviews retrieval
   * GET /api/v1/products/:id/reviews
   */
  public getProductReviews = this.asyncHandler(async (req: OptionalAuthRequest, res: Response) => {
    const { id } = req.params;
    const { page, limit } = this.getPaginationParams(req);

    const product_result = await ProductService.getById(id);
    if (!product_result.success || !product_result.data) {
      return this.handleNotFound(res, 'Product');
    }

    // Performance: Use database for reviews instead of mock
    const reviews = await this.fetchProductReviews(id, page, limit);

    this.logAction('GET_PRODUCT_REVIEWS', req.user?.id || 'anonymous', id);

    return this.formatPaginatedResponse(res, 'Product reviews retrieved successfully', reviews);
  });

  // === PRIVATE HELPER METHODS ===

  /**
   * Prepare update data efficiently
   */
  private async prepareUpdateData(body: any): Promise<UpdateProductData> {
    const update_data: UpdateProductData = {};
    
    // Performance: Direct assignment for defined values only
    if (body.title !== undefined) update_data.title = body.title;
    if (body.description !== undefined) update_data.description = body.description;
    if (body.condition !== undefined) update_data.condition = body.condition;
    if (body.status !== undefined) update_data.status = body.status;
    // Newly supported fields for update
    if (body.brand !== undefined) (update_data as any).brand = body.brand;
    if (body.model !== undefined) (update_data as any).model = body.model;
    if (body.year_manufactured !== undefined) (update_data as any).year_manufactured = body.year_manufactured;
    if (body.address_line !== undefined) (update_data as any).address_line = body.address_line;
    if (body.delivery_fee !== undefined) (update_data as any).delivery_fee = (body.delivery_fee === '' ? 0 : body.delivery_fee);
    if (body.included_accessories !== undefined) (update_data as any).included_accessories = body.included_accessories;
    if (body.country_id !== undefined) (update_data as any).country_id = body.country_id;
    if (body.category_id !== undefined) (update_data as any).category_id = body.category_id;
    if (body.pickup_methods !== undefined) (update_data as any).pickup_methods = body.pickup_methods;
    if (body.pickup_available !== undefined) (update_data as any).pickup_available = body.pickup_available;
    if (body.delivery_available !== undefined) (update_data as any).delivery_available = body.delivery_available;
    if (body.location !== undefined) (update_data as any).location = body.location;
    
    // Handle features array update
    if (body.features && Array.isArray(body.features)) {
      const current_product = await ProductService.getById(body.id); // Fetch current product to get existing features
      let currentFeatures: string[] = [];
      if (current_product.success && current_product.data && Array.isArray(current_product.data.features)) {
        currentFeatures = current_product.data.features;
      }
      update_data.features = [...new Set([...(currentFeatures), ...body.features])]; // Merge and remove duplicates
    }

    // Pricing fields are managed via product_prices; ignore legacy product-level pricing updates

    return update_data;
  }

  /**
   * Calculate availability efficiently
   */
  private calculateAvailability(_product: any, start_date: string, end_date: string) {
    // Pricing now comes from product_prices; fall back to 0 for availability preview
    const base_price = 0;
    const start_date_obj = new Date(start_date);
    const end_date_obj = new Date(end_date);
    const total_days = Math.max(1, Math.ceil((end_date_obj.getTime() - start_date_obj.getTime()) / (1000 * 60 * 60 * 24)));
    
    const subtotal = base_price * total_days;
    const platform_fee = subtotal * 0.1;
    const tax_amount = subtotal * 0.08;
    const total_amount = subtotal + platform_fee + tax_amount;

    return {
      is_available: true,
      available_dates: [],
      unavailable_dates: [],
      pricing: {
        base_price,
        total_days,
        subtotal,
        platform_fee,
        tax_amount,
        insurance_fee: 0,
        total_amount
      }
    };
  }

  /**
   * Process uploaded images efficiently
   */
  private processUploadedImages(files: any[], product_id: string) {
    const timestamp = Date.now();
    return files.map((file: any, index: number) => ({
      id: `img_${product_id}_${timestamp}_${index}`,
      url: `/uploads/products/${product_id}/${file.filename}`,
      alt_text: file.originalname,
      is_primary: index === 0,
      order: index
    }));
  }

  /**
   * Calculate product analytics efficiently
   */
  private async calculateProductAnalytics(product_id: string) {
    const db = require('@/config/database').getDatabase();
    
    // Performance: Single query with aggregations
    const [views, bookings] = await Promise.all([
      db('product_views').count('* as count').where({ product_id: product_id }).first(),
      db('bookings')
        .select(
          db.raw('COUNT(*) as booking_count'),
          db.raw('SUM(total_amount) as revenue'),
          db.raw('AVG(rating) as rating')
        )
        .where({ product_id: product_id })
        .first()
    ]);

    return {
      views: views?.count || 0,
      bookings: bookings?.booking_count || 0,
      revenue: bookings?.revenue || 0,
      rating: bookings?.rating || 0,
      views_over_time: [], // Could be populated with time-series data
      bookings_over_time: []
    };
  }

  /**
   * Execute optimized search
   */
  private async executeOptimizedSearch(criteria: any, page: number, limit: number) {
    // Performance: Mock optimized search implementation
    // In production, this would use the criteria for advanced filtering
    const search_metrics = {
      criteria_used: Object.keys(criteria).length,
      search_type: 'optimized'
    };
    
    return {
      data: [],
      page,
      limit,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
      search_metrics
    };
  }

  /**
   * Fetch product reviews efficiently
   */
  private async fetchProductReviews(product_id: string, page: number, limit: number) {
    const db = require('@/config/database').getDatabase();
    
    // Get reviews for this product by joining with bookings
    const [reviews, total_count] = await Promise.all([
      db('reviews')
        .select(
          'reviews.id',
          'reviews.reviewer_id as user_id',
          'reviews.overall_rating as rating',
          'reviews.comment',
          'reviews.title',
          'reviews.created_at'
        )
        .join('bookings', 'reviews.booking_id', 'bookings.id')
        .where('bookings.product_id', product_id)
        .orderBy('reviews.created_at', 'desc')
        .limit(limit)
        .offset((page - 1) * limit),
      
      db('reviews')
        .count('reviews.id as count')
        .join('bookings', 'reviews.booking_id', 'bookings.id')
        .where('bookings.product_id', product_id)
        .first()
    ]);

    return {
      data: reviews,
      page,
      limit,
      total: total_count?.count || 0,
      totalPages: Math.ceil((total_count?.count || 0) / limit),
      hasNext: page * limit < (total_count?.count || 0),
      hasPrev: page > 1
    };
  }

  /**
   * Invalidate product-related caches
   */
  private invalidateProductCaches(owner_id?: string, product_id?: string): void {
    const keys_to_delete = Array.from(productCache.keys()).filter(key => {
      if (product_id && key.includes(product_id)) return true;
      if (owner_id && key.includes(owner_id)) return true;
      if (key.startsWith('products_') || key.startsWith('user_products_')) return true;
      return false;
    });
    
    for (const key of keys_to_delete) {
      productCache.delete(key);
    }

    // Also clear availability cache for the product
    if (product_id) {
      const availability_keys = Array.from(availabilityCache.keys()).filter(key => 
        key.includes(product_id)
      );
      for (const key of availability_keys) {
        availabilityCache.delete(key);
      }
    }
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(cache: Map<string, { data: any; timestamp: number }>, ttlSeconds: number): void {
    const now = Date.now();
    const expiredKeys = Array.from(cache.entries())
      .filter(([_, entry]) => (now - entry.timestamp) > ttlSeconds * 1000)
      .map(([key]) => key);
    
    for (const key of expiredKeys) {
      cache.delete(key);
    }
  }

  /**
   * Remove product from market for specific dates
   * POST /api/v1/products/:id/remove-from-market
   */
  public removeFromMarket = this.asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
    const { id: productId } = req.params;
    const { dates, reason } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return this.handleBadRequest(res, 'Dates array is required and must not be empty');
    }

    // Verify product exists and user owns it
    const productResult = await ProductService.getById(productId);
    if (!productResult.success || !productResult.data) {
      return this.handleNotFound(res, 'Product');
    }

    if (!this.checkResourceOwnership(req, productResult.data.owner_id)) {
      return this.handleUnauthorized(res, 'Not authorized to modify this product');
    }

    const db = getDatabase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validate dates and check for bookings
    const invalidDates: string[] = [];
    const bookedDates: string[] = [];

    for (const dateStr of dates) {
      // Validate date format
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        invalidDates.push(dateStr);
        continue;
      }

      // Check if date is in the past
      date.setHours(0, 0, 0, 0);
      if (date < today) {
        invalidDates.push(dateStr);
        continue;
      }

      // Check for bookings or in-progress sessions on this date
      const conflictingBookings = await db('bookings')
        .where({ product_id: productId })
        .whereIn('status', ['confirmed', 'in_progress', 'pending'])
        .where(function() {
          this.whereRaw('DATE(start_date) <= ?', [dateStr])
              .andWhereRaw('DATE(end_date) >= ?', [dateStr]);
        })
        .first();

      if (conflictingBookings) {
        bookedDates.push(dateStr);
        continue;
      }

      // Check for in-progress handover sessions on this date
      const conflictingHandover = await db('handover_sessions')
        .where({ product_id: productId })
        .whereIn('status', ['scheduled', 'in_progress'])
        .whereRaw('DATE(scheduled_date_time) = ?', [dateStr])
        .first();

      if (conflictingHandover) {
        bookedDates.push(dateStr);
        continue;
      }

      // Check for in-progress return sessions on this date
      const conflictingReturn = await db('return_sessions')
        .where({ product_id: productId })
        .whereIn('status', ['scheduled', 'in_progress'])
        .whereRaw('DATE(scheduled_date_time) = ?', [dateStr])
        .first();

      if (conflictingReturn) {
        bookedDates.push(dateStr);
        continue;
      }
    }

    if (invalidDates.length > 0) {
      return ResponseHelper.error(res, `Invalid or past dates: ${invalidDates.join(', ')}`, 400);
    }

    if (bookedDates.length > 0) {
      return ResponseHelper.error(
        res,
        `Cannot remove dates with bookings, handover sessions, or return sessions: ${bookedDates.join(', ')}`,
        400
      );
    }

    // Remove product from market for valid dates
    const notes = reason || 'owner_removed';
    const results = [];

    for (const dateStr of dates) {
      try {
        // Check if availability record exists
        const existing = await db('product_availability')
          .where({ product_id: productId, date: dateStr })
          .first();

        if (existing) {
          // Update existing record
          await db('product_availability')
            .where({ product_id: productId, date: dateStr })
            .update({
              availability_type: 'unavailable',
              notes: notes
            });
        } else {
          // Create new record
          await db('product_availability').insert({
            id: uuidv4(),
            product_id: productId,
            date: dateStr,
            availability_type: 'unavailable',
            notes: notes,
            created_at: new Date()
          });
        }

        results.push({ date: dateStr, status: 'removed' });
      } catch (error: any) {
        console.error(`Error removing date ${dateStr} from market:`, error);
        results.push({ date: dateStr, status: 'error', error: error.message });
      }
    }

    // Automatically restore any past unavailable dates before invalidating cache
    ProductAvailabilityService.restorePastUnavailableDates().catch(err => {
      console.error('Error restoring past unavailable dates (non-blocking):', err);
    });

    // Invalidate caches
    this.invalidateProductCaches(productResult.data.owner_id, productId);

    this.logAction('REMOVE_FROM_MARKET', userId, productId, { dates, reason });

    return ResponseHelper.success(
      res,
      `Product removed from market for ${results.filter(r => r.status === 'removed').length} date(s)`,
      { results }
    );
  });

  /**
   * Restore product to market for specific dates
   * POST /api/v1/products/:id/restore-to-market
   */
  public restoreToMarket = this.asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
    const { id: productId } = req.params;
    const { dates } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return this.handleBadRequest(res, 'Dates array is required and must not be empty');
    }

    // Verify product exists and user owns it
    const productResult = await ProductService.getById(productId);
    if (!productResult.success || !productResult.data) {
      return this.handleNotFound(res, 'Product');
    }

    if (!this.checkResourceOwnership(req, productResult.data.owner_id)) {
      return this.handleUnauthorized(res, 'Not authorized to modify this product');
    }

    const db = getDatabase();
    const results = [];

    for (const dateStr of dates) {
      try {
        // Check if availability record exists
        const existing = await db('product_availability')
          .where({ product_id: productId, date: dateStr })
          .first();

        if (existing && existing.availability_type === 'unavailable') {
          // Delete the record to restore availability (or set to available)
          // We'll set it to 'available' instead of deleting to maintain history
          await db('product_availability')
            .where({ product_id: productId, date: dateStr })
            .update({
              availability_type: 'available',
              notes: 'restored_by_owner'
            });

          results.push({ date: dateStr, status: 'restored' });
        } else if (existing) {
          // Already available or has other status
          results.push({ date: dateStr, status: 'already_available' });
        } else {
          // No record exists, product is already available
          results.push({ date: dateStr, status: 'already_available' });
        }
      } catch (error: any) {
        console.error(`Error restoring date ${dateStr} to market:`, error);
        results.push({ date: dateStr, status: 'error', error: error.message });
      }
    }

    // Automatically restore any past unavailable dates before invalidating cache
    ProductAvailabilityService.restorePastUnavailableDates().catch(err => {
      console.error('Error restoring past unavailable dates (non-blocking):', err);
    });

    // Invalidate caches
    this.invalidateProductCaches(productResult.data.owner_id, productId);

    this.logAction('RESTORE_TO_MARKET', userId, productId, { dates });

    return ResponseHelper.success(
      res,
      `Product restored to market for ${results.filter(r => r.status === 'restored').length} date(s)`,
      { results }
    );
  });
}

export default new ProductsController();
