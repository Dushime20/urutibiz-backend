/**
 * Enhanced Authentication Middleware
 * Fixes TypeScript/Express compatibility issues
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/ErrorHandler';
import User from '../models/User.model';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
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

function verifyToken(token: string) {
  try {
    console.log('Verifying token:', token); // Debug: print the token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT secret is not defined');
    }
    const payload = jwt.verify(token, secret) as JWTPayload;
    console.log('Token payload:', payload); // Debug: print the payload
    return payload;
  } catch (err) {
    console.error('JWT verification error:', err); // Debug: print the error
    throw new UnauthorizedError('Invalid token payload');
  }
}

export const authenticateToken: RequestHandler = async (req, _res, next) => {
  try {
    console.log('[AUTH] Starting authentication...');
    console.log('[AUTH] Headers:', JSON.stringify(req.headers, null, 2));
    
    const token = extractToken(req.headers.authorization);
    console.log('[AUTH] Extracted token:', token ? 'Token exists' : 'No token');
    
    const payload = verifyToken(token);
    console.log('[AUTH] Token payload:', payload);
    
    // Fetch the full user from DB
    console.log('[AUTH] Fetching user from DB with ID:', payload.id);
    const user = await User.findById(payload.id);
    console.log('[AUTH] User from DB:', user ? 'User found' : 'User not found');
    
    if (!user) {
      console.log('[AUTH] User not found in DB');
      throw new UnauthorizedError('User not found');
    }
    
    // Set user on request
    req.user = user;
    console.log('[AUTH] User set on request:', user.id, user.email, user.role);
    
    next();
  } catch (error) {
    console.error('[AUTH] Authentication error:', error);
    next(error);
  }
};

export const requireRole = (roles: string[]): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      
      const userRole = (req.user as any).role;
      if (!userRole || !roles.includes(userRole)) {
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
