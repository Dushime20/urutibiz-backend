/**
 * Refactored User Management Controller - Example Implementation
 * 
 * Demonstrates application of refactoring patterns:
 * - Method extraction for single responsibility
 * - Cache management abstraction
 * - Validation pipeline pattern
 * - Error handling centralization
 * - Data transformation pipeline
 * 
 * @version 3.0.0 - Refactored for Maintainability
 */

import { Response } from 'express';
import { BaseController } from './BaseController';
import UserService from '@/services/UserService';
import { AuthenticatedRequest, UpdateUserData } from '@/types';
import { ResponseHelper } from '@/utils/response';

// ===== CACHE MANAGEMENT ABSTRACTION =====
interface CacheStrategy<T> {
  get(key: string): Promise<T | null>;
  set(key: string, data: T, ttl?: number): Promise<void>;
  invalidate(pattern: string): Promise<void>;
  generateKey(params: Record<string, any>): string;
}

class EntityCacheManager<T> {
  constructor(
    private strategy: CacheStrategy<T>,
    private entityType: string,
    private defaultTTL: number
  ) {}

  async getOrFetch(
    keyParams: Record<string, any>,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const key = this.strategy.generateKey({ entity: this.entityType, ...keyParams });
    
    let data = await this.strategy.get(key);
    if (!data) {
      data = await fetchFn();
      await this.strategy.set(key, data, ttl || this.defaultTTL);
    }
    
    return data;
  }

  async invalidateEntity(id: string): Promise<void> {
    await this.strategy.invalidate(`${this.entityType}:*:${id}:*`);
  }
}

// ===== VALIDATION PIPELINE =====
interface ValidationResult {
  isValid: boolean;
  error?: string;
}

class ValidationChain {
  private validators: Array<(data: any) => Promise<ValidationResult>> = [];
  
  add(validator: (data: any) => Promise<ValidationResult>): ValidationChain {
    this.validators.push(validator);
    return this;
  }
  
  async validate(data: any): Promise<ValidationResult> {
    for (const validator of this.validators) {
      const result = await validator(data);
      if (!result.isValid) return result;
    }
    return { isValid: true };
  }
}

// ===== DATA TRANSFORMERS =====
interface DataTransformer<TInput, TOutput> {
  transform(input: TInput): TOutput | Promise<TOutput>;
}

class UserProfileTransformer implements DataTransformer<any, any> {
  transform(rawUser: any): any {
    return {
      id: rawUser.id,
      name: `${rawUser.firstName || ''} ${rawUser.lastName || ''}`.trim(),
      email: rawUser.email,
      profileImage: rawUser.profileImageUrl,
      status: rawUser.status,
      role: rawUser.role,
      createdAt: rawUser.createdAt,
      updatedAt: rawUser.updatedAt
    };
  }
}

class KycProgressTransformer implements DataTransformer<any[], any> {
  transform(verifications: any[]): any {
    const requiredTypes = new Set(['national_id', 'selfie', 'address']);
    const verified = new Set();
    const pending = new Set();
    const rejected = new Set();

    for (const v of verifications) {
      switch (v.verification_status) {
        case 'verified': verified.add(v.verification_type); break;
        case 'pending': pending.add(v.verification_type); break;
        case 'rejected': rejected.add(v.verification_type); break;
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

class TransformationPipeline<T> {
  private transformers: Array<DataTransformer<any, any>> = [];
  
  pipe<TOutput>(transformer: DataTransformer<T, TOutput>): TransformationPipeline<TOutput> {
    const newPipeline = new TransformationPipeline<TOutput>();
    newPipeline.transformers = [...this.transformers, transformer];
    return newPipeline;
  }
  
  async execute(input: T): Promise<any> {
    let result = input;
    for (const transformer of this.transformers) {
      result = await transformer.transform(result);
    }
    return result;
  }
}

// ===== USER VALIDATORS =====
const userValidators = {
  async checkUserExists(userData: { id: string }): Promise<ValidationResult> {
    const user = await UserService.getById(userData.id);
    return user.success 
      ? { isValid: true }
      : { isValid: false, error: 'User not found' };
  },
  
  async checkUserAccess(userData: { requesterId: string; targetId: string; role?: string }): Promise<ValidationResult> {
    const isOwnProfile = userData.requesterId === userData.targetId;
    const isAdmin = userData.role === 'admin';
    
    return (isOwnProfile || isAdmin)
      ? { isValid: true }
      : { isValid: false, error: 'Not authorized to access this user profile' };
  }
};

// ===== REFACTORED USERS CONTROLLER =====
export class UsersControllerRefactored extends BaseController {
  private userCache: EntityCacheManager<any>;
  private userProfilePipeline: TransformationPipeline<any>;
  
  constructor() {
    super();
    this.initializeCacheManager();
    this.initializeTransformationPipeline();
  }

  /**
   * Centralized error handling
   */
  private handleError(error: unknown, res: Response, operation: string): Response {
    console.error(`Error in ${operation}:`, error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return ResponseHelper.error(res, message, 500);
  }

  /**
   * Initialize cache management
   */
  private initializeCacheManager(): void {
    // Mock cache strategy - in real implementation, use Redis
    const mockCacheStrategy: CacheStrategy<any> = {
      async get(_key: string) { return null; },
      async set(_key: string, _data: any, _ttl?: number) { },
      async invalidate(_pattern: string) { },
      generateKey(params: Record<string, any>): string {
        return Object.entries(params)
          .map(([k, v]) => `${k}:${v}`)
          .join(':');
      }
    };
    
    this.userCache = new EntityCacheManager(mockCacheStrategy, 'user', 300);
  }

  /**
   * Initialize data transformation pipeline
   */
  private initializeTransformationPipeline(): void {
    this.userProfilePipeline = new TransformationPipeline<any>()
      .pipe(new UserProfileTransformer());
  }

  /**
   * Refactored user profile retrieval - Clean and focused
   * GET /api/v1/users/:id
   */
  public getUser = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    try {
      // Step 1: Validate access
      await this.validateUserAccess(req, id);
      
      // Step 2: Get user data (cached or fresh)
      const userData = await this.getUserProfileData(id);
      
      // Step 3: Transform and respond
      const transformedUser = await this.userProfilePipeline.execute(userData);
      
      this.logAction('GET_USER', req.user.id, id);
      return ResponseHelper.success(res, 'User retrieved successfully', transformedUser);
      
    } catch (error) {
      return this.handleError(error, res, 'getUser');
    }
  });

  /**
   * Refactored user statistics - Focused responsibility
   * GET /api/v1/users/:id/stats
   */
  public getUserStats = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    try {
      await this.validateUserAccess(req, id);
      
      const stats = await this.userCache.getOrFetch(
        { id, action: 'stats' },
        () => this.calculateUserStatistics(id),
        600 // 10 minutes TTL for stats
      );
      
      this.logAction('GET_USER_STATS', req.user.id, id);
      return ResponseHelper.success(res, 'User statistics retrieved successfully', stats);
      
    } catch (error) {
      return this.handleError(error, res, 'getUserStats');
    }
  });

  /**
   * Refactored user update - Clean validation and processing
   * PUT /api/v1/users/:id
   */
  public updateUser = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    try {
      // Validate access and data
      await this.validateUserAccess(req, id);
      const updateData = await this.validateAndPrepareUpdateData(req);
      
      // Perform update
      const updatedUser = await this.performUserUpdate(id, updateData);
      
      // Invalidate cache and respond
      await this.userCache.invalidateEntity(id);
      
      this.logAction('UPDATE_USER', req.user.id, id, updateData);
      return ResponseHelper.success(res, 'User updated successfully', updatedUser);
      
    } catch (error) {
      return this.handleError(error, res, 'updateUser');
    }
  });

  // ===== EXTRACTED FOCUSED METHODS =====

  /**
   * Validate user access with clear responsibility
   */
  private async validateUserAccess(req: AuthenticatedRequest, targetId: string): Promise<void> {
    const validation = await new ValidationChain()
      .add(userValidators.checkUserExists)
      .add(userValidators.checkUserAccess)
      .validate({
        id: targetId,
        requesterId: req.user.id,
        targetId,
        role: req.user.role
      });
      
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
  }

  /**
   * Get user profile data with caching
   */
  private async getUserProfileData(id: string): Promise<any> {
    return await this.userCache.getOrFetch(
      { id, action: 'profile' },
      async () => {
        const [userResult, verifications] = await Promise.all([
          UserService.getById(id),
          this.fetchUserVerifications(id)
        ]);

        if (!userResult.success || !userResult.data) {
          throw new Error('User not found');
        }

        return {
          ...userResult.data,
          verifications,
          kycProgress: new KycProgressTransformer().transform(verifications)
        };
      }
    );
  }

  /**
   * Calculate user statistics with focused logic
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
   * Validate and prepare update data
   */
  private async validateAndPrepareUpdateData(req: AuthenticatedRequest): Promise<UpdateUserData> {
    const updateData: UpdateUserData = {};
    
    // Extract and validate only allowed fields
    const allowedFields = ['firstName', 'lastName', 'dateOfBirth', 'profileImageUrl'];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field as keyof UpdateUserData] = req.body[field];
      }
    }

    // Admin-only updates
    if (req.user.role === 'admin' && req.body.status !== undefined) {
      updateData.status = req.body.status;
    }

    return updateData;
  }

  /**
   * Perform user update with error handling
   */
  private async performUserUpdate(id: string, updateData: UpdateUserData): Promise<any> {
    const result = await UserService.update(id, updateData);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update user');
    }
    
    return result.data;
  }

  /**
   * Fetch user verifications with optimized query
   */
  private async fetchUserVerifications(userId: string): Promise<any[]> {
    const db = require('@/config/database').getDatabase();
    
    return await db('user_verifications')
      .select('verification_type', 'verification_status', 'created_at', 'updated_at')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(50);
  }
}

export default new UsersControllerRefactored();
