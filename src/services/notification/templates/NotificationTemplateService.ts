import { NotificationTemplate, NotificationType, NotificationChannel, NotificationPriority } from '../types';
import { Logger } from '@/utils/logger';
import { getDatabase } from '@/config/database';

export class NotificationTemplateService {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('NotificationTemplateService');
  }

  /**
   * Get template by name
   */
  async getTemplate(templateName: string): Promise<NotificationTemplate | null> {
    try {
      const db = getDatabase();
      const dbTemplate = await db('notification_templates')
        .where('name', templateName)
        .where('is_active', true)
        .first();

      if (!dbTemplate) {
        return null;
      }

      // Map database fields to interface
      return this.mapDbToInterface(dbTemplate);
    } catch (error: any) {
      this.logger.error('Failed to get template from database', { error: error.message, templateName });
      return null;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id: string): Promise<NotificationTemplate | null> {
    try {
      const db = getDatabase();
      const dbTemplate = await db('notification_templates')
        .where('id', id)
        .where('is_active', true)
        .first();

      if (!dbTemplate) {
        return null;
      }

      return this.mapDbToInterface(dbTemplate);
    } catch (error: any) {
      this.logger.error('Failed to get template by ID from database', { error: error.message, id });
      return null;
    }
  }

  /**
   * Get all active templates
   */
  async getAllTemplates(): Promise<NotificationTemplate[]> {
    try {
      const db = getDatabase();
      const dbTemplates = await db('notification_templates')
        .where('is_active', true)
        .orderBy('created_at', 'desc');

      return dbTemplates.map((template: any) => this.mapDbToInterface(template));
    } catch (error: any) {
      this.logger.error('Failed to get all templates from database', { error: error.message });
      return [];
    }
  }

  /**
   * Create new template
   */
  async createTemplate(templateData: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplate> {
    try {
      // Map interface to database fields
      const dbTemplate = this.mapInterfaceToDb(templateData);

      const db = getDatabase();
      const [newTemplate] = await db('notification_templates')
        .insert(dbTemplate)
        .returning('*');

      this.logger.info('Template created in database', { templateId: newTemplate.id, name: newTemplate.name });

      return this.mapDbToInterface(newTemplate);
    } catch (error: any) {
      this.logger.error('Failed to create template in database', { error: error.message, templateData });
      throw new Error(`Failed to create template: ${error.message}`);
    }
  }

  /**
   * Update template
   */
  async updateTemplate(id: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate | null> {
    try {
      // Map interface updates to database fields
      const dbUpdates = this.mapInterfaceToDb(updates);
      dbUpdates.updated_at = new Date();

      const db = getDatabase();
      const [updatedTemplate] = await db('notification_templates')
        .where('id', id)
        .update(dbUpdates)
        .returning('*');

      if (!updatedTemplate) {
        return null;
      }

      this.logger.info('Template updated in database', { templateId: id, name: updatedTemplate.name });

      return this.mapDbToInterface(updatedTemplate);
    } catch (error: any) {
      this.logger.error('Failed to update template in database', { error: error.message, id });
      throw new Error(`Failed to update template: ${error.message}`);
    }
  }

  /**
   * Delete template (soft delete by setting is_active to false)
   */
  async deleteTemplate(id: string): Promise<boolean> {
    try {
      const db = getDatabase();
      const result = await db('notification_templates')
        .where('id', id)
        .update({ is_active: false, updated_at: new Date() });

      if (result > 0) {
        this.logger.info('Template soft deleted from database', { templateId: id });
        return true;
      }

      return false;
    } catch (error: any) {
      this.logger.error('Failed to delete template from database', { error: error.message, id });
      throw new Error(`Failed to delete template: ${error.message}`);
    }
  }

  /**
   * Render template with data
   */
  async renderTemplate(templateName: string, data: Record<string, any>): Promise<{ title: string; message: string }> {
    const template = await this.getTemplate(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    let title = template.title;
    let message = template.message;

    // Replace variables in title and message
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      title = title.replace(regex, String(value || ''));
      message = message.replace(regex, String(value || ''));
    });

    return { title, message };
  }

  /**
   * Validate template variables
   */
  async validateTemplateData(templateName: string, data: Record<string, any>): Promise<{ isValid: boolean; missing: string[] }> {
    const template = await this.getTemplate(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    const missing: string[] = [];
    template.variables.forEach(variable => {
      if (!(variable in data) || data[variable] === null || data[variable] === undefined) {
        missing.push(variable);
      }
    });

    return {
      isValid: missing.length === 0,
      missing
    };
  }

  /**
   * Initialize default templates if they don't exist
   */
  async initializeDefaultTemplates(): Promise<void> {
    try {
      const existingTemplates = await this.getAllTemplates();
      const existingNames = existingTemplates.map(t => t.name);

      const defaultTemplates = [
        {
          name: 'inspection_started',
          type: NotificationType.INSPECTION_STARTED,
          title: 'Inspection Started - {{productName}}',
          message: `
            <h2>Inspection Started</h2>
            <p>Hello {{recipientName}},</p>
            <p>The inspection for <strong>{{productName}}</strong> has started.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Current Status:</h3>
              <ul>
                <li><strong>Started At:</strong> {{startedAt}}</li>
                <li><strong>Inspector:</strong> {{inspectorName}}</li>
                <li><strong>Location:</strong> {{location}}</li>
              </ul>
            </div>
            <p>You will receive a detailed report once the inspection is completed.</p>
            <p>Best regards,<br>UrutiBiz Team</p>
          `,
          channels: [NotificationChannel.EMAIL],
          priority: NotificationPriority.NORMAL,
          variables: ['recipientName', 'productName', 'startedAt', 'inspectorName', 'location'],
          isActive: true
        },
        {
          name: 'inspection_completed',
          type: NotificationType.INSPECTION_COMPLETED,
          title: 'Inspection Completed - {{productName}}',
          message: `
            <h2>Inspection Completed</h2>
            <p>Hello {{recipientName}},</p>
            <p>The inspection for <strong>{{productName}}</strong> has been completed.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Results:</h3>
              <ul>
                <li><strong>Status:</strong> {{status}}</li>
                <li><strong>Completed At:</strong> {{completedAt}}</li>
                <li><strong>Inspector:</strong> {{inspectorName}}</li>
                <li><strong>Score:</strong> {{score}}/100</li>
              </ul>
            </div>
            <p>You can view the detailed report in your dashboard.</p>
            <p>Best regards,<br>UrutiBiz Team</p>
          `,
          channels: [NotificationChannel.EMAIL],
          priority: NotificationPriority.NORMAL,
          variables: ['recipientName', 'productName', 'status', 'completedAt', 'inspectorName', 'score'],
          isActive: true
        }
      ];

      for (const template of defaultTemplates) {
        if (!existingNames.includes(template.name)) {
          await this.createTemplate(template);
          this.logger.info('Default template created', { name: template.name });
        }
      }
    } catch (error: any) {
      this.logger.error('Failed to initialize default templates', { error: error.message });
    }
  }

  /**
   * Map database fields to interface
   */
  private mapDbToInterface(dbTemplate: any): NotificationTemplate {
    return {
      id: dbTemplate.id,
      name: dbTemplate.name,
      type: dbTemplate.type as NotificationType,
      title: dbTemplate.subject_template || dbTemplate.title || '',
      message: dbTemplate.body_template || dbTemplate.message || '',
      channels: this.parseChannels(dbTemplate.channels),
      priority: this.parsePriority(dbTemplate.priority),
      variables: this.parseVariables(dbTemplate.variables),
      isActive: dbTemplate.is_active,
      createdAt: new Date(dbTemplate.created_at),
      updatedAt: new Date(dbTemplate.updated_at || dbTemplate.created_at)
    };
  }

  /**
   * Map interface to database fields
   */
  private mapInterfaceToDb(template: Partial<NotificationTemplate>): any {
    const dbTemplate: any = {};

    if (template.name !== undefined) dbTemplate.name = template.name;
    if (template.type !== undefined) dbTemplate.type = template.type;
    if (template.title !== undefined) dbTemplate.subject_template = template.title;
    if (template.message !== undefined) dbTemplate.body_template = template.message;
    if (template.channels !== undefined) dbTemplate.channels = this.serializeChannels(template.channels);
    if (template.priority !== undefined) dbTemplate.priority = template.priority;
    if (template.variables !== undefined) dbTemplate.variables = this.serializeVariables(template.variables);
    if (template.isActive !== undefined) dbTemplate.is_active = template.isActive;
    if (template.updatedAt !== undefined) dbTemplate.updated_at = template.updatedAt;

    return dbTemplate;
  }

  /**
   * Parse channels from database format
   */
  private parseChannels(channels: any): NotificationChannel[] {
    if (Array.isArray(channels)) {
      return channels.map(channel => channel as NotificationChannel);
    }
    
    // Handle string format or default to email
    if (typeof channels === 'string') {
      return [NotificationChannel.EMAIL];
    }
    
    return [NotificationChannel.EMAIL];
  }

  /**
   * Serialize channels to database format
   */
  private serializeChannels(channels: NotificationChannel[]): string[] {
    return channels.map(channel => channel.toString());
  }

  /**
   * Serialize variables to database format
   */
  private serializeVariables(variables: string[]): string {
    return JSON.stringify(variables);
  }

  /**
   * Parse priority from database format
   */
  private parsePriority(priority: any): NotificationPriority {
    if (priority && Object.values(NotificationPriority).includes(priority)) {
      return priority as NotificationPriority;
    }
    return NotificationPriority.NORMAL;
  }

  /**
   * Parse variables from database format
   */
  private parseVariables(variables: any): string[] {
    // If it's already an array, return it
    if (Array.isArray(variables)) {
      return variables;
    }
    
    // If it's a string, try to parse it as JSON
    if (typeof variables === 'string') {
      try {
        return JSON.parse(variables);
      } catch (error) {
        // If JSON parsing fails, return empty array
        return [];
      }
    }
    
    // If it's null/undefined or invalid, return empty array
    return [];
  }
}
