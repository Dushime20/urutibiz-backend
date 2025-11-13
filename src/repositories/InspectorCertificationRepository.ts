import { OptimizedBaseRepository } from '@/repositories/BaseRepository.optimized';
import { ServiceResponse } from '@/types';
import { InspectorCertification, CreateInspectorCertificationRequest, UpdateInspectorCertificationRequest } from '@/types/thirdPartyInspection.types';
import { getDatabase } from '@/config/database';

export class InspectorCertificationRepository extends OptimizedBaseRepository<
  InspectorCertification,
  CreateInspectorCertificationRequest,
  UpdateInspectorCertificationRequest
> {
  protected readonly tableName = 'inspector_certifications';
  protected readonly modelClass = class {
    static fromDb(row: any): any {
      if (!row) return row;
      const mapped: any = { ...row };
      const map: Record<string, string> = {
        inspector_id: 'inspectorId',
        certification_type: 'certificationType',
        certification_level: 'certificationLevel',
        certifying_body: 'certifyingBody',
        certificate_number: 'certificateNumber',
        issued_date: 'issuedDate',
        expiry_date: 'expiryDate',
        total_inspections: 'totalInspections',
        average_rating: 'averageRating',
        is_active: 'isActive',
        created_at: 'createdAt',
        updated_at: 'updatedAt',
      };
      Object.entries(map).forEach(([snake, camel]) => {
        if (snake in mapped) {
          mapped[camel] = mapped[snake];
          delete mapped[snake];
        }
      });
      
      // Parse JSONB specializations field
      if (mapped.specializations && typeof mapped.specializations === 'string') {
        try {
          mapped.specializations = JSON.parse(mapped.specializations);
        } catch (e) {
          console.warn('[InspectorCertificationRepository] Failed to parse specializations:', e);
        }
      }
      
      return mapped;
    }
    constructor(public data: any) {}
  } as any;

  /**
   * Get certifications by inspector ID
   */
  async getByInspectorId(inspectorId: string, activeOnly: boolean = true): Promise<ServiceResponse<InspectorCertification[]>> {
    try {
      const db = getDatabase();
      let query = db(this.tableName).where('inspector_id', inspectorId);
      
      if (activeOnly) {
        query = query.where('is_active', true);
      }
      
      const results = await query.orderBy('certification_level', 'desc');
      const mapped = results.map(row => this.modelClass.fromDb(row));
      
      return {
        success: true,
        data: mapped
      };
    } catch (error) {
      console.error('[InspectorCertificationRepository] Error getting by inspector:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get inspectors by certification type and level
   */
  async getByCertificationType(
    certificationType: string,
    certificationLevel?: string,
    activeOnly: boolean = true
  ): Promise<ServiceResponse<InspectorCertification[]>> {
    try {
      const db = getDatabase();
      let query = db(this.tableName).where('certification_type', certificationType);
      
      if (certificationLevel) {
        query = query.where('certification_level', certificationLevel);
      }
      
      if (activeOnly) {
        query = query.where('is_active', true);
      }
      
      const results = await query
        .orderBy('average_rating', 'desc')
        .orderBy('total_inspections', 'desc');
      
      const mapped = results.map(row => this.modelClass.fromDb(row));
      
      return {
        success: true,
        data: mapped
      };
    } catch (error) {
      console.error('[InspectorCertificationRepository] Error getting by certification type:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Update inspector statistics after inspection completion
   */
  async updateInspectorStats(inspectorId: string, rating?: number): Promise<ServiceResponse<boolean>> {
    try {
      const db = getDatabase();
      
      // Get current stats
      const certs = await db(this.tableName)
        .where('inspector_id', inspectorId)
        .where('is_active', true);
      
      for (const cert of certs) {
        const newTotal = (cert.total_inspections || 0) + 1;
        let newAverage = cert.average_rating || 0;
        
        if (rating !== undefined) {
          // Calculate new average rating
          const currentTotal = cert.total_inspections || 0;
          const currentAverage = cert.average_rating || 0;
          newAverage = ((currentAverage * currentTotal) + rating) / newTotal;
        }
        
        await db(this.tableName)
          .where('id', cert.id)
          .update({
            total_inspections: newTotal,
            average_rating: newAverage,
            updated_at: new Date()
          });
      }
      
      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error('[InspectorCertificationRepository] Error updating stats:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
}


