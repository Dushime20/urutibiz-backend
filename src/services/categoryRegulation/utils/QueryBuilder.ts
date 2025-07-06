import { Op, OrderItem } from 'sequelize';
import { CategoryRegulationFilters } from '../../../types/categoryRegulation.types';

/**
 * Utility for building consistent database queries
 */
export class QueryBuilder {
  /**
   * Build where conditions from filters
   */
  static buildWhereConditions(filters: Partial<CategoryRegulationFilters>): Record<string, any> {
    const where: Record<string, any> = {};
    
    if (filters.category_id) {
      where.category_id = filters.category_id;
    }
    
    if (filters.country_id) {
      where.country_id = filters.country_id;
    }
    
    if (filters.is_allowed !== undefined) {
      where.is_allowed = filters.is_allowed;
    }
    
    if (filters.requires_license !== undefined) {
      where.requires_license = filters.requires_license;
    }
    
    if (filters.license_type) {
      where.license_type = { [Op.iLike]: `%${filters.license_type}%` };
    }
    
    if (filters.min_age !== undefined || filters.max_age !== undefined) {
      const ageConditions: any = {};
      if (filters.min_age !== undefined) {
        ageConditions[Op.gte] = filters.min_age;
      }
      if (filters.max_age !== undefined) {
        ageConditions[Op.lte] = filters.max_age;
      }
      where.min_age_requirement = ageConditions;
    }
    
    if (filters.mandatory_insurance !== undefined) {
      where.mandatory_insurance = filters.mandatory_insurance;
    }
    
    if (filters.requires_background_check !== undefined) {
      where.requires_background_check = filters.requires_background_check;
    }
    
    if (filters.compliance_level) {
      where.compliance_level = filters.compliance_level;
    }
    
    if (filters.min_coverage_min !== undefined || filters.min_coverage_max !== undefined) {
      const coverageConditions: any = {};
      if (filters.min_coverage_min !== undefined) {
        coverageConditions[Op.gte] = filters.min_coverage_min;
      }
      if (filters.min_coverage_max !== undefined) {
        coverageConditions[Op.lte] = filters.min_coverage_max;
      }
      where.min_coverage_amount = coverageConditions;
    }
    
    if (filters.max_rental_days_min !== undefined || filters.max_rental_days_max !== undefined) {
      const rentalDaysConditions: any = {};
      if (filters.max_rental_days_min !== undefined) {
        rentalDaysConditions[Op.gte] = filters.max_rental_days_min;
      }
      if (filters.max_rental_days_max !== undefined) {
        rentalDaysConditions[Op.lte] = filters.max_rental_days_max;
      }
      where.max_rental_days = rentalDaysConditions;
    }
    
    if (filters.search) {
      (where as any)[Op.or] = [
        { license_type: { [Op.iLike]: `%${filters.search}%` } },
        { special_requirements: { [Op.iLike]: `%${filters.search}%` } },
        { prohibited_activities: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    return where;
  }

  /**
   * Build order conditions from sort parameters
   */
  static buildOrderConditions(
    sortBy: string = 'created_at',
    sortOrder: string = 'desc'
  ): OrderItem[] {
    return [[sortBy, sortOrder.toUpperCase()]];
  }

  /**
   * Add soft delete condition
   */
  static addSoftDeleteCondition(
    whereConditions: Record<string, any>,
    includeDeleted: boolean = false
  ): void {
    if (!includeDeleted) {
      whereConditions.deleted_at = { [Op.is]: null };
    }
  }

  /**
   * Build standard include associations
   */
  static buildStandardIncludes() {
    return [
      {
        association: 'category',
        attributes: ['id', 'name', 'description'],
      },
      {
        association: 'country',
        attributes: ['id', 'code', 'name'],
      },
    ];
  }

  /**
   * Calculate pagination offset
   */
  static calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Validate and sanitize pagination parameters
   */
  static sanitizePaginationParams(page?: number, limit?: number) {
    const sanitizedPage = Math.max(1, page || 1);
    const sanitizedLimit = Math.min(Math.max(1, limit || 20), 100);
    
    return {
      page: sanitizedPage,
      limit: sanitizedLimit,
      offset: this.calculateOffset(sanitizedPage, sanitizedLimit),
    };
  }
}

export default QueryBuilder;
