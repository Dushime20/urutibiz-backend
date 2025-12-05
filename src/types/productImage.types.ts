// =====================================================
// PRODUCT IMAGE TYPES
// =====================================================

export interface ProductImageData {
  id: string;
  product_id: string;
  image_url: string;
  thumbnailUrl?: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
  aiAnalysis?: Record<string, any>;
  image_embedding?: number[]; // Vector embedding for similarity search
  createdAt: Date;
  updatedAt: Date; // <-- Change this to Date for BaseModel compatibility
}

export interface CreateProductImageData {
  product_id: string;
  image_url: string;
  thumbnailUrl?: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
  aiAnalysis?: Record<string, any>;
  image_embedding?: number[]; // Vector embedding for similarity search
}

export interface UpdateProductImageData {
  image_url?: string;
  thumbnailUrl?: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
  aiAnalysis?: Record<string, any>;
  image_embedding?: number[]; // Vector embedding for similarity search
}
