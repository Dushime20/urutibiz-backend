// =====================================================
// USER FAVORITES MODEL
// =====================================================

import { 
  UserFavorite, 
  CreateUserFavoriteRequest,
  UserFavoriteFilters,
  UserFavoriteWithProduct,
  FavoriteStatusResponse,
  UserFavoriteServiceResponse
} from '@/types/userFavorites.types';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '@/config/database';

export class UserFavoritesModel {
  /**
   * Safely parse a JSON value that might already be an object or non-JSON text
   */
  private static safeParseJson<T = any>(value: any): T | null {
    if (value == null) return null;
    // If it's already an object/array, return as-is
    if (typeof value === 'object') return value as T;
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    // Only attempt to parse if it looks like JSON
    const looksLikeJson = (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
                          (trimmed.startsWith('[') && trimmed.endsWith(']'));
    if (!looksLikeJson) return null;
    try {
      return JSON.parse(trimmed) as T;
    } catch (_err) {
      return null;
    }
  }
  
  /**
   * Create a new user favorite
   */
  static async create(userId: string, data: CreateUserFavoriteRequest): Promise<UserFavorite> {
    const db = getDatabase();
    
    const favoriteData = {
      id: uuidv4(),
      user_id: userId,
      product_id: data.product_id,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const [favorite] = await db('user_favorites')
      .insert(favoriteData)
      .returning('*');

    return this.mapRowToFavorite(favorite);
  }

  /**
   * Find favorite by user and product
   */
  static async findByUserAndProduct(userId: string, productId: string): Promise<UserFavorite | null> {
    const db = getDatabase();
    
    const favorite = await db('user_favorites')
      .where({ user_id: userId, product_id: productId })
      .first();

    return favorite ? this.mapRowToFavorite(favorite) : null;
  }

  /**
   * Check if product is favorited by user
   */
  static async isFavorited(userId: string, productId: string): Promise<FavoriteStatusResponse> {
    const db = getDatabase();
    
    const favorite = await db('user_favorites')
      .where({ user_id: userId, product_id: productId })
      .first();

    return {
      is_favorited: !!favorite,
      favorite_id: favorite?.id,
      created_at: favorite?.created_at
    };
  }

  /**
   * Get user favorites with optional filters
   */
  static async getUserFavorites(userId: string, filters: UserFavoriteFilters = {}): Promise<{
    favorites: UserFavoriteWithProduct[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const db = getDatabase();
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const offset = (page - 1) * limit;

    // Build the query
    let query = db('user_favorites as uf')
      .join('products as p', 'uf.product_id', 'p.id')
      .where('uf.user_id', userId)
      .select([
        'uf.*',
        'p.id as product_id',
        'p.title as product_name',
        'p.description as product_description',
        'p.status as product_status',
        'p.owner_id as product_owner_id',
        'p.category_id as product_category_id',
        'p.condition as product_condition',
        'p.location as product_location',
        'p.created_at as product_created_at'
      ]);

    // Apply filters
    if (filters.category_id) {
      query = query.where('p.category_id', filters.category_id);
    }

    if (filters.status) {
      query = query.where('p.status', filters.status);
    }

    if (filters.location) {
      query = query.where('p.location', 'ilike', `%${filters.location}%`);
    }

    // Price filters disabled until price column is confirmed on products table
    // if (filters.min_price) {
    //   query = query.where('p.price', '>=', filters.min_price);
    // }

    // if (filters.max_price) {
    //   query = query.where('p.price', '<=', filters.max_price);
    // }

    // Currency filter disabled - check if products table has currency column
    // if (filters.currency) {
    //   query = query.where('p.currency', filters.currency);
    // }

    if (filters.search) {
      query = query.where(function() {
        this.where('p.title', 'ilike', `%${filters.search}%`)
            .orWhere('p.description', 'ilike', `%${filters.search}%`);
      });
    }

    // Apply sorting
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'desc';
    
    if (sortBy === 'product_name') {
      query = query.orderBy('p.title', sortOrder);
    } else if (sortBy === 'price') {
      // Fallback sorting when price column is unknown
      query = query.orderBy('uf.created_at', sortOrder);
    } else {
      query = query.orderBy(`uf.${sortBy}`, sortOrder);
    }

    // Get total count for pagination
    const countQuery = query.clone().clearSelect().clearOrder().count('* as count');
    const [{ count }] = await countQuery;
    const total = parseInt(count as string);

    // Get paginated results
    const results = await query.limit(limit).offset(offset);

    const favorites = results.map(this.mapRowToFavoriteWithProduct);

    return {
      favorites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Remove favorite by user and product
   */
  static async remove(userId: string, productId: string): Promise<boolean> {
    const db = getDatabase();
    
    const deletedCount = await db('user_favorites')
      .where({ user_id: userId, product_id: productId })
      .del();

    return deletedCount > 0;
  }

  /**
   * Remove favorite by ID
   */
  static async removeById(favoriteId: string, userId: string): Promise<boolean> {
    const db = getDatabase();
    
    const deletedCount = await db('user_favorites')
      .where({ id: favoriteId, user_id: userId })
      .del();

    return deletedCount > 0;
  }

  /**
   * Get user favorites count
   */
  static async getUserFavoritesCount(userId: string): Promise<number> {
    const db = getDatabase();
    
    const [{ count }] = await db('user_favorites')
      .where({ user_id: userId })
      .count('* as count');

    return parseInt(count as string);
  }

  /**
   * Get product favorites count
   */
  static async getProductFavoritesCount(productId: string): Promise<number> {
    const db = getDatabase();
    
    const [{ count }] = await db('user_favorites')
      .where({ product_id: productId })
      .count('* as count');

    return parseInt(count as string);
  }

  /**
   * Clear all favorites for a user
   */
  static async clearUserFavorites(userId: string): Promise<number> {
    const db = getDatabase();
    
    return await db('user_favorites')
      .where({ user_id: userId })
      .del();
  }

  /**
   * Bulk add favorites
   */
  static async bulkAdd(userId: string, productIds: string[], metadata?: Record<string, any>): Promise<{
    added: number;
    skipped: number;
    errors: Array<{ product_id: string; error: string }>;
  }> {
    const db = getDatabase();
    const results = { added: 0, skipped: 0, errors: [] as Array<{ product_id: string; error: string }> };

    for (const productId of productIds) {
      try {
        // Check if already favorited
        const existing = await this.findByUserAndProduct(userId, productId);
        if (existing) {
          results.skipped++;
          continue;
        }

        // Add to favorites
        await this.create(userId, { product_id: productId, metadata });
        results.added++;
      } catch (error: any) {
        results.errors.push({
          product_id: productId,
          error: error.message || 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Bulk remove favorites
   */
  static async bulkRemove(userId: string, productIds: string[]): Promise<{
    removed: number;
    notFound: number;
    errors: Array<{ product_id: string; error: string }>;
  }> {
    const db = getDatabase();
    const results = { removed: 0, notFound: 0, errors: [] as Array<{ product_id: string; error: string }> };

    for (const productId of productIds) {
      try {
        const success = await this.remove(userId, productId);
        if (success) {
          results.removed++;
        } else {
          results.notFound++;
        }
      } catch (error: any) {
        results.errors.push({
          product_id: productId,
          error: error.message || 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Map database row to UserFavorite object
   */
  private static mapRowToFavorite(row: any): UserFavorite {
    return {
      id: row.id,
      user_id: row.user_id,
      product_id: row.product_id,
      metadata: UserFavoritesModel.safeParseJson(row.metadata),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * Map database row to UserFavoriteWithProduct object
   */
  private static mapRowToFavoriteWithProduct(row: any): UserFavoriteWithProduct {
    return {
      id: row.id,
      user_id: row.user_id,
      product_id: row.product_id,
      metadata: UserFavoritesModel.safeParseJson(row.metadata),
      created_at: row.created_at,
      updated_at: row.updated_at,
      product: {
        id: row.product_id,
        name: row.product_name,
        description: row.product_description,
        images: [],
        price_per_day: row.product_price_per_day != null ? Number(row.product_price_per_day) : undefined,
        status: row.product_status,
        owner_id: row.product_owner_id,
        category_id: row.product_category_id,
        condition: row.product_condition,
        location: UserFavoritesModel.safeParseJson(row.product_location),
        created_at: row.product_created_at,
      },
    };
  }
}
