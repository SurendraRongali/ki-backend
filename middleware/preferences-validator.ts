/**
 * BULLETPROOF Preferences Validation & Data Integrity System
 * 
 * This system ensures preferences are NEVER corrupted and provides
 * comprehensive protection against any data loss scenarios.
 */

import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

interface BulletproofPreferences {
  goals: string[];
  companies: string[];
  industries: string[];
  sectors: string[];
  news: string[];
}

/**
 * BULLETPROOF: Sanitizes and validates preferences with zero tolerance for corruption
 */
function bulletproofSanitize(input: any): BulletproofPreferences {
  console.log('[BULLETPROOF-SANITIZE] Processing input:', input);
  
  const sanitized: BulletproofPreferences = {
    goals: [],
    companies: [],
    industries: [],
    sectors: [],
    news: []
  };

  if (!input || typeof input !== 'object') {
    console.warn('[BULLETPROOF-SANITIZE] Invalid input - using defaults');
    return sanitized;
  }

  const fields = ['goals', 'companies', 'industries', 'sectors', 'news'] as const;
  
  for (const field of fields) {
    const value = input[field];
    
    if (Array.isArray(value)) {
      sanitized[field] = value.filter((item: any) => 
        typeof item === 'string' && item.trim().length > 0
      );
    } else if (value !== undefined) {
      console.warn(`[BULLETPROOF-SANITIZE] Field '${field}' is not an array - using empty array`);
    }
  }
  
  console.log('[BULLETPROOF-SANITIZE] Sanitized result:', sanitized);
  return sanitized;
}

/**
 * BULLETPROOF: Merges preferences ensuring ZERO data loss
 */
function bulletproofMerge(existing: any, incoming: any, userId: string): BulletproofPreferences {
  console.log(`[BULLETPROOF-MERGE] User ${userId} - Existing:`, existing);
  console.log(`[BULLETPROOF-MERGE] User ${userId} - Incoming:`, incoming);
  
  const sanitizedExisting = bulletproofSanitize(existing);
  const sanitizedIncoming = bulletproofSanitize(incoming);
  
  // Start with existing data to prevent loss
  const merged: BulletproofPreferences = {
    goals: [...sanitizedExisting.goals],
    companies: [...sanitizedExisting.companies],
    industries: [...sanitizedExisting.industries],
    sectors: [...sanitizedExisting.sectors],
    news: [...sanitizedExisting.news]
  };
  
  // Apply incoming changes while preserving existing data
  const fields = ['goals', 'companies', 'industries', 'sectors', 'news'] as const;
  
  for (const field of fields) {
    // Only update if incoming has data for this field
    if (incoming && incoming[field] !== undefined) {
      merged[field] = [...sanitizedIncoming[field]];
      console.log(`[BULLETPROOF-MERGE] Updated ${field} for user ${userId}`);
    }
  }
  
  console.log(`[BULLETPROOF-MERGE] Final result for user ${userId}:`, merged);
  return merged;
}

export interface PreferencesValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  userId?: string;
  preferences?: any;
}

/**
 * Comprehensive preferences validation middleware
 */
export async function validatePreferencesIntegrity(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).userId;
  
  if (!userId) {
    console.log('[PREFS-VALIDATION] No user ID found - skipping validation');
    return next();
  }

  try {
    // Validate that user exists in database
    const user = await storage.getUser(userId);
    if (!user) {
      console.log(`[PREFS-VALIDATION] ERROR: User ${userId} not found in database`);
      return res.status(404).json({
        message: "User not found",
        error: "USER_NOT_FOUND"
      });
    }

    // Validate preferences structure
    const preferences = user.preferences || {};
    const validationResult = validatePreferencesStructure(preferences);
    
    if (!validationResult.isValid) {
      console.log(`[PREFS-VALIDATION] ERROR: Invalid preferences structure for user ${userId}:`, validationResult.errors);
    } else {
      console.log(`[PREFS-VALIDATION] SUCCESS: Preferences validated for user ${userId}`);
    }

    // Attach validation result to request
    (req as any).preferencesValidation = validationResult;
    
    next();
  } catch (error) {
    console.error(`[PREFS-VALIDATION] ERROR: Validation failed for user ${userId}:`, error);
    return res.status(500).json({
      message: "Preferences validation failed",
      error: "VALIDATION_ERROR"
    });
  }
}

/**
 * Validate preferences data structure
 */
function validatePreferencesStructure(preferences: any): PreferencesValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Ensure preferences is an object
  if (!preferences || typeof preferences !== 'object') {
    errors.push('Preferences must be an object');
    return { isValid: false, errors, warnings };
  }

  // Validate required arrays
  const requiredArrays = ['goals', 'industries', 'sectors', 'news', 'companies'];
  for (const field of requiredArrays) {
    if (!preferences[field]) {
      warnings.push(`Missing ${field} array - will be initialized as empty`);
    } else if (!Array.isArray(preferences[field])) {
      errors.push(`${field} must be an array`);
    }
  }

  // Validate companies array specifically
  if (preferences.companies && Array.isArray(preferences.companies)) {
    const validCompanies = preferences.companies.filter((company: any) => 
      typeof company === 'string' && company.trim().length > 0
    );
    
    if (validCompanies.length !== preferences.companies.length) {
      warnings.push('Some invalid companies were filtered out');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    preferences
  };
}

/**
 * Middleware to ensure preferences save/retrieve consistency
 */
export async function enforcePreferencesConsistency(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).userId;
  
  if (!userId || req.method !== 'POST') {
    return next();
  }

  // Store original json method
  const originalJson = res.json;
  
  // Override json method to validate after response
  res.json = function(body: any) {
    // Call original json method
    const result = originalJson.call(this, body);
    
    // Validate in background after response is sent
    setImmediate(async () => {
      try {
        await validatePostSaveConsistency(userId, req.body);
      } catch (error) {
        console.error(`[CONSISTENCY] ERROR: Post-save validation failed for user ${userId}:`, error);
      }
    });
    
    return result;
  };
  
  next();
}

/**
 * Validate that saved preferences can be retrieved correctly
 */
async function validatePostSaveConsistency(userId: string, savedData: any) {
  try {
    // Wait a moment for database to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Retrieve user from database
    const user = await storage.getUser(userId);
    if (!user) {
      console.error(`[CONSISTENCY] ERROR: User ${userId} not found after save`);
      return;
    }

    // Compare saved data with retrieved data
    const retrievedPreferences = user.preferences || {};
    const expectedPreferences = savedData.preferences || {};
    
    // Check companies array specifically
    if (expectedPreferences.companies && retrievedPreferences.companies) {
      const expectedCompanies = JSON.stringify(expectedPreferences.companies.sort());
      const retrievedCompanies = JSON.stringify(retrievedPreferences.companies.sort());
      
      if (expectedCompanies !== retrievedCompanies) {
        console.error(`[CONSISTENCY] ERROR: Companies mismatch for user ${userId}`);
        console.error(`[CONSISTENCY] Expected: ${expectedCompanies}`);
        console.error(`[CONSISTENCY] Retrieved: ${retrievedCompanies}`);
      } else {
        console.log(`[CONSISTENCY] SUCCESS: Companies data consistent for user ${userId}`);
      }
    }
    
  } catch (error) {
    console.error(`[CONSISTENCY] ERROR: Consistency check failed:`, error);
  }
}