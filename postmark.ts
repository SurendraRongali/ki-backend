import * as postmark from 'postmark';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Postmark client - enterprise email service used by Stripe, GitHub, and major fintech
let client: postmark.ServerClient | null = null;

if (process.env.POSTMARK_API_TOKEN) {
  client = new postmark.ServerClient(process.env.POSTMARK_API_TOKEN);
  console.log('✅ Postmark email service initialized (Enterprise-grade delivery)');
} else {
  console.warn('POSTMARK_API_TOKEN not configured - email functionality will be limited');
}

const fromEmail = process.env.POSTMARK_FROM_EMAIL || 'noreply@krugmaninsights.com';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, from, text }: EmailOptions) {
  try {
    if (!client) {
      console.warn('Postmark not configured - email would be sent to:', to);
      return { MessageID: 'simulated', status: 'Email simulated (Postmark not configured)' };
    }

    const result = await client.sendEmail({
      From: from || fromEmail,
      To: to,
      Subject: subject,
      HtmlBody: html,
      TextBody: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      MessageStream: 'outbound',
      TrackOpens: true,
      TrackLinks: 'None'
    });

    console.log('Email sent successfully via Postmark:', result.MessageID);
    return result;
  } catch (error) {
    console.error('Failed to send email via Postmark:', error);
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
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background: #f8fafc; }
        .container { background: white; margin: 20px auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
        .highlight { background: #eff6ff; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0; border-radius: 0 6px 6px 0; }
        h1 { margin: 0 0 10px 0; font-size: 28px; }
        h2 { color: #1e40af; margin-bottom: 20px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Krugman Insights</h1>
          <p style="margin: 0; font-size: 18px; opacity: 0.9;">Premium Financial Intelligence for Market Leaders</p>
        </div>
        
        <div class="content">
          <h2>Hello ${userName},</h2>
          
          <p>Welcome to Krugman Insights - your premier source for institutional-grade financial analysis and market intelligence trusted by leading investment professionals.</p>
          
          <div class="highlight">
            <strong>Your Platform Access Includes:</strong>
            <ul>
              <li>Exclusive research reports from industry experts</li>
              <li>Real-time market alerts and breaking news</li>
              <li>Professional networking opportunities</li>
              <li>Customizable content preferences by sector</li>
              <li>Advanced analytics and market data</li>
            </ul>
          </div>
          
          <p>Our platform serves top-tier financial institutions, hedge funds, and investment banks with actionable insights that drive successful investment decisions.</p>
          
          <a href="https://krugmaninsights.com/dashboard" class="button">Explore Your Dashboard</a>
          
          <p>Our team of expert analysts and former Wall Street professionals is here to support your investment research needs.</p>
          
          <p>Best regards,<br><strong>The Krugman Insights Team</strong></p>
        </div>
        
        <div class="footer">
          <p><strong>Krugman Insights</strong> | Premium Financial Intelligence</p>
          <p style="font-size: 14px; color: #94a3b8;">This email was sent to ${userEmail}</p>
          <p style="font-size: 12px; color: #94a3b8;">Trusted by leading financial institutions worldwide</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: userEmail,
    subject: 'Welcome to Krugman Insights - Your Premium Financial Platform',
    html
  });
}

// Password reset email
export async function sendPasswordResetEmail(userEmail: string, resetToken: string) {
  const resetUrl = `${process.env.FRONTEND_URL || 'https://krugmaninsights.com'}/reset-password?token=${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - Krugman Insights</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background: #f8fafc; }
        .container { background: white; margin: 20px auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
        .warning { background: #fef2f2; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0; color: #991b1b; border-radius: 0 6px 6px 0; }
        .security-notice { background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px; }
        h1 { margin: 0 0 10px 0; font-size: 28px; }
        h2 { color: #dc2626; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
          <p style="margin: 0; font-size: 18px; opacity: 0.9;">Secure Your Account</p>
        </div>
        
        <div class="content">
          <h2>Reset Your Password</h2>
          
          <p>We received a request to reset your password for your Krugman Insights account. If this was you, click the button below to proceed:</p>
          
          <a href="${resetUrl}" class="button">Reset My Password</a>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong><br>
            This password reset link will expire in <strong>1 hour</strong> for your security. If you didn't request this reset, please ignore this email and contact our security team.
          </div>
          
          <div class="security-notice">
            <strong>Having trouble with the button?</strong><br>
            Copy and paste this link into your browser:<br>
            <span style="word-break: break-all; color: #3b82f6;">${resetUrl}</span>
          </div>
          
          <p>For your security, we recommend using a strong, unique password that you don't use on other websites.</p>
          
          <p>Best regards,<br><strong>The Krugman Insights Security Team</strong></p>
        </div>
        
        <div class="footer">
          <p><strong>Krugman Insights</strong> | Secure Financial Platform</p>
          <p style="font-size: 14px; color: #94a3b8;">This email was sent to ${userEmail}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: userEmail,
    subject: 'Reset Your Krugman Insights Password',
    html
  });
}

// Password change confirmation
export async function sendPasswordChangeConfirmationEmail(userEmail: string, userName: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Changed - Krugman Insights</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background: #f8fafc; }
        .container { background: white; margin: 20px auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0; }
        .success { background: #f0fdf4; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; color: #065f46; border-radius: 0 6px 6px 0; }
        h1 { margin: 0 0 10px 0; font-size: 28px; }
        h2 { color: #059669; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Password Successfully Changed</h1>
          <p style="margin: 0; font-size: 18px; opacity: 0.9;">Your Account is Secure</p>
        </div>
        
        <div class="content">
          <h2>Hello ${userName},</h2>
          
          <div class="success">
            <strong>🔒 Security Update Confirmed</strong><br>
            Your password was successfully changed on <strong>${new Date().toLocaleString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short'
            })}</strong>
          </div>
          
          <p>Your Krugman Insights account is now secured with your new password. You can continue accessing premium financial research and market intelligence with confidence.</p>
          
          <p><strong>If you didn't make this change:</strong><br>
          Please contact our security team immediately at security@krugmaninsights.com or through your account dashboard.</p>
          
          <p>Thank you for keeping your account secure.</p>
          
          <p>Best regards,<br><strong>The Krugman Insights Security Team</strong></p>
        </div>
        
        <div class="footer">
          <p><strong>Krugman Insights</strong> | Secure Financial Platform</p>
          <p style="font-size: 14px; color: #94a3b8;">This email was sent to ${userEmail}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
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
      <title>Welcome to Krugman Insights Newsletter</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background: #f8fafc; }
        .container { background: white; margin: 20px auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0; }
        .feature { background: #faf5ff; padding: 20px; border-left: 4px solid #7c3aed; margin: 20px 0; border-radius: 0 6px 6px 0; }
        h1 { margin: 0 0 10px 0; font-size: 28px; }
        h2 { color: #7c3aed; margin-bottom: 20px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📧 Welcome to Our Newsletter</h1>
          <p style="margin: 0; font-size: 18px; opacity: 0.9;">Premium Market Intelligence Delivered Daily</p>
        </div>
        
        <div class="content">
          <h2>You're Now Subscribed!</h2>
          
          <p>Thank you for subscribing to the Krugman Insights newsletter. Join thousands of investment professionals who rely on our daily intelligence.</p>
          
          <div class="feature">
            <strong>📊 What You'll Receive:</strong>
            <ul>
              <li><strong>Daily Market Briefings</strong> - Key developments affecting global financial markets</li>
              <li><strong>Exclusive Research</strong> - In-depth analysis from our expert research team</li>
              <li><strong>Breaking News Alerts</strong> - Critical market-moving updates as they happen</li>
              <li><strong>Weekly Sector Spotlights</strong> - Deep dives into specific industries and trends</li>
              <li><strong>Executive Interviews</strong> - Insights from leading financial executives</li>
            </ul>
          </div>
          
          <p>Our newsletter reaches institutional investors, hedge fund managers, investment bankers, and financial advisors across major global markets.</p>
          
          <p><strong>Delivery Schedule:</strong> Monday through Friday at 6:00 AM EST</p>
          
          <p>Best regards,<br><strong>The Krugman Insights Editorial Team</strong></p>
        </div>
        
        <div class="footer">
          <p><strong>Krugman Insights Newsletter</strong> | Premium Financial Intelligence</p>
          <p style="font-size: 14px; color: #94a3b8;">This email was sent to ${userEmail}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: userEmail,
    subject: 'Welcome to Krugman Insights Newsletter - Premium Market Intelligence',
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
      <title>Student Verification - Krugman Insights</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background: #f8fafc; }
        .container { background: white; margin: 20px auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0; }
        .code { background: #f1f5f9; padding: 25px; text-align: center; font-size: 32px; font-weight: bold; color: #1e40af; border-radius: 8px; margin: 25px 0; letter-spacing: 4px; border: 2px dashed #3b82f6; }
        h1 { margin: 0 0 10px 0; font-size: 28px; }
        h2 { color: #0ea5e9; margin-bottom: 20px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎓 Student Verification</h1>
          <p style="margin: 0; font-size: 18px; opacity: 0.9;">Academic Access to Financial Markets</p>
        </div>
        
        <div class="content">
          <h2>Verify Your Student Status</h2>
          
          <p>Please use this verification code to confirm your student status and unlock academic pricing:</p>
          
          <div class="code">${verificationCode}</div>
          
          <p style="text-align: center; color: #dc2626; font-weight: 600;">⏱️ This code expires in 15 minutes</p>
          
          <p><strong>Student Benefits Include:</strong></p>
          <ul>
            <li>70% discount on premium subscriptions</li>
            <li>Access to educational research materials</li>
            <li>Career development resources and job board</li>
            <li>Student networking events and webinars</li>
            <li>Academic case studies and learning modules</li>
          </ul>
          
          <p>Our student program supports the next generation of finance professionals with world-class research and educational resources.</p>
          
          <p>Best regards,<br><strong>The Krugman Insights Academic Team</strong></p>
        </div>
        
        <div class="footer">
          <p><strong>Krugman Insights</strong> | Academic Program</p>
          <p style="font-size: 14px; color: #94a3b8;">This email was sent to ${userEmail}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: userEmail,
    subject: 'Student Verification Code - Krugman Insights',
    html
  });
}

// Article purchase confirmation
export async function sendArticlePurchaseEmail(userEmail: string, articleTitle: string, userName: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Research Purchase Confirmed - Krugman Insights</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background: #f8fafc; }
        .container { background: white; margin: 20px auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0; }
        .article { background: #f0fdf4; padding: 25px; border-left: 4px solid #10b981; margin: 25px 0; border-radius: 0 8px 8px 0; }
        .button { display: inline-block; background: #059669; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
        h1 { margin: 0 0 10px 0; font-size: 28px; }
        h2 { color: #059669; margin-bottom: 20px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Purchase Confirmed</h1>
          <p style="margin: 0; font-size: 18px; opacity: 0.9;">Premium Research Access Activated</p>
        </div>
        
        <div class="content">
          <h2>Hello ${userName},</h2>
          
          <p>Thank you for your purchase! You now have full access to this premium research report:</p>
          
          <div class="article">
            <h3 style="margin: 0 0 15px 0; color: #059669; font-size: 20px;">📊 ${articleTitle}</h3>
            <p style="margin: 0; color: #065f46;">This institutional-grade research report is now available in your dashboard with full download access.</p>
          </div>
          
          <a href="https://krugmaninsights.com/dashboard" class="button">View Your Report</a>
          
          <p><strong>Your Purchase Includes:</strong></p>
          <ul>
            <li>Complete article access with premium insights</li>
            <li>Downloadable PDF research report</li>
            <li>Related research materials and data</li>
            <li>Expert analysis and market commentary</li>
            <li>Historical data and trend analysis</li>
          </ul>
          
          <p>This research is compiled by our team of former Wall Street analysts and industry experts to provide you with actionable investment intelligence.</p>
          
          <p>Best regards,<br><strong>The Krugman Insights Research Team</strong></p>
        </div>
        
        <div class="footer">
          <p><strong>Krugman Insights</strong> | Premium Research Platform</p>
          <p style="font-size: 14px; color: #94a3b8;">This email was sent to ${userEmail}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: userEmail,
    subject: `Research Access Confirmed: ${articleTitle}`,
    html
  });
}

// Corporate invitation email
export async function generateInvitationEmail(email: string, companyName: string, inviterName: string, invitationToken: string) {
  const inviteUrl = `${process.env.FRONTEND_URL || 'https://krugmaninsights.com'}/corporate/accept-invitation?token=${invitationToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Corporate Invitation - Krugman Insights</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background: #f8fafc; }
        .container { background: white; margin: 20px auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #7c2d12 0%, #ea580c 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0; }
        .invitation { background: #fff7ed; padding: 25px; border-left: 4px solid #ea580c; margin: 25px 0; border-radius: 0 8px 8px 0; }
        .button { display: inline-block; background: #ea580c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
        h1 { margin: 0 0 10px 0; font-size: 28px; }
        h2 { color: #ea580c; margin-bottom: 20px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏢 Corporate Invitation</h1>
          <p style="margin: 0; font-size: 18px; opacity: 0.9;">Join Your Team on Krugman Insights</p>
        </div>
        
        <div class="content">
          <h2>You're Invited to Join ${companyName}</h2>
          
          <div class="invitation">
            <p style="margin: 0 0 15px 0; font-size: 18px;"><strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on Krugman Insights.</p>
            <p style="margin: 0; color: #9a3412;">Gain access to institutional-grade financial intelligence with your corporate team.</p>
          </div>
          
          <p><strong>Corporate Benefits Include:</strong></p>
          <ul>
            <li>Enterprise-grade financial intelligence and research</li>
            <li>Team collaboration tools and shared libraries</li>
            <li>Advanced analytics dashboard with custom reports</li>
            <li>Priority customer support and dedicated account management</li>
            <li>Bulk access to premium research and market data</li>
            <li>Custom research requests and private briefings</li>
          </ul>
          
          <a href="${inviteUrl}" class="button">Accept Corporate Invitation</a>
          
          <p style="background: #fef3c7; padding: 15px; border-radius: 6px; color: #92400e; margin: 20px 0;">
            ⏰ <strong>Important:</strong> This invitation will expire in 7 days. Accept now to secure your corporate access.
          </p>
          
          <p style="font-size: 14px; color: #64748b;">
            <strong>Having trouble with the button?</strong><br>
            Copy and paste this link: <span style="word-break: break-all; color: #ea580c;">${inviteUrl}</span>
          </p>
          
          <p>Best regards,<br><strong>The Krugman Insights Corporate Team</strong></p>
        </div>
        
        <div class="footer">
          <p><strong>Krugman Insights</strong> | Corporate Financial Intelligence</p>
          <p style="font-size: 14px; color: #94a3b8;">This email was sent to ${email}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `${inviterName} invited you to join ${companyName} on Krugman Insights`,
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
      <title>Premium Research Shared - Krugman Insights</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background: #f8fafc; }
        .container { background: white; margin: 20px auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #be185d 0%, #ec4899 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0; }
        .gift { background: #fdf2f8; padding: 25px; border-left: 4px solid #ec4899; margin: 25px 0; border-radius: 0 8px 8px 0; }
        .message { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; font-style: italic; border: 1px solid #e2e8f0; }
        .button { display: inline-block; background: #be185d; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
        h1 { margin: 0 0 10px 0; font-size: 28px; }
        h2 { color: #be185d; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎁 You've Received Premium Research!</h1>
          <p style="margin: 0; font-size: 18px; opacity: 0.9;">Exclusive Market Intelligence Shared With You</p>
        </div>
        
        <div class="content">
          <h2>A Colleague Shared Premium Research</h2>
          
          <div class="gift">
            <p style="margin: 0 0 15px 0; font-size: 18px;"><strong>${senderName}</strong> has shared this exclusive research report with you:</p>
            <h3 style="margin: 0; color: #be185d; font-size: 20px;">📊 ${articleTitle}</h3>
          </div>
          
          ${message ? `<div class="message">
            <strong>💬 Personal message from ${senderName}:</strong><br>
            "${message}"
          </div>` : ''}
          
          <a href="https://krugmaninsights.com" class="button">Read Premium Research</a>
          
          <p>This exclusive research report is normally available only to premium subscribers and corporate clients. You now have complimentary access to this institutional-grade analysis!</p>
          
          <p><strong>What's Included:</strong></p>
          <ul>
            <li>Complete research report with expert analysis</li>
            <li>Market data and trend analysis</li>
            <li>Investment recommendations and insights</li>
            <li>Downloadable PDF version</li>
          </ul>
          
          <p>If you found this research valuable, consider joining Krugman Insights for regular access to premium financial intelligence trusted by leading investment professionals.</p>
          
          <p>Best regards,<br><strong>The Krugman Insights Team</strong></p>
        </div>
        
        <div class="footer">
          <p><strong>Krugman Insights</strong> | Premium Research Platform</p>
          <p style="font-size: 14px; color: #94a3b8;">This email was sent to ${recipientEmail}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: recipientEmail,
    subject: `${senderName} shared premium research: ${articleTitle}`,
    html
  });
}