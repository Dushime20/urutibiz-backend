/**
 * Translations Service
 * 
 * Handles CRUD operations for dynamic content translations
 */
import { getDatabase } from '../../config/database';
import logger from '../../utils/logger';

// Get database instance
const db = getDatabase();
import {
  TranslationData,
  CreateTranslationData,
  UpdateTranslationData,
  TranslationFilters,
  ServiceResponse,
  PaginatedResponse
} from '../../types/localization.types';

export class TranslationsService {
  
  // =====================================================
  // CREATE
  // =====================================================
  
  /**
   * Create a new translation
   */
  static async createTranslation(data: CreateTranslationData): Promise<ServiceResponse<TranslationData>> {
    try {
      // Validate required fields
      if (!data.entity_type || !data.entity_id || !data.field_name || !data.language_code || !data.content) {
        return {
          success: false,
          error: 'Missing required fields: entity_type, entity_id, field_name, language_code, content'
        };
      }

      // Check for existing translation
      const existing = await db('translations')
        .where({
          entity_type: data.entity_type,
          entity_id: data.entity_id,
          field_name: data.field_name,
          language_code: data.language_code
        })
        .first();

      if (existing) {
        return {
          success: false,
          error: 'Translation already exists for this entity, field, and language'
        };
      }

      const [translation] = await db('translations')
        .insert({
          ...data,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      logger.info('Translation created successfully', { id: translation.id });

      return {
        success: true,
        data: translation,
        message: 'Translation created successfully'
      };
    } catch (error: any) {
      logger.error('Error creating translation:', error);
      return {
        success: false,
        error: 'Failed to create translation'
      };
    }
  }

  // =====================================================
  // READ
  // =====================================================
  
  /**
   * Get translation by ID
   */
  static async getTranslationById(id: string): Promise<ServiceResponse<TranslationData>> {
    try {
      const translation = await db('translations')
        .where({ id })
        .first();

      if (!translation) {
        return {
          success: false,
          error: 'Translation not found'
        };
      }

      return {
        success: true,
        data: translation
      };
    } catch (error: any) {
      logger.error('Error getting translation:', error);
      return {
        success: false,
        error: 'Failed to get translation'
      };
    }
  }

  /**
   * Get translations with filtering and pagination
   */
  static async getTranslations(filters: TranslationFilters = {}): Promise<ServiceResponse<PaginatedResponse<TranslationData>>> {
    try {
      const {
        entity_type,
        entity_id,
        field_name,
        language_code,
        search,
        page = 1,
        limit = 10
      } = filters;

      let query = db('translations').select('*');

      // Apply filters
      if (entity_type) {
        query = query.where('entity_type', entity_type);
      }
      if (entity_id) {
        query = query.where('entity_id', entity_id);
      }
      if (field_name) {
        query = query.where('field_name', field_name);
      }
      if (language_code) {
        query = query.where('language_code', language_code);
      }
      if (search) {
        query = query.where('content', 'ilike', `%${search}%`);
      }

      // Get total count for pagination
      const countQuery = query.clone().count('* as count').first();
      const totalCount = await countQuery.then((result: any) => parseInt(result?.count as string) || 0);

      // Apply pagination
      const offset = (page - 1) * limit;
      const translations = await query
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: {
          rows: translations,
          totalCount,
          page,
          limit,
          totalPages
        }
      };
    } catch (error: any) {
      logger.error('Error getting translations:', error);
      return {
        success: false,
        error: 'Failed to get translations'
      };
    }
  }

  /**
   * Get translations for a specific entity
   */
  static async getEntityTranslations(
    entityType: string, 
    entityId: string, 
    languageCode?: string
  ): Promise<ServiceResponse<TranslationData[]>> {
    try {
      let query = db('translations')
        .where({
          entity_type: entityType,
          entity_id: entityId
        });

      if (languageCode) {
        query = query.where('language_code', languageCode);
      }

      const translations = await query.orderBy('field_name', 'asc');

      return {
        success: true,
        data: translations
      };
    } catch (error: any) {
      logger.error('Error getting entity translations:', error);
      return {
        success: false,
        error: 'Failed to get entity translations'
      };
    }
  }

  // =====================================================
  // UPDATE
  // =====================================================
  
  /**
   * Update translation
   */
  static async updateTranslation(id: string, data: UpdateTranslationData): Promise<ServiceResponse<TranslationData>> {
    try {
      // Check if translation exists
      const existing = await db('translations').where({ id }).first();
      if (!existing) {
        return {
          success: false,
          error: 'Translation not found'
        };
      }

      const [translation] = await db('translations')
        .where({ id })
        .update({
          ...data,
          updated_at: new Date()
        })
        .returning('*');

      logger.info('Translation updated successfully', { id });

      return {
        success: true,
        data: translation,
        message: 'Translation updated successfully'
      };
    } catch (error: any) {
      logger.error('Error updating translation:', error);
      return {
        success: false,
        error: 'Failed to update translation'
      };
    }
  }

  // =====================================================
  // DELETE
  // =====================================================
  
  /**
   * Delete translation
   */
  static async deleteTranslation(id: string): Promise<ServiceResponse<void>> {
    try {
      const deleted = await db('translations')
        .where({ id })
        .del();

      if (deleted === 0) {
        return {
          success: false,
          error: 'Translation not found'
        };
      }

      logger.info('Translation deleted successfully', { id });

      return {
        success: true,
        message: 'Translation deleted successfully'
      };
    } catch (error: any) {
      logger.error('Error deleting translation:', error);
      return {
        success: false,
        error: 'Failed to delete translation'
      };
    }
  }

  // =====================================================
  // BULK OPERATIONS
  // =====================================================
  
  /**
   * Bulk create or update translations for an entity
   */
  static async bulkUpsertEntityTranslations(
    entityType: string,
    entityId: string,
    translations: Array<{
      field_name: string;
      language_code: string;
      content: string;
    }>
  ): Promise<ServiceResponse<TranslationData[]>> {
    try {
      const results: TranslationData[] = [];

      for (const translation of translations) {
        // Check if translation exists
        const existing = await db('translations')
          .where({
            entity_type: entityType,
            entity_id: entityId,
            field_name: translation.field_name,
            language_code: translation.language_code
          })
          .first();

        if (existing) {
          // Update existing
          const [updated] = await db('translations')
            .where({ id: existing.id })
            .update({
              content: translation.content,
              updated_at: new Date()
            })
            .returning('*');
          results.push(updated);
        } else {
          // Create new
          const [created] = await db('translations')
            .insert({
              entity_type: entityType,
              entity_id: entityId,
              field_name: translation.field_name,
              language_code: translation.language_code,
              content: translation.content,
              created_at: new Date(),
              updated_at: new Date()
            })
            .returning('*');
          results.push(created);
        }
      }

      logger.info('Bulk translations upserted successfully', { 
        entityType, 
        entityId, 
        count: results.length 
      });

      return {
        success: true,
        data: results,
        message: `${results.length} translations processed successfully`
      };
    } catch (error: any) {
      logger.error('Error bulk upserting translations:', error);
      return {
        success: false,
        error: 'Failed to process bulk translations'
      };
    }
  }

  /**
   * Delete all translations for an entity
   */
  static async deleteEntityTranslations(entityType: string, entityId: string): Promise<ServiceResponse<void>> {
    try {
      const deleted = await db('translations')
        .where({
          entity_type: entityType,
          entity_id: entityId
        })
        .del();

      logger.info('Entity translations deleted', { entityType, entityId, count: deleted });

      return {
        success: true,
        message: `${deleted} translations deleted`
      };
    } catch (error: any) {
      logger.error('Error deleting entity translations:', error);
      return {
        success: false,
        error: 'Failed to delete entity translations'
      };
    }
  }
}

export default TranslationsService;
