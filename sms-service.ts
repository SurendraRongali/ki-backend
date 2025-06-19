import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

interface SMSConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

class SMSService {
  private client: twilio.Twilio | null = null;
  private fromNumber: string = '';

  constructor() {
    this.initialize();
  }

  private initialize() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (accountSid && authToken && fromNumber) {
      this.client = twilio(accountSid, authToken);
      this.fromNumber = fromNumber;
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    if (!this.client) {
      console.error('SMS service not configured - missing Twilio credentials');
      return false;
    }

    try {
      await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: to
      });
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }

  async sendVerificationCode(phoneNumber: string, code: string): Promise<boolean> {
    const message = `Your Krugman Insights admin verification code is: ${code}. This code expires in 5 minutes.`;
    return this.sendSMS(phoneNumber, message);
  }
}

export const smsService = new SMSService();