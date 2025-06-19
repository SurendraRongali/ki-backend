import { sendEmail } from '../aws-ses';

interface DeliverabilityTest {
  emailType: 'welcome' | 'password-reset' | 'newsletter' | 'transactional';
  recipientEmail: string;
  testResult: 'delivered' | 'bounced' | 'complained' | 'pending';
  timestamp: Date;
  messageId?: string;
}

class EmailDeliverabilityService {
  private testResults: DeliverabilityTest[] = [];

  async testEmailDeliverability(recipientEmail: string): Promise<boolean> {
    const testEmails = [
      {
        type: 'welcome' as const,
        subject: 'Welcome to Krugman Insights - Test Email',
        html: this.generateTestEmailHTML('welcome', recipientEmail)
      },
      {
        type: 'transactional' as const,
        subject: 'Account Notification - Test Email',
        html: this.generateTestEmailHTML('transactional', recipientEmail)
      }
    ];

    let allSuccessful = true;

    for (const testEmail of testEmails) {
      try {
        const result = await sendEmail({
          to: recipientEmail,
          subject: testEmail.subject,
          html: testEmail.html,
          from: 'Krugman Insights Test <noreply@krugmaninsights.com>'
        });

        this.testResults.push({
          emailType: testEmail.type,
          recipientEmail,
          testResult: 'delivered',
          timestamp: new Date(),
          messageId: result.MessageId
        });

        console.log(`✅ Test email ${testEmail.type} sent successfully:`, result.MessageId);
      } catch (error) {
        console.error(`❌ Test email ${testEmail.type} failed:`, error);
        
        this.testResults.push({
          emailType: testEmail.type,
          recipientEmail,
          testResult: 'bounced',
          timestamp: new Date()
        });

        allSuccessful = false;
      }
    }

    return allSuccessful;
  }

  private generateTestEmailHTML(type: string, email: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Deliverability Test - Krugman Insights</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #f8fafc;
          }
          .container { 
            background: #ffffff; 
            margin: 20px; 
            border-radius: 8px; 
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
          }
          .content { 
            padding: 30px; 
          }
          .footer { 
            background: #f8fafc; 
            padding: 20px 30px; 
            text-align: center; 
            color: #64748b; 
            font-size: 14px;
          }
          .test-info { 
            background: #fef3c7; 
            padding: 15px; 
            border-left: 4px solid #f59e0b; 
            margin: 20px 0; 
            border-radius: 4px;
          }
          .button { 
            display: inline-block; 
            background: #1e40af; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 15px 0; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Deliverability Test</h1>
            <p>Testing ${type} email delivery</p>
          </div>
          
          <div class="content">
            <h2>✅ Email Delivery Successful</h2>
            
            <div class="test-info">
              <strong>Test Details:</strong><br>
              Email Type: ${type}<br>
              Timestamp: ${new Date().toISOString()}<br>
              Recipient: ${email}
            </div>
            
            <p>This is a test email to verify that our email infrastructure is properly configured and emails are reaching your inbox instead of spam folders.</p>
            
            <p><strong>What this test verifies:</strong></p>
            <ul>
              <li>AWS SES domain authentication</li>
              <li>SPF, DKIM, and DMARC configuration</li>
              <li>Email template formatting</li>
              <li>Inbox delivery rates</li>
            </ul>
            
            <p>If you received this email in your inbox, our deliverability setup is working correctly.</p>
            
            <a href="https://krugmaninsights.com" class="button">Visit Krugman Insights</a>
            
            <p style="margin-top: 30px; color: #64748b; font-size: 14px;">
              This is an automated test email. No action is required.
            </p>
          </div>
          
          <div class="footer">
            <p>Krugman Insights | Premium Financial Intelligence</p>
            <p>This test email was sent to ${email}</p>
            <p><a href="https://krugmaninsights.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: #64748b;">Unsubscribe</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getTestResults(): DeliverabilityTest[] {
    return this.testResults;
  }

  getDeliverabilityReport(): {
    totalTests: number;
    successRate: number;
    lastTestDate: Date | null;
    recommendations: string[];
  } {
    const total = this.testResults.length;
    const successful = this.testResults.filter(r => r.testResult === 'delivered').length;
    const successRate = total > 0 ? (successful / total) * 100 : 0;
    const lastTest = this.testResults.length > 0 
      ? this.testResults[this.testResults.length - 1].timestamp 
      : null;

    const recommendations: string[] = [];
    
    if (successRate < 95) {
      recommendations.push('Check DNS records (SPF, DKIM, DMARC)');
      recommendations.push('Verify domain authentication in AWS SES');
      recommendations.push('Monitor bounce and complaint rates');
    }
    
    if (successRate < 80) {
      recommendations.push('Contact AWS Support for reputation review');
      recommendations.push('Consider dedicated IP warming');
    }

    return {
      totalTests: total,
      successRate,
      lastTestDate: lastTest,
      recommendations
    };
  }
}

export const emailDeliverabilityService = new EmailDeliverabilityService();