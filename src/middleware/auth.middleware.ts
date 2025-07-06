/**
 * Enhanced Authentication Middleware
 * Fixes TypeScript/Express compatibility issues
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import { UnauthorizedError, ForbiddenError } from '../utils/ErrorHandler';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

interface JWTPayload {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

const extractToken = (authHeader: string | undefined): string => {
  if (!authHeader) {
    throw new UnauthorizedError('Authorization header missing');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new UnauthorizedError('Invalid authorization format. Use Bearer <token>');
  }

  return parts[1];
};

const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    
    if (!decoded.id || !decoded.email || !decoded.role) {
      throw new UnauthorizedError('Invalid token payload');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    }
    throw error;
  }
};

export const authenticateToken: RequestHandler = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const token = extractToken(req.headers.authorization);
    const user = verifyToken(token);
    
    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (roles: string[]): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        throw new UnauthorizedError('Authentication required');
      }
      
      if (!roles.includes(authReq.user.role)) {
        throw new ForbiddenError(`Insufficient permissions. Required roles: ${roles.join(', ')}`);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireAuth = authenticateToken;
export const requireAdmin = requireRole(['admin']);
