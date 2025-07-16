import { ProductImageData, CreateProductImageData } from '@/types/productImage.types';

export class ProductImage implements ProductImageData {
  id: string;
  product_id: string;
  image_url: string;
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
    this.thumbnail_url = data.thumbnail_url;
    this.alt_text = data.alt_text;
    this.sort_order = data.sort_order;
    this.is_primary = data.is_primary;
    this.ai_analysis = data.ai_analysis;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }
}

export default ProductImage;
