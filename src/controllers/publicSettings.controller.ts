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
        'siteName',
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

        acc[category][key] = value;
        
        return acc;
      }, {});
      
      // Ensure business.companyLogo exists if platformLogo is there (check both categories)
      const logo = settingsMap.business?.platformLogo || settingsMap.platform?.platformLogo;
      if (logo) {
          if (!settingsMap.business) settingsMap.business = {};
          if (!settingsMap.platform) settingsMap.platform = {};
          
          settingsMap.business.companyLogo = logo;
          settingsMap.platform.logoUrl = logo; // Also set for platform.logoUrl
      }

      // Ensure siteName is populated (try siteName, then platformName, then appName)
      const siteName = settingsMap.platform?.siteName || settingsMap.platform?.platformName || settingsMap.system?.appName;
      if (siteName) {
          if (!settingsMap.platform) settingsMap.platform = {};
          settingsMap.platform.siteName = siteName;
      }
      
      // Ensure companyName is populated
       const companyName = settingsMap.business?.companyName || settingsMap.platform?.companyName;
       if (companyName) {
          if (!settingsMap.business) settingsMap.business = {};
           settingsMap.business.companyName = companyName;
       }

      return ResponseHelper.success(res, 'Public settings retrieved', settingsMap);
    } catch (error: any) {
       logger.error(`Error fetching public settings: ${error.message}`);
       return ResponseHelper.error(res, 'Failed to fetch public settings', error);
    }
  }
}
