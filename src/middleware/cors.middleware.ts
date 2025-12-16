import cors from 'cors';
import config from '../config/config';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow all origins if CORS_ORIGIN is '*'
    if (config.cors.origin.includes('*')) {
      return callback(null, true);
    }
    
    // Allow requests with no origin (like mobile apps, curl requests, or same-origin requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (config.cors.origin.includes(origin)) {
      return callback(null, true);
    }
    
    // In development, allow localhost and common development origins
    if (config.nodeEnv === 'development') {
      const devOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:8080',
      ];
      if (devOrigins.includes(origin)) {
        return callback(null, true);
      }
    }
    
    // Allow same-domain requests (different ports on same IP)
    // This handles cases like frontend on :8080 and backend on :8081
    try {
      const originUrl = new URL(origin);
      const allowedUrls = config.cors.origin.map(allowed => {
        try {
          return new URL(allowed);
        } catch {
          return null;
        }
      }).filter(Boolean) as URL[];
      
      // Check if origin matches any allowed origin's hostname (ignoring port)
      const matchesHostname = allowedUrls.some(allowedUrl => 
        allowedUrl.hostname === originUrl.hostname
      );
      
      if (matchesHostname) {
        return callback(null, true);
      }
    } catch (e) {
      // If URL parsing fails, continue with strict check
    }
    
    // Log the rejected origin for debugging
    console.warn(`[CORS] Rejected origin: ${origin}. Allowed origins: ${config.cors.origin.join(', ')}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-File-Name',
  ],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400, // 24 hours
  // Ensure CORS headers are always sent, even for failed requests
  preflightContinue: false,
  optionsSuccessStatus: 204,
});


