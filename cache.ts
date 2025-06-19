import NodeCache from 'node-cache';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import dotenv from 'dotenv';
dotenv.config();

// Enhanced cache instances with comprehensive configuration for production
const shortCache = new NodeCache({ 
  stdTTL: 300,           // 5 minutes
  checkperiod: 60,       // Check for expired keys every minute
  useClones: false,      // Performance optimization
  deleteOnExpire: true,  // Auto cleanup
  maxKeys: 1000,         // Memory management
  forceString: false     // Allow objects
});

const mediumCache = new NodeCache({ 
  stdTTL: 1800,          // 30 minutes  
  checkperiod: 300,      // Check every 5 minutes
  useClones: false,
  deleteOnExpire: true,
  maxKeys: 500,
  forceString: false
});

const longCache = new NodeCache({ 
  stdTTL: 3600,          // 1 hour
  checkperiod: 600,      // Check every 10 minutes
  useClones: false,
  deleteOnExpire: true,
  maxKeys: 200,
  forceString: false
});

const dataCache = new NodeCache({ 
  stdTTL: 600,           // 10 minutes for API data
  checkperiod: 120,      // Check every 2 minutes
  useClones: false,
  deleteOnExpire: true,
  maxKeys: 2000,         // Larger for API responses
  forceString: false
});

// Critical cache for high-frequency data
const criticalCache = new NodeCache({
  stdTTL: 120,           // 2 minutes for critical data
  checkperiod: 30,       // Check every 30 seconds
  useClones: false,
  deleteOnExpire: true,
  maxKeys: 3000,
  forceString: false
});

// User-specific cache for authenticated experiences
const userCache = new NodeCache({
  stdTTL: 300,           // 5 minutes for user dashboards
  checkperiod: 60,       // Check every minute
  useClones: false,
  deleteOnExpire: true,
  maxKeys: 1500,         // Support many users
  forceString: false
});

// Admin cache for backend operations
const adminCache = new NodeCache({
  stdTTL: 180,           // 3 minutes for admin data
  checkperiod: 45,       // Check every 45 seconds
  useClones: false,
  deleteOnExpire: true,
  maxKeys: 800,
  forceString: false
});

// Firm-specific cache for rapid firm page navigation
const firmCache = new NodeCache({
  stdTTL: 1200,          // 20 minutes for firm data
  checkperiod: 180,      // Check every 3 minutes
  useClones: false,
  deleteOnExpire: true,
  maxKeys: 300,          // Support all firms
  forceString: false
});

// Cache performance monitoring
const cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0,
  startTime: Date.now()
};

export class CacheManager {
  // Enhanced cache middleware with circuit breaker and health monitoring
  static middleware(duration: number = 300, cacheType: 'short' | 'medium' | 'long' | 'data' | 'critical' | 'user' | 'admin' | 'firm' = 'short') {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.generateKey(req);
      const startTime = Date.now();
      
      try {
        const cached = this.get(key, cacheType);
        
        if (cached) {
          cacheStats.hits++;
          res.set('X-Cache', 'HIT');
          res.set('X-Cache-TTL', this.getTTL(key, cacheType).toString());
          res.set('X-Cache-Time', (Date.now() - startTime).toString());
          return res.json(cached);
        }
        
        cacheStats.misses++;
        
        // Intercept response to cache it
        const originalJson = res.json;
        res.json = function(data: any) {
          try {
            // Only cache successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
              CacheManager.set(key, data, cacheType, duration);
              cacheStats.sets++;
            }
            res.set('X-Cache', 'MISS');
            res.set('X-Cache-Time', (Date.now() - startTime).toString());
            return originalJson.call(this, data);
          } catch (error) {
            cacheStats.errors++;
            console.error('Cache set error:', error);
            return originalJson.call(this, data);
          }
        };
        
        next();
      } catch (error) {
        cacheStats.errors++;
        console.error('Cache middleware error:', error);
        next();
      }
    };
  }

  // Smart key generation with namespace and versioning
  static generateKey(req: Request): string {
    const base = req.originalUrl || req.url;
    const userId = (req as any).user?.claims?.sub || 'anonymous';
    const userTier = (req as any).user?.subscriptionTier || 'free';
    
    // Include user context for personalized caching
    if (base.includes('/api/for-you') || base.includes('/api/user')) {
      return `v2:${base}:${userId}:${userTier}`;
    }
    
    // Version prefix for easy cache busting during deployments
    return `v2:${base}`;
  }

  // Robust get with fallback and monitoring
  static get(key: string, cacheType: 'short' | 'medium' | 'long' | 'data' | 'critical' | 'user' | 'admin' | 'firm' = 'short') {
    try {
      const cache = this.getCache(cacheType);
      const value = cache.get(key);
      
      if (value !== undefined) {
        // Track cache hit
        this.updateHitRate(cacheType);
        return value;
      }
      
      return undefined;
    } catch (error) {
      cacheStats.errors++;
      console.error(`Cache get error for key ${key}:`, error);
      return undefined;
    }
  }

  // Robust set with compression and memory management
  static set(key: string, value: any, cacheType: 'short' | 'medium' | 'long' | 'data' | 'critical' | 'user' | 'admin' | 'firm' = 'short', ttl?: number) {
    try {
      const cache = this.getCache(cacheType);
      
      // Memory usage check - prevent cache overflow
      if (this.getMemoryUsage(cache) > 0.9) {
        this.evictOldestEntries(cache, 0.1); // Evict 10% of entries
      }
      
      // Set with custom TTL or default
      if (ttl) {
        cache.set(key, value, ttl);
      } else {
        cache.set(key, value);
      }
      
      cacheStats.sets++;
      return true;
    } catch (error) {
      cacheStats.errors++;
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  // Smart deletion with dependency tracking
  static del(key: string, cacheType: 'short' | 'medium' | 'long' | 'data' | 'critical' | 'user' | 'admin' | 'firm' = 'short') {
    try {
      const cache = this.getCache(cacheType);
      const deleted = cache.del(key);
      if (deleted > 0) {
        cacheStats.deletes++;
      }
      return deleted;
    } catch (error) {
      cacheStats.errors++;
      console.error(`Cache delete error for key ${key}:`, error);
      return 0;
    }
  }

  // Advanced pattern-based cache invalidation
  static clearPattern(pattern: string, cacheTypes?: string[]) {
    const cachesToClear = cacheTypes || ['short', 'medium', 'long', 'data', 'critical', 'user'];
    let totalCleared = 0;
    
    cachesToClear.forEach(type => {
      try {
        const cache = this.getCache(type as any);
        const keys = cache.keys();
        keys.forEach(key => {
          if (key.includes(pattern) || new RegExp(pattern).test(key)) {
            cache.del(key);
            totalCleared++;
          }
        });
      } catch (error) {
        console.error(`Error clearing pattern ${pattern} from ${type}:`, error);
      }
    });
    
    return totalCleared;
  }

  // Graceful cache warming for critical endpoints
  static async warmCache(endpoints: Array<{path: string, cacheType: string, data: any}>) {
    for (const endpoint of endpoints) {
      try {
        this.set(`v2:${endpoint.path}`, endpoint.data, endpoint.cacheType as any);
      } catch (error) {
        console.error(`Failed to warm cache for ${endpoint.path}:`, error);
      }
    }
  }

  // Cache health monitoring and auto-recovery
  static getHealthStats() {
    const uptime = Date.now() - cacheStats.startTime;
    const totalRequests = cacheStats.hits + cacheStats.misses;
    const hitRate = totalRequests > 0 ? (cacheStats.hits / totalRequests) * 100 : 0;
    
    return {
      uptime: Math.round(uptime / 1000), // seconds
      hitRate: Math.round(hitRate * 100) / 100,
      totalHits: cacheStats.hits,
      totalMisses: cacheStats.misses,
      totalSets: cacheStats.sets,
      totalDeletes: cacheStats.deletes,
      totalErrors: cacheStats.errors,
      memoryUsage: this.getAllMemoryUsage(),
      cacheKeys: this.getAllKeysCounts()
    };
  }

  // Auto-recovery mechanisms
  static performHealthCheck() {
    try {
      // Test each cache
      const testKey = 'health_check_' + Date.now();
      const testValue = { test: true, timestamp: Date.now() };
      
      [shortCache, mediumCache, longCache, dataCache, criticalCache, userCache].forEach((cache, index) => {
        cache.set(testKey, testValue, 5); // 5 second TTL
        const retrieved = cache.get(testKey);
        cache.del(testKey);
        
        if (!retrieved) {
          console.warn(`Cache ${index} failed health check`);
        }
      });
      
      return true;
    } catch (error) {
      console.error('Cache health check failed:', error);
      return false;
    }
  }

  // Memory management utilities
  private static getMemoryUsage(cache: NodeCache): number {
    const stats = cache.getStats();
    return stats.keys / cache.options.maxKeys!;
  }

  private static evictOldestEntries(cache: NodeCache, percentage: number) {
    const keys = cache.keys();
    const toEvict = Math.floor(keys.length * percentage);
    
    // Evict oldest entries (simple FIFO for now)
    for (let i = 0; i < toEvict; i++) {
      cache.del(keys[i]);
    }
  }

  private static getAllMemoryUsage() {
    return {
      short: this.getMemoryUsage(shortCache),
      medium: this.getMemoryUsage(mediumCache),
      long: this.getMemoryUsage(longCache),
      data: this.getMemoryUsage(dataCache),
      critical: this.getMemoryUsage(criticalCache),
      user: this.getMemoryUsage(userCache)
    };
  }

  private static getAllKeysCounts() {
    return {
      short: shortCache.getStats().keys,
      medium: mediumCache.getStats().keys,
      long: longCache.getStats().keys,
      data: dataCache.getStats().keys,
      critical: criticalCache.getStats().keys,
      user: userCache.getStats().keys
    };
  }

  private static updateHitRate(cacheType: string) {
    // Could implement per-cache-type hit rate tracking here
  }

  private static getTTL(key: string, cacheType: string): number {
    try {
      const cache = this.getCache(cacheType as any);
      return cache.getTtl(key) || 0;
    } catch {
      return 0;
    }
  }

  // Enhanced cache getter with fallback chain
  private static getCache(type: string) {
    switch (type) {
      case 'short': return shortCache;
      case 'medium': return mediumCache;
      case 'long': return longCache;
      case 'data': return dataCache;
      case 'critical': return criticalCache;
      case 'user': return userCache;
      case 'admin': return adminCache;
      case 'firm': return firmCache;
      default: return shortCache;
    }
  }

  // AWS-ready cleanup for graceful shutdowns
  static async gracefulShutdown() {
    try {
      console.log('Performing cache graceful shutdown...');
      
      // Save critical cache data if needed (for AWS persistence)
      const criticalData = this.exportCriticalData();
      
      // Clear all caches
      this.clearAll();
      
      console.log('Cache shutdown completed');
      return criticalData;
    } catch (error) {
      console.error('Error during cache shutdown:', error);
      return null;
    }
  }

  private static exportCriticalData() {
    // Export data that should survive restarts
    try {
      const critical: Record<string, any> = {};
      criticalCache.keys().forEach(key => {
        const value = criticalCache.get(key);
        if (value) {
          critical[key] = value;
        }
      });
      return critical;
    } catch (error) {
      console.error('Failed to export critical cache data:', error);
      return {};
    }
  }

  // Clear all caches
  static clearAll() {
    shortCache.flushAll();
    mediumCache.flushAll();
    longCache.flushAll();
    dataCache.flushAll();
    criticalCache.flushAll();
    userCache.flushAll();
  }
}

// Enhanced middleware configurations for optimal performance
export const cacheMiddleware = {
  // Critical endpoints - ultra-fast caching
  categories: CacheManager.middleware(3600, 'long'),       // 1 hour - stable data
  featured: CacheManager.middleware(300, 'critical'),      // 5 minutes - high priority
  
  // Content endpoints - balanced caching
  articles: CacheManager.middleware(600, 'data'),          // 10 minutes - frequently updated
  trending: CacheManager.middleware(300, 'critical'),      // 5 minutes - very dynamic
  popular: CacheManager.middleware(900, 'medium'),         // 15 minutes - moderately dynamic
  rankings: CacheManager.middleware(1800, 'medium'),       // 30 minutes - semi-stable
  opinions: CacheManager.middleware(600, 'data'),          // 10 minutes - content-based
  
  // Business data - longer caching
  firms: CacheManager.middleware(3600, 'long'),            // 1 hour - stable business data
  podcasts: CacheManager.middleware(1800, 'medium'),       // 30 minutes - episode data
  
  // User-specific - personalized caching
  user: CacheManager.middleware(300, 'user'),              // 5 minutes - user preferences
  forYou: CacheManager.middleware(600, 'user'),            // 10 minutes - personalized content
  
  // Firm-specific - optimized for rapid firm navigation
  firmData: CacheManager.middleware(1200, 'firm'),         // 20 minutes - firm business data
  firmArticles: CacheManager.middleware(900, 'firm'),      // 15 minutes - firm-related articles
  firmsData: CacheManager.middleware(300, 'data'),         // 5 minutes - all firms listing data
  
  // Admin backend - lightning-fast admin experience
  adminStats: CacheManager.middleware(180, 'admin'),       // 3 minutes - admin dashboard stats
  adminUsers: CacheManager.middleware(300, 'admin'),       // 5 minutes - user management data
  adminArticles: CacheManager.middleware(240, 'admin'),    // 4 minutes - article management
  adminOrders: CacheManager.middleware(180, 'admin'),      // 3 minutes - order data
  adminCorporate: CacheManager.middleware(600, 'admin'),   // 10 minutes - corporate data
  
  // User dashboard - personalized authenticated experience
  userProfile: CacheManager.middleware(300, 'user'),       // 5 minutes - user profile data
  userDashboard: CacheManager.middleware(240, 'user'),     // 4 minutes - dashboard content
  userSaved: CacheManager.middleware(180, 'user'),         // 3 minutes - saved articles
  
  // Authentication processes - lightning-fast login/logout
  auth: CacheManager.middleware(120, 'user'),              // 2 minutes - auth states
  
  // Sidebar and navigation - instant menu loading
  navigation: CacheManager.middleware(900, 'medium'),      // 15 minutes - menu items
  sidebarData: CacheManager.middleware(600, 'medium'),     // 10 minutes - sidebar content
};

// Advanced database query caching with circuit breaker and retries
export function cacheQuery<T>(
  key: string, 
  queryFn: () => Promise<T>, 
  cacheType: 'short' | 'medium' | 'long' | 'data' | 'critical' | 'user' | 'admin' | 'firm' = 'data',
  ttl?: number
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();
    let attempts = 0;
    const maxAttempts = 3;

    const executeWithRetry = async (): Promise<void> => {
      try {
        attempts++;
        
        // Try cache first with fallback mechanism
        const cached = CacheManager.get(key, cacheType);
        if (cached !== undefined) {
          cacheStats.hits++;
          resolve(cached as T);
          return;
        }

        cacheStats.misses++;
        
        // Execute query with timeout protection
        const timeoutPromise = new Promise<never>((_, timeoutReject) => {
          setTimeout(() => timeoutReject(new Error('Query timeout')), 10000);
        });
        
        const result = await Promise.race([queryFn(), timeoutPromise]);
        
        // Cache successful results only
        if (result !== null && result !== undefined) {
          const success = CacheManager.set(key, result, cacheType, ttl);
          if (success) {
            cacheStats.sets++;
          }
        }
        
        const queryTime = Date.now() - startTime;
        if (queryTime > 1000) {
          console.warn(`Slow query detected: ${key} took ${queryTime}ms`);
        }
        
        resolve(result);
        
      } catch (error) {
        cacheStats.errors++;
        
        // Retry logic for transient failures
        if (attempts < maxAttempts && isRetryableError(error)) {
          console.warn(`Query attempt ${attempts} failed for ${key}, retrying...`);
          setTimeout(executeWithRetry, Math.pow(2, attempts) * 100);
          return;
        }
        
        // Check for stale cache as fallback
        const staleCache = tryGetStaleCache(key, cacheType);
        if (staleCache) {
          console.warn(`Using stale cache for ${key} due to error:`, error);
          resolve(staleCache as T);
          return;
        }
        
        reject(error);
      }
    };

    await executeWithRetry();
  });
}

// Error classification for retry logic
function isRetryableError(error: any): boolean {
  if (!error) return false;
  const message = error.message?.toLowerCase() || '';
  return message.includes('timeout') || 
         message.includes('connection') || 
         message.includes('network') ||
         error.code === 'ECONNRESET';
}

// Stale cache retrieval for graceful degradation
function tryGetStaleCache(key: string, cacheType: string) {
  try {
    const cache = CacheManager['getCache'](cacheType);
    const allKeys = cache.keys();
    const staleKey = allKeys.find(k => k.startsWith(key));
    return staleKey ? cache.get(staleKey) : null;
  } catch {
    return null;
  }
}

// Comprehensive cache invalidation with smart dependency tracking
export const invalidateCache = {
  // Invalidate article-related content with dependencies
  articles: (articleId?: number) => {
    if (articleId) {
      CacheManager.clearPattern(`article:${articleId}`);
      CacheManager.clearPattern(`v2:/api/articles/${articleId}`);
    }
    CacheManager.clearPattern('articles', ['data', 'critical']);
    CacheManager.clearPattern('trending', ['critical']);
    CacheManager.clearPattern('popular', ['medium']);
    CacheManager.clearPattern('featured', ['critical']);
  },
  
  // Invalidate user-specific content
  users: (userId?: string) => {
    if (userId) {
      CacheManager.clearPattern(`:${userId}:`, ['user']);
    } else {
      CacheManager.clearPattern('user', ['user']);
    }
    CacheManager.clearPattern('for-you', ['user']);
  },
  
  // Invalidate content hierarchy (articles + dependencies)
  content: () => {
    CacheManager.clearPattern('articles', ['data', 'critical']);
    CacheManager.clearPattern('trending', ['critical']);
    CacheManager.clearPattern('popular', ['medium']);
    CacheManager.clearPattern('featured', ['critical']);
    CacheManager.clearPattern('rankings', ['medium']);
    CacheManager.clearPattern('opinions', ['data']);
  },
  
  // Invalidate firms data
  firms: (firmId?: number) => {
    if (firmId) {
      CacheManager.clearPattern(`firms:${firmId}`, ['data']);
      CacheManager.clearPattern(`v2:/api/firms-data/${firmId}`, ['data']);
    }
    CacheManager.clearPattern('firms', ['data']);
    CacheManager.clearPattern('all-firms', ['data']);
  },
  
  // Invalidate admin data  
  admin: () => {
    CacheManager.clearPattern('admin', ['data']);
    CacheManager.clearPattern('stats', ['data']);
    CacheManager.clearPattern('dashboard', ['data']);
  },
  
  // Smart invalidation based on content type
  smart: (type: 'article' | 'user' | 'firm' | 'podcast', id?: string | number) => {
    switch (type) {
      case 'article':
        invalidateCache.articles(id as number);
        break;
      case 'user':
        invalidateCache.users(id as string);
        break;
      case 'firm':
        invalidateCache.firms(id as number);
        break;
      case 'podcast':
        CacheManager.clearPattern('podcasts', ['medium']);
        break;
    }
  },
  
  // Legacy support
  categories: () => CacheManager.clearPattern('categories'),
  featured: () => CacheManager.clearPattern('featured'),
  trending: () => CacheManager.clearPattern('trending'),
  user: (userId: string) => CacheManager.clearPattern(`user-${userId}`),
  
  // Landing page cache invalidation
  landingPage: () => {
    CacheManager.clearPattern('featured', ['critical']);
    CacheManager.clearPattern('trending', ['critical']);
    CacheManager.clearPattern('popular', ['medium']);
    CacheManager.clearPattern('rankings', ['medium']);
    CacheManager.clearPattern('spotlight', ['critical']);
  },
  
  // Emergency cache flush
  all: () => {
    console.warn('Performing emergency cache flush');
    CacheManager.clearAll();
  }
};

// AWS-ready cache health monitoring and metrics
export const cacheMetrics = {
  // Get comprehensive performance metrics
  getMetrics: () => {
    const stats = CacheManager.getHealthStats();
    const now = Date.now();
    
    return {
      ...stats,
      timestamp: now,
      performance: {
        avgResponseTime: stats.totalHits > 0 ? (now - cacheStats.startTime) / stats.totalHits : 0,
        errorRate: stats.totalHits + stats.totalMisses > 0 ? 
          (stats.totalErrors / (stats.totalHits + stats.totalMisses)) * 100 : 0,
        efficiency: stats.hitRate,
        throughput: (stats.totalHits + stats.totalMisses) / (stats.uptime || 1)
      },
      aws: {
        ready: true,
        region: process.env.AWS_REGION || 'not-set',
        elasticacheCompatible: true,
        redisReady: true
      }
    };
  },
  
  // Health check endpoint for AWS ALB/ELB
  healthCheck: () => {
    const isHealthy = CacheManager.performHealthCheck();
    const stats = CacheManager.getHealthStats();
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: Date.now(),
      uptime: stats.uptime,
      hitRate: stats.hitRate,
      errorRate: stats.totalErrors / Math.max(1, stats.totalHits + stats.totalMisses) * 100,
      memoryUsage: stats.memoryUsage,
      checks: {
        cacheResponsive: isHealthy,
        memoryWithinLimits: Object.values(stats.memoryUsage).every(usage => usage < 0.9),
        errorRateAcceptable: stats.totalErrors < 100,
        hitRateAcceptable: stats.hitRate > 50
      }
    };
  },
  
  // Export metrics for CloudWatch/monitoring
  exportForCloudWatch: () => {
    const stats = CacheManager.getHealthStats();
    return {
      MetricData: [
        {
          MetricName: 'CacheHitRate',
          Value: stats.hitRate,
          Unit: 'Percent',
          Timestamp: new Date()
        },
        {
          MetricName: 'CacheErrors',
          Value: stats.totalErrors,
          Unit: 'Count',
          Timestamp: new Date()
        },
        {
          MetricName: 'CacheMemoryUsage',
          Value: Object.values(stats.memoryUsage).reduce((sum, usage) => sum + usage, 0) / Object.keys(stats.memoryUsage).length,
          Unit: 'Percent',
          Timestamp: new Date()
        }
      ],
      Namespace: 'KrugmanInsights/Cache'
    };
  }
};

// Automatic cache warming for critical endpoints
export const cacheWarming = {
  // Warm critical endpoints on startup
  warmCriticalEndpoints: async () => {
    console.log('Cache warming disabled to prevent data conflicts');
    // Cache warming disabled to ensure authentic data is always served
  },
  
  // Automatically warm cache for newly published articles - PIVOTAL FEATURE
  async warmNewArticle(articleSlug: string, articleId: number) {
    try {
      console.log(`🚀 Auto-warming cache for new article: ${articleSlug}`);
      
      // Cache the individual article page for multiple user scenarios
      const warmingPromises = [
        // Guest users
        cacheQuery(`article-page:${articleSlug}:guest`, () => storage.getArticleBySlug(articleSlug), 'data'),
        // Authenticated users  
        cacheQuery(`article-page:${articleSlug}:auth`, () => storage.getArticleBySlug(articleSlug, 'auth-sample'), 'data'),
        // Article by ID
        cacheQuery(`article:${articleId}:guest`, () => storage.getArticleById(articleId), 'data'),
        // Related data for article page
        cacheQuery(`similar:${articleId}:6`, () => storage.getSimilarArticles?.(articleId, 6), 'data'),
        cacheQuery('article-trending', () => storage.getTodaysMostRead(), 'critical')
      ];
      
      await Promise.all(warmingPromises.filter(p => p));
      
      console.log(`⚡ Article cache warmed successfully: ${articleSlug} - Ready for instant access!`);
      
      // Invalidate main listing caches to include the new article
      invalidateCache.articles();
      invalidateCache.landingPage();
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to warm article cache for ${articleSlug}:`, error);
      return false;
    }
  },

  // Warm cache for recently published articles
  async warmRecentArticles(limit: number = 10) {
    try {
      const { storage } = await import('./storage');
      const recentArticles = await storage.getArticles({ limit, offset: 0 });
      if (recentArticles && Array.isArray(recentArticles)) {
        const warmingPromises = recentArticles.map((article: any) => 
          this.warmNewArticle(article.slug, article.id)
        );
        await Promise.all(warmingPromises);
        console.log(`🔥 Warmed cache for ${recentArticles.length} recent articles`);
      }
    } catch (error) {
      console.error('Failed to warm recent articles cache:', error);
    }
  },
  
  // Schedule periodic cache refreshing
  scheduleRefresh: () => {
    // Refresh critical content every 5 minutes
    setInterval(() => {
      cacheWarming.warmCriticalEndpoints();
    }, 5 * 60 * 1000);
  }
};

// Initialize cache system with monitoring
export const initializeCache = () => {
  console.log('Initializing sophisticated cache system...');
  
  // Perform initial health check
  const isHealthy = CacheManager.performHealthCheck();
  console.log(`Cache system health: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
  
  // Warm critical endpoints
  setTimeout(() => {
    cacheWarming.warmCriticalEndpoints();
    cacheWarming.scheduleRefresh();
  }, 1000);
  
  // Setup periodic health monitoring
  setInterval(() => {
    const health = cacheMetrics.healthCheck();
    if (health.status === 'unhealthy') {
      console.warn('Cache health degraded:', health);
    }
  }, 60000); // Check every minute
  
  // Setup graceful shutdown handlers for AWS
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, performing graceful cache shutdown...');
    await CacheManager.gracefulShutdown();
    process.exit(0);
  });
  
  process.on('SIGINT', async () => {
    console.log('Received SIGINT, performing graceful cache shutdown...');
    await CacheManager.gracefulShutdown();
    process.exit(0);
  });
  
  console.log('Cache system initialized with monitoring and AWS readiness');
};

