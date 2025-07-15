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
  public ownerId: string;
  public title: string;
  public description: string;
  public categoryId: string;
  public status: ProductStatus;
  public condition: ProductCondition;
  public basePrice: number;
  public baseCurrency: string;
  public pickupMethods: PickupMethod[];
  public location: ProductLocation;
  public images: ProductImage[];
  public specifications?: Record<string, any>;
  public availability: ProductAvailability[];
  public viewCount: number;
  public rating?: number;
  public reviewCount: number;
  public aiScore?: number;
  public aiTags?: string[];
  public displayPrice?: number;
  public displayCurrency?: string;
  public recommendations?: any[];
  public createdAt: Date;
  public updatedAt: Date;

  // In-memory storage for demo
  private static products: Product[] = [];

  constructor(data: CreateProductData & { ownerId: string }) {
    this.id = data.id;
    this.ownerId = data.ownerId;
    this.title = data.title;
    this.description = data.description;
    this.categoryId = data.categoryId;
    this.status = 'draft';
    this.condition = data.condition;
    this.basePrice = data.basePrice;
    this.baseCurrency = data.baseCurrency;
    this.pickupMethods = data.pickupMethods;
    this.location = data.location;
    this.images = [];
    this.specifications = data.specifications;
    this.availability = [];
    this.viewCount = 0;
    this.reviewCount = 0;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // Static methods for CRUD operations
  static async create(data: CreateProductData & { ownerId: string }): Promise<Product> {
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

    if (filters.category) {
      filtered = filtered.filter(p => p.categoryId === filters.category);
    }

    if (filters.countryId) {
      filtered = filtered.filter(p => p.location.countryId === filters.countryId);
    }

    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(p => p.basePrice >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(p => p.basePrice <= filters.maxPrice!);
    }

    if (filters.currency) {
      filtered = filtered.filter(p => p.baseCurrency === filters.currency);
    }

    if (filters.condition) {
      filtered = filtered.filter(p => p.condition === filters.condition);
    }

    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    if (filters.ownerId) {
      filtered = filtered.filter(p => p.ownerId === filters.ownerId);
    }

    if (filters.location) {
      // Simple radius filter (not geospatially accurate)
      filtered = filtered.filter(p => {
        const dx = p.location.latitude - filters.location!.lat;
        const dy = p.location.longitude - filters.location!.lng;
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
    Object.assign(this, data);
    this.updatedAt = new Date();
    return this;
  }

  toJSON(): ProductData {
    return {
      id: this.id,
      ownerId: this.ownerId,
      title: this.title,
      description: this.description,
      categoryId: this.categoryId,
      status: this.status,
      condition: this.condition,
      basePrice: this.basePrice,
      baseCurrency: this.baseCurrency,
      pickupMethods: this.pickupMethods,
      location: this.location,
      images: this.images,
      specifications: this.specifications,
      availability: this.availability,
      viewCount: this.viewCount,
      rating: this.rating,
      reviewCount: this.reviewCount,
      aiScore: this.aiScore,
      aiTags: this.aiTags,
      displayPrice: this.displayPrice,
      displayCurrency: this.displayCurrency,
      recommendations: this.recommendations,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Demo data seeding
  static async seed(): Promise<void> {
    if (Product.products.length > 0) return;

    const demoProducts: CreateProductData[] = [
      {
        title: 'Luxury Beach Villa in Miami',
        description: 'Beautiful oceanfront villa with 4 bedrooms, private pool, and stunning views',
        categoryId: 'accommodation',
        basePrice: 299.99,
        baseCurrency: 'USD',
        condition: 'like_new',
        location: {
          latitude: 25.7617,
          longitude: -80.1918,
          address: '123 Ocean Drive',
          city: 'Miami',
          countryId: 'US'
        },
        pickupMethods: ['pickup', 'delivery'],
        // tags: ['luxury', 'beachfront', 'pool', 'family-friendly']
      },
      {
        title: 'Sports Car Rental - Ferrari 488',
        description: 'Experience the thrill of driving a Ferrari 488 GTB',
        categoryId: 'transportation',
        basePrice: 899.99,
        baseCurrency: 'USD',
        condition: 'new',
        location: {
          latitude: 34.0522,
          longitude: -118.2437,
          address: '456 Sunset Blvd',
          city: 'Los Angeles',
          countryId: 'US'
        },
        pickupMethods: ['pickup'],
        // tags: ['luxury', 'sports-car', 'weekend', 'exotic']
      },
      {
        title: 'Cooking Class with Professional Chef',
        description: 'Learn to cook authentic Italian cuisine from a Michelin-starred chef',
        categoryId: 'experience',
        basePrice: 150.00,
        baseCurrency: 'USD',
        condition: 'new',
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: '789 Culinary Ave',
          city: 'New York',
          countryId: 'US'
        },
        pickupMethods: ['pickup'],
        // tags: ['cooking', 'education', 'italian', 'professional']
      }
    ];

    for (const productData of demoProducts) {
      await Product.create({ ...productData, ownerId: 'demo-user-1' });
    }
  }
}

export default Product;
