import AWS from 'aws-sdk';
import { promises as fs } from 'fs';
import path from 'path';

// Configure AWS SES for enterprise email delivery
const ses = new AWS.SES({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'eu-west-1',
  apiVersion: '2010-12-01'
});

console.log('✅ AWS SES email service initialized');

interface EmailData {
  to: string;
  firstName: string;
  lastName: string;
  articleTitle: string;
}

interface ArticleEmailParams extends EmailData {
  pdfBuffer: Buffer;
  articleId: number;
}

export class EmailService {
  private static getArticleEmailHTML(data: EmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Article from Krugman Insights</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #374151;
              background-color: #f9fafb;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #B91C1C 0%, #DC2626 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .logo {
              background-color: white;
              color: #B91C1C;
              padding: 12px 20px;
              display: inline-block;
              font-weight: 700;
              font-size: 18px;
              letter-spacing: 0.5px;
              border-radius: 6px;
              margin-bottom: 20px;
            }
            .header-text {
              color: white;
              font-size: 24px;
              font-weight: 600;
              margin: 0;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              font-weight: 500;
              color: #111827;
              margin-bottom: 20px;
            }
            .message {
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 30px;
            }
            .article-title {
              background: #F3F4F6;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #B91C1C;
              margin: 20px 0;
            }
            .article-title h3 {
              color: #111827;
              font-size: 18px;
              font-weight: 600;
              margin: 0;
            }
            .features {
              background: #FEF2F2;
              padding: 25px;
              border-radius: 8px;
              margin: 25px 0;
            }
            .features h4 {
              color: #B91C1C;
              font-size: 16px;
              font-weight: 600;
              margin: 0 0 15px 0;
            }
            .features ul {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            .features li {
              padding: 5px 0;
              position: relative;
              padding-left: 20px;
            }
            .features li:before {
              content: "✓";
              color: #B91C1C;
              font-weight: bold;
              position: absolute;
              left: 0;
            }
            .cta-section {
              text-align: center;
              padding: 30px 0;
              border-top: 1px solid #E5E7EB;
              margin-top: 30px;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #B91C1C 0%, #DC2626 100%);
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              font-size: 16px;
              margin-bottom: 15px;
            }
            .footer {
              background: #F9FAFB;
              padding: 30px;
              text-align: center;
              color: #6B7280;
              font-size: 14px;
              border-top: 1px solid #E5E7EB;
            }
            .footer a {
              color: #B91C1C;
              text-decoration: none;
            }
            .watermark-notice {
              background: rgba(185, 28, 28, 0.1);
              border: 1px solid rgba(185, 28, 28, 0.2);
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
              font-size: 14px;
              color: #B91C1C;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Ki KRUGMAN INSIGHTS</div>
              <h1 class="header-text">Your Premium Article</h1>
            </div>
            
            <div class="content">
              <div class="greeting">Hello ${data.firstName},</div>
              
              <div class="message">
                Thank you for your purchase! We're delighted to deliver your premium article from Krugman Insights.
              </div>
              
              <div class="article-title">
                <h3>${data.articleTitle}</h3>
              </div>
              
              <div class="message">
                Your article is attached as a professionally formatted PDF, personalized with your name and optimized for reading. This premium content provides you with:
              </div>
              
              <div class="features">
                <h4>What's Included:</h4>
                <ul>
                  <li>Full article content with professional formatting</li>
                  <li>High-quality images and charts</li>
                  <li>Key insights and analysis</li>
                  <li>Personalized watermarking for security</li>
                  <li>Print-friendly design</li>
                </ul>
              </div>
              
              <div class="watermark-notice">
                <strong>Personal Use Only:</strong> This article is personalized for you and should not be shared or distributed. Thank you for respecting our content licensing.
              </div>
              
              <div class="cta-section">
                <a href="https://krugmaninsights.com" class="cta-button">Explore More Premium Content</a>
                <div style="margin-top: 15px; color: #6B7280;">
                  Consider our subscription plans for unlimited access to all premium articles
                </div>
              </div>
            </div>
            
            <div class="footer">
              <div style="margin-bottom: 15px;">
                <strong>Krugman Insights</strong><br>
                Premium Financial Intelligence
              </div>
              <div>
                <a href="https://krugmaninsights.com">Visit our website</a> | 
                <a href="https://krugmaninsights.com/subscribe">Subscribe</a> | 
                <a href="https://krugmaninsights.com/contact">Contact Us</a>
              </div>
              <div style="margin-top: 15px; font-size: 12px;">
                © ${new Date().getFullYear()} Krugman Insights. All rights reserved.
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static async sendArticlePDF(params: ArticleEmailParams): Promise<boolean> {
    try {
      const htmlContent = this.getArticleEmailHTML(params);
      const textContent = `Hello ${params.firstName},\n\nThank you for your purchase! Your article "${params.articleTitle}" is attached as a PDF.\n\nThis content is personalized for you and should not be shared or distributed.\n\nBest regards,\nKrugman Insights Team`;
      
      const sesParams = {
        Source: 'Krugman Insights <noreply@krugmaninsights.com>',
        Destination: {
          ToAddresses: [params.to]
        },
        Message: {
          Subject: {
            Data: `Your Article: ${params.articleTitle}`,
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: htmlContent,
              Charset: 'UTF-8'
            },
            Text: {
              Data: textContent,
              Charset: 'UTF-8'
            }
          }
        },
        Tags: [
          {
            Name: 'Environment',
            Value: process.env.NODE_ENV || 'development'
          },
          {
            Name: 'Service',
            Value: 'ArticlePDF'
          }
        ]
      };

      const result = await ses.sendEmail(sesParams).promise();
      console.log(`Article PDF sent successfully to ${params.to}`, result.MessageId);
      return true;
    } catch (error) {
      console.error('AWS SES email error:', error);
      return false;
    }
  }

  static async sendPurchaseConfirmation(data: EmailData): Promise<boolean> {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Purchase Confirmation - Krugman Insights</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                line-height: 1.6;
                color: #374151;
                background-color: #f9fafb;
                margin: 0;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              }
              .header {
                background: linear-gradient(135deg, #B91C1C 0%, #DC2626 100%);
                padding: 40px 30px;
                text-align: center;
                color: white;
              }
              .logo {
                background-color: white;
                color: #B91C1C;
                padding: 12px 20px;
                display: inline-block;
                font-weight: 700;
                font-size: 18px;
                letter-spacing: 0.5px;
                border-radius: 6px;
                margin-bottom: 20px;
              }
              .content {
                padding: 40px 30px;
              }
              .success-icon {
                text-align: center;
                margin-bottom: 20px;
              }
              .success-icon div {
                background: #10B981;
                color: white;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Ki KRUGMAN INSIGHTS</div>
                <h1>Purchase Confirmed!</h1>
              </div>
              <div class="content">
                <div class="success-icon">
                  <div>✓</div>
                </div>
                <h2 style="text-align: center; color: #111827;">Thank you, ${data.firstName}!</h2>
                <p>Your purchase of "${data.articleTitle}" has been confirmed. You will receive your personalized PDF article within the next few minutes.</p>
                <p style="text-align: center; margin-top: 30px;">
                  <a href="https://krugmaninsights.com" style="background: #B91C1C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">Explore More Articles</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

      const textContent = `Hello ${data.firstName},\n\nYour purchase of "${data.articleTitle}" has been confirmed. You will receive your personalized PDF article within the next few minutes.\n\nThank you for choosing Krugman Insights!\n\nBest regards,\nKrugman Insights Team`;

      const sesParams = {
        Source: 'Krugman Insights <noreply@krugmaninsights.com>',
        Destination: {
          ToAddresses: [data.to]
        },
        Message: {
          Subject: {
            Data: 'Purchase Confirmed - Your Article is Being Prepared',
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: htmlContent,
              Charset: 'UTF-8'
            },
            Text: {
              Data: textContent,
              Charset: 'UTF-8'
            }
          }
        },
        Tags: [
          {
            Name: 'Environment',
            Value: process.env.NODE_ENV || 'development'
          },
          {
            Name: 'Service',
            Value: 'PurchaseConfirmation'
          }
        ]
      };

      const result = await ses.sendEmail(sesParams).promise();
      console.log(`Purchase confirmation sent successfully to ${data.to}`, result.MessageId);
      return true;
    } catch (error) {
      console.error('AWS SES confirmation email error:', error);
      return false;
    }
  }
}