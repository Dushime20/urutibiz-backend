/**
 * Enhanced Base Controller with Refactored Patterns
 * 
 * Implements:
 * - Cache management abstraction
 * - Validation pipeline integration
 * - Centralized error handling
 * - Method extraction patterns
 * - Consistent response formatting
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/types';
import { ResponseHelper } from '@/utils/response';
import { EntityCacheManager, CacheFactory } from '@/utils/CacheManager';
import { ValidationChain, ValidationFactory } from '@/utils/ValidationPipeline';
import { globalErrorHandler, ErrorContext } from '@/utils/ErrorHandler';
import logger from '@/utils/logger';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface SortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

/**
 * Enhanced Base Controller with refactored patterns
 */
export class EnhancedBaseController {
  protected cache: Map<string, EntityCacheManager<any>> = new Map();
  protected validationChains: Map<string, ValidationChain<any>> = new Map();

  constructor() {
    this.initializeValidationChains();
  }

  /**
   * Initialize common validation chains
   */
  protected initializeValidationChains(): void {
    this.validationChains.set('userProfile', ValidationFactory.createUserProfileValidation());
    this.validationChains.set('productCreation', ValidationFactory.createProductCreationValidation());
    this.validationChains.set('bookingCreation', ValidationFactory.createBookingCreationValidation());
  }

  /**
   * Get or create cache manager for entity type
   */
  protected getCacheManager<T>(entityType: string, ttl: number = 300): EntityCacheManager<T> {
    if (!this.cache.has(entityType)) {
      const cacheManager = CacheFactory.createEntityCache<T>(entityType, 'memory', {
        defaultTTL: ttl,
        keyPrefix: 'urutibiz'
      });
      this.cache.set(entityType, cacheManager);
    }
    return this.cache.get(entityType)!;
  }

  /**
   * Get validation chain by name
   */
  protected getValidationChain<T>(name: string): ValidationChain<T> | undefined {
    return this.validationChains.get(name) as ValidationChain<T>;
  }

  /**
   * Enhanced async handler with better error handling
   */
  protected asyncHandler(
    fn: (req: AuthenticatedRequest, res: Response, next?: NextFunction) => Promise<Response | void>
  ) {
    return (req: AuthenticatedRequest, res: Response, next?: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch((error) => {
        this.handleError(error, res, fn.name || 'unknown', {
          userId: req.user?.id,
          method: req.method,
          url: (req as any).originalUrl
        });
      });
    };
  }

  /**
   * Centralized error handling
   */
  protected handleError(
    error: unknown,
    res: Response,
    operation: string,
    context: {
      userId?: string;
      resourceId?: string;
      method?: string;
      url?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Response {
    const errorContext: ErrorContext = {
      res,
      operation,
      userId: context.userId,
      resourceId: context.resourceId,
      metadata: {
        method: context.method,
        url: context.url,
        ...context.metadata
      }
    };

    return globalErrorHandler.handle(error, errorContext);
  }

  /**
   * Validate request data using validation chain
   */
  protected async validateRequest<T>(
    validationChainName: string,
    data: T
  ): Promise<{ isValid: boolean; error?: string }> {
    const chain = this.getValidationChain<T>(validationChainName);
    
    if (!chain) {
      logger.warn(`Validation chain '${validationChainName}' not found`);
      return { isValid: true };
    }

    const result = await chain.validate(data);
    return {
      isValid: result.isValid,
      error: result.error
    };
  }

  /**
   * Get cached data or fetch using provided function
   */
  protected async getCachedOrFetch<T>(
    entityType: string,
    keyParams: Record<string, any>,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cacheManager = this.getCacheManager<T>(entityType, ttl);
    return await cacheManager.getOrFetch(keyParams, fetchFn, ttl);
  }

  /**
   * Invalidate cache for specific entity
   */
  protected async invalidateEntityCache(entityType: string, entityId: string): Promise<void> {
    const cacheManager = this.getCacheManager(entityType);
    await cacheManager.invalidateEntity(entityId);
  }

  /**
   * Extract pagination parameters with validation
   */
  protected getPaginationParams(req: Request): PaginationParams {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    
    return { page, limit };
  }

  /**
   * Extract sort parameters with validation
   */
  protected getSortParams(
    req: Request,
    defaultSortBy: string = 'created_at',
    defaultOrder: 'asc' | 'desc' = 'desc'
  ): SortParams {
    const allowedSortFields = ['created_at', 'updated_at', 'name', 'price', 'rating'];
    const allowedOrders = ['asc', 'desc'];
    
    const sortBy = allowedSortFields.includes(req.query.sortBy as string)
      ? (req.query.sortBy as string)
      : defaultSortBy;
      
    const sortOrder = allowedOrders.includes(req.query.sortOrder as string)
      ? (req.query.sortOrder as 'asc' | 'desc')
      : defaultOrder;
    
    return { sortBy, sortOrder };
  }

  /**
   * Log user action with context
   */
  protected logAction(
    action: string,
    userId: string,
    resourceId?: string,
    metadata?: Record<string, any>
  ): void {
    logger.info('User action logged', {
      action,
      userId,
      resourceId,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * Format paginated response consistently
   */
  protected formatPaginatedResponse<T>(
    res: Response,
    message: string,
    data: {
      data: T[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    }
  ): Response {
    return ResponseHelper.success(res, message, {
      items: data.data,
      pagination: {
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: data.totalPages,
        hasNext: data.hasNext,
        hasPrev: data.hasPrev
      }
    });
  }

  /**
   * Send success response with consistent format
   */
  protected sendSuccess<T>(
    res: Response,
    message: string,
    data?: T
  ): Response {
    return ResponseHelper.success(res, message, data);
  }

  /**
   * Send error response with consistent format
   */
  protected sendError(
    res: Response,
    message: string,
    statusCode: number = 400
  ): Response {
    return ResponseHelper.error(res, message, statusCode);
  }

  /**
   * Validate required fields in request body
   */
  protected validateRequiredFields(
    body: Record<string, any>,
    requiredFields: string[]
  ): { isValid: boolean; missingFields?: string[] } {
    const missingFields = requiredFields.filter(field => 
      body[field] === undefined || body[field] === null || body[field] === ''
    );

    return {
      isValid: missingFields.length === 0,
      missingFields: missingFields.length > 0 ? missingFields : undefined
    };
  }

  /**
   * Check if user has access to resource
   */
  protected async checkResourceAccess(
    userId: string,
    resourceOwnerId: string,
    userRole?: string
  ): Promise<boolean> {
    const isOwner = userId === resourceOwnerId;
    const isAdmin = userRole === 'admin';
    
    return isOwner || isAdmin;
  }

  /**
   * Extract and validate filters from query parameters
   */
  protected extractFilters<T extends Record<string, any>>(
    query: Record<string, any>,
    allowedFilters: (keyof T)[]
  ): Partial<T> {
    const filters: Partial<T> = {};
    
    for (const key of allowedFilters) {
      const value = query[key as string];
      if (value !== undefined && value !== null && value !== '') {
        filters[key] = value;
      }
    }
    
    return filters;
  }

  /**
   * Process uploaded files with validation
   */
  protected processUploadedFiles(
    files: any[],
    entityId: string,
    maxFiles: number = 10
  ): Array<{ id: string; url: string; altText: string; isPrimary: boolean; order: number }> {
    if (!files || files.length === 0) return [];
    
    const validFiles = files.slice(0, maxFiles); // Limit number of files
    const timestamp = Date.now();
    
    return validFiles.map((file: any, index: number) => ({
      id: `img_${entityId}_${timestamp}_${index}`,
      url: `/uploads/${entityId}/${file.filename}`,
      altText: file.originalname || `Image ${index + 1}`,
      isPrimary: index === 0,
      order: index
    }));
  }

  /**
   * Sanitize and prepare update data
   */
  protected prepareUpdateData<T extends Record<string, any>>(
    requestBody: Record<string, any>,
    allowedFields: (keyof T)[]
  ): Partial<T> {
    const updateData: Partial<T> = {};
    
    for (const field of allowedFields) {
      const value = requestBody[field as string];
      if (value !== undefined) {
        updateData[field] = value;
      }
    }
    
    return updateData;
  }
}
