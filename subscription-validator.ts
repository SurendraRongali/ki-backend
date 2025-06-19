/**
 * CRITICAL: Subscription Access Validator
 * This module ensures NO paying user is EVER denied access to premium content
 * or platform features. This is the single source of truth for access control.
 */

export interface User {
  id: string;
  email: string;
  subscriptionTier?: string | null;
  subscriptionStatus?: string | null;
  corporateId?: number | null;
}

export interface AccessValidationResult {
  hasAccess: boolean;
  reason: string;
  userTier: string | null;
  userStatus: string | null;
  validationMethod: string;
}

/**
 * COMPREHENSIVE subscription access validator
 * This function is the ONLY place where subscription access decisions are made
 */
export function validateSubscriptionAccess(user: User | null): AccessValidationResult {
  if (!user) {
    return {
      hasAccess: false,
      reason: 'No user provided',
      userTier: null,
      userStatus: null,
      validationMethod: 'NO_USER'
    };
  }

  // Define ALL possible paying subscription tiers
  const PAYING_TIERS = [
    'student', 'monthly', 'annual', 'corporate'
  ];

  // Define active subscription statuses
  const ACTIVE_STATUSES = ['active', 'trialing', 'past_due'];

  const userTier = user.subscriptionTier?.toLowerCase();
  const userStatus = user.subscriptionStatus?.toLowerCase();

  // RULE 1: Any paying tier grants access
  const hasPaidTier = userTier && PAYING_TIERS.includes(userTier);
  
  // RULE 2: Active status grants access
  const hasActiveStatus = userStatus && ACTIVE_STATUSES.includes(userStatus);
  
  // RULE 3: Corporate users always have access
  const isCorporateUser = user.corporateId && user.corporateId > 0;

  // GRANT ACCESS if ANY of these conditions are met:
  const hasAccess = hasPaidTier || hasActiveStatus || isCorporateUser;

  let reason = 'DENIED - No valid subscription';
  let validationMethod = 'STANDARD';

  if (hasAccess) {
    if (hasPaidTier && hasActiveStatus) {
      reason = 'GRANTED - Paid tier with active status';
      validationMethod = 'PAID_TIER_ACTIVE';
    } else if (hasPaidTier) {
      reason = 'GRANTED - Has paid subscription tier';
      validationMethod = 'PAID_TIER';
    } else if (hasActiveStatus) {
      reason = 'GRANTED - Active subscription status';
      validationMethod = 'ACTIVE_STATUS';
    } else if (isCorporateUser) {
      reason = 'GRANTED - Corporate user';
      validationMethod = 'CORPORATE';
    }
  }

  return {
    hasAccess,
    reason,
    userTier: user.subscriptionTier,
    userStatus: user.subscriptionStatus,
    validationMethod
  };
}

/**
 * Validates if user can access premium articles
 */
export function canAccessPremiumContent(user: User | null): boolean {
  const validation = validateSubscriptionAccess(user);
  
  console.log('Premium content access validation:', {
    userId: user?.id,
    email: user?.email,
    subscriptionTier: user?.subscriptionTier,
    subscriptionStatus: user?.subscriptionStatus,
    corporateId: user?.corporateId,
    hasAccess: validation.hasAccess,
    reason: validation.reason,
    method: validation.validationMethod
  });

  return validation.hasAccess;
}

/**
 * Validates if user can save articles
 */
export function canSaveArticles(user: User | null): boolean {
  return canAccessPremiumContent(user);
}

/**
 * Validates if user can follow companies
 * Following companies is available to all authenticated users
 */
export function canFollowCompanies(user: User | null): boolean {
  // Allow all authenticated users to follow companies
  return user !== null;
}

/**
 * Validates if user can access "For You" page
 */
export function canAccessForYouPage(user: User | null): boolean {
  return canAccessPremiumContent(user);
}

/**
 * Validates if user can set preferences
 */
export function canSetPreferences(user: User | null): boolean {
  return canAccessPremiumContent(user);
}

/**
 * Emergency override function - grants access to any authenticated user
 * Use only in case of critical access failures
 */
export function emergencyAccessGrant(user: User | null): boolean {
  if (!user) return false;
  
  console.warn('EMERGENCY ACCESS GRANTED for user:', user.id);
  return true;
}