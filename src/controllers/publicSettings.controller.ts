import { Request, Response } from 'express';
import { getDatabase } from '@/config/database';
import { ResponseHelper } from '@/utils/response';
import logger from '@/utils/logger';

export default class PublicSettingsController {
  /**
   * @swagger
   * /system/public-settings:
   *   get:
   *     summary: Get public business settings (logo, name, contact, etc.)
   *     tags: [System]
   *     responses:
   *       200:
   *         description: Public settings retrieved successfully
   */
  public static async getPublicSettings(req: Request, res: Response) {
    try {
      const db = getDatabase();
      
      // Define allowlist of public keys
      const publicKeys = [
        'companyName', 
        'platformLogo', 
        'platformLogoPublicId',
        'socialMedia', 
        'contactInfo', 
        'termsOfService', 
        'privacyPolicy', 
        'refundPolicy',
        'supportContact', 
        'workingHours', 
        'currency',
        'appName', 
        'appVersion',
        'platformName',
        'platformTagline'
      ];

      const settings = await db('system_settings')
        .whereIn('key', publicKeys)
        .select('key', 'value', 'type', 'category');

      // Transform to cleaner object
      const settingsMap = settings.reduce((acc: any, curr: any) => {
        let value = curr.value;
        const key = curr.key;

        // Parse JSON for object/array types
        try {
            if (curr.type === 'object' || curr.type === 'array' || value?.startsWith('{') || value?.startsWith('[')) {
                value = JSON.parse(value);
            }
        } catch (e) {
            // Keep original string if parse fails
        }
        
        // Structure by category or flat?
        // AdminSettingsContext expects { business: { ... }, platform: { ... } }
        // Let's try to match that structure for easier frontend integration
        const category = curr.category || 'platform';
        if (!acc[category]) {
            acc[category] = {};
        }

        // Map platformLogo to companyLogo for frontend compatibility if needed
        // but frontend service maps it manually usually.
        acc[category][key] = value;
        
        return acc;
      }, {});
      
      // Ensure business.companyLogo exists if platformLogo is there
      if (settingsMap.business?.platformLogo) {
          settingsMap.business.companyLogo = settingsMap.business.platformLogo;
      }

      return ResponseHelper.success(res, 'Public settings retrieved', settingsMap);
    } catch (error: any) {
       logger.error(`Error fetching public settings: ${error.message}`);
       return ResponseHelper.error(res, 'Failed to fetch public settings', error);
    }
  }
}
