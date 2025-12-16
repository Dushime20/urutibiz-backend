import cors from 'cors';
import config from '../config/config';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow all origins if CORS_ORIGIN is '*'
    if (config.cors.origin.includes('*')) {
      return callback(null, true);
    }
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (config.cors.origin.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
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
});


