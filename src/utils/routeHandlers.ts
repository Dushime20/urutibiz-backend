/**
 * Enhanced Route Handlers with Type Safety
 * Provides proper TypeScript support for authenticated routes
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

// Define a proper authenticated request that extends Express Request
interface AuthenticatedExpressRequest extends Request {
  user: any;
}

/**
 * Type-safe wrapper for authenticated route handlers
 */
export const createAuthenticatedHandler = (
  handler: (req: AuthenticatedExpressRequest, res: Response, next?: NextFunction) => Promise<void> | void
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Type assertion - we know this is safe after auth middleware
      const authReq = req as AuthenticatedExpressRequest;
      await handler(authReq, res, next);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Type-safe wrapper for admin route handlers
 */
export const createAdminHandler = (
  handler: (req: AuthenticatedExpressRequest, res: Response, next?: NextFunction) => Promise<void> | void
) => {
  return createAuthenticatedHandler(handler);
};

/**
 * Universal wrapper for controllers that expect AuthenticatedRequest
 * This safely wraps any controller method to be compatible with Express routing
 */
export const wrapController = (controller: any): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = controller(req, res, next);
      // Handle both sync and async controllers
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
 * Wrapper specifically for async authenticated handlers
 */
export const wrapAuthHandler = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

/**
 * Async wrapper for route handlers
 */
export const asyncHandler = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};
