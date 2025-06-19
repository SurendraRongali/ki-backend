import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { db } from './db';
import { adminAccounts, verificationCodes, adminSessions } from './shared/schema';
import { eq, and, gt, lt } from 'drizzle-orm';
import { smsService } from './sms-service';

const SALT_ROUNDS = 12;
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const VERIFICATION_CODE_DURATION = 5 * 60 * 1000; // 5 minutes

interface LoginAttempt {
  username: string;
  password: string;
}

interface VerificationAttempt {
  username: string;
  code: string;
}

export class AdminAuthService {
  // Hash password for storage
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  // Verify password against hash
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate random 6-digit verification code
  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Generate secure session token
  static generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Create admin account (for initial setup)
  static async createAdminAccount(username: string, password: string, phoneNumber: string) {
    const hashedPassword = await this.hashPassword(password);
    
    const [admin] = await db.insert(adminAccounts).values({
      username,
      password: hashedPassword,
      phoneNumber,
      isActive: true,
    }).returning();

    return admin;
  }

  // Step 1: Verify username and password, send SMS code
  static async initiateLogin(attempt: LoginAttempt): Promise<{ success: boolean; message: string; requiresVerification?: boolean }> {
    try {
      // Find admin account
      const [admin] = await db
        .select()
        .from(adminAccounts)
        .where(and(
          eq(adminAccounts.username, attempt.username),
          eq(adminAccounts.isActive, true)
        ));

      if (!admin) {
        return { success: false, message: 'Invalid credentials' };
      }

      // Verify password
      const passwordValid = await this.verifyPassword(attempt.password, admin.password);
      if (!passwordValid) {
        return { success: false, message: 'Invalid credentials' };
      }

      // Generate and store verification code
      const code = this.generateVerificationCode();
      const expiresAt = new Date(Date.now() + VERIFICATION_CODE_DURATION);

      await db.insert(verificationCodes).values({
        adminId: admin.id,
        code,
        phoneNumber: admin.phoneNumber,
        expiresAt,
        isUsed: false,
      });

      // Send SMS verification code
      if (smsService.isConfigured()) {
        const smsSent = await smsService.sendVerificationCode(admin.phoneNumber, code);
        if (!smsSent) {
          return { success: false, message: 'Failed to send verification code' };
        }
      } else {
        console.log(`SMS not configured. Verification code: ${code}`);
      }

      return { 
        success: true, 
        message: 'Verification code sent to your phone',
        requiresVerification: true 
      };

    } catch (error) {
      console.error('Login initiation error:', error);
      return { success: false, message: 'Login failed' };
    }
  }

  // Step 2: Verify SMS code and complete login
  static async completeLogin(attempt: VerificationAttempt): Promise<{ success: boolean; message: string; sessionToken?: string }> {
    try {
      // Find admin account
      const [admin] = await db
        .select()
        .from(adminAccounts)
        .where(and(
          eq(adminAccounts.username, attempt.username),
          eq(adminAccounts.isActive, true)
        ));

      if (!admin) {
        return { success: false, message: 'Invalid session' };
      }

      // Find valid verification code
      const [verification] = await db
        .select()
        .from(verificationCodes)
        .where(and(
          eq(verificationCodes.adminId, admin.id),
          eq(verificationCodes.code, attempt.code),
          eq(verificationCodes.isUsed, false),
          gt(verificationCodes.expiresAt, new Date())
        ))
        .orderBy(verificationCodes.createdAt);

      if (!verification) {
        return { success: false, message: 'Invalid or expired verification code' };
      }

      // Mark verification code as used
      await db
        .update(verificationCodes)
        .set({ isUsed: true })
        .where(eq(verificationCodes.id, verification.id));

      // Create session token
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date(Date.now() + SESSION_DURATION);

      await db.insert(adminSessions).values({
        adminId: admin.id,
        sessionToken,
        expiresAt,
        isActive: true,
      });

      // Update last login
      await db
        .update(adminAccounts)
        .set({ lastLogin: new Date() })
        .where(eq(adminAccounts.id, admin.id));

      return {
        success: true,
        message: 'Login successful',
        sessionToken
      };

    } catch (error) {
      console.error('Login completion error:', error);
      return { success: false, message: 'Verification failed' };
    }
  }

  // Verify session token for authenticated requests
  static async verifySession(sessionToken: string): Promise<{ valid: boolean; adminId?: number }> {
    try {
      const [session] = await db
        .select({
          adminId: adminSessions.adminId,
          isActive: adminSessions.isActive,
          expiresAt: adminSessions.expiresAt,
        })
        .from(adminSessions)
        .where(and(
          eq(adminSessions.sessionToken, sessionToken),
          eq(adminSessions.isActive, true),
          gt(adminSessions.expiresAt, new Date())
        ));

      if (!session) {
        return { valid: false };
      }

      return { valid: true, adminId: session.adminId };

    } catch (error) {
      console.error('Session verification error:', error);
      return { valid: false };
    }
  }

  // Logout - invalidate session
  static async logout(sessionToken: string): Promise<boolean> {
    try {
      await db
        .update(adminSessions)
        .set({ isActive: false })
        .where(eq(adminSessions.sessionToken, sessionToken));

      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  // Clean up expired codes and sessions
  static async cleanup(): Promise<void> {
    try {
      const now = new Date();
      
      // Clean up expired verification codes
      await db
        .delete(verificationCodes)
        .where(and(
          eq(verificationCodes.isUsed, true)
        ));

      // Clean up expired sessions
      await db
        .update(adminSessions)
        .set({ isActive: false })
        .where(lt(adminSessions.expiresAt, now));

    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

// Run cleanup every hour
setInterval(() => {
  AdminAuthService.cleanup();
}, 60 * 60 * 1000);