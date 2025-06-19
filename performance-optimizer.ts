import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';

// Multi-tier caching strategy for dynamic content
const microCache = new NodeCache({ stdTTL: 30 }); // 30 seconds for ultra-dynamic content
const shortCache = new NodeCache({ stdTTL: 180 }); // 3 minutes for frequently updated content  
const mediumCache = new NodeCache({ stdTTL: 600 }); // 10 minutes for semi-static content
const longCache = new NodeCache({ stdTTL: 3600 }); // 1 hour for static content

export interface CacheConfig {
  tier: 'micro' | 'short' | 'medium' | 'long';
  conditions?: (req: Request) => boolean;
  invalidateOn?: string[];
}

const cacheInstances = {
  micro: microCache,
  short: shortCache,
  medium: mediumCache,
  long: longCache
};

// Smart cache middleware that adapts to content type
export function smartCache(config: CacheConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for admin requests or when conditions don't match
    if (req.path.includes('/admin/') || (config.conditions && !config.conditions(req))) {
      return next();
    }

    const cache = cacheInstances[config.tier];
    const cacheKey = `${req.method}:${req.path}:${JSON.stringify(req.query)}`;
    
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`Cache HIT (${config.tier}):`, cacheKey);
      return res.json(cachedData);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data: any) {
      cache.set(cacheKey, data);
      console.log(`Cache SET (${config.tier}):`, cacheKey);
      return originalJson.call(this, data);
    };

    next();
  };
}

// Smart cache invalidation system
export class SmartCacheInvalidator {
  private static invalidationMap = new Map<string, string[]>();

  static registerInvalidation(trigger: string, cacheKeys: string[]) {
    this.invalidationMap.set(trigger, cacheKeys);
  }

  static invalidate(trigger: string) {
    const keysToInvalidate = this.invalidationMap.get(trigger) || [];
    
    keysToInvalidate.forEach(pattern => {
      Object.values(cacheInstances).forEach(cache => {
        const keys = cache.keys();
        keys.forEach(key => {
          if (key.includes(pattern)) {
            cache.del(key);
            console.log(`Smart invalidation: ${key}`);
          }
        });
      });
    });
  }

  static clearAll() {
    Object.values(cacheInstances).forEach(cache => cache.flushAll());
    console.log('All caches cleared');
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static metrics = new Map<string, { count: number; totalTime: number; avgTime: number }>();

  static startTimer(operation: string) {
    const startTime = Date.now();
    return {
      operation,
      startTime,
      end: () => {
        const duration = Date.now() - startTime;
        this.recordMetric(operation, duration);
      }
    };
  }

  static recordMetric(operation: string, duration: number) {
    const existing = this.metrics.get(operation) || { count: 0, totalTime: 0, avgTime: 0 };
    existing.count++;
    existing.totalTime += duration;
    existing.avgTime = existing.totalTime / existing.count;
    this.metrics.set(operation, existing);
  }

  static getMetrics() {
    return Object.fromEntries(this.metrics);
  }
}

// Database query optimization with intelligent caching
export async function optimizedQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  cacheConfig: CacheConfig
): Promise<T> {
  const cache = cacheInstances[cacheConfig.tier];
  
  const cached = cache.get<T>(queryKey);
  if (cached) {
    console.log(`DB Query cache HIT (${cacheConfig.tier}):`, queryKey);
    return cached;
  }

  const timer = PerformanceMonitor.startTimer(`query:${queryKey}`);
  try {
    const result = await queryFn();
    cache.set(queryKey, result);
    console.log(`DB Query cache SET (${cacheConfig.tier}):`, queryKey);
    return result;
  } finally {
    timer.end();
  }
}

// Register common invalidation patterns
SmartCacheInvalidator.registerInvalidation('firms-updated', ['/api/firms-data', 'firms']);
SmartCacheInvalidator.registerInvalidation('articles-updated', ['/api/articles', 'articles']);
SmartCacheInvalidator.registerInvalidation('users-updated', ['/api/users', 'users']);

export { microCache, shortCache, mediumCache, longCache };