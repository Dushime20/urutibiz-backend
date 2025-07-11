/**
 * Country Business Rules Service
 * 
 * Handles CRUD operations for country-specific business rules and configurations
 */
import logger from '../../utils/logger';

import {
  CountryBusinessRulesData,
  CreateCountryBusinessRulesData,
  UpdateCountryBusinessRulesData,
  ServiceResponse,
  PaginatedResponse
} from '../../types/localization.types';

export class CountryBusinessRulesService {
  
  // =====================================================
  // CREATE
  // =====================================================
  
  /**
   * Create new country business rules
   */
  static async createCountryBusinessRules(data: CreateCountryBusinessRulesData): Promise<ServiceResponse<CountryBusinessRulesData>> {
    const db = getDatabase();
    try {
      // Validate required fields
      if (!data.country_id) {
        return {
          success: false,
          error: 'Missing required field: country_id'
        };
      }

      // Check if rules already exist for this country
      const existing = await db('country_business_rules')
        .where('country_id', data.country_id)
        .first();

      if (existing) {
        return {
          success: false,
          error: 'Business rules already exist for this country'
        };
      }

      // Set default values
      const businessRulesData = {
        country_id: data.country_id,
        min_user_age: data.min_user_age || 18,
        kyc_required: data.kyc_required ?? true,
        max_booking_value: data.max_booking_value || null,
        support_hours_start: data.support_hours_start || '09:00',
        support_hours_end: data.support_hours_end || '17:00',
        support_days: data.support_days || [1, 2, 3, 4, 5], // Monday to Friday
        terms_of_service_url: data.terms_of_service_url || null,
        privacy_policy_url: data.privacy_policy_url || null,
        local_registration_number: data.local_registration_number || null,
        tax_registration_number: data.tax_registration_number || null,
        service_fee_percentage: data.service_fee_percentage || 5.0,
        payment_processing_fee: data.payment_processing_fee || 2.5,
        min_payout_amount: data.min_payout_amount || 50.0,
        created_at: new Date(),
        updated_at: new Date()
      };

      const [newRules] = await db('country_business_rules')
        .insert(businessRulesData)
        .returning('*');

      logger.info(`Country business rules created for country: ${data.country_id}`);

      return {
        success: true,
        data: newRules,
        message: 'Country business rules created successfully'
      };

    } catch (error) {
      logger.error('Error creating country business rules:', error);
      return {
        success: false,
        error: 'Failed to create country business rules'
      };
    }
  }

  // =====================================================
  // READ
  // =====================================================
  
  /**
   * Get country business rules by ID
   */
  static async getCountryBusinessRulesById(id: string): Promise<ServiceResponse<CountryBusinessRulesData>> {
    const db = getDatabase();
    try {
      const rules = await db('country_business_rules')
        .where('id', id)
        .first();

      if (!rules) {
        return {
          success: false,
          error: 'Country business rules not found'
        };
      }

      return {
        success: true,
        data: rules
      };

    } catch (error) {
      logger.error('Error fetching country business rules by ID:', error);
      return {
        success: false,
        error: 'Failed to fetch country business rules'
      };
    }
  }

  /**
   * Get country business rules by country ID
   */
  static async getCountryBusinessRulesByCountryId(countryId: string): Promise<ServiceResponse<CountryBusinessRulesData>> {
    const db = getDatabase();
    try {
      const rules = await db('country_business_rules')
        .where('country_id', countryId)
        .first();

      if (!rules) {
        return {
          success: false,
          error: 'Country business rules not found'
        };
      }

      return {
        success: true,
        data: rules
      };

    } catch (error) {
      logger.error('Error fetching country business rules by country ID:', error);
      return {
        success: false,
        error: 'Failed to fetch country business rules'
      };
    }
  }

  /**
   * Get all country business rules with pagination
   */
  static async getAllCountryBusinessRules(page: number = 1, limit: number = 50): Promise<ServiceResponse<PaginatedResponse<CountryBusinessRulesData>>> {
    const db = getDatabase();
    try {
      const offset = (page - 1) * limit;

      // Get total count
      const [{ count }] = await db('country_business_rules')
        .count('* as count');

      // Get paginated data
      const rows = await db('country_business_rules')
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      const totalCount = parseInt(count as string);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: {
          rows,
          totalCount,
          page,
          limit,
          totalPages
        }
      };

    } catch (error) {
      logger.error('Error fetching all country business rules:', error);
      return {
        success: false,
        error: 'Failed to fetch country business rules'
      };
    }
  }

  // =====================================================
  // UPDATE
  // =====================================================
  
  /**
   * Update country business rules
   */
  static async updateCountryBusinessRules(id: string, data: UpdateCountryBusinessRulesData): Promise<ServiceResponse<CountryBusinessRulesData>> {
    const db = getDatabase();
    try {
      // Check if rules exist
      const existing = await db('country_business_rules')
        .where('id', id)
        .first();

      if (!existing) {
        return {
          success: false,
          error: 'Country business rules not found'
        };
      }

      // Update data
      const updateData = {
        ...data,
        updated_at: new Date()
      };

      const [updated] = await db('country_business_rules')
        .where('id', id)
        .update(updateData)
        .returning('*');

      logger.info(`Country business rules updated: ${id}`);

      return {
        success: true,
        data: updated,
        message: 'Country business rules updated successfully'
      };

    } catch (error) {
      logger.error('Error updating country business rules:', error);
      return {
        success: false,
        error: 'Failed to update country business rules'
      };
    }
  }

  // =====================================================
  // DELETE
  // =====================================================
  
  /**
   * Delete country business rules
   */
  static async deleteCountryBusinessRules(id: string): Promise<ServiceResponse<void>> {
    const db = getDatabase();
    try {
      const deleted = await db('country_business_rules')
        .where('id', id)
        .del();

      if (deleted === 0) {
        return {
          success: false,
          error: 'Country business rules not found'
        };
      }

      logger.info(`Country business rules deleted: ${id}`);

      return {
        success: true,
        message: 'Country business rules deleted successfully'
      };

    } catch (error) {
      logger.error('Error deleting country business rules:', error);
      return {
        success: false,
        error: 'Failed to delete country business rules'
      };
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  /**
   * Check if KYC is required for a country
   */
  static async isKycRequiredForCountry(countryId: string): Promise<boolean> {
    const db = getDatabase();
    try {
      const rules = await db('country_business_rules')
        .where('country_id', countryId)
        .first();

      return rules ? rules.kyc_required : true; // Default to true if no rules found
    } catch (error) {
      logger.error('Error checking KYC requirement:', error);
      return true; // Default to true on error
    }
  }

  /**
   * Get minimum user age for a country
   */
  static async getMinUserAgeForCountry(countryId: string): Promise<number> {
    const db = getDatabase();
    try {
      const rules = await db('country_business_rules')
        .where('country_id', countryId)
        .first();

      return rules ? rules.min_user_age : 18; // Default to 18 if no rules found
    } catch (error) {
      logger.error('Error getting minimum user age:', error);
      return 18; // Default to 18 on error
    }
  }

  /**
   * Calculate service fee for a country
   */
  static async calculateServiceFee(countryId: string, amount: number): Promise<number> {
    const db = getDatabase();
    try {
      const rules = await db('country_business_rules')
        .where('country_id', countryId)
        .first();

      const feePercentage = rules ? rules.service_fee_percentage : 5.0;
      return (amount * feePercentage) / 100;
    } catch (error) {
      logger.error('Error calculating service fee:', error);
      return (amount * 5.0) / 100; // Default to 5% on error
    }
  }

  /**
   * Calculate payment processing fee for a country
   */
  static async calculatePaymentProcessingFee(countryId: string, amount: number): Promise<number> {
    const db = getDatabase();
    try {
      const rules = await db('country_business_rules')
        .where('country_id', countryId)
        .first();

      const feePercentage = rules ? rules.payment_processing_fee : 2.5;
      return (amount * feePercentage) / 100;
    } catch (error) {
      logger.error('Error calculating payment processing fee:', error);
      return (amount * 2.5) / 100; // Default to 2.5% on error
    }
  }

  /**
   * Check if booking amount is within limits for a country
   */
  static async isBookingAmountValid(countryId: string, amount: number): Promise<boolean> {
    const db = getDatabase();
    try {
      const rules = await db('country_business_rules')
        .where('country_id', countryId)
        .first();

      if (!rules || !rules.max_booking_value) {
        return true; // No limit set
      }

      return amount <= rules.max_booking_value;
    } catch (error) {
      logger.error('Error validating booking amount:', error);
      return true; // Default to valid on error
    }
  }

  /**
   * Check if support is available for a country at a given time
   */
  static async isSupportAvailable(countryId: string, date: Date = new Date()): Promise<boolean> {
    const db = getDatabase();
    try {
      const rules = await db('country_business_rules')
        .where('country_id', countryId)
        .first();

      if (!rules) {
        return false; // No rules found, support not available
      }

      const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // Convert Sunday from 0 to 7
      const currentTime = date.toTimeString().slice(0, 5); // HH:MM format

      const isDaySupported = rules.support_days.includes(dayOfWeek);
      const isTimeSupported = currentTime >= rules.support_hours_start && currentTime <= rules.support_hours_end;

      return isDaySupported && isTimeSupported;
    } catch (error) {
      logger.error('Error checking support availability:', error);
      return false; // Default to not available on error
    }
  }
}

export default CountryBusinessRulesService;
