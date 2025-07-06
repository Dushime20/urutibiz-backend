/**
 * Cache Management Abstraction
 * Eliminates code duplication and provides consistent caching patterns
 */

export interface CacheStrategy<T> {
  get(key: string): Promise<T | null>;
  set(key: string, data: T, ttl?: number): Promise<void>;
  invalidate(pattern: string): Promise<void>;
  invalidateByKey(key: string): Promise<void>;
  generateKey(params: Record<string, any>): string;
}

export interface CacheOptions {
  defaultTTL: number;
  keyPrefix: string;
  maxSize?: number;
}

/**
 * Generic entity cache manager with intelligent caching strategies
 */
export class EntityCacheManager<T> {
  constructor(
    private strategy: CacheStrategy<T>,
    private entityType: string,
    private options: CacheOptions
  ) {}

  /**
   * Get data from cache or fetch using provided function
   */
  async getOrFetch(
    keyParams: Record<string, any>,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const key = this.generateCacheKey(keyParams);
    
    // Try cache first
    let data = await this.strategy.get(key);
    
    if (!data) {
      // Cache miss - fetch fresh data
      data = await fetchFn();
      await this.strategy.set(key, data, ttl || this.options.defaultTTL);
    }
    
    return data;
  }

  /**
   * Set data in cache with TTL
   */
  async set(keyParams: Record<string, any>, data: T, ttl?: number): Promise<void> {
    const key = this.generateCacheKey(keyParams);
    await this.strategy.set(key, data, ttl || this.options.defaultTTL);
  }

  /**
   * Invalidate specific entity cache
   */
  async invalidateEntity(entityId: string): Promise<void> {
    const pattern = `${this.options.keyPrefix}:${this.entityType}:*:${entityId}:*`;
    await this.strategy.invalidate(pattern);
  }

  /**
   * Invalidate specific cache key
   */
  async invalidateKey(keyParams: Record<string, any>): Promise<void> {
    const key = this.generateCacheKey(keyParams);
    await this.strategy.invalidateByKey(key);
  }

  /**
   * Invalidate all caches for this entity type
   */
  async invalidateAll(): Promise<void> {
    const pattern = `${this.options.keyPrefix}:${this.entityType}:*`;
    await this.strategy.invalidate(pattern);
  }

  /**
   * Generate consistent cache key
   */
  private generateCacheKey(params: Record<string, any>): string {
    const keyParts = [this.options.keyPrefix, this.entityType];
    
    // Add sorted parameters for consistent keys
    const sortedKeys = Object.keys(params).sort();
    for (const key of sortedKeys) {
      keyParts.push(`${key}:${params[key]}`);
    }
    
    return keyParts.join(':');
  }
}

/**
 * In-memory cache strategy for development/testing
 */
export class MemoryCacheStrategy<T> implements CacheStrategy<T> {
  private cache = new Map<string, { data: T; timestamp: number; ttl: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(cleanupIntervalMs: number = 60000) {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
  }

  async get(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  async set(key: string, data: T, ttl: number = 300): Promise<void> {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  async invalidate(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  async invalidateByKey(key: string): Promise<void> {
    this.cache.delete(key);
  }

  generateKey(params: Record<string, any>): string {
    return Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(':');
  }

  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

/**
 * Redis cache strategy for production
 */
export class RedisCacheStrategy<T> implements CacheStrategy<T> {
  constructor(private redisClient: any) {} // Use your Redis client type

  async get(key: string): Promise<T | null> {
    try {
      const data = await this.redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, data: T, ttl: number = 300): Promise<void> {
    try {
      await this.redisClient.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await this.redisClient.keys(pattern);
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
      }
    } catch (error) {
      console.error('Redis invalidate error:', error);
    }
  }

  async invalidateByKey(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
    } catch (error) {
      console.error('Redis invalidateByKey error:', error);
    }
  }

  generateKey(params: Record<string, any>): string {
    return Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(':');
  }
}

/**
 * Cache factory for easy setup
 */
export class CacheFactory {
  static createEntityCache<T>(
    entityType: string,
    strategy: 'memory' | 'redis' = 'memory',
    options: Partial<CacheOptions> = {}
  ): EntityCacheManager<T> {
    const defaultOptions: CacheOptions = {
      defaultTTL: 300,
      keyPrefix: 'urutibiz',
      ...options
    };

    let cacheStrategy: CacheStrategy<T>;
    
    if (strategy === 'redis') {
      // In production, inject Redis client
      const redisClient = require('@/config/redis').getRedisClient();
      cacheStrategy = new RedisCacheStrategy<T>(redisClient);
    } else {
      cacheStrategy = new MemoryCacheStrategy<T>();
    }

    return new EntityCacheManager<T>(cacheStrategy, entityType, defaultOptions);
  }
}
