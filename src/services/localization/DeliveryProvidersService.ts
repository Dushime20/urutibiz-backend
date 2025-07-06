/**
 * Delivery Providers Service
 * 
 * Handles CRUD operations for delivery providers by country
 */
import { getDatabase } from '../../config/database';
import logger from '../../utils/logger';
import {
  DeliveryProviderData,
  CreateDeliveryProviderData,
  UpdateDeliveryProviderData,
  DeliveryProviderFilters,
  ServiceResponse,
  PaginatedResponse
} from '../../types/localization.types';

// Get database instance
const db = getDatabase();

export class DeliveryProvidersService {
  
  // =====================================================
  // CREATE
  // =====================================================
  
  /**
   * Create a new delivery provider
   */
  static async createDeliveryProvider(data: CreateDeliveryProviderData): Promise<ServiceResponse<DeliveryProviderData>> {
    try {
      // Validate required fields
      if (!data.country_id || !data.provider_name || !data.base_fee || !data.currency) {
        return {
          success: false,
          error: 'Missing required fields: country_id, provider_name, base_fee, currency'
        };
      }

      // Check for duplicate provider name in the same country
      const existing = await db('delivery_providers')
        .where({
          country_id: data.country_id,
          provider_name: data.provider_name
        })
        .first();

      if (existing) {
        return {
          success: false,
          error: 'Delivery provider with this name already exists in this country'
        };
      }

      const [provider] = await db('delivery_providers')
        .insert({
          ...data,
          created_at: new Date()
        })
        .returning('*');

      logger.info('Delivery provider created successfully', { id: provider.id });

      return {
        success: true,
        data: provider,
        message: 'Delivery provider created successfully'
      };
    } catch (error: any) {
      logger.error('Error creating delivery provider:', error);
      return {
        success: false,
        error: 'Failed to create delivery provider'
      };
    }
  }

  // =====================================================
  // READ
  // =====================================================
  
  /**
   * Get delivery provider by ID
   */
  static async getDeliveryProviderById(id: string): Promise<ServiceResponse<DeliveryProviderData>> {
    try {
      const provider = await db('delivery_providers')
        .where({ id })
        .first();

      if (!provider) {
        return {
          success: false,
          error: 'Delivery provider not found'
        };
      }

      return {
        success: true,
        data: provider
      };
    } catch (error: any) {
      logger.error('Error getting delivery provider:', error);
      return {
        success: false,
        error: 'Failed to get delivery provider'
      };
    }
  }

  /**
   * Get delivery providers with filtering and pagination
   */
  static async getDeliveryProviders(filters: DeliveryProviderFilters = {}): Promise<ServiceResponse<PaginatedResponse<DeliveryProviderData>>> {
    try {
      const {
        country_id,
        is_active,
        same_day_delivery,
        next_day_delivery,
        search,
        page = 1,
        limit = 10
      } = filters;

      let query = db('delivery_providers').select('*');

      // Apply filters
      if (country_id) {
        query = query.where('country_id', country_id);
      }
      if (typeof is_active === 'boolean') {
        query = query.where('is_active', is_active);
      }
      if (typeof same_day_delivery === 'boolean') {
        query = query.where('same_day_delivery', same_day_delivery);
      }
      if (typeof next_day_delivery === 'boolean') {
        query = query.where('next_day_delivery', next_day_delivery);
      }
      if (search) {
        query = query.where(function() {
          this.where('provider_name', 'ilike', `%${search}%`)
              .orWhere('display_name', 'ilike', `%${search}%`);
        });
      }

      // Get total count for pagination
      const countQuery = query.clone().count('* as count').first();
      const totalCount = await countQuery.then((result: any) => parseInt(result?.count as string) || 0);

      // Apply pagination
      const offset = (page - 1) * limit;
      const providers = await query
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: {
          rows: providers,
          totalCount,
          page,
          limit,
          totalPages
        }
      };
    } catch (error: any) {
      logger.error('Error getting delivery providers:', error);
      return {
        success: false,
        error: 'Failed to get delivery providers'
      };
    }
  }

  /**
   * Get active delivery providers for a specific country
   */
  static async getActiveProvidersByCountry(countryId: string): Promise<ServiceResponse<DeliveryProviderData[]>> {
    try {
      const providers = await db('delivery_providers')
        .where({
          country_id: countryId,
          is_active: true
        })
        .orderBy('provider_name', 'asc');

      return {
        success: true,
        data: providers
      };
    } catch (error: any) {
      logger.error('Error getting active providers by country:', error);
      return {
        success: false,
        error: 'Failed to get active providers'
      };
    }
  }

  /**
   * Get providers that service a specific area
   */
  static async getProvidersByServiceArea(administrativeDivisionId: string): Promise<ServiceResponse<DeliveryProviderData[]>> {
    try {
      const providers = await db('delivery_providers')
        .where('is_active', true)
        .whereRaw('? = ANY(service_areas)', [administrativeDivisionId])
        .orderBy('base_fee', 'asc');

      return {
        success: true,
        data: providers
      };
    } catch (error: any) {
      logger.error('Error getting providers by service area:', error);
      return {
        success: false,
        error: 'Failed to get providers by service area'
      };
    }
  }

  // =====================================================
  // UPDATE
  // =====================================================
  
  /**
   * Update delivery provider
   */
  static async updateDeliveryProvider(id: string, data: UpdateDeliveryProviderData): Promise<ServiceResponse<DeliveryProviderData>> {
    try {
      // Check if provider exists
      const existing = await db('delivery_providers').where({ id }).first();
      if (!existing) {
        return {
          success: false,
          error: 'Delivery provider not found'
        };
      }

      const [provider] = await db('delivery_providers')
        .where({ id })
        .update(data)
        .returning('*');

      logger.info('Delivery provider updated successfully', { id });

      return {
        success: true,
        data: provider,
        message: 'Delivery provider updated successfully'
      };
    } catch (error: any) {
      logger.error('Error updating delivery provider:', error);
      return {
        success: false,
        error: 'Failed to update delivery provider'
      };
    }
  }

  // =====================================================
  // DELETE
  // =====================================================
  
  /**
   * Delete delivery provider (soft delete by setting is_active to false)
   */
  static async deleteDeliveryProvider(id: string): Promise<ServiceResponse<void>> {
    try {
      const updated = await db('delivery_providers')
        .where({ id })
        .update({ is_active: false });

      if (updated === 0) {
        return {
          success: false,
          error: 'Delivery provider not found'
        };
      }

      logger.info('Delivery provider deleted successfully', { id });

      return {
        success: true,
        message: 'Delivery provider deleted successfully'
      };
    } catch (error: any) {
      logger.error('Error deleting delivery provider:', error);
      return {
        success: false,
        error: 'Failed to delete delivery provider'
      };
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================
  
  /**
   * Calculate delivery cost
   */
  static calculateDeliveryCost(provider: DeliveryProviderData, distance?: number): number {
    let cost = provider.base_fee;
    
    if (distance && provider.per_km_rate) {
      cost += distance * provider.per_km_rate;
    }
    
    return cost;
  }

  /**
   * Generate tracking URL for a shipment
   */
  static generateTrackingUrl(provider: DeliveryProviderData, trackingNumber: string): string | null {
    if (!provider.tracking_url_template || !trackingNumber) {
      return null;
    }

    return provider.tracking_url_template.replace('{tracking_number}', trackingNumber);
  }

  /**
   * Get delivery estimates
   */
  static async getDeliveryEstimates(
    countryId: string,
    serviceAreaId?: string,
    distance?: number
  ): Promise<ServiceResponse<Array<{
    provider: DeliveryProviderData;
    cost: number;
    estimatedDays: string;
  }>>> {
    try {
      let query = db('delivery_providers')
        .where({
          country_id: countryId,
          is_active: true
        });

      if (serviceAreaId) {
        query = query.whereRaw('? = ANY(service_areas)', [serviceAreaId]);
      }

      const providers = await query.orderBy('base_fee', 'asc');

      const estimates = providers.map(provider => {
        const cost = this.calculateDeliveryCost(provider, distance);
        
        let estimatedDays = 'Unknown';
        if (provider.same_day_delivery) {
          estimatedDays = 'Same day';
        } else if (provider.next_day_delivery) {
          estimatedDays = '1-2 days';
        } else if (provider.scheduled_delivery) {
          estimatedDays = '2-5 days';
        }

        return {
          provider,
          cost,
          estimatedDays
        };
      });

      return {
        success: true,
        data: estimates
      };
    } catch (error: any) {
      logger.error('Error getting delivery estimates:', error);
      return {
        success: false,
        error: 'Failed to get delivery estimates'
      };
    }
  }
}

export default DeliveryProvidersService;
