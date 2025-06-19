import Mailgun from "mailgun.js";
import formData from "form-data";
import dotenv from 'dotenv';
dotenv.config();

// Initialize Mailgun client
const mailgun = new Mailgun(formData);

if (!process.env.MAILGUN_API_KEY) {
  console.warn('MAILGUN_API_KEY not configured - email functionality will be limited');
}

if (!process.env.MAILGUN_DOMAIN) {
  console.warn('MAILGUN_DOMAIN not configured - using default domain');
}

const mg = process.env.MAILGUN_API_KEY ? mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY!,
  url: 'https://api.eu.mailgun.net' // EU endpoint for European users
}) : null;

const domain = process.env.MAILGUN_DOMAIN || 'sandbox.mailgun.org';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, from, text }: EmailOptions) {
  try {
    const fromAddress = from || `Krugman Insights <noreply@${domain}>`;
    
    const messageData = {
      from: fromAddress,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    if (!mg) {
      console.warn('Mailgun not configured - email would be sent to:', to);
      return { id: 'simulated', status: 'Email simulated (Mailgun not configured)' };
    }

    const response = await mg.messages.create(domain, messageData);
    console.log('Email sent successfully via Mailgun:', response.id);
    return response;
  } catch (error) {
    console.error('Failed to send email via Mailgun:', error);
    throw error;
  }
}

// Welcome email for new users
export async function sendWelcomeEmail(userEmail: string, userName: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Krugman Insights</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc2626; margin: 0; font-size: 28px; font-weight: bold;">Welcome to Krugman Insights</h1>
          <p style="color: #6b7280; margin-top: 10px; font-size: 16px;">Premium Financial Intelligence & Market Analysis</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px;">Hello ${userName},</h2>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            Welcome to Krugman Insights, your premier destination for sophisticated financial analysis and market intelligence.
          </p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 6px; border-left: 4px solid #dc2626; margin: 20px 0;">
            <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 16px;">What's Next?</h3>
            <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
              <li>Explore our Featured Analysis section</li>
              <li>Save articles to your personal collection</li>
              <li>Access exclusive market insights</li>
              <li>Stay updated with real-time financial news</li>
            </ul>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NODE_ENV === 'production' ? 'https://krugmaninsights.com' : 'http://localhost:5000'}" 
             style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Start Reading
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
          <p>© 2024 Krugman Insights. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: 'Welcome to Krugman Insights',
    html
  });
}

// Password reset email
export async function sendPasswordResetEmail(userEmail: string, resetToken: string) {
  const resetUrl = `${process.env.NODE_ENV === 'production' ? 'https://krugmaninsights.com' : 'http://localhost:5000'}/reset-password?token=${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc2626; margin: 0; font-size: 28px; font-weight: bold;">Reset Your Password</h1>
        </div>
        
        <div style="margin-bottom: 30px;">
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            We received a request to reset your password for your Krugman Insights account.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            If you didn't request this password reset, please ignore this email. This link will expire in 24 hours.
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
          <p>© 2024 Krugman Insights. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: 'Reset Your Password - Krugman Insights',
    html
  });
}

// Password change confirmation email
export async function sendPasswordChangeConfirmationEmail(userEmail: string, userName: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Changed Successfully</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #059669; margin: 0; font-size: 28px; font-weight: bold;">Password Changed</h1>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px;">Hello ${userName},</h2>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            Your password has been successfully changed for your Krugman Insights account.
          </p>
          
          <div style="background-color: #ecfdf5; padding: 20px; border-radius: 6px; border-left: 4px solid #059669; margin: 20px 0;">
            <p style="color: #065f46; margin: 0; font-weight: 600;">
              If you didn't make this change, please contact our support team immediately.
            </p>
          </div>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
          <p>© 2024 Krugman Insights. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: 'Password Changed Successfully - Krugman Insights',
    html
  });
}

// Newsletter welcome email
export async function sendNewsletterWelcome(userEmail: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Our Newsletter</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc2626; margin: 0; font-size: 28px; font-weight: bold;">Welcome to Our Newsletter</h1>
        </div>
        
        <div style="margin-bottom: 30px;">
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            Thank you for subscribing to the Krugman Insights newsletter! You'll now receive our latest financial analysis and market insights directly in your inbox.
          </p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 6px; border-left: 4px solid #dc2626; margin: 20px 0;">
            <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 16px;">What to Expect:</h3>
            <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
              <li>Weekly market analysis and trends</li>
              <li>Exclusive insights from our analysts</li>
              <li>Breaking financial news alerts</li>
              <li>Investment opportunities and recommendations</li>
            </ul>
          </div>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
          <p>© 2024 Krugman Insights. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: 'Welcome to Krugman Insights Newsletter',
    html
  });
}

// Student verification email
export async function sendStudentVerificationEmail(userEmail: string, verificationCode: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Student Status</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 28px; font-weight: bold;">Student Verification</h1>
        </div>
        
        <div style="margin-bottom: 30px;">
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            Please use the verification code below to confirm your student status and access our student pricing:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; font-family: monospace; font-size: 24px; font-weight: bold; color: #1e40af; letter-spacing: 4px;">
              ${verificationCode}
            </div>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            This verification code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
          <p>© 2024 Krugman Insights. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: 'Verify Your Student Status - Krugman Insights',
    html
  });
}

// Article purchase email
export async function sendArticlePurchaseEmail(userEmail: string, articleTitle: string, userName: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Article Purchase Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #059669; margin: 0; font-size: 28px; font-weight: bold;">Purchase Confirmed</h1>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px;">Hello ${userName},</h2>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            Thank you for your purchase! You now have access to:
          </p>
          
          <div style="background-color: #ecfdf5; padding: 20px; border-radius: 6px; border-left: 4px solid #059669; margin: 20px 0;">
            <h3 style="color: #065f46; margin: 0 0 10px 0; font-size: 16px;">${articleTitle}</h3>
            <p style="color: #047857; margin: 0;">This article is now available in your account.</p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NODE_ENV === 'production' ? 'https://krugmaninsights.com' : 'http://localhost:5000'}" 
             style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Read Now
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
          <p>© 2024 Krugman Insights. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: `Purchase Confirmed: ${articleTitle}`,
    html
  });
}

// Corporate invitation email
export async function generateInvitationEmail(email: string, companyName: string, inviterName: string, invitationToken: string) {
  const inviteUrl = `${process.env.NODE_ENV === 'production' ? 'https://krugmaninsights.com' : 'http://localhost:5000'}/corporate-signup?token=${invitationToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Corporate Invitation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #7c3aed; margin: 0; font-size: 28px; font-weight: bold;">Corporate Invitation</h1>
        </div>
        
        <div style="margin-bottom: 30px;">
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            You've been invited by ${inviterName} to join ${companyName}'s corporate account on Krugman Insights.
          </p>
          
          <div style="background-color: #faf5ff; padding: 20px; border-radius: 6px; border-left: 4px solid #7c3aed; margin: 20px 0;">
            <h3 style="color: #7c3aed; margin: 0 0 10px 0; font-size: 16px;">Corporate Benefits:</h3>
            <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
              <li>Access to premium financial analysis</li>
              <li>Team collaboration features</li>
              <li>Priority customer support</li>
              <li>Advanced market intelligence tools</li>
            </ul>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${inviteUrl}" 
             style="background-color: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
          <p>© 2024 Krugman Insights. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Invitation to join ${companyName} on Krugman Insights`,
    html
  });
}

// Gift article email
export async function sendGiftArticleEmail(recipientEmail: string, articleTitle: string, senderName: string, message?: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You've Received a Gift Article</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 28px; font-weight: bold;">🎁 Gift Article</h1>
        </div>
        
        <div style="margin-bottom: 30px;">
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            ${senderName} has gifted you an exclusive article from Krugman Insights:
          </p>
          
          <div style="background-color: #fffbeb; padding: 20px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">${articleTitle}</h3>
            ${message ? `<p style="color: #78350f; margin: 10px 0; font-style: italic;">"${message}"</p>` : ''}
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NODE_ENV === 'production' ? 'https://krugmaninsights.com' : 'http://localhost:5000'}" 
             style="background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Read Your Gift
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
          <p>© 2024 Krugman Insights. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `${senderName} gifted you an article: ${articleTitle}`,
    html
  });
}

export { mg as mailgunClient, domain as mailgunDomain };