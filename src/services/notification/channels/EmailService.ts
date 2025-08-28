import nodemailer from 'nodemailer';
import { EmailPayload, ChannelResult } from '../types';
import { Logger } from '@/utils/logger';
import { getConfig } from '@/config';

export class EmailService {
  private transporter: nodemailer.Transporter;
  private logger: Logger;
  private config: any;

  constructor() {
    this.logger = new Logger('EmailService');
    this.config = getConfig();
    this.initializeTransporter();
  }

  private async initializeTransporter(): Promise<void> {
    try {
      // If no SMTP credentials, fall back to a local JSON transport to avoid crashes in dev/demo
      if (!this.config?.email?.user || !this.config?.email?.pass) {
        this.transporter = nodemailer.createTransport({ jsonTransport: true } as any);
        this.logger.info('Email service running in JSON transport mode (no SMTP credentials found)');
        return;
      }

      // Create reusable transporter object using SMTP transport
      this.transporter = nodemailer.createTransport({
        host: this.config.email.host || 'smtp.gmail.com',
        port: this.config.email.port || 587,
        secure: this.config.email.secure || false, // true for 465, false for other ports
        auth: {
          user: this.config.email.user,
          pass: this.config.email.pass,
        },
        pool: true, // Use pooled connection
        maxConnections: 5, // Maximum number of connections to pool
        maxMessages: 100, // Maximum number of messages per connection
        rateLimit: 14, // Maximum number of messages per second
        rateDelta: 1000, // Minimum time between messages
      });

      // Verify connection configuration
      await this.transporter.verify();
      this.logger.info('Email service initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize email service', { error: error.message });
      throw error;
    }
  }

  /**
   * Send email notification
   */
  async send(payload: EmailPayload): Promise<ChannelResult> {
    try {
      this.logger.info('Sending email', { to: payload.to, subject: payload.subject });

      // Validate payload
      if (!this.validatePayload(payload)) {
        throw new Error('Invalid email payload');
      }

      // Check rate limiting
      if (!this.checkRateLimit()) {
        throw new Error('Rate limit exceeded');
      }

      // Prepare email options
      const mailOptions = this.prepareMailOptions(payload);

      // Send email
      const result = await this.transporter.sendMail(mailOptions);

      this.logger.info('Email sent successfully', { 
        messageId: result.messageId, 
        to: payload.to 
      });

      return {
        success: true,
        messageId: result.messageId,
        deliveredAt: new Date()
      };

    } catch (error) {
      this.logger.error('Failed to send email', { 
        error: error.message, 
        to: payload.to,
        subject: payload.subject 
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulk(payloads: EmailPayload[]): Promise<ChannelResult[]> {
    const results: ChannelResult[] = [];

    for (const payload of payloads) {
      try {
        // Add delay between emails to respect rate limits
        if (results.length > 0) {
          await this.delay(100); // 100ms delay
        }

        const result = await this.send(payload);
        results.push(result);

      } catch (error) {
        results.push({
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Send email with template
   */
  async sendWithTemplate(
    template: string,
    data: Record<string, any>,
    payload: Omit<EmailPayload, 'html'>
  ): Promise<ChannelResult> {
    try {
      // Render template
      const html = await this.renderTemplate(template, data);
      
      return await this.send({
        ...payload,
        html
      });

    } catch (error) {
      this.logger.error('Failed to send templated email', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate email payload
   */
  private validatePayload(payload: EmailPayload): boolean {
    if (!payload.to || !payload.subject || !payload.html) {
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.to)) {
      return false;
    }

    return true;
  }

  /**
   * Prepare mail options
   */
  private prepareMailOptions(payload: EmailPayload): nodemailer.SendMailOptions {
    const mailOptions: nodemailer.SendMailOptions = {
      from: this.config.email.from || 'noreply@urutibiz.com',
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text || this.htmlToText(payload.html),
      attachments: payload.attachments || [],
      headers: {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'normal'
      }
    };

    // Add custom headers if provided
    if (payload.data?.headers) {
      Object.assign(mailOptions.headers, payload.data.headers);
    }

    return mailOptions;
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  /**
   * Render email template
   */
  private async renderTemplate(template: string, data: Record<string, any>): Promise<string> {
    // Simple template rendering - you can use Handlebars, EJS, or other templating engines
    let html = template;
    
    // Replace variables in template
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, String(value));
    });

    return html;
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(): boolean {
    // Implement rate limiting logic here
    // For now, return true (no rate limiting)
    return true;
  }

  /**
   * Delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get email service status
   */
  async getStatus(): Promise<{ connected: boolean; error?: string }> {
    try {
      await this.transporter.verify();
      return { connected: true };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }

  /**
   * Close email service
   */
  async close(): Promise<void> {
    if (this.transporter) {
      await this.transporter.close();
      this.logger.info('Email service closed');
    }
  }
}
