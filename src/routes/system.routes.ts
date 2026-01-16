import { Router } from 'express';
import { getRedisClient, isConnected as isRedisConnected } from '@/config/redis';
import { ResponseHelper } from '@/utils/response';
import logger from '@/utils/logger';
import { recommendationCache } from '@/utils/RecommendationCache';
import PublicSettingsController from '@/controllers/publicSettings.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: System
 *     description: System utilities and maintenance endpoints
 */

/**
 * @swagger
 * /system/cache/clear:
 *   post:
 *     summary: Clear application caches (Redis and in-memory)
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 */
router.post('/cache/clear', async (_req, res) => {
  const result: any = {
    redis: { attempted: false, deletedKeys: 0, error: null },
    memory: { attempted: false, cleared: false, error: null },
  };

  // Attempt to clear Redis API cache keys
  try {
    if (isRedisConnected()) {
      result.redis.attempted = true;
      const client = getRedisClient();
      const patterns = ['api:*', 'urutibiz:*'];

      let totalDeleted = 0;
      for (const pattern of patterns) {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
          // Redis v4 del can take spread; if too many, chunk in batches
          const batchSize = 1000;
          for (let i = 0; i < keys.length; i += batchSize) {
            const batch = keys.slice(i, i + batchSize);
            totalDeleted += await client.del(batch as any);
          }
        }
      }
      result.redis.deletedKeys = totalDeleted;
    }
  } catch (error: any) {
    result.redis.error = error?.message || String(error);
    logger.warn('Redis cache clear failed', { error: result.redis.error });
  }

  // Clear in-memory recommendation cache (if used)
  try {
    result.memory.attempted = true;
    await recommendationCache.clear();
    result.memory.cleared = true;
  } catch (error: any) {
    result.memory.error = error?.message || String(error);
    logger.warn('In-memory cache clear failed', { error: result.memory.error });
  }

  logger.info('System cache clear executed', { result });
  return ResponseHelper.success(res, 'Cache clear executed', result);
  logger.info('System cache clear executed', { result });
  return ResponseHelper.success(res, 'Cache clear executed', result);
});

router.get('/public-settings', PublicSettingsController.getPublicSettings);

export default router;


