import { randomBytes } from 'crypto';

/**
 * Generates a cryptographically secure 6-digit verification code
 * Uses Node.js crypto.randomBytes for true randomness
 */
export function generateSecureVerificationCode(): string {
  // Generate 4 random bytes (32 bits)
  const buffer = randomBytes(4);
  
  // Convert to integer and ensure it's 6 digits
  const number = buffer.readUInt32BE(0);
  
  // Ensure 6-digit code (100000 to 999999)
  const code = (number % 900000) + 100000;
  
  return code.toString();
}

/**
 * Validates email domain for student verification
 * Checks against common educational domains
 */
export function isValidStudentEmail(email: string): boolean {
  const studentDomains = [
    '.edu',           // US educational institutions
    '.ac.uk',         // UK academic institutions
    '.edu.au',        // Australian educational institutions
    '.edu.ca',        // Canadian educational institutions
    '.student.',      // Generic student domains
    'university.',    // University domains
    'college.',       // College domains
    'school.',        // School domains
    '.uni-',          // German university pattern
    '.univ-',         // French university pattern
  ];
  
  const emailLower = email.toLowerCase();
  
  return studentDomains.some(domain => 
    emailLower.includes(domain) || emailLower.endsWith(domain.replace('.', ''))
  );
}

/**
 * Creates expiration date for verification code (15 minutes from now)
 */
export function createExpirationDate(): Date {
  const expiration = new Date();
  expiration.setMinutes(expiration.getMinutes() + 15);
  return expiration;
}

/**
 * Checks if a verification code has expired
 */
export function isCodeExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Rate limiting for verification attempts
 * Returns true if too many attempts have been made
 */
export function isRateLimited(email: string, attempts: number, timeWindow: number = 60000): boolean {
  // Allow maximum 3 attempts per minute per email
  return attempts >= 3;
}