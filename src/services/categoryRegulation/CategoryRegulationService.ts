/**
 * Category Regulation Service - Main orchestrator
 * 
 * This service combines all modular features into a unified interface
 * that maintains compatibility with the existing controller.
 */
import { 
  ServiceResponse, 
  PaginatedResponse,
  CreateCategoryRegulationData,
  UpdateCategoryRegulationData,
  CategoryRegulationData,
  CategoryRegulationFilters,
  BulkCategoryRegulationOperation,
  ComplianceCheckRequest,
  ComplianceCheckResult,
  CategoryRegulationStats,
  CountryRegulationOverview,
  CategoryRegulationOverview
} from '../../types/categoryRegulation.types';

// Import feature modules
import CategoryRegulationCRUD from './features/CategoryRegulationCRUD';
import CategoryRegulationCompliance from './features/CategoryRegulationCompliance';
import CategoryRegulationAnalytics from './features/CategoryRegulationAnalytics';
import CategoryRegulationBulk from './features/CategoryRegulationBulk';

/**
 * Main Category Regulation Service
 * 
 * Acts as a facade for all category regulation operations,
 * delegating to appropriate specialized modules.
 */
export class CategoryRegulationService {
  
  // =====================================================
  // CRUD OPERATIONS
  // =====================================================
  
  /**
   * Create a new category regulation
   */
  static async createCategoryRegulation(
    data: CreateCategoryRegulationData
  ): Promise<ServiceResponse<CategoryRegulationData>> {
    return CategoryRegulationCRUD.create(data);
  }

  /**
   * Get category regulation by ID
   */
  static async getCategoryRegulationById(
    id: string
  ): Promise<ServiceResponse<CategoryRegulationData>> {
    return CategoryRegulationCRUD.getById(id);
  }

  /**
   * Get category regulations with filtering and pagination
   */
  static async getCategoryRegulations(
    filters?: CategoryRegulationFilters
  ): Promise<ServiceResponse<PaginatedResponse<CategoryRegulationData>>> {
    return CategoryRegulationCRUD.getList(filters);
  }

  /**
   * Update category regulation
   */
  static async updateCategoryRegulation(
    id: string,
    data: UpdateCategoryRegulationData
  ): Promise<ServiceResponse<CategoryRegulationData>> {
    return CategoryRegulationCRUD.update(id, data);
  }

  /**
   * Soft delete category regulation
   */
  static async deleteCategoryRegulation(
    id: string
  ): Promise<ServiceResponse<void>> {
    return CategoryRegulationCRUD.delete(id);
  }

  /**
   * Permanently delete category regulation
   */
  static async permanentlyDeleteCategoryRegulation(
    id: string
  ): Promise<ServiceResponse<void>> {
    return CategoryRegulationCRUD.permanentlyDelete(id);
  }

  // =====================================================
  // BULK OPERATIONS
  // =====================================================
  
  /**
   * Execute bulk operations on category regulations
   */
  static async bulkOperations(
    operations: BulkCategoryRegulationOperation
  ): Promise<ServiceResponse<{
    created: number;
    updated: number;
    deleted: number;
    errors: Array<{ index: number; error: string }>;
  }>> {
    return CategoryRegulationBulk.bulkOperations(operations);
  }

  // =====================================================
  // COMPLIANCE OPERATIONS
  // =====================================================
  
  /**
   * Check compliance for a specific request
   */
  static async checkCompliance(
    request: ComplianceCheckRequest
  ): Promise<ServiceResponse<ComplianceCheckResult>> {
    return CategoryRegulationCompliance.checkCompliance(request);
  }

  // =====================================================
  // ANALYTICS OPERATIONS
  // =====================================================
  
  /**
   * Get category regulation statistics
   */
  static async getStats(): Promise<ServiceResponse<CategoryRegulationStats>> {
    return CategoryRegulationAnalytics.getStats();
  }

  /**
   * Get regulation overview for a specific country
   */
  static async getCountryRegulationOverview(
    countryId: string
  ): Promise<ServiceResponse<CountryRegulationOverview>> {
    return CategoryRegulationAnalytics.getCountryRegulationOverview(countryId);
  }

  /**
   * Get regulation overview for a specific category
   */
  static async getCategoryRegulationOverview(
    categoryId: string
  ): Promise<ServiceResponse<CategoryRegulationOverview>> {
    return CategoryRegulationAnalytics.getCategoryRegulationOverview(categoryId);
  }
}

export default CategoryRegulationService;
