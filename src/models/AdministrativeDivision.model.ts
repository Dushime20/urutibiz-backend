// =====================================================
// ADMINISTRATIVE DIVISION MODEL
// =====================================================

import { getDatabase } from '@/config/database';
import { 
  AdministrativeDivision, 
  CreateAdministrativeDivisionRequest, 
  UpdateAdministrativeDivisionRequest, 
  AdministrativeDivisionFilters, 
  AdministrativeDivisionStats,
  AdministrativeHierarchy,
  DivisionTreeNode
} from '@/types/administrativeDivision.types';
import { v4 as uuidv4 } from 'uuid';

export class AdministrativeDivisionModel {
  
  /**
   * Create a new administrative division
   */
  static async create(data: CreateAdministrativeDivisionRequest): Promise<AdministrativeDivision> {
    const db = getDatabase();
    
    // Clean and validate data before insertion
    const cleanData: any = { ...data };
    
    // Remove empty strings and convert to null for optional fields
    if (cleanData.parent_id === '') cleanData.parent_id = null;
    if (cleanData.code === '') cleanData.code = null;
    if (cleanData.local_name === '') cleanData.local_name = null;
    
    // Ensure required fields are not empty strings
    if (!cleanData.country_id || cleanData.country_id.trim() === '') {
      throw new Error('Country ID cannot be empty');
    }
    if (!cleanData.name || cleanData.name.trim() === '') {
      throw new Error('Division name cannot be empty');
    }
    
    const divisionData: any = {
      id: uuidv4(),
      ...cleanData,
      is_active: cleanData.is_active !== undefined ? cleanData.is_active : true,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Convert coordinates to PostGIS POINT if provided
    if (cleanData.coordinates) {
      divisionData.coordinates = db.raw(
        `ST_GeomFromText('POINT(${cleanData.coordinates.longitude} ${cleanData.coordinates.latitude})', 4326)`
      );
    }

    // Convert bounds to PostGIS POLYGON if provided
    if (cleanData.bounds) {
      const coordString = cleanData.bounds.coordinates[0]
        .map(coord => `${coord[0]} ${coord[1]}`)
        .join(', ');
      divisionData.bounds = db.raw(
        `ST_GeomFromText('POLYGON((${coordString}))', 4326)`
      );
    }

    const [division] = await db('administrative_divisions')
      .insert(divisionData)
      .returning('*');

    return this.transformDivision(division);
  }

  /**
   * Get administrative division by ID
   */
  static async findById(id: string, options: Partial<AdministrativeDivisionFilters> = {}): Promise<AdministrativeDivision | null> {
    const db = getDatabase();
    
    let query = db('administrative_divisions')
      .select('*')
      .select(
        db.raw('ST_AsText(coordinates) as coordinates_wkt'),
        db.raw('ST_AsText(bounds) as bounds_wkt')
      )
      .where('administrative_divisions.id', id);

    // Include related data if requested
    if (options.include_country) {
      query = query
        .leftJoin('countries', 'administrative_divisions.country_id', 'countries.id')
        .select(
          'countries.id as country_id',
          'countries.name as country_name',
          'countries.code as country_code'
        );
    }

    if (options.include_parent) {
      query = query
        .leftJoin('administrative_divisions as parent', 'administrative_divisions.parent_id', 'parent.id')
        .select(
          'parent.id as parent_id',
          'parent.name as parent_name',
          'parent.type as parent_type'
        );
    }

    const division = await query.first();
    if (!division) return null;

    const transformedDivision = this.transformDivision(division);

    // Include children if requested
    if (options.include_children) {
      const children = await this.findChildren(id);
      transformedDivision.children = children;
    }

    return transformedDivision;
  }

  /**
   * Get all administrative divisions with filters
   */
  static async findAll(filters: AdministrativeDivisionFilters = {}): Promise<{ divisions: AdministrativeDivision[]; total: number }> {
    const db = getDatabase();
    
    let query = db('administrative_divisions')
      .select('administrative_divisions.*')
      .select(
        db.raw('ST_AsText(coordinates) as coordinates_wkt'),
        db.raw('ST_AsText(bounds) as bounds_wkt')
      );

    // Apply filters
    if (filters.country_id) {
      query = query.where('administrative_divisions.country_id', filters.country_id);
    }

    if (filters.parent_id !== undefined) {
      if (filters.parent_id === null) {
        query = query.whereNull('administrative_divisions.parent_id');
      } else {
        query = query.where('administrative_divisions.parent_id', filters.parent_id);
      }
    }

    if (filters.level) {
      query = query.where('administrative_divisions.level', filters.level);
    }

    if (filters.type) {
      query = query.where('administrative_divisions.type', filters.type);
    }

    if (filters.is_active !== undefined) {
      query = query.where('administrative_divisions.is_active', filters.is_active);
    }

    if (filters.search) {
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      query = query.where(function() {
        this.whereRaw('LOWER(administrative_divisions.name) LIKE ?', [searchTerm])
            .orWhereRaw('LOWER(administrative_divisions.local_name) LIKE ?', [searchTerm])
            .orWhereRaw('LOWER(administrative_divisions.code) LIKE ?', [searchTerm]);
      });
    }

    if (filters.min_population) {
      query = query.where('administrative_divisions.population', '>=', filters.min_population);
    }

    if (filters.max_population) {
      query = query.where('administrative_divisions.population', '<=', filters.max_population);
    }

    if (filters.min_area) {
      query = query.where('administrative_divisions.area_km2', '>=', filters.min_area);
    }

    if (filters.max_area) {
      query = query.where('administrative_divisions.area_km2', '<=', filters.max_area);
    }

    if (filters.within_bounds) {
      const { latitude, longitude, radius_km } = filters.within_bounds;
      query = query.whereRaw(
        'ST_DWithin(coordinates, ST_GeomFromText(?, 4326), ?)',
        [`POINT(${longitude} ${latitude})`, radius_km * 1000] // Convert km to meters
      );
    }

    if (filters.has_children !== undefined) {
      if (filters.has_children) {
        query = query.whereExists(function() {
          this.select('*')
              .from('administrative_divisions as children')
              .whereRaw('children.parent_id = administrative_divisions.id');
        });
      } else {
        query = query.whereNotExists(function() {
          this.select('*')
              .from('administrative_divisions as children')
              .whereRaw('children.parent_id = administrative_divisions.id');
        });
      }
    }

    // Include related data if requested
    if (filters.include_country) {
      query = query
        .leftJoin('countries', 'administrative_divisions.country_id', 'countries.id')
        .select(
          'countries.id as country_id_rel',
          'countries.name as country_name',
          'countries.code as country_code'
        );
    }

    if (filters.include_parent) {
      query = query
        .leftJoin('administrative_divisions as parent', 'administrative_divisions.parent_id', 'parent.id')
        .select(
          'parent.id as parent_id_rel',
          'parent.name as parent_name',
          'parent.type as parent_type'
        );
    }

    // Get total count - use a separate simple query to avoid GROUP BY issues
    const countQuery = db('administrative_divisions');
    
    // Apply the same filters to count query (without joins and complex selects)
    if (filters.country_id) {
      countQuery.where('country_id', filters.country_id);
    }
    if (filters.parent_id !== undefined) {
      if (filters.parent_id === null) {
        countQuery.whereNull('parent_id');
      } else {
        countQuery.where('parent_id', filters.parent_id);
      }
    }
    if (filters.level) {
      countQuery.where('level', filters.level);
    }
    if (filters.type) {
      countQuery.where('type', filters.type);
    }
    if (filters.is_active !== undefined) {
      countQuery.where('is_active', filters.is_active);
    }
    if (filters.search) {
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      countQuery.where(function() {
        this.whereRaw('LOWER(name) LIKE ?', [searchTerm])
            .orWhereRaw('LOWER(local_name) LIKE ?', [searchTerm])
            .orWhereRaw('LOWER(code) LIKE ?', [searchTerm]);
      });
    }
    if (filters.min_population) {
      countQuery.where('population', '>=', filters.min_population);
    }
    if (filters.max_population) {
      countQuery.where('population', '<=', filters.max_population);
    }
    if (filters.min_area) {
      countQuery.where('area_km2', '>=', filters.min_area);
    }
    if (filters.max_area) {
      countQuery.where('area_km2', '<=', filters.max_area);
    }
    if (filters.within_bounds) {
      const { latitude, longitude, radius_km } = filters.within_bounds;
      countQuery.whereRaw(
        'ST_DWithin(coordinates, ST_GeomFromText(?, 4326), ?)',
        [`POINT(${longitude} ${latitude})`, radius_km * 1000]
      );
    }
    if (filters.has_children !== undefined) {
      if (filters.has_children) {
        countQuery.whereExists(function() {
          this.select('*')
              .from('administrative_divisions as children')
              .whereRaw('children.parent_id = administrative_divisions.id');
        });
      } else {
        countQuery.whereNotExists(function() {
          this.select('*')
              .from('administrative_divisions as children')
              .whereRaw('children.parent_id = administrative_divisions.id');
        });
      }
    }
    
    const [{ count }] = await countQuery.count('* as count');
    const total = parseInt(count as string);

    // Apply sorting
    const sortBy = filters.sort_by || 'name';
    const sortOrder = filters.sort_order || 'asc';
    query = query.orderBy(`administrative_divisions.${sortBy}`, sortOrder);

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    const divisions = await query;
    const transformedDivisions = divisions.map(division => this.transformDivision(division));

    return { divisions: transformedDivisions, total };
  }

  /**
   * Update administrative division by ID
   */
  static async update(id: string, data: UpdateAdministrativeDivisionRequest): Promise<AdministrativeDivision | null> {
    const db = getDatabase();
    
    const updateData: any = {
      ...data,
      updated_at: new Date()
    };

    // Convert coordinates to PostGIS POINT if provided
    if (data.coordinates) {
      updateData.coordinates = db.raw(
        `ST_GeomFromText('POINT(${data.coordinates.longitude} ${data.coordinates.latitude})', 4326)`
      );
    }

    // Convert bounds to PostGIS POLYGON if provided
    if (data.bounds) {
      const coordString = data.bounds.coordinates[0]
        .map(coord => `${coord[0]} ${coord[1]}`)
        .join(', ');
      updateData.bounds = db.raw(
        `ST_GeomFromText('POLYGON((${coordString}))', 4326)`
      );
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if ((updateData as any)[key] === undefined) {
        delete (updateData as any)[key];
      }
    });

    const [division] = await db('administrative_divisions')
      .where({ id })
      .update(updateData)
      .returning('*');

    return division ? this.transformDivision(division) : null;
  }

  /**
   * Delete administrative division by ID (soft delete)
   */
  static async delete(id: string): Promise<boolean> {
    const db = getDatabase();
    
    const [division] = await db('administrative_divisions')
      .where({ id })
      .update({ 
        is_active: false,
        updated_at: new Date()
      })
      .returning('*');

    return !!division;
  }

  /**
   * Hard delete administrative division by ID
   */
  static async hardDelete(id: string): Promise<boolean> {
    const db = getDatabase();
    
    const deletedCount = await db('administrative_divisions')
      .where({ id })
      .del();

    return deletedCount > 0;
  }

  /**
   * Get children of an administrative division
   */
  static async findChildren(parentId: string): Promise<AdministrativeDivision[]> {
    const { divisions } = await this.findAll({ 
      parent_id: parentId,
      is_active: true 
    });
    return divisions;
  }

  /**
   * Get hierarchy path from root to division
   */
  static async getHierarchy(id: string): Promise<AdministrativeHierarchy | null> {
    const division = await this.findById(id);
    if (!division) return null;

    const ancestors = await this.getAncestors(id);
    const descendants = await this.getDescendants(id);
    const siblings = await this.getSiblings(id);
    const path = [...ancestors, division];

    return {
      division,
      path,
      ancestors,
      descendants,
      siblings,
      depth: ancestors.length,
      total_children: descendants.length
    };
  }

  /**
   * Get all ancestors of a division
   */
  static async getAncestors(id: string): Promise<AdministrativeDivision[]> {
    const db = getDatabase();
    
    const ancestors = await db.raw(`
      WITH RECURSIVE division_ancestors AS (
        SELECT * FROM administrative_divisions WHERE id = ?
        UNION ALL
        SELECT ad.* FROM administrative_divisions ad
        INNER JOIN division_ancestors da ON ad.id = da.parent_id
      )
      SELECT * FROM division_ancestors WHERE id != ?
      ORDER BY level ASC
    `, [id, id]);

    return ancestors.rows.map((row: any) => this.transformDivision(row));
  }

  /**
   * Get all descendants of a division
   */
  static async getDescendants(id: string): Promise<AdministrativeDivision[]> {
    const db = getDatabase();
    
    const descendants = await db.raw(`
      WITH RECURSIVE division_descendants AS (
        SELECT * FROM administrative_divisions WHERE parent_id = ?
        UNION ALL
        SELECT ad.* FROM administrative_divisions ad
        INNER JOIN division_descendants dd ON ad.parent_id = dd.id
      )
      SELECT * FROM division_descendants
      ORDER BY level ASC, name ASC
    `, [id]);

    return descendants.rows.map((row: any) => this.transformDivision(row));
  }

  /**
   * Get siblings of a division
   */
  static async getSiblings(id: string): Promise<AdministrativeDivision[]> {
    const division = await this.findById(id);
    if (!division || !division.parent_id) return [];

    const { divisions } = await this.findAll({ 
      parent_id: division.parent_id,
      is_active: true 
    });
    
    return divisions.filter(d => d.id !== id);
  }

  /**
   * Get tree structure for a country or division
   */
  static async getTree(rootId?: string, countryId?: string): Promise<DivisionTreeNode[]> {
    let divisions;
    if (rootId) {
      divisions = await this.getDescendants(rootId);
      const root = await this.findById(rootId);
      if (root) divisions.unshift(root);
    } else if (countryId) {
      const { divisions: countryDivisions } = await this.findAll({ 
        country_id: countryId,
        is_active: true 
      });
      divisions = countryDivisions;
    } else {
      const { divisions: allDivisions } = await this.findAll({ is_active: true });
      divisions = allDivisions;
    }

    return this.buildTree(divisions);
  }

  /**
   * Get statistics for administrative divisions
   */
  static async getStats(countryId?: string): Promise<AdministrativeDivisionStats> {
    try {
      const db = getDatabase();
      
      // Create base conditions for filtering
      const baseConditions: any = {};
      if (countryId) {
        baseConditions.country_id = countryId;
      }

      // Total counts - create separate queries to avoid clone() issues
      const [totalResult] = await db('administrative_divisions')
        .where(baseConditions)
        .count('* as count');
      
      const [activeResult] = await db('administrative_divisions')
        .where({ ...baseConditions, is_active: true })
        .count('* as count');
      
      const [inactiveResult] = await db('administrative_divisions')
        .where({ ...baseConditions, is_active: false })
        .count('* as count');

      const total_divisions = parseInt(totalResult.count as string);
      const active_divisions = parseInt(activeResult.count as string);
      const inactive_divisions = parseInt(inactiveResult.count as string);

      // Divisions by level
      const levelStats = await db('administrative_divisions')
        .select('level')
        .count('* as count')
        .where({ ...baseConditions, is_active: true })
        .groupBy('level');

      const divisions_by_level: Record<number, number> = {};
      levelStats.forEach(stat => {
        divisions_by_level[Number(stat.level)] = parseInt(stat.count as string);
      });

      // Divisions by type
      const typeStats = await db('administrative_divisions')
        .select('type')
        .count('* as count')
        .where({ ...baseConditions, is_active: true })
        .whereNotNull('type')
        .groupBy('type');

      const divisions_by_type: Record<string, number> = {};
      typeStats.forEach(stat => {
        divisions_by_type[stat.type] = parseInt(stat.count as string);
    });

      // Divisions by country
      const countryStats = await db('administrative_divisions')
        .select('countries.name as country_name')
        .count('administrative_divisions.id as count')
        .leftJoin('countries', 'administrative_divisions.country_id', 'countries.id')
        .where('administrative_divisions.is_active', true)
        .groupBy('countries.name');

      const divisions_by_country: Record<string, number> = {};
      countryStats.forEach(stat => {
        divisions_by_country[stat.country_name] = parseInt(stat.count as string);
      });

      // Largest by area and population
      const largest_by_area = await db('administrative_divisions')
        .select('*')
        .where(baseConditions)
        .whereNotNull('area_km2')
        .where({ is_active: true })
        .orderBy('area_km2', 'desc')
        .limit(5);

      const largest_by_population = await db('administrative_divisions')
        .select('*')
        .where(baseConditions)
        .whereNotNull('population')
        .where({ is_active: true })
        .orderBy('population', 'desc')
        .limit(5);

      // Totals
      const [populationResult] = await db('administrative_divisions')
        .sum('population as total_population')
        .where(baseConditions)
        .whereNotNull('population')
        .where({ is_active: true });

      const [areaResult] = await db('administrative_divisions')
        .sum('area_km2 as total_area')
        .where(baseConditions)
        .whereNotNull('area_km2')
        .where({ is_active: true });

      const total_population = parseInt(populationResult.total_population as string) || 0;
      const total_area_km2 = parseFloat(areaResult.total_area as string) || 0;
      const average_area_per_division = active_divisions > 0 ? total_area_km2 / active_divisions : 0;

      return {
        total_divisions,
        active_divisions,
        inactive_divisions,
        divisions_by_level,
        divisions_by_type,
        divisions_by_country,
        largest_by_area: largest_by_area.map(d => this.transformDivision(d)),
        largest_by_population: largest_by_population.map(d => this.transformDivision(d)),
        total_population,
        total_area_km2,
        average_area_per_division
      };
    } catch (error: any) {
      console.error('Error in getStats:', error);
      throw new Error(`Failed to retrieve administrative division statistics: ${error.message}`);
    }
  }

  /**
   * Check if code exists within a country
   */
  static async codeExists(countryId: string, code: string, excludeId?: string): Promise<boolean> {
    const db = getDatabase();
    
    let query = db('administrative_divisions')
      .where({ country_id: countryId, code });
    
    if (excludeId) {
      query = query.whereNot({ id: excludeId });
    }

    const division = await query.first();
    return !!division;
  }

  /**
   * Toggle active status
   */
  static async toggleActive(id: string): Promise<AdministrativeDivision | null> {
    const division = await this.findById(id);
    if (!division) return null;

    return this.update(id, { is_active: !division.is_active });
  }

  /**
   * Find divisions within geographic bounds
   */
  static async findWithinBounds(bounds: { north: number; south: number; east: number; west: number }): Promise<AdministrativeDivision[]> {
    const db = getDatabase();
    
    const divisions = await db('administrative_divisions')
      .select('*')
      .select(
        db.raw('ST_AsText(coordinates) as coordinates_wkt'),
        db.raw('ST_AsText(bounds) as bounds_wkt')
      )
      .whereRaw(
        'coordinates && ST_MakeEnvelope(?, ?, ?, ?, 4326)',
        [bounds.west, bounds.south, bounds.east, bounds.north]
      )
      .where({ is_active: true });

    return divisions.map(division => this.transformDivision(division));
  }

  /**
   * Transform database result to AdministrativeDivision
   */
  private static transformDivision(row: any): AdministrativeDivision {
    const division: AdministrativeDivision = {
      id: row.id,
      country_id: row.country_id,
      parent_id: row.parent_id,
      level: row.level,
      code: row.code,
      name: row.name,
      local_name: row.local_name,
      type: row.type,
      population: row.population,
      area_km2: row.area_km2 ? parseFloat(row.area_km2) : null,
      coordinates: row.coordinates_wkt || null,
      bounds: row.bounds_wkt || null,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at
    };

    // Add related data if present
    if (row.country_name) {
      division.country = {
        id: row.country_id_rel || row.country_id,
        name: row.country_name,
        code: row.country_code
      };
    }

    if (row.parent_name) {
      division.parent = {
        id: row.parent_id_rel || row.parent_id,
        name: row.parent_name,
        type: row.parent_type
      };
    }

    return division;
  }

  /**
   * Build tree structure from flat array
   */
  private static buildTree(divisions: AdministrativeDivision[]): DivisionTreeNode[] {
    const map: Record<string, DivisionTreeNode> = {};
    const roots: DivisionTreeNode[] = [];

    // Create nodes
    divisions.forEach(division => {
      map[division.id] = {
        id: division.id,
        name: division.name,
        type: division.type || '',
        level: division.level,
        code: division.code || undefined,
        population: division.population || undefined,
        area_km2: division.area_km2 || undefined,
        is_active: division.is_active,
        children: [],
        parent_id: division.parent_id || undefined
      };
    });

    // Build tree
    Object.values(map).forEach(node => {
      if (node.parent_id && map[node.parent_id]) {
        map[node.parent_id].children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }
}
