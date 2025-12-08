import { BaseRepository } from './BaseRepository';
import ProductImage from '@/models/ProductImage.model';
import { ProductImageData, CreateProductImageData } from '@/types/productImage.types';
import { getDatabase } from '@/config/database';
import logger from '@/utils/logger';

class ProductImageRepository extends BaseRepository<ProductImageData, CreateProductImageData, Partial<ProductImageData>> {
  protected readonly tableName = 'product_images';
  protected readonly modelClass = ProductImage;

  /**
   * Override create to handle vector type for image_embedding
   */
  async create(data: CreateProductImageData): Promise<any> {
    try {
      // Remove 'user' property if present
      const { user, image_embedding, ...dbData } = data as any;
      const formattedData = this.formatDatabaseFields(dbData);
      
      // Handle image_embedding separately if it exists (vector type)
      const hasEmbedding = image_embedding && Array.isArray(image_embedding) && image_embedding.length > 0;
      
      // If embedding exists, use two-step approach: insert then update vector
      if (hasEmbedding) {
        // Format as PostgreSQL vector: [0.1,0.2,0.3,...] (no quotes around numbers)
        const vectorString = '[' + image_embedding.map(v => String(v)).join(',') + ']';
        
        const db = getDatabase();
        
        // Step 1: Insert without embedding using normal Knex insert
        const insertData: any = {
          ...formattedData,
          created_at: db.fn.now(),
          updated_at: db.fn.now(),
          image_embedding: null // Insert as null first
        };
        
        const [inserted] = await db(this.tableName)
          .insert(insertData)
          .returning('*');
        
        if (!inserted) {
          throw new Error('Failed to insert product image');
        }
        
        // Step 2: Update the embedding using raw SQL (same pattern as embeddingPrecomputation.service.ts)
        await db.raw(
          `UPDATE ${this.tableName} SET image_embedding = $1::vector, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [vectorString, inserted.id]
        );
        
        // Step 3: Fetch the complete record
        const [created] = await db(this.tableName)
          .where('id', inserted.id)
          .select('*');
        
        const entity = new this.modelClass(created);
        
        logger.info(`Entity created in ${this.tableName}`, { id: entity.id });

        return {
          success: true,
          data: entity,
          metadata: { tableName: this.tableName, operation: 'create' }
        };
      } else {
        // No embedding, use normal insert
        const insertData: any = {
          ...formattedData,
          created_at: getDatabase().fn.now(),
          updated_at: getDatabase().fn.now()
        };
        
        const [created] = await getDatabase()(this.tableName)
          .insert(insertData)
          .returning('*');

        const entity = new this.modelClass(created);
        
        logger.info(`Entity created in ${this.tableName}`, { id: entity.id });

        return {
          success: true,
          data: entity,
          metadata: { tableName: this.tableName, operation: 'create' }
        };
      }
    } catch (error) {
      logger.error(`Failed to create entity in ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to create entity: ${error}`
      };
    }
  }

  /**
   * Override updateById to handle vector type for image_embedding
   */
  async updateById(id: string, data: Partial<ProductImageData>): Promise<any> {
    try {
      const { image_embedding, ...dbData } = data as any;
      const formattedData = this.formatDatabaseFields(dbData);
      
      // Handle image_embedding separately if it exists (vector type)
      const hasEmbedding = image_embedding && Array.isArray(image_embedding) && image_embedding.length > 0;
      
      // If embedding exists, use raw SQL query to properly cast to vector type
      if (hasEmbedding) {
        // Format as PostgreSQL vector: [0.1,0.2,0.3,...] (no quotes around numbers)
        const vectorString = '[' + image_embedding.map(v => String(v)).join(',') + ']';
        
        // Build SET clause
        const setClauses: string[] = [];
        const sqlValues: any[] = [];
        
        // Add regular fields (only non-null/undefined values)
        Object.entries(formattedData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            setClauses.push(`${key} = $${sqlValues.length + 1}`);
            sqlValues.push(value);
          }
        });
        
        // Add timestamp
        setClauses.push('updated_at = CURRENT_TIMESTAMP');
        
        // Add embedding with vector cast
        sqlValues.push(vectorString);
        setClauses.push(`image_embedding = $${sqlValues.length}::vector`);
        
        // Add ID for WHERE clause
        sqlValues.push(id);
        
        const query = `
          UPDATE ${this.tableName} 
          SET ${setClauses.join(', ')} 
          WHERE id = $${sqlValues.length}
          RETURNING *
        `;
        
        logger.info(`Executing update query with ${sqlValues.length} bindings:`, { 
          query: query.substring(0, 200), 
          bindingsCount: sqlValues.length 
        });
        
        const result = await getDatabase().raw(query, sqlValues);
        const [updated] = result.rows;
        
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
      } else {
        // No embedding, use normal update
        const updateData: any = {
          ...formattedData,
          updated_at: getDatabase().fn.now()
        };
        
        const [updated] = await getDatabase()(this.tableName)
          .where('id', id)
          .update(updateData)
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
      }
    } catch (error) {
      logger.error(`Failed to update entity in ${this.tableName}:`, error);
      return {
        success: false,
        error: `Failed to update entity: ${error}`
      };
    }
  }
}

export default new ProductImageRepository();
