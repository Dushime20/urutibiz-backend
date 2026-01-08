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
// import { v4 as uuidv4 } from 'uuid'; // Unused import

// Demo Product Model - In-memory implementation
export class Product implements ProductData {
  public id: string;
  public owner_id: string;
  public title: string;
  public description: string;
  public category_id: string;
  public status: ProductStatus;
  public condition: ProductCondition;

  public pickup_methods: PickupMethod[];
  public location: ProductLocation;
  public images: ProductImage[];
  public specifications?: Record<string, any>;
  public availability: ProductAvailability[];
  public brand?: string;
  public model?: string;
  public year_manufactured?: number;
  public address_line?: string;
  public delivery_fee?: number;
  public included_accessories?: string[];
  public slug?: string;
  public country_id?: string;
  public view_count: number;
  public rating?: number;
  public review_count: number;
  public average_rating?: number;
  public ai_score?: number;
  public ai_tags?: string[];
  public display_price?: number;
  public display_currency?: string;
  public recommendations?: any[];
  public features?: string[];

  public created_at: Date;
  public updated_at: Date;
  public createdAt: Date; // For BaseModel compatibility
  public updatedAt: Date; // For BaseModel compatibility

  // In-memory storage for demo
  private static products: Product[] = [];

  constructor(data: CreateProductData & { owner_id: string }) {
    this.id = data.id;
    this.owner_id = data.owner_id;
    this.title = data.title;
    this.description = data.description;
    this.category_id = data.category_id;
    this.slug = (data as any).slug;
    this.brand = (data as any).brand;
    this.model = (data as any).model;
    this.year_manufactured = (data as any).year_manufactured as any;
    this.address_line = (data as any).address_line as any;
    this.delivery_fee = (data as any).delivery_fee as any;
    this.included_accessories = (data as any).included_accessories as any;
    this.country_id = (data as any).country_id as any;
    this.status = (data as any).status !== undefined ? (data as any).status : 'draft';
    this.condition = data.condition;

    this.pickup_methods = data.pickup_methods;
    this.location = data.location;
    this.images = [];
    this.specifications = data.specifications;
    this.availability = [];
    this.view_count = (data as any).view_count || 0;
    this.review_count = (data as any).review_count || 0;
    this.average_rating = (data as any).average_rating || 0;
    this.features = data.features || [];
    this.created_at = new Date();
    this.updated_at = new Date();
    this.createdAt = this.created_at; // For BaseModel compatibility
    this.updatedAt = this.updated_at; // For BaseModel compatibility
  }

  // Static methods for CRUD operations
  static fromDb(row: any): ProductData {
    // Normalize fields from DB row to API shape
    let pickup_methods: any = row.pickup_methods;
    if (typeof pickup_methods === 'string') {
      try { pickup_methods = JSON.parse(pickup_methods); } catch { /* keep as is */ }
    }
    let specifications: any = row.specifications;
    if (typeof specifications === 'string') {
      try { specifications = JSON.parse(specifications); } catch { /* keep as is */ }
    }
    // Parse images if they come as JSON string from aggregation
    let images: any = row.images || [];
    if (typeof images === 'string') {
      try { images = JSON.parse(images); } catch { images = []; }
    }
    const created_at = row.created_at instanceof Date ? row.created_at : new Date(row.created_at);
    const updated_at = row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at);
    return {
      id: row.id,
      owner_id: row.owner_id,
      title: row.title,
      description: row.description,
      category_id: row.category_id,
      status: row.status,
      condition: row.condition,
      pickup_methods,
      location: row.location,
      images: images,
      specifications,
      availability: [],
      view_count: row.view_count || 0,
      review_count: row.review_count || 0,
      average_rating: row.average_rating || 0,
      features: row.features,
      created_at,
      updated_at,
      createdAt: created_at, // For BaseModel compatibility
      updatedAt: updated_at, // For BaseModel compatibility
      // Newly exposed fields
      brand: row.brand,
      model: row.model,
      year_manufactured: row.year_manufactured,
      address_line: row.address_line,
      district: row.district,
      sector: row.sector,
      delivery_fee: row.delivery_fee,
      included_accessories: row.included_accessories,
      // optional extras
      ai_score: row.ai_score,
      ai_tags: row.ai_tags,
      display_price: row.display_price || row.base_price_per_day,
      display_currency: row.display_currency || row.currency,
      recommendations: row.recommendations,
      // ids
      country_id: row.country_id,
      slug: row.slug
    } as any;
  }
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
    filters: Partial<ProductFilters> = {}
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

    // Price filtering is now handled by the product_prices table
    // These filters are deprecated and should be removed from ProductFilters

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
    Object.assign(this, data);
    this.updated_at = new Date();
    this.updatedAt = this.updated_at; // For BaseModel compatibility
    return this;
  }

  toJSON(): ProductData {
    const result: any = {
      id: this.id,
      owner_id: this.owner_id,
      title: this.title,
      description: this.description,
      category_id: this.category_id,
      address_line: this.address_line,
      delivery_fee: this.delivery_fee,
      included_accessories: this.included_accessories,
      country_id: this.country_id,
      slug: this.slug,
      status: this.status,
      condition: this.condition,
      pickup_methods: this.pickup_methods,
      location: this.location,
      images: this.images,
      specifications: this.specifications,
      availability: this.availability,
      view_count: this.view_count,
      rating: this.rating,
      review_count: this.review_count,
      average_rating: this.average_rating,
      ai_score: this.ai_score,
      ai_tags: this.ai_tags,
      display_price: this.display_price,
      display_currency: this.display_currency,
      recommendations: this.recommendations,
      features: this.features,
      created_at: this.created_at,
      updated_at: this.updated_at,
      createdAt: this.createdAt, // For BaseModel compatibility
      updatedAt: this.updatedAt // For BaseModel compatibility
    };
    return result as ProductData;
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
