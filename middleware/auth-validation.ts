/**
 * Bulletproof Authentication & User ID Validation Middleware
 * 
 * This middleware ensures consistent user identification across all endpoints
 * and prevents the session/authentication mismatch that caused the follow button issue.
 */

import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userInfo?: {
    id: string;
    email: string;
    method: 'session' | 'passport' | 'fallback';
  };
}

/**
 * Comprehensive user ID extraction middleware
 * This ensures ALL endpoints get the user ID consistently
 */
export function extractUserId(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let userId: string | undefined;
  let method: 'session' | 'passport' | 'fallback' = 'fallback';
  let email: string | undefined;

  // Method 1: Session-based authentication
  if ((req.session as any)?.userId) {
    userId = (req.session as any).userId;
    method = 'session';
    console.log(`[AUTH] User ID from session: ${userId}`);
  }

  // Method 2: Passport authentication (fallback)
  if (!userId && req.isAuthenticated && req.isAuthenticated()) {
    const authenticatedUser = req.user as any;
    // CRITICAL: Block OAuth users who need subscription from being authenticated
    if (authenticatedUser?.needsSubscription) {
      console.log(`[AUTH] OAuth user blocked - requires subscription: ${authenticatedUser.oauthData?.email}`);
      // Clear any authentication state
      req.user = undefined;
      if (req.logout) {
        req.logout((err) => {
          if (err) console.error('Logout error:', err);
        });
      }
    } else if (authenticatedUser?.id) {
      userId = authenticatedUser.id;
      email = authenticatedUser.email;
      method = 'passport';
      console.log(`[AUTH] User ID from passport: ${userId}`);
    }
  }

  // Attach user info to request
  if (userId) {
    req.userId = userId;
    req.userInfo = {
      id: userId,
      email: email || 'unknown',
      method
    };
    console.log(`[AUTH] User authenticated via ${method}: ${userId}`);
  } else {
    console.log(`[AUTH] No user authentication found`);
  }

  next();
}

/**
 * Middleware to ensure endpoint has authenticated user
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    console.log(`[AUTH] Access denied - no user ID found`);
    return res.status(401).json({ 
      message: "Authentication required",
      error: "USER_NOT_AUTHENTICATED" 
    });
  }
  
  console.log(`[AUTH] Access granted for user: ${req.userId}`);
  next();
}

/**
 * Validation middleware for user preferences endpoints
 */
export function validatePreferencesAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    console.log(`[PREFERENCES] Access denied - authentication required`);
    return res.status(401).json({ 
      message: "Please log in to access preferences",
      error: "PREFERENCES_AUTH_REQUIRED" 
    });
  }
  
  console.log(`[PREFERENCES] Access granted for user: ${req.userId} via ${req.userInfo?.method}`);
  next();
}

/**
 * Debug middleware to log all authentication attempts
 */
export function debugAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const sessionUserId = (req.session as any)?.userId;
  const passportUser = req.isAuthenticated?.() ? (req.user as any)?.id : null;
  
  console.log(`[AUTH-DEBUG] ${req.method} ${req.path}`);
  console.log(`[AUTH-DEBUG] Session userId: ${sessionUserId || 'none'}`);
  console.log(`[AUTH-DEBUG] Passport userId: ${passportUser || 'none'}`);
  console.log(`[AUTH-DEBUG] Final userId: ${req.userId || 'none'}`);
  console.log(`[AUTH-DEBUG] Method: ${req.userInfo?.method || 'none'}`);
  
  next();
}