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

  async testConnection(): Promise<boolean> {
    try {
      if (!this.transporter) return false;
      await this.transporter.verify();
      return true;
    } catch (error) {
      return false;
    }
  }

  async getStatus(): Promise<{ connected: boolean; error?: string }> {
    try {
      if (!this.transporter) {
        return { connected: false, error: 'Transporter not initialized' };
      }
      await this.transporter.verify();
      return { connected: true };
    } catch (error: any) {
      return { connected: false, error: error?.message || 'Unknown error' };
    }
  }

  private renderTemplate(content: EmailContent): { html: string; text: string } {
    const { template, data } = content;

    if (template === 'password-reset') {
      return this.renderPasswordResetTemplate(data);
    }

    // Default: if html or text provided, use them
    const html = content.html || '';
    const text = content.text || (html ? html.replace(/<[^>]*>/g, '') : '');
    return { html, text };
  }

  private renderPasswordResetTemplate(data: Record<string, any> = {}): { html: string; text: string } {
    const html = `
      <div>
        <h2>Password Reset Request</h2>
        <p>Hello ${data.firstName || 'there'},</p>
        <p>We received a request to reset your password.</p>
        <p>Click the link below to reset your password. This link will expire in ${data.expiresIn || '15 minutes'}.</p>
        <p><a href="${data.resetUrl || '#'}">Reset Password</a></p>
        <p>If you did not request this, please ignore this email or contact support at ${data.supportEmail || 'support@urutibiz.com'}.</p>
      </div>
    `;
    const text = `Password Reset Request\n\nVisit: ${data.resetUrl || '#'}\nThis link will expire in ${data.expiresIn || '15 minutes'}.`;
    return { html, text };
  }

  private logEmailContent(content: EmailContent) {
    logger.info('Email (dev mode):', {
      to: content.to,
      subject: content.subject,
      html: content.html,
      text: content.text,
      template: content.template,
      data: content.data
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export for backward compatibility
export default EmailService; 