import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/types';

/**
 * Middleware to check if user has required role(s)
 * @param requiredRoles - Array of roles that are allowed to access the endpoint
 */
export const requireRole = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      
      // Check if user is authenticated
      if (!authenticatedReq.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if user has any of the required roles
      const userRole = authenticatedReq.user.role;
      if (!userRole || !requiredRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${requiredRoles.join(', ')}. Your role: ${userRole || 'none'}`
        });
      }

      // User has required role, proceed
      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error in role validation'
      });
    }
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = requireRole(['admin', 'super_admin']);

/**
 * Middleware to check if user is super admin
 */
export const requireSuperAdmin = requireRole(['super_admin']);

/**
 * Middleware to check if user is inspector
 */
export const requireInspector = requireRole(['inspector', 'admin', 'super_admin']);

/**
 * Middleware to check if user is owner
 */
export const requireOwner = requireRole(['owner', 'admin', 'super_admin']);

/**
 * Middleware to check if user is renter
 */
export const requireRenter = requireRole(['renter', 'admin', 'super_admin']);

export default {
  requireRole,
  requireAdmin,
  requireSuperAdmin,
  requireInspector,
  requireOwner,
  requireRenter
};
