import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import ProductService from '@/services/ProductService';
import UserVerificationService from '@/services/userVerification.service';
import { 
  AuthenticatedRequest,
  CreateProductData,
  UpdateProductData,
  ProductFilters,
  ProductData
} from '@/types';
import { ResponseHelper } from '@/utils/response';

// Define OptionalAuthRequest for endpoints that may or may not require auth
interface OptionalAuthRequest extends Request {
  user?: any;
}

export class ProductsController extends BaseController {
  /**
   * Create new product
   * POST /api/v1/products
   */
  public createProduct = this.asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
    if (this.handleValidationErrors(req as any, res)) return;
    const ownerId = req.user.id;
    const productData: CreateProductData = req.body;
    
    // Map old condition values to new enum values for backward compatibility
    if (productData.condition) {
      const conditionMapping: Record<string, string> = {
        'used': 'good',          // Map old 'used' to 'good'
        'refurbished': 'like_new' // Map old 'refurbished' to 'like_new'
      };
      
      if (conditionMapping[productData.condition]) {
        console.log(`[DEBUG] Mapping old condition value "${productData.condition}" to "${conditionMapping[productData.condition]}"`);
        productData.condition = conditionMapping[productData.condition];
      }
    }

    // Enforce KYC: Only fully verified users can create products
    const isVerified = await UserVerificationService.isUserFullyKycVerified(ownerId);
    if (!isVerified) {
      return ResponseHelper.error(res, 'You must complete KYC verification to create a product.', 403);
    }

    const created = await ProductService.create(productData, ownerId);
    if (!created.success) {
      return ResponseHelper.error(res, created.error || 'Failed to create product', 400);
    }
    this.logAction('CREATE_PRODUCT', ownerId, created.data?.id, productData);
    return ResponseHelper.success(res, 'Product created successfully', created.data, 201);
  });

  /**
   * Get products with search and filters
   * GET /api/v1/products
   */
  public getProducts = this.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = this.getPaginationParams(req);
    const filters: ProductFilters = {
      search: req.query.search as string,
      category: req.query.category as any,
      countryId: req.query.countryId as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      currency: req.query.currency as string,
      condition: req.query.condition as ProductFilters['condition'],
      status: req.query.status as ProductFilters['status'],
      ownerId: req.query.ownerId as string
    };
    if (req.query.lat && req.query.lng) {
      filters.location = {
        lat: parseFloat(req.query.lat as string),
        lng: parseFloat(req.query.lng as string),
        radius: parseFloat(req.query.radius as string) || 10
      };
    }
    Object.keys(filters).forEach(key =>
      filters[key as keyof ProductFilters] === undefined && delete filters[key as keyof ProductFilters]
    );
    // Transform ProductFilters to Partial<ProductData> for service compatibility
    const query: Partial<ProductData> = {};
    if (filters.ownerId) query.ownerId = filters.ownerId;
    if (filters.category) query.categoryId = filters.category;
    if (filters.status) query.status = filters.status;
    if (filters.condition) query.condition = filters.condition;
    if (filters.search) query.title = filters.search;
    if (filters.countryId) query.location = { ...query.location, countryId: filters.countryId } as any;
    if (filters.location) {
      // Only add lat/lng if needed for your search logic
      query.location = {
        ...query.location,
        latitude: filters.location.lat,
        longitude: filters.location.lng,
        // Add other required ProductLocation fields as needed
        address: '',
        city: '',
        countryId: filters.countryId || ''
      };
    }
    // For paginated responses:
    const result = await ProductService.getPaginated(query, page, limit);
    if (!result.success || !result.data) {
      return ResponseHelper.error(res, result.error || 'Failed to fetch products', 400);
    }
    return this.formatPaginatedResponse(res, 'Products retrieved successfully', result.data);
  });

  /**
   * Get single product by ID
   * GET /api/v1/products/:id
   */
  public getProduct = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ProductService.getById(id);
    if (!result.success || !result.data) {
      return ResponseHelper.error(res, result.error || 'Product not found', 404);
    }
    return ResponseHelper.success(res, 'Product retrieved successfully', result.data);
  });

  /**
   * Update product
   * PUT /api/v1/products/:id
   */
  public updateProduct = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;
    const { id } = req.params;
    const userId = req.user.id;
    const productResult = await ProductService.getById(id);
    if (!productResult.success || !productResult.data) {
      return this.handleNotFound(res, 'Product');
    }
    if (!this.checkResourceOwnership(req, productResult.data.ownerId)) {
      return this.handleUnauthorized(res, 'Not authorized');
    }
    const updateData: UpdateProductData = req.body;
    Object.keys(updateData).forEach(key => 
      updateData[key as keyof UpdateProductData] === undefined && delete updateData[key as keyof UpdateProductData]
    );
    const updatedProduct = await ProductService.update(id, updateData);
    this.logAction('UPDATE_PRODUCT', userId, id, updateData);
    return ResponseHelper.success(res, 'Product updated successfully', updatedProduct.data);
  });

  /**
   * Delete product
   * DELETE /api/v1/products/:id
   */
  public deleteProduct = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user.id;
    const productResult = await ProductService.getById(id);
    if (!productResult.success || !productResult.data) {
      return this.handleNotFound(res, 'Product');
    }
    if (!this.checkResourceOwnership(req, productResult.data.ownerId)) {
      return this.handleUnauthorized(res, 'Not authorized to delete this product');
    }
    const deletedProduct = await ProductService.update(id, { status: 'inactive' });
    this.logAction('DELETE_PRODUCT', userId, id);
    return ResponseHelper.success(res, 'Product deleted successfully', deletedProduct.data);
  });

  /**
   * Get user's products
   * GET /api/v1/products/my-products
   */
  public getUserProducts = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user.id;
    const { page, limit } = this.getPaginationParams(req as any);
    const status = req.query.status as ProductFilters['status'];
    // Transform to Partial<ProductData>
    const query: Partial<ProductData> = { ownerId: userId };
    if (status) query.status = status;
    const result = await ProductService.getPaginated(query, page, limit);
    this.logAction('GET_USER_PRODUCTS', userId);
    if (!result.success || !result.data) {
      return ResponseHelper.error(res, result.error || 'Failed to fetch user products', 400);
    }
    return this.formatPaginatedResponse(res, 'User products retrieved successfully', result.data);
  });

  /**
   * Check product availability
   * GET /api/v1/products/:id/availability
   */
  public checkAvailability = this.asyncHandler(async (req: OptionalAuthRequest, res: Response) => {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return this.handleBadRequest(res, 'Start date and end date are required');
    }

    const productResult = await ProductService.getById(id);
    if (!productResult.success || !productResult.data) {
      return this.handleNotFound(res, 'Product');
    }

    const basePrice = productResult.data.basePrice;
    const availability = {
      isAvailable: true,
      availableDates: [],
      unavailableDates: [],
      pricing: {
        basePrice,
        totalDays: 1,
        subtotal: basePrice,
        platformFee: basePrice * 0.1,
        taxAmount: basePrice * 0.08,
        insuranceFee: 0,
        totalAmount: basePrice * 1.18
      }
    };

    this.logAction('CHECK_AVAILABILITY', req.user?.id || 'anonymous', id, { startDate, endDate });

    return ResponseHelper.success(res, 'Availability checked successfully', availability);
  });

  /**
   * Upload product images
   * POST /api/v1/products/:id/images
   */
  public uploadImages = this.asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
    const { id } = req.params;
    const userId = req.user.id;

    const productResult = await ProductService.getById(id);
    if (!productResult.success || !productResult.data) {
      return this.handleNotFound(res, 'Product');
    }

    // Check ownership
    if (!this.checkResourceOwnership(req, productResult.data.ownerId)) {
      return this.handleUnauthorized(res, 'Not authorized to update this product');
    }

    const filesReq = req as any;
    const files = Array.isArray(filesReq.files) ? filesReq.files : [];
    if (files.length === 0) {
      return this.handleBadRequest(res, 'No image files provided');
    }

    // Mock uploaded images
    const uploadedImages = files.map((file: any, index: number) => ({
      id: `img_${id}_${Date.now()}_${index}`,
      url: `/uploads/products/${id}/${file.filename}`,
      altText: file.originalname,
      isPrimary: index === 0,
      order: index
    }));

    this.logAction('UPLOAD_PRODUCT_IMAGES', userId, id, { imageCount: files.length });

    return ResponseHelper.success(res, 'Images uploaded successfully', { images: uploadedImages });
  });

  /**
   * Get product reviews
   * GET /api/v1/products/:id/reviews
   */
  public getProductReviews = this.asyncHandler(async (req: OptionalAuthRequest, res: Response) => {
    const { id } = req.params;
    const { page, limit } = this.getPaginationParams(req);

    const productResult = await ProductService.getById(id);
    if (!productResult.success || !productResult.data) {
      return this.handleNotFound(res, 'Product');
    }

    // Mock reviews for now
    const reviews = {
      data: [],
      page,
      limit,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    };

    this.logAction('GET_PRODUCT_REVIEWS', req.user?.id || 'anonymous', id);

    return this.formatPaginatedResponse(res, 'Product reviews retrieved successfully', reviews);
  });

  /**
   * Search products with advanced filters
   * POST /api/v1/products/search
   */
  public searchProducts = this.asyncHandler(async (req: OptionalAuthRequest, res: Response): Promise<Response | void> => {
    const { page, limit } = this.getPaginationParams(req);
    const searchCriteria = req.body;

    // Mock search results for now
    const results = {
      data: [],
      page,
      limit,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    };

    // Log search for analytics
    this.logAction('SEARCH_PRODUCTS', req.user?.id || 'anonymous', undefined, searchCriteria);

    return this.formatPaginatedResponse(res, 'Search completed successfully', results);
  });

  /**
   * Get product analytics (owner only)
   * GET /api/v1/products/:id/analytics
   */
  public getProductAnalytics = this.asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
    const { id } = req.params;
    const userId = req.user.id;

    const productResult = await ProductService.getById(id);
    if (!productResult.success || !productResult.data) {
      return this.handleNotFound(res, 'Product');
    }

    // Check ownership
    if (!this.checkResourceOwnership(req, productResult.data.ownerId)) {
      return this.handleUnauthorized(res, 'Not authorized to view analytics for this product');
    }

    // Mock analytics for now
    const analytics = {
      views: 0,
      bookings: 0,
      revenue: 0,
      rating: 0,
      viewsOverTime: [],
      bookingsOverTime: []
    };

    this.logAction('GET_PRODUCT_ANALYTICS', userId, id);

    return ResponseHelper.success(res, 'Product analytics retrieved successfully', analytics);
  });
}

export default new ProductsController();
