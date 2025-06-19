import { randomBytes } from "crypto";
import { storage } from "./storage";
import { sendEmail as sendEmailResend } from "./resend";
import dotenv from 'dotenv';
dotenv.config();

interface MagicLinkToken {
  token: string;
  email: string;
  expiresAt: Date;
}

const magicLinks = new Map<string, MagicLinkToken>();

// Clean up expired tokens every 30 minutes
setInterval(() => {
  const now = new Date();
  Array.from(magicLinks.entries()).forEach(([token, data]) => {
    if (data.expiresAt < now) {
      magicLinks.delete(token);
    }
  });
}, 30 * 60 * 1000);

export async function generateMagicLink(email: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  
  magicLinks.set(token, { token, email, expiresAt });
  
  const magicLinkUrl = `${process.env.NODE_ENV === 'production' ? 'https://krugmaninsights.com' : 'http://localhost:5000'}/auth/magic-link?token=${token}`;
  
  // Send magic link email
  await sendEmailResend({
    to: email,
    from: "support@krugmaninsights.com",
    subject: "Your Krugman Insights Login Link",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://krugmaninsights.com/logo.png" alt="Krugman Insights" style="height: 40px;">
        </div>
        
        <h2 style="color: #1a1a1a; margin-bottom: 20px;">Sign in to Krugman Insights</h2>
        
        <p style="color: #666; margin-bottom: 25px;">
          Click the button below to securely sign in to your account. This link will expire in 15 minutes.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${magicLinkUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Sign In Now
          </a>
        </div>
        
        <p style="color: #888; font-size: 14px; margin-top: 30px;">
          If you didn't request this login link, you can safely ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #888; font-size: 12px; text-align: center;">
          Krugman Insights - Premium Financial Intelligence
        </p>
      </div>
    `
  });
  
  return token;
}

export function validateMagicLink(token: string): string | null {
  const data = magicLinks.get(token);
  
  if (!data || data.expiresAt < new Date()) {
    magicLinks.delete(token);
    return null;
  }
  
  const email = data.email;
  magicLinks.delete(token); // One-time use
  return email;
}