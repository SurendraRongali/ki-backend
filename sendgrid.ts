import { MailService } from '@sendgrid/mail';
import dotenv from 'dotenv';
dotenv.config();

// Make SendGrid optional - only initialize if API key is provided
let mailService: MailService | null = null;

if (process.env.SENDGRID_API_KEY) {
  mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✅ SendGrid email service initialized');
} else {
  console.log('📧 SendGrid API key not provided - email features will be disabled');
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!mailService) {
    console.log('📧 Email service not available - SendGrid API key not configured');
    return false;
  }
  
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export function generateInvitationEmail(
  recipientEmail: string,
  companyName: string,
  invitationToken: string,
  baseUrl: string
): EmailParams {
  const invitationLink = `${baseUrl}/invitation/accept?token=${invitationToken}`;
  
  const subject = `Invitation to join ${companyName} on Krugman Insights`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Corporate Invitation - Krugman Insights</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #8B1538; padding: 20px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Krugman Insights</h1>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
        <h2 style="color: #8B1538; margin-top: 0;">You've been invited to join ${companyName}</h2>
        
        <p>Hello,</p>
        
        <p>You have been invited to join <strong>${companyName}</strong> on Krugman Insights, the premier platform for financial news and insights.</p>
        
        <p>As a corporate member, you'll have access to:</p>
        <ul>
          <li>Premium financial content and analysis</li>
          <li>Exclusive industry reports</li>
          <li>Real-time market insights</li>
          <li>Corporate dashboard and analytics</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationLink}" 
             style="background-color: #8B1538; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Accept Invitation & Set Password
          </a>
        </div>
        
        <p><small>This invitation will expire in 7 days. If you have any questions, please contact our support team.</small></p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
        <p>© 2024 Krugman Insights. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    You've been invited to join ${companyName} on Krugman Insights
    
    Hello,
    
    You have been invited to join ${companyName} on Krugman Insights, the premier platform for financial news and insights.
    
    Please click the following link to accept your invitation and set up your password:
    ${invitationLink}
    
    This invitation will expire in 7 days.
    
    Best regards,
    The Krugman Insights Team
  `;
  
  return {
    to: recipientEmail,
    from: 'noreply@krugmaninsights.com', // You can customize this
    subject,
    html,
    text
  };
}

export async function sendPasswordResetEmail(email: string, firstName: string, resetLink: string): Promise<boolean> {
  const resetEmailParams = generatePasswordResetEmail(email, firstName, resetLink);
  return await sendEmail(resetEmailParams);
}

export function generatePasswordResetEmail(
  recipientEmail: string,
  firstName: string,
  resetLink: string
): EmailParams {
  const subject = "Reset Your Krugman Insights Password";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .header { 
          background: #8B1538; 
          color: white; 
          text-align: center; 
          padding: 20px; 
          border-radius: 8px 8px 0 0; 
        }
        .content { 
          background: #f9f9f9; 
          padding: 30px; 
          border-radius: 0 0 8px 8px; 
        }
        .button { 
          display: inline-block; 
          background: #8B1538; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0; 
          font-weight: bold; 
        }
        .footer { 
          text-align: center; 
          margin-top: 20px; 
          color: #666; 
          font-size: 14px; 
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Krugman Insights</h1>
      </div>
      <div class="content">
        <h2>Password Reset Request</h2>
        <p>Hello ${firstName},</p>
        <p>We received a request to reset the password for your Krugman Insights account.</p>
        <p>Click the button below to reset your password:</p>
        <p style="text-align: center;">
          <a href="${resetLink}" class="button">Reset Password</a>
        </p>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
        <p>Best regards,<br>The Krugman Insights Team</p>
      </div>
      <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>If you're having trouble with the button above, copy and paste this URL into your browser:</p>
        <p style="word-break: break-all;">${resetLink}</p>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    Hello ${firstName},
    
    We received a request to reset the password for your Krugman Insights account.
    
    Click the link below to reset your password:
    ${resetLink}
    
    This link will expire in 1 hour for security reasons.
    
    If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
    
    Best regards,
    The Krugman Insights Team
  `;

  return {
    to: recipientEmail,
    from: 'support@krugmaninsights.com',
    subject,
    text,
    html,
  };
}