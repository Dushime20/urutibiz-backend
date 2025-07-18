/**
 * Optimized Base Repository with Performance Enhancements
 * Addresses N+1 queries and pagination inefficiencies
 */

import { IRepository } from '@/interfaces/IRepository';
import { BaseModel, ServiceResponse, PaginationResult } from '@/types';
import logger from '@/utils/logger';
import { getDatabase } from '@/config/database';
import { performanceTrack } from '@/utils/PerformanceMonitor';

// Performance cache for frequently accessed data
const queryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

export abstract class BaseRepository<T extends BaseModel, CreateData = Partial<T>, UpdateData = Partial<T>> 
  implements IRepository<T, CreateData, UpdateData> {
  
  protected abstract readonly tableName: string;
  protected abstract readonly modelClass: new (data: any) => T;
  
  // Configuration properties for child classes
  protected searchFields: string[] = [];
  protected defaultCacheTTL: number = 300; // 5 minutes
  protected cacheKeyPrefix: string = '';

  /**
   * Convert database fields to model format (optimized)
   */
  protected formatDatabaseFields(data: any): any {
    // Convert camelCase keys to snake_case for DB
    const formatted: any = {};
    Object.keys(data).forEach(key => {
      const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      formatted[dbKey] = data[key];
    });
    return formatted;
  }


  /**
   * Convert camelCase to snake_case for database fields
   */
  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Optimized pagination with single query using window functions
   */
  @performanceTrack('BaseRepository.findPaginated')
  async findPaginated(
    criteria: Partial<T> = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<ServiceResponse<PaginationResult<T>>> {
    try {
      const offset = (page - 1) * limit;
      const cacheKey = `${this.tableName}:paginated:${JSON.stringify(criteria)}:${page}:${limit}:${sortBy}:${sortOrder}`;
      
      // Check cache first
      const cached = queryCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return { success: true, data: cached.data };
      }

      // Single query with window function for count
      let query = getDatabase()(this.tableName)
        .select('*', getDatabase().raw('COUNT(*) OVER() as total_count'));
      
      // Apply criteria efficiently
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          const dbKey = this.toSnakeCase(key);
          query = query.where(dbKey, value);
        }
      });

      const results = await query
        .orderBy(this.toSnakeCase(sortBy), sortOrder)
        .limit(limit)
        .offset(offset);

      if (results.length === 0) {
        const emptyResult: PaginationResult<T> = {
          data: [],
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        };
        return { success: true, data: emptyResult };
      }

      const total = parseInt(results[0].total_count as string);
      const entities = results.map(result => {
        // Remove total_count before creating entity
        const { total_count, ...entityData } = result;
        return new this.modelClass(entityData);
      });

      const paginationResult: PaginationResult<T> = {
        data: entities,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      };

      // Cache the result
      queryCache.set(cacheKey, {
        data: paginationResult,
        timestamp: Date.now()
      });

      // Clean cache periodically
      if (queryCache.size > 100) {
        this.cleanExpiredCache();
      }

      return {
        success: true,
        data: paginationResult,
        metadata: { 
          tableName: this.tableName, 
          operation: 'findPaginated', 
          cached: false,
          queryTime: Date.now()
        }
      };
    } catch (error) {
      logger.error(`Failed to find paginated entities in ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to find entities: ${error}`
      };
    }
  }

  /**
   * Optimized batch operations
   */
  @performanceTrack('BaseRepository.batchCreate')
  async batchCreate(dataArray: CreateData[]): Promise<ServiceResponse<T[]>> {
    try {
      const batchSize = 100;
      const results: T[] = [];

      for (let i = 0; i < dataArray.length; i += batchSize) {
        const batch = dataArray.slice(i, i + batchSize);
        
        const batchResults = await getDatabase().transaction(async (trx) => {
          const formattedData = batch.map(data => ({
            ...this.formatDatabaseFields(data),
            created_at: getDatabase().fn.now(),
            updated_at: getDatabase().fn.now()
          }));

          const created = await trx(this.tableName)
            .insert(formattedData)
            .returning('*');

          return created.map(item => new this.modelClass(item));
        });

        results.push(...batchResults);
      }

      // Invalidate relevant caches
      this.invalidateTableCache();

      return {
        success: true,
        data: results,
        metadata: { tableName: this.tableName, operation: 'batchCreate', count: results.length }
      };
    } catch (error) {
      logger.error(`Failed to batch create entities in ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to batch create entities: ${error}`
      };
    }
  }

  /**
   * Optimized search with full-text capabilities
   */
  @performanceTrack('BaseRepository.search')
  async search(
    searchTerm: string,
    searchFields: string[],
    filters: Partial<T> = {},
    limit: number = 50
  ): Promise<ServiceResponse<T[]>> {
    try {
      const cacheKey = `${this.tableName}:search:${searchTerm}:${JSON.stringify(filters)}:${limit}`;
      
      // Check cache
      const cached = queryCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return { success: true, data: cached.data };
      }

      let query = getDatabase()(this.tableName);

      // Apply search across multiple fields
      if (searchTerm && searchFields.length > 0) {
        query = query.where((builder) => {
          searchFields.forEach((field, index) => {
            const dbField = this.toSnakeCase(field);
            if (index === 0) {
              builder.whereILike(dbField, `%${searchTerm}%`);
            } else {
              builder.orWhereILike(dbField, `%${searchTerm}%`);
            }
          });
        });
      }

      // Apply additional filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          const dbKey = this.toSnakeCase(key);
          query = query.where(dbKey, value);
        }
      });

      const results = await query
        .limit(limit)
        .orderBy('created_at', 'desc');

      const entities = results.map(result => new this.modelClass(result));

      // Cache results
      queryCache.set(cacheKey, {
        data: entities,
        timestamp: Date.now()
      });

      return {
        success: true,
        data: entities,
        metadata: { tableName: this.tableName, operation: 'search', count: entities.length }
      };
    } catch (error) {
      logger.error(`Failed to search entities in ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to search entities: ${error}`
      };
    }
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    const expiredKeys = Array.from(queryCache.entries())
      .filter(([_, entry]) => (now - entry.timestamp) > CACHE_TTL)
      .map(([key]) => key);
    
    expiredKeys.forEach(key => queryCache.delete(key));
  }

  /**
   * Invalidate all cache entries for this table
   */
  private invalidateTableCache(): void {
    const tableKeys = Array.from(queryCache.keys())
      .filter(key => key.startsWith(`${this.tableName}:`));
    
    tableKeys.forEach(key => queryCache.delete(key));
  }

  // ... rest of existing methods with performance tracking
  
  @performanceTrack('BaseRepository.create')
  async create(data: CreateData): Promise<ServiceResponse<T>> {
    try {
      // Remove 'user' property if present
      const { user, ...dbData } = data as any;
      // Handle geometry location (POINT)
      let dbLocation = null;
      const location = (dbData as any)?.location;
      if (location && location.latitude && location.longitude) {
        dbLocation = `SRID=4326;POINT(${location.longitude} ${location.latitude})`;
        console.log('[DEBUG] location as WKT:', dbLocation);
      }
      const formattedData = this.formatDatabaseFields(dbData);
      const insertData = {
        ...formattedData,
        location: dbLocation ? getDatabase().raw('ST_GeomFromText(?)', [dbLocation]) : null,
        created_at: getDatabase().fn.now(),
        updated_at: getDatabase().fn.now()
      };
      const [created] = await getDatabase()(this.tableName)
        .insert(insertData)
        .returning('*');

      const entity = new this.modelClass(created);
      
      // Invalidate related caches
      this.invalidateTableCache();
      
      logger.info(`Entity created in ${this.tableName}`, { id: entity.id });

      return {
        success: true,
        data: entity,
        metadata: { tableName: this.tableName, operation: 'create' }
      };
    } catch (error) {
      logger.error(`Failed to create entity in ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to create entity: ${error}`
      };
    }
  }

  @performanceTrack('BaseRepository.findById')
  async findById(id: string): Promise<ServiceResponse<T | null>> {
    try {
      const cacheKey = `${this.tableName}:byId:${id}`;
      
      // Check cache first
      const cached = queryCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return { success: true, data: cached.data };
      }

      const result = await getDatabase()(this.tableName)
        .select('*')
        .where('id', id)
        .first();

      const entity = result ? new this.modelClass(result) : null;

      // Cache the result
      if (entity) {
        queryCache.set(cacheKey, {
          data: entity,
          timestamp: Date.now()
        });
      }

      return {
        success: true,
        data: entity,
        metadata: { tableName: this.tableName, operation: 'findById', cached: false }
      };
    } catch (error) {
      logger.error(`Failed to find entity by ID in ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to find entity: ${error}`
      };
    }
  }

  /**
   * Batch find by specific field values
   */
  @performanceTrack('BaseRepository.batchFindBy')
  async batchFindBy(
    field: keyof T,
    values: any[],
    limit: number = 100
  ): Promise<ServiceResponse<T[]>> {
    try {
      const db = getDatabase();
      const dbField = this.toSnakeCase(field as string);
      
      const cacheKey = `${this.tableName}:batchFindBy:${field as string}:${JSON.stringify(values)}:${limit}`;
      
      // Check cache
      const cached = queryCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return { success: true, data: cached.data };
      }
      
      const entities = await db(this.tableName)
        .whereIn(dbField, values)
        .limit(limit)
        .select();

      const results = entities.map(entity => 
        new this.modelClass(this.formatDatabaseFields(entity))
      );

      // Cache results
      queryCache.set(cacheKey, { data: results, timestamp: Date.now() });

      return {
        success: true,
        data: results,
        metadata: { tableName: this.tableName, operation: 'batchFindBy', count: results.length }
      };
    } catch (error) {
      logger.error(`Failed to batch find entities in ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to batch find entities: ${error}`
      };
    }
  }

  /**
   * Find one entity by criteria
   */
  @performanceTrack('BaseRepository.findOne')
  async findOne(criteria: Partial<T>): Promise<ServiceResponse<T | null>> {
    try {
      const db = getDatabase();
      const cacheKey = `${this.tableName}:findOne:${JSON.stringify(criteria)}`;
      
      // Check cache
      const cached = queryCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return { success: true, data: cached.data };
      }

      let query = db(this.tableName);
      
      // Apply criteria
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          const dbKey = this.toSnakeCase(key);
          query = query.where(dbKey, value);
        }
      });

      const entity = await query.first();
      
      const result = entity ? new this.modelClass(this.formatDatabaseFields(entity)) : null;
      
      // Cache results
      queryCache.set(cacheKey, { data: result, timestamp: Date.now() });

      return {
        success: true,
        data: result,
        metadata: { tableName: this.tableName, operation: 'findOne', found: !!entity }
      };
    } catch (error) {
      logger.error(`Failed to find one entity in ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to find entity: ${error}`
      };
    }
  }

  /**
   * Find with pagination (alias for findPaginated)
   */
  async findWithPagination(
    criteria: Partial<T> = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string[] = ['-created_at']
  ): Promise<ServiceResponse<PaginationResult<T>>> {
    const sortField = sortBy[0]?.replace(/^-/, '') || 'created_at';
    const sortOrder = sortBy[0]?.startsWith('-') ? 'desc' : 'asc';
    return await this.findPaginated(criteria, page, limit, sortField, sortOrder);
  }

  /**
   * Find entity by field
   */
  @performanceTrack('BaseRepository.findBy')
  async findBy(field: keyof T, value: any): Promise<ServiceResponse<T | null>> {
    try {
      const db = getDatabase();
      const dbField = this.toSnakeCase(field as string);
      
      const entity = await db(this.tableName)
        .where(dbField, value)
        .first();

      const result = entity ? new this.modelClass(this.formatDatabaseFields(entity)) : null;

      return {
        success: true,
        data: result,
        metadata: { tableName: this.tableName, operation: 'findBy', found: !!entity }
      };
    } catch (error) {
      logger.error(`Failed to find entity by ${field as string} in ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to find entity: ${error}`
      };
    }
  }

  /**
   * Find multiple entities by criteria
   */
  @performanceTrack('BaseRepository.findMany')
  async findMany(criteria: Partial<T> = {}): Promise<ServiceResponse<T[]>> {
    try {
      const db = getDatabase();
      let query = db(this.tableName);

      // Apply criteria
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          const dbKey = this.toSnakeCase(key);
          query = query.where(dbKey, value);
        }
      });

      const entities = await query.select();
      const results = entities.map(entity => 
        new this.modelClass(this.formatDatabaseFields(entity))
      );

      return {
        success: true,
        data: results,
        metadata: { tableName: this.tableName, operation: 'findMany', count: results.length }
      };
    } catch (error) {
      logger.error(`Failed to find entities in ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to find entities: ${error}`
      };
    }
  }

  /**
   * Update entity by ID
   */
  @performanceTrack('BaseRepository.updateById')
  async updateById(id: string, data: UpdateData): Promise<ServiceResponse<T | null>> {
    try {
      const db = getDatabase();
      
      const updateData = {
        ...data,
        updated_at: new Date()
      };

      const [updated] = await db(this.tableName)
        .where('id', id)
        .update(updateData)
        .returning('*');

      if (!updated) {
        return {
          success: false,
          error: 'Entity not found'
        };
      }

      const result = new this.modelClass(this.formatDatabaseFields(updated));

      // Invalidate cache
      this.invalidateTableCache();

      return {
        success: true,
        data: result,
        metadata: { tableName: this.tableName, operation: 'updateById' }
      };
    } catch (error) {
      logger.error(`Failed to update entity by ID in ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to update entity: ${error}`
      };
    }
  }

  /**
   * Update multiple entities
   */
  @performanceTrack('BaseRepository.updateMany')
  async updateMany(criteria: Partial<T>, data: UpdateData): Promise<ServiceResponse<{ affected: number }>> {
    try {
      const db = getDatabase();
      
      let query = db(this.tableName);
      
      // Apply criteria
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          const dbKey = this.toSnakeCase(key);
          query = query.where(dbKey, value);
        }
      });

      const updateData = {
        ...data,
        updated_at: new Date()
      };

      const affected = await query.update(updateData);

      // Invalidate cache
      this.invalidateTableCache();

      return {
        success: true,
        data: { affected },
        metadata: { tableName: this.tableName, operation: 'updateMany', affected }
      };
    } catch (error) {
      logger.error(`Failed to update entities in ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to update entities: ${error}`
      };
    }
  }

  /**
   * Delete entity by ID
   */
  @performanceTrack('BaseRepository.deleteById')
  async deleteById(id: string, soft: boolean = true): Promise<ServiceResponse<boolean>> {
    try {
      const db = getDatabase();
      
      let result: number;
      
      if (soft) {
        // Soft delete
        result = await db(this.tableName)
          .where('id', id)
          .update({
            deleted_at: new Date(),
            updated_at: new Date()
          });
      } else {
        // Hard delete
        result = await db(this.tableName)
          .where('id', id)
          .delete();
      }

      // Invalidate cache
      this.invalidateTableCache();

      return {
        success: true,
        data: result > 0,
        metadata: { tableName: this.tableName, operation: 'deleteById', soft }
      };
    } catch (error) {
      logger.error(`Failed to delete entity by ID in ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to delete entity: ${error}`
      };
    }
  }

  /**
   * Delete multiple entities
   */
  @performanceTrack('BaseRepository.deleteMany')
  async deleteMany(criteria: Partial<T>, soft: boolean = true): Promise<ServiceResponse<{ affected: number }>> {
    try {
      const db = getDatabase();
      
      let query = db(this.tableName);
      
      // Apply criteria
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          const dbKey = this.toSnakeCase(key);
          query = query.where(dbKey, value);
        }
      });

      let affected: number;
      
      if (soft) {
        // Soft delete
        affected = await query.update({
          deleted_at: new Date(),
          updated_at: new Date()
        });
      } else {
        // Hard delete
        affected = await query.delete();
      }

      // Invalidate cache
      this.invalidateTableCache();

      return {
        success: true,
        data: { affected },
        metadata: { tableName: this.tableName, operation: 'deleteMany', affected, soft }
      };
    } catch (error) {
      logger.error(`Failed to delete entities in ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to delete entities: ${error}`
      };
    }
  }

  /**
   * Check if entity exists
   */
  @performanceTrack('BaseRepository.exists')
  async exists(criteria: Partial<T>): Promise<ServiceResponse<boolean>> {
    try {
      const db = getDatabase();
      
      let query = db(this.tableName);
      
      // Apply criteria
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          const dbKey = this.toSnakeCase(key);
          query = query.where(dbKey, value);
        }
      });

      const result = await query.first();

      return {
        success: true,
        data: !!result,
        metadata: { tableName: this.tableName, operation: 'exists' }
      };
    } catch (error) {
      logger.error(`Failed to check existence in ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to check existence: ${error}`
      };
    }
  }

  /**
   * Count entities matching criteria
   */
  @performanceTrack('BaseRepository.count')
  async count(criteria: Partial<T> = {}): Promise<ServiceResponse<number>> {
    try {
      const db = getDatabase();
      
      let query = db(this.tableName);
      
      // Apply criteria
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          const dbKey = this.toSnakeCase(key);
          query = query.where(dbKey, value);
        }
      });

      const result = await query.count('* as count').first();
      const count = parseInt(result?.count as string) || 0;

      return {
        success: true,
        data: count,
        metadata: { tableName: this.tableName, operation: 'count' }
      };
    } catch (error) {
      logger.error(`Failed to count entities in ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to count entities: ${error}`
      };
    }
  }

  /**
   * Execute raw query
   */
  @performanceTrack('BaseRepository.raw')
  async raw(query: string, params: any[] = []): Promise<ServiceResponse<any>> {
    try {
      const db = getDatabase();
      const result = await db.raw(query, params);

      return {
        success: true,
        data: result,
        metadata: { tableName: this.tableName, operation: 'raw' }
      };
    } catch (error) {
      logger.error(`Failed to execute raw query in ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to execute query: ${error}`
      };
    }
  }

  /**
   * Begin database transaction
   */
  async beginTransaction(): Promise<any> {
    const db = getDatabase();
    return await db.transaction();
  }

  /**
   * Commit database transaction
   */
  async commitTransaction(transaction: any): Promise<void> {
    await transaction.commit();
  }

  /**
   * Rollback database transaction
   */
  async rollbackTransaction(transaction: any): Promise<void> {
    await transaction.rollback();
  }

  // ...existing code...
}

// Export as OptimizedBaseRepository for clarity
export { BaseRepository as OptimizedBaseRepository };
