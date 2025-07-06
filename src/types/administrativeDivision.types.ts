// =====================================================
// ADMINISTRATIVE DIVISION TYPES
// =====================================================

export interface AdministrativeDivision {
  id: string;
  country_id: string;
  parent_id?: string | null;
  level: number; // 1=Province/State, 2=District/County, 3=Sector/Sub-county, etc.
  code?: string | null; // Official government code
  name: string;
  local_name?: string | null; // Name in local language
  type?: string | null; // 'province', 'state', 'district', 'county', 'sector', 'ward', etc.
  population?: number | null;
  area_km2?: number | null;
  coordinates?: string | null; // Stored as WKT (Well-Known Text) format
  bounds?: string | null; // Administrative boundary as WKT
  is_active: boolean;
  created_at: Date;
  updated_at?: Date;
  
  // Related data (populated via joins)
  country?: {
    id: string;
    name: string;
    code: string;
  };
  parent?: {
    id: string;
    name: string;
    type: string;
  };
  children?: AdministrativeDivision[];
}

export interface CreateAdministrativeDivisionRequest {
  country_id: string;
  parent_id?: string | null;
  level: number;
  code?: string;
  name: string;
  local_name?: string;
  type?: string;
  population?: number;
  area_km2?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  bounds?: {
    type: 'Polygon';
    coordinates: number[][][]; // GeoJSON polygon format
  };
  is_active?: boolean;
}

export interface UpdateAdministrativeDivisionRequest {
  parent_id?: string | null;
  level?: number;
  code?: string;
  name?: string;
  local_name?: string;
  type?: string;
  population?: number;
  area_km2?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  bounds?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  is_active?: boolean;
}

export interface AdministrativeDivisionFilters {
  country_id?: string;
  parent_id?: string | null;
  level?: number;
  type?: string;
  is_active?: boolean;
  search?: string; // Search in name, local_name, code
  has_children?: boolean; // Filter divisions that have/don't have children
  min_population?: number;
  max_population?: number;
  min_area?: number;
  max_area?: number;
  within_bounds?: {
    latitude: number;
    longitude: number;
    radius_km: number;
  };
  limit?: number;
  offset?: number;
  sort_by?: 'name' | 'code' | 'level' | 'population' | 'area_km2' | 'created_at';
  sort_order?: 'asc' | 'desc';
  include_country?: boolean;
  include_parent?: boolean;
  include_children?: boolean;
}

export interface AdministrativeDivisionStats {
  total_divisions: number;
  active_divisions: number;
  inactive_divisions: number;
  divisions_by_level: Record<number, number>;
  divisions_by_type: Record<string, number>;
  divisions_by_country: Record<string, number>;
  largest_by_area: AdministrativeDivision[];
  largest_by_population: AdministrativeDivision[];
  total_population: number;
  total_area_km2: number;
  average_area_per_division: number;
}

export interface AdministrativeHierarchy {
  division: AdministrativeDivision;
  path: AdministrativeDivision[]; // From root to current division
  ancestors: AdministrativeDivision[];
  descendants: AdministrativeDivision[];
  siblings: AdministrativeDivision[];
  depth: number;
  total_children: number;
}

export interface AdministrativeDivisionResponse {
  success: boolean;
  message: string;
  data?: AdministrativeDivision | AdministrativeDivision[] | AdministrativeDivisionStats | AdministrativeHierarchy;
  meta?: {
    total: number;
    limit: number;
    offset: number;
    page: number;
    pages: number;
  };
}

// Common administrative division types by country
export const DIVISION_TYPES = {
  // Rwanda
  RWANDA: {
    CITY: 'city',
    PROVINCE: 'province',
    DISTRICT: 'district',
    SECTOR: 'sector',
    CELL: 'cell',
    VILLAGE: 'village'
  },
  // Kenya
  KENYA: {
    COUNTY: 'county',
    SUB_COUNTY: 'sub_county',
    WARD: 'ward',
    LOCATION: 'location',
    SUB_LOCATION: 'sub_location'
  },
  // Uganda
  UGANDA: {
    REGION: 'region',
    DISTRICT: 'district',
    COUNTY: 'county',
    SUB_COUNTY: 'sub_county',
    PARISH: 'parish',
    VILLAGE: 'village'
  },
  // United States
  USA: {
    STATE: 'state',
    COUNTY: 'county',
    CITY: 'city',
    TOWNSHIP: 'township',
    BOROUGH: 'borough',
    VILLAGE: 'village'
  }
} as const;

// Administrative levels by country
export const DIVISION_LEVELS = {
  RWANDA: {
    PROVINCE_CITY: 1,
    DISTRICT: 2,
    SECTOR: 3,
    CELL: 4,
    VILLAGE: 5
  },
  KENYA: {
    COUNTY: 1,
    SUB_COUNTY: 2,
    WARD: 3,
    LOCATION: 4,
    SUB_LOCATION: 5
  },
  UGANDA: {
    REGION: 1,
    DISTRICT: 2,
    COUNTY: 3,
    SUB_COUNTY: 4,
    PARISH: 5,
    VILLAGE: 6
  },
  USA: {
    STATE: 1,
    COUNTY: 2,
    CITY: 3,
    TOWNSHIP: 4,
    BOROUGH: 4,
    VILLAGE: 5
  }
} as const;

// Geometry helper types
export interface Point {
  latitude: number;
  longitude: number;
}

export interface Polygon {
  type: 'Polygon';
  coordinates: number[][][]; // GeoJSON format
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Address components that can be resolved from administrative divisions
export interface AddressComponents {
  country: string;
  country_code: string;
  administrative_area_level_1?: string; // Province/State
  administrative_area_level_2?: string; // District/County
  administrative_area_level_3?: string; // Sector/Sub-county
  administrative_area_level_4?: string; // Cell/Ward
  administrative_area_level_5?: string; // Village
  locality?: string; // City/Town
  postal_code?: string;
  formatted_address: string;
}

// Tree structure for hierarchical operations
export interface DivisionTreeNode {
  id: string;
  name: string;
  type: string;
  level: number;
  code?: string;
  population?: number;
  area_km2?: number;
  is_active: boolean;
  children: DivisionTreeNode[];
  parent_id?: string;
}
