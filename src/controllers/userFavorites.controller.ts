// =====================================================
// USER FAVORITES CONTROLLER
// =====================================================

import { Response } from 'express';
import { BaseController } from './BaseController';
import { userFavoritesService } from '@/services/userFavorites.service';
import { 
  AuthenticatedRequest
} from '@/types';
import { UserFavoriteFilters, BulkFavoriteRequest } from '@/types/userFavorites.types';
import { ResponseHelper } from '@/utils/response';
import logger from '@/utils/logger';

// Performance: Cache TTL settings
const CACHE_TTL = {
  FAVORITES_LIST: 300,    // 5 minutes
  FAVORITE_STATUS: 60,    // 1 minute
  FAVORITE_COUNT: 180,    // 3 minutes
} as const;

// Performance: In-memory cache for frequently accessed data
const favoritesCache = new Map<string, { data: any; timestamp: number }>();

/**
 * User Favorites Controller
 * Handles all favorite-related operations with performance optimizations
 */
export class UserFavoritesController extends BaseController {

  /**
   * Add product to favorites
   * POST /api/v1/users/favorites
   */
  public addToFavorites = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (this.handleValidationErrors(req as any, res)) return;

      const userId = req.user.id;
      const { product_id, metadata } = req.body;

      if (!product_id) {
        return ResponseHelper.error(res, 'Product ID is required', 400);
      }

      const result = await userFavoritesService.addToFavorites(userId, {
        product_id,
        metadata
      });

      if (!result.success) {
        const statusCode = result.error?.includes('already in favorites') ? 409 : 400;
        return ResponseHelper.error(res, result.error || 'Failed to add to favorites', statusCode);
      }

      // Invalidate related caches
      this.invalidateFavoritesCache(userId);

      this.logAction('ADD_TO_FAVORITES', userId, product_id);
      return ResponseHelper.success(res, 'Product added to favorites successfully', result.data, 201);

    } catch (error: any) {
      logger.error('Error in addToFavorites:', error);
      return ResponseHelper.error(res, 'Internal server error', 500);
    }
  });

  /**
   * Remove product from favorites
   * DELETE /api/v1/users/favorites/:productId
   */
  public removeFromFavorites = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const { productId } = req.params;

      if (!productId) {
        return ResponseHelper.error(res, 'Product ID is required', 400);
      }

      const result = await userFavoritesService.removeFromFavorites(userId, productId);

      if (!result.success) {
        const statusCode = result.error?.includes('not in favorites') ? 404 : 400;
        return ResponseHelper.error(res, result.error || 'Failed to remove from favorites', statusCode);
      }

      // Invalidate related caches
      this.invalidateFavoritesCache(userId);

      this.logAction('REMOVE_FROM_FAVORITES', userId, productId);
      return ResponseHelper.success(res, 'Product removed from favorites successfully', { removed: result.data });

    } catch (error: any) {
      logger.error('Error in removeFromFavorites:', error);
      return ResponseHelper.error(res, 'Internal server error', 500);
    }
  });

  /**
   * Get user's favorites
   * GET /api/v1/users/favorites
   */
  public getUserFavorites = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const { page, limit } = this.getPaginationParams(req as any);
      const { sortBy, sortOrder } = this.getSortParams(req as any, 'created_at', 'desc');

      // Build filters from query parameters
      const filters: UserFavoriteFilters = {
        page,
        limit,
        sort_by: sortBy as any,
        sort_order: sortOrder,
        category_id: req.query.category_id as string,
        status: req.query.status as string,
        location: req.query.location as string,
        min_price: req.query.min_price ? parseFloat(req.query.min_price as string) : undefined,
        max_price: req.query.max_price ? parseFloat(req.query.max_price as string) : undefined,
        currency: req.query.currency as string,
        search: req.query.search as string,
      };

      // Check cache first
      const cacheKey = `favorites_${userId}_${JSON.stringify(filters)}`;
      const cached = favoritesCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL.FAVORITES_LIST * 1000) {
        return this.formatFavoritesPaginatedResponse(res, 'User favorites retrieved successfully (cached)', cached.data);
      }

      const result = await userFavoritesService.getUserFavorites(userId, filters);

      if (!result.success) {
        return ResponseHelper.error(res, result.error || 'Failed to get favorites', 400);
      }

      // Cache the result
      favoritesCache.set(cacheKey, {
        data: result.data,
        timestamp: Date.now()
      });

      this.logAction('GET_FAVORITES', userId);
      return this.formatFavoritesPaginatedResponse(res, 'User favorites retrieved successfully', result.data!);

    } catch (error: any) {
      logger.error('Error in getUserFavorites:', error);
      return ResponseHelper.error(res, 'Internal server error', 500);
    }
  });

  /**
   * Check if product is favorited
   * GET /api/v1/users/favorites/:productId/status
   */
  public getFavoriteStatus = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const { productId } = req.params;

      if (!productId) {
        return ResponseHelper.error(res, 'Product ID is required', 400);
      }

      // Check cache first
      const cacheKey = `favorite_status_${userId}_${productId}`;
      const cached = favoritesCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL.FAVORITE_STATUS * 1000) {
        return ResponseHelper.success(res, 'Favorite status retrieved successfully (cached)', cached.data);
      }

      const result = await userFavoritesService.isFavorited(userId, productId);

      if (!result.success) {
        return ResponseHelper.error(res, result.error || 'Failed to check favorite status', 400);
      }

      // Cache the result
      favoritesCache.set(cacheKey, {
        data: result.data,
        timestamp: Date.now()
      });

      return ResponseHelper.success(res, 'Favorite status retrieved successfully', result.data);

    } catch (error: any) {
      logger.error('Error in getFavoriteStatus:', error);
      return ResponseHelper.error(res, 'Internal server error', 500);
    }
  });

  /**
   * Toggle favorite status
   * POST /api/v1/users/favorites/:productId/toggle
   */
  public toggleFavorite = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const { productId } = req.params;
      const { metadata } = req.body;

      if (!productId) {
        return ResponseHelper.error(res, 'Product ID is required', 400);
      }

      const result = await userFavoritesService.toggleFavorite(userId, productId, metadata);

      if (!result.success) {
        return ResponseHelper.error(res, result.error || 'Failed to toggle favorite', 400);
      }

      // Invalidate related caches
      this.invalidateFavoritesCache(userId);

      this.logAction('TOGGLE_FAVORITE', userId, productId, { action: result.data?.action });
      return ResponseHelper.success(res, `Product ${result.data?.action} ${result.data?.action === 'added' ? 'to' : 'from'} favorites successfully`, result.data);

    } catch (error: any) {
      logger.error('Error in toggleFavorite:', error);
      return ResponseHelper.error(res, 'Internal server error', 500);
    }
  });

  /**
   * Get user's favorites count
   * GET /api/v1/users/favorites/count
   */
  public getFavoritesCount = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;

      // Check cache first
      const cacheKey = `favorites_count_${userId}`;
      const cached = favoritesCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL.FAVORITE_COUNT * 1000) {
        return ResponseHelper.success(res, 'Favorites count retrieved successfully (cached)', { count: cached.data });
      }

      const result = await userFavoritesService.getUserFavoritesCount(userId);

      if (!result.success) {
        return ResponseHelper.error(res, result.error || 'Failed to get favorites count', 400);
      }

      // Cache the result
      favoritesCache.set(cacheKey, {
        data: result.data,
        timestamp: Date.now()
      });

      return ResponseHelper.success(res, 'Favorites count retrieved successfully', { count: result.data });

    } catch (error: any) {
      logger.error('Error in getFavoritesCount:', error);
      return ResponseHelper.error(res, 'Internal server error', 500);
    }
  });

  /**
   * Clear all user's favorites
   * DELETE /api/v1/users/favorites
   */
  public clearFavorites = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;

      const result = await userFavoritesService.clearUserFavorites(userId);

      if (!result.success) {
        return ResponseHelper.error(res, result.error || 'Failed to clear favorites', 400);
      }

      // Invalidate related caches
      this.invalidateFavoritesCache(userId);

      this.logAction('CLEAR_FAVORITES', userId, undefined, { deletedCount: result.data });
      return ResponseHelper.success(res, 'All favorites cleared successfully', { deleted_count: result.data });

    } catch (error: any) {
      logger.error('Error in clearFavorites:', error);
      return ResponseHelper.error(res, 'Internal server error', 500);
    }
  });

  /**
   * Bulk operations on favorites
   * POST /api/v1/users/favorites/bulk
   */
  public bulkFavoriteOperation = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (this.handleValidationErrors(req as any, res)) return;

      const userId = req.user.id;
      const bulkRequest: BulkFavoriteRequest = req.body;

      if (!bulkRequest.product_ids || !Array.isArray(bulkRequest.product_ids) || bulkRequest.product_ids.length === 0) {
        return ResponseHelper.error(res, 'Product IDs array is required', 400);
      }

      if (!['add', 'remove'].includes(bulkRequest.action)) {
        return ResponseHelper.error(res, 'Action must be "add" or "remove"', 400);
      }

      if (bulkRequest.product_ids.length > 100) {
        return ResponseHelper.error(res, 'Maximum 100 products allowed per bulk operation', 400);
      }

      const result = await userFavoritesService.bulkFavoriteOperation(userId, bulkRequest);

      if (!result.success) {
        return ResponseHelper.error(res, result.error || 'Failed to perform bulk operation', 400);
      }

      // Invalidate related caches
      this.invalidateFavoritesCache(userId);

      this.logAction('BULK_FAVORITES', userId, undefined, { 
        action: bulkRequest.action, 
        productCount: bulkRequest.product_ids.length,
        result: result.data 
      });

      return ResponseHelper.success(res, 'Bulk operation completed successfully', result.data);

    } catch (error: any) {
      logger.error('Error in bulkFavoriteOperation:', error);
      return ResponseHelper.error(res, 'Internal server error', 500);
    }
  });

  /**
   * Get user's favorite statistics
   * GET /api/v1/users/favorites/stats
   */
  public getFavoriteStats = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;

      const result = await userFavoritesService.getUserFavoriteStats(userId);

      if (!result.success) {
        return ResponseHelper.error(res, result.error || 'Failed to get favorite statistics', 400);
      }

      this.logAction('GET_FAVORITE_STATS', userId);
      return ResponseHelper.success(res, 'Favorite statistics retrieved successfully', result.data);

    } catch (error: any) {
      logger.error('Error in getFavoriteStats:', error);
      return ResponseHelper.error(res, 'Internal server error', 500);
    }
  });

  /**
   * Invalidate favorites-related cache entries for a user
   */
  private invalidateFavoritesCache(userId: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key] of favoritesCache) {
      if (key.includes(`favorites_${userId}`) || key.includes(`favorite_status_${userId}`) || key.includes(`favorites_count_${userId}`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => favoritesCache.delete(key));
  }

  /**
   * Format paginated response for favorites
   */
  private formatFavoritesPaginatedResponse(res: Response, message: string, data: any): Response {
    return ResponseHelper.success(res, message, data.favorites, 200, {
      pagination: data.pagination
    });
  }
}

export const userFavoritesController = new UserFavoritesController();
