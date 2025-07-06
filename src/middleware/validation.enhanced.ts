/**
 * Enhanced Validation Middleware
 * Provides consistent validation patterns across all routes
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/ErrorHandler';
import { ValidationChain } from '../utils/ValidationPipeline';
import { AuthenticatedRequest } from '../types';

// Validation rule definitions
export const validationRules = {
  // User validation rules
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new ValidationError('Invalid email format');
    }
  },

  password: (value: string) => {
    if (value.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      throw new ValidationError('Password must contain uppercase, lowercase, and numeric characters');
    }
  },

  uuid: (value: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new ValidationError('Invalid UUID format');
    }
  },

  // Booking validation rules
  dateRange: (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ValidationError('Invalid date format');
    }

    if (start < now) {
      throw new ValidationError('Start date cannot be in the past');
    }

    if (end <= start) {
      throw new ValidationError('End date must be after start date');
    }

    // Maximum booking duration (1 year)
    const maxDuration = 365 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > maxDuration) {
      throw new ValidationError('Booking duration cannot exceed 1 year');
    }
  },

  currency: (value: string) => {
    const validCurrencies = ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES'];
    if (!validCurrencies.includes(value)) {
      throw new ValidationError(`Invalid currency. Must be one of: ${validCurrencies.join(', ')}`);
    }
  },

  // Product validation rules
  productPrice: (value: number) => {
    if (typeof value !== 'number' || value <= 0) {
      throw new ValidationError('Product price must be a positive number');
    }
    if (value > 1000000) {
      throw new ValidationError('Product price cannot exceed 1,000,000');
    }
  },

  coordinates: (lat: number, lng: number) => {
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      throw new ValidationError('Coordinates must be numbers');
    }
    if (lat < -90 || lat > 90) {
      throw new ValidationError('Latitude must be between -90 and 90');
    }
    if (lng < -180 || lng > 180) {
      throw new ValidationError('Longitude must be between -180 and 180');
    }
  }
};

/**
 * Validation middleware factory
 */
export const validateRequest = (schema: { [key: string]: (value: any, ...args: any[]) => void }) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const pipeline = new ValidationChain();
      
      // Add validation rules to pipeline
      for (const [field, validator] of Object.entries(schema)) {
        const fieldPath = field.split('.');
        let value = req.body;
        
        // Navigate through nested object path
        for (const path of fieldPath) {
          value = value?.[path];
        }

        // Apply validation if field exists or is required
        if (value !== undefined) {
          pipeline.addFunction(() => {
            try {
              validator(value);
              return { isValid: true };
            } catch (error) {
              return { 
                isValid: false, 
                error: error instanceof Error ? error.message : 'Validation failed' 
              };
            }
          });
        }
      }

      // Execute validation pipeline
      const result = await pipeline.validate({});
      
      if (!result.isValid) {
        throw new ValidationError(result.error || 'Validation failed');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Specific validation middleware for common scenarios
 */

// User registration validation
export const validateUserRegistration = validateRequest({
  'email': validationRules.email,
  'password': validationRules.password,
  'firstName': (value: string) => {
    if (!value || value.trim().length < 2) {
      throw new ValidationError('First name must be at least 2 characters');
    }
  },
  'lastName': (value: string) => {
    if (!value || value.trim().length < 2) {
      throw new ValidationError('Last name must be at least 2 characters');
    }
  }
});

// Booking creation validation
export const validateBookingCreation = validateRequest({
  'productId': validationRules.uuid,
  'startDate': (value: string, req: Request) => {
    const endDate = req.body.endDate;
    validationRules.dateRange(value, endDate);
  },
  'endDate': () => {}, // Validated in startDate check
});

// Product creation validation
export const validateProductCreation = validateRequest({
  'title': (value: string) => {
    if (!value || value.trim().length < 3) {
      throw new ValidationError('Product title must be at least 3 characters');
    }
    if (value.length > 100) {
      throw new ValidationError('Product title cannot exceed 100 characters');
    }
  },
  'description': (value: string) => {
    if (!value || value.trim().length < 10) {
      throw new ValidationError('Product description must be at least 10 characters');
    }
    if (value.length > 1000) {
      throw new ValidationError('Product description cannot exceed 1000 characters');
    }
  },
  'price': validationRules.productPrice,
  'currency': validationRules.currency
});

// Parameter validation
export const validateUUIDParam = (paramName: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const value = req.params[paramName];
      if (!value) {
        throw new ValidationError(`${paramName} parameter is required`);
      }
      validationRules.uuid(value);
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Query parameter validation
export const validatePaginationQuery = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query;

    if (page && (isNaN(Number(page)) || Number(page) < 1)) {
      throw new ValidationError('Page must be a positive integer');
    }

    if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
      throw new ValidationError('Limit must be between 1 and 100');
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Authorization validation
export const validateResourceAccess = (_resourceType: string) => {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const resourceId = req.params.id;

      if (!userId) {
        throw new ValidationError('User authentication required');
      }

      if (!resourceId) {
        throw new ValidationError('Resource ID required');
      }

      // Additional access validation logic would go here
      // This is a placeholder for resource-specific access checks

      next();
    } catch (error) {
      next(error);
    }
  };
};
