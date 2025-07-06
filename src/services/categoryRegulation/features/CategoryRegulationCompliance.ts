import {
  ComplianceCheckRequest,
  ComplianceCheckResult,
  ServiceResponse,
} from '../../../types/categoryRegulation.types';
import CategoryRegulationRepository from '../core/CategoryRegulationRepository';
import CategoryRegulationValidator from '../utils/CategoryRegulationValidator';
import CategoryRegulationErrorHandler from '../utils/ErrorHandler';
import ResponseFormatter from '../utils/ResponseFormatter';

/**
 * Handles compliance checking for Category Regulations
 * Separated from CRUD operations for better maintainability
 */
export class CategoryRegulationCompliance {
  /**
   * Check compliance for a specific request against category regulations
   */
  static async checkCompliance(request: ComplianceCheckRequest): Promise<ServiceResponse<ComplianceCheckResult>> {
    try {
      // Validate request data
      const validation = this.validateComplianceRequest(request);
      if (!validation.isValid) {
        return CategoryRegulationErrorHandler.handleValidationError(
          validation.errors,
          'check compliance'
        );
      }

      // Find the regulation for this category-country combination
      const regulation = await CategoryRegulationRepository.existsByCategoryAndCountry(
        request.category_id,
        request.country_id
      );

      if (!regulation) {
        return CategoryRegulationErrorHandler.handleNotFoundError(
          'Category regulation for the specified category and country'
        );
      }

      // Initialize compliance result
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

      // Perform compliance checks
      this.checkBasicAllowance(regulation, result);
      this.checkAgeRequirements(regulation, request, result);
      this.checkLicenseRequirements(regulation, request, result);
      this.checkInsuranceRequirements(regulation, request, result);
      this.checkBackgroundCheckRequirements(regulation, request, result);
      this.checkDocumentationRequirements(regulation, request, result);
      this.checkSeasonalRestrictions(regulation, request, result);
      this.addRecommendations(regulation, result);

      return ResponseFormatter.success(
        result,
        'Compliance check completed successfully'
      );
    } catch (error: any) {
      return CategoryRegulationErrorHandler.handleError(
        error,
        'check compliance',
        { request }
      );
    }
  }

  /**
   * Check if the category is allowed in the country
   */
  private static checkBasicAllowance(regulation: any, result: ComplianceCheckResult): void {
    result.checks.is_allowed = {
      passed: regulation.is_allowed,
      message: regulation.is_allowed ? undefined : 'Category is not allowed in this country',
    };

    if (!regulation.is_allowed) {
      result.is_compliant = false;
      result.violations.push('Category is not allowed in this country');
    }
  }

  /**
   * Check age requirements
   */
  private static checkAgeRequirements(
    regulation: any,
    request: ComplianceCheckRequest,
    result: ComplianceCheckResult
  ): void {
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
  }

  /**
   * Check license requirements
   */
  private static checkLicenseRequirements(
    regulation: any,
    request: ComplianceCheckRequest,
    result: ComplianceCheckResult
  ): void {
    if (regulation.requires_license) {
      const hasLicense = request.has_license === true;
      const correctType = !regulation.license_type || 
        (request.license_type && request.license_type === regulation.license_type);

      result.checks.license_requirement = {
        passed: !!(hasLicense && correctType),
        required: regulation.license_type,
        provided: request.has_license,
        message: !hasLicense ? 'Valid license is required' : 
                 !correctType ? `License type must be: ${regulation.license_type}` : undefined,
      };

      if (!hasLicense) {
        result.is_compliant = false;
        result.violations.push('Valid license is required');
      } else if (!correctType) {
        result.is_compliant = false;
        result.violations.push(`License type must be: ${regulation.license_type}`);
      }
    }
  }

  /**
   * Check insurance requirements
   */
  private static checkInsuranceRequirements(
    regulation: any,
    request: ComplianceCheckRequest,
    result: ComplianceCheckResult
  ): void {
    if (regulation.mandatory_insurance) {
      const hasInsurance = request.has_insurance === true;
      const sufficientCoverage = !regulation.min_coverage_amount || 
        (request.coverage_amount && request.coverage_amount >= regulation.min_coverage_amount);

      result.checks.insurance_requirement = {
        passed: !!(hasInsurance && sufficientCoverage),
        required: regulation.mandatory_insurance,
        coverage_sufficient: !!sufficientCoverage,
        message: !hasInsurance ? 'Insurance is mandatory' : 
                 !sufficientCoverage ? `Minimum coverage: ${regulation.min_coverage_amount}` : undefined,
      };

      if (!hasInsurance) {
        result.is_compliant = false;
        result.violations.push('Insurance coverage is mandatory');
      } else if (!sufficientCoverage) {
        result.is_compliant = false;
        result.violations.push(`Insufficient insurance coverage. Minimum required: ${regulation.min_coverage_amount}`);
      }
    }
  }

  /**
   * Check background check requirements
   */
  private static checkBackgroundCheckRequirements(
    regulation: any,
    request: ComplianceCheckRequest,
    result: ComplianceCheckResult
  ): void {
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
  }

  /**
   * Check documentation requirements
   */
  private static checkDocumentationRequirements(
    regulation: any,
    request: ComplianceCheckRequest,
    result: ComplianceCheckResult
  ): void {
    const requiredDocs = regulation.documentation_required || [];
    const providedDocs = request.documentation_provided || [];
    const missingDocs = requiredDocs.filter((doc: any) => !providedDocs.includes(doc));

    if (requiredDocs.length > 0) {
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
    }
  }

  /**
   * Check seasonal restrictions
   */
  private static checkSeasonalRestrictions(
    regulation: any,
    request: ComplianceCheckRequest,
    result: ComplianceCheckResult
  ): void {
    if (regulation.seasonal_restrictions && request.season) {
      const seasonalRestriction = regulation.seasonal_restrictions[request.season];
      
      if (seasonalRestriction) {
        result.checks.seasonal_restrictions = {
          passed: true, // Informational unless specific restrictions fail
          restrictions: seasonalRestriction,
          message: `Seasonal restrictions apply for ${request.season}`,
        };
        
        result.warnings.push(`Special restrictions apply during ${request.season}: ${JSON.stringify(seasonalRestriction)}`);
      }
    }
  }

  /**
   * Add recommendations based on compliance level and requirements
   */
  private static addRecommendations(regulation: any, result: ComplianceCheckResult): void {
    // High compliance level recommendations
    if (regulation.compliance_level === 'HIGH' || regulation.compliance_level === 'CRITICAL') {
      result.recommendations.push('This category has high compliance requirements. Ensure all documentation is complete.');
    }

    // Special requirements
    if (regulation.special_requirements) {
      result.recommendations.push(`Special requirements: ${regulation.special_requirements}`);
    }

    // Prohibited activities
    if (regulation.prohibited_activities) {
      result.recommendations.push(`Prohibited activities: ${regulation.prohibited_activities}`);
    }

    // Rental duration recommendations
    if (regulation.max_rental_days) {
      result.recommendations.push(`Maximum rental period is ${regulation.max_rental_days} days`);
    }
  }

  /**
   * Validate compliance check request
   */
  private static validateComplianceRequest(request: ComplianceCheckRequest): {
    isValid: boolean;
    errors: Array<{ field: string; message: string }>;
  } {
    const errors: Array<{ field: string; message: string }> = [];

    // Validate required fields
    if (!request.category_id) {
      errors.push({ field: 'category_id', message: 'Category ID is required' });
    } else if (!CategoryRegulationValidator.isValidUUID(request.category_id)) {
      errors.push({ field: 'category_id', message: 'Category ID must be a valid UUID' });
    }

    if (!request.country_id) {
      errors.push({ field: 'country_id', message: 'Country ID is required' });
    } else if (!CategoryRegulationValidator.isValidUUID(request.country_id)) {
      errors.push({ field: 'country_id', message: 'Country ID must be a valid UUID' });
    }

    // Validate optional fields
    if (request.user_age !== undefined && (request.user_age < 0 || request.user_age > 120)) {
      errors.push({ field: 'user_age', message: 'User age must be between 0 and 120' });
    }

    if (request.coverage_amount !== undefined && request.coverage_amount < 0) {
      errors.push({ field: 'coverage_amount', message: 'Coverage amount must be 0 or greater' });
    }

    if (request.background_check_status && 
        !['pending', 'approved', 'rejected'].includes(request.background_check_status)) {
      errors.push({ 
        field: 'background_check_status', 
        message: 'Background check status must be pending, approved, or rejected' 
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default CategoryRegulationCompliance;
