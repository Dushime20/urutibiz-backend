// =====================================================
// USER FAVORITES SERVICE
// =====================================================

import { UserFavoritesModel } from '@/models/UserFavorites.model';
import { 
  UserFavorite, 
  CreateUserFavoriteRequest, 
  UserFavoriteFilters,
  UserFavoriteWithProduct,
  FavoriteStatusResponse,
  UserFavoriteServiceResponse,
  UserFavoriteError,
  UserFavoriteErrorType,
  UserFavoriteStats,
  BulkFavoriteRequest,
  BulkFavoriteResponse
} from '@/types/userFavorites.types';
import logger from '@/utils/logger';

export class UserFavoritesService {

  /**
   * Add product to user's favorites
   */
  async addToFavorites(userId: string, data: CreateUserFavoriteRequest): Promise<UserFavoriteServiceResponse<UserFavorite>> {
    try {
      // Validate input
      if (!userId) {
        throw new UserFavoriteError('User ID is required', UserFavoriteErrorType.VALIDATION_ERROR, 400);
      }

      if (!data.product_id) {
        throw new UserFavoriteError('Product ID is required', UserFavoriteErrorType.VALIDATION_ERROR, 400);
      }

      // Check if product is already favorited
      const existingFavorite = await UserFavoritesModel.findByUserAndProduct(userId, data.product_id);
      if (existingFavorite) {
        throw new UserFavoriteError('Product is already in favorites', UserFavoriteErrorType.ALREADY_EXISTS, 409);
      }

      // TODO: Add product existence validation
      // const productExists = await ProductService.exists(data.product_id);
      // if (!productExists) {
      //   throw new UserFavoriteError('Product not found', UserFavoriteErrorType.NOT_FOUND, 404);
      // }

      // Create favorite
      const favorite = await UserFavoritesModel.create(userId, data);

      logger.info('Product added to favorites', {
        userId,
        productId: data.product_id,
        favoriteId: favorite.id
      });

      return {
        success: true,
        data: favorite
      };

    } catch (error: any) {
      logger.error('Error adding product to favorites:', error);
      
      if (error instanceof UserFavoriteError) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: false,
        error: 'Failed to add product to favorites'
      };
    }
  }

  /**
   * Remove product from user's favorites
   */
  async removeFromFavorites(userId: string, productId: string): Promise<UserFavoriteServiceResponse<boolean>> {
    try {
      // Validate input
      if (!userId) {
        throw new UserFavoriteError('User ID is required', UserFavoriteErrorType.VALIDATION_ERROR, 400);
      }

      if (!productId) {
        throw new UserFavoriteError('Product ID is required', UserFavoriteErrorType.VALIDATION_ERROR, 400);
      }

      // Check if favorite exists
      const existingFavorite = await UserFavoritesModel.findByUserAndProduct(userId, productId);
      if (!existingFavorite) {
        throw new UserFavoriteError('Product is not in favorites', UserFavoriteErrorType.NOT_FOUND, 404);
      }

      // Remove favorite
      const removed = await UserFavoritesModel.remove(userId, productId);

      logger.info('Product removed from favorites', {
        userId,
        productId,
        favoriteId: existingFavorite.id
      });

      return {
        success: true,
        data: removed
      };

    } catch (error: any) {
      logger.error('Error removing product from favorites:', error);
      
      if (error instanceof UserFavoriteError) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: false,
        error: 'Failed to remove product from favorites'
      };
    }
  }

  /**
   * Get user's favorites with optional filtering
   */
  async getUserFavorites(userId: string, filters: UserFavoriteFilters = {}): Promise<UserFavoriteServiceResponse<{
    favorites: UserFavoriteWithProduct[];
    pagination: any;
  }>> {
    try {
      // Validate input
      if (!userId) {
        throw new UserFavoriteError('User ID is required', UserFavoriteErrorType.VALIDATION_ERROR, 400);
      }

      // Get favorites from model
      const result = await UserFavoritesModel.getUserFavorites(userId, filters);

      logger.info('User favorites retrieved', {
        userId,
        count: result.favorites.length,
        page: result.pagination.page
      });

      return {
        success: true,
        data: result,
        pagination: result.pagination
      };

    } catch (error: any) {
      logger.error('Error getting user favorites:', error);
      
      return {
        success: false,
        error: 'Failed to get user favorites'
      };
    }
  }

  /**
   * Check if product is favorited by user
   */
  async isFavorited(userId: string, productId: string): Promise<UserFavoriteServiceResponse<FavoriteStatusResponse>> {
    try {
      // Validate input
      if (!userId) {
        throw new UserFavoriteError('User ID is required', UserFavoriteErrorType.VALIDATION_ERROR, 400);
      }

      if (!productId) {
        throw new UserFavoriteError('Product ID is required', UserFavoriteErrorType.VALIDATION_ERROR, 400);
      }

      const status = await UserFavoritesModel.isFavorited(userId, productId);

      return {
        success: true,
        data: status
      };

    } catch (error: any) {
      logger.error('Error checking favorite status:', error);
      
      return {
        success: false,
        error: 'Failed to check favorite status'
      };
    }
  }

  /**
   * Get user's favorites count
   */
  async getUserFavoritesCount(userId: string): Promise<UserFavoriteServiceResponse<number>> {
    try {
      if (!userId) {
        throw new UserFavoriteError('User ID is required', UserFavoriteErrorType.VALIDATION_ERROR, 400);
      }

      const count = await UserFavoritesModel.getUserFavoritesCount(userId);

      return {
        success: true,
        data: count
      };

    } catch (error: any) {
      logger.error('Error getting user favorites count:', error);
      
      return {
        success: false,
        error: 'Failed to get favorites count'
      };
    }
  }

  /**
   * Get product's favorites count
   */
  async getProductFavoritesCount(productId: string): Promise<UserFavoriteServiceResponse<number>> {
    try {
      if (!productId) {
        throw new UserFavoriteError('Product ID is required', UserFavoriteErrorType.VALIDATION_ERROR, 400);
      }

      const count = await UserFavoritesModel.getProductFavoritesCount(productId);

      return {
        success: true,
        data: count
      };

    } catch (error: any) {
      logger.error('Error getting product favorites count:', error);
      
      return {
        success: false,
        error: 'Failed to get product favorites count'
      };
    }
  }

  /**
   * Clear all user's favorites
   */
  async clearUserFavorites(userId: string): Promise<UserFavoriteServiceResponse<number>> {
    try {
      if (!userId) {
        throw new UserFavoriteError('User ID is required', UserFavoriteErrorType.VALIDATION_ERROR, 400);
      }

      const deletedCount = await UserFavoritesModel.clearUserFavorites(userId);

      logger.info('User favorites cleared', {
        userId,
        deletedCount
      });

      return {
        success: true,
        data: deletedCount
      };

    } catch (error: any) {
      logger.error('Error clearing user favorites:', error);
      
      return {
        success: false,
        error: 'Failed to clear favorites'
      };
    }
  }

  /**
   * Bulk operations on favorites
   */
  async bulkFavoriteOperation(userId: string, request: BulkFavoriteRequest): Promise<UserFavoriteServiceResponse<BulkFavoriteResponse>> {
    try {
      if (!userId) {
        throw new UserFavoriteError('User ID is required', UserFavoriteErrorType.VALIDATION_ERROR, 400);
      }

      if (!request.product_ids || !Array.isArray(request.product_ids) || request.product_ids.length === 0) {
        throw new UserFavoriteError('Product IDs array is required', UserFavoriteErrorType.VALIDATION_ERROR, 400);
      }

      if (!['add', 'remove'].includes(request.action)) {
        throw new UserFavoriteError('Action must be "add" or "remove"', UserFavoriteErrorType.VALIDATION_ERROR, 400);
      }

      let result: BulkFavoriteResponse = { added: 0, removed: 0, errors: [] };

      if (request.action === 'add') {
        const bulkResult = await UserFavoritesModel.bulkAdd(userId, request.product_ids, request.metadata);
        result.added = bulkResult.added;
        result.errors = bulkResult.errors;
      } else if (request.action === 'remove') {
        const bulkResult = await UserFavoritesModel.bulkRemove(userId, request.product_ids);
        result.removed = bulkResult.removed;
        result.errors = bulkResult.errors;
      }

      logger.info('Bulk favorite operation completed', {
        userId,
        action: request.action,
        productCount: request.product_ids.length,
        result
      });

      return {
        success: true,
        data: result
      };

    } catch (error: any) {
      logger.error('Error in bulk favorite operation:', error);
      
      if (error instanceof UserFavoriteError) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: false,
        error: 'Failed to perform bulk favorite operation'
      };
    }
  }

  /**
   * Toggle favorite status (add if not favorited, remove if favorited)
   */
  async toggleFavorite(userId: string, productId: string, metadata?: Record<string, any>): Promise<UserFavoriteServiceResponse<{
    action: 'added' | 'removed';
    favorite?: UserFavorite;
  }>> {
    try {
      // Check current status
      const currentStatus = await this.isFavorited(userId, productId);
      if (!currentStatus.success) {
        return currentStatus as any;
      }

      if (currentStatus.data!.is_favorited) {
        // Remove from favorites
        const removeResult = await this.removeFromFavorites(userId, productId);
        if (!removeResult.success) {
          return removeResult as any;
        }

        return {
          success: true,
          data: { action: 'removed' }
        };
      } else {
        // Add to favorites
        const addResult = await this.addToFavorites(userId, { product_id: productId, metadata });
        if (!addResult.success) {
          return addResult as any;
        }

        return {
          success: true,
          data: { 
            action: 'added', 
            favorite: addResult.data 
          }
        };
      }

    } catch (error: any) {
      logger.error('Error toggling favorite:', error);
      
      return {
        success: false,
        error: 'Failed to toggle favorite status'
      };
    }
  }

  /**
   * Get user favorites statistics
   */
  async getUserFavoriteStats(userId: string): Promise<UserFavoriteServiceResponse<UserFavoriteStats>> {
    try {
      if (!userId) {
        throw new UserFavoriteError('User ID is required', UserFavoriteErrorType.VALIDATION_ERROR, 400);
      }

      // Get all user favorites
      const favoritesResult = await this.getUserFavorites(userId, { limit: 1000 }); // Get all
      if (!favoritesResult.success) {
        return favoritesResult as any;
      }

      const favorites = favoritesResult.data!.favorites;
      
      // Calculate statistics
      const stats: UserFavoriteStats = {
        total_favorites: favorites.length,
        favorites_by_category: {},
        favorites_by_status: {},
        favorites_by_price_range: {},
        recent_favorites: 0,
        average_price: 0,
        most_favorited_category: ''
      };

      // Calculate stats from favorites data
      let totalPrice = 0;
      let priceCount = 0;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      favorites.forEach(fav => {
        // Category distribution
        const categoryId = fav.product.category_id || 'uncategorized';
        stats.favorites_by_category[categoryId] = (stats.favorites_by_category[categoryId] || 0) + 1;

        // Status distribution
        stats.favorites_by_status[fav.product.status] = (stats.favorites_by_status[fav.product.status] || 0) + 1;

        // Price calculations
        if (fav.product.price_per_day) {
          totalPrice += fav.product.price_per_day;
          priceCount++;

          // Price range distribution
          const price = fav.product.price_per_day;
          let range = 'Over 1000';
          if (price < 10) range = 'Under 10';
          else if (price < 50) range = '10-50';
          else if (price < 100) range = '50-100';
          else if (price < 500) range = '100-500';
          else if (price < 1000) range = '500-1000';

          stats.favorites_by_price_range[range] = (stats.favorites_by_price_range[range] || 0) + 1;
        }

        // Recent favorites
        if (new Date(fav.created_at) > thirtyDaysAgo) {
          stats.recent_favorites++;
        }
      });

      // Calculate average price
      stats.average_price = priceCount > 0 ? totalPrice / priceCount : 0;

      // Find most favorited category
      let maxCount = 0;
      Object.entries(stats.favorites_by_category).forEach(([category, count]) => {
        if (count > maxCount) {
          maxCount = count;
          stats.most_favorited_category = category;
        }
      });

      return {
        success: true,
        data: stats
      };

    } catch (error: any) {
      logger.error('Error getting user favorite stats:', error);
      
      return {
        success: false,
        error: 'Failed to get favorite statistics'
      };
    }
  }
}

export const userFavoritesService = new UserFavoritesService();
