/**
 * Enhanced Error Handling Middleware
 * Integrates with centralized error handling system
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { ResponseHelper } from '../utils/response';
import { ErrorHandlerChain } from '../utils/ErrorHandler';

export interface CustomError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

// Initialize centralized error handler
const errorHandlerChain = new ErrorHandlerChain();

/**
 * Enhanced error handling middleware with better categorization
 */
export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Use centralized error handler if it can handle the error
  try {
    const context = {
      res,
      operation: `${req.method} ${req.path}`,
      metadata: {
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.body,
        query: req.query,
        params: req.params
      }
    };

    // Try to use the ErrorHandlerChain
    try {
      errorHandlerChain.handle(error, context);
      return;
    } catch {
      // If centralized handler fails, continue to legacy handling
    }
  } catch (centralError) {
    logger.error('Error in centralized error handler:', centralError);
    // Fall through to legacy error handling
  }

  // Legacy error handling for backward compatibility
  let { statusCode = 500, message } = error;

  // Enhanced error categorization
  const errorMappings = [
    { name: 'CastError', message: 'Invalid resource identifier', status: 404 },
    { name: 'ValidationError', message: 'Validation failed', status: 400 },
    { name: 'JsonWebTokenError', message: 'Invalid authentication token', status: 401 },
    { name: 'TokenExpiredError', message: 'Authentication token expired', status: 401 },
    { name: 'MongoServerError', message: 'Database operation failed', status: 500 },
    { name: 'SequelizeValidationError', message: 'Data validation failed', status: 400 },
    { name: 'SequelizeUniqueConstraintError', message: 'Duplicate entry found', status: 409 },
    { name: 'MulterError', message: 'File upload error', status: 400 }
  ];

  // Apply error mapping
  const mapping = errorMappings.find(m => error.name === m.name);
  if (mapping) {
    message = mapping.message;
    statusCode = mapping.status;
  }

  // Handle specific Mongoose/MongoDB errors
  if (error.name === 'MongoError' && (error as any).code === 11000) {
    message = 'Duplicate field value entered';
    statusCode = 409;
  }

  // Handle specific error types
  if (error.name === 'TokenExpiredError') {
    message = 'Token expired';
    statusCode = 401;
  }

  if (error.name === 'MulterError') {
    if ((error as any).code === 'LIMIT_FILE_SIZE') {
      message = 'File too large';
      statusCode = 400;
    }
  }

  // Enhanced logging with structured data
  const logData = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode
    },
    request: {
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.method !== 'GET' ? req.body : undefined,
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
      params: Object.keys(req.params).length > 0 ? req.params : undefined
    },
    timestamp: new Date().toISOString()
  };

  // Log with appropriate level based on status code
  if (statusCode >= 500) {
    logger.error('Server error:', logData);
  } else if (statusCode >= 400) {
    logger.warn('Client error:', logData);
  } else {
    logger.info('Request error:', logData);
  }

  // Send error response using ResponseHelper
  const errorDetails = process.env.NODE_ENV === 'development' ? {
    stack: error.stack,
    errorName: error.name,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  } : {
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  ResponseHelper.error(res, message, errorDetails, statusCode);
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  ResponseHelper.notFound(res, `Route ${req.originalUrl} not found`);
};

export const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
