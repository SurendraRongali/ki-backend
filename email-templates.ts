// Professional email templates with Krugman Insights branding
// Theme: White background, red accents (#dc2626), black text

const LOGO_URL = "https://krugmaninsights.com/logo.png";

const baseStyles = `
  body { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
    line-height: 1.6; 
    color: #000000; 
    max-width: 600px; 
    margin: 0 auto; 
    background-color: #ffffff;
  }
  .container { 
    background: #ffffff; 
    border: 1px solid #e5e7eb;
  }
  .header { 
    background: #ffffff; 
    padding: 40px 30px 30px; 
    text-align: center; 
    border-bottom: 3px solid #dc2626;
  }
  .logo {
    max-width: 350px;
    height: auto;
    margin-bottom: 20px;
  }
  .content { 
    padding: 40px 30px; 
    background: #ffffff;
  }
  .footer { 
    background: #f9fafb; 
    padding: 30px; 
    text-align: center; 
    color: #6b7280; 
    font-size: 14px;
    border-top: 1px solid #e5e7eb;
  }
  .button { 
    display: inline-block; 
    background: #dc2626; 
    color: white !important; 
    padding: 14px 28px; 
    text-decoration: none; 
    border-radius: 6px; 
    margin: 25px 0; 
    font-weight: 600;
    font-size: 16px;
  }
  .button:hover {
    background: #b91c1c;
  }
  h1 {
    color: #000000;
    font-size: 28px;
    margin: 0 0 10px 0;
    font-weight: 700;
  }
  h2 {
    color: #000000;
    font-size: 24px;
    margin: 0 0 20px 0;
    font-weight: 600;
  }
  .highlight {
    background: #fef2f2;
    padding: 25px;
    border-left: 4px solid #dc2626;
    margin: 25px 0;
    border-radius: 0 6px 6px 0;
  }
  .info-box {
    background: #f9fafb;
    padding: 25px;
    border-radius: 6px;
    margin: 25px 0;
    border: 1px solid #e5e7eb;
  }
  .security-notice {
    background: #fef3cd;
    padding: 20px;
    border-left: 4px solid #f59e0b;
    margin: 20px 0;
    border-radius: 0 6px 6px 0;
  }
  a {
    color: #dc2626;
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
`;

function createEmailTemplate(title: string, content: string, unsubscribeEmail?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${LOGO_URL}" alt="Krugman Insights" class="logo" />
          <h1>${title}</h1>
          <p style="color: #6b7280; font-size: 18px; margin: 0;">Premium Financial Intelligence</p>
        </div>
        
        <div class="content">
          ${content}
        </div>
        
        <div class="footer">
          <p style="margin: 0 0 10px 0;"><strong>Krugman Insights</strong> | Premium Financial Intelligence</p>
          <p style="margin: 0 0 15px 0;">© ${new Date().getFullYear()} Krugman Insights. All rights reserved.</p>
          ${unsubscribeEmail ? `
          <p style="margin: 0;">
            <a href="https://krugmaninsights.com/unsubscribe?email=${encodeURIComponent(unsubscribeEmail)}" style="color: #6b7280;">Unsubscribe</a> | 
            <a href="https://krugmaninsights.com/privacy" style="color: #6b7280;">Privacy Policy</a> |
            <a href="https://krugmaninsights.com/contact" style="color: #6b7280;">Contact</a>
          </p>
          ` : `
          <p style="margin: 0;">
            <a href="https://krugmaninsights.com/privacy" style="color: #6b7280;">Privacy Policy</a> |
            <a href="https://krugmaninsights.com/contact" style="color: #6b7280;">Contact</a>
          </p>
          `}
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateWelcomeEmail(userName: string, userEmail: string): string {
  const content = `
    <h2>Welcome ${userName}!</h2>
    
    <p style="font-size: 16px; margin-bottom: 25px;">Welcome to Krugman Insights! We're excited to have you join our community of finance professionals and institutional investors.</p>
    
    <div class="highlight">
      <p style="margin: 0; font-weight: 600; color: #dc2626; font-size: 16px;">🎯 Get started with your premium access</p>
    </div>
    
    <div class="info-box">
      <p style="margin: 0 0 15px 0; font-weight: 600; color: #000000;">With your Krugman Insights account, you can:</p>
      <ul style="font-size: 16px; margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 10px;">Access institutional-grade financial research and analysis</li>
        <li style="margin-bottom: 10px;">Read exclusive market insights from industry experts</li>
        <li style="margin-bottom: 10px;">Stay ahead with real-time financial news and alerts</li>
        <li style="margin-bottom: 10px;">Connect with finance professionals and industry leaders</li>
        <li style="margin-bottom: 10px;">Receive personalized investment recommendations</li>
      </ul>
    </div>
    
    <p style="font-size: 16px;">Start exploring our platform to discover the latest insights that drive successful investment decisions.</p>
    
    <div style="text-align: center; margin: 35px 0;">
      <a href="https://krugmaninsights.com/dashboard" class="button">Explore Your Dashboard</a>
    </div>
    
    <div style="color: #6b7280; font-size: 15px; padding: 20px; background: #f9fafb; border-radius: 6px;">
      <strong style="color: #000000;">Need help getting started?</strong><br>
      Our support team is here to assist you. Contact us at 
      <a href="mailto:support@krugmaninsights.com">support@krugmaninsights.com</a>
    </div>
    
    <p style="margin-top: 30px; color: #000000;"><strong>Best regards,</strong><br>The Krugman Insights Team</p>
  `;
  
  return createEmailTemplate("Welcome to Krugman Insights", content, userEmail);
}

export function generatePasswordResetEmail(userEmail: string, resetToken: string): string {
  const content = `
    <h2>Password Reset Request</h2>
    
    <p style="font-size: 16px;">We received a request to reset the password for your Krugman Insights account.</p>
    
    <div class="security-notice">
      <p style="margin: 0; font-weight: 600; color: #92400e;">🔒 Security Notice</p>
      <p style="margin: 10px 0 0 0; color: #92400e;">This link will expire in 1 hour for your security.</p>
    </div>
    
    <p style="font-size: 16px;">Click the button below to reset your password:</p>
    
    <div style="text-align: center; margin: 35px 0;">
      <a href="https://krugmaninsights.com/reset-password?token=${resetToken}" class="button">Reset Your Password</a>
    </div>
    
    <div class="info-box">
      <p style="margin: 0; font-size: 14px; color: #6b7280;">
        <strong style="color: #000000;">If you didn't request this reset:</strong><br>
        You can safely ignore this email. Your password will remain unchanged. If you're concerned about your account security, please contact our support team immediately.
      </p>
    </div>
    
    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="https://krugmaninsights.com/reset-password?token=${resetToken}" style="word-break: break-all;">https://krugmaninsights.com/reset-password?token=${resetToken}</a>
    </p>
    
    <p style="margin-top: 30px; color: #000000;"><strong>Best regards,</strong><br>The Krugman Insights Security Team</p>
  `;
  
  return createEmailTemplate("Reset Your Password", content);
}

export function generatePasswordChangeConfirmationEmail(userEmail: string, userName: string): string {
  const content = `
    <h2>Password Changed Successfully</h2>
    
    <p style="font-size: 16px;">Hello ${userName},</p>
    
    <p style="font-size: 16px;">Your Krugman Insights account password has been successfully changed.</p>
    
    <div class="highlight">
      <p style="margin: 0; font-weight: 600; color: #dc2626; font-size: 16px;">✅ Password Update Confirmed</p>
      <p style="margin: 10px 0 0 0; color: #000000;">Changed on: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="security-notice">
      <p style="margin: 0; font-weight: 600; color: #92400e;">🔒 Didn't make this change?</p>
      <p style="margin: 10px 0 0 0; color: #92400e;">If you didn't change your password, please contact our security team immediately at <a href="mailto:security@krugmaninsights.com" style="color: #92400e;">security@krugmaninsights.com</a></p>
    </div>
    
    <div class="info-box">
      <p style="margin: 0 0 15px 0; font-weight: 600; color: #000000;">Security Tips:</p>
      <ul style="font-size: 14px; margin: 0; padding-left: 20px; color: #6b7280;">
        <li style="margin-bottom: 8px;">Use a unique password for your Krugman Insights account</li>
        <li style="margin-bottom: 8px;">Enable two-factor authentication for added security</li>
        <li style="margin-bottom: 8px;">Never share your login credentials with anyone</li>
        <li style="margin-bottom: 8px;">Log out from shared or public computers</li>
      </ul>
    </div>
    
    <p style="margin-top: 30px; color: #000000;"><strong>Best regards,</strong><br>The Krugman Insights Security Team</p>
  `;
  
  return createEmailTemplate("Password Changed Successfully", content);
}

export function generateNewsletterWelcomeEmail(userEmail: string): string {
  const content = `
    <h2>Welcome to Krugman Insights Newsletter</h2>
    
    <p style="font-size: 16px;">Thank you for subscribing to the Krugman Insights newsletter!</p>
    
    <div class="highlight">
      <p style="margin: 0; font-weight: 600; color: #dc2626; font-size: 16px;">📈 What to Expect</p>
    </div>
    
    <div class="info-box">
      <p style="margin: 0 0 15px 0; font-weight: 600; color: #000000;">You'll receive:</p>
      <ul style="font-size: 16px; margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 10px;">Weekly market analysis and insights</li>
        <li style="margin-bottom: 10px;">Breaking financial news and commentary</li>
        <li style="margin-bottom: 10px;">Exclusive research reports and whitepapers</li>
        <li style="margin-bottom: 10px;">Investment opportunities and market alerts</li>
        <li style="margin-bottom: 10px;">Industry trends and regulatory updates</li>
      </ul>
    </div>
    
    <p style="font-size: 16px;">Stay ahead of the markets with institutional-grade financial intelligence delivered directly to your inbox.</p>
    
    <div style="text-align: center; margin: 35px 0;">
      <a href="https://krugmaninsights.com" class="button">Visit Krugman Insights</a>
    </div>
    
    <p style="margin-top: 30px; color: #000000;"><strong>Best regards,</strong><br>The Krugman Insights Editorial Team</p>
  `;
  
  return createEmailTemplate("Newsletter Subscription Confirmed", content, userEmail);
}

export function generateArticlePurchaseEmail(userEmail: string, articleTitle: string, userName: string): string {
  const content = `
    <h2>Article Purchase Confirmation</h2>
    
    <p style="font-size: 16px;">Hello ${userName},</p>
    
    <p style="font-size: 16px;">Thank you for your purchase! Your transaction has been processed successfully.</p>
    
    <div class="highlight">
      <p style="margin: 0; font-weight: 600; color: #dc2626; font-size: 16px;">📄 Article Purchased</p>
      <p style="margin: 10px 0 0 0; color: #000000; font-size: 18px; font-weight: 600;">"${articleTitle}"</p>
    </div>
    
    <div class="info-box">
      <p style="margin: 0 0 15px 0; font-weight: 600; color: #000000;">Purchase Details:</p>
      <ul style="font-size: 14px; margin: 0; padding-left: 20px; color: #6b7280;">
        <li style="margin-bottom: 8px;">Purchase Date: ${new Date().toLocaleDateString()}</li>
        <li style="margin-bottom: 8px;">Article Access: Lifetime</li>
        <li style="margin-bottom: 8px;">Format: Online Article + PDF Download</li>
        <li style="margin-bottom: 8px;">Receipt: Sent to ${userEmail}</li>
      </ul>
    </div>
    
    <p style="font-size: 16px;">You can now access your purchased article anytime from your dashboard.</p>
    
    <div style="text-align: center; margin: 35px 0;">
      <a href="https://krugmaninsights.com/dashboard" class="button">View Your Articles</a>
    </div>
    
    <div style="color: #6b7280; font-size: 15px; padding: 20px; background: #f9fafb; border-radius: 6px;">
      <strong style="color: #000000;">Questions about your purchase?</strong><br>
      Contact our support team at <a href="mailto:support@krugmaninsights.com">support@krugmaninsights.com</a>
    </div>
    
    <p style="margin-top: 30px; color: #000000;"><strong>Best regards,</strong><br>The Krugman Insights Team</p>
  `;
  
  return createEmailTemplate("Purchase Confirmation", content);
}

export function generateContactFormAutoResponse(userEmail: string, userName: string, userMessage: string): string {
  const content = `
    <h2>Thank You for Contacting Us</h2>
    
    <p style="font-size: 16px;">Hello ${userName},</p>
    
    <p style="font-size: 16px;">Thank you for reaching out to Krugman Insights. We have received your message and will respond within 24 hours.</p>
    
    <div class="highlight">
      <p style="margin: 0; font-weight: 600; color: #dc2626; font-size: 16px;">📧 Your Message</p>
    </div>
    
    <div class="info-box">
      <p style="margin: 0; font-size: 14px; color: #6b7280; font-style: italic; padding: 15px; background: #ffffff; border-left: 3px solid #dc2626;">
        "${userMessage.substring(0, 300)}${userMessage.length > 300 ? '...' : ''}"
      </p>
    </div>
    
    <div class="info-box">
      <p style="margin: 0 0 15px 0; font-weight: 600; color: #000000;">What happens next:</p>
      <ul style="font-size: 14px; margin: 0; padding-left: 20px; color: #6b7280;">
        <li style="margin-bottom: 8px;">Our team will review your message within 2 hours</li>
        <li style="margin-bottom: 8px;">You'll receive a detailed response within 24 hours</li>
        <li style="margin-bottom: 8px;">For urgent matters, we may contact you by phone</li>
        <li style="margin-bottom: 8px;">All responses will be sent to ${userEmail}</li>
      </ul>
    </div>
    
    <div style="color: #6b7280; font-size: 15px; padding: 20px; background: #f9fafb; border-radius: 6px;">
      <strong style="color: #000000;">Need immediate assistance?</strong><br>
      For urgent inquiries, please call us at <strong style="color: #dc2626;">+1 (555) 123-4567</strong><br>
      Business hours: Monday-Friday, 9 AM - 6 PM EST
    </div>
    
    <p style="margin-top: 30px; color: #000000;"><strong>Best regards,</strong><br>The Krugman Insights Support Team</p>
  `;
  
  return createEmailTemplate("Message Received - We'll Be In Touch", content);
}