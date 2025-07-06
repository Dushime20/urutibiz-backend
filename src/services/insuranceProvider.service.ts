import { Op, Transaction } from 'sequelize';
import { InsuranceProvider } from '../models/InsuranceProvider.model';
import {
  InsuranceProviderData,
  CreateInsuranceProviderData,
  UpdateInsuranceProviderData,
  InsuranceProviderFilters,
  InsuranceProviderQueryOptions,
  InsuranceProviderStats,
  InsuranceProviderSearchResult,
  CreateInsuranceProviderResult,
  UpdateInsuranceProviderResult,
  DeleteInsuranceProviderResult,
  BulkInsuranceProviderResult,
  InsuranceProviderComparison,
  CoverageAnalysis,
  InsuranceMarketAnalysis,
  ProviderType,
  IntegrationStatus,
  CoverageType,
} from '../types/insuranceProvider.types';

export class InsuranceProviderService {
  /**
   * Create a new insurance provider
   */
  static async createInsuranceProvider(
    data: CreateInsuranceProviderData,
    transaction?: Transaction
  ): Promise<CreateInsuranceProviderResult> {
    try {
      // Validate required fields
      if (!data.country_id || !data.provider_name) {
        return {
          success: false,
          error: 'Country ID and provider name are required',
          validation_errors: {
            country_id: data.country_id ? [] : ['Country ID is required'],
            provider_name: data.provider_name ? [] : ['Provider name is required'],
          },
        };
      }

      // Check for duplicate provider name in the same country
      const existingProvider = await InsuranceProvider.findOne({
        where: {
          country_id: data.country_id,
          provider_name: data.provider_name,
        },
        transaction,
      });

      if (existingProvider) {
        return {
          success: false,
          error: 'Provider with this name already exists in the country',
          validation_errors: {
            provider_name: ['Provider name already exists in this country'],
          },
        };
      }

      // Create the provider
      const provider = await InsuranceProvider.create(data, { transaction });

      return {
        success: true,
        provider: provider.toJSON() as InsuranceProviderData,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create insurance provider',
      };
    }
  }

  /**
   * Get insurance provider by ID
   */
  static async getInsuranceProviderById(
    id: string,
    options: InsuranceProviderQueryOptions = {}
  ): Promise<InsuranceProviderData | null> {
    try {
      const whereClause: any = { id };
      
      if (!options.include_inactive) {
        whereClause.is_active = true;
      }

      const provider = await InsuranceProvider.findOne({
        where: whereClause,
        include: options.include_stats ? ['country'] : [],
      });

      if (!provider) {
        return null;
      }

      const result = provider.toJSON() as InsuranceProviderData;

      // Remove sensitive data if not requested
      if (!options.include_credentials && result.api_credentials) {
        result.api_credentials = {};
      }

      return result;
    } catch (error: any) {
      console.error('Error fetching insurance provider:', error);
      return null;
    }
  }

  /**
   * Search insurance providers with filters
   */
  static async searchInsuranceProviders(
    filters: InsuranceProviderFilters = {}
  ): Promise<InsuranceProviderSearchResult> {
    try {
      const {
        country_id,
        provider_name,
        provider_type,
        is_active = true,
        integration_status,
        min_rating,
        max_rating,
        supports_category,
        coverage_type,
        language,
        min_coverage,
        max_coverage,
        max_processing_days,
        search,
        page = 1,
        limit = 20,
        sort_by = 'provider_name',
        sort_order = 'ASC',
      } = filters;

      // Build where clause
      const whereClause: any = {};

      if (country_id) {
        whereClause.country_id = country_id;
      }

      if (provider_name) {
        whereClause.provider_name = {
          [Op.iLike]: `%${provider_name}%`,
        };
      }

      if (provider_type) {
        if (Array.isArray(provider_type)) {
          whereClause.provider_type = { [Op.in]: provider_type };
        } else {
          whereClause.provider_type = provider_type;
        }
      }

      if (typeof is_active === 'boolean') {
        whereClause.is_active = is_active;
      }

      if (integration_status) {
        if (Array.isArray(integration_status)) {
          whereClause.integration_status = { [Op.in]: integration_status };
        } else {
          whereClause.integration_status = integration_status;
        }
      }

      if (min_rating !== undefined) {
        whereClause.rating = { [Op.gte]: min_rating };
      }

      if (max_rating !== undefined) {
        whereClause.rating = {
          ...whereClause.rating,
          [Op.lte]: max_rating,
        };
      }

      if (supports_category) {
        whereClause.supported_categories = {
          [Op.contains]: [supports_category],
        };
      }

      if (coverage_type) {
        const coverageTypes = Array.isArray(coverage_type) ? coverage_type : [coverage_type];
        whereClause.coverage_types = {
          [Op.overlap]: coverageTypes,
        };
      }

      if (language) {
        whereClause.languages_supported = {
          [Op.contains]: [language],
        };
      }

      if (min_coverage !== undefined) {
        whereClause.min_coverage_amount = { [Op.gte]: min_coverage };
      }

      if (max_coverage !== undefined) {
        whereClause.max_coverage_amount = { [Op.lte]: max_coverage };
      }

      if (max_processing_days !== undefined) {
        whereClause.processing_time_days = { [Op.lte]: max_processing_days };
      }

      if (search) {
        whereClause[Op.or] = [
          { provider_name: { [Op.iLike]: `%${search}%` } },
          { display_name: { [Op.iLike]: `%${search}%` } },
          { license_number: { [Op.iLike]: `%${search}%` } },
        ];
      }

      // Calculate offset
      const offset = (page - 1) * limit;

      // Execute query
      const { rows: providers, count: total } = await InsuranceProvider.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [[sort_by, sort_order]],
      });

      // Calculate pagination
      const total_pages = Math.ceil(total / limit);
      const has_next = page < total_pages;
      const has_prev = page > 1;

      return {
        providers: providers.map(p => p.toJSON() as InsuranceProviderData),
        pagination: {
          page,
          limit,
          total,
          total_pages,
          has_next,
          has_prev,
        },
        filters_applied: filters,
      };
    } catch (error: any) {
      console.error('Error searching insurance providers:', error);
      return {
        providers: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false,
        },
        filters_applied: filters,
      };
    }
  }

  /**
   * Update insurance provider
   */
  static async updateInsuranceProvider(
    id: string,
    data: UpdateInsuranceProviderData,
    transaction?: Transaction
  ): Promise<UpdateInsuranceProviderResult> {
    try {
      const provider = await InsuranceProvider.findByPk(id, { transaction });

      if (!provider) {
        return {
          success: false,
          error: 'Insurance provider not found',
        };
      }

      // Check for duplicate name if provider_name is being updated
      if (data.provider_name && data.provider_name !== provider.provider_name) {
        const existingProvider = await InsuranceProvider.findOne({
          where: {
            country_id: provider.country_id,
            provider_name: data.provider_name,
            id: { [Op.ne]: id },
          },
          transaction,
        });

        if (existingProvider) {
          return {
            success: false,
            error: 'Provider with this name already exists in the country',
            validation_errors: {
              provider_name: ['Provider name already exists in this country'],
            },
          };
        }
      }

      // Track changes
      const changes_made: string[] = [];
      const updatedFields = Object.keys(data);

      for (const field of updatedFields) {
        if (provider.get(field) !== (data as any)[field]) {
          changes_made.push(field);
        }
      }

      // Update the provider
      await provider.update(data, { transaction });

      return {
        success: true,
        provider: provider.toJSON() as InsuranceProviderData,
        changes_made,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update insurance provider',
      };
    }
  }

  /**
   * Delete insurance provider (soft delete)
   */
  static async deleteInsuranceProvider(
    id: string,
    transaction?: Transaction
  ): Promise<DeleteInsuranceProviderResult> {
    try {
      const provider = await InsuranceProvider.findByPk(id, { transaction });

      if (!provider) {
        return {
          success: false,
          error: 'Insurance provider not found',
        };
      }

      // Soft delete
      await provider.destroy({ transaction });

      return {
        success: true,
        message: 'Insurance provider deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete insurance provider',
      };
    }
  }

  /**
   * Get providers by country
   */
  static async getProvidersByCountry(
    countryId: string,
    options: InsuranceProviderQueryOptions = {}
  ): Promise<InsuranceProviderData[]> {
    try {
      const providers = await InsuranceProvider.findByCountry(countryId, {
        where: options.include_inactive ? {} : { is_active: true },
      });

      return providers.map(p => {
        const result = p.toJSON() as InsuranceProviderData;
        if (!options.include_credentials && result.api_credentials) {
          result.api_credentials = {};
        }
        return result;
      });
    } catch (error: any) {
      console.error('Error fetching providers by country:', error);
      return [];
    }
  }

  /**
   * Get providers by category
   */
  static async getProvidersByCategory(
    categoryId: string,
    options: InsuranceProviderQueryOptions = {}
  ): Promise<InsuranceProviderData[]> {
    try {
      const providers = await InsuranceProvider.findByCategory(categoryId, {
        where: options.include_inactive ? {} : { is_active: true },
      });

      return providers.map(p => {
        const result = p.toJSON() as InsuranceProviderData;
        if (!options.include_credentials && result.api_credentials) {
          result.api_credentials = {};
        }
        return result;
      });
    } catch (error: any) {
      console.error('Error fetching providers by category:', error);
      return [];
    }
  }

  /**
   * Get live providers with API integration
   */
  static async getLiveProviders(
    options: InsuranceProviderQueryOptions = {}
  ): Promise<InsuranceProviderData[]> {
    try {
      const providers = await InsuranceProvider.findLiveProviders({
        where: {
          api_endpoint: { [Op.ne]: null },
          ...(options.country_id && { country_id: options.country_id }),
        },
      });

      return providers.map(p => {
        const result = p.toJSON() as InsuranceProviderData;
        if (!options.include_credentials && result.api_credentials) {
          result.api_credentials = {};
        }
        return result;
      });
    } catch (error: any) {
      console.error('Error fetching live providers:', error);
      return [];
    }
  }

  /**
   * Get insurance provider statistics
   */
  static async getProviderStats(countryId?: string): Promise<InsuranceProviderStats> {
    try {
      const whereClause = countryId ? { country_id: countryId } : {};

      const [
        totalCount,
        activeCount,
        typeStats,
        statusStats,
        countryStats,
        avgRating,
        avgProcessingTime,
        // coverageStats,
        // languageStats,
      ] = await Promise.all([
        // Total providers
        InsuranceProvider.count({ where: whereClause }),
        
        // Active providers
        InsuranceProvider.count({ where: { ...whereClause, is_active: true } }),
        
        // By type
        InsuranceProvider.findAll({
          where: whereClause,
          attributes: [
            'provider_type',
            [InsuranceProvider.sequelize!.fn('COUNT', '*'), 'count'],
          ],
          group: ['provider_type'],
          raw: true,
        }),
        
        // By integration status
        InsuranceProvider.findAll({
          where: whereClause,
          attributes: [
            'integration_status',
            [InsuranceProvider.sequelize!.fn('COUNT', '*'), 'count'],
          ],
          group: ['integration_status'],
          raw: true,
        }),
        
        // By country (if not filtering by country)
        !countryId ? InsuranceProvider.findAll({
          attributes: [
            'country_id',
            [InsuranceProvider.sequelize!.fn('COUNT', '*'), 'count'],
          ],
          group: ['country_id'],
          raw: true,
        }) : Promise.resolve([]),
        
        // Average rating - simplified
        Promise.resolve({ avg_rating: 0 }),
        
        // Average processing time - simplified
        Promise.resolve({ avg_processing: 0 }),
        
        // Coverage distribution (this would need a more complex query)
        Promise.resolve([]),
        
        // Language distribution (this would need a more complex query)
        Promise.resolve([]),
      ]);

      // Process results
      const by_type: Record<ProviderType, number> = {
        TRADITIONAL: 0,
        DIGITAL: 0,
        PEER_TO_PEER: 0,
        GOVERNMENT: 0,
        MUTUAL: 0,
      };

      (typeStats as any[]).forEach((stat: any) => {
        by_type[stat.provider_type as ProviderType] = parseInt(stat.count);
      });

      const by_integration_status: Record<IntegrationStatus, number> = {
        NOT_INTEGRATED: 0,
        TESTING: 0,
        LIVE: 0,
        DEPRECATED: 0,
      };

      (statusStats as any[]).forEach((stat: any) => {
        by_integration_status[stat.integration_status as IntegrationStatus] = parseInt(stat.count);
      });

      const by_country: Record<string, number> = {};
      (countryStats as any[]).forEach((stat: any) => {
        by_country[stat.country_id] = parseInt(stat.count);
      });

      return {
        total_providers: totalCount,
        active_providers: activeCount,
        by_type,
        by_integration_status,
        by_country,
        average_rating: parseFloat((avgRating as any)?.avg_rating || '0'),
        average_processing_time: parseFloat((avgProcessingTime as any)?.avg_processing || '0'),
        coverage_distribution: {} as Record<CoverageType, number>,
        language_distribution: {} as Record<string, number>,
      };
    } catch (error: any) {
      console.error('Error fetching provider stats:', error);
      return {
        total_providers: 0,
        active_providers: 0,
        by_type: {
          TRADITIONAL: 0,
          DIGITAL: 0,
          PEER_TO_PEER: 0,
          GOVERNMENT: 0,
          MUTUAL: 0,
        },
        by_integration_status: {
          NOT_INTEGRATED: 0,
          TESTING: 0,
          LIVE: 0,
          DEPRECATED: 0,
        },
        by_country: {},
        average_rating: 0,
        average_processing_time: 0,
        coverage_distribution: {} as Record<CoverageType, number>,
        language_distribution: {} as Record<string, number>,
      };
    }
  }

  /**
   * Bulk create insurance providers
   */
  static async bulkCreateProviders(
    providersData: CreateInsuranceProviderData[],
    transaction?: Transaction
  ): Promise<BulkInsuranceProviderResult> {
    const errors: Array<{ index: number; data: any; error: string }> = [];
    const created_providers: InsuranceProviderData[] = [];

    for (let i = 0; i < providersData.length; i++) {
      try {
        const result = await this.createInsuranceProvider(providersData[i], transaction);
        if (result.success && result.provider) {
          created_providers.push(result.provider);
        } else {
          errors.push({
            index: i,
            data: providersData[i],
            error: result.error || 'Unknown error',
          });
        }
      } catch (error: any) {
        errors.push({
          index: i,
          data: providersData[i],
          error: error.message,
        });
      }
    }

    return {
      success: errors.length === 0,
      processed: created_providers.length,
      failed: errors.length,
      errors,
      created_providers,
    };
  }

  /**
   * Compare providers for a category and coverage amount
   */
  static async compareProviders(
    categoryId: string,
    coverageAmount: number,
    countryId?: string
  ): Promise<InsuranceProviderComparison[]> {
    try {
      const whereClause: any = {
        supported_categories: { [Op.contains]: [categoryId] },
        is_active: true,
      };

      if (countryId) {
        whereClause.country_id = countryId;
      }

      const providers = await InsuranceProvider.findAll({
        where: whereClause,
        order: [['rating', 'DESC']],
      });

      return providers
        .filter(p => p.canHandleCoverageAmount(coverageAmount))
        .map(p => ({
          provider_id: p.id,
          provider_name: p.getDisplayName(),
          rating: p.getRating(),
          coverage_types: p.coverage_types || [],
          min_coverage: p.min_coverage_amount || 0,
          max_coverage: p.max_coverage_amount || 0,
          processing_time: p.getProcessingTime(),
          commission_rate: p.getCommissionRate(),
          supported_languages: p.languages_supported || [],
          api_available: p.hasApiIntegration(),
          integration_status: p.integration_status,
        }));
    } catch (error: any) {
      console.error('Error comparing providers:', error);
      return [];
    }
  }

  /**
   * Analyze coverage for a specific category and country
   */
  static async analyzeCoverage(
    categoryId: string,
    countryId: string
  ): Promise<CoverageAnalysis> {
    try {
      const providers = await this.compareProviders(categoryId, 0, countryId);

      // Get all available coverage types
      const allCoverageTypes = new Set<CoverageType>();
      providers.forEach(p => {
        p.coverage_types.forEach(ct => allCoverageTypes.add(ct));
      });

      // Find coverage gaps (this would depend on what's required for the category)
      const coverage_gaps: CoverageType[] = [];

      // Calculate average coverage
      const coverageAmounts = providers
        .map(p => p.max_coverage)
        .filter(amount => amount > 0);
      
      const average_coverage_amount = coverageAmounts.length > 0
        ? coverageAmounts.reduce((sum, amount) => sum + amount, 0) / coverageAmounts.length
        : 0;

      // Processing time range
      const processingTimes = providers
        .map(p => p.processing_time)
        .filter(time => time > 0);

      const processing_time_range = {
        min: processingTimes.length > 0 ? Math.min(...processingTimes) : 0,
        max: processingTimes.length > 0 ? Math.max(...processingTimes) : 0,
        average: processingTimes.length > 0
          ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
          : 0,
      };

      // Recommend top 3 providers
      const recommended_providers = providers
        .sort((a, b) => {
          // Sort by rating first, then by processing time
          if (a.rating !== b.rating) {
            return b.rating - a.rating;
          }
          return a.processing_time - b.processing_time;
        })
        .slice(0, 3);

      return {
        category_id: categoryId,
        country_id: countryId,
        available_providers: providers,
        coverage_gaps,
        recommended_providers,
        average_coverage_amount,
        processing_time_range,
      };
    } catch (error: any) {
      console.error('Error analyzing coverage:', error);
      return {
        category_id: categoryId,
        country_id: countryId,
        available_providers: [],
        coverage_gaps: [],
        recommended_providers: [],
        average_coverage_amount: 0,
        processing_time_range: { min: 0, max: 0, average: 0 },
      };
    }
  }

  /**
   * Get market analysis for a country
   */
  static async getMarketAnalysis(countryId: string): Promise<InsuranceMarketAnalysis> {
    try {
      const providers = await this.getProvidersByCountry(countryId, { include_inactive: false });
      const total_providers = providers.length;

      // Calculate market share (simplified - based on supported categories count)
      const market_share = providers.map(p => ({
        provider_id: p.id,
        provider_name: p.provider_name,
        market_share_percentage: ((p.supported_categories?.length || 0) / 10) * 100, // Simplified calculation
        supported_categories_count: p.supported_categories?.length || 0,
      })).sort((a, b) => b.market_share_percentage - a.market_share_percentage);

      // Coverage gaps analysis would require category data
      const coverage_gaps: { category_id: string; coverage_types: CoverageType[] }[] = [];

      // Competitive landscape
      const ratings = providers.map(p => p.rating || 0).filter(r => r > 0);
      const coverageAmounts = providers.map(p => p.max_coverage_amount || 0).filter(a => a > 0);
      const liveProviders = providers.filter(p => p.integration_status === 'LIVE');

      const competitive_landscape = {
        price_range: {
          min_coverage: coverageAmounts.length > 0 ? Math.min(...coverageAmounts) : 0,
          max_coverage: coverageAmounts.length > 0 ? Math.max(...coverageAmounts) : 0,
        },
        rating_distribution: ratings.reduce((acc, rating) => {
          const key = Math.floor(rating).toString();
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        integration_readiness: total_providers > 0 ? (liveProviders.length / total_providers) * 100 : 0,
      };

      return {
        country_id: countryId,
        total_providers,
        market_share,
        coverage_gaps,
        competitive_landscape,
      };
    } catch (error: any) {
      console.error('Error getting market analysis:', error);
      return {
        country_id: countryId,
        total_providers: 0,
        market_share: [],
        coverage_gaps: [],
        competitive_landscape: {
          price_range: { min_coverage: 0, max_coverage: 0 },
          rating_distribution: {},
          integration_readiness: 0,
        },
      };
    }
  }
}
