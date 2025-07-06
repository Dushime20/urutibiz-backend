/**
 * Real-time Recommendation Cache
 * High-performance caching system for AI recommendations
 */

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
  tags: string[];
}

interface CacheStats {
  totalKeys: number;
  hitRate: number;
  missRate: number;
  memoryUsage: number;
  oldestEntry: number;
  newestEntry: number;
}

interface CacheOptions {
  defaultTTL: number;
  maxSize: number;
  cleanupInterval: number;
  enableStats: boolean;
}

export class RecommendationCache {
  private cache = new Map<string, CacheEntry>();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0
  };
  
  private cleanupTimer?: NodeJS.Timeout;
  
  constructor(private options: CacheOptions = {
    defaultTTL: 3600000, // 1 hour
    maxSize: 10000,
    cleanupInterval: 300000, // 5 minutes
    enableStats: true
  }) {
    this.startCleanupTimer();
  }

  /**
   * Get cached recommendations for user
   */
  async getUserRecommendations(userId: string): Promise<any[] | null> {
    const key = `user_recs:${userId}`;
    return this.get(key);
  }

  /**
   * Cache recommendations for user
   */
  async setUserRecommendations(
    userId: string, 
    recommendations: any[], 
    ttl?: number,
    tags: string[] = []
  ): Promise<void> {
    const key = `user_recs:${userId}`;
    await this.set(key, recommendations, ttl, [...tags, 'user_recommendations']);
  }

  /**
   * Get cached analytics data
   */
  async getAnalytics(analyticsKey: string): Promise<any | null> {
    const key = `analytics:${analyticsKey}`;
    return this.get(key);
  }

  /**
   * Cache analytics data
   */
  async setAnalytics(
    analyticsKey: string, 
    data: any, 
    ttl: number = 600000 // 10 minutes
  ): Promise<void> {
    const key = `analytics:${analyticsKey}`;
    await this.set(key, data, ttl, ['analytics']);
  }

  /**
   * Get cached user behavior profile
   */
  async getUserProfile(userId: string): Promise<any | null> {
    const key = `profile:${userId}`;
    return this.get(key);
  }

  /**
   * Cache user behavior profile
   */
  async setUserProfile(
    userId: string, 
    profile: any, 
    ttl: number = 1800000 // 30 minutes
  ): Promise<void> {
    const key = `profile:${userId}`;
    await this.set(key, profile, ttl, ['user_profiles']);
  }

  /**
   * Get cached product similarities
   */
  async getProductSimilarities(productId: string): Promise<any | null> {
    const key = `similarities:${productId}`;
    return this.get(key);
  }

  /**
   * Cache product similarities
   */
  async setProductSimilarities(
    productId: string, 
    similarities: any, 
    ttl: number = 3600000 // 1 hour
  ): Promise<void> {
    const key = `similarities:${productId}`;
    await this.set(key, similarities, ttl, ['product_similarities']);
  }

  /**
   * Get cached trending products
   */
  async getTrendingProducts(): Promise<any[] | null> {
    const key = 'trending_products';
    return this.get(key);
  }

  /**
   * Cache trending products
   */
  async setTrendingProducts(
    products: any[], 
    ttl: number = 900000 // 15 minutes
  ): Promise<void> {
    const key = 'trending_products';
    await this.set(key, products, ttl, ['trending']);
  }

  /**
   * Generic get method
   */
  private get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    
    // Check if expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      return null;
    }

    // Update access stats
    entry.hits++;
    entry.lastAccessed = now;
    this.stats.hits++;

    return entry.data as T;
  }

  /**
   * Generic set method
   */
  private async set<T>(
    key: string, 
    data: T, 
    ttl?: number, 
    tags: string[] = []
  ): Promise<void> {
    const now = Date.now();
    
    // Check size limit and evict if necessary
    if (this.cache.size >= this.options.maxSize) {
      await this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: ttl || this.options.defaultTTL,
      hits: 0,
      lastAccessed: now,
      tags
    };

    this.cache.set(key, entry);
    this.stats.sets++;
  }

  /**
   * Invalidate cache entries by tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    let deleted = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        deleted++;
        this.stats.deletes++;
      }
    }

    return deleted;
  }

  /**
   * Invalidate cache entries by user
   */
  async invalidateUser(userId: string): Promise<number> {
    let deleted = 0;
    const userKeys = [
      `user_recs:${userId}`,
      `profile:${userId}`
    ];

    for (const key of userKeys) {
      if (this.cache.delete(key)) {
        deleted++;
        this.stats.deletes++;
      }
    }

    return deleted;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    const missRate = 100 - hitRate;

    let oldestEntry = Date.now();
    let newestEntry = 0;
    let memoryUsage = 0;

    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldestEntry) oldestEntry = entry.timestamp;
      if (entry.timestamp > newestEntry) newestEntry = entry.timestamp;
      
      // Rough memory estimation
      memoryUsage += JSON.stringify(entry.data).length * 2; // UTF-16
    }

    return {
      totalKeys: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      missRate: Math.round(missRate * 100) / 100,
      memoryUsage,
      oldestEntry,
      newestEntry
    };
  }

  /**
   * Get detailed cache info
   */
  getDetailedStats() {
    const stats = this.getStats();
    return {
      ...stats,
      operations: { ...this.stats },
      topKeys: this.getTopAccessedKeys(10),
      expiringSoon: this.getExpiringSoonKeys(10)
    };
  }

  /**
   * Warm up cache with precomputed data
   */
  async warmUp(warmupData: Record<string, any>): Promise<void> {
    console.log('🔥 Warming up recommendation cache...');
    
    for (const [key, data] of Object.entries(warmupData)) {
      await this.set(key, data);
    }
    
    console.log(`✅ Cache warmed up with ${Object.keys(warmupData).length} entries`);
  }

  /**
   * Precompute recommendations for active users
   */
  async precomputeActiveUsers(userIds: string[]): Promise<void> {
    console.log(`🔄 Precomputing recommendations for ${userIds.length} active users...`);
    
    // This would be called from a background job
    // Implementation depends on your recommendation service
    
    console.log('✅ Precomputation completed');
  }

  // Private helper methods

  private async evictLeastRecentlyUsed(): Promise<void> {
    let lruKey = '';
    let oldestAccess = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.stats.evictions++;
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.options.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
        this.stats.evictions++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  private getTopAccessedKeys(limit: number): Array<{ key: string; hits: number }> {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, hits: entry.hits }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit);

    return entries;
  }

  private getExpiringSoonKeys(limit: number): Array<{ key: string; expiresIn: number }> {
    const now = Date.now();
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        expiresIn: entry.ttl - (now - entry.timestamp)
      }))
      .filter(item => item.expiresIn > 0)
      .sort((a, b) => a.expiresIn - b.expiresIn)
      .slice(0, limit);

    return entries;
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cache.clear();
  }
}

// Singleton instance
export const recommendationCache = new RecommendationCache();
