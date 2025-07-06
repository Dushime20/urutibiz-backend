/**
 * Tax Rates Service
 * 
 * Handles CRUD operations for tax rates by country and category
 */
import { getDatabase } from '../../config/database';
import logger from '../../utils/logger';
import {
  TaxRateData,
  CreateTaxRateData,
  UpdateTaxRateData,
  TaxRateFilters,
  ServiceResponse,
  PaginatedResponse
} from '../../types/localization.types';

// Get database instance
const db = getDatabase();

export class TaxRatesService {
  
  // =====================================================
  // CREATE
  // =====================================================
  
  /**
   * Create a new tax rate
   */
  static async createTaxRate(data: CreateTaxRateData): Promise<ServiceResponse<TaxRateData>> {
    try {
      // Validate required fields
      if (!data.country_id || !data.tax_name || !data.tax_type || !data.effective_from) {
        return {
          success: false,
          error: 'Missing required fields: country_id, tax_name, tax_type, effective_from'
        };
      }

      // Validate tax type specific requirements
      if (data.tax_type === 'percentage' && !data.rate_percentage) {
        return {
          success: false,
          error: 'rate_percentage is required for percentage tax type'
        };
      }

      if (data.tax_type === 'fixed' && !data.fixed_amount) {
        return {
          success: false,
          error: 'fixed_amount is required for fixed tax type'
        };
      }

      const [taxRate] = await db('tax_rates')
        .insert({
          ...data,
          created_at: new Date()
        })
        .returning('*');

      logger.info('Tax rate created successfully', { id: taxRate.id });

      return {
        success: true,
        data: taxRate,
        message: 'Tax rate created successfully'
      };
    } catch (error: any) {
      logger.error('Error creating tax rate:', error);
      return {
        success: false,
        error: 'Failed to create tax rate'
      };
    }
  }

  // =====================================================
  // READ
  // =====================================================
  
  /**
   * Get tax rate by ID
   */
  static async getTaxRateById(id: string): Promise<ServiceResponse<TaxRateData>> {
    try {
      const taxRate = await db('tax_rates')
        .where({ id })
        .first();

      if (!taxRate) {
        return {
          success: false,
          error: 'Tax rate not found'
        };
      }

      return {
        success: true,
        data: taxRate
      };
    } catch (error: any) {
      logger.error('Error getting tax rate:', error);
      return {
        success: false,
        error: 'Failed to get tax rate'
      };
    }
  }

  /**
   * Get tax rates with filtering and pagination
   */
  static async getTaxRates(filters: TaxRateFilters = {}): Promise<ServiceResponse<PaginatedResponse<TaxRateData>>> {
    try {
      const {
        country_id,
        category_id,
        tax_type,
        is_active,
        effective_date,
        page = 1,
        limit = 10
      } = filters;

      let query = db('tax_rates').select('*');

      // Apply filters
      if (country_id) {
        query = query.where('country_id', country_id);
      }
      if (category_id) {
        query = query.where('category_id', category_id);
      }
      if (tax_type) {
        query = query.where('tax_type', tax_type);
      }
      if (typeof is_active === 'boolean') {
        query = query.where('is_active', is_active);
      }
      if (effective_date) {
        query = query
          .where('effective_from', '<=', effective_date)
          .where(function() {
            this.whereNull('effective_until').orWhere('effective_until', '>=', effective_date);
          });
      }

      // Get total count for pagination
      const countQuery = query.clone().count('* as count').first();
      const totalCount = await countQuery.then((result: any) => parseInt(result?.count as string) || 0);

      // Apply pagination
      const offset = (page - 1) * limit;
      const taxRates = await query
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: {
          rows: taxRates,
          totalCount,
          page,
          limit,
          totalPages
        }
      };
    } catch (error: any) {
      logger.error('Error getting tax rates:', error);
      return {
        success: false,
        error: 'Failed to get tax rates'
      };
    }
  }

  /**
   * Get applicable tax rates for a country and category at a specific date
   */
  static async getApplicableTaxRates(
    countryId: string,
    categoryId?: string,
    effectiveDate: Date = new Date()
  ): Promise<ServiceResponse<TaxRateData[]>> {
    try {
      const query = db('tax_rates')
        .where('country_id', countryId)
        .where('is_active', true)
        .where('effective_from', '<=', effectiveDate)
        .where(function() {
          this.whereNull('effective_until').orWhere('effective_until', '>=', effectiveDate);
        })
        .where(function() {
          if (categoryId) {
            this.where('category_id', categoryId).orWhereNull('category_id');
          } else {
            this.whereNull('category_id');
          }
        })
        .orderBy('category_id', 'desc') // Category-specific rates first
        .orderBy('created_at', 'desc');

      const taxRates = await query;

      return {
        success: true,
        data: taxRates
      };
    } catch (error: any) {
      logger.error('Error getting applicable tax rates:', error);
      return {
        success: false,
        error: 'Failed to get applicable tax rates'
      };
    }
  }

  // =====================================================
  // UPDATE
  // =====================================================
  
  /**
   * Update tax rate
   */
  static async updateTaxRate(id: string, data: UpdateTaxRateData): Promise<ServiceResponse<TaxRateData>> {
    try {
      // Check if tax rate exists
      const existing = await db('tax_rates').where({ id }).first();
      if (!existing) {
        return {
          success: false,
          error: 'Tax rate not found'
        };
      }

      const [taxRate] = await db('tax_rates')
        .where({ id })
        .update(data)
        .returning('*');

      logger.info('Tax rate updated successfully', { id });

      return {
        success: true,
        data: taxRate,
        message: 'Tax rate updated successfully'
      };
    } catch (error: any) {
      logger.error('Error updating tax rate:', error);
      return {
        success: false,
        error: 'Failed to update tax rate'
      };
    }
  }

  // =====================================================
  // DELETE
  // =====================================================
  
  /**
   * Delete tax rate (soft delete by setting is_active to false)
   */
  static async deleteTaxRate(id: string): Promise<ServiceResponse<void>> {
    try {
      const updated = await db('tax_rates')
        .where({ id })
        .update({ is_active: false });

      if (updated === 0) {
        return {
          success: false,
          error: 'Tax rate not found'
        };
      }

      logger.info('Tax rate deleted successfully', { id });

      return {
        success: true,
        message: 'Tax rate deleted successfully'
      };
    } catch (error: any) {
      logger.error('Error deleting tax rate:', error);
      return {
        success: false,
        error: 'Failed to delete tax rate'
      };
    }
  }

  /**
   * Permanently delete tax rate
   */
  static async permanentlyDeleteTaxRate(id: string): Promise<ServiceResponse<void>> {
    try {
      const deleted = await db('tax_rates')
        .where({ id })
        .del();

      if (deleted === 0) {
        return {
          success: false,
          error: 'Tax rate not found'
        };
      }

      logger.info('Tax rate permanently deleted', { id });

      return {
        success: true,
        message: 'Tax rate permanently deleted'
      };
    } catch (error: any) {
      logger.error('Error permanently deleting tax rate:', error);
      return {
        success: false,
        error: 'Failed to permanently delete tax rate'
      };
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================
  
  /**
   * Calculate tax amount for a given amount
   */
  static calculateTaxAmount(taxRate: TaxRateData, amount: number): number {
    if (amount < taxRate.min_amount_threshold) {
      return 0;
    }

    switch (taxRate.tax_type) {
      case 'percentage':
        return amount * (taxRate.rate_percentage || 0) / 100;
      case 'fixed':
        return taxRate.fixed_amount || 0;
      case 'progressive':
        // For progressive taxes, you would implement tiered calculations
        // This is a simplified implementation
        return amount * (taxRate.rate_percentage || 0) / 100;
      default:
        return 0;
    }
  }

  /**
   * Get total tax for an amount considering all applicable tax rates
   */
  static async calculateTotalTax(
    countryId: string,
    amount: number,
    categoryId?: string,
    appliesTo: string = 'total'
  ): Promise<ServiceResponse<{ totalTax: number; taxBreakdown: Array<{ taxRate: TaxRateData; amount: number }> }>> {
    try {
      const applicableRatesResult = await this.getApplicableTaxRates(countryId, categoryId);
      
      if (!applicableRatesResult.success || !applicableRatesResult.data) {
        return {
          success: false,
          error: 'Failed to get applicable tax rates'
        };
      }

      const relevantTaxRates = applicableRatesResult.data.filter(rate => 
        rate.applies_to === appliesTo || rate.applies_to === 'total'
      );

      let totalTax = 0;
      const taxBreakdown: Array<{ taxRate: TaxRateData; amount: number }> = [];

      for (const taxRate of relevantTaxRates) {
        const taxAmount = this.calculateTaxAmount(taxRate, amount);
        totalTax += taxAmount;
        taxBreakdown.push({ taxRate, amount: taxAmount });
      }

      return {
        success: true,
        data: {
          totalTax,
          taxBreakdown
        }
      };
    } catch (error: any) {
      logger.error('Error calculating total tax:', error);
      return {
        success: false,
        error: 'Failed to calculate total tax'
      };
    }
  }
}

export default TaxRatesService;
