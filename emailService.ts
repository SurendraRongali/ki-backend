import { MailService } from '@sendgrid/mail';

// Make SendGrid optional - only initialize if API key is provided
let mailService: MailService | null = null;

if (process.env.SENDGRID_API_KEY) {
  mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✅ SendGrid email service initialized for emailService.ts');
} else {
  console.log('📧 SendGrid API key not provided - advanced email features will be disabled');
}

const FROM_EMAIL = 'Team@Krugmaninsights.com';
const COMPANY_NAME = 'Krugman Insights';
const WEBSITE_URL = process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:5000';

// Email templates with inline CSS for better compatibility
const getEmailTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${COMPANY_NAME}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #991b1b;
            padding: 30px;
            text-align: center;
        }
        .logo {
            max-width: 280px;
            height: auto;
        }
        .content {
            padding: 40px 30px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background-color: #991b1b;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            transition: background-color 0.2s;
        }
        .btn:hover {
            background-color: #7f1d1d;
        }
        h1 {
            color: #1f2937;
            margin-bottom: 20px;
            font-size: 28px;
            font-weight: 700;
        }
        h2 {
            color: #374151;
            margin-bottom: 15px;
            font-size: 20px;
            font-weight: 600;
        }
        p {
            margin-bottom: 15px;
            color: #4b5563;
            font-size: 16px;
        }
        .highlight {
            background-color: #fef3c7;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #f59e0b;
        }
        .footer-text {
            font-size: 14px;
            color: #6b7280;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 0;
            }
            .content {
                padding: 30px 20px;
            }
            .header {
                padding: 20px;
            }
            .logo {
                max-width: 240px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${WEBSITE_URL}/api/logo" alt="${COMPANY_NAME}" class="logo">
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p class="footer-text">
                © 2025 ${COMPANY_NAME}. All rights reserved.<br>
                7 Bell Yard, London, England, WC2A 2JR
            </p>
        </div>
    </div>
</body>
</html>
`;

export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
  if (!mailService) {
    console.log('SendGrid not configured - welcome email not sent');
    return false;
  }

  try {
    const preferencesUrl = `${WEBSITE_URL}/profile?tab=preferences`;
    
    const content = `
      <h1>Welcome to ${COMPANY_NAME}!</h1>
      <p>Dear ${userName},</p>
      <p>Welcome to ${COMPANY_NAME} – your premier source for expert financial analysis and economic insights.</p>
      
      <div class="highlight">
        <h2>What's Next?</h2>
        <p>To get the most out of your membership, we recommend setting up your content preferences. This will help us deliver the most relevant insights tailored to your interests.</p>
      </div>
      
      <p>You can customize your preferences for:</p>
      <ul style="margin-left: 20px; margin-bottom: 20px;">
        <li>Market sectors and industries</li>
        <li>Email notification frequency</li>
        <li>Content types and research areas</li>
        <li>Regional market focus</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="${preferencesUrl}" class="btn">Set Your Preferences</a>
      </div>
      
      <p>Our team of financial experts is committed to providing you with actionable insights that drive informed decision-making in today's dynamic markets.</p>
      
      <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
      
      <p>Thank you for joining our community of informed investors and financial professionals.</p>
      
      <p style="margin-top: 30px;">
        Best regards,<br>
        <strong>The ${COMPANY_NAME} Team</strong>
      </p>
    `;

    await mailService.send({
      to: userEmail,
      from: FROM_EMAIL,
      subject: `Welcome to ${COMPANY_NAME}`,
      html: getEmailTemplate(content),
    });

    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

export async function sendArticlePurchaseEmail(
  userEmail: string, 
  userName: string, 
  articleTitle: string, 
  articleSlug: string
): Promise<boolean> {
  if (!mailService) {
    console.log('SendGrid not configured - article purchase email not sent');
    return false;
  }

  try {
    const articleUrl = `${WEBSITE_URL}/articles/${articleSlug}`;
    const savedArticlesUrl = `${WEBSITE_URL}/profile?tab=saved-articles`;
    
    const content = `
      <h1>Thank you for your purchase!</h1>
      <p>Dear ${userName},</p>
      <p>Your article purchase has been successfully processed. You now have permanent access to:</p>
      
      <div class="highlight">
        <h2>"${articleTitle}"</h2>
        <p>This premium content is now available in your personal library and can be accessed anytime.</p>
      </div>
      
      <h2>How to Access Your Article</h2>
      <p>You can read your purchased article in two ways:</p>
      
      <div style="margin: 25px 0;">
        <p><strong>1. Direct Access:</strong></p>
        <div style="text-align: center; margin: 15px 0;">
          <a href="${articleUrl}" class="btn">Read Article Now</a>
        </div>
      </div>
      
      <div style="margin: 25px 0;">
        <p><strong>2. From Your Profile:</strong></p>
        <p>All your purchased articles are saved in your profile under the "Saved Articles" section for easy future reference.</p>
        <div style="text-align: center; margin: 15px 0;">
          <a href="${savedArticlesUrl}" class="btn" style="background-color: #374151;">View Saved Articles</a>
        </div>
      </div>
      
      <div class="highlight">
        <p><strong>Note:</strong> Your purchased articles never expire and will remain accessible in your account indefinitely.</p>
      </div>
      
      <p>We hope you find this content valuable for your financial insights and decision-making.</p>
      
      <p>Thank you for supporting ${COMPANY_NAME}. We're committed to delivering the highest quality financial analysis and market intelligence.</p>
      
      <p style="margin-top: 30px;">
        Best regards,<br>
        <strong>The ${COMPANY_NAME} Team</strong>
      </p>
    `;

    await mailService.send({
      to: userEmail,
      from: FROM_EMAIL,
      subject: `Your ${COMPANY_NAME} Article Purchase Confirmation`,
      html: getEmailTemplate(content),
    });

    return true;
  } catch (error) {
    console.error('Failed to send article purchase email:', error);
    return false;
  }
}