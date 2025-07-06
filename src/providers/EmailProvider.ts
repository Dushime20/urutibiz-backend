import { BaseNotificationProvider, NotificationPayload, DeliveryResult } from './BaseNotificationProvider';
import nodemailer from 'nodemailer';

export class EmailProvider extends BaseNotificationProvider {
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    super('EmailProvider', 'email');
    this.fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@urutibiz.com';
    this.fromName = process.env.SMTP_FROM_NAME || 'UrutiBiz';
    
    if (this.isEnabled) {
      this.initializeTransporter();
    }
  }

  protected checkConfiguration(): boolean {
    const requiredEnvVars = [
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS'
    ];

    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missing.length > 0) {
      this.log('warn', `Email provider disabled - missing environment variables: ${missing.join(', ')}`);
      return false;
    }

    return true;
  }

  public isConfigured(): boolean {
    return this.isEnabled && this.transporter !== null;
  }

  private initializeTransporter(): void {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false'
        }
      });

      this.log('info', 'Email transporter initialized successfully');
    } catch (error) {
      this.log('error', 'Failed to initialize email transporter', error);
      this.transporter = null;
      this.isEnabled = false;
    }
  }

  async send(payload: NotificationPayload): Promise<DeliveryResult> {
    if (!this.isEnabled || !this.transporter) {
      return this.handleError(new Error('Email provider not configured'), 'send');
    }

    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: payload.to,
        subject: payload.subject || 'UrutiBiz Notification',
        text: this.stripHtml(payload.message),
        html: this.formatHtmlMessage(payload.message, payload.metadata),
        headers: {
          'X-Notification-ID': payload.metadata?.notificationId || 'unknown',
          'X-Template-ID': payload.templateId || 'custom'
        }
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.log('info', `Email sent successfully to ${payload.to}`, {
        messageId: result.messageId,
        subject: payload.subject
      });

      return this.createSuccessResult(result.messageId, {
        to: payload.to,
        subject: payload.subject,
        provider: 'nodemailer'
      });

    } catch (error) {
      return this.handleError(error, 'send email');
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  private formatHtmlMessage(message: string, metadata?: Record<string, any>): string {
    // If message already contains HTML tags, use as is
    if (message.includes('<') && message.includes('>')) {
      return this.wrapInEmailTemplate(message, metadata);
    }

    // Convert plain text to HTML
    const htmlMessage = message
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');

    return this.wrapInEmailTemplate(htmlMessage, metadata);
  }

  private wrapInEmailTemplate(content: string, metadata?: Record<string, any>): string {
    const brandColor = process.env.BRAND_COLOR || '#007bff';
    const companyName = process.env.COMPANY_NAME || 'UrutiBiz';
    const appUrl = process.env.APP_URL || 'https://urutibiz.com';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${companyName} Notification</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: ${brandColor}; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; line-height: 1.6; color: #333; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background-color: ${brandColor}; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0; }
        .button:hover { background-color: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${companyName}</h1>
        </div>
        <div class="content">
            ${content}
            ${metadata?.action_url ? `<div style="text-align: center; margin: 24px 0;"><a href="${metadata.action_url}" class="button">View Details</a></div>` : ''}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
            <p><a href="${appUrl}/unsubscribe?token=${metadata?.unsubscribeToken || ''}">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>`;
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      this.log('info', 'Email connection test successful');
      return true;
    } catch (error) {
      this.log('error', 'Email connection test failed', error);
      return false;
    }
  }
}
