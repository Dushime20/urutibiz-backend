import { ProductImageData } from '@/types/productImage.types';

export class ProductImage implements ProductImageData {
  id: string;
  product_id: string;
  image_url: string;
  thumbnailUrl?: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
  aiAnalysis?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  
  // Snake_case properties for database compatibility
  thumbnail_url?: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
  ai_analysis?: Record<string, any>;
  created_at: Date;
  updated_at: Date;

  constructor(data: ProductImageData) {
    this.id = data.id;
    this.product_id = data.product_id;
    this.image_url = data.image_url;
    this.thumbnailUrl = data.thumbnailUrl;
    this.altText = data.altText;
    this.sortOrder = data.sortOrder;
    this.isPrimary = data.isPrimary;
    this.aiAnalysis = data.aiAnalysis;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    
    // Also set snake_case for database compatibility
    this.thumbnail_url = data.thumbnailUrl;
    this.alt_text = data.altText;
    this.sort_order = data.sortOrder;
    this.is_primary = data.isPrimary;
    this.ai_analysis = data.aiAnalysis;
    this.created_at = data.createdAt;
    this.updated_at = data.updatedAt;
  }
}

export default ProductImage;
