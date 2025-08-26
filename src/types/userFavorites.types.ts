// =====================================================
// USER FAVORITES INTERFACES
// =====================================================

/**
 * Base user favorite interface
 */
export interface UserFavorite {
  id: string;
  user_id: string;
  product_id: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create user favorite request interface
 */
export interface CreateUserFavoriteRequest {
  product_id: string;
  metadata?: Record<string, any>;
}

/**
 * User favorite with product details
 */
export interface UserFavoriteWithProduct extends UserFavorite {
  product: {
    id: string;
    name: string;
    description?: string;
    images?: string[];
    price_per_day?: number;
    currency?: string;
    status: string;
    owner_id: string;
    category_id?: string;
    condition?: string;
    location?: string;
    created_at: Date;
  };
}

/**
 * User favorites filters interface
 */
export interface UserFavoriteFilters {
  user_id?: string;
  product_id?: string;
  category_id?: string;
  status?: string; // product status filter
  location?: string;
  min_price?: number;
  max_price?: number;
  currency?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'updated_at' | 'product_name' | 'price';
  sort_order?: 'asc' | 'desc';
}

/**
 * Favorite status response
 */
export interface FavoriteStatusResponse {
  is_favorited: boolean;
  favorite_id?: string;
  created_at?: Date;
}

/**
 * Bulk favorite operations
 */
export interface BulkFavoriteRequest {
  product_ids: string[];
  action: 'add' | 'remove';
  metadata?: Record<string, any>;
}

export interface BulkFavoriteResponse {
  added: number;
  removed: number;
  errors: Array<{
    product_id: string;
    error: string;
  }>;
}

/**
 * User favorites statistics
 */
export interface UserFavoriteStats {
  total_favorites: number;
  favorites_by_category: Record<string, number>;
  favorites_by_status: Record<string, number>;
  favorites_by_price_range: Record<string, number>;
  recent_favorites: number; // last 30 days
  average_price: number;
  most_favorited_category: string;
}

/**
 * Product favorite analytics
 */
export interface ProductFavoriteAnalytics {
  product_id: string;
  total_favorites: number;
  unique_users: number;
  favorite_growth: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
  user_demographics: {
    age_groups: Record<string, number>;
    locations: Record<string, number>;
  };
}

/**
 * Service response interfaces
 */
export interface UserFavoriteServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Error types for user favorites
 */
export enum UserFavoriteErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  PRODUCT_NOT_AVAILABLE = 'PRODUCT_NOT_AVAILABLE'
}

export class UserFavoriteError extends Error {
  constructor(
    message: string,
    public type: UserFavoriteErrorType,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'UserFavoriteError';
  }
}

/**
 * Validation schemas (for use with validation middleware)
 */
export const UserFavoriteValidation = {
  createFavorite: {
    product_id: {
      required: true,
      type: 'string',
      format: 'uuid'
    },
    metadata: {
      required: false,
      type: 'object'
    }
  },
  
  getFavorites: {
    page: {
      required: false,
      type: 'number',
      min: 1
    },
    limit: {
      required: false,
      type: 'number',
      min: 1,
      max: 100
    },
    category_id: {
      required: false,
      type: 'string',
      format: 'uuid'
    },
    search: {
      required: false,
      type: 'string',
      minLength: 2
    }
  }
};
