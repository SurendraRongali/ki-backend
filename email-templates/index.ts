// Email Templates Storage System
// All email templates are centralized here for easy editing and design management

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  description: string;
  category: 'security' | 'welcome' | 'notification' | 'marketing';
  htmlTemplate: string;
  textTemplate: string;
  variables: string[];
  lastUpdated: string;
  version: string;
}

// Template Registry
export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  PASSWORD_CHANGE_CONFIRMATION: {
    id: 'password_change_confirmation',
    name: 'Password Change Confirmation',
    subject: 'Password Successfully Changed - Krugman Insights',
    description: 'Sent when user successfully changes their password',
    category: 'security',
    variables: ['firstName', 'recipientEmail', 'currentDate'],
    lastUpdated: '2024-12-05',
    version: '1.0',
    htmlTemplate: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Successfully Changed</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f8f9fa;
      color: #2d3748;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    .header {
      background: white;
      padding: 40px 30px;
      text-align: center;
      border-bottom: 1px solid #e2e8f0;
    }
    .logo {
      max-width: 300px;
      height: auto;
    }
    .content {
      padding: 40px 30px;
    }
    .success-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 50%;
      margin: 0 auto 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      color: white;
    }
    .title {
      font-size: 28px;
      font-weight: 700;
      color: #1a202c;
      text-align: center;
      margin-bottom: 20px;
    }
    .subtitle {
      font-size: 16px;
      color: #4a5568;
      text-align: center;
      margin-bottom: 30px;
    }
    .alert-box {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      text-align: center;
      font-weight: 600;
    }
    .message {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .message p {
      margin-bottom: 16px;
    }
    .info-box {
      background-color: #f0f4f8;
      border-left: 4px solid #10b981;
      padding: 20px;
      margin: 30px 0;
      border-radius: 0 8px 8px 0;
    }
    .info-box h3 {
      color: #1a202c;
      font-size: 18px;
      margin-bottom: 10px;
      font-weight: 600;
    }
    .info-box p {
      color: #4a5568;
      font-size: 14px;
      margin: 8px 0;
    }
    .security-tips {
      background-color: #fef5e7;
      border: 1px solid #f6ad55;
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
    }
    .security-tips h3 {
      color: #c05621;
      font-size: 16px;
      margin-bottom: 15px;
      font-weight: 600;
    }
    .security-tips ul {
      margin: 0;
      padding-left: 20px;
    }
    .security-tips li {
      color: #7c2d12;
      font-size: 14px;
      margin-bottom: 8px;
    }
    .cta-section {
      text-align: center;
      margin: 40px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #8B1538 0%, #a91d42 100%);
      color: white;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      transition: all 0.3s ease;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(139, 21, 56, 0.3);
    }
    .footer {
      background-color: #f8f9fa;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      color: #718096;
      font-size: 14px;
      margin-bottom: 8px;
    }
    @media (max-width: 600px) {
      .container {
        margin: 20px 10px;
      }
      .content {
        padding: 30px 20px;
      }
      .header {
        padding: 30px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <svg width="400" height="80" viewBox="0 0 400 80" xmlns="http://www.w3.org/2000/svg" class="logo">
        <!-- Red background rectangle -->
        <rect x="0" y="0" width="120" height="80" fill="#8B1538"/>
        
        <!-- White "Ki" text -->
        <text x="15" y="55" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="white">Ki</text>
        
        <!-- KRUGMAN INSIGHTS text -->
        <text x="140" y="45" font-family="Arial, sans-serif" font-size="28" font-weight="normal" fill="#333" letter-spacing="3px">KRUGMAN INSIGHTS</text>
      </svg>
    </div>
    
    <div class="content">
      <div class="success-icon">
        🔒
      </div>
      
      <h1 class="title">Password Successfully Changed</h1>
      <p class="subtitle">Your account security has been updated</p>
      
      <div class="alert-box">
        <strong>Security Confirmation</strong><br>
        Your password was successfully changed on {{currentDate}}
      </div>
      
      <div class="message">
        <p>Hello {{firstName}},</p>
        <p>This email confirms that your password for your Krugman Insights account has been successfully changed.</p>
      </div>
      
      <div class="info-box">
        <h3>What happened?</h3>
        <p><strong>Account:</strong> {{recipientEmail}}</p>
        <p><strong>Action:</strong> Password updated</p>
        <p><strong>Date & Time:</strong> {{currentDate}}</p>
        <p><strong>Security:</strong> Change logged for your protection</p>
      </div>
      
      <div class="security-tips">
        <h3>🛡️ Security Best Practices</h3>
        <ul>
          <li>Keep your password secure and don't share it with anyone</li>
          <li>Use a unique password that you don't use elsewhere</li>
          <li>Consider enabling two-factor authentication for extra security</li>
          <li>Log out of shared or public devices after use</li>
        </ul>
      </div>
      
      <div class="message">
        <p><strong>Didn't make this change?</strong></p>
        <p>If you didn't change your password, please <a href="mailto:Support@Krugmaninsights.com" style="color: #8B1538; font-weight: 600; text-decoration: none;">contact our support team</a> immediately. Someone may have unauthorized access to your account.</p>
      </div>
      
      <div class="cta-section">
        <a href="https://e01fa747-0c19-423e-835c-470e1c25cb07-00-iiz91ilt71ac.kirk.replit.dev/profile" class="cta-button">Access Your Account</a>
      </div>
    </div>
    
    <div class="footer">
      <p>This email was sent to {{recipientEmail}}</p>
      <p>This is an automated security notification from Krugman Insights.</p>
      <p>© 2024 Krugman Insights. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    textTemplate: `
Password Successfully Changed - Krugman Insights

Hello {{firstName}},

Your password for your Krugman Insights account has been successfully changed on {{currentDate}}.

Account: {{recipientEmail}}
Action: Password updated

If you didn't make this change, please contact our support team immediately at Support@Krugmaninsights.com.

Security Best Practices:
- Keep your password secure and don't share it
- Use a unique password for your account
- Log out of shared devices after use

Access your account: https://e01fa747-0c19-423e-835c-470e1c25cb07-00-iiz91ilt71ac.kirk.replit.dev/profile

Best regards,
The Krugman Insights Security Team`
  }
};

// Template utility functions
export function getTemplate(templateId: string): EmailTemplate | null {
  return EMAIL_TEMPLATES[templateId] || null;
}

export function renderTemplate(templateId: string, variables: Record<string, string>): { html: string; text: string; subject: string } | null {
  const template = getTemplate(templateId);
  if (!template) return null;

  let html = template.htmlTemplate;
  let text = template.textTemplate;
  let subject = template.subject;

  // Replace variables in templates
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    html = html.replace(new RegExp(placeholder, 'g'), value);
    text = text.replace(new RegExp(placeholder, 'g'), value);
    subject = subject.replace(new RegExp(placeholder, 'g'), value);
  });

  return { html, text, subject };
}

export function getAllTemplates(): EmailTemplate[] {
  return Object.values(EMAIL_TEMPLATES);
}

export function getTemplatesByCategory(category: EmailTemplate['category']): EmailTemplate[] {
  return Object.values(EMAIL_TEMPLATES).filter(template => template.category === category);
}