/**
 * Enhanced Error Handling Middleware
 * Integrates with centralized error handling system
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { ResponseHelper } from '../utils/response';
import { globalErrorHandler } from '../utils/ErrorHandler';

export interface CustomError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

/**
 * Enhanced error handling middleware with better categorization
 */
export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Use centralized error handler
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

    // Try to handle with centralized error handler
    globalErrorHandler.handle(error, context);
    return;
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

  // Handle Multer specific errors
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
  const errorResponse = {
    success: false,
    message,
    statusCode,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      errorName: error.name 
    }),
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  res.status(statusCode).json(errorResponse);
};
