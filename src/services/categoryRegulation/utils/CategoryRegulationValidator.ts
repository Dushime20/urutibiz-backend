import {
  CreateCategoryRegulationData,
  UpdateCategoryRegulationData,
  ValidationError,
} from '../../../types/categoryRegulation.types';

/**
 * Centralized validation utility for Category Regulation data
 */
export class CategoryRegulationValidator {
  /**
   * Validate data for creating a new category regulation
   */
  static validateCreateData(data: CreateCategoryRegulationData): {
    isValid: boolean;
    errors: ValidationError[];
  } {
    const errors: ValidationError[] = [];

    // Required fields validation
    if (!data.category_id) {
      errors.push({ field: 'category_id', message: 'Category ID is required' });
    }

    if (!data.country_id) {
      errors.push({ field: 'country_id', message: 'Country ID is required' });
    }

    // Add common validation rules
    this.validateCommonFields(data, errors);

    // Business rule validations
    this.validateBusinessRules(data, errors);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate data for updating a category regulation
   */
  static validateUpdateData(data: UpdateCategoryRegulationData): {
    isValid: boolean;
    errors: ValidationError[];
  } {
    const errors: ValidationError[] = [];

    // Add common validation rules (no required fields for update)
    this.validateCommonFields(data, errors);

    // Business rule validations
    this.validateBusinessRules(data, errors);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate common fields across create and update operations
   */
  private static validateCommonFields(
    data: CreateCategoryRegulationData | UpdateCategoryRegulationData,
    errors: ValidationError[]
  ): void {
    // Age requirement validation
    if (data.min_age_requirement !== undefined) {
      if (data.min_age_requirement < 0 || data.min_age_requirement > 100) {
        errors.push({
          field: 'min_age_requirement',
          message: 'Minimum age requirement must be between 0 and 100',
        });
      }
    }

    // Rental days validation
    if (data.max_rental_days !== undefined) {
      if (data.max_rental_days < 1 || data.max_rental_days > 365) {
        errors.push({
          field: 'max_rental_days',
          message: 'Maximum rental days must be between 1 and 365',
        });
      }
    }

    // Coverage amount validation
    if (data.min_coverage_amount !== undefined) {
      if (data.min_coverage_amount < 0) {
        errors.push({
          field: 'min_coverage_amount',
          message: 'Minimum coverage amount must be 0 or greater',
        });
      }
    }

    // Liability amount validation
    if (data.max_liability_amount !== undefined) {
      if (data.max_liability_amount < 0) {
        errors.push({
          field: 'max_liability_amount',
          message: 'Maximum liability amount must be 0 or greater',
        });
      }
    }
  }

  /**
   * Validate business rules and cross-field dependencies
   */
  private static validateBusinessRules(
    data: CreateCategoryRegulationData | UpdateCategoryRegulationData,
    errors: ValidationError[]
  ): void {
    // License type required when license is required
    if (data.requires_license && !data.license_type) {
      errors.push({
        field: 'license_type',
        message: 'License type is required when license is required',
      });
    }

    // Coverage amount required when insurance is mandatory
    if (data.mandatory_insurance && (!data.min_coverage_amount || data.min_coverage_amount <= 0)) {
      errors.push({
        field: 'min_coverage_amount',
        message: 'Minimum coverage amount is required when insurance is mandatory',
      });
    }

    // Validate seasonal restrictions structure
    if (data.seasonal_restrictions) {
      this.validateSeasonalRestrictions(data.seasonal_restrictions, errors);
    }

    // Validate documentation types
    if (data.documentation_required) {
      this.validateDocumentationTypes(data.documentation_required, errors);
    }
  }

  /**
   * Validate seasonal restrictions object
   */
  private static validateSeasonalRestrictions(
    restrictions: any,
    errors: ValidationError[]
  ): void {
    if (typeof restrictions !== 'object' || restrictions === null) {
      errors.push({
        field: 'seasonal_restrictions',
        message: 'Seasonal restrictions must be a valid object',
      });
      return;
    }

    const validSeasons = ['spring', 'summer', 'autumn', 'winter'];
    const seasons = Object.keys(restrictions);

    for (const season of seasons) {
      if (!validSeasons.includes(season)) {
        errors.push({
          field: 'seasonal_restrictions',
          message: `Invalid season: ${season}. Valid seasons are: ${validSeasons.join(', ')}`,
        });
      }
    }
  }

  /**
   * Validate documentation types array
   */
  private static validateDocumentationTypes(
    documentTypes: any[],
    errors: ValidationError[]
  ): void {
    if (!Array.isArray(documentTypes)) {
      errors.push({
        field: 'documentation_required',
        message: 'Documentation required must be an array',
      });
      return;
    }

    const validDocTypes = [
      'PASSPORT',
      'DRIVERS_LICENSE',
      'NATIONAL_ID',
      'INSURANCE_CERTIFICATE',
      'LICENSE_CERTIFICATE',
      'BACKGROUND_CHECK',
      'OTHER',
    ];

    for (const docType of documentTypes) {
      if (!validDocTypes.includes(docType)) {
        errors.push({
          field: 'documentation_required',
          message: `Invalid documentation type: ${docType}. Valid types are: ${validDocTypes.join(', ')}`,
        });
      }
    }
  }

  /**
   * Validate UUID format
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate that an ID parameter is a valid UUID
   */
  static validateId(id: string, fieldName: string = 'id'): ValidationError | null {
    if (!id) {
      return { field: fieldName, message: `${fieldName} is required` };
    }

    if (!this.isValidUUID(id)) {
      return { field: fieldName, message: `${fieldName} must be a valid UUID` };
    }

    return null;
  }
}

export default CategoryRegulationValidator;
