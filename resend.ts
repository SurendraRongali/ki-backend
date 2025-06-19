import { Resend } from 'resend';
import { 
  generateWelcomeEmail, 
  generatePasswordResetEmail, 
  generatePasswordChangeConfirmationEmail,
  generateNewsletterWelcomeEmail,
  generateArticlePurchaseEmail,
  generateContactFormAutoResponse 
} from './email-templates';

// Initialize Resend - only if API key is provided
// Import Resend using CommonJS require to avoid ES module issues
let resend: any = null;

try {
  const { Resend } = require('resend');
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
    console.log('✅ Resend email service initialized');
  } else {
    console.log('⚠️ Resend API key not found - email service disabled');
  }
} catch (error) {
  console.log('⚠️ Resend import failed - using fallback email service');
  resend = null;
}

interface EmailParams {
  to: string | string[];
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!resend) {
    console.log('📧 Email service not available - Resend API key not configured');
    return false;
  }

  try {
    const result = await resend.emails.send({
      from: params.from,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    if (result.error) {
      console.error('Resend email error:', result.error);
      return false;
    }

    console.log('✅ Email sent successfully:', result.data?.id);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
  const html = generateWelcomeEmail(firstName, email);
  
  return await sendEmail({
    to: email,
    from: 'Krugman Insights Team <team@krugmaninsights.com>',
    subject: 'Welcome to Krugman Insights - Your Premium Financial Intelligence Platform',
    html,
    text: `Welcome to Krugman Insights, ${firstName}! We're excited to have you join our community of finance professionals. Visit your dashboard: https://krugmaninsights.com/dashboard`
  });
}

export function generateWelcomeEmailParams(
  recipientEmail: string,
  firstName: string
): EmailParams {
  const html = generateWelcomeEmail(firstName, recipientEmail);
  
  return {
    to: recipientEmail,
    from: 'Krugman Insights Team <team@krugmaninsights.com>',
    subject: 'Welcome to Krugman Insights - Your Premium Financial Intelligence Platform',
    text: `Welcome to Krugman Insights, ${firstName}! We're excited to have you join our community of finance professionals.`,
    html,
  };
}

export async function sendPasswordResetEmail(email: string, firstName: string, resetLink: string): Promise<boolean> {
  const resetToken = resetLink.split('token=')[1] || resetLink;
  const html = generatePasswordResetEmail(email, resetToken);
  
  return await sendEmail({
    to: email,
    from: 'Krugman Insights Security <security@krugmaninsights.com>',
    subject: 'Reset Your Krugman Insights Password',
    html,
    text: `Password reset request for your Krugman Insights account. Click here to reset: ${resetLink}`
  });
}

export async function sendPasswordChangeConfirmationEmail(email: string, firstName: string): Promise<boolean> {
  const html = generatePasswordChangeConfirmationEmail(email, firstName);
  
  return await sendEmail({
    to: email,
    from: 'Krugman Insights Security <security@krugmaninsights.com>',
    subject: 'Password Changed Successfully - Krugman Insights',
    html,
    text: `Your Krugman Insights password has been successfully changed on ${new Date().toLocaleDateString()}.`
  });
}

export function generatePasswordResetEmailParams(
  recipientEmail: string,
  firstName: string,
  resetLink: string
): EmailParams {
  const resetToken = resetLink.split('token=')[1] || resetLink;
  const html = generatePasswordResetEmail(recipientEmail, resetToken);
  
  return {
    to: recipientEmail,
    from: 'Krugman Insights Security <security@krugmaninsights.com>',
    subject: 'Reset Your Krugman Insights Password',
    text: `Password reset request for your Krugman Insights account. Click here to reset: ${resetLink}`,
    html,
  };
}

export function generatePasswordChangeConfirmationEmailParams(
  recipientEmail: string,
  firstName: string
): EmailParams {
  const html = generatePasswordChangeConfirmationEmail(recipientEmail, firstName);
  
  return {
    to: recipientEmail,
    from: 'Krugman Insights Security <security@krugmaninsights.com>',
    subject: 'Password Changed Successfully - Krugman Insights',
    text: `Your Krugman Insights password has been successfully changed on ${new Date().toLocaleDateString()}.`,
    html,
  };
}

export async function sendNewsletterWelcome(email: string, firstName: string): Promise<boolean> {
  const html = generateNewsletterWelcomeEmail(email);
  
  return await sendEmail({
    to: email,
    from: 'Krugman Insights Editorial <editorial@krugmaninsights.com>',
    subject: 'Newsletter Subscription Confirmed - Krugman Insights',
    html,
    text: `Thank you for subscribing to the Krugman Insights newsletter! You'll receive weekly market analysis and exclusive insights.`
  });
}

export function generateNewsletterWelcomeParams(
  recipientEmail: string,
  firstName: string
): EmailParams {
  const html = generateNewsletterWelcomeEmail(recipientEmail);
  
  return {
    to: recipientEmail,
    from: 'Krugman Insights Editorial <editorial@krugmaninsights.com>',
    subject: 'Newsletter Subscription Confirmed - Krugman Insights',
    text: `Thank you for subscribing to the Krugman Insights newsletter, ${firstName}!`,
    html,
  };
}

export async function sendStudentVerificationEmail(email: string, firstName: string, verificationCode: string): Promise<boolean> {
  return await sendEmail({
    to: email,
    from: 'Krugman Insights Support <support@krugmaninsights.com>',
    subject: 'Student Verification Code - Krugman Insights',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Student Verification Code</h2>
        <p>Hello ${firstName},</p>
        <p>Your student verification code is: <strong>${verificationCode}</strong></p>
        <p>Enter this code to verify your student status and access discounted pricing.</p>
      </div>
    `,
    text: `Student verification code: ${verificationCode}`
  });
}

export function generateStudentVerificationEmailParams(
  recipientEmail: string,
  firstName: string,
  verificationCode: string
): EmailParams {
  return {
    to: recipientEmail,
    from: 'Krugman Insights Support <support@krugmaninsights.com>',
    subject: 'Student Verification Code - Krugman Insights',
    text: `Student verification code: ${verificationCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Student Verification Code</h2>
        <p>Hello ${firstName},</p>
        <p>Your student verification code is: <strong>${verificationCode}</strong></p>
        <p>Enter this code to verify your student status and access discounted pricing.</p>
      </div>
    `,
  };
}

export async function sendGiftArticleEmail(
  recipientEmail: string,
  articleTitle: string,
  senderName: string,
  message?: string
): Promise<boolean> {
  return await sendEmail({
    to: recipientEmail,
    from: 'Krugman Insights <gifts@krugmaninsights.com>',
    subject: `${senderName} has gifted you an article - Krugman Insights`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You've received a gift article!</h2>
        <p><strong>${senderName}</strong> has gifted you access to:</p>
        <h3>"${articleTitle}"</h3>
        ${message ? `<p><em>Personal message: ${message}</em></p>` : ''}
        <p><a href="https://krugmaninsights.com" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Read Article</a></p>
      </div>
    `,
    text: `${senderName} has gifted you an article: "${articleTitle}". ${message || ''}`
  });
}

export async function sendArticlePurchaseEmailResend(
  email: string,
  firstName: string,
  lastName: string,
  articleTitle: string,
  pdfBuffer: Buffer
): Promise<boolean> {
  const html = generateArticlePurchaseEmail(email, articleTitle, firstName);
  
  return await sendEmail({
    to: email,
    from: 'Krugman Insights <purchases@krugmaninsights.com>',
    subject: 'Article Purchase Confirmation - Krugman Insights',
    html,
    text: `Thank you for purchasing "${articleTitle}" from Krugman Insights. Your article is now available in your dashboard.`
  });
}

export async function sendGiftArticleEmailResend(
  recipientEmail: string,
  articleTitle: string,
  senderName: string,
  pdfBuffer: Buffer,
  message?: string
): Promise<boolean> {
  return await sendGiftArticleEmail(recipientEmail, articleTitle, senderName, message);
}

export async function sendGiftConfirmationEmailResend(
  senderEmail: string,
  recipientEmail: string,
  articleTitle: string
): Promise<boolean> {
  return await sendEmail({
    to: senderEmail,
    from: 'Krugman Insights <gifts@krugmaninsights.com>',
    subject: 'Gift Article Sent - Krugman Insights',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Gift Article Sent Successfully</h2>
        <p>Your gift article has been sent to ${recipientEmail}:</p>
        <h3>"${articleTitle}"</h3>
        <p>They will receive an email with access to the article.</p>
      </div>
    `,
    text: `Your gift article "${articleTitle}" has been sent to ${recipientEmail}.`
  });
}

function generateArticlePurchaseHTML(firstName: string, lastName: string, articleTitle: string): string {
  return generateArticlePurchaseEmail('', articleTitle, firstName);
}