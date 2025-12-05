import ProductImageRepository from '@/repositories/ProductImageRepository';
import { ProductImageData, CreateProductImageData, UpdateProductImageData } from '@/types/productImage.types';
import { ValidationError } from '@/types';
import { runOnnxModel } from '@/utils/onnxRunner';
import * as ort from 'onnxruntime-node';
import imageSimilarityService from './imageSimilarity.service';
import axios from 'axios';
import crypto from 'crypto';

class ProductImageService {
  async create(data: CreateProductImageData) {
    // Basic validation
    const errors: ValidationError[] = [];
    if (!data.product_id) errors.push({ field: 'productId', message: 'Product ID is required' });
    if (!data.image_url) errors.push({ field: 'imageUrl', message: 'Image URL is required' });
    if (errors.length > 0) return { success: false, error: errors.map(e => e.message).join(', ') };

    // Calculate image hash from actual content (Alibaba.com approach)
    let imageHash: string | null = null;
    let imageEmbedding: number[] | null = null;
    
    try {
      // Download image to calculate hash from actual content
      const response = await axios.get(data.image_url, {
        responseType: 'arraybuffer',
        timeout: 8000,
        maxContentLength: 10 * 1024 * 1024
      });
      const imageBuffer = Buffer.from(response.data);
      
      // Calculate SHA-256 hash from actual image content (not URL)
      imageHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
      console.log(`✅ Calculated image hash: ${imageHash.substring(0, 16)}...`);
      
      // Generate image embedding for similarity search
      imageEmbedding = await imageSimilarityService.extractFeaturesFromBuffer(imageBuffer);
      console.log(`✅ Generated image embedding (${imageEmbedding.length} dimensions)`);
    } catch (err) {
      console.warn('Failed to process image (hash/embedding):', err);
      // Continue without hash/embedding - can be generated later
    }

    // AI scoring for product image (optional, if model available)
    let aiAnalysis = undefined;
    try {
      // Download image and preprocess to tensor (implement as needed)
      // const imageTensor = preprocessImageToTensor(await downloadImageBuffer(data.imageUrl));
      // For demo, use dummy tensor
      // Use ort.Tensor for ONNX input
      const imageTensor = new ort.Tensor('float32', new Float32Array(224 * 224 * 3), [1, 224, 224, 3]); // Example shape
      const result = await runOnnxModel({
        modelPath: 'models/product_image_quality.onnx',
        feeds: { image: imageTensor }
      });
      aiAnalysis = result;
    } catch (err) {
      aiAnalysis = { error: 'AI analysis failed' };
    }
    
    return ProductImageRepository.create({ 
      ...data, 
      aiAnalysis,
      image_embedding: imageEmbedding || undefined, // Convert null to undefined for type compatibility
      image_hash: imageHash || undefined // Store image content hash for exact matching
    } as any); // Type assertion needed for image_hash field
  }

  async getByProduct(product_id: string) {
    return ProductImageRepository.findMany({ product_id });
  }

  async getAll() {
    return ProductImageRepository.findMany();
  }

  async getById(imageId: string) {
    return ProductImageRepository.findById(imageId);
  }

  async update(imageId: string, data: UpdateProductImageData) {
    return ProductImageRepository.updateById(imageId, data);
  }

  async setPrimary(imageId: string, product_id: string) {
    // Set all images for product to isPrimary = false, then set imageId to true
    await ProductImageRepository.updateMany({ product_id }, { isPrimary: false });
    return ProductImageRepository.updateById(imageId, { isPrimary: true });
  }

  async delete(imageId: string) {
    return ProductImageRepository.deleteById(imageId, false);
  }
}

export default new ProductImageService();
