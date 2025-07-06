import logger from '../../../utils/logger';
import { ServiceResponse } from '../../../types/categoryRegulation.types';

/**
 * Centralized error handling utility for Category Regulation operations
 */
export class CategoryRegulationErrorHandler {
  /**
   * Handle and log errors consistently across the service
   */
  static handleError<T>(
    error: any,
    operation: string,
    context?: { id?: string; data?: any; [key: string]: any }
  ): ServiceResponse<T> {
    const errorMessage = error.message || `Failed to ${operation}`;
    const contextInfo = context?.id ? ` (ID: ${context.id})` : '';
    
    logger.error(`Error ${operation}${contextInfo}: ${errorMessage}`, {
      error: error.stack || error,
      context,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }

  /**
   * Handle validation errors specifically
   */
  static handleValidationError<T>(
    errors: Array<{ field: string; message: string }>,
    operation: string
  ): ServiceResponse<T> {
    logger.warn(`Validation failed for ${operation}`, { errors });

    return {
      success: false,
      errors,
      message: 'Validation failed',
    };
  }

  /**
   * Handle not found errors
   */
  static handleNotFoundError<T>(
    resourceType: string,
    identifier?: string
  ): ServiceResponse<T> {
    const message = identifier 
      ? `${resourceType} not found (ID: ${identifier})`
      : `${resourceType} not found`;

    logger.warn(message);

    return {
      success: false,
      error: message,
    };
  }

  /**
   * Handle conflict errors (e.g., duplicate records)
   */
  static handleConflictError<T>(
    message: string,
    context?: any
  ): ServiceResponse<T> {
    logger.warn(`Conflict error: ${message}`, { context });

    return {
      success: false,
      error: message,
    };
  }
}

export default CategoryRegulationErrorHandler;
