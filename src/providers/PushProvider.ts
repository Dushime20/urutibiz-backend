import { BaseNotificationProvider, NotificationPayload, DeliveryResult } from './BaseNotificationProvider';

export class PushProvider extends BaseNotificationProvider {
  private fcmServerKey: string;
  private fcmApiUrl: string;

  constructor() {
    super('PushProvider', 'push');
    this.fcmServerKey = process.env.FCM_SERVER_KEY || '';
    this.fcmApiUrl = process.env.FCM_API_URL || 'https://fcm.googleapis.com/fcm/send';
  }

  protected checkConfiguration(): boolean {
    const requiredEnvVars = ['FCM_SERVER_KEY'];

    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missing.length > 0) {
      this.log('warn', `Push provider disabled - missing environment variables: ${missing.join(', ')}`);
      return false;
    }

    return true;
  }

  public isConfigured(): boolean {
    return this.isEnabled;
  }

  async send(payload: NotificationPayload): Promise<DeliveryResult> {
    if (!this.isEnabled) {
      return this.handleError(new Error('Push provider not configured'), 'send');
    }

    try {
      // Payload.to should be the FCM token for push notifications
      const fcmToken = payload.to;
      
      if (!fcmToken) {
        return this.handleError(new Error('No FCM token provided'), 'send');
      }

      const pushPayload = this.createPushPayload(payload);
      const response = await this.sendToFCM(pushPayload);

      this.log('info', `Push notification sent successfully`, {
        messageId: response.messageId,
        token: fcmToken.substring(0, 20) + '...'
      });

      return this.createSuccessResult(response.messageId, {
        token: fcmToken.substring(0, 20) + '...',
        provider: 'fcm',
        multicastId: response.multicast_id
      });

    } catch (error) {
      return this.handleError(error, 'send push notification');
    }
  }

  private createPushPayload(payload: NotificationPayload): any {
    const notification = {
      title: payload.subject || 'UrutiBiz Notification',
      body: this.formatMessage(payload.message),
      icon: process.env.PUSH_ICON_URL || '/assets/icons/notification-icon.png',
      click_action: payload.metadata?.action_url || process.env.APP_URL || 'https://urutibiz.com'
    };

    const data = {
      notificationId: payload.metadata?.notificationId || '',
      type: payload.metadata?.type || 'general',
      action_url: payload.metadata?.action_url || '',
      timestamp: new Date().toISOString(),
      ...payload.variables
    };

    return {
      to: payload.to, // FCM token
      notification,
      data,
      android: {
        priority: 'high',
        notification: {
          channel_id: 'default',
          sound: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            'content-available': 1
          }
        }
      },
      webpush: {
        headers: {
          TTL: '3600'
        },
        notification: {
          icon: notification.icon,
          badge: '/assets/icons/badge-icon.png',
          actions: payload.metadata?.action_url ? [{
            action: 'view',
            title: 'View',
            icon: '/assets/icons/view-icon.png'
          }] : undefined
        }
      }
    };
  }

  private async sendToFCM(payload: any): Promise<any> {
    const response = await fetch(this.fcmApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `key=${this.fcmServerKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`FCM API error: ${response.status} ${errorData}`);
    }

    const result: any = await response.json();
    
    if (result.failure > 0) {
      const errors = result.results?.filter((r: any) => r.error);
      throw new Error(`FCM delivery failed: ${errors?.[0]?.error || 'Unknown error'}`);
    }

    return {
      messageId: result.results?.[0]?.message_id || 'unknown',
      multicast_id: result.multicast_id
    };
  }

  private formatMessage(message: string): string {
    // Strip HTML and limit length for push notifications
    let cleanMessage = message.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    
    // Limit to reasonable push notification length
    if (cleanMessage.length > 120) {
      cleanMessage = cleanMessage.substring(0, 117) + '...';
    }

    return cleanMessage;
  }

  async testConnection(): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    try {
      // For FCM v1 API, you'd use a different endpoint and authentication
      // This is a simplified test
      this.log('info', 'Push connection test successful (mock)');
      return true;
    } catch (error) {
      this.log('error', 'Push connection test failed', error);
      return false;
    }
  }

  // Method to send to multiple tokens (multicast)
  async sendMulticast(tokens: string[], payload: NotificationPayload): Promise<DeliveryResult[]> {
    if (!this.isEnabled) {
      return tokens.map(() => this.handleError(new Error('Push provider not configured'), 'sendMulticast'));
    }

    try {
      const pushPayload = {
        ...this.createPushPayload(payload),
        registration_ids: tokens
      };

      delete pushPayload.to; // Remove single token for multicast

      const response = await this.sendToFCM(pushPayload);
      
      // Process results for each token
      const results: DeliveryResult[] = [];
      if (response.results) {
        response.results.forEach((result: any, index: number) => {
          if (result.message_id) {
            results.push(this.createSuccessResult(result.message_id, {
              token: tokens[index].substring(0, 20) + '...',
              provider: 'fcm'
            }));
          } else {
            results.push(this.handleError(new Error(result.error || 'Unknown error'), 'multicast send'));
          }
        });
      }

      return results;
    } catch (error) {
      return tokens.map(() => this.handleError(error, 'sendMulticast'));
    }
  }
}
