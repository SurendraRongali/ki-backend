// Password Reset Email Template
export const PASSWORD_RESET_TEMPLATE = {
  id: 'password_reset',
  name: 'Password Reset',
  subject: 'Reset Your Krugman Insights Password',
  description: 'Sent when user requests a password reset',
  category: 'security' as const,
  variables: ['firstName', 'recipientEmail', 'resetLink'],
  lastUpdated: '2024-12-05',
  version: '1.0',
  htmlTemplate: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
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
      background: linear-gradient(135deg, #8B1538 0%, #a91d42 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .logo {
      max-width: 180px;
      height: auto;
    }
    .content {
      padding: 40px 30px;
    }
    .alert-box {
      background-color: #fef5e7;
      border-left: 4px solid #f6ad55;
      padding: 20px;
      margin-bottom: 30px;
      border-radius: 0 8px 8px 0;
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
    .expiry-notice {
      background-color: #f0f4f8;
      border-left: 4px solid #8B1538;
      padding: 16px;
      margin: 24px 0;
      border-radius: 0 8px 8px 0;
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://e01fa747-0c19-423e-835c-470e1c25cb07-00-iiz91ilt71ac.kirk.replit.dev/src/assets/krugman-insights-logo.png" alt="Krugman Insights" class="logo" />
    </div>
    
    <div class="content">
      <div class="alert-box">
        <strong>Security Notice</strong>
        We received a request to reset your password for your Krugman Insights account.
      </div>
      
      <div class="message">
        <p>Hello {{firstName}},</p>
        <p>Someone requested a password reset for your Krugman Insights account. If this was you, click the button below to reset your password.</p>
      </div>
      
      <div class="cta-section">
        <a href="{{resetLink}}" class="cta-button">Reset Your Password</a>
      </div>
      
      <div class="expiry-notice">
        <p><strong>Important:</strong> This reset link will expire in 1 hour for security reasons.</p>
      </div>
      
      <div class="message">
        <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        <p>For security reasons, we recommend using a strong, unique password for your account.</p>
      </div>
    </div>
    
    <div class="footer">
      <p>This email was sent to {{recipientEmail}}</p>
      <p>This is an automated security message from Krugman Insights.</p>
      <p>© 2024 Krugman Insights. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
  textTemplate: `
Password Reset Request - Krugman Insights

Hello {{firstName}},

We received a request to reset the password for your Krugman Insights account.

To reset your password, click the link below:
{{resetLink}}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

For security, we recommend using a strong, unique password.

Best regards,
The Krugman Insights Security Team`
};