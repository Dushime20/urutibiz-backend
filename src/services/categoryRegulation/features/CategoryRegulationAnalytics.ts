import {
  CategoryRegulationStats,
  CountryRegulationOverview,
  CategoryRegulationOverview,
  ServiceResponse,
} from '../../../types/categoryRegulation.types';
import CategoryRegulationRepository from '../core/CategoryRegulationRepository';
import CategoryRegulationValidator from '../utils/CategoryRegulationValidator';
import CategoryRegulationErrorHandler from '../utils/ErrorHandler';
import ResponseFormatter from '../utils/ResponseFormatter';

/**
 * Handles analytics and statistics for Category Regulations
 * Separated from CRUD operations for better maintainability
 */
export class CategoryRegulationAnalytics {
  /**
   * Get comprehensive category regulation statistics
   */
  static async getStats(): Promise<ServiceResponse<CategoryRegulationStats>> {
    try {
      const [
        totalRegulations,
        statusCounts,
        complianceLevelDistribution,
      ] = await Promise.all([
        CategoryRegulationRepository.countTotal(),
        CategoryRegulationRepository.countByStatus(),
        CategoryRegulationRepository.getComplianceLevelDistribution(),
      ]);

      const stats: CategoryRegulationStats = {
        total_regulations: totalRegulations,
        by_country: await this.getCountryDistribution(),
        by_category: await this.getCategoryDistribution(),
        by_compliance_level: complianceLevelDistribution,
        licensing_required: statusCounts.requires_license,
        insurance_required: statusCounts.mandatory_insurance,
        background_check_required: 0, // TODO: Implement proper calculation
        average_age_requirement: 18, // TODO: Implement proper calculation
        average_max_rental_days: 30, // TODO: Implement proper calculation
        most_restrictive_countries: [], // TODO: Implement proper calculation
        most_regulated_categories: [], // TODO: Implement proper calculation
      };

      return ResponseFormatter.success(
        stats,
        'Category regulation statistics retrieved successfully'
      );
    } catch (error: any) {
      return CategoryRegulationErrorHandler.handleError(
        error,
        'get category regulation statistics'
      );
    }
  }

  /**
   * Get country-specific regulation overview
   */
  static async getCountryRegulationOverview(
    countryId: string
  ): Promise<ServiceResponse<CountryRegulationOverview>> {
    try {
      // Validate country ID
      const idValidation = CategoryRegulationValidator.validateId(countryId, 'country_id');
      if (idValidation) {
        return CategoryRegulationErrorHandler.handleValidationError(
          [idValidation],
          'get country regulation overview'
        );
      }

      // Get regulations for this country
      const regulations = await CategoryRegulationRepository.findByCountryId(countryId);

      if (regulations.length === 0) {
        return CategoryRegulationErrorHandler.handleNotFoundError(
          'Regulations for the specified country'
        );
      }

      const overview: CountryRegulationOverview = {
        country_id: countryId,
        country_code: 'TODO', // TODO: Get from database
        country_name: 'TODO', // TODO: Get from database
        total_regulations: regulations.length,
        allowed_categories: regulations.filter(r => r.is_allowed).length,
        restricted_categories: regulations.filter(r => !r.is_allowed).length,
        prohibited_categories: 0, // TODO: Implement proper calculation
        licensing_requirements: regulations.filter(r => r.requires_license).length,
        insurance_requirements: regulations.filter(r => r.mandatory_insurance).length,
        compliance_breakdown: this.analyzeComplianceLevels(regulations),
        most_restrictive_categories: [], // TODO: Implement proper calculation
        documentation_requirements: [], // TODO: Implement proper analysis
      };

      return ResponseFormatter.success(
        overview,
        'Country regulation overview retrieved successfully'
      );
    } catch (error: any) {
      return CategoryRegulationErrorHandler.handleError(
        error,
        'get country regulation overview',
        { countryId }
      );
    }
  }

  /**
   * Get category-specific regulation overview
   */
  static async getCategoryRegulationOverview(
    categoryId: string
  ): Promise<ServiceResponse<CategoryRegulationOverview>> {
    try {
      // Validate category ID
      const idValidation = CategoryRegulationValidator.validateId(categoryId, 'category_id');
      if (idValidation) {
        return CategoryRegulationErrorHandler.handleValidationError(
          [idValidation],
          'get category regulation overview'
        );
      }

      // Get regulations for this category
      const regulations = await CategoryRegulationRepository.findByCategoryId(categoryId);

      if (regulations.length === 0) {
        return CategoryRegulationErrorHandler.handleNotFoundError(
          'Regulations for the specified category'
        );
      }

      const overview: CategoryRegulationOverview = {
        category_id: categoryId,
        category_name: 'TODO', // TODO: Get from database
        total_regulations: regulations.length,
        countries_allowed: regulations.filter(r => r.is_allowed).length,
        countries_restricted: regulations.filter(r => !r.is_allowed).length,
        countries_prohibited: 0, // TODO: Implement proper calculation
        global_compliance_level: 'MEDIUM', // TODO: Calculate properly
        licensing_countries: regulations.filter(r => r.requires_license).map(r => r.country_id),
        insurance_countries: regulations.filter(r => r.mandatory_insurance).map(r => r.country_id),
        most_restrictive_countries: [], // TODO: Implement proper calculation
        common_requirements: {
          min_age_range: { min: 18, max: 25 }, // TODO: Calculate from data
          max_rental_days_range: { min: 7, max: 90 }, // TODO: Calculate from data
          common_documents: [], // TODO: Analyze documentation requirements
        },
      };

      return ResponseFormatter.success(
        overview,
        'Category regulation overview retrieved successfully'
      );
    } catch (error: any) {
      return CategoryRegulationErrorHandler.handleError(
        error,
        'get category regulation overview',
        { categoryId }
      );
    }
  }

  /**
   * Get distribution of regulations by country
   */
  private static async getCountryDistribution(): Promise<Record<string, number>> {
    // This would typically use a GROUP BY query
    // For now, implementing a simple approach
    const regulations = await CategoryRegulationRepository.findWithFilters({});
    const distribution: Record<string, number> = {};

    for (const regulation of regulations.rows) {
      const countryId = regulation.country_id;
      distribution[countryId] = (distribution[countryId] || 0) + 1;
    }

    return distribution;
  }

  /**
   * Get distribution of regulations by category
   */
  private static async getCategoryDistribution(): Promise<Record<string, number>> {
    const regulations = await CategoryRegulationRepository.findWithFilters({});
    const distribution: Record<string, number> = {};

    for (const regulation of regulations.rows) {
      const categoryId = regulation.category_id;
      distribution[categoryId] = (distribution[categoryId] || 0) + 1;
    }

    return distribution;
  }

  /**
   * Calculate average compliance score across all regulations
   */
  private static async calculateAverageComplianceScore(): Promise<number> {
    const regulations = await CategoryRegulationRepository.findWithFilters({});
    if (regulations.rows.length === 0) return 0;

    const totalScore = regulations.rows.reduce((sum, regulation) => {
      return sum + (regulation as any).getComplianceScore();
    }, 0);

    return Math.round((totalScore / regulations.rows.length) * 100) / 100;
  }

  /**
   * Get most regulated countries (countries with most regulations)
   */
  private static async getMostRegulatedCountries(): Promise<Array<{ country_id: string; count: number }>> {
    const distribution = await this.getCountryDistribution();
    return Object.entries(distribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([country_id, count]) => ({ country_id, count }));
  }

  /**
   * Get least regulated countries
   */
  private static async getLeastRegulatedCountries(): Promise<Array<{ country_id: string; count: number }>> {
    const distribution = await this.getCountryDistribution();
    return Object.entries(distribution)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 5)
      .map(([country_id, count]) => ({ country_id, count }));
  }

  /**
   * Get common requirements across regulations
   */
  private static async getCommonRequirements(): Promise<{
    license_percentage: number;
    insurance_percentage: number;
    background_check_percentage: number;
    age_restriction_percentage: number;
  }> {
    const regulations = await CategoryRegulationRepository.findWithFilters({});
    const total = regulations.rows.length;

    if (total === 0) {
      return {
        license_percentage: 0,
        insurance_percentage: 0,
        background_check_percentage: 0,
        age_restriction_percentage: 0,
      };
    }

    const licenseRequired = regulations.rows.filter(r => r.requires_license).length;
    const insuranceRequired = regulations.rows.filter(r => r.mandatory_insurance).length;
    const backgroundCheckRequired = regulations.rows.filter(r => r.requires_background_check).length;
    const ageRestrictions = regulations.rows.filter(r => r.min_age_requirement).length;

    return {
      license_percentage: Math.round((licenseRequired / total) * 100),
      insurance_percentage: Math.round((insuranceRequired / total) * 100),
      background_check_percentage: Math.round((backgroundCheckRequired / total) * 100),
      age_restriction_percentage: Math.round((ageRestrictions / total) * 100),
    };
  }

  /**
   * Get count of regulations with seasonal restrictions
   */
  private static async getSeasonalRestrictionsCount(): Promise<number> {
    const regulations = await CategoryRegulationRepository.findWithFilters({});
    return regulations.rows.filter(r => r.seasonal_restrictions).length;
  }

  /**
   * Analyze compliance levels distribution
   */
  private static analyzeComplianceLevels(regulations: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    for (const regulation of regulations) {
      const level = regulation.compliance_level;
      distribution[level] = (distribution[level] || 0) + 1;
    }
    return distribution;
  }

  /**
   * Analyze age requirements
   */
  private static analyzeAgeRequirements(regulations: any[]): {
    min_age: number | null;
    max_age: number | null;
    average_age: number | null;
    has_age_restrictions: number;
  } {
    const withAgeRestrictions = regulations.filter(r => r.min_age_requirement);
    
    if (withAgeRestrictions.length === 0) {
      return {
        min_age: null,
        max_age: null,
        average_age: null,
        has_age_restrictions: 0,
      };
    }

    const ages = withAgeRestrictions.map(r => r.min_age_requirement);
    return {
      min_age: Math.min(...ages),
      max_age: Math.max(...ages),
      average_age: Math.round(ages.reduce((a, b) => a + b, 0) / ages.length),
      has_age_restrictions: withAgeRestrictions.length,
    };
  }

  /**
   * Analyze documentation requirements
   */
  private static analyzeDocumentationRequirements(regulations: any[]): {
    most_common_documents: Array<{ type: string; count: number }>;
    average_documents_required: number;
  } {
    const documentCounts: Record<string, number> = {};
    let totalDocuments = 0;
    let regulationsWithDocs = 0;

    for (const regulation of regulations) {
      if (regulation.documentation_required && regulation.documentation_required.length > 0) {
        regulationsWithDocs++;
        totalDocuments += regulation.documentation_required.length;
        
        for (const doc of regulation.documentation_required) {
          documentCounts[doc] = (documentCounts[doc] || 0) + 1;
        }
      }
    }

    const mostCommon = Object.entries(documentCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    return {
      most_common_documents: mostCommon,
      average_documents_required: regulationsWithDocs > 0 ? 
        Math.round((totalDocuments / regulationsWithDocs) * 100) / 100 : 0,
    };
  }

  /**
   * Analyze seasonal restrictions
   */
  private static analyzeSeasonalRestrictions(regulations: any[]): {
    has_restrictions: number;
    by_season: Record<string, number>;
  } {
    const seasonCounts: Record<string, number> = {};
    let hasRestrictions = 0;

    for (const regulation of regulations) {
      if (regulation.seasonal_restrictions) {
        hasRestrictions++;
        const seasons = Object.keys(regulation.seasonal_restrictions);
        for (const season of seasons) {
          seasonCounts[season] = (seasonCounts[season] || 0) + 1;
        }
      }
    }

    return {
      has_restrictions: hasRestrictions,
      by_season: seasonCounts,
    };
  }

  /**
   * Calculate average maximum rental days
   */
  private static calculateAverageMaxRentalDays(regulations: any[]): number | null {
    const withMaxDays = regulations.filter(r => r.max_rental_days);
    
    if (withMaxDays.length === 0) return null;
    
    const total = withMaxDays.reduce((sum, r) => sum + r.max_rental_days, 0);
    return Math.round(total / withMaxDays.length);
  }

  /**
   * Analyze insurance coverage ranges
   */
  private static analyzeInsuranceCoverageRanges(regulations: any[]): {
    min_coverage: number | null;
    max_coverage: number | null;
    average_coverage: number | null;
  } {
    const withCoverage = regulations.filter(r => r.min_coverage_amount);
    
    if (withCoverage.length === 0) {
      return { min_coverage: null, max_coverage: null, average_coverage: null };
    }

    const amounts = withCoverage.map(r => r.min_coverage_amount);
    return {
      min_coverage: Math.min(...amounts),
      max_coverage: Math.max(...amounts),
      average_coverage: Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length),
    };
  }

  /**
   * Analyze rental duration statistics
   */
  private static analyzeRentalDurationStats(regulations: any[]): {
    min_duration: number | null;
    max_duration: number | null;
    average_duration: number | null;
  } {
    const withDuration = regulations.filter(r => r.max_rental_days);
    
    if (withDuration.length === 0) {
      return { min_duration: null, max_duration: null, average_duration: null };
    }

    const durations = withDuration.map(r => r.max_rental_days);
    return {
      min_duration: Math.min(...durations),
      max_duration: Math.max(...durations),
      average_duration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
    };
  }

  /**
   * Analyze insurance requirements
   */
  private static analyzeInsuranceRequirements(regulations: any[]): {
    mandatory_count: number;
    optional_count: number;
    average_min_coverage: number | null;
  } {
    const mandatory = regulations.filter(r => r.mandatory_insurance).length;
    const optional = regulations.length - mandatory;
    
    const withCoverage = regulations.filter(r => r.min_coverage_amount);
    const averageCoverage = withCoverage.length > 0 ?
      Math.round(withCoverage.reduce((sum, r) => sum + r.min_coverage_amount, 0) / withCoverage.length) :
      null;

    return {
      mandatory_count: mandatory,
      optional_count: optional,
      average_min_coverage: averageCoverage,
    };
  }

  /**
   * Find most restrictive countries for a category
   */
  private static findMostRestrictiveCountries(regulations: any[]): Array<{ country_id: string; restriction_score: number }> {
    return regulations
      .map(regulation => ({
        country_id: regulation.country_id,
        restriction_score: this.calculateRestrictionScore(regulation),
      }))
      .sort((a, b) => b.restriction_score - a.restriction_score)
      .slice(0, 3);
  }

  /**
   * Find least restrictive countries for a category
   */
  private static findLeastRestrictiveCountries(regulations: any[]): Array<{ country_id: string; restriction_score: number }> {
    return regulations
      .filter(r => r.is_allowed) // Only include allowed categories
      .map(regulation => ({
        country_id: regulation.country_id,
        restriction_score: this.calculateRestrictionScore(regulation),
      }))
      .sort((a, b) => a.restriction_score - b.restriction_score)
      .slice(0, 3);
  }

  /**
   * Calculate restriction score for a regulation
   */
  private static calculateRestrictionScore(regulation: any): number {
    let score = 0;
    
    if (!regulation.is_allowed) score += 100; // Not allowed is highest restriction
    if (regulation.requires_license) score += 20;
    if (regulation.mandatory_insurance) score += 15;
    if (regulation.requires_background_check) score += 15;
    if (regulation.min_age_requirement) score += 10;
    if (regulation.max_rental_days && regulation.max_rental_days < 30) score += 10;
    if (regulation.documentation_required?.length > 0) score += 5 * regulation.documentation_required.length;
    if (regulation.seasonal_restrictions) score += 5;
    
    return score;
  }
}

export default CategoryRegulationAnalytics;
