// SMS utilities
import logger from './logger';

/**
 * Send SMS using configured SMS service
 * This is a placeholder - integrate with your SMS service (Twilio, AWS SNS, Africa's Talking, etc.)
 */
export interface SendSMSOptions {
  to: string;
  message: string;
  data?: Record<string, any>;
}

export const sendSMS = async (options: SendSMSOptions): Promise<void> => {
  try {
    // TODO: Integrate with actual SMS service (Twilio, AWS SNS, Africa's Talking, etc.)
    // For now, just log the SMS
    logger.info('SMS would be sent:', {
      to: options.to,
      message: options.message,
      data: options.data
    });

    // Example integration with Twilio:
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({
    //   body: options.message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: options.to
    // });

    // Example integration with Africa's Talking:
    // const AfricasTalking = require('africastalking');
    // const africastalking = AfricasTalking({
    //   apiKey: process.env.AFRICASTALKING_API_KEY,
    //   username: process.env.AFRICASTALKING_USERNAME
    // });
    // const sms = africastalking.SMS;
    // await sms.send({
    //   to: [options.to],
    //   message: options.message
    // });

    // Simulate successful SMS send
    return Promise.resolve();
  } catch (error) {
    logger.error('Failed to send SMS:', error);
    throw error;
  }
};

/**
 * Validate phone number format
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  // Basic validation - adjust regex based on your requirements
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

/**
 * Format phone number to E.164 format
 */
export const formatPhoneNumber = (phone: string, countryCode: string = '+1'): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Add country code if not present
  if (!phone.startsWith('+')) {
    return `${countryCode}${cleaned}`;
  }
  
  return `+${cleaned}`;
};

/**
 * Mask phone number for privacy
 */
export const maskPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return phone;
  
  const lastFour = cleaned.slice(-4);
  const masked = '*'.repeat(cleaned.length - 4);
  return `${masked}${lastFour}`;
};
