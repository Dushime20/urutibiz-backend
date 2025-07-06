// =====================================================
// COUNTRY SERVICE
// =====================================================

import { CountryModel } from '@/models/Country.model';
import { 
  Country, 
  CreateCountryRequest, 
  UpdateCountryRequest, 
  CountryFilters, 
  CountryStats 
} from '@/types/country.types';
import logger from '@/utils/logger';

export class CountryService {

  /**
   * Create a new country
   */
  static async createCountry(data: CreateCountryRequest): Promise<Country> {
    try {
      // Validate unique constraints
      const codeExists = await CountryModel.codeExists(data.code);
      if (codeExists) {
        throw new Error(`Country with code '${data.code}' already exists`);
      }

      const alpha3CodeExists = await CountryModel.alpha3CodeExists(data.code_alpha3);
      if (alpha3CodeExists) {
        throw new Error(`Country with alpha-3 code '${data.code_alpha3}' already exists`);
      }

      // Normalize codes to uppercase
      const normalizedData = {
        ...data,
        code: data.code.toUpperCase(),
        code_alpha3: data.code_alpha3.toUpperCase(),
        currency_code: data.currency_code.toUpperCase()
      };

      const country = await CountryModel.create(normalizedData);
      logger.info(`Country created: ${country.name} (${country.code})`);
      
      return country;
    } catch (error) {
      logger.error(`Error creating country: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get country by ID
   */
  static async getCountryById(id: string): Promise<Country> {
    try {
      const country = await CountryModel.findById(id);
      if (!country) {
        throw new Error('Country not found');
      }
      return country;
    } catch (error) {
      const err = error as Error;
      logger.error(`Error getting country by ID ${id}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Get country by code
   */
  static async getCountryByCode(code: string): Promise<Country> {
    try {
      const country = await CountryModel.findByCode(code);
      if (!country) {
        throw new Error(`Country with code '${code}' not found`);
      }
      return country;
    } catch (error) {
      const err = error as Error;
      logger.error(`Error getting country by code ${code}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Get all countries with filters and pagination
   */
  static async getCountries(filters: CountryFilters = {}) {
    try {
      const { countries, total } = await CountryModel.findAll(filters);
      
      // Calculate pagination metadata
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      const page = Math.floor(offset / limit) + 1;
      const pages = Math.ceil(total / limit);

      return {
        countries,
        meta: {
          total,
          limit,
          offset,
          page,
          pages
        }
      };
    } catch (error) {
      const err = error as Error;
      logger.error(`Error getting countries: ${err.message}`);
      throw error;
    }
  }

  /**
   * Update country
   */
  static async updateCountry(id: string, data: UpdateCountryRequest): Promise<Country> {
    try {
      // Check if country exists
      const existingCountry = await CountryModel.findById(id);
      if (!existingCountry) {
        throw new Error('Country not found');
      }

      // Validate unique constraints if codes are being updated
      if (data.code && data.code !== existingCountry.code) {
        const codeExists = await CountryModel.codeExists(data.code, id);
        if (codeExists) {
          throw new Error(`Country with code '${data.code}' already exists`);
        }
      }

      if (data.code_alpha3 && data.code_alpha3 !== existingCountry.code_alpha3) {
        const alpha3CodeExists = await CountryModel.alpha3CodeExists(data.code_alpha3, id);
        if (alpha3CodeExists) {
          throw new Error(`Country with alpha-3 code '${data.code_alpha3}' already exists`);
        }
      }

      // Normalize codes to uppercase if provided
      const normalizedData = { ...data };
      if (normalizedData.code) {
        normalizedData.code = normalizedData.code.toUpperCase();
      }
      if (normalizedData.code_alpha3) {
        normalizedData.code_alpha3 = normalizedData.code_alpha3.toUpperCase();
      }
      if (normalizedData.currency_code) {
        normalizedData.currency_code = normalizedData.currency_code.toUpperCase();
      }

      const country = await CountryModel.update(id, normalizedData);
      if (!country) {
        throw new Error('Failed to update country');
      }

      logger.info(`Country updated: ${country.name} (${country.code})`);
      return country;
    } catch (error) {
      const err = error as Error;
      logger.error(`Error updating country ${id}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Delete country (soft delete)
   */
  static async deleteCountry(id: string): Promise<void> {
    try {
      const country = await CountryModel.findById(id);
      if (!country) {
        throw new Error('Country not found');
      }

      const success = await CountryModel.delete(id);
      if (!success) {
        throw new Error('Failed to delete country');
      }

      logger.info(`Country soft deleted: ${country.name} (${country.code})`);
    } catch (error) {
      const err = error as Error;
      logger.error(`Error deleting country ${id}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Hard delete country
   */
  static async hardDeleteCountry(id: string): Promise<void> {
    try {
      const country = await CountryModel.findById(id);
      if (!country) {
        throw new Error('Country not found');
      }

      const success = await CountryModel.hardDelete(id);
      if (!success) {
        throw new Error('Failed to permanently delete country');
      }

      logger.info(`Country permanently deleted: ${country.name} (${country.code})`);
    } catch (error) {
      const err = error as Error;
      logger.error(`Error permanently deleting country ${id}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Get active countries only
   */
  static async getActiveCountries(): Promise<Country[]> {
    try {
      return await CountryModel.findActive();
    } catch (error) {
      const err = error as Error;
      logger.error(`Error getting active countries: ${err.message}`);
      throw error;
    }
  }

  /**
   * Get countries by currency
   */
  static async getCountriesByCurrency(currency_code: string): Promise<Country[]> {
    try {
      return await CountryModel.findByCurrency(currency_code);
    } catch (error) {
      const err = error as Error;
      logger.error(`Error getting countries by currency ${currency_code}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Get countries that support a specific language
   */
  static async getCountriesByLanguage(language: string): Promise<Country[]> {
    try {
      return await CountryModel.findByLanguage(language);
    } catch (error) {
      const err = error as Error;
      logger.error(`Error getting countries by language ${language}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Toggle country active status
   */
  static async toggleCountryStatus(id: string): Promise<Country> {
    try {
      const country = await CountryModel.toggleActive(id);
      if (!country) {
        throw new Error('Country not found');
      }

      logger.info(`Country status toggled: ${country.name} (${country.code}) - Active: ${country.is_active}`);
      return country;
    } catch (error) {
      const err = error as Error;
      logger.error(`Error toggling country status ${id}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Get country statistics
   */
  static async getCountryStats(): Promise<CountryStats> {
    try {
      return await CountryModel.getStats();
    } catch (error) {
      logger.error(`Error getting country statistics: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Search countries
   */
  static async searchCountries(searchTerm: string, limit: number = 10): Promise<Country[]> {
    try {
      const { countries } = await CountryModel.findAll({
        search: searchTerm,
        is_active: true,
        limit,
        sort_by: 'name'
      });
      return countries;
    } catch (error) {
      const err = error as Error;
      logger.error(`Error searching countries with term '${searchTerm}': ${err.message}`);
      throw error;
    }
  }

  /**
   * Validate country data
   */
  static validateCountryData(data: CreateCountryRequest | UpdateCountryRequest): void {
    const errors: string[] = [];

    // Validate required fields for creation
    if ('code' in data && (!data.code || data.code.length !== 2)) {
      errors.push('Country code must be exactly 2 characters (ISO 3166-1 alpha-2)');
    }

    if ('code_alpha3' in data && (!data.code_alpha3 || data.code_alpha3.length !== 3)) {
      errors.push('Alpha-3 code must be exactly 3 characters (ISO 3166-1 alpha-3)');
    }

    if ('currency_code' in data && (!data.currency_code || data.currency_code.length !== 3)) {
      errors.push('Currency code must be exactly 3 characters (ISO 4217)');
    }

    if ('name' in data && (!data.name || data.name.trim().length === 0)) {
      errors.push('Country name is required');
    }

    // Validate phone prefix format
    if (data.phone_prefix && !data.phone_prefix.startsWith('+')) {
      errors.push('Phone prefix must start with +');
    }

    // Validate languages array
    if (data.languages && (!Array.isArray(data.languages) || data.languages.length === 0)) {
      errors.push('Languages must be a non-empty array');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }
}
