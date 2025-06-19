import AWS from 'aws-sdk';

// Configure AWS SES for enterprise email delivery
if (!process.env.AWS_ACCESS_KEY_ID) {
  console.warn('AWS_ACCESS_KEY_ID not configured - email functionality will be limited');
}

if (!process.env.AWS_SECRET_ACCESS_KEY) {
  console.warn('AWS_SECRET_ACCESS_KEY not configured - email functionality will be limited');
}

if (!process.env.AWS_REGION) {
  console.warn('AWS_REGION not configured - using default eu-west-1');
}

// Initialize AWS SES client with EU region for GDPR compliance
const ses = new AWS.SES({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'eu-west-2', // London for optimal UK/EU delivery
  apiVersion: '2010-12-01'
});

const fromDomain = process.env.SES_FROM_DOMAIN || 'krugmaninsights.com';

// Email deliverability helper functions
function cleanTextFromHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function enhanceHtmlForDeliverability(html: string): string {
  // Add proper DOCTYPE and meta tags for better spam score
  if (!html.includes('<!DOCTYPE html>')) {
    html = `<!DOCTYPE html>\n${html}`;
  }
  
  // Ensure proper encoding and viewport meta tags exist
  if (!html.includes('<meta charset=')) {
    html = html.replace('<head>', '<head>\n<meta charset="utf-8">');
  }
  
  if (!html.includes('<meta name="viewport"')) {
    html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  }
  
  // Add List-Unsubscribe header equivalent in HTML
  if (!html.includes('unsubscribe')) {
    const unsubscribeLink = `
      <div style="text-align: center; color: #888; font-size: 12px; margin: 20px 0;">
        <p>To unsubscribe from future emails, <a href="https://krugmaninsights.com/unsubscribe" style="color: #888;">click here</a></p>
      </div>
    `;
    html = html.replace('</body>', `${unsubscribeLink}</body>`);
  }
  
  return html;
}

function getEmailType(subject: string): string {
  if (subject.toLowerCase().includes('password')) return 'security';
  if (subject.toLowerCase().includes('welcome')) return 'welcome';
  if (subject.toLowerCase().includes('newsletter')) return 'newsletter';
  if (subject.toLowerCase().includes('verification')) return 'verification';
  if (subject.toLowerCase().includes('invitation')) return 'invitation';
  if (subject.toLowerCase().includes('contact')) return 'support';
  if (subject.toLowerCase().includes('research') || subject.toLowerCase().includes('article')) return 'content';
  return 'transactional';
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, from, text }: EmailOptions) {
  try {
    if (!process.env.AWS_ACCESS_KEY_ID) {
      console.warn('AWS SES not configured - email would be sent to:', to);
      return { MessageId: 'simulated', status: 'Email simulated (AWS SES not configured)' };
    }

    const emailType = getEmailType(subject);
    const isMarketingEmail = ['newsletter', 'content', 'promotional'].includes(emailType);
    
    // Check unsubscribe list for marketing emails
    if (isMarketingEmail) {
      const { storage } = await import('./storage');
      const isUnsubscribed = await storage.isEmailUnsubscribed(to);
      
      if (isUnsubscribed) {
        console.log(`Email blocked: ${to} is unsubscribed from marketing emails`);
        return {
          MessageId: `blocked-unsubscribed-${Date.now()}`,
          status: 'blocked_unsubscribed'
        };
      }
    }

    const fromAddress = from || `Krugman Insights <noreply@${fromDomain}>`;
    
    // Enhanced deliverability configuration
    const params = {
      Source: fromAddress,
      Destination: {
        ToAddresses: [to]
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: enhanceHtmlForDeliverability(html),
            Charset: 'UTF-8'
          },
          Text: {
            Data: text || cleanTextFromHtml(html),
            Charset: 'UTF-8'
          }
        }
      },
      ReplyToAddresses: ['support@krugmaninsights.com'],
      ReturnPath: `bounce@${fromDomain}`,
      Tags: [
        {
          Name: 'Environment',
          Value: process.env.NODE_ENV || 'production'
        },
        {
          Name: 'Service',
          Value: 'KrugmanInsights'
        },
        {
          Name: 'EmailType',
          Value: emailType
        },
        {
          Name: 'ComplianceCheck',
          Value: isMarketingEmail ? 'marketing_verified' : 'transactional'
        }
      ]
    };

    const result = await ses.sendEmail(params).promise();
    console.log(`Email sent successfully via AWS SES: ${result.MessageId} (Type: ${emailType}, Compliance: ${isMarketingEmail ? 'Marketing verified' : 'Transactional'})`);
    return result;
  } catch (error) {
    console.error('Failed to send email via AWS SES:', error);
    throw error;
  }
}

// Welcome email for new users
export async function sendWelcomeEmail(userEmail: string, userName: string) {
  const { generateWelcomeEmail } = await import('./email-templates');
  const html = generateWelcomeEmail(userName, userEmail);

  return await sendEmail({
    to: userEmail,
    subject: 'Welcome to Krugman Insights - Your Premium Financial Intelligence Platform',
    html,
    from: `Krugman Insights Team <team@${fromDomain}>`
  });
}

// Password reset email
export async function sendPasswordResetEmail(userEmail: string, resetToken: string) {
  const { generatePasswordResetEmail } = await import('./email-templates');
  const html = generatePasswordResetEmail(userEmail, resetToken);

  return await sendEmail({
    to: userEmail,
    subject: 'Reset Your Krugman Insights Password',
    html,
    from: `Krugman Insights Security <security@${fromDomain}>`
  });
}

// Password change confirmation
export async function sendPasswordChangeConfirmationEmail(userEmail: string, userName: string) {
  const { generatePasswordChangeConfirmationEmail } = await import('./email-templates');
  const html = generatePasswordChangeConfirmationEmail(userEmail, userName);

  return await sendEmail({
    to: userEmail,
    subject: 'Password Changed Successfully - Krugman Insights',
    html,
    from: `Krugman Insights Security <security@${fromDomain}>`
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; background: #ffffff; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; }
        .feature { background: #faf5ff; padding: 20px; border-left: 4px solid #7c3aed; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to Our Newsletter</h1>
        <p>Premium Market Intelligence Delivered Daily</p>
      </div>
      
      <div class="content">
        <h2>You're Now Subscribed!</h2>
        
        <p>Thank you for subscribing to the Krugman Insights newsletter. You'll receive:</p>
        
        <div class="feature">
          <ul>
            <li><strong>Daily Market Briefings</strong> - Key developments affecting financial markets</li>
            <li><strong>Exclusive Research</strong> - In-depth analysis from our expert team</li>
            <li><strong>Breaking News Alerts</strong> - Critical updates as they happen</li>
            <li><strong>Weekly Sector Spotlights</strong> - Deep dives into specific industries</li>
          </ul>
        </div>
        
        <p>Our newsletter serves institutional investors, hedge funds, and financial professionals with actionable intelligence.</p>
        
        <p>Best regards,<br>The Krugman Insights Editorial Team</p>
      </div>
      
      <div class="footer">
        <p>Krugman Insights Newsletter | Premium Financial Intelligence</p>
        <p>This email was sent to ${userEmail}</p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: userEmail,
    subject: 'Welcome to Krugman Insights Newsletter - Premium Market Intelligence',
    html,
    from: `Krugman Insights Newsletter <noreply@${fromDomain}>`
  });
}

// Student verification email
export async function sendStudentVerificationEmail(userEmail: string, firstName: string, verificationCode: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Student Verification - Krugman Insights</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; background: #ffffff; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; }
        .code { background: #f1f5f9; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #1e40af; border-radius: 6px; margin: 20px 0; letter-spacing: 2px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Student Verification</h1>
        <p>Academic Access to Financial Markets</p>
      </div>
      
      <div class="content">
        <h2>Verify Your Student Status</h2>
        
        <p>Please use this verification code to confirm your student status and access academic pricing:</p>
        
        <div class="code">${verificationCode}</div>
        
        <p>This code expires in 15 minutes for security purposes.</p>
        
        <p>Student access includes:</p>
        <ul>
          <li>Discounted subscription rates</li>
          <li>Educational research materials</li>
          <li>Career development resources</li>
          <li>Academic case studies</li>
        </ul>
        
        <p>Best regards,<br>The Krugman Insights Academic Team</p>
      </div>
      
      <div class="footer">
        <p>Krugman Insights | Academic Program</p>
        <p>This email was sent to ${userEmail}</p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: userEmail,
    subject: 'Student Verification Code - Krugman Insights',
    html,
    from: `Krugman Insights Academic <noreply@${fromDomain}>`
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
      <title>Article Purchase Confirmed - Krugman Insights</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; background: #ffffff; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; }
        .article { background: #f0fdf4; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; }
        .button { display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Purchase Confirmed</h1>
        <p>Premium Research Access</p>
      </div>
      
      <div class="content">
        <h2>Hello ${userName},</h2>
        
        <p>Thank you for your purchase. You now have full access to:</p>
        
        <div class="article">
          <h3>${articleTitle}</h3>
          <p>This premium research report is now available in your account.</p>
        </div>
        
        <a href="https://krugmaninsights.com/dashboard" class="button">View Article</a>
        
        <p>Your purchase includes:</p>
        <ul>
          <li>Full article access</li>
          <li>Downloadable PDF report</li>
          <li>Related research materials</li>
          <li>Expert analysis and insights</li>
        </ul>
        
        <p>Best regards,<br>The Krugman Insights Team</p>
      </div>
      
      <div class="footer">
        <p>Krugman Insights | Premium Research Platform</p>
        <p>This email was sent to ${userEmail}</p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: userEmail,
    subject: `Research Access Confirmed: ${articleTitle}`,
    html,
    from: `Krugman Insights Research <noreply@${fromDomain}>`
  });
}

// Contact form auto-response
export async function sendContactFormAutoResponse(userEmail: string, userName: string, userMessage: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank You for Contacting Krugman Insights</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; background: #ffffff; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; }
        .message-preview { background: #f0fdf4; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 6px; }
        .response-time { background: #eff6ff; padding: 15px; border-radius: 6px; text-align: center; color: #1e40af; font-weight: 500; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Message Received</h1>
        <p>Thank You for Contacting Krugman Insights</p>
      </div>
      
      <div class="content">
        <h2>Hello ${userName},</h2>
        
        <p>Thank you for reaching out to Krugman Insights. We have received your message and appreciate your interest in our platform.</p>
        
        <div class="message-preview">
          <strong>Your Message:</strong>
          <p style="margin-top: 10px; font-style: italic;">"${userMessage.substring(0, 200)}${userMessage.length > 200 ? '...' : ''}"</p>
        </div>
        
        <div class="response-time">
          A member of our team will respond within 48 hours
        </div>
        
        <p>In the meantime, you might find these resources helpful:</p>
        <ul>
          <li><strong>Research Library</strong> - Browse our latest market analysis</li>
          <li><strong>Market Updates</strong> - Stay informed with real-time insights</li>
          <li><strong>FAQ Section</strong> - Find answers to common questions</li>
        </ul>
        
        <p>We value your inquiry and look forward to assisting you.</p>
        
        <p>Best regards,<br>The Krugman Insights Support Team</p>
      </div>
      
      <div class="footer">
        <p>Krugman Insights | Premium Financial Intelligence</p>
        <p>This is an automated response to your inquiry sent to ${userEmail}</p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: userEmail,
    subject: 'Thank You for Contacting Krugman Insights - We Will Respond Within 48 Hours',
    html,
    from: `Krugman Insights Support <support@${fromDomain}>`
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #7c2d12 0%, #ea580c 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; background: #ffffff; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; }
        .invitation { background: #fff7ed; padding: 20px; border-left: 4px solid #ea580c; margin: 20px 0; }
        .button { display: inline-block; background: #ea580c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Corporate Invitation</h1>
        <p>Join Your Team on Krugman Insights</p>
      </div>
      
      <div class="content">
        <h2>You're Invited!</h2>
        
        <div class="invitation">
          <p><strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on Krugman Insights.</p>
        </div>
        
        <p>As a member of ${companyName}, you'll have access to:</p>
        <ul>
          <li>Corporate-grade financial intelligence</li>
          <li>Team collaboration tools</li>
          <li>Shared research libraries</li>
          <li>Advanced analytics dashboard</li>
          <li>Priority customer support</li>
        </ul>
        
        <a href="${inviteUrl}" class="button">Accept Invitation</a>
        
        <p>This invitation will expire in 7 days.</p>
        
        <p>If the button doesn't work, copy and paste this link:</p>
        <p style="word-break: break-all; color: #ea580c;">${inviteUrl}</p>
        
        <p>Best regards,<br>The Krugman Insights Corporate Team</p>
      </div>
      
      <div class="footer">
        <p>Krugman Insights | Corporate Financial Intelligence</p>
        <p>This email was sent to ${email}</p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `${inviterName} invited you to join ${companyName} on Krugman Insights`,
    html,
    from: `Krugman Insights Corporate <noreply@${fromDomain}>`
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
      <title>Gift Article - Krugman Insights</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #be185d 0%, #ec4899 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; background: #ffffff; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; }
        .gift { background: #fdf2f8; padding: 20px; border-left: 4px solid #ec4899; margin: 20px 0; }
        .message { background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; font-style: italic; }
        .button { display: inline-block; background: #be185d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>You've Received a Gift!</h1>
        <p>Premium Research Shared With You</p>
      </div>
      
      <div class="content">
        <h2>A Colleague Shared Premium Research</h2>
        
        <div class="gift">
          <p><strong>${senderName}</strong> has shared this premium article with you:</p>
          <h3>${articleTitle}</h3>
        </div>
        
        ${message ? `<div class="message">
          <strong>Personal message:</strong><br>
          "${message}"
        </div>` : ''}
        
        <a href="https://krugmaninsights.com" class="button">Read Article</a>
        
        <p>This exclusive research is normally available only to premium subscribers. Enjoy complimentary access!</p>
        
        <p>Best regards,<br>The Krugman Insights Team</p>
      </div>
      
      <div class="footer">
        <p>Krugman Insights | Premium Research Platform</p>
        <p>This email was sent to ${recipientEmail}</p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: recipientEmail,
    subject: `${senderName} shared premium research: ${articleTitle}`,
    html,
    from: `Krugman Insights Research <noreply@${fromDomain}>`
  });
}