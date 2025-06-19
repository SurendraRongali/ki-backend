/**
 * Bulletproof Cache Prevention & Data Freshness Middleware
 * 
 * This middleware ensures user preferences and critical data endpoints
 * always return fresh data and never serve stale cached responses.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to prevent caching for user-specific data endpoints
 */
export function preventUserDataCaching(req: Request, res: Response, next: NextFunction) {
  // Set comprehensive cache prevention headers
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate, private, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
    'ETag': `"${Date.now()}-${Math.random()}"`, // Force unique response
    'Last-Modified': new Date().toUTCString(),
    'Vary': 'Authorization, Cookie' // Vary by auth state
  });
  
  console.log(`[CACHE-PREVENTION] Applied cache prevention headers to ${req.method} ${req.path}`);
  next();
}

/**
 * Middleware specifically for preferences endpoints
 */
export function preventPreferencesCaching(req: Request, res: Response, next: NextFunction) {
  // Extra aggressive cache prevention for preferences
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate, private, max-age=0, s-maxage=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
    'X-Accel-Expires': '0', // Nginx
    'X-Cache-Control': 'no-cache', // Varnish
    'Edge-Control': 'no-store', // CloudFlare
    'CDN-Cache-Control': 'no-cache', // CDN
    'ETag': `"prefs-${Date.now()}-${Math.random()}"`,
    'Last-Modified': new Date().toUTCString()
  });
  
  console.log(`[PREFS-CACHE-PREVENTION] Applied aggressive cache prevention to ${req.method} ${req.path}`);
  next();
}

/**
 * Middleware to ensure response freshness
 */
export function ensureResponseFreshness(req: Request, res: Response, next: NextFunction) {
  // Store original send method
  const originalSend = res.send;
  
  // Override send method to add freshness indicators
  res.send = function(body: any) {
    // Add timestamp and freshness indicators to response
    if (typeof body === 'object' && body !== null) {
      body._metadata = {
        timestamp: Date.now(),
        fresh: true,
        requestId: `${Date.now()}-${Math.random()}`,
        path: req.path
      };
    }
    
    // Set final freshness headers
    res.set('X-Response-Time', Date.now().toString());
    res.set('X-Fresh-Data', 'true');
    
    console.log(`[FRESHNESS] Response sent with freshness indicators for ${req.path}`);
    return originalSend.call(this, body);
  };
  
  next();
}

/**
 * Middleware to validate no cached responses are being served
 */
export function validateNoCaching(req: Request, res: Response, next: NextFunction) {
  // Store original json method
  const originalJson = res.json;
  
  // Override json method to validate response
  res.json = function(body: any) {
    // Check if response might be cached
    const cacheControl = res.getHeader('Cache-Control');
    if (!cacheControl || !cacheControl.toString().includes('no-cache')) {
      console.warn(`[CACHE-VALIDATION] WARNING: Response may be cacheable for ${req.path}`);
    }
    
    // Log response details
    console.log(`[CACHE-VALIDATION] Response for ${req.path} - Cache-Control: ${cacheControl}`);
    
    return originalJson.call(this, body);
  };
  
  next();
}