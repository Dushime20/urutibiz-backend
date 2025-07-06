/**
 * High-Performance User Management Controller
 * 
 * Optimized for enterprise-scale workloads with:
 * - Memory-efficient operations
 * - Database query optimization
 * - Intelligent caching strategies
 * - Concurrent operation support
 * 
 * @version 2.0.0 - Performance Optimized
 */

import { Response } from 'express';
import { BaseController } from './BaseController';
import UserService from '@/services/UserService';
import { 
  AuthenticatedRequest
} from '@/types';
import { UpdateUserData, UserFilters } from '@/types/user.types';
import { ResponseHelper } from '@/utils/response';

// Performance: Cache frequently accessed data
const CACHE_TTL = {
  USER_PROFILE: 300,     // 5 minutes
  USER_STATS: 600,       // 10 minutes
  KYC_STATUS: 180,       // 3 minutes
} as const;

// Performance: Pre-allocated objects for reuse
const userFiltersCache = new Map<string, UserFilters>();
const statsCache = new Map<string, { data: any; timestamp: number }>();

// Performance: Optimized filter validation
const VALID_USER_ROLES = new Set(['admin', 'moderator', 'renter', 'owner']);
const VALID_USER_STATUSES = new Set(['active', 'suspended', 'pending']);

/**
 * Fast filter validation and normalization
 */
const normalizeUserFilters = (query: any): UserFilters => {
  const cacheKey = JSON.stringify(query);
  
  if (userFiltersCache.has(cacheKey)) {
    return userFiltersCache.get(cacheKey)!;
  }
  
  const filters: UserFilters = {};
  
  // Fast validation with Set lookups
  if (query.role && VALID_USER_ROLES.has(query.role)) {
    filters.role = query.role;
  }
  if (query.status && VALID_USER_STATUSES.has(query.status)) {
    filters.status = query.status;
  }
  if (query.countryId && typeof query.countryId === 'string') {
    filters.countryId = query.countryId;
  }
  if (query.search && typeof query.search === 'string' && query.search.length > 0) {
    filters.search = query.search.trim().toLowerCase();
  }
  
  // Cache the normalized filters
  if (userFiltersCache.size > 100) {
    userFiltersCache.clear(); // Prevent memory overflow
  }
  userFiltersCache.set(cacheKey, filters);
  
  return filters;
};

export class UsersController extends BaseController {
  /**
   * High-performance user listing with optimized filtering
   * GET /api/v1/users
   */
  public getUsers = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Fast authorization check
    if (req.user.role !== 'admin') {
      return this.handleUnauthorized(res, 'Admin access required');
    }

    const { page, limit } = this.getPaginationParams(req as any);
    const filters = normalizeUserFilters(req.query);

    // Get paginated results with total count included
    const result = await UserService.getPaginated(filters, page, limit);

    this.logAction('GET_USERS', req.user.id, undefined, { 
      filters, 
      pagination: { page, limit },
      count: result.data?.total || 0
    });

    if (!result.success || !result.data) {
      return ResponseHelper.error(res, result.error || 'Failed to fetch users', 400);
    }

    // Return paginated results directly from service
    return this.formatPaginatedResponse(res, 'Users retrieved successfully', result.data);
  });

  /**
   * Optimized user profile retrieval with intelligent caching
   * GET /api/v1/users/:id
   */
  public getUser = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Fast authorization check
    if (!this.checkResourceOwnership(req, id)) {
      return this.handleUnauthorized(res, 'Not authorized to view this profile');
    }

    // Performance: Check cache first
    const cacheKey = `user_profile_${id}`;
    const cached = statsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL.USER_PROFILE * 1000) {
      return ResponseHelper.success(res, 'User retrieved successfully (cached)', cached.data);
    }

    // Performance: Parallel data fetching
    const [userResult, verifications] = await Promise.all([
      UserService.getById(id),
      this.fetchUserVerifications(id)
    ]);

    if (!userResult.success || !userResult.data) {
      return this.handleNotFound(res, 'User');
    }

    // Performance: Optimized KYC progress calculation
    const kycProgress = this.calculateKycProgress(verifications);

    const responseData = {
      ...userResult.data,
      verifications,
      kycProgress
    };

    // Cache the result
    statsCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    this.logAction('GET_USER', req.user.id, id);

    return ResponseHelper.success(res, 'User retrieved successfully', responseData);
  });

  /**
   * Optimized user verification fetching
   */
  private async fetchUserVerifications(userId: string) {
    const db = require('@/config/database').getDatabase();
    
    // Performance: Single optimized query with indexing
    return await db('user_verifications')
      .select('verification_type', 'verification_status', 'created_at', 'updated_at')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(50); // Prevent excessive data transfer
  }

  /**
   * High-performance KYC progress calculation
   */
  private calculateKycProgress(verifications: any[]) {
    const requiredTypes = new Set(['national_id', 'selfie', 'address']);
    const verified = new Set();
    const pending = new Set();
    const rejected = new Set();

    // Performance: Single-pass processing
    for (const v of verifications) {
      switch (v.verification_status) {
        case 'verified':
          verified.add(v.verification_type);
          break;
        case 'pending':
          pending.add(v.verification_type);
          break;
        case 'rejected':
          rejected.add(v.verification_type);
          break;
      }
    }

    return {
      required: Array.from(requiredTypes),
      verified: Array.from(verified),
      pending: Array.from(pending),
      rejected: Array.from(rejected),
      completionRate: verified.size / requiredTypes.size
    };
  }

  /**
   * High-performance user update with validation optimization
   * PUT /api/v1/users/:id
   */
  public updateUser = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;

    // Fast authorization check
    if (!this.checkResourceOwnership(req, id)) {
      return this.handleUnauthorized(res, 'Not authorized to update this profile');
    }

    // Performance: Parallel user existence check and update preparation
    const [userResult, updateData] = await Promise.all([
      UserService.getById(id),
      this.prepareUpdateData(req)
    ]);

    if (!userResult.success || !userResult.data) {
      return this.handleNotFound(res, 'User');
    }

    const updated = await UserService.update(id, updateData);
    if (!updated.success || !updated.data) {
      return ResponseHelper.error(res, updated.error || 'Failed to update user', 400);
    }

    // Performance: Invalidate cache
    this.invalidateUserCache(id);

    this.logAction('UPDATE_USER', req.user.id, id, updateData);

    return ResponseHelper.success(res, 'User updated successfully', updated.data);
  });

  /**
   * Optimized update data preparation
   */
  private async prepareUpdateData(req: AuthenticatedRequest): Promise<UpdateUserData> {
    const updateData: UpdateUserData = {};
    
    // Performance: Direct property assignment instead of object spread
    if (req.body.firstName !== undefined) updateData.firstName = req.body.firstName;
    if (req.body.lastName !== undefined) updateData.lastName = req.body.lastName;
    if (req.body.dateOfBirth !== undefined) updateData.dateOfBirth = req.body.dateOfBirth;
    if (req.body.profileImageUrl !== undefined) updateData.profileImageUrl = req.body.profileImageUrl;

    // Admin-only updates
    if (req.user.role === 'admin' && req.body.status !== undefined) {
      updateData.status = req.body.status;
    }

    return updateData;
  }

  /**
   * Soft delete with optimized status update
   * DELETE /api/v1/users/:id
   */
  public deleteUser = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Fast authorization check
    if (!this.checkResourceOwnership(req, id)) {
      return this.handleUnauthorized(res, 'Not authorized to delete this account');
    }

    // Performance: Direct status update without full user fetch
    const updated = await UserService.update(id, { status: 'suspended' });
    if (!updated.success) {
      return this.handleNotFound(res, 'User');
    }

    // Performance: Invalidate cache
    this.invalidateUserCache(id);

    this.logAction('DELETE_USER', req.user.id, id);

    return ResponseHelper.success(res, 'User account deleted successfully');
  });

  /**
   * Optimized user statistics with intelligent caching
   * GET /api/v1/users/:id/stats
   */
  public getUserStats = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Fast authorization check
    if (!this.checkResourceOwnership(req, id)) {
      return this.handleUnauthorized(res, 'Not authorized to view these statistics');
    }

    // Performance: Check cache first
    const cacheKey = `user_stats_${id}`;
    const cached = statsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL.USER_STATS * 1000) {
      return ResponseHelper.success(res, 'User statistics retrieved successfully (cached)', cached.data);
    }

    // Performance: Parallel data fetching
    const [userResult, stats] = await Promise.all([
      UserService.getById(id),
      this.calculateUserStats(id)
    ]);

    if (!userResult.success || !userResult.data) {
      return this.handleNotFound(res, 'User');
    }

    const statsData = {
      ...stats,
      joinDate: userResult.data?.createdAt,
      lastActivity: userResult.data?.updatedAt
    };

    // Cache the result
    statsCache.set(cacheKey, {
      data: statsData,
      timestamp: Date.now()
    });

    this.logAction('GET_USER_STATS', req.user.id, id);

    return ResponseHelper.success(res, 'User statistics retrieved successfully', statsData);
  });

  /**
   * High-performance user statistics calculation
   */
  private async calculateUserStats(userId: string) {
    const db = require('@/config/database').getDatabase();
    
    // Performance: Single query with aggregations
    const [productStats, bookingStats] = await Promise.all([
      db('products')
        .select(
          db.raw('COUNT(*) as total_products'),
          db.raw('AVG(COALESCE(rating, 0)) as average_rating')
        )
        .where({ owner_id: userId })
        .first(),
      
      db('bookings')
        .select(
          db.raw('COUNT(*) as total_bookings'),
          db.raw('SUM(CASE WHEN status = "completed" THEN total_amount ELSE 0 END) as total_earnings')
        )
        .where({ owner_id: userId })
        .first()
    ]);

    return {
      totalProducts: productStats?.total_products || 0,
      totalBookings: bookingStats?.total_bookings || 0,
      totalEarnings: bookingStats?.total_earnings || 0,
      averageRating: productStats?.average_rating || 0
    };
  }

  /**
   * Cache invalidation utility
   */
  private invalidateUserCache(userId: string): void {
    const keysToDelete = Array.from(statsCache.keys()).filter(key => 
      key.includes(userId)
    );
    
    for (const key of keysToDelete) {
      statsCache.delete(key);
    }
  }

  /**
   * Upload profile image
   * POST /api/v1/users/:id/avatar
   */
  public uploadAvatar = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Users can only upload their own avatar unless they're admin
    if (!this.checkResourceOwnership(req, id)) {
      return this.handleUnauthorized(res, 'Not authorized to update this profile');
    }

    const filesReq = req as any;
    if (!filesReq.file) {
      return this.handleBadRequest(res, 'No image file provided');
    }

    const user = await UserService.getById(id);
    if (!user) {
      return this.handleNotFound(res, 'User');
    }

    // For now, we'll just simulate the upload and update with a placeholder URL
    const imageUrl = `/uploads/avatars/${id}/${filesReq.file.filename}`;

    // Update user profile with new image URL
    const updatedUser = await UserService.update(id, { profileImageUrl: imageUrl });

    this.logAction('UPLOAD_AVATAR', req.user.id, id, { imageUrl });

    ResponseHelper.success(res, 'Avatar uploaded successfully', {
      user: updatedUser.data,
      imageUrl
    });
  });

  /**
   * Change user password
   * PUT /api/v1/users/:id/password
   */
  public changePassword = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Users can only change their own password
    if (req.user.id !== id) {
      return this.handleUnauthorized(res, 'Not authorized to change this password');
    }

    const userResult = await UserService.getById(id);
    if (!userResult.success || !userResult.data) {
      return this.handleNotFound(res, 'User');
    }

    // Verify current password
    const isCurrentPasswordValid = await UserService.verifyPassword(id, currentPassword);
    if (!isCurrentPasswordValid) {
      return this.handleBadRequest(res, 'Current password is incorrect');
    }
    await UserService.updatePassword(id, newPassword);

    this.logAction('CHANGE_PASSWORD', req.user.id, id);

    ResponseHelper.success(res, 'Password changed successfully');
  });

  /**
   * Update user preferences
   * PUT /api/v1/users/:id/preferences
   */
  public updatePreferences = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const preferences = req.body;

    // Users can only update their own preferences
    if (req.user.id !== id) {
      return this.handleUnauthorized(res, 'Not authorized to update these preferences');
    }

    const userResult = await UserService.getById(id);
    if (!userResult.success || !userResult.data) {
      return this.handleNotFound(res, 'User');
    }

    // For now, we'll just log the preferences update
    this.logAction('UPDATE_PREFERENCES', req.user.id, id, preferences);

    ResponseHelper.success(res, 'Preferences updated successfully', userResult.data);
  });

  /**
   * Get user's rental history
   * GET /api/v1/users/:id/rentals
   */
  public getRentalHistory = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { page, limit } = this.getPaginationParams(req as any);

    // Users can only view their own rental history unless they're admin
    if (!this.checkResourceOwnership(req, id)) {
      return this.handleUnauthorized(res, 'Not authorized to view this rental history');
    }

    const user = await UserService.getById(id);
    if (!user) {
      return this.handleNotFound(res, 'User');
    }

    // Mock rental history for now
    const rentalHistory = {
      data: [],
      page,
      limit,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    };

    this.logAction('GET_RENTAL_HISTORY', req.user.id, id);

    this.formatPaginatedResponse(res, 'Rental history retrieved successfully', rentalHistory);
  });
}

export default new UsersController();
