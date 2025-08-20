// =====================================================
// ADMINISTRATIVE DIVISION CONTROLLER
// =====================================================

import { Request, Response } from 'express';
import { AdministrativeDivisionService } from '@/services/administrativeDivision.service';
import { 
  CreateAdministrativeDivisionRequest, 
  UpdateAdministrativeDivisionRequest, 
  AdministrativeDivisionFilters 
} from '@/types/administrativeDivision.types';
import { ResponseHelper } from '@/utils/response';
import logger from '@/utils/logger';

export class AdministrativeDivisionController {

  /**
   * @swagger
   * /administrative-divisions:
   *   post:
   *     summary: Create a new administrative division
   *     tags: [Administrative Divisions]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - country_id
   *               - level
   *               - name
   *             properties:
   *               country_id:
   *                 type: string
   *                 format: uuid
   *                 description: Country ID
   *               parent_id:
   *                 type: string
   *                 format: uuid
   *                 description: Parent division ID (null for root level)
   *               level:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 10
   *                 description: Administrative level (1=Province/State, 2=District, etc.)
   *               code:
   *                 type: string
   *                 maxLength: 20
   *                 description: Official government code
   *               name:
   *                 type: string
   *                 maxLength: 100
   *                 description: Division name
   *               local_name:
   *                 type: string
   *                 maxLength: 100
   *                 description: Name in local language
   *               type:
   *                 type: string
   *                 maxLength: 50
   *                 description: Division type (province, district, county, etc.)
   *               population:
   *                 type: integer
   *                 minimum: 0
   *                 description: Population count
   *               area_km2:
   *                 type: number
   *                 minimum: 0
   *                 description: Area in square kilometers
   *               coordinates:
   *                 type: object
   *                 properties:
   *                   latitude:
   *                     type: number
   *                     minimum: -90
   *                     maximum: 90
   *                   longitude:
   *                     type: number
   *                     minimum: -180
   *                     maximum: 180
   *               is_active:
   *                 type: boolean
   *                 default: true
   *     responses:
   *       201:
   *         description: Administrative division created successfully
   *       400:
   *         description: Validation error
   *       404:
   *         description: Country or parent division not found
   */
  static async createDivision(req: Request, res: Response) {
    try {
      const data: CreateAdministrativeDivisionRequest = req.body;
      
      // Debug logging to see what data is received
      logger.info(`Creating administrative division with data:`, { 
        country_id: data.country_id, 
        name: data.name, 
        level: data.level,
        type: data.type,
        parent_id: data.parent_id 
      });
      
      // Validate request data
      AdministrativeDivisionService.validateDivisionData(data);
      
      const division = await AdministrativeDivisionService.createDivision(data);
      
      return ResponseHelper.created(res, 'Administrative division created successfully', division);
    } catch (error: any) {
      logger.error(`Error in createDivision: ${error.message}`, { 
        error: error.message, 
        stack: error.stack,
        body: req.body 
      });
      
      if (error.message.includes('not found')) {
        return ResponseHelper.notFound(res, error.message);
      }
      
      if (error.message.includes('already exists') || error.message.includes('Validation failed')) {
        return ResponseHelper.badRequest(res, error.message);
      }
      
      return ResponseHelper.error(res, 'Failed to create administrative division', error);
    }
  }

  /**
   * @swagger
   * /administrative-divisions:
   *   get:
   *     summary: Get all administrative divisions with filtering
   *     tags: [Administrative Divisions]
   *     parameters:
   *       - in: query
   *         name: country_id
   *         schema:
   *           type: string
   *         description: Filter by country ID
   *       - in: query
   *         name: parent_id
   *         schema:
   *           type: string
   *         description: Filter by parent division ID (use 'null' for root divisions)
   *       - in: query
   *         name: level
   *         schema:
   *           type: integer
   *         description: Filter by administrative level
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *         description: Filter by division type
   *       - in: query
   *         name: is_active
   *         schema:
   *           type: boolean
   *         description: Filter by active status
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search in name, local_name, or code
   *       - in: query
   *         name: has_children
   *         schema:
   *           type: boolean
   *         description: Filter divisions that have/don't have children
   *       - in: query
   *         name: min_population
   *         schema:
   *           type: integer
   *         description: Minimum population filter
   *       - in: query
   *         name: max_population
   *         schema:
   *           type: integer
   *         description: Maximum population filter
   *       - in: query
   *         name: include_country
   *         schema:
   *           type: boolean
   *         description: Include country information
   *       - in: query
   *         name: include_parent
   *         schema:
   *           type: boolean
   *         description: Include parent division information
   *       - in: query
   *         name: include_children
   *         schema:
   *           type: boolean
   *         description: Include children divisions
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *         description: Number of divisions to return
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of divisions to skip
   *       - in: query
   *         name: sort_by
   *         schema:
   *           type: string
   *           enum: [name, code, level, population, area_km2, created_at]
   *           default: name
   *       - in: query
   *         name: sort_order
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: asc
   *     responses:
   *       200:
   *         description: Administrative divisions retrieved successfully
   */
  static async getDivisions(req: Request, res: Response) {
    try {
      const filters: AdministrativeDivisionFilters = {
        country_id: req.query.country_id as string,
        parent_id: req.query.parent_id === 'null' ? null : req.query.parent_id as string,
        level: req.query.level ? parseInt(req.query.level as string) : undefined,
        type: req.query.type as string,
        is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
        search: req.query.search as string,
        has_children: req.query.has_children ? req.query.has_children === 'true' : undefined,
        min_population: req.query.min_population ? parseInt(req.query.min_population as string) : undefined,
        max_population: req.query.max_population ? parseInt(req.query.max_population as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        sort_by: req.query.sort_by as any,
        sort_order: req.query.sort_order as any,
        include_country: req.query.include_country === 'true',
        include_parent: req.query.include_parent === 'true',
        include_children: req.query.include_children === 'true'
      };

      const result = await AdministrativeDivisionService.getDivisions(filters);
      
      return ResponseHelper.success(res, 'Administrative divisions retrieved successfully', result.divisions, 200, result.meta);
    } catch (error: any) {
      logger.error(`Error in getDivisions: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve administrative divisions', error);
    }
  }

  /**
   * @swagger
   * /administrative-divisions/{id}:
   *   get:
   *     summary: Get administrative division by ID
   *     tags: [Administrative Divisions]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Division ID
   *       - in: query
   *         name: include_country
   *         schema:
   *           type: boolean
   *         description: Include country information
   *       - in: query
   *         name: include_parent
   *         schema:
   *           type: boolean
   *         description: Include parent division information
   *       - in: query
   *         name: include_children
   *         schema:
   *           type: boolean
   *         description: Include children divisions
   *     responses:
   *       200:
   *         description: Administrative division retrieved successfully
   *       404:
   *         description: Division not found
   */
  static async getDivisionById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const options = {
        include_country: req.query.include_country === 'true',
        include_parent: req.query.include_parent === 'true',
        include_children: req.query.include_children === 'true'
      };
      
      const division = await AdministrativeDivisionService.getDivisionById(id, options);
      
      return ResponseHelper.success(res, 'Administrative division retrieved successfully', division);
    } catch (error: any) {
      logger.error(`Error in getDivisionById: ${error.message}`);
      
      if (error.message.includes('not found')) {
        return ResponseHelper.notFound(res, 'Administrative division not found');
      }
      
      return ResponseHelper.error(res, 'Failed to retrieve administrative division', error);
    }
  }

  /**
   * @swagger
   * /administrative-divisions/{id}:
   *   put:
   *     summary: Update administrative division
   *     tags: [Administrative Divisions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Division ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               parent_id:
   *                 type: string
   *                 format: uuid
   *               level:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 10
   *               code:
   *                 type: string
   *                 maxLength: 20
   *               name:
   *                 type: string
   *                 maxLength: 100
   *               local_name:
   *                 type: string
   *                 maxLength: 100
   *               type:
   *                 type: string
   *                 maxLength: 50
   *               population:
   *                 type: integer
   *                 minimum: 0
   *               area_km2:
   *                 type: number
   *                 minimum: 0
   *               coordinates:
   *                 type: object
   *                 properties:
   *                   latitude:
   *                     type: number
   *                     minimum: -90
   *                     maximum: 90
   *                   longitude:
   *                     type: number
   *                     minimum: -180
   *                     maximum: 180
   *               is_active:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Administrative division updated successfully
   *       404:
   *         description: Division not found
   *       400:
   *         description: Validation error
   */
  static async updateDivision(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateAdministrativeDivisionRequest = req.body;
      
      // Validate request data
      AdministrativeDivisionService.validateDivisionData(data);
      
      const division = await AdministrativeDivisionService.updateDivision(id, data);
      
      return ResponseHelper.success(res, 'Administrative division updated successfully', division);
    } catch (error: any) {
      logger.error(`Error in updateDivision: ${error.message}`);
      
      if (error.message.includes('not found')) {
        return ResponseHelper.notFound(res, error.message);
      }
      
      if (error.message.includes('already exists') || 
          error.message.includes('Validation failed') ||
          error.message.includes('circular reference') ||
          error.message.includes('level')) {
        return ResponseHelper.badRequest(res, error.message);
      }
      
      return ResponseHelper.error(res, 'Failed to update administrative division', error);
    }
  }

  /**
   * @swagger
   * /administrative-divisions/{id}:
   *   delete:
   *     summary: Delete administrative division (soft delete)
   *     tags: [Administrative Divisions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Division ID
   *     responses:
   *       200:
   *         description: Administrative division deleted successfully
   *       404:
   *         description: Division not found
   *       400:
   *         description: Cannot delete division with children
   */
  static async deleteDivision(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await AdministrativeDivisionService.deleteDivision(id);
      
      return ResponseHelper.success(res, 'Administrative division deleted successfully');
    } catch (error: any) {
      logger.error(`Error in deleteDivision: ${error.message}`);
      
      if (error.message.includes('not found')) {
        return ResponseHelper.notFound(res, 'Administrative division not found');
      }
      
      if (error.message.includes('children')) {
        return ResponseHelper.badRequest(res, error.message);
      }
      
      return ResponseHelper.error(res, 'Failed to delete administrative division', error);
    }
  }

  /**
   * @swagger
   * /administrative-divisions/{id}/hierarchy:
   *   get:
   *     summary: Get division hierarchy (ancestors, descendants, siblings)
   *     tags: [Administrative Divisions]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Division ID
   *     responses:
   *       200:
   *         description: Division hierarchy retrieved successfully
   *       404:
   *         description: Division not found
   */
  static async getDivisionHierarchy(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const hierarchy = await AdministrativeDivisionService.getDivisionHierarchy(id);
      
      return ResponseHelper.success(res, 'Division hierarchy retrieved successfully', hierarchy);
    } catch (error: any) {
      logger.error(`Error in getDivisionHierarchy: ${error.message}`);
      
      if (error.message.includes('not found')) {
        return ResponseHelper.notFound(res, 'Administrative division not found');
      }
      
      return ResponseHelper.error(res, 'Failed to retrieve division hierarchy', error);
    }
  }

  /**
   * @swagger
   * /administrative-divisions/countries/{countryId}:
   *   get:
   *     summary: Get divisions by country
   *     tags: [Administrative Divisions]
   *     parameters:
   *       - in: path
   *         name: countryId
   *         required: true
   *         schema:
   *           type: string
   *         description: Country ID
   *       - in: query
   *         name: level
   *         schema:
   *           type: integer
   *         description: Filter by administrative level
   *     responses:
   *       200:
   *         description: Divisions retrieved successfully
   *       404:
   *         description: Country not found
   */
  static async getDivisionsByCountry(req: Request, res: Response) {
    try {
      const { countryId } = req.params;
      const level = req.query.level ? parseInt(req.query.level as string) : undefined;
      
      const divisions = await AdministrativeDivisionService.getDivisionsByCountry(countryId, level);
      
      return ResponseHelper.success(res, 'Divisions retrieved successfully', divisions);
    } catch (error: any) {
      logger.error(`Error in getDivisionsByCountry: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve divisions by country', error);
    }
  }

  /**
   * @swagger
   * /administrative-divisions/tree:
   *   get:
   *     summary: Get division tree structure
   *     tags: [Administrative Divisions]
   *     parameters:
   *       - in: query
   *         name: country_id
   *         schema:
   *           type: string
   *         description: Country ID to get tree for
   *       - in: query
   *         name: root_id
   *         schema:
   *           type: string
   *         description: Root division ID to start tree from
   *     responses:
   *       200:
   *         description: Division tree retrieved successfully
   */
  static async getDivisionTree(req: Request, res: Response) {
    try {
      const countryId = req.query.country_id as string;
      const rootId = req.query.root_id as string;
      
      const tree = await AdministrativeDivisionService.getDivisionTree(countryId, rootId);
      
      return ResponseHelper.success(res, 'Division tree retrieved successfully', tree);
    } catch (error: any) {
      logger.error(`Error in getDivisionTree: ${error.message}`);
      
      if (error.message.includes('not found')) {
        return ResponseHelper.notFound(res, error.message);
      }
      
      return ResponseHelper.error(res, 'Failed to retrieve division tree', error);
    }
  }

  /**
   * @swagger
   * /administrative-divisions/search:
   *   get:
   *     summary: Search administrative divisions
   *     tags: [Administrative Divisions]
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *         description: Search term
   *       - in: query
   *         name: country_id
   *         schema:
   *           type: string
   *         description: Filter by country ID
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Number of results to return
   *     responses:
   *       200:
   *         description: Search results retrieved successfully
   *       400:
   *         description: Search term is required
   */
  static async searchDivisions(req: Request, res: Response) {
    try {
      const { q: searchTerm, country_id: countryId, limit } = req.query;
      
      if (!searchTerm) {
        return ResponseHelper.badRequest(res, 'Search term is required');
      }
      
      const divisions = await AdministrativeDivisionService.searchDivisions(
        searchTerm as string,
        countryId as string,
        limit ? parseInt(limit as string) : undefined
      );
      
      return ResponseHelper.success(res, 'Search results retrieved successfully', divisions);
    } catch (error: any) {
      logger.error(`Error in searchDivisions: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to search administrative divisions', error);
    }
  }

  /**
   * @swagger
   * /administrative-divisions/stats:
   *   get:
   *     summary: Get administrative division statistics
   *     tags: [Administrative Divisions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: country_id
   *         schema:
   *           type: string
   *         description: Filter statistics by country
   *     responses:
   *       200:
   *         description: Statistics retrieved successfully
   */
  static async getDivisionStats(_req: Request, res: Response) {
    try {
      const countryId = _req.query.country_id as string;
      const stats = await AdministrativeDivisionService.getDivisionStats(countryId);
      
      return ResponseHelper.success(res, 'Division statistics retrieved successfully', stats);
    } catch (error: any) {
      logger.error(`Error in getDivisionStats: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve division statistics', error);
    }
  }

  /**
   * @swagger
   * /administrative-divisions/{id}/toggle-status:
   *   patch:
   *     summary: Toggle division active status
   *     tags: [Administrative Divisions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Division ID
   *     responses:
   *       200:
   *         description: Division status toggled successfully
   *       404:
   *         description: Division not found
   */
  static async toggleDivisionStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const division = await AdministrativeDivisionService.toggleDivisionStatus(id);
      
      return ResponseHelper.success(res, 'Division status toggled successfully', division);
    } catch (error: any) {
      logger.error(`Error in toggleDivisionStatus: ${error.message}`);
      
      if (error.message.includes('not found')) {
        return ResponseHelper.notFound(res, 'Administrative division not found');
      }
      
      return ResponseHelper.error(res, 'Failed to toggle division status', error);
    }
  }
}
