import { IRepository } from '@/interfaces/IRepository';
import { BaseModel, ServiceResponse, PaginationResult } from '@/types';
import logger from '@/utils/logger';
import { getDatabase } from '@/config/database';

/**
 * Generic base repository implementation
 */
export abstract class BaseRepository<T extends BaseModel, CreateData = Partial<T>, UpdateData = Partial<T>> 
  implements IRepository<T, CreateData, UpdateData> {
  
  protected abstract readonly tableName: string;
  protected abstract readonly modelClass: new (data: any) => T;

  /**
   * Convert database fields to model format
   */
  protected formatDatabaseFields(data: any): any {
    const formatted: any = {};
    Object.keys(data).forEach(key => {
      // Convert camelCase to snake_case for database
      const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      formatted[dbKey] = data[key];
    });
    return formatted;
  }

  /**
   * Convert model fields to response format
   */
  protected formatResponseFields(data: any): any {
    const formatted: any = {};
    Object.keys(data).forEach(key => {
      // Convert snake_case to camelCase for response
      const responseKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      formatted[responseKey] = data[key];
    });
    return formatted;
  }

  /**
   * Create new entity
   */
  async create(data: CreateData): Promise<ServiceResponse<T>> {
    try {
      // Remove 'user' property if present
      const { user, ...dbData } = data as any;
      const formattedData = this.formatDatabaseFields(dbData);
      const [created] = await getDatabase()(this.tableName)
        .insert({
          ...formattedData,
          created_at: getDatabase().fn.now(),
          updated_at: getDatabase().fn.now()
        })
        .returning('*');

      const entity = new this.modelClass(created);
      
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

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<ServiceResponse<T | null>> {
    try {
      const result = await getDatabase()(this.tableName)
        .select('*')
        .where('id', id)
        .first();

      const entity = result ? new this.modelClass(result) : null;

      return {
        success: true,
        data: entity,
        metadata: { tableName: this.tableName, operation: 'findById' }
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
   * Find entity by field
   */
  async findBy(field: keyof T, value: any): Promise<ServiceResponse<T | null>> {
    try {
      const dbField = String(field).replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      const result = await getDatabase()(this.tableName)
        .select('*')
        .where(dbField, value)
        .first();

      const entity = result ? new this.modelClass(result) : null;

      return {
        success: true,
        data: entity,
        metadata: { tableName: this.tableName, operation: 'findBy', field, value }
      };
    } catch (error) {
      logger.error(`Failed to find entity by ${String(field)} in ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to find entity: ${error}`
      };
    }
  }

  /**
   * Find multiple entities by criteria
   */
  async findMany(criteria: Partial<T> = {}): Promise<ServiceResponse<T[]>> {
    try {
      let query = getDatabase()(this.tableName).select('*');
      
      // Apply criteria
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          query = query.where(dbKey, value);
        }
      });

      const results = await query;
      const entities = results.map(result => new this.modelClass(result));

      return {
        success: true,
        data: entities,
        metadata: { tableName: this.tableName, operation: 'findMany', count: entities.length }
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
   * Find entities with pagination
   */
  async findPaginated(
    criteria: Partial<T> = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<ServiceResponse<PaginationResult<T>>> {
    try {
      const offset = (page - 1) * limit;
      let query = getDatabase()(this.tableName).select('*');
      
      // Apply criteria
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          query = query.where(dbKey, value);
        }
      });

      // Get results and total count
      const [results, [{ count }]] = await Promise.all([
        query.clone()
          .orderBy(sortBy.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`), sortOrder)
          .limit(limit)
          .offset(offset),
        query.clone().count('* as count')
      ]);

      const entities = results.map(result => new this.modelClass(result));
      const total = parseInt(count as string);

      const paginationResult: PaginationResult<T> = {
        data: entities,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      };

      return {
        success: true,
        data: paginationResult,
        metadata: { tableName: this.tableName, operation: 'findPaginated' }
      };
    } catch (error) {
      logger.error(`Failed to find paginated entities in ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to find paginated entities: ${error}`
      };
    }
  }

  /**
   * Update entity by ID
   */
  async updateById(id: string, data: UpdateData): Promise<ServiceResponse<T | null>> {
    try {
      const formattedData = this.formatDatabaseFields(data);
      const [updated] = await getDatabase()(this.tableName)
        .where('id', id)
        .update({
          ...formattedData,
          updated_at: getDatabase().fn.now()
        })
        .returning('*');

      if (!updated) {
        return {
          success: false,
          error: 'Entity not found'
        };
      }

      const entity = new this.modelClass(updated);
      
      logger.info(`Entity updated in ${this.tableName}`, { id });

      return {
        success: true,
        data: entity,
        metadata: { tableName: this.tableName, operation: 'updateById' }
      };
    } catch (error) {
      logger.error(`Failed to update entity in ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to update entity: ${error}`
      };
    }
  }

  /**
   * Update multiple entities
   */
  async updateMany(criteria: Partial<T>, data: UpdateData): Promise<ServiceResponse<{ affected: number }>> {
    try {
      const formattedData = this.formatDatabaseFields(data);
      let query = getDatabase()(this.tableName);
      
      // Apply criteria
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          query = query.where(dbKey, value);
        }
      });

      const affected = await query.update({
        ...formattedData,
        updated_at: getDatabase().fn.now()
      });

      logger.info(`Multiple entities updated in ${this.tableName}`, { affected });

      return {
        success: true,
        data: { affected },
        metadata: { tableName: this.tableName, operation: 'updateMany' }
      };
    } catch (error) {
      logger.error(`Failed to update multiple entities in ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to update entities: ${error}`
      };
    }
  }

  /**
   * Delete entity by ID
   */
  async deleteById(id: string, soft: boolean = true): Promise<ServiceResponse<boolean>> {
    try {
      let affected: number;

      if (soft) {
        affected = await getDatabase()(this.tableName)
          .where('id', id)
          .update({
            deleted_at: getDatabase().fn.now(),
            updated_at: getDatabase().fn.now()
          });
      } else {
        affected = await getDatabase()(this.tableName)
          .where('id', id)
          .del();
      }

      const success = affected > 0;
      
      if (success) {
        logger.info(`Entity ${soft ? 'soft ' : ''}deleted from ${this.tableName}`, { id });
      }

      return {
        success,
        data: success,
        metadata: { tableName: this.tableName, operation: 'deleteById', soft }
      };
    } catch (error) {
      logger.error(`Failed to delete entity in ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to delete entity: ${error}`
      };
    }
  }

  /**
   * Delete multiple entities
   */
  async deleteMany(criteria: Partial<T>, soft: boolean = true): Promise<ServiceResponse<{ affected: number }>> {
    try {
      let query = getDatabase()(this.tableName);
      
      // Apply criteria
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          query = query.where(dbKey, value);
        }
      });

      let affected: number;

      if (soft) {
        affected = await query.update({
          deleted_at: getDatabase().fn.now(),
          updated_at: getDatabase().fn.now()
        });
      } else {
        affected = await query.del();
      }

      logger.info(`Multiple entities ${soft ? 'soft ' : ''}deleted from ${this.tableName}`, { affected });

      return {
        success: true,
        data: { affected },
        metadata: { tableName: this.tableName, operation: 'deleteMany', soft }
      };
    } catch (error) {
      logger.error(`Failed to delete multiple entities in ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to delete entities: ${error}`
      };
    }
  }

  /**
   * Check if entity exists
   */
  async exists(criteria: Partial<T>): Promise<ServiceResponse<boolean>> {
    try {
      let query = getDatabase()(this.tableName).select('id');
      
      // Apply criteria
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          query = query.where(dbKey, value);
        }
      });

      const result = await query.first();
      const exists = !!result;

      return {
        success: true,
        data: exists,
        metadata: { tableName: this.tableName, operation: 'exists' }
      };
    } catch (error) {
      logger.error(`Failed to check entity existence in ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to check entity existence: ${error}`
      };
    }
  }

  /**
   * Count entities matching criteria
   */
  async count(criteria: Partial<T> = {}): Promise<ServiceResponse<number>> {
    try {
      let query = getDatabase()(this.tableName);
      
      // Apply criteria
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          query = query.where(dbKey, value);
        }
      });

      const [{ count }] = await query.count('* as count');
      const total = parseInt(count as string);

      return {
        success: true,
        data: total,
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
  async raw(query: string, params: any[] = []): Promise<ServiceResponse<any>> {
    try {
      const result = await getDatabase().raw(query, params);
      
      logger.info(`Raw query executed on ${this.tableName}`, { query });

      return {
        success: true,
        data: result,
        metadata: { tableName: this.tableName, operation: 'raw' }
      };
    } catch (error) {
      logger.error(`Failed to execute raw query on ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to execute raw query: ${error}`
      };
    }
  }

  /**
   * Begin database transaction
   */
  async beginTransaction(): Promise<any> {
    return await getDatabase().transaction();
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
}
