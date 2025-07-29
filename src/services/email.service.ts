import nodemailer from 'nodemailer';
import logger from '@/utils/logger';

interface EmailContent {
  to: string;
  subject: string;
  template?: string;
  data?: Record<string, any>;
  html?: string;
  text?: string;
}

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig;

  constructor() {
    this.config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      fromEmail: process.env.FROM_EMAIL || 'noreply@urutibiz.com',
      fromName: process.env.FROM_NAME || 'UrutiBiz'
    };

    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      if (this.config.user && this.config.pass) {
        this.transporter = nodemailer.createTransport({
          host: this.config.host,
          port: this.config.port,
          secure: this.config.secure,
          auth: {
            user: this.config.user,
            pass: this.config.pass
          }
        });
        logger.info('Email transporter initialized successfully');
      } else {
        logger.warn('SMTP credentials not configured, email sending disabled');
        this.transporter = null;
      }
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
      this.transporter = null;
    }
  }

  async sendEmail(content: EmailContent): Promise<boolean> {
    try {
      if (!this.transporter) {
        logger.warn('Email transporter not available, logging email content instead');
        this.logEmailContent(content);
        return true; // Return true to avoid breaking the flow
      }

      const { html, text } = this.renderTemplate(content);

      const mailOptions = {
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to: content.to,
        subject: content.subject,
        text: text,
        html: html
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', { 
        messageId: result.messageId, 
        to: content.to 
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  private renderTemplate(content: EmailContent): { html: string; text: string } {
    const { template, data } = content;

    if (template === 'password-reset') {
      return this.renderPasswordResetTemplate(data);
    }

    // Default template
    return {
      html: content.html || '<p>No content</p>',
      text: content.text || 'No content'
    };
  }

  private renderPasswordResetTemplate(data: Record<string, any> = {}): { html: string; text: string } {
    const {
      firstName = 'User',
      resetUrl = '',
      expiresIn = '15 minutes',
      supportEmail = 'support@urutibiz.com'
    } = data;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - UrutiBiz</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #00aaa9; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #00aaa9; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 10px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>UrutiBiz</h1>
            <h2>Password Reset Request</h2>
          </div>
          <div class="content">
            <p>Hello ${firstName},</p>
            <p>We received a request to reset your password for your UrutiBiz account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <div class="warning">
              <strong>Important:</strong> This link will expire in ${expiresIn}. If you didn't request this password reset, please ignore this email.
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #00aaa9;">${resetUrl}</p>
            <p>If you have any questions, please contact us at <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
          </div>
          <div class="footer">
            <p>This email was sent by UrutiBiz. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} UrutiBiz. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Password Reset Request - UrutiBiz

Hello ${firstName},

We received a request to reset your password for your UrutiBiz account.

To reset your password, click the following link:
${resetUrl}

Important: This link will expire in ${expiresIn}. If you didn't request this password reset, please ignore this email.

If you have any questions, please contact us at ${supportEmail}.

Best regards,
The UrutiBiz Team
    `;

    return { html, text };
  }

  private logEmailContent(content: EmailContent) {
    logger.info('Email content (not sent due to missing SMTP configuration):', {
      to: content.to,
      subject: content.subject,
      template: content.template,
      data: content.data
    });
  }

  // Test email configuration
  async testConnection(): Promise<boolean> {
    try {
      if (!this.transporter) {
        logger.warn('Email transporter not available for testing');
        return false;
      }

      await this.transporter.verify();
      logger.info('Email connection test successful');
      return true;
    } catch (error) {
      logger.error('Email connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export for backward compatibility
export default EmailService; 