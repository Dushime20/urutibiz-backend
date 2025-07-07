import ProductImageRepository from '@/repositories/ProductImageRepository';
import { ProductImageData, CreateProductImageData } from '@/types/productImage.types';
import { ValidationError } from '@/types';
import { runOnnxModel } from '@/utils/onnxRunner';
import * as ort from 'onnxruntime-node';

class ProductImageService {
  async create(data: CreateProductImageData) {
    // Basic validation
    const errors: ValidationError[] = [];
    if (!data.productId) errors.push({ field: 'productId', message: 'Product ID is required' });
    if (!data.imageUrl) errors.push({ field: 'imageUrl', message: 'Image URL is required' });
    if (errors.length > 0) return { success: false, error: errors.map(e => e.message).join(', ') };

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
    return ProductImageRepository.create({ ...data, aiAnalysis });
  }

  async getByProduct(productId: string) {
    return ProductImageRepository.findMany({ productId });
  }

  async setPrimary(imageId: string, productId: string) {
    // Set all images for product to isPrimary = false, then set imageId to true
    await ProductImageRepository.updateMany({ productId }, { isPrimary: false });
    return ProductImageRepository.updateById(imageId, { isPrimary: true });
  }

  async delete(imageId: string) {
    return ProductImageRepository.deleteById(imageId, false);
  }
}

export default new ProductImageService();
