import { OptimizedBaseRepository } from '@/repositories/BaseRepository.optimized';
import { ServiceResponse } from '@/types';
import { InspectionCriteriaTemplate, CreateCriteriaTemplateRequest, UpdateCriteriaTemplateRequest } from '@/types/thirdPartyInspection.types';
import { getDatabase } from '@/config/database';

export class InspectionCriteriaTemplateRepository extends OptimizedBaseRepository<
  InspectionCriteriaTemplate,
  CreateCriteriaTemplateRequest,
  UpdateCriteriaTemplateRequest
> {
  protected readonly tableName = 'inspection_criteria_templates';
  protected readonly modelClass = class {
    static fromDb(row: any): any {
      if (!row) return row;
      const mapped: any = { ...row };
      const map: Record<string, string> = {
        category_id: 'categoryId',
        category_name: 'categoryName',
        template_name: 'templateName',
        total_points: 'totalPoints',
        inspection_tier: 'inspectionTier',
        country_id: 'countryId',
        locale: 'locale',
        is_active: 'isActive',
        is_global: 'isGlobal',
        created_at: 'createdAt',
        updated_at: 'updatedAt',
      };
      Object.entries(map).forEach(([snake, camel]) => {
        if (snake in mapped) {
          mapped[camel] = mapped[snake];
          delete mapped[snake];
        }
      });
      
      // Parse JSONB fields
      const jsonbFields = ['criteria', 'translations', 'regulatory_compliance'];
      jsonbFields.forEach(field => {
        const dbField = field === 'regulatory_compliance' ? 'regulatory_compliance' : field;
        if (mapped[dbField] && typeof mapped[dbField] === 'string') {
          try {
            mapped[field === 'regulatory_compliance' ? 'regulatoryCompliance' : field] = JSON.parse(mapped[dbField]);
            if (dbField !== field) delete mapped[dbField];
          } catch (e) {
            console.warn(`[InspectionCriteriaTemplateRepository] Failed to parse ${field}:`, e);
          }
        } else if (mapped[dbField]) {
          // Already parsed, just map the field name
          if (field === 'regulatory_compliance' && dbField === 'regulatory_compliance') {
            mapped.regulatoryCompliance = mapped[dbField];
            delete mapped[dbField];
          }
        }
      });
      
      // Map region field
      if (mapped.region) {
        // Already mapped if snake_case, keep as is
      }
      
      return mapped;
    }
    constructor(public data: any) {}
  } as any;

  /**
   * Get template by category ID
   */
  async getByCategoryId(categoryId: string, activeOnly: boolean = true): Promise<ServiceResponse<InspectionCriteriaTemplate[]>> {
    try {
      const db = getDatabase();
      let query = db(this.tableName).where('category_id', categoryId);
      
      if (activeOnly) {
        query = query.where('is_active', true);
      }
      
      const results = await query.orderBy('created_at', 'desc');
      const mapped = results.map(row => this.modelClass.fromDb(row));
      
      return {
        success: true,
        data: mapped
      };
    } catch (error) {
      console.error('[InspectionCriteriaTemplateRepository] Error getting by category:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get active templates
   */
  async getActiveTemplates(): Promise<ServiceResponse<InspectionCriteriaTemplate[]>> {
    try {
      const db = getDatabase();
      const results = await db(this.tableName)
        .where('is_active', true)
        .orderBy('category_name', 'asc')
        .orderBy('template_name', 'asc');
      
      const mapped = results.map(row => this.modelClass.fromDb(row));
      
      return {
        success: true,
        data: mapped
      };
    } catch (error) {
      console.error('[InspectionCriteriaTemplateRepository] Error getting active templates:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get template by category ID and country
   */
  async getByCategoryIdAndCountry(
    categoryId: string,
    countryId: string,
    activeOnly: boolean = true
  ): Promise<ServiceResponse<InspectionCriteriaTemplate | null>> {
    try {
      const db = getDatabase();
      let query = db(this.tableName)
        .where('category_id', categoryId)
        .where('country_id', countryId);
      
      if (activeOnly) {
        query = query.where('is_active', true);
      }
      
      const result = await query.orderBy('created_at', 'desc').first();
      
      if (!result) {
        return { success: true, data: null };
      }
      
      return {
        success: true,
        data: this.modelClass.fromDb(result)
      };
    } catch (error) {
      console.error('[InspectionCriteriaTemplateRepository] Error getting by category and country:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get template by category ID and region
   */
  async getByCategoryIdAndRegion(
    categoryId: string,
    region: string,
    activeOnly: boolean = true
  ): Promise<ServiceResponse<InspectionCriteriaTemplate | null>> {
    try {
      const db = getDatabase();
      let query = db(this.tableName)
        .where('category_id', categoryId)
        .where('region', region);
      
      if (activeOnly) {
        query = query.where('is_active', true);
      }
      
      const result = await query.orderBy('created_at', 'desc').first();
      
      if (!result) {
        return { success: true, data: null };
      }
      
      return {
        success: true,
        data: this.modelClass.fromDb(result)
      };
    } catch (error) {
      console.error('[InspectionCriteriaTemplateRepository] Error getting by category and region:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
}

