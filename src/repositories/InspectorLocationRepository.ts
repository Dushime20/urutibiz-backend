import { OptimizedBaseRepository } from '@/repositories/BaseRepository.optimized';
import { InspectorLocation, CreateInspectorLocationRequest } from '@/types/thirdPartyInspection.types';

export class InspectorLocationRepository extends OptimizedBaseRepository<InspectorLocation> {
  protected tableName = 'inspector_locations';
  protected primaryKey = 'id';

  /**
   * Get all active locations for an inspector
   */
  async getByInspectorId(inspectorId: string, activeOnly: boolean = true): Promise<{ success: boolean; data?: InspectorLocation[]; error?: string }> {
    try {
      const query = this.db(this.tableName)
        .where('inspector_id', inspectorId);

      if (activeOnly) {
        query.where('is_active', true);
      }

      const rows = await query.orderBy('is_primary', 'desc').orderBy('created_at', 'desc');

      return {
        success: true,
        data: rows.map(this.fromDb)
      };
    } catch (error) {
      console.error(`[InspectorLocationRepository] Get by inspector ID error:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Find inspectors within a radius of a location (Haversine formula)
   * Note: For production, consider using PostGIS for better performance
   */
  async findNearbyInspectors(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
    countryId?: string,
    limit: number = 10
  ): Promise<{ success: boolean; data?: InspectorLocation[]; error?: string }> {
    try {
      // Haversine formula for distance calculation
      // Distance in kilometers = 6371 * acos(cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lon2) - radians(lon1)) + sin(radians(lat1)) * sin(radians(lat2)))
      const query = this.db(this.tableName)
        .select(
          '*',
          this.db.raw(`
            6371 * acos(
              cos(radians(?)) * 
              cos(radians(latitude)) * 
              cos(radians(longitude) - radians(?)) + 
              sin(radians(?)) * 
              sin(radians(latitude))
            ) AS distance
          `, [latitude, longitude, latitude])
        )
        .where('is_active', true)
        .whereNotNull('latitude')
        .whereNotNull('longitude')
        .havingRaw('distance <= ?', [radiusKm])
        .orderBy('distance', 'asc')
        .limit(limit);

      if (countryId) {
        query.where('country_id', countryId);
      }

      const rows = await query;

      return {
        success: true,
        data: rows.map(this.fromDb)
      };
    } catch (error) {
      console.error(`[InspectorLocationRepository] Find nearby inspectors error:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get primary location for an inspector
   */
  async getPrimaryLocation(inspectorId: string): Promise<{ success: boolean; data?: InspectorLocation | null; error?: string }> {
    try {
      const row = await this.db(this.tableName)
        .where('inspector_id', inspectorId)
        .where('is_primary', true)
        .where('is_active', true)
        .first();

      return {
        success: true,
        data: row ? this.fromDb(row) : null
      };
    } catch (error) {
      console.error(`[InspectorLocationRepository] Get primary location error:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Convert database row to InspectorLocation
   */
  protected fromDb(row: any): InspectorLocation {
    if (!row) return row;
    
    return {
      id: row.id,
      inspectorId: row.inspector_id,
      countryId: row.country_id,
      city: row.city,
      stateProvince: row.state_province,
      postalCode: row.postal_code,
      latitude: row.latitude ? parseFloat(row.latitude) : undefined,
      longitude: row.longitude ? parseFloat(row.longitude) : undefined,
      serviceRadiusKm: parseFloat(row.service_radius_km || '50'),
      isPrimary: row.is_primary || false,
      isActive: row.is_active !== false,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Convert InspectorLocation to database format
   */
  protected toDb(data: Partial<InspectorLocation>): any {
    const dbData: any = {};

    if (data.inspectorId !== undefined) dbData.inspector_id = data.inspectorId;
    if (data.countryId !== undefined) dbData.country_id = data.countryId;
    if (data.city !== undefined) dbData.city = data.city;
    if (data.stateProvince !== undefined) dbData.state_province = data.stateProvince;
    if (data.postalCode !== undefined) dbData.postal_code = data.postalCode;
    if (data.latitude !== undefined) dbData.latitude = data.latitude;
    if (data.longitude !== undefined) dbData.longitude = data.longitude;
    if (data.serviceRadiusKm !== undefined) dbData.service_radius_km = data.serviceRadiusKm;
    if (data.isPrimary !== undefined) dbData.is_primary = data.isPrimary;
    if (data.isActive !== undefined) dbData.is_active = data.isActive;

    return dbData;
  }
}


