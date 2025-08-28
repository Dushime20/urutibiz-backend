import { PushNotificationPayload, ChannelResult } from '../types';
import { Logger } from '@/utils/logger';
import admin from 'firebase-admin';
import { getDatabase } from '@/config/database';

export class PushNotificationService {
  private logger: Logger;
  private config: any;

  constructor() {
    this.logger = new Logger('PushNotificationService');
    // Initialize push notification configuration (Firebase, OneSignal, etc.)
    this.config = this.getPushConfig();
    this.initializeFirebaseIfNeeded();
  }

  /**
   * Send push notification
   */
  async send(payload: PushNotificationPayload): Promise<ChannelResult> {
    try {
      this.logger.info('Sending push notification', { userId: payload.userId, title: payload.title });

      // Validate payload
      if (!this.validatePayload(payload)) {
        throw new Error('Invalid push notification payload');
      }

      // Get user's push tokens
      const tokens = await this.getUserPushTokens(payload.userId);
      if (!tokens || tokens.length === 0) {
        throw new Error('No push tokens found for user');
      }

      // Send push notification to all user devices
      const results = await Promise.all(
        tokens.map(token => this.sendToDevice(token, payload))
      );

      // Check if any were successful
      const successfulResults = results.filter(r => r.success);
      if (successfulResults.length === 0) {
        throw new Error('Failed to send push notification to any device');
      }

      this.logger.info('Push notification sent successfully', { 
        userId: payload.userId,
        successfulDevices: successfulResults.length,
        totalDevices: tokens.length
      });

      return {
        success: true,
        messageId: `push_${Date.now()}_${payload.userId}`,
        deliveredAt: new Date()
      };

    } catch (error) {
      this.logger.error('Failed to send push notification', { 
        error: error.message, 
        userId: payload.userId 
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendToMultipleUsers(
    userIds: string[],
    payload: Omit<PushNotificationPayload, 'userId'>
  ): Promise<ChannelResult[]> {
    const results: ChannelResult[] = [];

    for (const userId of userIds) {
      try {
        const result = await this.send({
          ...payload,
          userId
        });
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
   * Get push notification service status
   */
  async getStatus(): Promise<{ connected: boolean; error?: string }> {
    try {
      // Check push notification provider connection
      const isConnected = await this.checkConnection();
      return { connected: isConnected };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }

  /**
   * Register push token for user
   */
  async registerToken(userId: string, token: string, platform: 'ios' | 'android' | 'web'): Promise<boolean> {
    try {
      // Store push token in database
      await this.storePushToken(userId, token, platform);
      
      this.logger.info('Push token registered', { userId, platform });
      return true;
    } catch (error) {
      this.logger.error('Failed to register push token', { error: error.message, userId });
      return false;
    }
  }

  /**
   * Unregister push token for user
   */
  async unregisterToken(userId: string, token: string): Promise<boolean> {
    try {
      // Remove push token from database
      await this.removePushToken(userId, token);
      
      this.logger.info('Push token unregistered', { userId });
      return true;
    } catch (error) {
      this.logger.error('Failed to unregister push token', { error: error.message, userId });
      return false;
    }
  }

  /**
   * Private methods
   */
  private getPushConfig(): any {
    // Return push notification configuration based on environment
    return {
      provider: process.env.PUSH_PROVIDER || 'firebase',
      firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      },
      oneSignal: {
        appId: process.env.ONESIGNAL_APP_ID,
        restApiKey: process.env.ONESIGNAL_REST_API_KEY
      }
    };
  }

  private initializeFirebaseIfNeeded(): void {
    try {
      if (this.config.provider !== 'firebase') return;
      if (admin.apps.length > 0) return;
      const { projectId, clientEmail, privateKey } = this.config.firebase || {};
      if (!projectId || !clientEmail || !privateKey) {
        this.logger.warn('Firebase credentials not set; push will fail until configured');
        return;
      }
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: String(privateKey).replace(/\\n/g, '\n')
        })
      });
      this.logger.info('Firebase Admin initialized for push notifications');
    } catch (error: any) {
      this.logger.error('Failed to initialize Firebase Admin', { error: error.message });
    }
  }

  private validatePayload(payload: PushNotificationPayload): boolean {
    if (!payload.userId || !payload.title || !payload.body) {
      return false;
    }

    // Check title length
    if (payload.title.length > 50) {
      return false;
    }

    // Check body length
    if (payload.body.length > 200) {
      return false;
    }

    return true;
  }

  private async getUserPushTokens(userId: string): Promise<string[]> {
    const db = getDatabase();
    const rows = await db('user_devices').where({ user_id: userId }).select('device_token');
    return rows.map((r: any) => r.device_token).filter(Boolean);
  }

  private async sendToDevice(token: string, payload: PushNotificationPayload): Promise<ChannelResult> {
    const { provider } = this.config;

    switch (provider) {
      case 'firebase':
        return await this.sendViaFirebase(token, payload);
      case 'oneSignal':
        return await this.sendViaOneSignal(token, payload);
      default:
        throw new Error(`Unsupported push provider: ${provider}`);
    }
  }

  private async sendViaFirebase(token: string, payload: PushNotificationPayload): Promise<ChannelResult> {
    try {
      if (admin.apps.length === 0) {
        throw new Error('Firebase Admin not initialized');
      }

      const message: admin.messaging.Message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body
        },
        data: Object.fromEntries(
          Object.entries(payload.data || {}).map(([k, v]) => [k, String(v)])
        )
      };

      const messageId = await admin.messaging().send(message);
      return { success: true, messageId, deliveredAt: new Date() };
    } catch (error: any) {
      // Clean up invalid tokens
      const code = error?.errorInfo?.code || error?.code;
      if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
        try {
          await this.removeTokenIfExists(token);
        } catch {}
      }
      return { success: false, error: error.message };
    }
  }

  private async sendViaOneSignal(token: string, payload: PushNotificationPayload): Promise<ChannelResult> {
    // Implement OneSignal push notifications
    // This is a placeholder - you'll need to implement OneSignal API calls
    throw new Error('OneSignal push not implemented');
  }

  private async storePushToken(userId: string, token: string, platform: string): Promise<void> {
    const db = getDatabase();
    // upsert by unique device_token
    const existing = await db('user_devices').where({ device_token: token }).first();
    if (existing) {
      await db('user_devices').where({ device_token: token }).update({ user_id: userId, platform, last_seen_at: db.fn.now() });
      return;
    }
    await db('user_devices').insert({ user_id: userId, device_token: token, platform });
  }

  private async removePushToken(userId: string, token: string): Promise<void> {
    const db = getDatabase();
    await db('user_devices').where({ user_id: userId, device_token: token }).del();
  }

  private async removeTokenIfExists(token: string): Promise<void> {
    const db = getDatabase();
    await db('user_devices').where({ device_token: token }).del();
  }

  private async checkConnection(): Promise<boolean> {
    // Check connection to push notification provider
    // For now, return true
    return true;
  }
}
