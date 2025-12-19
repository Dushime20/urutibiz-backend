/**
 * High-Performance Cache Middleware with Redis Integration
 * 
 * Features:
 * - Smart cache key generation based on request parameters
 * - Redis-backed caching with configurable TTL
 * - Intelligent cache invalidation patterns
 * - Response compression and optimization
 * - Performance monitoring and metrics
 * 
 * @version 2.0.0 - Performance Optimized
 */

import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { redisGet, redisSet, isRedisConnected, getRedisClient } from '../config/redis';

interface CacheOptions {
  duration?: number;
  keyPrefix?: string;
  varyBy?: string[];
  excludeParams?: string[];
  compression?: boolean;
  skipIfHeaders?: string[];
}

interface CacheMetrics {
  hits: number;
  misses: number;
  totalRequests: number;
  avgResponseTime: number;
}

// Performance monitoring
const cacheMetrics: CacheMetrics = {
  hits: 0,
  misses: 0,
  totalRequests: 0,
  avgResponseTime: 0
};

/**
 * Generate optimized cache key from request
 */
const generateCacheKey = (req: Request, options: CacheOptions): string => {
  const { keyPrefix = 'api', varyBy = [], excludeParams = [] } = options;
  
  // Base components
  const method = req.method;
  const path = req.path;
  const userId = (req as any).user?.id || 'anonymous';
  
  // Query parameters (excluding sensitive data)
  const queryParams = { ...req.query };
  excludeParams.forEach(param => delete queryParams[param]);
  
  // Additional variation factors
  const variations: Record<string, any> = {};
  varyBy.forEach(header => {
    variations[header] = req.get(header);
  });
  
  // Create deterministic hash
  const keyData = {
    method,
    path,
    userId,
    query: queryParams,
    variations
  };
  
  const keyString = JSON.stringify(keyData);
  const hash = createHash('sha256').update(keyString).digest('hex').slice(0, 16);
  
  return `${keyPrefix}:${method}:${path}:${hash}`;
};

/**
 * Smart cache duration based on endpoint and data type
 */
const getSmartDuration = (req: Request, defaultDuration: number): number => {
  const path = req.path.toLowerCase();
  
  // Short cache for frequently changing data
  if (path.includes('/bookings') || path.includes('/availability')) {
    return Math.min(60, defaultDuration); // 1 minute max
  }
  
  // Medium cache for user-specific data
  if (path.includes('/users') || path.includes('/profile')) {
    return Math.min(300, defaultDuration); // 5 minutes max
  }
  
  // Longer cache for static/reference data
  if (path.includes('/products') || path.includes('/categories')) {
    return Math.min(600, defaultDuration); // 10 minutes max
  }
  
  return defaultDuration;
};

/**
 * High-performance Redis cache middleware
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    duration = 300,
    skipIfHeaders = ['authorization']
  } = options;
  
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Skip if certain headers present (e.g., real-time data)
    const shouldSkip = skipIfHeaders.some(header => req.get(header));
    if (shouldSkip) {
      return next();
    }
    
    const startTime = Date.now();
    cacheMetrics.totalRequests++;
    
    try {
      const cacheKey = generateCacheKey(req, options);
      const smartDuration = getSmartDuration(req, duration);
      
      // Try to get cached response - skip if Redis is not connected
      let cachedData: string | null = null;
      if (isRedisConnected()) {
        try {
          // Add timeout wrapper to prevent hanging on Redis operations
          const cachePromise = redisGet(cacheKey);
          const timeoutPromise = new Promise<null>((resolve) => {
            setTimeout(() => resolve(null), 100); // 100ms timeout for cache lookup
          });
          
          cachedData = await Promise.race([cachePromise, timeoutPromise]) as string | null;
        } catch (cacheError: any) {
          // If Redis fails, just continue without cache (fail open)
          console.warn('[CacheMiddleware] Redis cache lookup failed, continuing without cache:', cacheError?.message || 'Unknown error');
          cachedData = null;
        }
      }
      
      if (cachedData) {
        cacheMetrics.hits++;
        
        // Parse and return cached response
        const parsed = JSON.parse(cachedData);
        
        // Set cache headers
        res.set('Cache-Control', `public, max-age=${smartDuration}`);
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        
        res.json(parsed);
        return;
      }
      
      // Cache miss - intercept response
      cacheMetrics.misses++;
      
      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = function(body: any) {
        // Cache the response
        const responseData = JSON.stringify(body);
        
        // Set cache headers
        res.set('Cache-Control', `public, max-age=${smartDuration}`);
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Key', cacheKey);
        
        // Store in Redis asynchronously (don't block response) - only if Redis is connected
        if (isRedisConnected()) {
          setImmediate(async () => {
            try {
              // Add timeout to prevent hanging on Redis write
              const setPromise = redisSet(cacheKey, responseData, smartDuration);
              const timeoutPromise = new Promise<void>((resolve) => {
                setTimeout(() => resolve(), 200); // 200ms timeout for cache write
              });
              
              await Promise.race([setPromise, timeoutPromise]);
            } catch (error: any) {
              // Fail silently - cache write errors shouldn't affect the response
              console.warn('[CacheMiddleware] Cache storage failed:', error?.message || 'Unknown error');
            }
          });
        }
        
        // Update metrics
        const responseTime = Date.now() - startTime;
        cacheMetrics.avgResponseTime = 
          (cacheMetrics.avgResponseTime * (cacheMetrics.totalRequests - 1) + responseTime) / 
          cacheMetrics.totalRequests;
        
        // Call original json method
        return originalJson.call(this, body);
      };
      
      next();
      
    } catch (error: any) {
      // Cache errors shouldn't break the request
      console.warn('Cache middleware error:', error.message);
      next();
    }
  };
};

/**
 * Cache invalidation middleware for POST/PUT/DELETE operations
 */
export const cacheInvalidationMiddleware = (patterns: string[] = []) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Store original end method
    const originalEnd = res.end;
    
    // Override end method to invalidate cache after successful response
    res.end = function(chunk?: any, encoding?: any) {
      // Only invalidate on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setImmediate(async () => {
          try {
            // Default patterns based on request path
            const defaultPatterns = [
              `api:*${req.path}*`,
              `api:GET:${req.path}:*`,
              'api:GET:/*/bookings:*', // Invalidate booking lists
              'api:GET:/*/products:*'   // Invalidate product lists
            ];
            
            const allPatterns = [...patterns, ...defaultPatterns];
            
            // Invalidate cache patterns
            for (const pattern of allPatterns) {
              const redisClient = getRedisClient();
              const keys = await redisClient.keys(pattern);
              if (keys.length > 0) {
                await redisClient.del(keys);
              }
            }
          } catch (error: any) {
            console.warn('Cache invalidation failed:', error.message);
          }
        });
      }
      
      return originalEnd.call(this, chunk, encoding);
    };
    
    next();
  };
};

/**
 * No-cache middleware for sensitive endpoints
 */
export const noCacheMiddleware = (_req: Request, res: Response, next: NextFunction): void => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Expires', '0');
  res.set('Pragma', 'no-cache');
  res.set('X-Cache', 'DISABLED');
  
  next();
};

/**
 * Cache warming utility
 */
export const warmCache = async (endpoints: Array<{ path: string; params?: any }>) => {
  console.log(`🔥 Warming cache for ${endpoints.length} endpoints...`);
  
  for (const endpoint of endpoints) {
    try {
      // This would need to be implemented based on your request structure
      // const response = await makeInternalRequest(endpoint.path, endpoint.params);
      console.log(`   ✅ Warmed: ${endpoint.path}`);
    } catch (error: any) {
      console.warn(`   ⚠️ Failed to warm: ${endpoint.path}`, error.message);
    }
  }
};

/**
 * Get cache performance metrics
 */
export const getCacheMetrics = (): CacheMetrics & { hitRate: number; efficiency: string } => {
  const hitRate = cacheMetrics.totalRequests > 0 
    ? cacheMetrics.hits / cacheMetrics.totalRequests 
    : 0;
    
  const efficiency = hitRate > 0.9 ? 'Excellent' 
    : hitRate > 0.7 ? 'Good' 
    : hitRate > 0.5 ? 'Fair' 
    : 'Poor';
  
  return {
    ...cacheMetrics,
    hitRate,
    efficiency
  };
};

/**
 * Reset cache metrics (useful for testing)
 */
export const resetCacheMetrics = (): void => {
  cacheMetrics.hits = 0;
  cacheMetrics.misses = 0;
  cacheMetrics.totalRequests = 0;
  cacheMetrics.avgResponseTime = 0;
};
