/**
 * Centralized Error Handling System
 * Provides consistent error handling patterns across all controllers
 */

import { Response } from 'express';
import { ResponseHelper } from '@/utils/response';
import logger from '@/utils/logger';

export interface ErrorContext {
  res: Response;
  operation: string;
  userId?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorHandler {
  canHandle(error: Error): boolean;
  handle(error: Error, context: ErrorContext): Response;
}

/**
 * Validation error handler
 */
export class ValidationErrorHandler implements ErrorHandler {
  canHandle(error: Error): boolean {
    return error.name === 'ValidationError' || 
           error.message.includes('validation') ||
           error.message.includes('required') ||
           error.message.includes('invalid');
  }

  handle(error: Error, context: ErrorContext): Response {
    logger.warn(`Validation error in ${context.operation}:`, {
      error: error.message,
      userId: context.userId,
      resourceId: context.resourceId,
      metadata: context.metadata
    });

    return ResponseHelper.error(context.res, error.message, 400);
  }
}

/**
 * Not found error handler
 */
export class NotFoundErrorHandler implements ErrorHandler {
  canHandle(error: Error): boolean {
    return error.name === 'NotFoundError' ||
           error.message.includes('not found') ||
           error.message.includes('does not exist');
  }

  handle(error: Error, context: ErrorContext): Response {
    logger.info(`Resource not found in ${context.operation}:`, {
      error: error.message,
      userId: context.userId,
      resourceId: context.resourceId
    });

    return ResponseHelper.error(context.res, error.message, 404);
  }
}

/**
 * Authorization error handler
 */
export class AuthorizationErrorHandler implements ErrorHandler {
  canHandle(error: Error): boolean {
    return error.name === 'UnauthorizedError' ||
           error.name === 'AuthorizationError' ||
           error.message.includes('not authorized') ||
           error.message.includes('access denied') ||
           error.message.includes('permission');
  }

  handle(error: Error, context: ErrorContext): Response {
    logger.warn(`Authorization error in ${context.operation}:`, {
      error: error.message,
      userId: context.userId,
      resourceId: context.resourceId
    });

    return ResponseHelper.error(context.res, error.message, 403);
  }
}

/**
 * Authentication error handler
 */
export class AuthenticationErrorHandler implements ErrorHandler {
  canHandle(error: Error): boolean {
    return error.name === 'AuthenticationError' ||
           error.message.includes('authentication') ||
           error.message.includes('token') ||
           error.message.includes('unauthenticated');
  }

  handle(error: Error, context: ErrorContext): Response {
    logger.warn(`Authentication error in ${context.operation}:`, {
      error: error.message,
      metadata: context.metadata
    });

    return ResponseHelper.error(context.res, 'Authentication required', 401);
  }
}

/**
 * Conflict error handler (e.g., duplicate bookings)
 */
export class ConflictErrorHandler implements ErrorHandler {
  canHandle(error: Error): boolean {
    return error.name === 'ConflictError' ||
           error.message.includes('conflict') ||
           error.message.includes('already exists') ||
           error.message.includes('duplicate');
  }

  handle(error: Error, context: ErrorContext): Response {
    logger.warn(`Conflict error in ${context.operation}:`, {
      error: error.message,
      userId: context.userId,
      resourceId: context.resourceId
    });

    return ResponseHelper.error(context.res, error.message, 409);
  }
}

/**
 * Database error handler
 */
export class DatabaseErrorHandler implements ErrorHandler {
  canHandle(error: Error): boolean {
    return error.name === 'DatabaseError' ||
           error.name === 'SequelizeError' ||
           error.name === 'KnexError' ||
           error.message.includes('database') ||
           error.message.includes('connection');
  }

  handle(error: Error, context: ErrorContext): Response {
    logger.error(`Database error in ${context.operation}:`, {
      error: error.message,
      stack: error.stack,
      userId: context.userId,
      resourceId: context.resourceId
    });

    // Don't expose internal database errors to clients
    return ResponseHelper.error(
      context.res,
      'A database error occurred. Please try again.',
      500
    );
  }
}

/**
 * Default error handler for unhandled errors
 */
export class DefaultErrorHandler implements ErrorHandler {
  canHandle(_error: Error): boolean {
    return true; // Handles all errors as fallback
  }

  handle(error: Error, context: ErrorContext): Response {
    logger.error(`Unhandled error in ${context.operation}:`, {
      error: error.message,
      stack: error.stack,
      userId: context.userId,
      resourceId: context.resourceId,
      metadata: context.metadata
    });

    // Generic error message for security
    return ResponseHelper.error(
      context.res,
      'An unexpected error occurred. Please try again.',
      500
    );
  }
}

/**
 * Error handler chain that processes errors through registered handlers
 */
export class ErrorHandlerChain {
  private handlers: ErrorHandler[] = [];

  constructor() {
    this.registerDefaultHandlers();
  }

  /**
   * Register a custom error handler
   */
  register(handler: ErrorHandler): ErrorHandlerChain {
    this.handlers.unshift(handler); // Add to beginning for priority
    return this;
  }

  /**
   * Handle an error using the appropriate handler
   */
  handle(error: unknown, context: ErrorContext): Response {
    const errorObj = this.normalizeError(error);
    
    // Find the first handler that can handle this error
    for (const handler of this.handlers) {
      if (handler.canHandle(errorObj)) {
        return handler.handle(errorObj, context);
      }
    }

    // Fallback to default handler (should never reach here due to DefaultErrorHandler)
    return ResponseHelper.error(context.res, 'An unexpected error occurred', 500);
  }

  /**
   * Register default handlers in order of specificity
   */
  private registerDefaultHandlers(): void {
    this.handlers = [
      new ValidationErrorHandler(),
      new AuthenticationErrorHandler(),
      new AuthorizationErrorHandler(),
      new NotFoundErrorHandler(),
      new ConflictErrorHandler(),
      new DatabaseErrorHandler(),
      new DefaultErrorHandler() // Must be last
    ];
  }

  /**
   * Convert unknown error to Error object
   */
  private normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    
    if (typeof error === 'string') {
      return new Error(error);
    }
    
    if (error && typeof error === 'object' && 'message' in error) {
      return new Error((error as any).message);
    }
    
    return new Error('Unknown error occurred');
  }
}

/**
 * Custom Error Classes for Type Safety
 */
export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden operation') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends Error {
  constructor(message: string = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Global error handler instance
 */
export const globalErrorHandler = new ErrorHandlerChain();
