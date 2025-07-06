/**
 * Performance Monitoring Routes
 * Real-time performance metrics and monitoring endpoints
 * 
 * @version 1.0.0
 */

import { Router, Request, Response, NextFunction } from 'express';
import performanceMonitor from '../services/PerformanceMonitoringService';
import { getCacheMetrics, resetCacheMetrics } from '../middleware/cache.middleware';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import { noCacheMiddleware } from '../middleware/cache.middleware';

const router = Router();

// Type-safe wrapper for authenticated handlers
const wrapAuthHandler = (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * @swagger
 * tags:
 *   name: Performance
 *   description: Performance monitoring and metrics
 */

/**
 * @swagger
 * /performance/metrics:
 *   get:
 *     summary: Get comprehensive performance metrics
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 */
router.get('/metrics', requireAuth, requireAdmin, noCacheMiddleware, 
  wrapAuthHandler(async (_req: Request, res: Response) => {
    const metrics = await performanceMonitor.getMetrics();
    const cacheMetrics = getCacheMetrics();
    
    res.json({
      success: true,
      data: {
        ...metrics,
        cache: cacheMetrics,
        timestamp: new Date().toISOString()
      }
    });
  })
);

/**
 * @swagger
 * /performance/database:
 *   get:
 *     summary: Get database performance metrics
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Database metrics retrieved successfully
 */
router.get('/database', requireAuth, requireAdmin, noCacheMiddleware, 
  wrapAuthHandler(async (_req: Request, res: Response) => {
    const dbMetrics = await performanceMonitor.getDatabaseMetrics();
    
    res.json({
      success: true,
      data: dbMetrics
    });
  })
);

/**
 * @swagger
 * /performance/queries:
 *   get:
 *     summary: Get slow query metrics
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Query metrics retrieved successfully
 */
router.get('/queries', requireAuth, requireAdmin, noCacheMiddleware, 
  wrapAuthHandler(async (_req: Request, res: Response) => {
    const queryMetrics = performanceMonitor.getQueryMetrics();
    
    res.json({
      success: true,
      data: queryMetrics
    });
  })
);

/**
 * @swagger
 * /performance/reset:
 *   post:
 *     summary: Reset performance metrics
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics reset successfully
 */
router.post('/reset', requireAuth, requireAdmin, 
  wrapAuthHandler(async (_req: Request, res: Response) => {
    await performanceMonitor.resetMetrics();
    resetCacheMetrics();
    
    res.json({
      success: true,
      message: 'Performance metrics reset successfully'
    });
  })
);

/**
 * @swagger
 * /performance/health:
 *   get:
 *     summary: Get system health status
 *     tags: [Performance]
 *     responses:
 *       200:
 *         description: Health status retrieved successfully
 */
router.get('/health', noCacheMiddleware, 
  wrapAuthHandler(async (_req: Request, res: Response) => {
    const healthStatus = await performanceMonitor.getHealthStatus();
    
    res.json({
      success: true,
      data: healthStatus
    });
  })
);

/**
 * @swagger
 * /performance/recommendations:
 *   get:
 *     summary: Get performance optimization recommendations
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommendations retrieved successfully
 */
router.get('/recommendations', requireAuth, requireAdmin, noCacheMiddleware, 
  wrapAuthHandler(async (_req: Request, res: Response) => {
    const recommendations = performanceMonitor.getOptimizationRecommendations();
    
    res.json({
      success: true,
      data: recommendations
    });
  })
);

export default router;
