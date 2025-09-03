import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '@/config/database';

// In-memory cache for view tracking (in production, use Redis)
const viewTrackingCache = new Map<string, number>();

export const trackProductView = async (req: Request, res: Response, next: NextFunction) => {
  const { id: productId } = req.params;
  const userId = (req as any).user?.id;
  const ipAddress = req.ip || req.connection.remoteAddress;
  
  if (!productId) {
    return next();
  }

  try {
    const db = getDatabase();
    
    // Create a unique key for this specific product view (user + product + IP)
    const viewKey = `${productId}_${userId || 'anonymous'}_${ipAddress}`;
    const now = Date.now();
    const lastViewTime = viewTrackingCache.get(viewKey) || 0;
    
    // Simple cooldown: 10 seconds between views of the SAME product
    // Users can freely browse different products without any restrictions
    const VIEW_COOLDOWN = 10 * 1000; // 10 seconds
    
    if (now - lastViewTime < VIEW_COOLDOWN) {
      console.log(`⏸️ View skipped (10s cooldown for product ${productId}): ${productId} (user: ${userId || 'anonymous'})`);
      return next();
    }
    
    // Update the cache for THIS specific product
    viewTrackingCache.set(viewKey, now);
    
    // Clean up old entries (keep cache size manageable)
    if (viewTrackingCache.size > 10000) {
      const entries = Array.from(viewTrackingCache.entries());
      const cutoff = now - (30 * 60 * 1000); // 30 minutes
      entries.forEach(([key, timestamp]) => {
        if (timestamp < cutoff) {
          viewTrackingCache.delete(key);
        }
      });
    }
    
    // Record the view asynchronously
    setImmediate(async () => {
      try {
        // Record the view in product_views table
        await db('product_views').insert({
          id: require('uuid').v4(),
          product_id: productId,
          user_id: userId || null,
          ip_address: ipAddress || null,
          user_agent: req.headers['user-agent'] || null,
          viewed_at: new Date(),
          created_at: new Date()
        });

        // Increment the view_count in products table
        await db('products')
          .where('id', productId)
          .increment('view_count', 1);

        console.log(`✅ Product view tracked: ${productId} (user: ${userId || 'anonymous'})`);
      } catch (error) {
        console.error('Error tracking product view:', error);
      }
    });
    
  } catch (error) {
    console.error('Error in view tracking middleware:', error);
  }
  
  next();
};

export default trackProductView;
