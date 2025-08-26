// =====================================================
// FAVORITE ENHANCER UTILITY
// =====================================================

import { UserFavoritesModel } from '@/models/UserFavorites.model';
import logger from '@/utils/logger';

/**
 * Utility to enhance product data with favorite status for authenticated users
 */
export class FavoriteEnhancer {
  
  /**
   * Add is_favorited field to a single product
   */
  static async enhanceProduct(product: any, userId?: string): Promise<any> {
    if (!userId) {
      return {
        ...product,
        is_favorited: false
      };
    }

    try {
      const favoriteStatus = await UserFavoritesModel.isFavorited(userId, product.id);
      
      return {
        ...product,
        is_favorited: favoriteStatus.is_favorited,
        favorite_id: favoriteStatus.favorite_id,
        favorited_at: favoriteStatus.created_at
      };
    } catch (error) {
      logger.error('Error checking favorite status for product:', error);
      return {
        ...product,
        is_favorited: false
      };
    }
  }

  /**
   * Add is_favorited field to multiple products
   */
  static async enhanceProducts(products: any[], userId?: string): Promise<any[]> {
    if (!userId || !products || products.length === 0) {
      return products.map(product => ({
        ...product,
        is_favorited: false
      }));
    }

    try {
      // Get all product IDs
      const productIds = products.map(p => p.id).filter(Boolean);
      
      if (productIds.length === 0) {
        return products.map(product => ({
          ...product,
          is_favorited: false
        }));
      }

      // Batch check favorite status for all products
      const favoriteStatuses = await this.batchCheckFavorites(userId, productIds);
      
      // Enhance each product with favorite status
      return products.map(product => {
        const favoriteStatus = favoriteStatuses.get(product.id);
        
        return {
          ...product,
          is_favorited: favoriteStatus?.is_favorited || false,
          favorite_id: favoriteStatus?.favorite_id,
          favorited_at: favoriteStatus?.created_at
        };
      });
    } catch (error) {
      logger.error('Error enhancing products with favorite status:', error);
      // Return products without favorite status on error
      return products.map(product => ({
        ...product,
        is_favorited: false
      }));
    }
  }

  /**
   * Batch check favorite status for multiple products
   */
  private static async batchCheckFavorites(userId: string, productIds: string[]): Promise<Map<string, any>> {
    try {
      const db = require('@/config/database').getDatabase();
      
      const favorites = await db('user_favorites')
        .where('user_id', userId)
        .whereIn('product_id', productIds)
        .select(['product_id', 'id as favorite_id', 'created_at']);

      // Create a map for quick lookup
      const favoriteMap = new Map();
      
      // Initialize all products as not favorited
      productIds.forEach(id => {
        favoriteMap.set(id, {
          is_favorited: false,
          favorite_id: null,
          created_at: null
        });
      });

      // Update map with favorited products
      favorites.forEach((fav: any) => {
        favoriteMap.set(fav.product_id, {
          is_favorited: true,
          favorite_id: fav.favorite_id,
          created_at: fav.created_at
        });
      });

      return favoriteMap;
    } catch (error) {
      logger.error('Error in batch favorite check:', error);
      // Return empty map on error
      const errorMap = new Map();
      productIds.forEach(id => {
        errorMap.set(id, {
          is_favorited: false,
          favorite_id: null,
          created_at: null
        });
      });
      return errorMap;
    }
  }

  /**
   * Add favorite count to product
   */
  static async enhanceWithFavoriteCount(product: any): Promise<any> {
    try {
      const count = await UserFavoritesModel.getProductFavoritesCount(product.id);
      
      return {
        ...product,
        favorite_count: count
      };
    } catch (error) {
      logger.error('Error getting favorite count for product:', error);
      return {
        ...product,
        favorite_count: 0
      };
    }
  }

  /**
   * Add favorite counts to multiple products
   */
  static async enhanceWithFavoriteCounts(products: any[]): Promise<any[]> {
    if (!products || products.length === 0) {
      return products;
    }

    try {
      const productIds = products.map(p => p.id).filter(Boolean);
      
      if (productIds.length === 0) {
        return products.map(product => ({
          ...product,
          favorite_count: 0
        }));
      }

      // Batch get favorite counts
      const favoriteCounts = await this.batchGetFavoriteCounts(productIds);
      
      // Enhance each product with favorite count
      return products.map(product => ({
        ...product,
        favorite_count: favoriteCounts.get(product.id) || 0
      }));
    } catch (error) {
      logger.error('Error enhancing products with favorite counts:', error);
      return products.map(product => ({
        ...product,
        favorite_count: 0
      }));
    }
  }

  /**
   * Batch get favorite counts for multiple products
   */
  private static async batchGetFavoriteCounts(productIds: string[]): Promise<Map<string, number>> {
    try {
      const db = require('@/config/database').getDatabase();
      
      const counts = await db('user_favorites')
        .whereIn('product_id', productIds)
        .groupBy('product_id')
        .select(['product_id', db.raw('COUNT(*) as count')]);

      const countsMap = new Map();
      
      // Initialize all products with 0 count
      productIds.forEach(id => {
        countsMap.set(id, 0);
      });

      // Update map with actual counts
      counts.forEach((count: any) => {
        countsMap.set(count.product_id, parseInt(count.count, 10));
      });

      return countsMap;
    } catch (error) {
      logger.error('Error in batch favorite count:', error);
      const errorMap = new Map();
      productIds.forEach(id => {
        errorMap.set(id, 0);
      });
      return errorMap;
    }
  }

  /**
   * Enhanced version that adds both favorite status and count
   */
  static async enhanceProductsFull(products: any[], userId?: string, includeCounts = false): Promise<any[]> {
    let enhancedProducts = await this.enhanceProducts(products, userId);
    
    if (includeCounts) {
      enhancedProducts = await this.enhanceWithFavoriteCounts(enhancedProducts);
    }
    
    return enhancedProducts;
  }
}
