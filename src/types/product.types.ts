// =====================================================
// PRODUCT TYPES (snake_case)
// =====================================================

export type ProductStatus = 'draft' | 'active' | 'inactive' | 'suspended' | 'deleted';
export type ProductCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';
export type PickupMethod = 'pickup' | 'delivery' | 'both' | 'meet_public' | 'visit';

// Enhanced delivery method types
export type DeliveryMethod = 'pickup' | 'delivery' | 'meet_public' | 'visit';
export type DeliveryTimeWindow = 'morning' | 'afternoon' | 'evening' | 'flexible';
export type DeliveryStatus = 'scheduled' | 'confirmed' | 'out_for_delivery' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';

export interface ProductLocation {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country_id: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductAvailability {
  date: string;
  is_available: boolean;
  custom_price?: number;
}

export interface ProductData {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  category_id: string;
  status: ProductStatus;
  condition: ProductCondition;
  pickup_methods: any[];
  location: ProductLocation;
  images: ProductImage[];
  specifications?: Record<string, any>;
  availability: ProductAvailability[];
  view_count: number;
  rating?: number;
  review_count: number;
  average_rating?: number;
  ai_score?: number;
  ai_tags?: string[];
  display_price?: number;
  display_currency?: string;
  recommendations?: any[];
  created_at: Date;
  updated_at: Date;
  createdAt: Date; // For BaseModel compatibility
  updatedAt: Date; // For BaseModel compatibility
  features?: string[];
}

export interface CreateProductData {
  id: string;
  title: string;
  slug: string;
  description: string;
  category_id: string;
  condition: ProductCondition;
  pickup_methods: any[];
  country_id: string;
  location: ProductLocation;
  specifications?: Record<string, any>;
  features?: string[];
}

export interface UpdateProductData {
  title?: string;
  description?: string;
  condition?: ProductCondition;
  pickup_methods?: any[];
  location?: Partial<ProductLocation>;
  specifications?: Record<string, any>;
  status?: ProductStatus;
  features?: string[];
}

export interface ProductFilters {
  currency: any;
  min_price: number;
  max_price: number;
  search?: string;
  category_id?: string;
  country_id?: string;
  condition?: ProductCondition;
  status?: ProductStatus;
  owner_id?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
}

export interface ProductPricing {
  base_price: number;
  total_days: number;
  subtotal: number;
  platform_fee: number;
  insurance_fee: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
}

// Legacy types for backward compatibility (updated to snake_case)
export type ProductCategory = 'accommodation' | 'transportation' | 'experience' | 'service' | 'other';

export interface ProductSearchParams {
  category_id?: ProductCategory;
  status?: ProductStatus;
  price_min?: number;
  price_max?: number;
  location?: string;
  page?: number;
  limit?: number;
}

export interface Product {
  id: string;
  owner_id: string;
  category_id: string;
  title: string;
  slug: string;
  description: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  year_manufactured?: number;
  condition: ProductCondition;
  location?: { latitude: number; longitude: number } | any;
  address_line?: string;
  district?: string;
  sector?: string;
  pickup_available?: boolean;
  delivery_available?: boolean;
  delivery_radius_km?: number;
  delivery_fee?: number;
  specifications?: Record<string, any>;
  features?: string[];
  included_accessories?: string[];
  status: ProductStatus;
  is_featured?: boolean;
  view_count?: number;
  tags?: string[];
  search_vector?: string;
  ai_category_confidence?: number;
  quality_score?: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  last_booked_at?: string;
}
