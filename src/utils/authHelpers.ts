/**
 * Authentication Helper Utilities
 * Provides type-safe wrappers for authenticated routes
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Extends Express Request with user property for authenticated routes
 */
export interface AuthenticatedExpressRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    [key: string]: any;
  };
}

/**
 * Type-safe wrapper for controllers that expect an authenticated request
 * This is the primary function to wrap all authenticated route handlers
 */
export const wrapAuthenticatedController = (
  controller: (req: Request, res: Response, next?: NextFunction) => any
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = controller(req, res, next);
      
      // Handle promises returned by async controllers
      if (result && typeof result.catch === 'function') {
        result.catch(next);
      }
      
      return result;
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Type-safe wrapper for async authenticated route handlers
 */
export const wrapAsyncAuthHandler = (
  handler: (req: AuthenticatedExpressRequest, res: Response, next: NextFunction) => Promise<void>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedExpressRequest;
    Promise.resolve(handler(authReq, res, next)).catch(next);
  };
};

/**
 * Creates a type-safe middleware function
 */
export const createAuthMiddleware = (
  middleware: (req: AuthenticatedExpressRequest, res: Response, next: NextFunction) => void
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedExpressRequest;
    middleware(authReq, res, next);
  };
};
