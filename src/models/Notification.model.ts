import { getDatabase } from '@/config/database';
import { Notification as NotificationType, NotificationChannelType, NotificationType as NotificationTypeEnum } from '@/types/notification.types';
import { v4 as uuidv4 } from 'uuid';

export class Notification implements NotificationType {
  public id: string;
  public user_id: string;
  public template_id?: string;
  public type: NotificationTypeEnum;
  public title: string;
  public message: string;
  public channels: NotificationChannelType[];
  public is_read: boolean;
  public read_at?: Date;
  public sent_at?: Date;
  public metadata?: Record<string, any>;
  public action_url?: string;
  public created_at: Date;
  public expires_at?: Date;

  constructor(data: any) {
    this.id = data.id || uuidv4();
    this.user_id = data.user_id;
    this.template_id = data.template_id;
    this.type = data.type;
    this.title = data.title;
    this.message = data.message;
    this.channels = Array.isArray(data.channels) ? data.channels : ['in_app'];
    this.is_read = data.is_read || false;
    this.read_at = data.read_at ? new Date(data.read_at) : undefined;
    this.sent_at = data.sent_at ? new Date(data.sent_at) : undefined;
    this.metadata = data.metadata;
    this.action_url = data.action_url;
    this.created_at = data.created_at ? new Date(data.created_at) : new Date();
    this.expires_at = data.expires_at ? new Date(data.expires_at) : undefined;
  }

  // Mark as read
  async markAsRead(): Promise<void> {
    if (!this.is_read) {
      this.is_read = true;
      this.read_at = new Date();
      await this.save();
    }
  }

  // Mark as sent
  async markAsSent(): Promise<void> {
    if (!this.sent_at) {
      this.sent_at = new Date();
      await this.save();
    }
  }

  // Check if notification is expired
  isExpired(): boolean {
    return this.expires_at ? new Date() > this.expires_at : false;
  }

  // Check if notification should be sent on a specific channel
  shouldSendOn(channel: NotificationChannelType): boolean {
    return this.channels.includes(channel) && !this.isExpired();
  }

  // Database operations
  async save(): Promise<Notification> {
    const db = getDatabase();
    
    const data = {
      user_id: this.user_id,
      template_id: this.template_id,
      type: this.type,
      title: this.title,
      message: this.message,
      channels: this.channels,
      is_read: this.is_read,
      read_at: this.read_at,
      sent_at: this.sent_at,
      metadata: this.metadata ? JSON.stringify(this.metadata) : null,
      action_url: this.action_url,
      expires_at: this.expires_at
    };

    if (await Notification.findById(this.id)) {
      // Update existing
      await db('notifications').where({ id: this.id }).update(data);
    } else {
      // Insert new
      await db('notifications').insert({
        id: this.id,
        created_at: this.created_at,
        ...data
      });
    }
    
    return this;
  }

  async delete(): Promise<void> {
    const db = getDatabase();
    await db('notifications').where({ id: this.id }).del();
  }

  // Static methods
  static async findById(id: string): Promise<Notification | null> {
    const db = getDatabase();
    const notification = await db('notifications').where({ id }).first();
    return notification ? new Notification(notification) : null;
  }

  static async findByUserId(
    userId: string, 
    filters: {
      type?: NotificationTypeEnum;
      is_read?: boolean;
      channel?: NotificationChannelType;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Notification[]> {
    const db = getDatabase();
    let query = db('notifications').where({ user_id: userId });
    
    if (filters.type) query = query.where('type', filters.type);
    if (filters.is_read !== undefined) query = query.where('is_read', filters.is_read);
    if (filters.channel) {
      query = query.whereRaw('? = ANY(channels)', [filters.channel]);
    }
    
    // Exclude expired notifications
    query = query.where(function() {
      this.whereNull('expires_at').orWhere('expires_at', '>', new Date());
    });
    
    query = query.orderBy('created_at', 'desc');
    
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) query = query.offset(filters.offset);
    
    const notifications = await query;
    return notifications.map(notification => new Notification(notification));
  }

  static async findUnread(userId: string, limit = 50): Promise<Notification[]> {
    return this.findByUserId(userId, { is_read: false, limit });
  }

  static async findByType(
    type: NotificationTypeEnum, 
    filters: {
      user_id?: string;
      is_sent?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Notification[]> {
    const db = getDatabase();
    let query = db('notifications').where({ type });
    
    if (filters.user_id) query = query.where('user_id', filters.user_id);
    if (filters.is_sent !== undefined) {
      if (filters.is_sent) {
        query = query.whereNotNull('sent_at');
      } else {
        query = query.whereNull('sent_at');
      }
    }
    
    query = query.orderBy('created_at', 'desc');
    
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) query = query.offset(filters.offset);
    
    const notifications = await query;
    return notifications.map(notification => new Notification(notification));
  }

  static async findPendingDelivery(channel?: NotificationChannelType): Promise<Notification[]> {
    const db = getDatabase();
    let query = db('notifications')
      .whereNull('sent_at')
      .where(function() {
        this.whereNull('expires_at').orWhere('expires_at', '>', new Date());
      });
    
    if (channel) {
      query = query.whereRaw('? = ANY(channels)', [channel]);
    }
    
    query = query.orderBy('created_at', 'asc');
    
    const notifications = await query;
    return notifications.map(notification => new Notification(notification));
  }

  static async markMultipleAsRead(notificationIds: string[]): Promise<number> {
    const db = getDatabase();
    const result = await db('notifications')
      .whereIn('id', notificationIds)
      .where('is_read', false)
      .update({
        is_read: true,
        read_at: new Date()
      });
    
    return result || 0;
  }

  static async deleteExpired(): Promise<number> {
    const db = getDatabase();
    const result = await db('notifications')
      .where('expires_at', '<', new Date())
      .del();
    
    return result || 0;
  }

  static async getUnreadCount(userId: string): Promise<number> {
    const db = getDatabase();
    const result = await db('notifications')
      .where({ user_id: userId, is_read: false })
      .where(function() {
        this.whereNull('expires_at').orWhere('expires_at', '>', new Date());
      })
      .count('id as count')
      .first();
    
    return parseInt(result?.count as string) || 0;
  }

  static async getStats(userId?: string): Promise<{
    total: number;
    unread: number;
    sent: number;
    by_type: Record<string, number>;
  }> {
    const db = getDatabase();
    let baseQuery = db('notifications');
    
    if (userId) {
      baseQuery = baseQuery.where('user_id', userId);
    }
    
    // Get basic counts
    const [totalResult, unreadResult, sentResult] = await Promise.all([
      baseQuery.clone().count('id as count').first(),
      baseQuery.clone().where('is_read', false).count('id as count').first(),
      baseQuery.clone().whereNotNull('sent_at').count('id as count').first()
    ]);
    
    // Get counts by type
    const typeResults = await baseQuery.clone()
      .select('type')
      .count('id as count')
      .groupBy('type');
    
    const by_type: Record<string, number> = {};
    typeResults.forEach(result => {
      by_type[result.type] = parseInt(result.count as string);
    });
    
    return {
      total: parseInt(totalResult?.count as string) || 0,
      unread: parseInt(unreadResult?.count as string) || 0,
      sent: parseInt(sentResult?.count as string) || 0,
      by_type
    };
  }

  static fromDb(data: any): Notification {
    return new Notification(data);
  }
}
