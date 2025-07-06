import { NotificationChannelType } from '@/types/notification.types';
import logger from '@/utils/logger';

export interface DeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: Record<string, any>;
}

export interface NotificationPayload {
  to: string;
  subject?: string;
  message: string;
  metadata?: Record<string, any>;
  templateId?: string;
  variables?: Record<string, any>;
}

export abstract class BaseNotificationProvider {
  protected providerName: string;
  protected channel: NotificationChannelType;
  protected isEnabled: boolean;

  constructor(providerName: string, channel: NotificationChannelType) {
    this.providerName = providerName;
    this.channel = channel;
    this.isEnabled = this.checkConfiguration();
  }

  abstract send(payload: NotificationPayload): Promise<DeliveryResult>;
  abstract isConfigured(): boolean;

  protected abstract checkConfiguration(): boolean;

  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    logger[level](`[${this.providerName}] ${message}`, data);
  }

  public getChannel(): NotificationChannelType {
    return this.channel;
  }

  public getProviderName(): string {
    return this.providerName;
  }

  public enabled(): boolean {
    return this.isEnabled;
  }

  protected handleError(error: any, operation: string): DeliveryResult {
    const errorMessage = error?.message || 'Unknown error';
    this.log('error', `${operation} failed: ${errorMessage}`, error);
    
    return {
      success: false,
      error: errorMessage,
      details: {
        operation,
        timestamp: new Date().toISOString(),
        provider: this.providerName
      }
    };
  }

  protected createSuccessResult(messageId?: string, details?: Record<string, any>): DeliveryResult {
    return {
      success: true,
      messageId,
      details: {
        timestamp: new Date().toISOString(),
        provider: this.providerName,
        ...details
      }
    };
  }
}
