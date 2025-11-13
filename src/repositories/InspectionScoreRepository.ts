import { OptimizedBaseRepository } from '@/repositories/BaseRepository.optimized';
import { ServiceResponse } from '@/types';
import { InspectionScore, CreateInspectionScoreRequest } from '@/types/thirdPartyInspection.types';
import { getDatabase } from '@/config/database';

export class InspectionScoreRepository extends OptimizedBaseRepository<
  InspectionScore,
  CreateInspectionScoreRequest,
  Partial<CreateInspectionScoreRequest>
> {
  protected readonly tableName = 'inspection_scores';
  protected readonly modelClass = class {
    static fromDb(row: any): any {
      if (!row) return row;
      const mapped: any = { ...row };
      const map: Record<string, string> = {
        inspection_id: 'inspectionId',
        criterion_id: 'criterionId',
        criterion_name: 'criterionName',
        max_score: 'maxScore',
        created_at: 'createdAt',
        updated_at: 'updatedAt',
      };
      Object.entries(map).forEach(([snake, camel]) => {
        if (snake in mapped) {
          mapped[camel] = mapped[snake];
          delete mapped[snake];
        }
      });
      
      // Parse JSONB evidence field
      if (mapped.evidence && typeof mapped.evidence === 'string') {
        try {
          mapped.evidence = JSON.parse(mapped.evidence);
        } catch (e) {
          console.warn('[InspectionScoreRepository] Failed to parse evidence:', e);
        }
      }
      
      return mapped;
    }
    constructor(public data: any) {}
  } as any;

  /**
   * Get all scores for an inspection
   */
  async getByInspectionId(inspectionId: string): Promise<ServiceResponse<InspectionScore[]>> {
    try {
      const db = getDatabase();
      const results = await db(this.tableName)
        .where('inspection_id', inspectionId)
        .orderBy('criterion_name', 'asc');
      
      const mapped = results.map(row => this.modelClass.fromDb(row));
      
      return {
        success: true,
        data: mapped
      };
    } catch (error) {
      console.error('[InspectionScoreRepository] Error getting by inspection:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Create multiple scores at once
   */
  async createMultiple(scores: CreateInspectionScoreRequest[], inspectionId: string): Promise<ServiceResponse<InspectionScore[]>> {
    try {
      const db = getDatabase();
      const scoresToInsert = scores.map(score => ({
        inspection_id: inspectionId,
        criterion_id: score.criterionId,
        criterion_name: score.criterionName,
        score: score.score,
        max_score: score.maxScore,
        notes: score.notes || null,
        evidence: score.evidence ? JSON.stringify(score.evidence) : null,
        created_at: new Date(),
        updated_at: new Date()
      }));

      const inserted = await db(this.tableName)
        .insert(scoresToInsert)
        .returning('*');
      
      const mapped = inserted.map(row => this.modelClass.fromDb(row));
      
      return {
        success: true,
        data: mapped
      };
    } catch (error) {
      console.error('[InspectionScoreRepository] Error creating multiple scores:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Delete all scores for an inspection
   */
  async deleteByInspectionId(inspectionId: string): Promise<ServiceResponse<boolean>> {
    try {
      const db = getDatabase();
      await db(this.tableName)
        .where('inspection_id', inspectionId)
        .delete();
      
      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error('[InspectionScoreRepository] Error deleting scores:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
}


