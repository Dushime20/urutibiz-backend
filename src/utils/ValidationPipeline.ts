/**
 * Validation Pipeline System
 * Eliminates scattered validation logic and provides reusable validation chains
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  code?: string;
  details?: Record<string, any>;
}

export interface Validator<T = any> {
  validate(data: T): Promise<ValidationResult> | ValidationResult;
}

/**
 * Validation chain for composable validation logic
 */
export class ValidationChain<T = any> {
  private validators: Validator<T>[] = [];
  private shortCircuit: boolean = true;

  /**
   * Add a validator to the chain
   */
  add(validator: Validator<T>): ValidationChain<T> {
    this.validators.push(validator);
    return this;
  }

  /**
   * Add a simple function validator
   */
  addFunction(
    validatorFn: (data: T) => Promise<ValidationResult> | ValidationResult
  ): ValidationChain<T> {
    this.validators.push({ validate: validatorFn });
    return this;
  }

  /**
   * Configure whether to stop on first failure
   */
  setShortCircuit(shortCircuit: boolean): ValidationChain<T> {
    this.shortCircuit = shortCircuit;
    return this;
  }

  /**
   * Execute all validators in the chain
   */
  async validate(data: T): Promise<ValidationResult> {
    const errors: string[] = [];
    const details: Record<string, any> = {};

    for (const validator of this.validators) {
      try {
        const result = await validator.validate(data);
        
        if (!result.isValid) {
          if (result.error) errors.push(result.error);
          if (result.details) Object.assign(details, result.details);
          
          if (this.shortCircuit) {
            return {
              isValid: false,
              error: result.error,
              code: result.code,
              details: result.details
            };
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Validation failed';
        errors.push(errorMessage);
        
        if (this.shortCircuit) {
          return {
            isValid: false,
            error: errorMessage,
            code: 'VALIDATION_ERROR'
          };
        }
      }
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        error: errors.join('; '),
        details: Object.keys(details).length > 0 ? details : undefined
      };
    }

    return { isValid: true };
  }
}

/**
 * Common validators for user operations
 */
export const userValidators = {
  /**
   * Check if user exists
   */
  checkUserExists: {
    async validate(data: { id: string }): Promise<ValidationResult> {
      const UserService = require('@/services/UserService').default;
      const user = await UserService.getById(data.id);
      
      return user.success
        ? { isValid: true }
        : { 
            isValid: false, 
            error: 'User not found',
            code: 'USER_NOT_FOUND'
          };
    }
  } as Validator<{ id: string }>,

  /**
   * Check user access permissions
   */
  checkUserAccess: {
    validate(data: { 
      requesterId: string; 
      targetId: string; 
      role?: string;
      requireAdmin?: boolean;
    }): ValidationResult {
      const isOwnProfile = data.requesterId === data.targetId;
      const isAdmin = data.role === 'admin';
      
      if (data.requireAdmin && !isAdmin) {
        return {
          isValid: false,
          error: 'Admin access required',
          code: 'ADMIN_REQUIRED'
        };
      }
      
      if (!isOwnProfile && !isAdmin) {
        return {
          isValid: false,
          error: 'Not authorized to access this resource',
          code: 'ACCESS_DENIED'
        };
      }
      
      return { isValid: true };
    }
  } as Validator<{ requesterId: string; targetId: string; role?: string; requireAdmin?: boolean }>,

  /**
   * Check KYC verification status
   */
  checkKycStatus: {
    async validate(data: { userId: string; required?: boolean }): Promise<ValidationResult> {
      if (!data.required) return { isValid: true };
      
      const UserVerificationService = require('@/services/userVerification.service').default;
      const isVerified = await UserVerificationService.isUserFullyKycVerified(data.userId);
      
      return isVerified
        ? { isValid: true }
        : {
            isValid: false,
            error: 'KYC verification required',
            code: 'KYC_REQUIRED'
          };
    }
  } as Validator<{ userId: string; required?: boolean }>
};

/**
 * Common validators for product operations
 */
export const productValidators = {
  /**
   * Check if product exists
   */
  checkProductExists: {
    async validate(data: { id: string }): Promise<ValidationResult> {
      const ProductService = require('@/services/ProductService').default;
      const product = await ProductService.getById(data.id);
      
      return product.success
        ? { isValid: true }
        : {
            isValid: false,
            error: 'Product not found',
            code: 'PRODUCT_NOT_FOUND'
          };
    }
  } as Validator<{ id: string }>,

  /**
   * Check product ownership
   */
  checkProductOwnership: {
    async validate(data: { 
      productId: string; 
      userId: string; 
      role?: string 
    }): Promise<ValidationResult> {
      const ProductService = require('@/services/ProductService').default;
      const product = await ProductService.getById(data.productId);
      
      if (!product.success) {
        return {
          isValid: false,
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        };
      }
      
      const isOwner = product.data.ownerId === data.userId;
      const isAdmin = data.role === 'admin';
      
      return (isOwner || isAdmin)
        ? { isValid: true }
        : {
            isValid: false,
            error: 'Not authorized to modify this product',
            code: 'PRODUCT_ACCESS_DENIED'
          };
    }
  } as Validator<{ productId: string; userId: string; role?: string }>
};

/**
 * Common validators for booking operations
 */
export const bookingValidators = {
  /**
   * Check if booking exists
   */
  checkBookingExists: {
    async validate(data: { id: string }): Promise<ValidationResult> {
      const BookingService = require('@/services/BookingService').default;
      const booking = await BookingService.getById(data.id);
      
      return booking.success
        ? { isValid: true }
        : {
            isValid: false,
            error: 'Booking not found',
            code: 'BOOKING_NOT_FOUND'
          };
    }
  } as Validator<{ id: string }>,

  /**
   * Check booking access (renter, owner, or admin)
   */
  checkBookingAccess: {
    async validate(data: {
      bookingId: string;
      userId: string;
      role?: string;
    }): Promise<ValidationResult> {
      const BookingService = require('@/services/BookingService').default;
      const booking = await BookingService.getById(data.bookingId);
      
      if (!booking.success) {
        return {
          isValid: false,
          error: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        };
      }
      
      const isRenter = booking.data.renterId === data.userId;
      const isOwner = booking.data.ownerId === data.userId;
      const isAdmin = data.role === 'admin';
      
      return (isRenter || isOwner || isAdmin)
        ? { isValid: true }
        : {
            isValid: false,
            error: 'Not authorized to access this booking',
            code: 'BOOKING_ACCESS_DENIED'
          };
    }
  } as Validator<{ bookingId: string; userId: string; role?: string }>,

  /**
   * Validate date range
   */
  validateDateRange: {
    validate(data: { startDate: string; endDate: string }): ValidationResult {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const now = new Date();
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return {
          isValid: false,
          error: 'Invalid date format',
          code: 'INVALID_DATE_FORMAT'
        };
      }
      
      if (start >= end) {
        return {
          isValid: false,
          error: 'Start date must be before end date',
          code: 'INVALID_DATE_RANGE'
        };
      }
      
      if (start < now) {
        return {
          isValid: false,
          error: 'Start date cannot be in the past',
          code: 'PAST_DATE_NOT_ALLOWED'
        };
      }
      
      return { isValid: true };
    }
  } as Validator<{ startDate: string; endDate: string }>
};

/**
 * Validation factory for creating common validation chains
 */
export class ValidationFactory {
  /**
   * Create user profile access validation chain
   */
  static createUserProfileValidation(): ValidationChain<{
    id: string;
    requesterId: string;
    role?: string;
  }> {
    return new ValidationChain<{
      id: string;
      requesterId: string;
      role?: string;
    }>()
      .add(userValidators.checkUserExists)
      .addFunction((data) => userValidators.checkUserAccess.validate({
        requesterId: data.requesterId,
        targetId: data.id,
        role: data.role
      }));
  }

  /**
   * Create product creation validation chain
   */
  static createProductCreationValidation(): ValidationChain<{
    userId: string;
    requireKyc?: boolean;
  }> {
    return new ValidationChain<{
      userId: string;
      requireKyc?: boolean;
    }>()
      .addFunction((data) => userValidators.checkUserExists.validate({ id: data.userId }))
      .addFunction((data) => userValidators.checkKycStatus.validate({
        userId: data.userId,
        required: data.requireKyc
      }));
  }

  /**
   * Create booking creation validation chain
   */
  static createBookingCreationValidation(): ValidationChain<{
    userId: string;
    productId: string;
    startDate: string;
    endDate: string;
    requireKyc?: boolean;
  }> {
    return new ValidationChain<{
      userId: string;
      productId: string;
      startDate: string;
      endDate: string;
      requireKyc?: boolean;
    }>()
      .addFunction((data) => userValidators.checkUserExists.validate({ id: data.userId }))
      .addFunction((data) => productValidators.checkProductExists.validate({ id: data.productId }))
      .add(bookingValidators.validateDateRange)
      .addFunction((data) => userValidators.checkKycStatus.validate({
        userId: data.userId,
        required: data.requireKyc
      }));
  }
}
