/**
 * Performance Monitoring Middleware
 * Tracks response times, memory usage, and performance metrics
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  timestamp: string;
  route: string;
  method: string;
  statusCode: number;
}

// In-memory store for performance metrics (should be replaced with Redis in production)
const performanceMetrics: PerformanceMetrics[] = [];
const MAX_METRICS_HISTORY = 1000;

/**
 * Performance monitoring middleware
 */
export const performanceMonitoring = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  // Override res.end to capture response completion
  const originalEnd = res.end.bind(res);
  res.end = function(chunk?: any, encoding?: BufferEncoding | (() => void), cb?: () => void) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const endMemory = process.memoryUsage();

    const metrics: PerformanceMetrics = {
      responseTime,
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
      },
      timestamp: new Date().toISOString(),
      route: req.route?.path || req.path,
      method: req.method,
      statusCode: res.statusCode
    };

    // Store metrics (keep only last MAX_METRICS_HISTORY)
    performanceMetrics.push(metrics);
    if (performanceMetrics.length > MAX_METRICS_HISTORY) {
      performanceMetrics.shift();
    }

    // Log slow requests (>1000ms)
    if (responseTime > 1000) {
      logger.warn('Slow request detected:', {
        responseTime,
        route: metrics.route,
        method: metrics.method,
        memoryIncrease: Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024 * 100) / 100 + 'MB'
      });
    }

    // Add performance headers
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    res.setHeader('X-Memory-Usage', `${Math.round(endMemory.heapUsed / 1024 / 1024 * 100) / 100}MB`);

    return originalEnd(chunk, encoding as BufferEncoding, cb);
  };

  next();
};

/**
 * Get performance analytics
 */
export const getPerformanceAnalytics = () => {
  if (performanceMetrics.length === 0) {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      slowRequestsCount: 0,
      memoryTrend: 'stable'
    };
  }

  const totalRequests = performanceMetrics.length;
  const averageResponseTime = performanceMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
  const slowRequestsCount = performanceMetrics.filter(m => m.responseTime > 1000).length;
  
  // Simple memory trend analysis
  const recentMetrics = performanceMetrics.slice(-10);
  const oldMetrics = performanceMetrics.slice(-20, -10);
  
  const recentAvgMemory = recentMetrics.reduce((sum, m) => sum + m.memoryUsage.heapUsed, 0) / recentMetrics.length;
  const oldAvgMemory = oldMetrics.length > 0 ? oldMetrics.reduce((sum, m) => sum + m.memoryUsage.heapUsed, 0) / oldMetrics.length : recentAvgMemory;
  
  let memoryTrend = 'stable';
  if (recentAvgMemory > oldAvgMemory * 1.1) {
    memoryTrend = 'increasing';
  } else if (recentAvgMemory < oldAvgMemory * 0.9) {
    memoryTrend = 'decreasing';
  }

  return {
    totalRequests,
    averageResponseTime: Math.round(averageResponseTime * 100) / 100,
    slowRequestsCount,
    slowRequestsPercentage: Math.round((slowRequestsCount / totalRequests) * 100 * 100) / 100,
    memoryTrend,
    currentMemoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
    metrics: performanceMetrics.slice(-50) // Return last 50 metrics
  };
};

/**
 * Clear performance metrics (useful for testing)
 */
export const clearPerformanceMetrics = () => {
  performanceMetrics.length = 0;
};
