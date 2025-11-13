import { OptimizedBaseRepository } from '@/repositories/BaseRepository.optimized';
import { ServiceResponse } from '@/types';
import { PublicInspectionReport, CreatePublicReportRequest } from '@/types/thirdPartyInspection.types';
import { getDatabase } from '@/config/database';

export class PublicInspectionReportRepository extends OptimizedBaseRepository<
  PublicInspectionReport,
  CreatePublicReportRequest,
  Partial<CreatePublicReportRequest>
> {
  protected readonly tableName = 'public_inspection_reports';
  protected readonly modelClass = class {
    static fromDb(row: any): any {
      if (!row) return row;
      const mapped: any = { ...row };
      const map: Record<string, string> = {
        inspection_id: 'inspectionId',
        product_id: 'productId',
        overall_score: 'overallScore',
        overall_rating: 'overallRating',
        category_scores: 'categoryScores',
        is_passed: 'isPassed',
        inspection_date: 'inspectionDate',
        expiry_date: 'expiryDate',
        is_public: 'isPublic',
        view_count: 'viewCount',
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
      const jsonbFields = ['categoryScores', 'highlights', 'concerns'];
      jsonbFields.forEach(field => {
        if (mapped[field] && typeof mapped[field] === 'string') {
          try {
            mapped[field] = JSON.parse(mapped[field]);
          } catch (e) {
            console.warn(`[PublicInspectionReportRepository] Failed to parse ${field}:`, e);
          }
        }
      });
      
      return mapped;
    }
    constructor(public data: any) {}
  } as any;

  /**
   * Get report by inspection ID
   */
  async getByInspectionId(inspectionId: string): Promise<ServiceResponse<PublicInspectionReport | null>> {
    try {
      const db = getDatabase();
      const result = await db(this.tableName)
        .where('inspection_id', inspectionId)
        .first();
      
      if (!result) {
        return {
          success: true,
          data: null
        };
      }
      
      return {
        success: true,
        data: this.modelClass.fromDb(result)
      };
    } catch (error) {
      console.error('[PublicInspectionReportRepository] Error getting by inspection:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get public reports by product ID
   */
  async getByProductId(productId: string, publicOnly: boolean = true): Promise<ServiceResponse<PublicInspectionReport[]>> {
    try {
      const db = getDatabase();
      let query = db(this.tableName).where('product_id', productId);
      
      if (publicOnly) {
        query = query.where('is_public', true);
      }
      
      const results = await query
        .orderBy('inspection_date', 'desc')
        .orderBy('overall_score', 'desc');
      
      const mapped = results.map(row => this.modelClass.fromDb(row));
      
      return {
        success: true,
        data: mapped
      };
    } catch (error) {
      console.error('[PublicInspectionReportRepository] Error getting by product:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get latest public report for a product
   */
  async getLatestByProductId(productId: string): Promise<ServiceResponse<PublicInspectionReport | null>> {
    try {
      const db = getDatabase();
      const result = await db(this.tableName)
        .where('product_id', productId)
        .where('is_public', true)
        .orderBy('inspection_date', 'desc')
        .first();
      
      if (!result) {
        return {
          success: true,
          data: null
        };
      }
      
      return {
        success: true,
        data: this.modelClass.fromDb(result)
      };
    } catch (error) {
      console.error('[PublicInspectionReportRepository] Error getting latest:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Increment view count
   */
  async incrementViewCount(reportId: string): Promise<ServiceResponse<boolean>> {
    try {
      const db = getDatabase();
      await db(this.tableName)
        .where('id', reportId)
        .increment('view_count', 1);
      
      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error('[PublicInspectionReportRepository] Error incrementing view count:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get top rated products
   */
  async getTopRated(limit: number = 10): Promise<ServiceResponse<PublicInspectionReport[]>> {
    try {
      const db = getDatabase();
      const results = await db(this.tableName)
        .where('is_public', true)
        .orderBy('overall_score', 'desc')
        .limit(limit);
      
      const mapped = results.map(row => this.modelClass.fromDb(row));
      
      return {
        success: true,
        data: mapped
      };
    } catch (error) {
      console.error('[PublicInspectionReportRepository] Error getting top rated:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
}


