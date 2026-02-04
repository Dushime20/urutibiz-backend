// Email utilities placeholder
import logger from './logger';

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const extractDomain = (email: string): string => {
  return email.split('@')[1] || '';
};

export const maskEmail = (email: string): string => {
  const [username, domain] = email.split('@');
  if (username.length <= 2) return email;
  const maskedUsername = username[0] + '*'.repeat(username.length - 2) + username[username.length - 1];
  return `${maskedUsername}@${domain}`;
};

/**
 * Send email using configured email service
 * This is a placeholder - integrate with your email service (SendGrid, AWS SES, etc.)
 */
export interface SendEmailOptions {
  to: string;
  subject: string;
  template?: string;
  html?: string;
  text?: string;
  data?: Record<string, any>;
}

export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  try {
    // TODO: Integrate with actual email service (SendGrid, AWS SES, Mailgun, etc.)
    // For now, just log the email
    logger.info('Email would be sent:', {
      to: options.to,
      subject: options.subject,
      template: options.template,
      data: options.data
    });

    // Example integration with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to: options.to,
    //   from: process.env.FROM_EMAIL,
    //   subject: options.subject,
    //   html: options.html || generateEmailFromTemplate(options.template, options.data),
    //   text: options.text
    // });

    // Simulate successful email send
    return Promise.resolve();
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
};

/**
 * Generate email HTML from template
 * This is a placeholder - integrate with your template engine
 */
const generateEmailFromTemplate = (template: string, data: Record<string, any>): string => {
  // TODO: Integrate with template engine (Handlebars, EJS, etc.)
  
  if (template === 'booking-expired') {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #ffffff; padding: 30px; border: 1px solid #e9ecef; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .alert { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .details { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; color: #dc3545;">Booking Expired</h1>
          </div>
          <div class="content">
            <p>Dear ${data.renterName},</p>
            
            <div class="alert">
              <strong>⚠️ Your booking has expired</strong>
            </div>
            
            <p>We're writing to inform you that your booking has expired due to non-payment within the required timeframe.</p>
            
            <div class="details">
              <p><strong>Booking Details:</strong></p>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Booking Number:</strong> #${data.bookingNumber}</li>
                <li><strong>Product:</strong> ${data.productTitle}</li>
                <li><strong>Amount:</strong> ${data.totalAmount ? `$${data.totalAmount}` : 'N/A'}</li>
                <li><strong>Expired At:</strong> ${new Date(data.expiredAt).toLocaleString()}</li>
              </ul>
            </div>
            
            <p>If you still wish to rent this item, please create a new booking on our platform.</p>
            
            <div style="text-align: center;">
              <a href="${data.bookingUrl}" class="button">View Booking Details</a>
            </div>
            
            <p>If you have any questions or concerns, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>The UrutiBiz Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>For support, contact us at ${data.supportEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  return `<p>${JSON.stringify(data)}</p>`;
};
