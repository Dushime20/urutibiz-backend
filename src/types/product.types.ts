// =====================================================
// PRODUCT TYPES
// =====================================================

export type ProductStatus = 'draft' | 'active' | 'inactive' | 'suspended' | 'deleted';
export type ProductCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';
export type PickupMethod = 'pickup' | 'delivery' | 'both';

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
  altText?: string;
  isPrimary: boolean;
  order: number;
}

export interface ProductAvailability {
  date: string;
  isAvailable: boolean;
  customPrice?: number;
}

export interface ProductData {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  categoryId: string;
  status: ProductStatus;
  condition: ProductCondition;
  basePrice: number;
  baseCurrency: string;
  pickupMethods: any[];
  location: ProductLocation;
  images: ProductImage[];
  specifications?: Record<string, any>;
  availability: ProductAvailability[];
  viewCount: number;
  rating?: number;
  reviewCount: number;
  aiScore?: number;
  aiTags?: string[];
  displayPrice?: number;
  displayCurrency?: string;
  recommendations?: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductData {
  id:string
  title: string;
  slug: string;
  description: string;
  category_id: string;
  condition: ProductCondition;
  base_price_per_day: number;
  base_currency: string;
  pickup_methods: any[];
  country_id: string;
  specifications?: Record<string, any>;
}

export interface UpdateProductData {
  title?: string;
  description?: string;
  condition?: ProductCondition;
  basePrice?: number;
  pickupMethods?: any[];
  location?: Partial<ProductLocation>;
  specifications?: Record<string, any>;
  status?: ProductStatus;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  countryId?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  condition?: ProductCondition;
  status?: ProductStatus;
  ownerId?: string;
  location?: {
    lat: number;
    lng: number;
    radius: number;
  };
}

export interface ProductPricing {
  basePrice: number;
  totalDays: number;
  subtotal: number;
  platformFee: number;
  insuranceFee: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
}

// Legacy types for backward compatibility
export type ProductCategory = 'accommodation' | 'transportation' | 'experience' | 'service' | 'other';

export interface ProductSearchParams {
  category?: ProductCategory;
  status?: ProductStatus;
  priceMin?: number;
  priceMax?: number;
  location?: string;
  page?: number;
  limit?: number;
}

export interface Product {
  id: string;
  ownerId: string;
  categoryId: string;
  title: string;
  slug: string;
  description: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  yearManufactured?: number;
  condition: ProductCondition;
  basePricePerDay: number;
  basePricePerWeek?: number;
  basePricePerMonth?: number;
  securityDeposit?: number;
  currency: string;
  location?: { latitude: number; longitude: number } | any;
  addressLine?: string;
  district?: string;
  sector?: string;
  pickupAvailable?: boolean;
  deliveryAvailable?: boolean;
  deliveryRadiusKm?: number;
  deliveryFee?: number;
  specifications?: Record<string, any>;
  features?: string[];
  includedAccessories?: string[];
  status: ProductStatus;
  isFeatured?: boolean;
  viewCount?: number;
  tags?: string[];
  searchVector?: string;
  aiCategoryConfidence?: number;
  qualityScore?: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  lastBookedAt?: string;
}
