/**
 * Refactored High-Performance User Management Controller
 * 
 * Applied refactoring patterns:
 * - Method extraction for single responsibility
 * - Cache management abstraction
 * - Validation pipeline integration
 * - Centralized error handling
 * 
 * @version 3.0.0 - Refactored for Maintainability
 */

import { Response } from 'express';
import { EnhancedBaseController } from './EnhancedBaseController';
import UserService from '@/services/UserService';
import { AuthenticatedRequest } from '@/types';
import { UpdateUserData } from '@/types/user.types';
import { NotFoundError, ForbiddenError } from '@/utils/ErrorHandler';

/**
 * Refactored Users Controller with improved maintainability
 */
export class RefactoredUsersController extends EnhancedBaseController {
  
  /**
   * Get all users with pagination and filtering
   * GET /api/v1/users
   */
  public getUsers = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Extract and validate parameters
    const { page, limit } = this.getPaginationParams(req as any);
    const { sortBy, sortOrder } = this.getSortParams(req as any);
    
    // Get cached or fresh data
    const users = await this.getCachedOrFetch(
      'users',
      { action: 'list', page, limit, sortBy, sortOrder },
      () => this.fetchUsersList(page, limit, sortBy, sortOrder),
      300 // 5 minutes TTL
    );

    this.logAction('GET_USERS', req.user.id);
    return this.sendSuccess(res, 'Users retrieved successfully', users);
  });

  /**
   * Get single user profile
   * GET /api/v1/users/:id
   */
  public getUser = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Validate access using validation chain
    const validation = await this.validateRequest('userProfile', {
      id,
      requesterId: req.user.id,
      role: req.user.role
    });

    if (!validation.isValid) {
      throw new ForbiddenError(validation.error);
    }

    // Get user data
    const userData = await this.getUserProfileData(id);
    
    this.logAction('GET_USER', req.user.id, id);
    return this.sendSuccess(res, 'User retrieved successfully', userData);
  });

  /**
   * Update user profile
   * PUT /api/v1/users/:id
   */
  public updateUser = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Validate access
    await this.validateUserAccess(req.user.id, id, req.user.role);
    
    // Prepare and validate update data
    const updateData = this.prepareUserUpdateData(req.body, req.user.role);
    
    // Perform update
    const updatedUser = await this.performUserUpdate(id, updateData);
    
    // Invalidate cache
    await this.invalidateEntityCache('users', id);
    
    this.logAction('UPDATE_USER', req.user.id, id, updateData);
    return this.sendSuccess(res, 'User updated successfully', updatedUser);
  });

  /**
   * Get user statistics
   * GET /api/v1/users/:id/stats
   */
  public getUserStats = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Validate access
    await this.validateUserAccess(req.user.id, id, req.user.role);
    
    // Get cached stats
    const stats = await this.getCachedOrFetch(
      'userStats',
      { userId: id },
      () => this.calculateUserStatistics(id),
      600 // 10 minutes TTL
    );

    this.logAction('GET_USER_STATS', req.user.id, id);
    return this.sendSuccess(res, 'User statistics retrieved successfully', stats);
  });

  /**
   * Delete user account
   * DELETE /api/v1/users/:id
   */
  public deleteUser = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Validate access (only self or admin)
    await this.validateUserAccess(req.user.id, id, req.user.role);
    
    // Perform deletion
    const result = await UserService.delete(id);
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete user');
    }

    // Invalidate cache
    await this.invalidateEntityCache('users', id);
    
    this.logAction('DELETE_USER', req.user.id, id);
    return this.sendSuccess(res, 'User account deleted successfully');
  });

  // ===== EXTRACTED HELPER METHODS =====

  /**
   * Validate user access permissions
   */
  private async validateUserAccess(requesterId: string, targetId: string, role?: string): Promise<void> {
    const hasAccess = await this.checkResourceAccess(requesterId, targetId, role);
    if (!hasAccess) {
      throw new ForbiddenError('Not authorized to access this user profile');
    }
  }

  /**
   * Fetch users list with pagination
   */
  private async fetchUsersList(page: number, limit: number, sortBy: string, sortOrder: 'asc' | 'desc'): Promise<any> {
    const result = await UserService.getPaginated({}, page, limit, sortBy, sortOrder);
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch users');
    }
    return result.data;
  }

  /**
   * Get user profile data with verifications
   */
  private async getUserProfileData(id: string): Promise<any> {
    const [userResult, verifications] = await Promise.all([
      UserService.getById(id),
      this.fetchUserVerifications(id)
    ]);

    if (!userResult.success || !userResult.data) {
      throw new NotFoundError('User not found');
    }

    return {
      ...userResult.data,
      verifications,
      kycProgress: this.calculateKycProgress(verifications)
    };
  }

  /**
   * Prepare user update data with role-based permissions
   */
  private prepareUserUpdateData(body: any, userRole?: string): UpdateUserData {
    const allowedFields: (keyof UpdateUserData)[] = ['firstName', 'lastName', 'dateOfBirth', 'profileImageUrl'];
    
    // Add admin-only fields
    if (userRole === 'admin') {
      allowedFields.push('status' as keyof UpdateUserData);
    }
    
    return this.prepareUpdateData<UpdateUserData>(body, allowedFields);
  }

  /**
   * Perform user update operation
   */
  private async performUserUpdate(id: string, updateData: UpdateUserData): Promise<any> {
    const result = await UserService.update(id, updateData);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update user');
    }
    return result.data;
  }

  /**
   * Calculate user statistics
   */
  private async calculateUserStatistics(userId: string): Promise<any> {
    const db = require('@/config/database').getDatabase();
    
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
   * Fetch user verifications
   */
  private async fetchUserVerifications(userId: string): Promise<any[]> {
    const db = require('@/config/database').getDatabase();
    
    return await db('user_verifications')
      .select('verification_type', 'verification_status', 'created_at', 'updated_at')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(50);
  }

  /**
   * Calculate KYC progress
   */
  private calculateKycProgress(verifications: any[]): any {
    const requiredTypes = new Set(['national_id', 'selfie', 'address']);
    const verified = new Set();
    const pending = new Set();
    const rejected = new Set();

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
}

export default new RefactoredUsersController();
