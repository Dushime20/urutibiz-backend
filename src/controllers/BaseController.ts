import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { 
  AuthenticatedRequest, 
  ValidationError
} from '@/types';
import { PaginationResult } from '@/types/common.types';
import { ResponseHelper } from '@/utils/response';
import logger from '@/utils/logger';

export abstract class BaseController {
  /**
   * Handle validation errors from express-validator
   */
  protected handleValidationErrors(req: Request, res: Response): boolean {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors: ValidationError[] = errors.array().map(error => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? error.value : undefined
      }));
      
      ResponseHelper.error(res, 'Validation failed', validationErrors, 400);
      return true;
    }
    return false;
  }

  /**
   * Extract pagination parameters from query
   */
  protected getPaginationParams(req: Request): { page: number; limit: number } {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    return { page, limit };
  }

  /**
   * Extract sorting parameters from query
   */
  protected getSortParams(req: Request, defaultSort: string = 'created_at', defaultOrder: 'asc' | 'desc' = 'desc'): { 
    sortBy: string; 
    sortOrder: 'asc' | 'desc' 
  } {
    const sortBy = (req.query.sortBy as string) || defaultSort;
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || defaultOrder;
    return { sortBy, sortOrder };
  }

  /**
   * Handle async controller methods with error catching
   */
  protected asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  /**
   * Check if user owns resource or is admin
   */
  protected checkResourceOwnership(req: AuthenticatedRequest, resourceOwnerId: string): boolean {
    console.log('checkResourceOwnership - req.user:', req.user);
    console.log('checkResourceOwnership - resourceOwnerId:', resourceOwnerId);
    if (!req.user || !req.user.id) {
      return false;
    }
    return String(req.user.id) === String(resourceOwnerId) || req.user.role === 'admin';
  }

  /**
   * Log controller action
   */
  protected logAction(action: string, userId: string, resourceId?: string, metadata?: object): void {
    logger.info(`Controller Action: ${action}`, {
      userId,
      resourceId,
      metadata,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Format paginated response
   */
  protected formatPaginatedResponse<T>(
    res: Response,
    message: string,
    data: PaginationResult<T>,
    statusCode: number = 200
  ): void {
    ResponseHelper.success(res, message, data, statusCode);
  }

  /**
   * Handle resource not found
   */
  protected handleNotFound(res: Response, resource: string = 'Resource'): void {
    ResponseHelper.error(res, `${resource} not found`, undefined, 404);
  }

  /**
   * Handle unauthorized access
   */
  protected handleUnauthorized(res: Response, message: string = 'Not authorized'): void {
    ResponseHelper.error(res, message, undefined, 403);
  }

  /**
   * Handle bad request
   */
  protected handleBadRequest(res: Response, message: string): void {
    ResponseHelper.error(res, message, undefined, 400);
  }
}
