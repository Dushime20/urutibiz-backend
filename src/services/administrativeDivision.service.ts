// =====================================================
// ADMINISTRATIVE DIVISION SERVICE
// =====================================================

import { AdministrativeDivisionModel } from '@/models/AdministrativeDivision.model';
import { CountryModel } from '@/models/Country.model';
import { 
  AdministrativeDivision, 
  CreateAdministrativeDivisionRequest, 
  UpdateAdministrativeDivisionRequest, 
  AdministrativeDivisionFilters, 
  AdministrativeDivisionStats,
  AdministrativeHierarchy,
  DivisionTreeNode
} from '@/types/administrativeDivision.types';
import logger from '@/utils/logger';

export class AdministrativeDivisionService {

  /**
   * Create a new administrative division
   */
  static async createDivision(data: CreateAdministrativeDivisionRequest): Promise<AdministrativeDivision> {
    try {
      // Validate country exists
      const country = await CountryModel.findById(data.country_id);
      if (!country) {
        throw new Error('Country not found');
      }

      // Validate parent exists if provided
      if (data.parent_id) {
        const parent = await AdministrativeDivisionModel.findById(data.parent_id);
        if (!parent) {
          throw new Error('Parent division not found');
        }
        
        // Ensure parent belongs to the same country
        if (parent.country_id !== data.country_id) {
          throw new Error('Parent division must belong to the same country');
        }

        // Validate level hierarchy (child level should be greater than parent)
        if (data.level <= parent.level) {
          throw new Error(`Child level (${data.level}) must be greater than parent level (${parent.level})`);
        }
      }

      // Validate unique code within country if provided
      if (data.code) {
        const codeExists = await AdministrativeDivisionModel.codeExists(data.country_id, data.code);
        if (codeExists) {
          throw new Error(`Division code '${data.code}' already exists in this country`);
        }
      }

      const division = await AdministrativeDivisionModel.create(data);
      logger.info(`Administrative division created: ${division.name} (${division.type}) in ${country.name}`);
      
      return division;
    } catch (error: any) {
      logger.error(`Error creating administrative division: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get administrative division by ID
   */
  static async getDivisionById(id: string, options: Partial<AdministrativeDivisionFilters> = {}): Promise<AdministrativeDivision> {
    try {
      const division = await AdministrativeDivisionModel.findById(id, options);
      if (!division) {
        throw new Error('Administrative division not found');
      }
      return division;
    } catch (error: any) {
      logger.error(`Error getting administrative division by ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all administrative divisions with filters and pagination
   */
  static async getDivisions(filters: AdministrativeDivisionFilters = {}) {
    try {
      const { divisions, total } = await AdministrativeDivisionModel.findAll(filters);
      
      // Calculate pagination metadata
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      const page = Math.floor(offset / limit) + 1;
      const pages = Math.ceil(total / limit);

      return {
        divisions,
        meta: {
          total,
          limit,
          offset,
          page,
          pages
        }
      };
    } catch (error: any) {
      logger.error(`Error getting administrative divisions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update administrative division
   */
  static async updateDivision(id: string, data: UpdateAdministrativeDivisionRequest): Promise<AdministrativeDivision> {
    try {
      // Check if division exists
      const existingDivision = await AdministrativeDivisionModel.findById(id);
      if (!existingDivision) {
        throw new Error('Administrative division not found');
      }

      // Validate parent if being updated
      if (data.parent_id !== undefined) {
        if (data.parent_id) {
          const parent = await AdministrativeDivisionModel.findById(data.parent_id);
          if (!parent) {
            throw new Error('Parent division not found');
          }
          
          // Ensure parent belongs to the same country
          if (parent.country_id !== existingDivision.country_id) {
            throw new Error('Parent division must belong to the same country');
          }

          // Prevent circular references
          const ancestors = await AdministrativeDivisionModel.getAncestors(data.parent_id);
          if (ancestors.some(ancestor => ancestor.id === id)) {
            throw new Error('Cannot set parent: would create circular reference');
          }

          // Validate level hierarchy if level is also being updated
          const newLevel = data.level || existingDivision.level;
          if (newLevel <= parent.level) {
            throw new Error(`Child level (${newLevel}) must be greater than parent level (${parent.level})`);
          }
        }
      }

      // Validate unique code within country if being updated
      if (data.code && data.code !== existingDivision.code) {
        const codeExists = await AdministrativeDivisionModel.codeExists(
          existingDivision.country_id, 
          data.code, 
          id
        );
        if (codeExists) {
          throw new Error(`Division code '${data.code}' already exists in this country`);
        }
      }

      const division = await AdministrativeDivisionModel.update(id, data);
      if (!division) {
        throw new Error('Failed to update administrative division');
      }

      logger.info(`Administrative division updated: ${division.name} (${division.type})`);
      return division;
    } catch (error: any) {
      logger.error(`Error updating administrative division ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete administrative division (soft delete)
   */
  static async deleteDivision(id: string): Promise<void> {
    try {
      const division = await AdministrativeDivisionModel.findById(id);
      if (!division) {
        throw new Error('Administrative division not found');
      }

      // Check if division has children
      const children = await AdministrativeDivisionModel.findChildren(id);
      if (children.length > 0) {
        throw new Error('Cannot delete division with active children. Delete or reassign children first.');
      }

      const success = await AdministrativeDivisionModel.delete(id);
      if (!success) {
        throw new Error('Failed to delete administrative division');
      }

      logger.info(`Administrative division soft deleted: ${division.name} (${division.type})`);
    } catch (error: any) {
      logger.error(`Error deleting administrative division ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Hard delete administrative division
   */
  static async hardDeleteDivision(id: string): Promise<void> {
    try {
      const division = await AdministrativeDivisionModel.findById(id);
      if (!division) {
        throw new Error('Administrative division not found');
      }

      // Check if division has children
      const children = await AdministrativeDivisionModel.findChildren(id);
      if (children.length > 0) {
        throw new Error('Cannot permanently delete division with children. Delete children first.');
      }

      const success = await AdministrativeDivisionModel.hardDelete(id);
      if (!success) {
        throw new Error('Failed to permanently delete administrative division');
      }

      logger.info(`Administrative division permanently deleted: ${division.name} (${division.type})`);
    } catch (error: any) {
      logger.error(`Error permanently deleting administrative division ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get divisions by country
   */
  static async getDivisionsByCountry(countryId: string, level?: number): Promise<AdministrativeDivision[]> {
    try {
      const filters: AdministrativeDivisionFilters = { 
        country_id: countryId, 
        is_active: true,
        include_country: true
      };
      
      if (level) {
        filters.level = level;
      }

      const { divisions } = await AdministrativeDivisionModel.findAll(filters);
      return divisions;
    } catch (error: any) {
      logger.error(`Error getting divisions by country ${countryId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get division hierarchy
   */
  static async getDivisionHierarchy(id: string): Promise<AdministrativeHierarchy> {
    try {
      const hierarchy = await AdministrativeDivisionModel.getHierarchy(id);
      if (!hierarchy) {
        throw new Error('Administrative division not found');
      }
      return hierarchy;
    } catch (error: any) {
      logger.error(`Error getting division hierarchy for ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get division tree for country
   */
  static async getDivisionTree(countryId?: string, rootId?: string): Promise<DivisionTreeNode[]> {
    try {
      if (countryId) {
        // Validate country exists
        const country = await CountryModel.findById(countryId);
        if (!country) {
          throw new Error('Country not found');
        }
      }

      if (rootId) {
        // Validate root division exists
        const rootDivision = await AdministrativeDivisionModel.findById(rootId);
        if (!rootDivision) {
          throw new Error('Root division not found');
        }
      }

      return await AdministrativeDivisionModel.getTree(rootId, countryId);
    } catch (error: any) {
      logger.error(`Error getting division tree: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get children of a division
   */
  static async getDivisionChildren(parentId: string): Promise<AdministrativeDivision[]> {
    try {
      return await AdministrativeDivisionModel.findChildren(parentId);
    } catch (error: any) {
      logger.error(`Error getting division children for ${parentId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search divisions
   */
  static async searchDivisions(
    searchTerm: string, 
    countryId?: string, 
    limit: number = 10
  ): Promise<AdministrativeDivision[]> {
    try {
      const filters: AdministrativeDivisionFilters = {
        search: searchTerm,
        is_active: true,
        limit,
        sort_by: 'name',
        include_country: true,
        include_parent: true
      };

      if (countryId) {
        filters.country_id = countryId;
      }

      const { divisions } = await AdministrativeDivisionModel.findAll(filters);
      return divisions;
    } catch (error: any) {
      logger.error(`Error searching divisions with term '${searchTerm}': ${error.message}`);
      throw error;
    }
  }

  /**
   * Get divisions within geographic bounds
   */
  static async getDivisionsWithinBounds(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<AdministrativeDivision[]> {
    try {
      return await AdministrativeDivisionModel.findWithinBounds(bounds);
    } catch (error: any) {
      logger.error(`Error getting divisions within bounds: ${error.message}`);
      throw error;
    }
  }

  /**
   * Toggle division active status
   */
  static async toggleDivisionStatus(id: string): Promise<AdministrativeDivision> {
    try {
      const division = await AdministrativeDivisionModel.toggleActive(id);
      if (!division) {
        throw new Error('Administrative division not found');
      }

      logger.info(`Administrative division status toggled: ${division.name} - Active: ${division.is_active}`);
      return division;
    } catch (error: any) {
      logger.error(`Error toggling division status ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get division statistics
   */
  static async getDivisionStats(countryId?: string): Promise<AdministrativeDivisionStats> {
    try {
      return await AdministrativeDivisionModel.getStats(countryId);
    } catch (error: any) {
      logger.error(`Error getting division statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get root divisions (no parent) for a country
   */
  static async getRootDivisions(countryId: string): Promise<AdministrativeDivision[]> {
    try {
      const { divisions } = await AdministrativeDivisionModel.findAll({
        country_id: countryId,
        parent_id: null,
        is_active: true,
        sort_by: 'name'
      });
      return divisions;
    } catch (error: any) {
      logger.error(`Error getting root divisions for country ${countryId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get divisions by type
   */
  static async getDivisionsByType(type: string, countryId?: string): Promise<AdministrativeDivision[]> {
    try {
      const filters: AdministrativeDivisionFilters = {
        type,
        is_active: true,
        sort_by: 'name'
      };

      if (countryId) {
        filters.country_id = countryId;
      }

      const { divisions } = await AdministrativeDivisionModel.findAll(filters);
      return divisions;
    } catch (error: any) {
      logger.error(`Error getting divisions by type ${type}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate division data
   */
  static validateDivisionData(data: CreateAdministrativeDivisionRequest | UpdateAdministrativeDivisionRequest): void {
    const errors: string[] = [];

    // Validate required fields for creation
    if ('name' in data && (!data.name || data.name.trim().length === 0)) {
      errors.push('Division name is required');
    }

    if ('level' in data && (!data.level || data.level < 1 || data.level > 10)) {
      errors.push('Division level must be between 1 and 10');
    }

    if ('country_id' in data && (!data.country_id || data.country_id.trim().length === 0)) {
      errors.push('Country ID is required');
    }

    // Validate population if provided
    if (data.population !== undefined && data.population !== null && data.population < 0) {
      errors.push('Population must be a positive number');
    }

    // Validate area if provided
    if (data.area_km2 !== undefined && data.area_km2 !== null && data.area_km2 < 0) {
      errors.push('Area must be a positive number');
    }

    // Validate coordinates if provided
    if (data.coordinates) {
      if (typeof data.coordinates.latitude !== 'number' || 
          data.coordinates.latitude < -90 || data.coordinates.latitude > 90) {
        errors.push('Latitude must be between -90 and 90');
      }
      if (typeof data.coordinates.longitude !== 'number' || 
          data.coordinates.longitude < -180 || data.coordinates.longitude > 180) {
        errors.push('Longitude must be between -180 and 180');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  // Method aliases for backwards compatibility and test consistency
  static findById = this.getDivisionById;
  static findByFilters = this.getDivisions;
  static getHierarchy = this.getDivisionHierarchy;
  static getStatistics = this.getDivisionStats;
  static buildTree = this.getDivisionTree;

}
