// =====================================================
// PRODUCT MODEL
// =====================================================

import { 
  ProductData, 
  CreateProductData, 
  UpdateProductData,
  ProductFilters,
  ProductStatus,
  ProductCondition,
  ProductLocation,
  ProductImage,
  PickupMethod,
  ProductAvailability
} from '@/types/product.types';
import { v4 as uuidv4 } from 'uuid';

// Demo Product Model - In-memory implementation
export class Product implements ProductData {
  public id: string;
  public owner_id: string;
  public title: string;
  public description: string;
  public category_id: string;
  public status: ProductStatus;
  public condition: ProductCondition;
  public base_price: number;
  public base_currency: string;
  public pickup_methods: PickupMethod[];
  public location: ProductLocation;
  public images: ProductImage[];
  public specifications?: Record<string, any>;
  public availability: ProductAvailability[];
  public view_count: number;
  public rating?: number;
  public review_count: number;
  public ai_score?: number;
  public ai_tags?: string[];
  public display_price?: number;
  public display_currency?: string;
  public recommendations?: any[];
  public features?: string[];
  public base_price_per_week?: number;
  public base_price_per_month?: number;
  public created_at: Date;
  public updated_at: Date;

  // In-memory storage for demo
  private static products: Product[] = [];

  constructor(data: CreateProductData & { owner_id: string }) {
    this.id = data.id;
    this.owner_id = data.owner_id;
    this.title = data.title;
    this.description = data.description;
    this.category_id = data.category_id;
    this.status = (data as any).status !== undefined ? (data as any).status : 'draft';
    this.condition = data.condition;
    this.base_price = data.base_price_per_day;
    this.base_currency = data.base_currency;
    this.pickup_methods = data.pickup_methods;
    this.location = data.location;
    this.images = [];
    this.specifications = data.specifications;
    this.availability = [];
    this.view_count = 0;
    this.review_count = 0;
    this.features = data.features || [];
    this.base_price_per_week = data.base_price_per_week;
    this.base_price_per_month = data.base_price_per_month;
    this.created_at = new Date();
    this.updated_at = new Date();
  }

  // Static methods for CRUD operations
  static async create(data: CreateProductData & { owner_id: string }): Promise<Product> {
    const product = new Product(data);
    Product.products.push(product);
    return product;
  }

  static async findById(id: string): Promise<Product | null> {
    return Product.products.find(p => p.id === id) || null;
  }

  static async findAll(): Promise<Product[]> {
    return Product.products;
  }

  static async getPaginated(
    page: number = 1, 
    limit: number = 10, 
    filters: ProductFilters = {}
  ): Promise<{
    data: Product[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    let filtered = Product.products;

    // Apply filters
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.category_id) {
      filtered = filtered.filter(p => p.category_id === filters.category_id);
    }

    if (filters.country_id) {
      filtered = filtered.filter(p => p.location.country_id === filters.country_id);
    }

    if (filters.min_price !== undefined) {
      filtered = filtered.filter(p => p.base_price >= filters.min_price!);
    }

    if (filters.max_price !== undefined) {
      filtered = filtered.filter(p => p.base_price <= filters.max_price!);
    }

    if (filters.currency) {
      filtered = filtered.filter(p => p.base_currency === filters.currency);
    }

    if (filters.condition) {
      filtered = filtered.filter(p => p.condition === filters.condition);
    }

    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    if (filters.owner_id) {
      filtered = filtered.filter(p => p.owner_id === filters.owner_id);
    }

    if (filters.location) {
      // Simple radius filter (not geospatially accurate)
      filtered = filtered.filter(p => {
        const dx = p.location.latitude - filters.location!.latitude;
        const dy = p.location.longitude - filters.location!.longitude;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= filters.location!.radius;
      });
    }

    // Calculate pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const data = filtered.slice(start, end);

    return {
      data,
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  // Instance methods
  async update(data: UpdateProductData): Promise<Product> {
    if (data.features && Array.isArray(data.features)) {
      // Append new features, avoid duplicates
      this.features = Array.from(new Set([...(this.features || []), ...data.features]));
    }
    if (data.base_price_per_week !== undefined) {
      this.base_price_per_week = data.base_price_per_week;
    }
    if (data.base_price_per_month !== undefined) {
      this.base_price_per_month = data.base_price_per_month;
    }
    Object.assign(this, data);
    this.updated_at = new Date();
    return this;
  }

  toJSON(): ProductData {
    return {
      id: this.id,
      owner_id: this.owner_id,
      title: this.title,
      description: this.description,
      category_id: this.category_id,
      status: this.status,
      condition: this.condition,
      base_price: this.base_price,
      base_currency: this.base_currency,
      pickup_methods: this.pickup_methods,
      location: this.location,
      images: this.images,
      specifications: this.specifications,
      availability: this.availability,
      view_count: this.view_count,
      rating: this.rating,
      review_count: this.review_count,
      ai_score: this.ai_score,
      ai_tags: this.ai_tags,
      display_price: this.display_price,
      display_currency: this.display_currency,
      recommendations: this.recommendations,
      features: this.features,
      base_price_per_week: this.base_price_per_week,
      base_price_per_month: this.base_price_per_month,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Demo data seeding
  static async seed(): Promise<void> {
    if (Product.products.length > 0) return;

    const demoProducts: CreateProductData[] = [
      {
        id: 'demo-product-1',
        title: 'Luxury Beach Villa in Miami',
        slug: 'luxury-beach-villa-miami',
        description: 'Beautiful oceanfront villa with 4 bedrooms, private pool, and stunning views',
        category_id: 'accommodation',
        condition: 'like_new',
        base_price_per_day: 299.99,
        base_currency: 'USD',
        pickup_methods: ['pickup', 'delivery'],
        country_id: 'US',
        specifications: { bedrooms: 4, bathrooms: 3, pool: true },
        location: {
          latitude: 25.7617,
          longitude: -80.1918,
          address: '123 Ocean Drive',
          city: 'Miami',
          country_id: 'US'
        }
      },
      {
        id: 'demo-product-2',
        title: 'Sports Car Rental - Ferrari 488',
        slug: 'sports-car-rental-ferrari-488',
        description: 'Experience the thrill of driving a Ferrari 488 GTB',
        category_id: 'transportation',
        condition: 'new',
        base_price_per_day: 899.99,
        base_currency: 'USD',
        pickup_methods: ['pickup'],
        country_id: 'US',
        specifications: { seats: 2, color: 'red', transmission: 'automatic' },
        location: {
          latitude: 34.0522,
          longitude: -118.2437,
          address: '456 Sunset Blvd',
          city: 'Los Angeles',
          country_id: 'US'
        }
      },
      {
        id: 'demo-product-3',
        title: 'Cooking Class with Professional Chef',
        slug: 'cooking-class-professional-chef',
        description: 'Learn to cook authentic Italian cuisine from a Michelin-starred chef',
        category_id: 'experience',
        condition: 'new',
        base_price_per_day: 150.00,
        base_currency: 'USD',
        pickup_methods: ['pickup'],
        country_id: 'US',
        specifications: { cuisine: 'Italian', chef: 'Michelin-starred' },
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: '789 Culinary Ave',
          city: 'New York',
          country_id: 'US'
        }
      }
    ];

    for (const productData of demoProducts) {
      await Product.create({ ...productData, owner_id: 'demo-user-1' });
    }
  }
}

export default Product;
