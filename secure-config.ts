/**
 * Secure Configuration - Protects platform without breaking critical functions
 * Allows Stripe, email services, and all platform features to work properly
 */

import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';

// Rate limiting for different endpoints
export const createRateLimiters = () => ({
  // Authentication endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 25, // 25 attempts per window
    message: { error: 'Too many login attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Newsletter signup
  newsletter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 signups per window
    message: { error: 'Too many newsletter signups, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Contact form
  contact: rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 2, // 2 submissions per window
    message: { error: 'Too many contact submissions, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Payment endpoints - generous limits to avoid losing subscribers
  payment: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 25, // 25 payment attempts per window (generous for subscription retries)
    message: { error: 'Too many payment attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // General API
  api: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: { error: 'Too many requests, please slow down' },
    standardHeaders: true,
    legacyHeaders: false,
  })
});

// Input validation and sanitization
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove potentially dangerous characters but preserve normal content
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

// Email validation
export const validateEmail = (email: string): { valid: boolean; reason?: string } => {
  if (!email || typeof email !== 'string') {
    return { valid: false, reason: 'Invalid email format' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, reason: 'Invalid email format' };
  }

  // Block obvious spam domains
  const spamDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  if (spamDomains.includes(domain)) {
    return { valid: false, reason: 'Disposable email addresses not allowed' };
  }

  return { valid: true };
};

// Secure headers without CSP that blocks critical functions
export const applySecureHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Basic security headers that don't interfere with functionality
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove server header
  res.removeHeader('X-Powered-By');
  
  next();
};

// Content validation
export const validateContent = (content: string): boolean => {
  if (!content || typeof content !== 'string') return false;
  
  // Check for obvious spam patterns
  const spamPatterns = [
    /viagra|cialis|poker|casino/gi,
    /buy now|act fast|limited time/gi,
    /free money|make money fast/gi
  ];
  
  return !spamPatterns.some(pattern => pattern.test(content));
};

// Honeypot validation
export const validateHoneypot = (honeypotValue: any): boolean => {
  return !honeypotValue || honeypotValue.trim() === '';
};