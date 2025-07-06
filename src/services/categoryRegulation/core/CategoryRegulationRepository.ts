import CategoryRegulation from '../../../models/CategoryRegulation.model';
import {
  CreateCategoryRegulationData,
  UpdateCategoryRegulationData,
  CategoryRegulationFilters,
} from '../../../types/categoryRegulation.types';
import QueryBuilder from '../utils/QueryBuilder';

/**
 * Repository layer for Category Regulation data access
 * Handles all database operations and query building
 */
export class CategoryRegulationRepository {
  /**
   * Create a new category regulation
   */
  static async create(data: CreateCategoryRegulationData): Promise<CategoryRegulation> {
    return await CategoryRegulation.create(data);
  }

  /**
   * Find category regulation by ID
   */
  static async findById(
    id: string,
    includeAssociations: boolean = true
  ): Promise<CategoryRegulation | null> {
    const options: any = {};
    
    if (includeAssociations) {
      options.include = QueryBuilder.buildStandardIncludes();
    }

    return await CategoryRegulation.findByPk(id, options);
  }

  /**
   * Find category regulation by ID including soft deleted records
   */
  static async findByIdWithDeleted(id: string): Promise<CategoryRegulation | null> {
    return await CategoryRegulation.findByPk(id, { 
      paranoid: false,
      include: QueryBuilder.buildStandardIncludes(),
    });
  }

  /**
   * Check if regulation exists for category-country combination
   */
  static async existsByCategoryAndCountry(
    categoryId: string,
    countryId: string
  ): Promise<CategoryRegulation | null> {
    return await CategoryRegulation.findOne({
      where: {
        category_id: categoryId,
        country_id: countryId,
      },
    });
  }

  /**
   * Find regulations with filtering and pagination
   */
  static async findWithFilters(
    filters: CategoryRegulationFilters
  ): Promise<{ rows: CategoryRegulation[]; count: number }> {
    const {
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc',
      include_deleted = false,
      ...searchFilters
    } = filters;

    // Build pagination parameters
    const { offset } = QueryBuilder.sanitizePaginationParams(page, limit);

    // Build where conditions
    const whereConditions = QueryBuilder.buildWhereConditions(searchFilters);
    QueryBuilder.addSoftDeleteCondition(whereConditions, include_deleted);

    // Build order conditions
    const orderConditions = QueryBuilder.buildOrderConditions(sort_by, sort_order);

    // Execute query
    return await CategoryRegulation.findAndCountAll({
      where: whereConditions,
      include: QueryBuilder.buildStandardIncludes(),
      order: orderConditions,
      limit,
      offset,
      distinct: true,
    });
  }

  /**
   * Update category regulation by ID
   */
  static async updateById(
    id: string,
    data: UpdateCategoryRegulationData
  ): Promise<CategoryRegulation | null> {
    const regulation = await CategoryRegulation.findByPk(id);
    if (!regulation) {
      return null;
    }

    await regulation.update(data);
    
    // Return updated regulation with associations
    return await this.findById(id, true);
  }

  /**
   * Soft delete category regulation
   */
  static async deleteById(id: string): Promise<CategoryRegulation | null> {
    const regulation = await CategoryRegulation.findByPk(id);
    if (!regulation) {
      return null;
    }

    await regulation.destroy();
    return regulation;
  }

  /**
   * Permanently delete category regulation
   */
  static async permanentlyDeleteById(id: string): Promise<CategoryRegulation | null> {
    const regulation = await CategoryRegulation.findByPk(id, { paranoid: false });
    if (!regulation) {
      return null;
    }

    await regulation.destroy({ force: true });
    return regulation;
  }

  /**
   * Bulk update regulations
   */
  static async bulkUpdate(
    filters: Record<string, any>,
    data: UpdateCategoryRegulationData
  ): Promise<number> {
    const [affectedCount] = await CategoryRegulation.update(data, {
      where: filters,
    });
    return affectedCount;
  }

  /**
   * Bulk delete regulations
   */
  static async bulkDelete(filters: Record<string, any>): Promise<number> {
    return await CategoryRegulation.destroy({
      where: filters,
    });
  }

  /**
   * Get regulations by country ID
   */
  static async findByCountryId(countryId: string): Promise<CategoryRegulation[]> {
    return await CategoryRegulation.findAll({
      where: { country_id: countryId },
      include: QueryBuilder.buildStandardIncludes(),
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Get regulations by category ID
   */
  static async findByCategoryId(categoryId: string): Promise<CategoryRegulation[]> {
    return await CategoryRegulation.findAll({
      where: { category_id: categoryId },
      include: QueryBuilder.buildStandardIncludes(),
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Count total regulations
   */
  static async countTotal(): Promise<number> {
    return await CategoryRegulation.count();
  }

  /**
   * Count regulations by status
   */
  static async countByStatus(): Promise<{
    allowed: number;
    not_allowed: number;
    requires_license: number;
    mandatory_insurance: number;
  }> {
    const [allowed, not_allowed, requires_license, mandatory_insurance] = await Promise.all([
      CategoryRegulation.count({ where: { is_allowed: true } }),
      CategoryRegulation.count({ where: { is_allowed: false } }),
      CategoryRegulation.count({ where: { requires_license: true } }),
      CategoryRegulation.count({ where: { mandatory_insurance: true } }),
    ]);

    return {
      allowed,
      not_allowed,
      requires_license,
      mandatory_insurance,
    };
  }

  /**
   * Get compliance level distribution
   */
  static async getComplianceLevelDistribution(): Promise<Record<string, number>> {
    const results = await CategoryRegulation.findAll({
      attributes: [
        'compliance_level',
        [CategoryRegulation.sequelize!.fn('COUNT', '*'), 'count'],
      ],
      group: ['compliance_level'],
      raw: true,
    });

    const distribution: Record<string, number> = {};
    for (const result of results as any[]) {
      distribution[result.compliance_level] = parseInt(result.count, 10);
    }

    return distribution;
  }
}

export default CategoryRegulationRepository;
