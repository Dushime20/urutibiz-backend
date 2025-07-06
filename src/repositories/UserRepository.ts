import { OptimizedBaseRepository } from './BaseRepository.optimized';
import User from '@/models/User.model';
import { UserData, CreateUserData, UpdateUserData } from '@/types/user.types';

class UserRepository extends OptimizedBaseRepository<UserData, CreateUserData, UpdateUserData> {
  protected readonly tableName = 'users';
  protected readonly modelClass = User;
  
  constructor() {
    super();
    
    // Configure search fields for users
    this.searchFields = ['name', 'email', 'username'];
    
    // Configure cache settings for users
    this.defaultCacheTTL = 300; // 5 minutes
    this.cacheKeyPrefix = 'user';
  }
  
  /**
   * Find user by email with caching
   */
  async findByEmail(email: string) {
    return await this.findOne({ email });
  }
  
  /**
   * Find users by role with batch processing
   */
  async findByRole(role: string, limit: number = 50) {
    const result = await this.batchFindBy('role', [role], limit);
    return result.success ? result.data : [];
  }
  
  /**
   * Search users with optimized full-text search
   */
  async searchUsers(query: string, _page: number = 1, limit: number = 20) {
    const result = await this.search(query, this.searchFields, {}, limit);
    return result.success ? result.data : [];
  }
}

export default new UserRepository();
