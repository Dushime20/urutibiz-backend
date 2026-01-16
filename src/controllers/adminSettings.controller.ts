import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { ResponseHelper } from '@/utils/response';
import logger from '@/utils/logger';
import { getDatabase } from '@/config/database';
import cloudinary from '@/config/cloudinary';
import { 
  AnalyticsConfig, 
  AnalyticsSettingsUpdate, 
  AnalyticsConfigResponse,
  AnalyticsHealthCheck,
  AnalyticsExportRequest,
  AnalyticsExportResponse
} from '@/types/analyticsConfig.types';

/**
 * @swagger
 * tags:
 *   - name: AdminSettings
 *     description: Senior Setting Strategist Configuration APIs
 */

export class AdminSettingsController extends BaseController {
  
  /**
   * @swagger
   * /admin/settings/system:
   *   get:
   *     summary: Get system-wide settings
   *     tags: [AdminSettings]
   *     responses:
   *       200:
   *         description: System settings retrieved successfully
   */
  public async getSystemSettings(_req: Request, res: Response) {
    try {
      const db = getDatabase();
      
      // Get system settings from database or config
      const settings = await db('system_settings')
        .select('*')
        .where('category', 'system')
        .orderBy('key');

      // Transform to key-value object
      const settingsObject = settings.reduce((acc: any, setting: any) => {
        acc[setting.key] = {
          value: setting.value,
          type: setting.type,
          description: setting.description,
          category: setting.category,
          updatedAt: setting.updated_at
        };
        return acc;
      }, {});

      return ResponseHelper.success(res, 'System settings retrieved successfully', settingsObject);
    } catch (error: any) {
      logger.error(`Error in getSystemSettings: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve system settings', error);
    }
  }

  /**
   * @swagger
   * /admin/settings/system:
   *   put:
   *     summary: Update system-wide settings
   *     tags: [AdminSettings]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               settings:
   *                 type: object
   *                 description: Key-value pairs of settings to update
   *     responses:
   *       200:
   *         description: System settings updated successfully
   */
  public async updateSystemSettings(req: Request, res: Response) {
    try {
      const { settings } = req.body;
      const adminId = (req as any).user.id;

      if (!settings || typeof settings !== 'object') {
        return ResponseHelper.error(res, 'Invalid settings format', undefined, 400);
      }

      const db = getDatabase();
      const updatedSettings: any = {};

      // Update each setting
      for (const [key, value] of Object.entries(settings)) {
        const stringValue = typeof value === 'string' ? value : String(value);
        
        const result = await db('system_settings')
          .where({ key, category: 'system' })
          .update({
            value: stringValue,
            updated_at: new Date(),
            updated_by: adminId
          })
          .returning('*');

        if (result.length > 0) {
          updatedSettings[key] = result[0];
        }
      }

      // Log the changes
      logger.info(`Admin ${adminId} updated system settings`, { 
        settings: Object.keys(updatedSettings),
        count: Object.keys(updatedSettings).length 
      });

      return ResponseHelper.success(res, 'System settings updated successfully', updatedSettings);
    } catch (error: any) {
      logger.error(`Error in updateSystemSettings: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to update system settings', error);
    }
  }

  /**
   * @swagger
   * /admin/settings/theme:
   *   get:
   *     summary: Get theme and appearance settings
   *     tags: [AdminSettings]
   *     responses:
   *       200:
   *         description: Theme settings retrieved successfully
   */
  public async getThemeSettings(_req: Request, res: Response) {
    try {
      const db = getDatabase();
      
      const themeSettings = await db('system_settings')
        .select('*')
        .where('category', 'theme')
        .orderBy('key');

      const themeObject = themeSettings.reduce((acc: any, setting: any) => {
        acc[setting.key] = {
          value: setting.value,
          type: setting.type,
          description: setting.description
        };
        return acc;
      }, {});

      // Default theme settings if none exist
      const defaultTheme = {
        mode: { value: 'light', type: 'select', description: 'Theme mode (light/dark/auto)' },
        primaryColor: { value: '#0ea5e9', type: 'color', description: 'Primary brand color' },
        secondaryColor: { value: '#64748b', type: 'color', description: 'Secondary color' },
        accentColor: { value: '#10b981', type: 'color', description: 'Accent color' },
        borderRadius: { value: '8px', type: 'text', description: 'Border radius' },
        fontSize: { value: '14px', type: 'select', description: 'Base font size' },
        fontFamily: { value: 'Inter', type: 'select', description: 'Font family' }
      };

      const finalTheme = Object.keys(themeObject).length > 0 ? themeObject : defaultTheme;

      return ResponseHelper.success(res, 'Theme settings retrieved successfully', finalTheme);
    } catch (error: any) {
      logger.error(`Error in getThemeSettings: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve theme settings', error);
    }
  }

  /**
   * @swagger
   * /admin/settings/theme:
   *   put:
   *     summary: Update theme and appearance settings
   *     tags: [AdminSettings]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               mode:
   *                 type: string
   *                 enum: [light, dark, auto]
   *               primaryColor:
   *                 type: string
   *               secondaryColor:
   *                 type: string
   *               accentColor:
   *                 type: string
   *     responses:
   *       200:
   *         description: Theme settings updated successfully
   */
  public async updateThemeSettings(req: Request, res: Response) {
    try {
      const themeUpdates = req.body;
      const adminId = (req as any).user.id;

      const db = getDatabase();
      const updatedSettings: any = {};

      for (const [key, value] of Object.entries(themeUpdates)) {
        // Store value as string (don't double-encode)
        const stringValue = typeof value === 'string' ? value : String(value);
        
        const result = await db('system_settings')
          .where({ key, category: 'theme' })
          .update({
            value: stringValue,
            updated_at: new Date(),
            updated_by: adminId
          })
          .returning('*');

        if (result.length === 0) {
          // Create new setting if it doesn't exist
          await db('system_settings').insert({
            key,
            value: stringValue,
            type: key.includes('Color') ? 'color' : 'select',
            category: 'theme',
            description: `Theme setting for ${key}`,
            created_by: adminId,
            updated_by: adminId
          });
        }

        updatedSettings[key] = value;
      }

      logger.info(`Admin ${adminId} updated theme settings`, { settings: Object.keys(updatedSettings) });

      return ResponseHelper.success(res, 'Theme settings updated successfully', updatedSettings);
    } catch (error: any) {
      logger.error(`Error in updateThemeSettings: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to update theme settings', error);
    }
  }

  /**
   * @swagger
   * /admin/settings/security:
   *   get:
   *     summary: Get security settings
   *     tags: [AdminSettings]
   *     responses:
   *       200:
   *         description: Security settings retrieved successfully
   */
  public async getSecuritySettings(_req: Request, res: Response) {
    try {
      const db = getDatabase();
      
      const securitySettings = await db('system_settings')
        .select('*')
        .where('category', 'security')
        .orderBy('key');

      const securityObject = securitySettings.reduce((acc: any, setting: any) => {
        acc[setting.key] = {
          value: setting.value,
          type: setting.type,
          description: setting.description,
        };
        return acc;
      }, {});

      const defaultSecurity = {
        passwordPolicy: { 
          value: { minLength: 8, requireUppercase: true, requireNumbers: true, requireSymbols: true },
          type: 'object',
          description: 'Password policy requirements'
        },
        sessionTimeout: { 
          value: 3600, 
          type: 'number', 
          description: 'Session timeout in seconds' 
        },
        maxLoginAttempts: { 
          value: 5, 
          type: 'number', 
          description: 'Maximum login attempts before lockout' 
        },
        twoFactorRequired: { 
          value: false, 
          type: 'boolean', 
          description: 'Require 2FA for admin accounts' 
        },
        ipWhitelist: { 
          value: [], 
          type: 'array', 
          description: 'IP addresses allowed for admin access' 
        },
        auditLogRetention: { 
          value: 90, 
          type: 'number', 
          description: 'Audit log retention in days' 
        }
      };

      const finalSecurity = Object.keys(securityObject).length > 0 ? securityObject : defaultSecurity;

      return ResponseHelper.success(res, 'Security settings retrieved successfully', finalSecurity);
    } catch (error: any) {
      logger.error(`Error in getSecuritySettings: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve security settings', error);
    }
  }

  /**
   * @swagger
   * /admin/settings/security:
   *   put:
   *     summary: Update security settings
   *     tags: [AdminSettings]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               passwordPolicy:
   *                 type: object
   *               sessionTimeout:
   *                 type: number
   *               maxLoginAttempts:
   *                 type: number
   *               twoFactorRequired:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Security settings updated successfully
   */
  public async updateSecuritySettings(req: Request, res: Response) {
    try {
      const securityUpdates = req.body;
      const adminId = (req as any).user.id;

      const db = getDatabase();
      const updatedSettings: any = {};

      for (const [key, value] of Object.entries(securityUpdates)) {
        // Properly serialize complex data types
        let stringValue: string;
        
        if (typeof value === 'object' && value !== null) {
          // Handle objects (like passwordPolicy) properly
          stringValue = JSON.stringify(value);
        } else if (typeof value === 'string') {
          // Check if it's already a JSON string to avoid double encoding
          try {
            JSON.parse(value);
            // If it parses successfully, it's already JSON - use as is
            stringValue = value;
          } catch {
            // If it doesn't parse, it's a regular string
            stringValue = value;
          }
        } else {
          // Handle numbers, booleans, etc.
          stringValue = String(value);
        }
        
        // Try to update first
        const result = await db('system_settings')
          .where({ key, category: 'security' })
          .update({
            value: stringValue,
            updated_at: new Date(),
            updated_by: adminId
          })
          .returning('*');

        if (result.length === 0) {
          // If no record exists, insert new one
          try {
            await db('system_settings').insert({
              key,
              value: stringValue,
              type: typeof value === 'object' ? 'object' : typeof value,
              category: 'security',
              description: `Security setting for ${key}`,
              created_by: adminId,
              updated_by: adminId
            });
          } catch (insertError: any) {
            // If insert fails due to duplicate key, try to update with different approach
            if (insertError.code === '23505') { // PostgreSQL unique violation
              logger.warn(`Duplicate key detected for ${key}, attempting to update existing record`);
              
              // Try to find and update the existing record
              const existingRecord = await db('system_settings')
                .where({ key })
                .first();
                
              if (existingRecord) {
                await db('system_settings')
                  .where({ id: existingRecord.id })
                  .update({
                    value: stringValue,
                    category: 'security',
                    updated_at: new Date(),
                    updated_by: adminId
                  });
              }
            } else {
              throw insertError;
            }
          }
        }

        updatedSettings[key] = value;
      }

      logger.info(`Admin ${adminId} updated security settings`, { settings: Object.keys(updatedSettings) });

      return ResponseHelper.success(res, 'Security settings updated successfully', updatedSettings);
    } catch (error: any) {
      logger.error(`Error in updateSecuritySettings: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to update security settings', error);
    }
  }

  /**
   * @swagger
   * /admin/settings/business:
   *   get:
   *     summary: Get business rules and policies
   *     tags: [AdminSettings]
   *     responses:
   *       200:
   *         description: Business settings retrieved successfully
   */
  public async getBusinessSettings(_req: Request, res: Response) {
    try {
      const db = getDatabase();
      
      const businessSettings = await db('system_settings')
        .select('*')
        .where('category', 'business')
        .orderBy('key');

      const businessObject = businessSettings.reduce((acc: any, setting: any) => {
        // Properly deserialize values based on type

        // Properly deserialize values based on type
        let parsedValue = setting.value;
        try {
          // Handle corrupted JSON data with multiple layers of encoding
          if (setting.value && typeof setting.value === 'string' && setting.value.includes('\\"')) {
            // This looks like corrupted JSON, try to extract the actual value
            try {
              let cleaned = setting.value;
              
              // Remove multiple escape sequences
              cleaned = cleaned
                .replace(/\\\\/g, '\\')
                .replace(/\\"/g, '"')
                .replace(/\\\\\\\\/g, '\\')
                .replace(/\\\\"/g, '"');
              
              // Try to extract the actual value from nested JSON structures
              let attempts = 0;
              while (cleaned.includes('"value":"') && attempts < 10) {
                const valueMatch = cleaned.match(/"value":"([^"]+)"/);
                if (valueMatch) {
                  cleaned = valueMatch[1];
                  attempts++;
                } else {
                  break;
                }
              }
              
              // If we still have corrupted data, try to extract the actual object
              if (cleaned.includes('[object Object]') || cleaned.includes('"value":"')) {
                // For social media, try to find the actual social media object
                if (setting.key === 'socialMedia') {
                  const facebookMatch = cleaned.match(/"facebook":"([^"]+)"/);
                  const twitterMatch = cleaned.match(/"twitter":"([^"]+)"/);
                  const instagramMatch = cleaned.match(/"instagram":"([^"]+)"/);
                  const linkedinMatch = cleaned.match(/"linkedin":"([^"]+)"/);
                  
                  if (facebookMatch || twitterMatch || instagramMatch || linkedinMatch) {
                    parsedValue = {
                      facebook: facebookMatch ? facebookMatch[1] : "",
                      twitter: twitterMatch ? twitterMatch[1] : "",
                      instagram: instagramMatch ? instagramMatch[1] : "",
                      linkedin: linkedinMatch ? linkedinMatch[1] : ""
                    };
                  } else {
                    parsedValue = {"facebook":"","twitter":"","instagram":"","linkedin":""};
                  }
                } else if (setting.key === 'contactInfo') {
                  // For contact info, try to extract individual fields
                  const emailMatch = cleaned.match(/"email":"([^"]+)"/);
                  const phoneMatch = cleaned.match(/"phone":"([^"]+)"/);
                  const addressMatch = cleaned.match(/"address":"([^"]+)"/);
                  const websiteMatch = cleaned.match(/"website":"([^"]+)"/);
                  
                  if (emailMatch || phoneMatch || addressMatch || websiteMatch) {
                    parsedValue = {
                      email: emailMatch ? emailMatch[1] : "",
                      phone: phoneMatch ? phoneMatch[1] : "",
                      address: addressMatch ? addressMatch[1] : "",
                      website: websiteMatch ? websiteMatch[1] : ""
                    };
                  } else {
                    parsedValue = {"email":"","phone":"","address":"","website":""};
                  }
                } else if (setting.key === 'timezone') {
                  // For timezone, try to extract the actual timezone value
                  const timezoneMatch = cleaned.match(/"timezone":"([^"]+)"/);
                  if (timezoneMatch) {
                    parsedValue = timezoneMatch[1];
                  } else {
                    parsedValue = "UTC";
                  }
                } else {
                  // Try to parse the cleaned JSON
                  const parsed = JSON.parse(cleaned);
                  if (parsed && typeof parsed === 'object' && parsed.value !== undefined) {
                    parsedValue = parsed.value;
                  } else {
                    parsedValue = parsed;
                  }
                }
              } else {
                // Try to parse the cleaned JSON
                const parsed = JSON.parse(cleaned);
                if (parsed && typeof parsed === 'object' && parsed.value !== undefined) {
                  parsedValue = parsed.value;
                } else {
                  parsedValue = parsed;
                }
              }
            } catch {
              // If cleaning fails, provide sensible defaults
              if (setting.key === 'socialMedia') {
                parsedValue = {"facebook":"","twitter":"","instagram":"","linkedin":""};
              } else if (setting.key === 'contactInfo') {
                parsedValue = {"email":"","phone":"","address":"","website":""};
              } else if (setting.key === 'timezone') {
                parsedValue = "UTC";
              } else {
                parsedValue = setting.value;
              }
            }
          } else if (setting.type === 'object' || setting.type === 'array') {
            parsedValue = JSON.parse(setting.value);
          } else if (setting.type === 'number') {
            parsedValue = parseFloat(setting.value);
          } else if (setting.type === 'boolean') {
            parsedValue = setting.value === 'true';
          }
        } catch (error) {
          // If parsing fails, provide sensible defaults for corrupted data
          if (setting.key === 'socialMedia') {
            parsedValue = {"facebook":"","twitter":"","instagram":"","linkedin":""};
          } else if (setting.key === 'contactInfo') {
            parsedValue = {"email":"","phone":"","address":"","website":""};
          } else if (setting.key === 'timezone') {
            parsedValue = "UTC";
          } else {
            parsedValue = setting.value;
          }
        }

        acc[setting.key] = {
          value: parsedValue,
          type: setting.type,
          description: setting.description
        };
        return acc;
      }, {});

      const defaultBusiness = {
        commissionRate: { 
          value: 0.05, 
          type: 'number', 
          description: 'Platform commission rate (5%)' 
        },
        minBookingDuration: { 
          value: 1, 
          type: 'number', 
          description: 'Minimum booking duration in hours' 
        },
        maxBookingDuration: { 
          value: 168, 
          type: 'number', 
          description: 'Maximum booking duration in hours' 
        },
        cancellationPolicy: { 
          value: 'flexible', 
          type: 'select', 
          description: 'Default cancellation policy' 
        },
        autoApproval: { 
          value: false, 
          type: 'boolean', 
          description: 'Auto-approve bookings' 
        },
        currency: { 
          value: 'USD', 
          type: 'select', 
          description: 'Default currency' 
        },
        timezone: { 
          value: 'UTC', 
          type: 'select', 
          description: 'Default timezone' 
        },
        platformLogo: { 
          value: '', 
          type: 'image', 
          description: 'Platform logo URL' 
        },
        platformLogoPublicId: { 
          value: '', 
          type: 'text', 
          description: 'Platform logo Cloudinary public ID' 
        }
      };

      const finalBusiness = Object.keys(businessObject).length > 0 ? businessObject : defaultBusiness;

      return ResponseHelper.success(res, 'Business settings retrieved successfully', finalBusiness);
    } catch (error: any) {
      logger.error(`Error in getBusinessSettings: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve business settings', error);
    }
  }

  /**
   * @swagger
   * /admin/settings/business:
   *   put:
   *     summary: Update business settings
   *     tags: [AdminSettings]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               commissionRate:
   *                 type: number
   *                 description: Platform commission rate
   *               currency:
   *                 type: string
   *                 description: Default currency
   *               timezone:
   *                 type: string
   *                 description: Platform timezone
   *               autoApproval:
   *                 type: boolean
   *                 description: Auto-approve bookings
   *     responses:
   *       200:
   *         description: Business settings updated successfully
   */
  public async updateBusinessSettings(req: Request, res: Response) {
    try {
      let businessUpdates = req.body;
      const adminId = (req as any).user.id;

      // Handle the case where frontend sends the entire API response structure
      if (businessUpdates.data && typeof businessUpdates.data === 'object') {
        // Extract the actual settings from the data field
        const settingsData = businessUpdates.data;
        businessUpdates = {};
        
        // Extract social media
        if (settingsData.socialMedia && settingsData.socialMedia.value) {
          businessUpdates.socialMedia = settingsData.socialMedia.value;
        }
        
        // Extract contact info
        if (settingsData.contactInfo && settingsData.contactInfo.value) {
          businessUpdates.contactInfo = settingsData.contactInfo.value;
        }
        
        // Extract timezone
        if (settingsData.timezone && settingsData.timezone.value) {
          businessUpdates.timezone = settingsData.timezone.value;
        }
        
        // Extract other fields
        for (const [key, value] of Object.entries(settingsData)) {
          if (key !== 'socialMedia' && key !== 'contactInfo' && key !== 'timezone' && 
              value && typeof value === 'object' && (value as any).value !== undefined) {
            businessUpdates[key] = (value as any).value;
          }
        }
        
        // Special handling for supportedCurrencies
        if (settingsData.supportedCurrencies && settingsData.supportedCurrencies.value) {
          businessUpdates.supportedCurrencies = settingsData.supportedCurrencies.value;
        }
      } else if (businessUpdates.data && typeof businessUpdates.data === 'string') {
        try {
          const parsedData = JSON.parse(businessUpdates.data);
          if (parsedData.socialMedia || parsedData.contactInfo || parsedData.timezone) {
            // Extract the actual data from the nested structure
            businessUpdates = {};
        if (parsedData.socialMedia && (parsedData.socialMedia as any).value) {
          businessUpdates.socialMedia = (parsedData.socialMedia as any).value;
        }
        if (parsedData.contactInfo && (parsedData.contactInfo as any).value) {
          businessUpdates.contactInfo = (parsedData.contactInfo as any).value;
            }
            if (parsedData.timezone && (parsedData.timezone as any).value) {
              businessUpdates.timezone = (parsedData.timezone as any).value;
            }
          }
        } catch (error) {
          logger.warn('Failed to parse nested data field:', error);
        }
      }

      // Debug logging
      logger.info('Business settings update request:', {
        originalBody: req.body,
        extractedUpdates: businessUpdates,
        adminId
      });

      const db = getDatabase();
      const updatedSettings: any = {};

      for (const [key, value] of Object.entries(businessUpdates)) {
        // Skip system fields that shouldn't be updated
        if (key === 'success' || key === 'message' || key === 'data') {
          continue;
        }

        // Special handling for social media and contact info
        let stringValue: string;
        
        if (key === 'socialMedia' || key === 'contactInfo' || key === 'supportedCurrencies') {
          // For social media, contact info, and supported currencies, always treat as object/array and stringify
          if (typeof value === 'object' && value !== null) {
            stringValue = JSON.stringify(value);
          } else if (typeof value === 'string') {
            // If it's a string, try to parse it first to validate it's valid JSON
            try {
              JSON.parse(value);
              // If it's valid JSON, use it as is
              stringValue = value;
            } catch {
              // If it's not valid JSON, wrap it in quotes
              stringValue = JSON.stringify(value);
            }
          } else {
            stringValue = JSON.stringify(value);
          }
        } else if (typeof value === 'string') {
          // For other fields, check if it's already a JSON string to avoid double encoding
          try {
            JSON.parse(value);
            // If it parses successfully, it's already JSON - use as is
            stringValue = value;
          } catch {
            // If it doesn't parse, it's a regular string
            stringValue = value;
          }
        } else if (typeof value === 'object' && value !== null) {
          // Handle objects and arrays properly
          stringValue = JSON.stringify(value);
        } else {
          // Handle numbers, booleans, etc.
          stringValue = String(value);
        }
        
        const result = await db('system_settings')
          .where({ key, category: 'business' })
          .update({
            value: stringValue,
            updated_at: new Date(),
            updated_by: adminId
          })
          .returning('*');

        if (result.length === 0) {
          // No record in business category. Check if a record with the same key exists in any category
          const existingAnyCategory = await db('system_settings')
            .where({ key })
            .first();

          if (existingAnyCategory) {
            // Update the existing row and move it to business category to avoid unique key conflict on key
            await db('system_settings')
              .where({ id: existingAnyCategory.id })
              .update({
                value: stringValue,
                type: AdminSettingsController.getBusinessSettingType(key),
                category: 'business',
                description: AdminSettingsController.getBusinessSettingDescription(key),
                updated_at: new Date(),
                updated_by: adminId
              });
          } else {
            // Create new setting if no record exists at all
            await db('system_settings').insert({
              key,
              value: stringValue,
              type: AdminSettingsController.getBusinessSettingType(key),
              category: 'business',
              description: AdminSettingsController.getBusinessSettingDescription(key),
              created_by: adminId,
              updated_by: adminId
            });
          }
        }

        updatedSettings[key] = value;
      }

      logger.info(`Admin ${adminId} updated business settings`, { settings: Object.keys(updatedSettings) });

      return ResponseHelper.success(res, 'Business settings updated successfully', updatedSettings);
    } catch (error: any) {
      logger.error(`Error in updateBusinessSettings: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to update business settings', error);
    }
  }

  /**
   * Helper method to determine business setting type
   */
  private static getBusinessSettingType(key: string): string {
    const typeMap: { [key: string]: string } = {
      commissionRate: 'number',
      taxRate: 'number',
      minCommissionAmount: 'number',
      maxCommissionAmount: 'number',
      minBookingDuration: 'number',
      maxBookingDuration: 'number',
      advanceBookingLimit: 'number',
      paymentTimeout: 'number',
      refundProcessingDays: 'number',
      providerCommissionRate: 'number',
      minProviderRating: 'number',
      providerResponseTime: 'number',
      passwordMinLength: 'number',
      sessionTimeout: 'number',
      maxLoginAttempts: 'number',
      reportRetentionDays: 'number',
      dashboardRefreshInterval: 'number',
      autoApproval: 'boolean',
      bookingConfirmationRequired: 'boolean',
      holdPaymentUntilService: 'boolean',
      providerVerificationRequired: 'boolean',
      customerRegistrationRequired: 'boolean',
      guestBookingAllowed: 'boolean',
      maintenanceMode: 'boolean',
      emailNotifications: 'boolean',
      smsNotifications: 'boolean',
      pushNotifications: 'boolean',
      twoFactorAuthRequired: 'boolean',
      analyticsEnabled: 'boolean',
      paymentMethods: 'array',
      supportedLanguages: 'array',
      workingHours: 'object',
      platformLogo: 'image',
      platformLogoPublicId: 'text'
    };
    
    return typeMap[key] || 'text';
  }

  /**
   * Helper method to get business setting description
   */
  private static getBusinessSettingDescription(key: string): string {
    const descriptions: { [key: string]: string } = {
      commissionRate: 'Platform commission rate percentage',
      currency: 'Default platform currency',
      currencySymbol: 'Currency symbol for display',
      taxRate: 'Default tax rate percentage',
      minBookingDuration: 'Minimum booking duration in hours',
      maxBookingDuration: 'Maximum booking duration in hours',
      advanceBookingLimit: 'Maximum days in advance for booking',
      cancellationPolicy: 'Default cancellation policy',
      autoApproval: 'Auto-approve bookings without manual review',
      paymentMethods: 'Available payment methods',
      paymentTimeout: 'Payment timeout in minutes',
      refundProcessingDays: 'Days to process refunds',
      holdPaymentUntilService: 'Hold payment until service is completed',
      providerVerificationRequired: 'Require service provider verification',
      providerCommissionRate: 'Service provider commission rate percentage',
      minProviderRating: 'Minimum rating for service providers',
      providerResponseTime: 'Expected response time in hours',
      customerRegistrationRequired: 'Require customer registration for bookings',
      guestBookingAllowed: 'Allow bookings without registration',
      customerSupportHours: 'Customer support availability',
      supportContact: 'Customer support contact number',
      timezone: 'Platform default timezone',
      workingHours: 'Platform working hours',
      maintenanceMode: 'Enable maintenance mode',
      platformName: 'Platform display name',
      platformTagline: 'Platform tagline',
      emailNotifications: 'Enable email notifications',
      smsNotifications: 'Enable SMS notifications',
      pushNotifications: 'Enable push notifications',
      notificationFrequency: 'Notification frequency',
      passwordMinLength: 'Minimum password length',
      sessionTimeout: 'Session timeout in hours',
      maxLoginAttempts: 'Maximum login attempts before lockout',
      twoFactorAuthRequired: 'Require two-factor authentication',
      termsOfServiceVersion: 'Current terms of service version',
      privacyPolicyVersion: 'Current privacy policy version',
      cookiePolicyVersion: 'Current cookie policy version',
      supportedLanguages: 'Supported languages',
      analyticsEnabled: 'Enable analytics tracking',
      reportRetentionDays: 'Report data retention in days',
      dashboardRefreshInterval: 'Dashboard refresh interval in seconds',
      platformLogo: 'Platform logo URL',
      platformLogoPublicId: 'Platform logo Cloudinary public ID'
    };
    
    return descriptions[key] || `Business setting for ${key}`;
  }


  /**
   * @swagger
   * /admin/settings/logo:
   *   post:
   *     summary: Upload platform logo
   *     tags: [AdminSettings]
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               logo:
   *                 type: string
   *                 format: binary
   *                 description: Logo image file
   *     responses:
   *       200:
   *         description: Logo uploaded successfully
   */
  public async uploadLogo(req: Request, res: Response) {
    try {
      const adminId = (req as any).user.id;
      const filesReq = req as any;

      // Debug logging
      console.log('[AdminSettingsController] Logo upload request:', {
        adminId,
        hasFile: !!filesReq.file,
        fileDetails: filesReq.file ? {
          fieldname: filesReq.file.fieldname,
          originalname: filesReq.file.originalname,
          mimetype: filesReq.file.mimetype,
          size: filesReq.file.size,
          path: filesReq.file.path,
          buffer: filesReq.file.buffer ? 'Buffer exists' : 'No buffer',
          stream: filesReq.file.stream ? 'Stream exists' : 'No stream'
        } : null,
        body: req.body,
        bodyKeys: Object.keys(req.body),
        headers: {
          'content-type': req.headers['content-type'],
          'content-length': req.headers['content-length']
        }
      });

      if (!filesReq.file) {
        console.log('[AdminSettingsController] No file found in request');
        return ResponseHelper.error(res, 'No logo file provided', undefined, 400);
      }

      // Upload to Cloudinary directly (same as avatar upload)
      console.log('[AdminSettingsController] Starting Cloudinary upload for file:', filesReq.file.path);
      console.log('[AdminSettingsController] File exists check:', {
        filePath: filesReq.file.path,
        fileExists: require('fs').existsSync(filesReq.file.path),
        fileSize: filesReq.file.size,
        fileMimetype: filesReq.file.mimetype
      });
      
      const result = await cloudinary.uploader.upload(filesReq.file.path, { 
        folder: `platform/logos` 
      });

      console.log('[AdminSettingsController] Cloudinary upload successful:', {
        url: result.secure_url,
        publicId: result.public_id,
        resultKeys: Object.keys(result)
      });

      // Save logo URL to business settings
      const db = getDatabase();
      await db('system_settings')
        .where({ key: 'platformLogo', category: 'business' })
        .del();

      await db('system_settings').insert({
        key: 'platformLogo',
        value: result.secure_url,
        type: 'image',
        category: 'business',
        description: 'Platform logo URL',
        created_by: adminId,
        updated_by: adminId
      });

      // Also save the public ID for future management
      await db('system_settings')
        .where({ key: 'platformLogoPublicId', category: 'business' })
        .del();

      await db('system_settings').insert({
        key: 'platformLogoPublicId',
        value: result.public_id,
        type: 'text',
        category: 'business',
        description: 'Platform logo Cloudinary public ID',
        created_by: adminId,
        updated_by: adminId
      });

      logger.info(`Admin ${adminId} uploaded platform logo`, { 
        logoUrl: result.secure_url,
        publicId: result.public_id 
      });

      return ResponseHelper.success(res, 'Logo uploaded successfully', {
        logoUrl: result.secure_url,
        publicId: result.public_id
      });

    } catch (error: any) {
      logger.error(`Error in uploadLogo: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to upload logo', error);
    }
  }

  /**
   * @swagger
   * /admin/settings/logo:
   *   delete:
   *     summary: Delete platform logo
   *     tags: [AdminSettings]
   *     responses:
   *       200:
   *         description: Logo deleted successfully
   */
  public async deleteLogo(req: Request, res: Response) {
    try {
      const adminId = (req as any).user.id;
      const db = getDatabase();

      // Get the current logo public ID
      const logoSetting = await db('system_settings')
        .where({ key: 'platformLogoPublicId', category: 'business' })
        .first();

      if (logoSetting && logoSetting.value) {
        // Delete from Cloudinary directly
        await cloudinary.uploader.destroy(logoSetting.value);
      }

      // Remove from database
      await db('system_settings')
        .where({ key: 'platformLogo', category: 'business' })
        .del();

      await db('system_settings')
        .where({ key: 'platformLogoPublicId', category: 'business' })
        .del();

      logger.info(`Admin ${adminId} deleted platform logo`);

      return ResponseHelper.success(res, 'Logo deleted successfully');

    } catch (error: any) {
      logger.error(`Error in deleteLogo: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to delete logo', error);
    }
  }

  /**
   * @swagger
   * /admin/settings/cleanup:
   *   post:
   *     summary: Clean up corrupted business settings data
   *     tags: [AdminSettings]
   *     responses:
   *       200:
   *         description: Data cleanup completed successfully
   */
  public async cleanupBusinessData(req: Request, res: Response) {
    try {
      const adminId = (req as any).user.id;
      const db = getDatabase();

      // Delete all corrupted business settings
      await db('system_settings').where('category', 'business').del();

      // Insert clean business settings
      const cleanSettings = [
        { key: 'autoApproval', value: 'false', type: 'boolean', category: 'business', description: 'Auto-approve bookings without manual review' },
        { key: 'businessType', value: 'rental', type: 'text', category: 'business', description: 'Type of business' },
        { key: 'companyName', value: 'UruTiBiz', type: 'text', category: 'business', description: 'Company name' },
        { key: 'commissionRate', value: '5.0', type: 'number', category: 'business', description: 'Platform commission rate percentage' },
        { key: 'minBookingDuration', value: '1', type: 'number', category: 'business', description: 'Minimum booking duration in hours' },
        { key: 'maxBookingDuration', value: '168', type: 'number', category: 'business', description: 'Maximum booking duration in hours' },
        { key: 'cancellationPolicy', value: 'flexible', type: 'text', category: 'business', description: 'Default cancellation policy' },
        { key: 'privacyPolicy', value: 'Our privacy policy protects your personal information.', type: 'text', category: 'business', description: 'Privacy policy' },
        { key: 'refundPolicy', value: 'Full refund within 24 hours of booking.', type: 'text', category: 'business', description: 'Refund policy' },
        { key: 'termsOfService', value: 'By using our service, you agree to our terms.', type: 'text', category: 'business', description: 'Terms of service' },
        { key: 'currency', value: 'USD', type: 'text', category: 'business', description: 'Default platform currency' },
        { key: 'timezone', value: 'Africa/Kigali', type: 'text', category: 'business', description: 'Platform default timezone' },
        { key: 'supportedCurrencies', value: '["USD","RWF","EUR","UGX"]', type: 'array', category: 'business', description: 'Supported currencies' },
        { key: 'contactInfo', value: '{"email":"support@urutibiz.com","phone":"+250 123 456 789","address":"Kigali, Rwanda","website":"https://urutibiz.com"}', type: 'object', category: 'business', description: 'Contact information' },
        { key: 'socialMedia', value: '{"facebook":"https://facebook.com/urutibiz","twitter":"https://twitter.com/urutibiz","instagram":"https://instagram.com/urutibiz","linkedin":"https://linkedin.com/company/urutibiz"}', type: 'object', category: 'business', description: 'Social media links' }
      ];

      // Insert with created_by and updated_by
      const settingsWithAudit = cleanSettings.map(setting => ({
        ...setting,
        created_by: adminId,
        updated_by: adminId
      }));

      await db('system_settings').insert(settingsWithAudit);

      logger.info(`Admin ${adminId} cleaned up corrupted business settings data`);

      return ResponseHelper.success(res, 'Business settings data cleaned up successfully');

    } catch (error: any) {
      logger.error(`Error in cleanupBusinessData: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to clean up business settings data', error);
    }
  }

  /**
   * @swagger
   * /admin/settings/debug:
   *   post:
   *     summary: Debug business settings update (temporary endpoint)
   *     tags: [AdminSettings]
   *     responses:
   *       200:
   *         description: Debug information returned
   */
  public async debugBusinessSettings(req: Request, res: Response) {
    try {
      const adminId = (req as any).user.id;
      
      // Log the incoming request data
      console.log('[DEBUG] Business settings update request:', {
        adminId,
        body: req.body,
        bodyKeys: Object.keys(req.body),
        bodyTypes: Object.keys(req.body).map(key => ({
          key,
          type: typeof req.body[key],
          value: req.body[key]
        })),
        headers: {
          'content-type': req.headers['content-type'],
          'content-length': req.headers['content-length']
        }
      });

      return ResponseHelper.success(res, 'Debug information logged to console', {
        receivedData: req.body,
        dataTypes: Object.keys(req.body).map(key => ({
          key,
          type: typeof req.body[key],
          value: req.body[key]
        })),
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error(`Error in debugBusinessSettings: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to debug business settings', error);
    }
  }

  /**
   * @swagger
   * /admin/settings/social-media:
   *   put:
   *     summary: Update social media settings (merge with existing)
   *     tags: [AdminSettings]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               facebook:
   *                 type: string
   *               twitter:
   *                 type: string
   *               instagram:
   *                 type: string
   *               linkedin:
   *                 type: string
   *     responses:
   *       200:
   *         description: Social media settings updated successfully
   */
  public async updateSocialMedia(req: Request, res: Response) {
    try {
      const socialUpdates = req.body;
      const adminId = (req as any).user.id;
      const db = getDatabase();

      // Get current social media settings
      const currentSetting = await db('system_settings')
        .where({ key: 'socialMedia', category: 'business' })
        .first();

      let currentSocialMedia = {};
      if (currentSetting && currentSetting.value) {
        try {
          // Try to parse the current value
          currentSocialMedia = JSON.parse(currentSetting.value);
        } catch (error) {
          // If parsing fails, start with empty object
          currentSocialMedia = {};
        }
      }

      // Merge new values with existing ones
      const updatedSocialMedia = {
        ...currentSocialMedia,
        ...socialUpdates
      };

      // Update the database
      const result = await db('system_settings')
        .where({ key: 'socialMedia', category: 'business' })
        .update({
          value: JSON.stringify(updatedSocialMedia),
          updated_at: new Date(),
          updated_by: adminId
        })
        .returning('*');

      if (result.length === 0) {
        // Create new setting if it doesn't exist
        await db('system_settings').insert({
          key: 'socialMedia',
          value: JSON.stringify(updatedSocialMedia),
          type: 'object',
          category: 'business',
          description: 'Social media links',
          created_by: adminId,
          updated_by: adminId
        });
      }

      logger.info(`Admin ${adminId} updated social media settings`, { 
        updates: socialUpdates,
        finalValue: updatedSocialMedia 
      });

      return ResponseHelper.success(res, 'Social media settings updated successfully', {
        socialMedia: updatedSocialMedia
      });

    } catch (error: any) {
      logger.error(`Error in updateSocialMedia: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to update social media settings', error);
    }
  }

  /**
   * @swagger
   * /admin/settings/reset-corrupted:
   *   post:
   *     summary: Reset corrupted business settings to clean defaults
   *     tags: [AdminSettings]
   *     responses:
   *       200:
   *         description: Corrupted settings reset successfully
   */
  public async resetCorruptedSettings(req: Request, res: Response) {
    try {
      const adminId = (req as any).user.id;
      const db = getDatabase();

      // Delete all corrupted business settings
      await db('system_settings').where('category', 'business').del();

      // Insert clean business settings with proper values
      const cleanSettings = [
        { key: 'autoApproval', value: 'false', type: 'boolean', category: 'business', description: 'Auto-approve bookings without manual review' },
        { key: 'businessType', value: 'rental', type: 'text', category: 'business', description: 'Type of business' },
        { key: 'companyName', value: 'UruTiBiz', type: 'text', category: 'business', description: 'Company name' },
        { key: 'commissionRate', value: '5.0', type: 'number', category: 'business', description: 'Platform commission rate percentage' },
        { key: 'minBookingDuration', value: '1', type: 'number', category: 'business', description: 'Minimum booking duration in hours' },
        { key: 'maxBookingDuration', value: '168', type: 'number', category: 'business', description: 'Maximum booking duration in hours' },
        { key: 'cancellationPolicy', value: 'flexible', type: 'text', category: 'business', description: 'Default cancellation policy' },
        { key: 'privacyPolicy', value: 'Our privacy policy protects your personal information.', type: 'text', category: 'business', description: 'Privacy policy' },
        { key: 'refundPolicy', value: 'Full refund within 24 hours of booking.', type: 'text', category: 'business', description: 'Refund policy' },
        { key: 'termsOfService', value: 'By using our service, you agree to our terms.', type: 'text', category: 'business', description: 'Terms of service' },
        { key: 'currency', value: 'USD', type: 'text', category: 'business', description: 'Default platform currency' },
        { key: 'timezone', value: 'Africa/Kigali', type: 'text', category: 'business', description: 'Platform default timezone' },
        { key: 'supportedCurrencies', value: '["USD","RWF","EUR","UGX"]', type: 'array', category: 'business', description: 'Supported currencies' },
        { key: 'contactInfo', value: '{"email":"support@urutibiz.com","phone":"+250 123 456 789","address":"Kigali, Rwanda","website":"https://urutibiz.com"}', type: 'object', category: 'business', description: 'Contact information' },
        { key: 'socialMedia', value: '{"facebook":"https://facebook.com/urutibiz","twitter":"https://twitter.com/urutibiz","instagram":"https://instagram.com/urutibiz","linkedin":"https://linkedin.com/company/urutibiz"}', type: 'object', category: 'business', description: 'Social media links' },
        { key: 'taxRate', value: '5.0', type: 'number', category: 'business', description: 'Default tax rate percentage' }
      ];

      // Insert with created_by and updated_by
      const settingsWithAudit = cleanSettings.map(setting => ({
        ...setting,
        created_by: adminId,
        updated_by: adminId
      }));

      await db('system_settings').insert(settingsWithAudit);

      logger.info(`Admin ${adminId} reset corrupted business settings`);

      return ResponseHelper.success(res, 'Corrupted settings reset successfully', {
        message: 'All business settings have been reset to clean defaults',
        settingsCount: cleanSettings.length
      });

    } catch (error: any) {
      logger.error(`Error in resetCorruptedSettings: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to reset corrupted settings', error);
    }
  }

  /**
   * @swagger
   * /admin/settings/cleanup-invalid:
   *   post:
   *     summary: Clean up invalid business settings fields
   *     tags: [AdminSettings]
   *     responses:
   *       200:
   *         description: Invalid fields cleaned up successfully
   */
  public async cleanupInvalidFields(req: Request, res: Response) {
    try {
      const adminId = (req as any).user.id;
      const db = getDatabase();

      // Delete invalid fields that shouldn't exist
      const invalidFields = ['data', 'success', 'message'];
      await db('system_settings')
        .where('category', 'business')
        .whereIn('key', invalidFields)
        .del();

      // Fix duplicate field names
      await db('system_settings')
        .where('category', 'business')
        .where('key', 'minimumBookingDuration')
        .update({ key: 'minBookingDuration' });

      await db('system_settings')
        .where('category', 'business')
        .where('key', 'maximumBookingDuration')
        .update({ key: 'maxBookingDuration' });

      // Remove duplicates (keep the oldest one)
      const duplicates = await db('system_settings')
        .select('key')
        .where('category', 'business')
        .groupBy('key')
        .havingRaw('COUNT(*) > 1');

      for (const duplicate of duplicates) {
        const ids = await db('system_settings')
          .select('id')
          .where('category', 'business')
          .where('key', duplicate.key)
          .orderBy('created_at', 'asc')
          .limit(1);

        if (ids.length > 0) {
          await db('system_settings')
            .where('category', 'business')
            .where('key', duplicate.key)
            .whereNot('id', ids[0].id)
            .del();
        }
      }

      logger.info(`Admin ${adminId} cleaned up invalid business settings fields`);

      return ResponseHelper.success(res, 'Invalid fields cleaned up successfully', {
        message: 'Removed invalid fields and fixed duplicates',
        cleanedFields: invalidFields,
        fixedDuplicates: duplicates.length
      });

    } catch (error: any) {
      logger.error(`Error in cleanupInvalidFields: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to cleanup invalid fields', error);
    }
  }

  /**
   * @swagger
   * /admin/settings/initialize-system:
   *   post:
   *     summary: Initialize system settings with default values
   *     tags: [AdminSettings]
   *     responses:
   *       200:
   *         description: System settings initialized successfully
   */
  public async initializeSystemSettings(req: Request, res: Response) {
    try {
      const adminId = (req as any).user.id;
      const db = getDatabase();

      // Check if system settings already exist
      const existingSettings = await db('system_settings')
        .where('category', 'system')
        .count('* as count')
        .first();

      const existingCount = existingSettings ? Number((existingSettings as any).count) : 0;
      if (existingCount > 0) {
        return ResponseHelper.success(res, 'System settings already initialized', {
          message: 'System settings already exist in the database',
          count: existingCount
        });
      }

      // Default system settings
      const defaultSystemSettings = [
        { key: 'appName', value: 'UruTiBiz', type: 'text', category: 'system', description: 'Application name' },
        { key: 'appVersion', value: '1.0.0', type: 'text', category: 'system', description: 'Application version' },
        { key: 'maintenanceMode', value: 'false', type: 'boolean', category: 'system', description: 'Enable maintenance mode' },
        { key: 'registrationEnabled', value: 'true', type: 'boolean', category: 'system', description: 'Allow new user registrations' },
        { key: 'emailNotifications', value: 'true', type: 'boolean', category: 'system', description: 'Enable email notifications' },
        { key: 'smsNotifications', value: 'false', type: 'boolean', category: 'system', description: 'Enable SMS notifications' },
        { key: 'maxFileSize', value: '10485760', type: 'number', category: 'system', description: 'Maximum file upload size in bytes (10MB)' },
        { key: 'sessionTimeout', value: '3600', type: 'number', category: 'system', description: 'Session timeout in seconds (1 hour)' },
        { key: 'maxLoginAttempts', value: '5', type: 'number', category: 'system', description: 'Maximum login attempts before lockout' },
        { key: 'passwordMinLength', value: '8', type: 'number', category: 'system', description: 'Minimum password length' },
        { key: 'apiRateLimit', value: '1000', type: 'number', category: 'system', description: 'API rate limit per hour per user' },
        { key: 'cacheEnabled', value: 'true', type: 'boolean', category: 'system', description: 'Enable system cache' },
        { key: 'logLevel', value: 'info', type: 'text', category: 'system', description: 'Logging level (error, warn, info, debug)' },
        { key: 'autoBackupEnabled', value: 'true', type: 'boolean', category: 'system', description: 'Enable automatic backups' },
        { key: 'backupFrequency', value: 'daily', type: 'text', category: 'system', description: 'Backup frequency (hourly, daily, weekly)' },
        { key: 'autoApproveProducts', value: 'false', type: 'boolean', category: 'system', description: 'Auto-approve new product listings' },
        { key: 'defaultCurrency', value: 'RWF', type: 'text', category: 'system', description: 'Default platform currency' },
        { key: 'contentModerationEnabled', value: 'true', type: 'boolean', category: 'system', description: 'Enable content moderation' },
        { key: 'analyticsEnabled', value: 'true', type: 'boolean', category: 'system', description: 'Enable analytics tracking' },
        { key: 'fromEmail', value: 'noreply@urutibiz.com', type: 'text', category: 'system', description: 'Default sender email address' }
      ];

      // Insert with created_by and updated_by
      const settingsWithAudit = defaultSystemSettings.map(setting => ({
        ...setting,
        created_by: adminId,
        updated_by: adminId
      }));

      await db('system_settings').insert(settingsWithAudit);

      logger.info(`Admin ${adminId} initialized system settings with ${defaultSystemSettings.length} default values`);

      return ResponseHelper.success(res, 'System settings initialized successfully', {
        message: 'System settings have been initialized with default values',
        settingsCount: defaultSystemSettings.length,
        settings: defaultSystemSettings.map(s => s.key)
      });

    } catch (error: any) {
      logger.error(`Error in initializeSystemSettings: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to initialize system settings', error);
    }
  }

  /**
   * @swagger
   * /admin/settings/notifications:
   *   get:
   *     summary: Get notification settings
   *     tags: [AdminSettings]
   *     responses:
   *       200:
   *         description: Notification settings retrieved successfully
   */
  public async getNotificationSettings(_req: Request, res: Response) {
    try {
      const db = getDatabase();
      
      const notificationSettings = await db('system_settings')
        .select('*')
        .where('category', 'notifications')
        .orderBy('key');

      const notificationObject = notificationSettings.reduce((acc: any, setting: any) => {
        acc[setting.key] = {
          value: setting.value,
          type: setting.type,
          description: setting.description
        };
        return acc;
      }, {});

      const defaultNotifications = {
        emailEnabled: { 
          value: true, 
          type: 'boolean', 
          description: 'Enable email notifications' 
        },
        smsEnabled: { 
          value: false, 
          type: 'boolean', 
          description: 'Enable SMS notifications' 
        },
        pushEnabled: { 
          value: true, 
          type: 'boolean', 
          description: 'Enable push notifications' 
        },
        quietHours: { 
          value: { enabled: false, start: '22:00', end: '08:00' }, 
          type: 'object', 
          description: 'Quiet hours settings' 
        },
        adminAlerts: { 
          value: true, 
          type: 'boolean', 
          description: 'Send alerts to admins' 
        },
        systemMaintenance: { 
          value: { enabled: false, message: '', scheduledAt: null }, 
          type: 'object', 
          description: 'System maintenance notifications' 
        }
      };

      const finalNotifications = Object.keys(notificationObject).length > 0 ? notificationObject : defaultNotifications;

      return ResponseHelper.success(res, 'Notification settings retrieved successfully', finalNotifications);
    } catch (error: any) {
      logger.error(`Error in getNotificationSettings: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve notification settings', error);
    }
  }

  /**
   * @swagger
   * /admin/settings/notifications:
   *   put:
   *     summary: Update notification settings
   *     tags: [AdminSettings]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               emailEnabled:
   *                 type: boolean
   *               smsEnabled:
   *                 type: boolean
   *               pushEnabled:
   *                 type: boolean
   *               quietHours:
   *                 type: object
   *               adminAlerts:
   *                 type: boolean
   *               systemMaintenance:
   *                 type: object
   *     responses:
   *       200:
   *         description: Notification settings updated successfully
   */
  public async updateNotificationSettings(req: Request, res: Response) {
    try {
      const notificationUpdates = req.body;
      const adminId = (req as any).user.id;

      const db = getDatabase();
      const updatedSettings: any = {};

      for (const [key, value] of Object.entries(notificationUpdates)) {
        // Properly serialize complex data types
        let stringValue: string;
        
        if (typeof value === 'object' && value !== null) {
          // Handle objects (like quietHours, systemMaintenance) properly
          stringValue = JSON.stringify(value);
        } else if (typeof value === 'string') {
          // Check if it's already a JSON string to avoid double encoding
          try {
            JSON.parse(value);
            // If it parses successfully, it's already JSON - use as is
            stringValue = value;
          } catch {
            // If it doesn't parse, it's a regular string
            stringValue = value;
          }
        } else {
          // Handle numbers, booleans, etc.
          stringValue = String(value);
        }
        
        // Try to update first
        const result = await db('system_settings')
          .where({ key, category: 'notifications' })
          .update({
            value: stringValue,
            updated_at: new Date(),
            updated_by: adminId
          })
          .returning('*');

        if (result.length === 0) {
          // If no record exists, insert new one
          try {
            await db('system_settings').insert({
              key,
              value: stringValue,
              type: typeof value === 'object' ? 'object' : typeof value,
              category: 'notifications',
              description: `Notification setting for ${key}`,
              created_by: adminId,
              updated_by: adminId
            });
          } catch (insertError: any) {
            // If insert fails due to duplicate key, try to update with different approach
            if (insertError.code === '23505') { // PostgreSQL unique violation
              logger.warn(`Duplicate key detected for ${key}, attempting to update existing record`);
              
              // Try to find and update the existing record
              const existingRecord = await db('system_settings')
                .where({ key })
                .first();
                
              if (existingRecord) {
                await db('system_settings')
                  .where({ id: existingRecord.id })
                  .update({
                    value: stringValue,
                    category: 'notifications',
                    updated_at: new Date(),
                    updated_by: adminId
                  });
              }
            } else {
              throw insertError;
            }
          }
        }

        updatedSettings[key] = value;
      }

      logger.info(`Admin ${adminId} updated notification settings`, { settings: Object.keys(updatedSettings) });

      return ResponseHelper.success(res, 'Notification settings updated successfully', updatedSettings);
    } catch (error: any) {
      logger.error(`Error in updateNotificationSettings: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to update notification settings', error);
    }
  }

  /**
   * @swagger
   * /admin/settings/platform:
   *   get:
   *     summary: Get platform settings
   *     tags: [AdminSettings]
   *     responses:
   *       200:
   *         description: Platform settings retrieved successfully
   */
  public async getPlatformSettings(_req: Request, res: Response) {
    try {
      const db = getDatabase();
      
      const platformSettings = await db('system_settings')
        .select('*')
        .where('category', 'platform')
        .orderBy('key');

      const platformObject = platformSettings.reduce((acc: any, setting: any) => {
        acc[setting.key] = {
          value: setting.value,
          type: setting.type,
          description: setting.description
        };
        return acc;
      }, {});

      const defaultPlatform = {
        // Site Configuration
        siteName: { 
          value: 'UruTiBiz', 
          type: 'text', 
          description: 'Platform name' 
        },
        siteTagline: { 
          value: 'Your trusted rental marketplace', 
          type: 'text', 
          description: 'Platform tagline' 
        },
        siteDescription: { 
          value: 'A comprehensive rental marketplace platform', 
          type: 'text', 
          description: 'Platform description' 
        },
        siteKeywords: { 
          value: 'rental, marketplace, equipment, tools', 
          type: 'text', 
          description: 'SEO keywords' 
        },
        
        // Appearance & Branding
        primaryColor: { 
          value: '#3B82F6', 
          type: 'color', 
          description: 'Primary brand color' 
        },
        secondaryColor: { 
          value: '#10B981', 
          type: 'color', 
          description: 'Secondary brand color' 
        },
        logoUrl: { 
          value: '', 
          type: 'image', 
          description: 'Platform logo URL' 
        },
        faviconUrl: { 
          value: '', 
          type: 'image', 
          description: 'Favicon URL' 
        },
        
        // User Interface
        defaultLanguage: { 
          value: 'en', 
          type: 'select', 
          description: 'Default language' 
        },
        supportedLanguages: { 
          value: ['en', 'fr', 'sw'], 
          type: 'array', 
          description: 'Supported languages' 
        },
        timezone: { 
          value: 'Africa/Kigali', 
          type: 'select', 
          description: 'Platform timezone' 
        },
        dateFormat: { 
          value: 'DD/MM/YYYY', 
          type: 'select', 
          description: 'Date format' 
        },
        currency: { 
          value: 'RWF', 
          type: 'select', 
          description: 'Default currency' 
        },
        currencySymbol: { 
          value: '₣', 
          type: 'text', 
          description: 'Currency symbol' 
        },
        
        // User Registration & Access
        allowUserRegistration: { 
          value: true, 
          type: 'boolean', 
          description: 'Allow new user registration' 
        },
        requireEmailVerification: { 
          value: true, 
          type: 'boolean', 
          description: 'Require email verification' 
        },
        allowGuestBookings: { 
          value: false, 
          type: 'boolean', 
          description: 'Allow bookings without registration' 
        },
        
        // Content & Moderation
        autoApproveListings: { 
          value: false, 
          type: 'boolean', 
          description: 'Auto-approve new listings' 
        },
        requireListingVerification: { 
          value: true, 
          type: 'boolean', 
          description: 'Require listing verification' 
        },
        moderationEnabled: { 
          value: true, 
          type: 'boolean', 
          description: 'Enable content moderation' 
        },
        
        // Search & Discovery
        searchRadius: { 
          value: 50, 
          type: 'number', 
          description: 'Default search radius in kilometers' 
        },
        maxSearchResults: { 
          value: 50, 
          type: 'number', 
          description: 'Maximum search results per page' 
        },
        featuredListingsCount: { 
          value: 6, 
          type: 'number', 
          description: 'Number of featured listings to show' 
        },
        
        // Contact & Support
        contactEmail: { 
          value: 'support@urutibiz.com', 
          type: 'email', 
          description: 'Contact email address' 
        },
        contactPhone: { 
          value: '+250 123 456 789', 
          type: 'text', 
          description: 'Contact phone number' 
        },
        supportHours: { 
          value: 'Mon-Fri 8AM-6PM', 
          type: 'text', 
          description: 'Support hours' 
        },
        
        // Legal & Compliance
        termsOfServiceUrl: { 
          value: '/terms', 
          type: 'url', 
          description: 'Terms of service URL' 
        },
        privacyPolicyUrl: { 
          value: '/privacy', 
          type: 'url', 
          description: 'Privacy policy URL' 
        },
        cookiePolicyUrl: { 
          value: '/cookies', 
          type: 'url', 
          description: 'Cookie policy URL' 
        },
        
        // Analytics & Tracking
        googleAnalyticsId: { 
          value: '', 
          type: 'text', 
          description: 'Google Analytics tracking ID' 
        },
        facebookPixelId: { 
          value: '', 
          type: 'text', 
          description: 'Facebook Pixel ID' 
        },
        enableCookies: { 
          value: true, 
          type: 'boolean', 
          description: 'Enable cookie consent' 
        }
      };

      const finalPlatform = Object.keys(platformObject).length > 0 ? platformObject : defaultPlatform;

      return ResponseHelper.success(res, 'Platform settings retrieved successfully', finalPlatform);
    } catch (error: any) {
      logger.error(`Error in getPlatformSettings: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve platform settings', error);
    }
  }

  /**
   * @swagger
   * /admin/settings/platform:
   *   put:
   *     summary: Update platform settings
   *     tags: [AdminSettings]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               siteName:
   *                 type: string
   *               siteTagline:
   *                 type: string
   *               primaryColor:
   *                 type: string
   *               secondaryColor:
   *                 type: string
   *               defaultLanguage:
   *                 type: string
   *               timezone:
   *                 type: string
   *               currency:
   *                 type: string
   *               allowUserRegistration:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Platform settings updated successfully
   */
  public async updatePlatformSettings(req: Request, res: Response) {
    try {
      const platformUpdates = req.body;
      const adminId = (req as any).user.id;

      const db = getDatabase();
      const updatedSettings: any = {};

      for (const [key, value] of Object.entries(platformUpdates)) {
        // Properly serialize complex data types
        let stringValue: string;
        
        if (typeof value === 'object' && value !== null) {
          // Handle objects and arrays properly
          stringValue = JSON.stringify(value);
        } else if (typeof value === 'string') {
          // Check if it's already a JSON string to avoid double encoding
          try {
            JSON.parse(value);
            // If it parses successfully, it's already JSON - use as is
            stringValue = value;
          } catch {
            // If it doesn't parse, it's a regular string
            stringValue = value;
          }
        } else {
          // Handle numbers, booleans, etc.
          stringValue = String(value);
        }
        
        // Try to update first
        const result = await db('system_settings')
          .where({ key, category: 'platform' })
          .update({
            value: stringValue,
            updated_at: new Date(),
            updated_by: adminId
          })
          .returning('*');

        if (result.length === 0) {
          // If no record exists, insert new one
          try {
            await db('system_settings').insert({
              key,
              value: stringValue,
              type: typeof value === 'object' ? 'object' : typeof value,
              category: 'platform',
              description: `Platform setting for ${key}`,
              created_by: adminId,
              updated_by: adminId
            });
          } catch (insertError: any) {
            // If insert fails due to duplicate key, try to update with different approach
            if (insertError.code === '23505') { // PostgreSQL unique violation
              logger.warn(`Duplicate key detected for ${key}, attempting to update existing record`);
              
              // Try to find and update the existing record
              const existingRecord = await db('system_settings')
                .where({ key })
                .first();
                
              if (existingRecord) {
                await db('system_settings')
                  .where({ id: existingRecord.id })
                  .update({
                    value: stringValue,
                    category: 'platform',
                    updated_at: new Date(),
                    updated_by: adminId
                  });
              }
            } else {
              throw insertError;
            }
          }
        }

        updatedSettings[key] = value;
      }

      logger.info(`Admin ${adminId} updated platform settings`, { settings: Object.keys(updatedSettings) });

      return ResponseHelper.success(res, 'Platform settings updated successfully', updatedSettings);
    } catch (error: any) {
      logger.error(`Error in updatePlatformSettings: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to update platform settings', error);
    }
  }

  /**
   * @swagger
   * /admin/settings/backup-recovery:
   *   get:
   *     summary: Get backup and recovery settings
   *     tags: [AdminSettings]
   *     responses:
   *       200:
   *         description: Backup and recovery settings retrieved successfully
   */
  public async getBackupRecoverySettings(_req: Request, res: Response) {
    try {
      const db = getDatabase();
      
      const backupSettings = await db('system_settings')
        .select('*')
        .where('category', 'backup')
        .orderBy('key');

      const backupObject = backupSettings.reduce((acc: any, setting: any) => {
        acc[setting.key] = {
          value: setting.value,
          type: setting.type,
          description: setting.description
        };
        return acc;
      }, {});

      const defaultBackupRecovery = {
        // Automatic Backup Settings
        autoBackupEnabled: { 
          value: true, 
          type: 'boolean', 
          description: 'Enable automatic backups' 
        },
        backupFrequency: { 
          value: 'daily', 
          type: 'select', 
          description: 'Backup frequency (hourly, daily, weekly, monthly)' 
        },
        backupRetentionDays: { 
          value: 30, 
          type: 'number', 
          description: 'Number of days to keep backups' 
        },
        backupTime: { 
          value: '02:00', 
          type: 'time', 
          description: 'Scheduled backup time (24-hour format)' 
        },
        
        // Backup Types
        includeUsers: { 
          value: true, 
          type: 'boolean', 
          description: 'Include user data in backups' 
        },
        includeProducts: { 
          value: true, 
          type: 'boolean', 
          description: 'Include product listings in backups' 
        },
        includeBookings: { 
          value: true, 
          type: 'boolean', 
          description: 'Include booking data in backups' 
        },
        includeSettings: { 
          value: true, 
          type: 'boolean', 
          description: 'Include system settings in backups' 
        },
        includeMedia: { 
          value: false, 
          type: 'boolean', 
          description: 'Include media files in backups' 
        },
        includeLogs: { 
          value: false, 
          type: 'boolean', 
          description: 'Include system logs in backups' 
        },
        
        // Storage Settings
        backupStorageType: { 
          value: 'local', 
          type: 'select', 
          description: 'Backup storage type (local, cloud, ftp)' 
        },
        backupStoragePath: { 
          value: '/backups', 
          type: 'text', 
          description: 'Local backup storage path' 
        },
        cloudStorageProvider: { 
          value: 'aws', 
          type: 'select', 
          description: 'Cloud storage provider (aws, gcp, azure)' 
        },
        cloudBucketName: { 
          value: '', 
          type: 'text', 
          description: 'Cloud storage bucket name' 
        },
        ftpHost: { 
          value: '', 
          type: 'text', 
          description: 'FTP server host' 
        },
        ftpPort: { 
          value: 21, 
          type: 'number', 
          description: 'FTP server port' 
        },
        ftpUsername: { 
          value: '', 
          type: 'text', 
          description: 'FTP username' 
        },
        ftpPassword: { 
          value: '', 
          type: 'password', 
          description: 'FTP password' 
        },
        
        // Compression & Encryption
        compressBackups: { 
          value: true, 
          type: 'boolean', 
          description: 'Compress backup files' 
        },
        encryptBackups: { 
          value: false, 
          type: 'boolean', 
          description: 'Encrypt backup files' 
        },
        encryptionKey: { 
          value: '', 
          type: 'password', 
          description: 'Backup encryption key' 
        },
        
        // Recovery Settings
        recoveryModeEnabled: { 
          value: true, 
          type: 'boolean', 
          description: 'Enable recovery mode' 
        },
        recoveryTimeout: { 
          value: 3600, 
          type: 'number', 
          description: 'Recovery operation timeout in seconds' 
        },
        allowPartialRecovery: { 
          value: true, 
          type: 'boolean', 
          description: 'Allow partial data recovery' 
        },
        
        // Notification Settings
        notifyOnBackupSuccess: { 
          value: true, 
          type: 'boolean', 
          description: 'Notify admin on successful backup' 
        },
        notifyOnBackupFailure: { 
          value: true, 
          type: 'boolean', 
          description: 'Notify admin on backup failure' 
        },
        notifyOnRecoveryComplete: { 
          value: true, 
          type: 'boolean', 
          description: 'Notify admin on recovery completion' 
        },
        backupNotificationEmail: { 
          value: 'admin@urutibiz.com', 
          type: 'email', 
          description: 'Email for backup notifications' 
        },
        
        // Maintenance Settings
        backupMaintenanceMode: { 
          value: true, 
          type: 'boolean', 
          description: 'Enable maintenance mode during backup' 
        },
        backupMaintenanceMessage: { 
          value: 'System backup in progress. Please try again later.', 
          type: 'text', 
          description: 'Maintenance mode message during backup' 
        },
        cleanupOldBackups: { 
          value: true, 
          type: 'boolean', 
          description: 'Automatically cleanup old backups' 
        },
        maxBackupSize: { 
          value: 1024, 
          type: 'number', 
          description: 'Maximum backup size in MB' 
        }
      };

      const finalBackupRecovery = Object.keys(backupObject).length > 0 ? backupObject : defaultBackupRecovery;

      return ResponseHelper.success(res, 'Backup and recovery settings retrieved successfully', finalBackupRecovery);
    } catch (error: any) {
      logger.error(`Error in getBackupRecoverySettings: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve backup and recovery settings', error);
    }
  }

  /**
   * @swagger
   * /admin/settings/backup-recovery:
   *   put:
   *     summary: Update backup and recovery settings
   *     tags: [AdminSettings]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               autoBackupEnabled:
   *                 type: boolean
   *               backupFrequency:
   *                 type: string
   *               backupRetentionDays:
   *                 type: number
   *               backupTime:
   *                 type: string
   *               includeUsers:
   *                 type: boolean
   *               includeProducts:
   *                 type: boolean
   *               compressBackups:
   *                 type: boolean
   *               encryptBackups:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Backup and recovery settings updated successfully
   */
  public async updateBackupRecoverySettings(req: Request, res: Response) {
    try {
      const backupUpdates = req.body;
      const adminId = (req as any).user.id;

      const db = getDatabase();
      const updatedSettings: any = {};

      for (const [key, value] of Object.entries(backupUpdates)) {
        // Properly serialize complex data types
        let stringValue: string;
        
        if (typeof value === 'object' && value !== null) {
          // Handle objects and arrays properly
          stringValue = JSON.stringify(value);
        } else if (typeof value === 'string') {
          // Check if it's already a JSON string to avoid double encoding
          try {
            JSON.parse(value);
            // If it parses successfully, it's already JSON - use as is
            stringValue = value;
          } catch {
            // If it doesn't parse, it's a regular string
            stringValue = value;
          }
        } else {
          // Handle numbers, booleans, etc.
          stringValue = String(value);
        }
        
        // Try to update first
        const result = await db('system_settings')
          .where({ key, category: 'backup' })
          .update({
            value: stringValue,
            updated_at: new Date(),
            updated_by: adminId
          })
          .returning('*');

        if (result.length === 0) {
          // If no record exists, insert new one
          try {
            await db('system_settings').insert({
              key,
              value: stringValue,
              type: typeof value === 'object' ? 'object' : typeof value,
              category: 'backup',
              description: `Backup setting for ${key}`,
              created_by: adminId,
              updated_by: adminId
            });
          } catch (insertError: any) {
            // If insert fails due to duplicate key, try to update with different approach
            if (insertError.code === '23505') { // PostgreSQL unique violation
              logger.warn(`Duplicate key detected for ${key}, attempting to update existing record`);
              
              // Try to find and update the existing record
              const existingRecord = await db('system_settings')
                .where({ key })
                .first();
                
              if (existingRecord) {
                await db('system_settings')
                  .where({ id: existingRecord.id })
                  .update({
                    value: stringValue,
                    category: 'backup',
                    updated_at: new Date(),
                    updated_by: adminId
                  });
              }
            } else {
              throw insertError;
            }
          }
        }

        updatedSettings[key] = value;
      }

      logger.info(`Admin ${adminId} updated backup and recovery settings`, { settings: Object.keys(updatedSettings) });

      return ResponseHelper.success(res, 'Backup and recovery settings updated successfully', updatedSettings);
    } catch (error: any) {
      logger.error(`Error in updateBackupRecoverySettings: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to update backup and recovery settings', error);
    }
  }

  /**
   * @swagger
   * /admin/settings/backup:
   *   post:
   *     summary: Create system backup
   *     tags: [AdminSettings]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               type:
   *                 type: string
   *                 enum: [full, settings, users, products, bookings]
   *               description:
   *                 type: string
   *     responses:
   *       200:
   *         description: Backup created successfully
   */
  public async createBackup(req: Request, res: Response) {
    try {
      const { type = 'full', description = '' } = req.body;
      const adminId = (req as any).user.id;

      // Simulate backup creation (in real implementation, use actual backup logic)
      const backupId = `backup_${Date.now()}`;
      const backupInfo = {
        id: backupId,
        type,
        description,
        status: 'completed',
        createdAt: new Date(),
        createdBy: adminId,
        size: '2.5MB',
        tables: type === 'full' ? ['users', 'products', 'bookings', 'settings'] : [type]
      };

      logger.info(`Admin ${adminId} created ${type} backup`, { backupId, description });

      return ResponseHelper.success(res, 'Backup created successfully', backupInfo);
    } catch (error: any) {
      logger.error(`Error in createBackup: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to create backup', error);
    }
  }

  /**
   * @swagger
   * /admin/settings/reset:
   *   post:
   *     summary: Reset system settings to defaults
   *     tags: [AdminSettings]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               category:
   *                 type: string
   *                 enum: [theme, security, business, notifications, all]
   *               confirmReset:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Settings reset successfully
   */
  public async resetSettings(req: Request, res: Response) {
    try {
      const { category, confirmReset } = req.body;
      const adminId = (req as any).user.id;

      if (!confirmReset) {
        return ResponseHelper.error(res, 'Reset confirmation required', undefined, 400);
      }

      const db = getDatabase();
      
      if (category === 'all') {
        await db('system_settings').del();
      } else {
        await db('system_settings').where('category', category).del();
      }

      logger.info(`Admin ${adminId} reset ${category} settings`);

      return ResponseHelper.success(res, `${category} settings reset to defaults successfully`);
    } catch (error: any) {
      logger.error(`Error in resetSettings: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to reset settings', error);
    }
  }

  // ==================== ANALYTICS CONFIGURATION METHODS ====================

  /**
   * @swagger
   * /admin/settings/analytics:
   *   get:
   *     summary: Get analytics configuration settings
   *     tags: [AdminSettings]
   *     responses:
   *       200:
   *         description: Analytics configuration retrieved successfully
   */
  public async getAnalyticsSettings(_req: Request, res: Response) {
    try {
      const db = getDatabase();
      
      const analyticsSettings = await db('system_settings')
        .select('*')
        .where('category', 'analytics')
        .orderBy('key');

      const analyticsObject = analyticsSettings.reduce((acc: any, setting: any) => {
        let parsedValue = setting.value;
        try {
          if (setting.type === 'object' || setting.type === 'array') {
            parsedValue = JSON.parse(setting.value);
          } else if (setting.type === 'number') {
            parsedValue = parseFloat(setting.value);
          } else if (setting.type === 'boolean') {
            parsedValue = setting.value === 'true';
          }
        } catch (error) {
          logger.warn(`Failed to parse analytics setting ${setting.key}:`, error);
        }

        acc[setting.key] = {
          value: parsedValue,
          type: setting.type,
          description: setting.description,
          updatedAt: setting.updated_at
        };
        return acc;
      }, {});

      // Default analytics configuration
      const defaultAnalytics: AnalyticsConfig = {
        core: {
          enabled: true,
          trackingLevel: 'standard',
          dataCollectionMode: 'hybrid',
          sessionTracking: true,
          userJourneyTracking: true,
          conversionTracking: true,
          performanceMonitoring: true,
          errorTracking: true
        },
        privacy: {
          gdprCompliant: true,
          dataAnonymization: true,
          ipAddressMasking: true,
          userConsentRequired: true,
          cookieConsent: true,
          dataMinimization: true,
          rightToErasure: true,
          dataPortability: true
        },
        retention: {
          userSessions: 90,
          pageViews: 30,
          userInteractions: 30,
          conversionEvents: 365,
          performanceData: 30,
          errorLogs: 90,
          auditLogs: 365,
          rawAnalyticsData: 30,
          aggregatedData: 365,
          archivedData: 2555 // 7 years
        },
        realTime: {
          enabled: true,
          refreshInterval: 30,
          webSocketEnabled: true,
          liveDashboard: true,
          alertThresholds: {
            highTraffic: 1000,
            lowConversion: 5,
            highErrorRate: 10,
            slowResponseTime: 2000
          },
          maxConnections: 100,
          dataBufferSize: 1000
        },
        integrations: {
          googleAnalytics: {
            enabled: false,
            trackingId: '',
            measurementId: '',
            enhancedEcommerce: false,
            customDimensions: [],
            goals: []
          },
          facebookPixel: {
            enabled: false,
            pixelId: '',
            events: [],
            customAudiences: false
          },
          customAnalytics: {
            enabled: false,
            endpoints: []
          }
        },
        reporting: {
          automatedReports: {
            enabled: false,
            frequency: 'weekly',
            recipients: [],
            format: 'pdf'
          },
          dashboard: {
            defaultDateRange: '30d',
            refreshInterval: 60,
            maxWidgets: 20
          },
          export: {
            enabled: true,
            formats: ['csv', 'excel', 'json'],
            maxRecords: 10000,
            compression: true,
            encryption: false
          }
        },
        performance: {
          dataProcessing: {
            batchSize: 1000,
            processingInterval: 15,
            parallelWorkers: 4
          },
          storage: {
            compressionEnabled: true,
            indexingStrategy: 'partial',
            archiveThreshold: 90
          },
          caching: {
            enabled: true,
            ttl: 300,
            maxSize: 100,
            strategy: 'lru'
          }
        },
        security: {
          accessControl: {
            roleBasedAccess: true,
            allowedRoles: ['admin', 'super_admin'],
            ipWhitelist: [],
            apiRateLimiting: {
              enabled: true,
              requestsPerMinute: 60
            }
          },
          dataProtection: {
            encryptionAtRest: false,
            encryptionInTransit: true,
            auditLogging: true,
            accessLogging: true
          }
        },
        alerting: {
          enabled: false,
          channels: {
            email: {
              enabled: false,
              recipients: []
            },
            slack: {
              enabled: false,
              webhookUrl: '',
              channels: []
            }
          },
          rules: []
        },
        system: {
          timezone: 'Africa/Kigali',
          currency: 'RWF',
          language: 'en',
          dateFormat: 'DD/MM/YYYY',
          maintenanceMode: false,
          debugMode: false,
          logLevel: 'info'
        }
      };

      // Merge with existing settings if any
      const finalConfig = Object.keys(analyticsObject).length > 0 ? 
        this.mergeAnalyticsConfig(defaultAnalytics, analyticsObject) : 
        defaultAnalytics;

      const response: AnalyticsConfigResponse = {
        success: true,
        message: 'Analytics configuration retrieved successfully',
        data: {
          config: finalConfig,
          lastUpdated: new Date(),
          updatedBy: 'system',
          version: '1.0.0'
        }
      };

      return ResponseHelper.success(res, 'Analytics configuration retrieved successfully', response.data);
    } catch (error: any) {
      logger.error(`Error in getAnalyticsSettings: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve analytics settings', error);
    }
  }

  /**
   * @swagger
   * /admin/settings/analytics:
   *   put:
   *     summary: Update analytics configuration settings
   *     tags: [AdminSettings]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               core:
   *                 type: object
   *               privacy:
   *                 type: object
   *               retention:
   *                 type: object
   *               realTime:
   *                 type: object
   *               integrations:
   *                 type: object
   *               reporting:
   *                 type: object
   *               performance:
   *                 type: object
   *               security:
   *                 type: object
   *               alerting:
   *                 type: object
   *               system:
   *                 type: object
   *     responses:
   *       200:
   *         description: Analytics settings updated successfully
   */
  public async updateAnalyticsSettings(req: Request, res: Response) {
    try {
      const analyticsUpdates: AnalyticsSettingsUpdate = req.body;
      const adminId = (req as any).user.id;

      const db = getDatabase();
      const updatedSettings: any = {};

      // Process each category of analytics settings
      for (const [category, settings] of Object.entries(analyticsUpdates)) {
        if (settings && typeof settings === 'object') {
          for (const [key, value] of Object.entries(settings)) {
            const settingKey = `${category}.${key}`;
            let stringValue: string;

            if (typeof value === 'object' && value !== null) {
              stringValue = JSON.stringify(value);
            } else if (typeof value === 'string') {
              try {
                JSON.parse(value);
                stringValue = value;
              } catch {
                stringValue = value;
              }
            } else {
              stringValue = String(value);
            }

            // Update or insert setting
            const result = await db('system_settings')
              .where({ key: settingKey, category: 'analytics' })
              .update({
                value: stringValue,
                type: typeof value === 'object' ? 'object' : typeof value,
                updated_at: new Date(),
                updated_by: adminId
              })
              .returning('*');

            if (result.length === 0) {
              await db('system_settings').insert({
                key: settingKey,
                value: stringValue,
                type: typeof value === 'object' ? 'object' : typeof value,
                category: 'analytics',
                description: `Analytics setting for ${settingKey}`,
                created_by: adminId,
                updated_by: adminId
              });
            }

            updatedSettings[settingKey] = value;
          }
        }
      }

      logger.info(`Admin ${adminId} updated analytics settings`, { 
        categories: Object.keys(analyticsUpdates),
        settingsCount: Object.keys(updatedSettings).length 
      });

      return ResponseHelper.success(res, 'Analytics settings updated successfully', updatedSettings);
    } catch (error: any) {
      logger.error(`Error in updateAnalyticsSettings: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to update analytics settings', error);
    }
  }

  /**
   * @swagger
   * /admin/settings/analytics/health:
   *   get:
   *     summary: Get analytics system health status
   *     tags: [AdminSettings]
   *     responses:
   *       200:
   *         description: Analytics health status retrieved successfully
   */
  public async getAnalyticsHealth(_req: Request, res: Response) {
    try {
      const healthCheck: AnalyticsHealthCheck = {
        status: 'healthy',
        checks: {
          dataCollection: true,
          realTimeProcessing: true,
          thirdPartyIntegrations: true,
          storage: true,
          caching: true,
          alerting: false
        },
        metrics: {
          dataProcessingLatency: 150,
          storageUtilization: 45.2,
          cacheHitRate: 87.5,
          errorRate: 0.1,
          throughput: 1250
        },
        lastChecked: new Date()
      };

      return ResponseHelper.success(res, 'Analytics health status retrieved successfully', healthCheck);
    } catch (error: any) {
      logger.error(`Error in getAnalyticsHealth: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve analytics health status', error);
    }
  }

  /**
   * @swagger
   * /admin/settings/analytics/export:
   *   post:
   *     summary: Export analytics data or configuration
   *     tags: [AdminSettings]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               type:
   *                 type: string
   *                 enum: [data, report, config]
   *               format:
   *                 type: string
   *                 enum: [csv, excel, pdf, json]
   *               dateRange:
   *                 type: object
   *                 properties:
   *                   start:
   *                     type: string
   *                     format: date
   *                   end:
   *                     type: string
   *                     format: date
   *               filters:
   *                 type: object
   *               metrics:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: Export request processed successfully
   */
  public async exportAnalyticsData(req: Request, res: Response) {
    try {
      const exportRequest: AnalyticsExportRequest = req.body;
      const adminId = (req as any).user.id;

      // Generate export ID
      const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const exportResponse: AnalyticsExportResponse = {
        success: true,
        message: 'Export request processed successfully',
        data: {
          exportId,
          status: 'pending',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          recordCount: 0
        }
      };

      logger.info(`Admin ${adminId} requested analytics export`, { 
        exportId, 
        type: exportRequest.type, 
        format: exportRequest.format 
      });

      return ResponseHelper.success(res, 'Export request processed successfully', exportResponse.data);
    } catch (error: any) {
      logger.error(`Error in exportAnalyticsData: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to process export request', error);
    }
  }

  /**
   * Helper method to merge analytics configuration with existing settings
   */
  private mergeAnalyticsConfig(defaultConfig: AnalyticsConfig, existingSettings: any): AnalyticsConfig {
    // Deep merge logic for analytics configuration
    const merged = JSON.parse(JSON.stringify(defaultConfig));
    
    for (const [key, setting] of Object.entries(existingSettings)) {
      if (key.includes('.')) {
        const [category, settingKey] = key.split('.');
        if (merged[category] && merged[category][settingKey] !== undefined) {
          merged[category][settingKey] = (setting as any).value;
        }
      }
    }
    
    return merged;
  }
}

export default new AdminSettingsController();
