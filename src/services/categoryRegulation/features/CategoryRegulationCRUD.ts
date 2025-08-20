import {
  CategoryRegulationData,
  CreateCategoryRegulationData,
  UpdateCategoryRegulationData,
  CategoryRegulationFilters,
  ServiceResponse,
  PaginatedResponse,
} from '../../../types/categoryRegulation.types';
import CategoryRegulationRepository from '../core/CategoryRegulationRepository';
import CategoryRegulationValidator from '../utils/CategoryRegulationValidator';
import CategoryRegulationErrorHandler from '../utils/ErrorHandler';
import ResponseFormatter from '../utils/ResponseFormatter';

/**
 * Handles basic CRUD operations for Category Regulations
 * Separated from complex business logic for better maintainability
 */
export class CategoryRegulationCRUD {
  /**
   * Create a new category regulation
   */
  static async create(data: CreateCategoryRegulationData): Promise<ServiceResponse<CategoryRegulationData>> {
    try {
      // Normalize arrays possibly sent as JSON strings
      if (typeof (data as any).requirements === 'string') {
        const raw = (data as any).requirements as unknown as string;
        try {
          (data as any).requirements = JSON.parse(raw);
        } catch {
          (data as any).requirements = [raw];
        }
      }
      if (typeof (data as any).penalties === 'string') {
        const raw = (data as any).penalties as unknown as string;
        try {
          (data as any).penalties = JSON.parse(raw);
        } catch {
          (data as any).penalties = [raw];
        }
      }

      // Validate input data
      const validation = CategoryRegulationValidator.validateCreateData(data);
      if (!validation.isValid) {
        return CategoryRegulationErrorHandler.handleValidationError(
          validation.errors,
          'create category regulation'
        );
      }

      // Check for existing regulation
      const existingRegulation = await CategoryRegulationRepository.existsByCategoryAndCountry(
        data.category_id,
        data.country_id
      );

      if (existingRegulation) {
        return CategoryRegulationErrorHandler.handleConflictError(
          'Regulation already exists for this category-country combination',
          { categoryId: data.category_id, countryId: data.country_id }
        );
      }

      // Create the regulation
      const regulation = await CategoryRegulationRepository.create(data);

      return ResponseFormatter.success(
        regulation.toJSON(),
        'Category regulation created successfully',
        `create category regulation: ${regulation.id}`
      );
    } catch (error: any) {
      return CategoryRegulationErrorHandler.handleError(
        error,
        'create category regulation',
        { data }
      );
    }
  }

  /**
   * Get category regulation by ID
   */
  static async getById(id: string): Promise<ServiceResponse<CategoryRegulationData>> {
    try {
      // Validate ID format
      const idValidation = CategoryRegulationValidator.validateId(id);
      if (idValidation) {
        return CategoryRegulationErrorHandler.handleValidationError(
          [idValidation],
          'get category regulation'
        );
      }

      // Find the regulation
      const regulation = await CategoryRegulationRepository.findById(id, true);

      if (!regulation) {
        return CategoryRegulationErrorHandler.handleNotFoundError(
          'Category regulation',
          id
        );
      }

      return ResponseFormatter.success(
        regulation.toJSON(),
        'Category regulation retrieved successfully'
      );
    } catch (error: any) {
      return CategoryRegulationErrorHandler.handleError(
        error,
        'get category regulation',
        { id }
      );
    }
  }

  /**
   * Get category regulations with filtering and pagination
   */
  static async getList(
    filters: CategoryRegulationFilters = {}
  ): Promise<ServiceResponse<PaginatedResponse<CategoryRegulationData>>> {
    try {
      // Get regulations with filtering
      const { rows: regulations, count: totalCount } = 
        await CategoryRegulationRepository.findWithFilters(filters);

      // Convert to JSON
      const regulationData = regulations.map(regulation => regulation.toJSON());

      // Format paginated response
      return ResponseFormatter.paginatedSuccess(
        regulationData,
        totalCount,
        filters.page || 1,
        filters.limit || 20,
        'Category regulations retrieved successfully'
      );
    } catch (error: any) {
      return CategoryRegulationErrorHandler.handleError(
        error,
        'get category regulations',
        { filters }
      );
    }
  }

  /**
   * Update category regulation
   */
  static async update(
    id: string,
    data: UpdateCategoryRegulationData
  ): Promise<ServiceResponse<CategoryRegulationData>> {
    try {
      // Normalize arrays possibly sent as JSON strings
      if (typeof (data as any).requirements === 'string') {
        const raw = (data as any).requirements as unknown as string;
        try {
          (data as any).requirements = JSON.parse(raw);
        } catch {
          (data as any).requirements = [raw];
        }
      }
      if (typeof (data as any).penalties === 'string') {
        const raw = (data as any).penalties as unknown as string;
        try {
          (data as any).penalties = JSON.parse(raw);
        } catch {
          (data as any).penalties = [raw];
        }
      }

      // Validate ID format
      const idValidation = CategoryRegulationValidator.validateId(id);
      if (idValidation) {
        return CategoryRegulationErrorHandler.handleValidationError(
          [idValidation],
          'update category regulation'
        );
      }

      // Validate update data
      const validation = CategoryRegulationValidator.validateUpdateData(data);
      if (!validation.isValid) {
        return CategoryRegulationErrorHandler.handleValidationError(
          validation.errors,
          'update category regulation'
        );
      }

      // Update the regulation
      const updatedRegulation = await CategoryRegulationRepository.updateById(id, data);

      if (!updatedRegulation) {
        return CategoryRegulationErrorHandler.handleNotFoundError(
          'Category regulation',
          id
        );
      }

      return ResponseFormatter.success(
        updatedRegulation.toJSON(),
        'Category regulation updated successfully',
        `update category regulation: ${id}`
      );
    } catch (error: any) {
      return CategoryRegulationErrorHandler.handleError(
        error,
        'update category regulation',
        { id, data }
      );
    }
  }

  /**
   * Soft delete category regulation
   */
  static async delete(id: string): Promise<ServiceResponse<void>> {
    try {
      // Validate ID format
      const idValidation = CategoryRegulationValidator.validateId(id);
      if (idValidation) {
        return CategoryRegulationErrorHandler.handleValidationError(
          [idValidation],
          'delete category regulation'
        );
      }

      // Delete the regulation
      const deletedRegulation = await CategoryRegulationRepository.deleteById(id);

      if (!deletedRegulation) {
        return CategoryRegulationErrorHandler.handleNotFoundError(
          'Category regulation',
          id
        );
      }

      return ResponseFormatter.successNoData(
        'Category regulation deleted successfully',
        `delete category regulation: ${id}`
      );
    } catch (error: any) {
      return CategoryRegulationErrorHandler.handleError(
        error,
        'delete category regulation',
        { id }
      );
    }
  }

  /**
   * Permanently delete category regulation
   */
  static async permanentlyDelete(id: string): Promise<ServiceResponse<void>> {
    try {
      // Validate ID format
      const idValidation = CategoryRegulationValidator.validateId(id);
      if (idValidation) {
        return CategoryRegulationErrorHandler.handleValidationError(
          [idValidation],
          'permanently delete category regulation'
        );
      }

      // Permanently delete the regulation
      const deletedRegulation = await CategoryRegulationRepository.permanentlyDeleteById(id);

      if (!deletedRegulation) {
        return CategoryRegulationErrorHandler.handleNotFoundError(
          'Category regulation',
          id
        );
      }

      return ResponseFormatter.successNoData(
        'Category regulation permanently deleted successfully',
        `permanently delete category regulation: ${id}`
      );
    } catch (error: any) {
      return CategoryRegulationErrorHandler.handleError(
        error,
        'permanently delete category regulation',
        { id }
      );
    }
  }

  /**
   * Get regulations by country
   */
  static async getByCountryId(countryId: string): Promise<ServiceResponse<CategoryRegulationData[]>> {
    try {
      // Validate ID format
      const idValidation = CategoryRegulationValidator.validateId(countryId, 'country_id');
      if (idValidation) {
        return CategoryRegulationErrorHandler.handleValidationError(
          [idValidation],
          'get regulations by country'
        );
      }

      // Get regulations
      const regulations = await CategoryRegulationRepository.findByCountryId(countryId);
      const regulationData = regulations.map(regulation => regulation.toJSON());

      return ResponseFormatter.success(
        regulationData,
        'Country regulations retrieved successfully'
      );
    } catch (error: any) {
      return CategoryRegulationErrorHandler.handleError(
        error,
        'get regulations by country',
        { countryId }
      );
    }
  }

  /**
   * Get regulations by category
   */
  static async getByCategoryId(categoryId: string): Promise<ServiceResponse<CategoryRegulationData[]>> {
    try {
      // Validate ID format
      const idValidation = CategoryRegulationValidator.validateId(categoryId, 'category_id');
      if (idValidation) {
        return CategoryRegulationErrorHandler.handleValidationError(
          [idValidation],
          'get regulations by category'
        );
      }

      // Get regulations
      const regulations = await CategoryRegulationRepository.findByCategoryId(categoryId);
      const regulationData = regulations.map(regulation => regulation.toJSON());

      return ResponseFormatter.success(
        regulationData,
        'Category regulations retrieved successfully'
      );
    } catch (error: any) {
      return CategoryRegulationErrorHandler.handleError(
        error,
        'get regulations by category',
        { categoryId }
      );
    }
  }
}

export default CategoryRegulationCRUD;
