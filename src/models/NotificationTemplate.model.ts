import { getDatabase } from '@/config/database';
import { NotificationTemplate as NotificationTemplateType, TemplateVariables } from '@/types/notification.types';
import { v4 as uuidv4 } from 'uuid';

export class NotificationTemplate implements NotificationTemplateType {
  public id: string;
  public name: string;
  public type: 'email' | 'sms' | 'push' | 'in_app';
  public subject_template?: string;
  public body_template: string;
  public language: string;
  public is_active: boolean;
  public created_at: Date;

  constructor(data: any) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.type = data.type;
    this.subject_template = data.subject_template;
    this.body_template = data.body_template;
    this.language = data.language || 'en';
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at || new Date();
  }

  // Template rendering
  renderSubject(variables: TemplateVariables): string {
    if (!this.subject_template) return '';
    return this.renderTemplate(this.subject_template, variables);
  }

  renderBody(variables: TemplateVariables): string {
    return this.renderTemplate(this.body_template, variables);
  }

  private renderTemplate(template: string, variables: TemplateVariables): string {
    let rendered = template;
    
    // Replace variables in {{variable}} format
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    });
    
    return rendered;
  }

  // Database operations
  async save(): Promise<NotificationTemplate> {
    const db = getDatabase();
    
    if (await NotificationTemplate.findById(this.id)) {
      // Update existing
      await db('notification_templates')
        .where({ id: this.id })
        .update({
          name: this.name,
          type: this.type,
          subject_template: this.subject_template,
          body_template: this.body_template,
          language: this.language,
          is_active: this.is_active
        });
    } else {
      // Insert new
      await db('notification_templates').insert({
        id: this.id,
        name: this.name,
        type: this.type,
        subject_template: this.subject_template,
        body_template: this.body_template,
        language: this.language,
        is_active: this.is_active,
        created_at: this.created_at
      });
    }
    
    return this;
  }

  async delete(): Promise<void> {
    const db = getDatabase();
    await db('notification_templates').where({ id: this.id }).del();
  }

  // Static methods
  static async findById(id: string): Promise<NotificationTemplate | null> {
    const db = getDatabase();
    const template = await db('notification_templates').where({ id }).first();
    return template ? new NotificationTemplate(template) : null;
  }

  static async findByName(name: string): Promise<NotificationTemplate | null> {
    const db = getDatabase();
    const template = await db('notification_templates')
      .where({ name, is_active: true })
      .first();
    return template ? new NotificationTemplate(template) : null;
  }

  static async findByType(type: string, language = 'en'): Promise<NotificationTemplate[]> {
    const db = getDatabase();
    const templates = await db('notification_templates')
      .where({ type, language, is_active: true })
      .orderBy('created_at', 'desc');
    
    return templates.map(template => new NotificationTemplate(template));
  }

  static async findAll(filters: {
    type?: string;
    language?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<NotificationTemplate[]> {
    const db = getDatabase();
    let query = db('notification_templates');
    
    if (filters.type) query = query.where('type', filters.type);
    if (filters.language) query = query.where('language', filters.language);
    if (filters.is_active !== undefined) query = query.where('is_active', filters.is_active);
    
    query = query.orderBy('created_at', 'desc');
    
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) query = query.offset(filters.offset);
    
    const templates = await query;
    return templates.map(template => new NotificationTemplate(template));
  }

  static fromDb(data: any): NotificationTemplate {
    return new NotificationTemplate(data);
  }
}
