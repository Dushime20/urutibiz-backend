import { Op, OrderItem } from 'sequelize';
import CategoryRegulation from '../models/CategoryRegulation.model';
import {
  CategoryRegulationData,
  CreateCategoryRegulationData,
  UpdateCategoryRegulationData,
  CategoryRegulationFilters,
  BulkCategoryRegulationOperation,
  ComplianceCheckRequest,
  ComplianceCheckResult,
  CategoryRegulationStats,
  CountryRegulationOverview,
  CategoryRegulationOverview,
  ServiceResponse,
  PaginatedResponse,
  ValidationError,
  ComplianceLevel,
  DocumentationType,
} from '../types/categoryRegulation.types';
import logger from '../utils/logger';

export class CategoryRegulationService {
  
  // =====================================================
  // CRUD OPERATIONS
  // =====================================================
  
  /**
   * Create a new category regulation
   */
  static async createCategoryRegulation(data: CreateCategoryRegulationData): Promise<ServiceResponse<CategoryRegulationData>> {
    try {
      // Validate input data
      const validation = this.validateCreateData(data);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          message: 'Validation failed',
        };
      }
      
      // Check if regulation already exists for this category-country combination
      const existingRegulation = await CategoryRegulation.findOne({
        where: {
          category_id: data.category_id,
          country_id: data.country_id,
        },
      });
      
      if (existingRegulation) {
        return {
          success: false,
          error: 'Regulation already exists for this category-country combination',
        };
      }
      
      // Create the regulation
      const regulation = await CategoryRegulation.create(data);
      
      logger.info(`Category regulation created: ${regulation.id} for category ${data.category_id} in country ${data.country_id}`);
      
      return {
        success: true,
        data: regulation.toJSON(),
        message: 'Category regulation created successfully',
      };
    } catch (error: any) {
      logger.error(`Error creating category regulation: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Failed to create category regulation',
      };
    }
  }
  
  /**
   * Get category regulation by ID
   */
  static async getCategoryRegulationById(id: string): Promise<ServiceResponse<CategoryRegulationData>> {
    try {
      const regulation = await CategoryRegulation.findByPk(id, {
        include: [
          {
            association: 'category',
            attributes: ['id', 'name', 'description'],
          },
          {
            association: 'country',
            attributes: ['id', 'code', 'name'],
          },
        ],
      });
      
      if (!regulation) {
        return {
          success: false,
          error: 'Category regulation not found',
        };
      }
      
      return {
        success: true,
        data: regulation.toJSON(),
      };
    } catch (error: any) {
      logger.error(`Error getting category regulation by ID ${id}: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Failed to get category regulation',
      };
    }
  }
  
  /**
   * Get category regulations with filtering and pagination
   */
  static async getCategoryRegulations(filters: CategoryRegulationFilters = {}): Promise<ServiceResponse<PaginatedResponse<CategoryRegulationData>>> {
    try {
      const {
        page = 1,
        limit = 20,
        sort_by = 'created_at',
        sort_order = 'desc',
        include_deleted = false,
        ...searchFilters
      } = filters;
      
      // Build where conditions
      const whereConditions = this.buildWhereConditions(searchFilters);
      
      // Handle soft deletes
      if (!include_deleted) {
        whereConditions.deleted_at = { [Op.is]: null };
      }
      
      // Build order conditions
      const orderConditions: OrderItem[] = [[sort_by, sort_order.toUpperCase()]];
      
      // Include associations
      const include = [
        {
          association: 'category',
          attributes: ['id', 'name', 'description'],
        },
        {
          association: 'country',
          attributes: ['id', 'code', 'name'],
        },
      ];
      
      // Execute query with pagination
      const offset = (page - 1) * limit;
      const { count, rows } = await CategoryRegulation.findAndCountAll({
        where: whereConditions,
        include,
        limit,
        offset,
        order: orderConditions,
      });
      
      // Calculate pagination info
      const totalPages = Math.ceil(count / limit);
      
      return {
        success: true,
        data: {
          data: rows.map(row => row.toJSON()),
          pagination: {
            page,
            limit,
            total: count,
            pages: totalPages,
            has_next: page < totalPages,
            has_prev: page > 1,
          },
        },
      };
    } catch (error: any) {
      logger.error(`Error getting category regulations: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Failed to get category regulations',
      };
    }
  }
  
  /**
   * Update category regulation
   */
  static async updateCategoryRegulation(id: string, data: UpdateCategoryRegulationData): Promise<ServiceResponse<CategoryRegulationData>> {
    try {
      // Validate input data
      const validation = this.validateUpdateData(data);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          message: 'Validation failed',
        };
      }
      
      // Find the regulation
      const regulation = await CategoryRegulation.findByPk(id);
      if (!regulation) {
        return {
          success: false,
          error: 'Category regulation not found',
        };
      }
      
      // Update the regulation
      await regulation.update(data);
      
      // Fetch updated regulation with associations
      const updatedRegulation = await CategoryRegulation.findByPk(id, {
        include: [
          {
            association: 'category',
            attributes: ['id', 'name', 'description'],
          },
          {
            association: 'country',
            attributes: ['id', 'code', 'name'],
          },
        ],
      });
      
      logger.info(`Category regulation updated: ${id}`);
      
      return {
        success: true,
        data: updatedRegulation!.toJSON(),
        message: 'Category regulation updated successfully',
      };
    } catch (error: any) {
      logger.error(`Error updating category regulation ${id}: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Failed to update category regulation',
      };
    }
  }
  
  /**
   * Delete category regulation (soft delete)
   */
  static async deleteCategoryRegulation(id: string): Promise<ServiceResponse<void>> {
    try {
      const regulation = await CategoryRegulation.findByPk(id);
      if (!regulation) {
        return {
          success: false,
          error: 'Category regulation not found',
        };
      }
      
      await regulation.destroy();
      
      logger.info(`Category regulation deleted: ${id}`);
      
      return {
        success: true,
        message: 'Category regulation deleted successfully',
      };
    } catch (error: any) {
      logger.error(`Error deleting category regulation ${id}: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Failed to delete category regulation',
      };
    }
  }
  
  /**
   * Permanently delete category regulation
   */
  static async permanentlyDeleteCategoryRegulation(id: string): Promise<ServiceResponse<void>> {
    try {
      const regulation = await CategoryRegulation.findByPk(id, { paranoid: false });
      if (!regulation) {
        return {
          success: false,
          error: 'Category regulation not found',
        };
      }
      
      await regulation.destroy({ force: true });
      
      logger.info(`Category regulation permanently deleted: ${id}`);
      
      return {
        success: true,
        message: 'Category regulation permanently deleted successfully',
      };
    } catch (error: any) {
      logger.error(`Error permanently deleting category regulation ${id}: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Failed to permanently delete category regulation',
      };
    }
  }
  
  // =====================================================
  // BULK OPERATIONS
  // =====================================================
  
  /**
   * Bulk operations for category regulations
   */
  static async bulkOperations(operations: BulkCategoryRegulationOperation): Promise<ServiceResponse<{
    created: number;
    updated: number;
    deleted: number;
  }>> {
    try {
      let created = 0;
      let updated = 0;
      let deleted = 0;
      
      // Bulk create
      if (operations.regulations && operations.regulations.length > 0) {
        const validRegulations = [];
        for (const regulation of operations.regulations) {
          const validation = this.validateCreateData(regulation);
          if (validation.isValid) {
            validRegulations.push(regulation);
          }
        }
        
        if (validRegulations.length > 0) {
          await CategoryRegulation.bulkCreate(validRegulations);
          created = validRegulations.length;
        }
      }
      
      // Bulk update
      if (operations.updates) {
        const whereConditions = this.buildWhereConditions(operations.updates.filters);
        const [affectedCount] = await CategoryRegulation.update(
          operations.updates.data,
          { where: whereConditions }
        );
        updated = affectedCount;
      }
      
      // Bulk delete
      if (operations.deletes) {
        if (operations.deletes.ids && operations.deletes.ids.length > 0) {
          const deleteCount = await CategoryRegulation.destroy({
            where: { id: { [Op.in]: operations.deletes.ids } },
          });
          deleted += deleteCount;
        }
        
        if (operations.deletes.filters) {
          const whereConditions = this.buildWhereConditions(operations.deletes.filters);
          const deleteCount = await CategoryRegulation.destroy({
            where: whereConditions,
          });
          deleted += deleteCount;
        }
      }
      
      logger.info(`Bulk operations completed: ${created} created, ${updated} updated, ${deleted} deleted`);
      
      return {
        success: true,
        data: { created, updated, deleted },
        message: 'Bulk operations completed successfully',
      };
    } catch (error: any) {
      logger.error(`Error in bulk operations: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Failed to perform bulk operations',
      };
    }
  }
  
  // =====================================================
  // COMPLIANCE OPERATIONS
  // =====================================================
  
  /**
   * Check compliance for a specific category-country combination
   */
  static async checkCompliance(request: ComplianceCheckRequest): Promise<ServiceResponse<ComplianceCheckResult>> {
    try {
      // Find the regulation
      const regulation = await CategoryRegulation.findOne({
        where: {
          category_id: request.category_id,
          country_id: request.country_id,
        },
      });
      
      if (!regulation) {
        return {
          success: true,
          data: {
            is_compliant: true, // No regulation means allowed by default
            category_id: request.category_id,
            country_id: request.country_id,
            regulation_exists: false,
            checks: {
              is_allowed: { passed: true, message: 'No regulation found, allowed by default' },
              age_requirement: { passed: true },
              license_requirement: { passed: true },
              rental_duration: { passed: true },
              insurance_requirement: { passed: true },
              background_check: { passed: true },
              documentation: { passed: true },
              seasonal_restrictions: { passed: true },
            },
            violations: [],
            warnings: [],
            recommendations: [],
          },
        };
      }
      
      const result: ComplianceCheckResult = {
        is_compliant: true,
        category_id: request.category_id,
        country_id: request.country_id,
        regulation_exists: true,
        checks: {
          is_allowed: { passed: true },
          age_requirement: { passed: true },
          license_requirement: { passed: true },
          rental_duration: { passed: true },
          insurance_requirement: { passed: true },
          background_check: { passed: true },
          documentation: { passed: true },
          seasonal_restrictions: { passed: true },
        },
        violations: [],
        warnings: [],
        recommendations: [],
      };
      
      // Check if category is allowed
      if (!regulation.is_allowed) {
        result.is_compliant = false;
        result.checks.is_allowed = {
          passed: false,
          message: 'This category is not allowed in this country',
        };
        result.violations.push('Category is prohibited in this country');
      }
      
      // Check age requirement
      if (regulation.min_age_requirement && request.user_age !== undefined) {
        const agePassed = request.user_age >= regulation.min_age_requirement;
        result.checks.age_requirement = {
          passed: agePassed,
          required: regulation.min_age_requirement,
          provided: request.user_age,
          message: agePassed ? undefined : `Minimum age required: ${regulation.min_age_requirement}`,
        };
        if (!agePassed) {
          result.is_compliant = false;
          result.violations.push(`User must be at least ${regulation.min_age_requirement} years old`);
        }
      }
      
      // Check license requirement
      if (regulation.requires_license) {
        const licensePassed = request.has_license === true;
        result.checks.license_requirement = {
          passed: licensePassed,
          required: regulation.license_type,
          provided: request.has_license,
          message: licensePassed ? undefined : `License required: ${regulation.license_type}`,
        };
        if (!licensePassed) {
          result.is_compliant = false;
          result.violations.push(`License required: ${regulation.license_type}`);
        }
      }
      
      // Check rental duration
      if (regulation.max_rental_days && request.rental_duration_days !== undefined) {
        const durationPassed = request.rental_duration_days <= regulation.max_rental_days;
        result.checks.rental_duration = {
          passed: durationPassed,
          max_allowed: regulation.max_rental_days,
          requested: request.rental_duration_days,
          message: durationPassed ? undefined : `Maximum rental period: ${regulation.max_rental_days} days`,
        };
        if (!durationPassed) {
          result.is_compliant = false;
          result.violations.push(`Rental period exceeds maximum of ${regulation.max_rental_days} days`);
        }
      }
      
      // Check insurance requirement
      if (regulation.mandatory_insurance) {
        const insurancePassed = request.has_insurance === true;
        const coverageSufficient = !regulation.min_coverage_amount || 
          (request.coverage_amount && request.coverage_amount >= regulation.min_coverage_amount);
        
        result.checks.insurance_requirement = {
          passed: !!(insurancePassed && coverageSufficient),
          required: regulation.mandatory_insurance,
          coverage_sufficient: !!coverageSufficient,
          message: !insurancePassed ? 'Insurance is mandatory' : 
                   !coverageSufficient ? `Minimum coverage: ${regulation.min_coverage_amount}` : undefined,
        };
        
        if (!insurancePassed) {
          result.is_compliant = false;
          result.violations.push('Insurance coverage is mandatory');
        } else if (!coverageSufficient) {
          result.is_compliant = false;
          result.violations.push(`Insufficient insurance coverage. Minimum required: ${regulation.min_coverage_amount}`);
        }
      }
      
      // Check background check requirement
      if (regulation.requires_background_check) {
        const backgroundPassed = request.background_check_status === 'approved';
        result.checks.background_check = {
          passed: backgroundPassed,
          required: regulation.requires_background_check,
          status: request.background_check_status,
          message: backgroundPassed ? undefined : 'Background check approval required',
        };
        if (!backgroundPassed) {
          result.is_compliant = false;
          result.violations.push('Background check approval required');
        }
      }
      
      // Check documentation requirements
      const requiredDocs = regulation.getRequiredDocuments();
      const providedDocs = request.documentation_provided || [];
      const missingDocs = requiredDocs.filter(doc => !providedDocs.includes(doc));
      
      result.checks.documentation = {
        passed: missingDocs.length === 0,
        required: requiredDocs,
        provided: providedDocs,
        missing: missingDocs,
        message: missingDocs.length > 0 ? `Missing documents: ${missingDocs.join(', ')}` : undefined,
      };
      
      if (missingDocs.length > 0) {
        result.is_compliant = false;
        result.violations.push(`Missing required documents: ${missingDocs.join(', ')}`);
      }
      
      // Check seasonal restrictions
      if (regulation.hasSeasonalRestrictions() && request.season) {
        const seasonalRestriction = regulation.getSeasonalRestriction(request.season);
        if (seasonalRestriction) {
          result.checks.seasonal_restrictions = {
            passed: true, // Assuming restriction is informational unless specific checks fail
            restrictions: seasonalRestriction,
            message: `Seasonal restrictions apply for ${request.season}`,
          };
          result.warnings.push(`Special restrictions apply during ${request.season}`);
        }
      }
      
      // Add recommendations
      if (regulation.compliance_level === 'HIGH' || regulation.compliance_level === 'CRITICAL') {
        result.recommendations.push('This category has high compliance requirements. Ensure all documentation is complete.');
      }
      
      if (regulation.special_requirements) {
        result.recommendations.push(`Special requirements: ${regulation.special_requirements}`);
      }
      
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      logger.error(`Error checking compliance: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Failed to check compliance',
      };
    }
  }
  
  // =====================================================
  // STATISTICS AND ANALYTICS
  // =====================================================
  
  /**
   * Get category regulation statistics
   */
  static async getStats(): Promise<ServiceResponse<CategoryRegulationStats>> {
    try {
      const [
        totalRegulations,
        countryStats,
        categoryStats,
        complianceStats,
        licensingStats,
        insuranceStats,
        backgroundCheckStats,
        restrictiveCountries,
        regulatedCategories,
      ] = await Promise.all([
        // Total regulations
        CategoryRegulation.count(),
        
        // By country
        CategoryRegulation.findAll({
          attributes: [
            'country_id',
            [CategoryRegulation.sequelize!.fn('COUNT', '*'), 'count'],
          ],
          group: ['country_id'],
          include: [{
            association: 'country',
            attributes: ['code'],
          }],
        }),
        
        // By category
        CategoryRegulation.findAll({
          attributes: [
            'category_id',
            [CategoryRegulation.sequelize!.fn('COUNT', '*'), 'count'],
          ],
          group: ['category_id'],
          include: [{
            association: 'category',
            attributes: ['name'],
          }],
        }),
        
        // By compliance level
        CategoryRegulation.findAll({
          attributes: [
            'compliance_level',
            [CategoryRegulation.sequelize!.fn('COUNT', '*'), 'count'],
          ],
          group: ['compliance_level'],
        }),
        
        // Licensing required
        CategoryRegulation.count({ where: { requires_license: true } }),
        
        // Insurance required
        CategoryRegulation.count({ where: { mandatory_insurance: true } }),
        
        // Background check required
        CategoryRegulation.count({ where: { requires_background_check: true } }),
        
        // Most restrictive countries
        CategoryRegulation.findAll({
          attributes: [
            'country_id',
            [CategoryRegulation.sequelize!.fn('COUNT', '*'), 'restriction_count'],
            [CategoryRegulation.sequelize!.fn('AVG', 
              CategoryRegulation.sequelize!.literal(`CASE 
                WHEN compliance_level = 'LOW' THEN 1
                WHEN compliance_level = 'MEDIUM' THEN 2  
                WHEN compliance_level = 'HIGH' THEN 3
                WHEN compliance_level = 'CRITICAL' THEN 4
              END`)
            ), 'avg_compliance'],
          ],
          group: ['country_id'],
          include: [{
            association: 'country',
            attributes: ['code'],
          }],
          order: [[CategoryRegulation.sequelize!.literal('restriction_count'), 'DESC']],
          limit: 10,
        }),
        
        // Most regulated categories
        CategoryRegulation.findAll({
          attributes: [
            'category_id',
            [CategoryRegulation.sequelize!.fn('COUNT', '*'), 'regulation_count'],
            [CategoryRegulation.sequelize!.fn('AVG', 
              CategoryRegulation.sequelize!.literal(`CASE 
                WHEN compliance_level = 'LOW' THEN 1
                WHEN compliance_level = 'MEDIUM' THEN 2  
                WHEN compliance_level = 'HIGH' THEN 3
                WHEN compliance_level = 'CRITICAL' THEN 4
              END`)
            ), 'avg_compliance'],
          ],
          group: ['category_id'],
          include: [{
            association: 'category',
            attributes: ['name'],
          }],
          order: [[CategoryRegulation.sequelize!.literal('regulation_count'), 'DESC']],
          limit: 10,
        }),
      ]);
      
        // Calculate average age requirement
        const ageStats = await CategoryRegulation.findAll({
          attributes: [
            [CategoryRegulation.sequelize!.fn('AVG', CategoryRegulation.sequelize!.col('min_age_requirement')), 'avg_age'],
          ],
          where: {
            min_age_requirement: { [Op.not]: null },
          },
        } as any);
        
        // Calculate average max rental days
        const rentalStats = await CategoryRegulation.findAll({
          attributes: [
            [CategoryRegulation.sequelize!.fn('AVG', CategoryRegulation.sequelize!.col('max_rental_days')), 'avg_days'],
          ],
          where: {
            max_rental_days: { [Op.not]: null },
          },
        } as any);
      
      // Process results
      const byCountry: Record<string, number> = {};
      countryStats.forEach((stat: any) => {
        byCountry[stat.country.code] = parseInt(stat.getDataValue('count'));
      });
      
      const byCategory: Record<string, number> = {};
      categoryStats.forEach((stat: any) => {
        byCategory[stat.category.name] = parseInt(stat.getDataValue('count'));
      });
      
      const byComplianceLevel: Record<ComplianceLevel, number> = {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        CRITICAL: 0,
      };
      complianceStats.forEach((stat: any) => {
        byComplianceLevel[stat.compliance_level as ComplianceLevel] = parseInt(stat.getDataValue('count'));
      });
      
      const stats: CategoryRegulationStats = {
        total_regulations: totalRegulations,
        by_country: byCountry,
        by_category: byCategory,
        by_compliance_level: byComplianceLevel,
        licensing_required: licensingStats,
        insurance_required: insuranceStats,
        background_check_required: backgroundCheckStats,
        average_age_requirement: ageStats[0] ? parseFloat((ageStats[0] as any).getDataValue('avg_age')) || 0 : 0,
        average_max_rental_days: rentalStats[0] ? parseFloat((rentalStats[0] as any).getDataValue('avg_days')) || 0 : 0,
        most_restrictive_countries: restrictiveCountries.map((country: any) => ({
          country_id: country.country_id,
          country_code: country.country.code,
          restriction_count: parseInt(country.getDataValue('restriction_count')),
          average_compliance_level: parseFloat(country.getDataValue('avg_compliance')),
        })),
        most_regulated_categories: regulatedCategories.map((category: any) => ({
          category_id: category.category_id,
          category_name: category.category.name,
          regulation_count: parseInt(category.getDataValue('regulation_count')),
          average_compliance_level: parseFloat(category.getDataValue('avg_compliance')),
        })),
      };
      
      return {
        success: true,
        data: stats,
      };
    } catch (error: any) {
      logger.error(`Error getting category regulation statistics: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Failed to get statistics',
      };
    }
  }
  
  /**
   * Get country regulation overview
   */
  static async getCountryRegulationOverview(countryId: string): Promise<ServiceResponse<CountryRegulationOverview>> {
    try {
      const regulations = await CategoryRegulation.findAll({
        where: { country_id: countryId },
        include: [
          {
            association: 'category',
            attributes: ['id', 'name'],
          },
          {
            association: 'country',
            attributes: ['id', 'code', 'name'],
          },
        ],
      });
      
      if (regulations.length === 0) {
        return {
          success: false,
          error: 'No regulations found for this country',
        };
      }
      
      const country = (regulations[0] as any).country;
      const totalRegulations = regulations.length;
      const allowedCategories = regulations.filter(r => r.is_allowed).length;
      const restrictedCategories = regulations.filter(r => r.is_allowed && (r.requires_license || r.mandatory_insurance || r.requires_background_check)).length;
      const prohibitedCategories = regulations.filter(r => !r.is_allowed).length;
      const licensingRequirements = regulations.filter(r => r.requires_license).length;
      const insuranceRequirements = regulations.filter(r => r.mandatory_insurance).length;
      
      const complianceBreakdown: Record<ComplianceLevel, number> = {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        CRITICAL: 0,
      };
      
      regulations.forEach(r => {
        complianceBreakdown[r.compliance_level]++;
      });
      
      const mostRestrictiveCategories = regulations
        .filter(r => r.compliance_level === 'HIGH' || r.compliance_level === 'CRITICAL')
        .sort((a, b) => {
          const scoreA = a.getComplianceScore();
          const scoreB = b.getComplianceScore();
          return scoreB - scoreA;
        })
        .slice(0, 5)
        .map(r => ({
          category_id: r.category_id,
          category_name: (r as any).category?.name || 'Unknown',
          compliance_level: r.compliance_level,
          requires_license: r.requires_license,
          mandatory_insurance: r.mandatory_insurance,
        }));
      
      const allDocumentationRequired = new Set<DocumentationType>();
      regulations.forEach(r => {
        if (r.documentation_required) {
          r.documentation_required.forEach(doc => allDocumentationRequired.add(doc));
        }
      });
      
      const overview: CountryRegulationOverview = {
        country_id: countryId,
        country_code: country.code,
        country_name: country.name,
        total_regulations: totalRegulations,
        allowed_categories: allowedCategories,
        restricted_categories: restrictedCategories,
        prohibited_categories: prohibitedCategories,
        licensing_requirements: licensingRequirements,
        insurance_requirements: insuranceRequirements,
        compliance_breakdown: complianceBreakdown,
        most_restrictive_categories: mostRestrictiveCategories,
        documentation_requirements: Array.from(allDocumentationRequired),
      };
      
      return {
        success: true,
        data: overview,
      };
    } catch (error: any) {
      logger.error(`Error getting country regulation overview for ${countryId}: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Failed to get country regulation overview',
      };
    }
  }
  
  /**
   * Get category regulation overview
   */
  static async getCategoryRegulationOverview(categoryId: string): Promise<ServiceResponse<CategoryRegulationOverview>> {
    try {
      const regulations = await CategoryRegulation.findAll({
        where: { category_id: categoryId },
        include: [
          {
            association: 'category',
            attributes: ['id', 'name'],
          },
          {
            association: 'country',
            attributes: ['id', 'code', 'name'],
          },
        ],
      });
      
      if (regulations.length === 0) {
        return {
          success: false,
          error: 'No regulations found for this category',
        };
      }
      
      const category = (regulations[0] as any).category;
      const totalRegulations = regulations.length;
      const countriesAllowed = regulations.filter(r => r.is_allowed).length;
      const countriesRestricted = regulations.filter(r => r.is_allowed && (r.requires_license || r.mandatory_insurance || r.requires_background_check)).length;
      const countriesProhibited = regulations.filter(r => !r.is_allowed).length;
      
      // Calculate global compliance level
      const avgCompliance = regulations.reduce((sum, r) => {
        const scores = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
        return sum + scores[r.compliance_level];
      }, 0) / regulations.length;
      
      let globalComplianceLevel: ComplianceLevel = 'LOW';
      if (avgCompliance >= 3.5) globalComplianceLevel = 'CRITICAL';
      else if (avgCompliance >= 2.5) globalComplianceLevel = 'HIGH';
      else if (avgCompliance >= 1.5) globalComplianceLevel = 'MEDIUM';
      
      const licensingCountries = regulations.filter(r => r.requires_license).map(r => (r as any).country?.code || 'Unknown');
      const insuranceCountries = regulations.filter(r => r.mandatory_insurance).map(r => (r as any).country?.code || 'Unknown');
      
      const mostRestrictiveCountries = regulations
        .filter(r => r.compliance_level === 'HIGH' || r.compliance_level === 'CRITICAL')
        .sort((a, b) => b.getComplianceScore() - a.getComplianceScore())
        .slice(0, 5)
        .map(r => ({
          country_id: r.country_id,
          country_code: (r as any).country?.code || 'Unknown',
          compliance_level: r.compliance_level,
          restrictions: [
            r.requires_license ? 'License required' : null,
            r.mandatory_insurance ? 'Insurance required' : null,
            r.requires_background_check ? 'Background check required' : null,
            r.min_age_requirement ? `Min age: ${r.min_age_requirement}` : null,
            r.max_rental_days ? `Max rental: ${r.max_rental_days} days` : null,
          ].filter(Boolean) as string[],
        }));
      
      // Common requirements analysis
      const ageRequirements = regulations.filter(r => r.min_age_requirement).map(r => r.min_age_requirement!);
      const rentalDaysLimits = regulations.filter(r => r.max_rental_days).map(r => r.max_rental_days!);
      
      const allDocuments = new Set<DocumentationType>();
      regulations.forEach(r => {
        if (r.documentation_required) {
          r.documentation_required.forEach(doc => allDocuments.add(doc));
        }
      });
      
      const overview: CategoryRegulationOverview = {
        category_id: categoryId,
        category_name: category?.name || 'Unknown',
        total_regulations: totalRegulations,
        countries_allowed: countriesAllowed,
        countries_restricted: countriesRestricted,
        countries_prohibited: countriesProhibited,
        global_compliance_level: globalComplianceLevel,
        licensing_countries: licensingCountries,
        insurance_countries: insuranceCountries,
        most_restrictive_countries: mostRestrictiveCountries,
        common_requirements: {
          min_age_range: {
            min: ageRequirements.length > 0 ? Math.min(...ageRequirements) : 0,
            max: ageRequirements.length > 0 ? Math.max(...ageRequirements) : 0,
          },
          max_rental_days_range: {
            min: rentalDaysLimits.length > 0 ? Math.min(...rentalDaysLimits) : 0,
            max: rentalDaysLimits.length > 0 ? Math.max(...rentalDaysLimits) : 0,
          },
          common_documents: Array.from(allDocuments),
        },
      };
      
      return {
        success: true,
        data: overview,
      };
    } catch (error: any) {
      logger.error(`Error getting category regulation overview for ${categoryId}: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Failed to get category regulation overview',
      };
    }
  }
  
  // =====================================================
  // HELPER METHODS
  // =====================================================
  
  /**
   * Build WHERE conditions from filters
   */
  private static buildWhereConditions(filters: Partial<CategoryRegulationFilters>): Record<string, any> {
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
    
    if (filters.max_rental_days_min !== undefined || filters.max_rental_days_max !== undefined) {
      const rentalConditions: any = {};
      if (filters.max_rental_days_min !== undefined) {
        rentalConditions[Op.gte] = filters.max_rental_days_min;
      }
      if (filters.max_rental_days_max !== undefined) {
        rentalConditions[Op.lte] = filters.max_rental_days_max;
      }
      where.max_rental_days = rentalConditions;
    }
    
    if (filters.mandatory_insurance !== undefined) {
      where.mandatory_insurance = filters.mandatory_insurance;
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
    
    if (filters.requires_background_check !== undefined) {
      where.requires_background_check = filters.requires_background_check;
    }
    
    if (filters.compliance_level) {
      if (Array.isArray(filters.compliance_level)) {
        where.compliance_level = { [Op.in]: filters.compliance_level };
      } else {
        where.compliance_level = filters.compliance_level;
      }
    }
    
    if (filters.has_seasonal_restrictions !== undefined) {
      if (filters.has_seasonal_restrictions) {
        where.seasonal_restrictions = { [Op.ne]: null };
      } else {
        where.seasonal_restrictions = null;
      }
    }
    
    if (filters.documentation_type) {
      where.documentation_required = {
        [Op.contains]: [filters.documentation_type],
      };
    }
    
    if (filters.search) {
      (where as any)[Op.or] = [
        { special_requirements: { [Op.iLike]: `%${filters.search}%` } },
        { prohibited_activities: { [Op.iLike]: `%${filters.search}%` } },
        { license_type: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }
    
    return where;
  }
  
  /**
   * Validate create data
   */
  private static validateCreateData(data: CreateCategoryRegulationData): { isValid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];
    
    if (!data.category_id) {
      errors.push({ field: 'category_id', message: 'Category ID is required' });
    }
    
    if (!data.country_id) {
      errors.push({ field: 'country_id', message: 'Country ID is required' });
    }
    
    if (data.min_age_requirement !== undefined && (data.min_age_requirement < 0 || data.min_age_requirement > 100)) {
      errors.push({ field: 'min_age_requirement', message: 'Minimum age requirement must be between 0 and 100' });
    }
    
    if (data.max_rental_days !== undefined && (data.max_rental_days < 1 || data.max_rental_days > 365)) {
      errors.push({ field: 'max_rental_days', message: 'Maximum rental days must be between 1 and 365' });
    }
    
    if (data.min_coverage_amount !== undefined && data.min_coverage_amount < 0) {
      errors.push({ field: 'min_coverage_amount', message: 'Minimum coverage amount must be 0 or greater' });
    }
    
    if (data.max_liability_amount !== undefined && data.max_liability_amount < 0) {
      errors.push({ field: 'max_liability_amount', message: 'Maximum liability amount must be 0 or greater' });
    }
    
    if (data.requires_license && !data.license_type) {
      errors.push({ field: 'license_type', message: 'License type is required when license is required' });
    }
    
    if (data.mandatory_insurance && (!data.min_coverage_amount || data.min_coverage_amount <= 0)) {
      errors.push({ field: 'min_coverage_amount', message: 'Minimum coverage amount is required when insurance is mandatory' });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * Validate update data
   */
  private static validateUpdateData(data: UpdateCategoryRegulationData): { isValid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];
    
    if (data.min_age_requirement !== undefined && (data.min_age_requirement < 0 || data.min_age_requirement > 100)) {
      errors.push({ field: 'min_age_requirement', message: 'Minimum age requirement must be between 0 and 100' });
    }
    
    if (data.max_rental_days !== undefined && (data.max_rental_days < 1 || data.max_rental_days > 365)) {
      errors.push({ field: 'max_rental_days', message: 'Maximum rental days must be between 1 and 365' });
    }
    
    if (data.min_coverage_amount !== undefined && data.min_coverage_amount < 0) {
      errors.push({ field: 'min_coverage_amount', message: 'Minimum coverage amount must be 0 or greater' });
    }
    
    if (data.max_liability_amount !== undefined && data.max_liability_amount < 0) {
      errors.push({ field: 'max_liability_amount', message: 'Maximum liability amount must be 0 or greater' });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default CategoryRegulationService;
