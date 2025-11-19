import { WebhookPayload, ChannelResult } from '../types';
import { Logger } from '@/utils/logger';
import axios, { AxiosResponse } from 'axios';

export class WebhookService {
  private logger: Logger;
  private config: any;

  constructor() {
    this.logger = new Logger('WebhookService');
    // Initialize webhook configuration
    this.config = this.getWebhookConfig();
  }

  /**
   * Send webhook notification
   */
  async send(payload: WebhookPayload): Promise<ChannelResult> {
    try {
      this.logger.info('Sending webhook', { url: payload.url });

      // Validate payload
      if (!this.validatePayload(payload)) {
        throw new Error('Invalid webhook payload');
      }

      // Check rate limiting
      if (!this.checkRateLimit(payload.url)) {
        throw new Error('Rate limit exceeded for webhook URL');
      }

      // Send webhook
      const result = await this.sendWebhook(payload);

      this.logger.info('Webhook sent successfully', { 
        url: payload.url,
        status: result.status,
        messageId: result.messageId
      });

      return {
        success: true,
        messageId: result.messageId,
        deliveredAt: new Date()
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to send webhook', { 
        error: errorMessage, 
        url: payload.url 
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Send webhook to multiple URLs
   */
  async sendToMultipleUrls(
    urls: string[],
    payload: Omit<WebhookPayload, 'url'>
  ): Promise<ChannelResult[]> {
    const results: ChannelResult[] = [];

    for (const url of urls) {
      try {
        const result = await this.send({
          ...payload,
          url
        });
        results.push(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({
          success: false,
          error: errorMessage
        });
      }
    }

    return results;
  }

  /**
   * Get webhook service status
   */
  async getStatus(): Promise<{ connected: boolean; error?: string }> {
    try {
      // Check webhook service health
      const isHealthy = await this.checkHealth();
      return { connected: isHealthy };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { connected: false, error: errorMessage };
    }
  }

  /**
   * Test webhook endpoint
   */
  async testWebhook(url: string, timeout: number = 10000): Promise<{ success: boolean; error?: string; responseTime?: number }> {
    try {
      const startTime = Date.now();
      
      const response = await axios.get(url, {
        timeout,
        validateStatus: () => true // Accept any status code
      });

      const responseTime = Date.now() - startTime;

      if (response.status >= 200 && response.status < 300) {
        return { success: true, responseTime };
      } else {
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${response.statusText}`,
          responseTime
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }

  /**
   * Private methods
   */
  private getWebhookConfig(): any {
    return {
      timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '10000'),
      maxRetries: parseInt(process.env.WEBHOOK_MAX_RETRIES || '3'),
      retryDelay: parseInt(process.env.WEBHOOK_RETRY_DELAY || '1000'),
      rateLimit: {
        requestsPerMinute: parseInt(process.env.WEBHOOK_RATE_LIMIT || '60'),
        burstLimit: parseInt(process.env.WEBHOOK_BURST_LIMIT || '10')
      }
    };
  }

  private validatePayload(payload: WebhookPayload): boolean {
    if (!payload.url || !payload.payload) {
      return false;
    }

    // Validate URL format
    try {
      new URL(payload.url);
    } catch {
      return false;
    }

    // Check payload size (limit to 1MB)
    const payloadSize = JSON.stringify(payload.payload).length;
    if (payloadSize > 1024 * 1024) {
      return false;
    }

    return true;
  }

  private async sendWebhook(payload: WebhookPayload): Promise<{ status: number; messageId: string }> {
    const { timeout, maxRetries, retryDelay } = this.config;
    const method = payload.method || 'POST';
    const headers = payload.headers || { 'Content-Type': 'application/json' };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response: AxiosResponse = await axios({
          method,
          url: payload.url,
          data: payload.payload,
          headers,
          timeout,
          validateStatus: () => true // Accept any status code
        });

        // Check if response indicates success
        if (response.status >= 200 && response.status < 300) {
          return {
            status: response.status,
            messageId: `webhook_${Date.now()}_${attempt}`
          };
        }

        // If not successful, throw error for retry
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.warn(`Webhook attempt ${attempt} failed, retrying...`, {
            url: payload.url,
            error: errorMessage,
            attempt
          });

          // Wait before retry
          await this.delay(retryDelay * attempt); // Exponential backoff
        }
      }
    }

    // All attempts failed
    throw lastError || new Error('Webhook failed after all retry attempts');
  }

  private checkRateLimit(url: string): boolean {
    // Implement rate limiting logic here
    // For now, return true (no rate limiting)
    return true;
  }

  private async checkHealth(): Promise<boolean> {
    // Check webhook service health
    // For now, return true
    return true;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
