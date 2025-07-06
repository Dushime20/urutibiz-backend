import { BaseNotificationProvider, NotificationPayload, DeliveryResult } from './BaseNotificationProvider';

export class SMSProvider extends BaseNotificationProvider {
  private apiKey: string;
  private apiUrl: string;
  private senderId: string;

  constructor() {
    super('SMSProvider', 'sms');
    this.apiKey = process.env.SMS_API_KEY || '';
    this.apiUrl = process.env.SMS_API_URL || 'https://api.twilio.com/2010-04-01';
    this.senderId = process.env.SMS_SENDER_ID || 'UrutiBiz';
  }

  protected checkConfiguration(): boolean {
    const requiredEnvVars = [
      'SMS_API_KEY',
      'SMS_API_URL',
      'SMS_ACCOUNT_SID'
    ];

    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missing.length > 0) {
      this.log('warn', `SMS provider disabled - missing environment variables: ${missing.join(', ')}`);
      return false;
    }

    return true;
  }

  public isConfigured(): boolean {
    return this.isEnabled;
  }

  async send(payload: NotificationPayload): Promise<DeliveryResult> {
    if (!this.isEnabled) {
      return this.handleError(new Error('SMS provider not configured'), 'send');
    }

    try {
      // Using Twilio-style API as an example
      const accountSid = process.env.SMS_ACCOUNT_SID;
      const authToken = process.env.SMS_AUTH_TOKEN || this.apiKey;
      
      if (!accountSid || !authToken) {
        return this.handleError(new Error('Missing SMS credentials'), 'send');
      }

      const message = this.formatMessage(payload.message, payload.metadata);
      
      // Simulate SMS API call - replace with actual provider
      const response = await this.sendViaTwilio(accountSid, authToken, {
        to: payload.to,
        from: this.senderId,
        body: message
      });

      this.log('info', `SMS sent successfully to ${payload.to}`, {
        messageId: response.sid,
        status: response.status
      });

      return this.createSuccessResult(response.sid, {
        to: payload.to,
        provider: 'twilio',
        status: response.status
      });

    } catch (error) {
      return this.handleError(error, 'send SMS');
    }
  }

  private async sendViaTwilio(accountSid: string, authToken: string, message: any): Promise<any> {
    // This is a mock implementation - replace with actual Twilio SDK calls
    const url = `${this.apiUrl}/Accounts/${accountSid}/Messages.json`;
    
    const body = new URLSearchParams({
      To: message.to,
      From: message.from,
      Body: message.body
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`SMS API error: ${response.status} ${errorData}`);
    }

    return await response.json();
  }

  private formatMessage(message: string, metadata?: Record<string, any>): string {
    // Strip HTML and limit to SMS length
    let cleanMessage = message.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    
    // Add action URL if present and fits
    if (metadata?.action_url && cleanMessage.length < 120) {
      cleanMessage += `\n\nView: ${metadata.action_url}`;
    }

    // Truncate to SMS limits (160 chars for single SMS)
    if (cleanMessage.length > 155) {
      cleanMessage = cleanMessage.substring(0, 152) + '...';
    }

    return cleanMessage;
  }

  async testConnection(): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    try {
      // Test with a mock validation call
      const accountSid = process.env.SMS_ACCOUNT_SID;
      const authToken = process.env.SMS_AUTH_TOKEN || this.apiKey;
      
      if (!accountSid || !authToken) {
        return false;
      }

      // In a real implementation, you'd make a validation call to the SMS provider
      this.log('info', 'SMS connection test successful (mock)');
      return true;
    } catch (error) {
      this.log('error', 'SMS connection test failed', error);
      return false;
    }
  }
}
