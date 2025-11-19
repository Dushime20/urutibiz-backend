/**
 * Debug middleware to log all incoming requests
 * This will help identify if the request body is being parsed correctly
 */

import { Request, Response, NextFunction } from 'express';

export const debugMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  // Only log for auth routes to avoid spam
  if (req.path.includes('/auth/')) {
    console.log('\n🔍 [DEBUG MIDDLEWARE] Request Details:');
    console.log('📋 Method:', req.method);
    console.log('🔗 URL:', req.url);
    console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 Body Type:', typeof req.body);
    console.log('🔍 Body Keys:', req.body ? Object.keys(req.body) : 'No body');
    console.log('🔍 Content-Type:', req.headers['content-type']);
    console.log('🔍 Content-Length:', req.headers['content-length']);
    console.log('='.repeat(50));
  }
  
  next();
};
