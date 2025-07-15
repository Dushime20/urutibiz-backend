import { Request, Response } from 'express';
import ProductImageService from '@/services/productImage.service';
import { ResponseHelper } from '@/utils/response';
import multer from 'multer';
import cloudinary from '@/config/cloudinary';

const upload = multer({ dest: 'uploads/' });

class ProductImageController {
  async create(req: Request, res: Response) {
    let imageUrl = req.body.image_url;
    let thumbnailUrl = req.body.thumbnail_url;
    // If a file is uploaded, upload to Cloudinary
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, { folder: 'products' });
        imageUrl = result.secure_url;
        // Optionally, get thumbnail URL if you use Cloudinary transformations
        thumbnailUrl = result.secure_url; // Or use a transformation URL
      } catch (err) {
        return ResponseHelper.error(res, 'Cloudinary upload failed', 500);
      }
    }
    const data = {
      product_id: req.body.product_id,
      image_url: imageUrl,
      thumbnail_url: thumbnailUrl,
      alt_text: req.body.alt_text,
      sort_order: req.body.sort_order ? parseInt(req.body.sort_order) : 0,
      is_primary: req.body.is_primary === 'true' || req.body.is_primary === true,
      ai_analysis: null // AI analysis can be handled in the service
    };
    const result = await ProductImageService.create(data);
    if (!result.success) return ResponseHelper.error(res, result.error || 'Failed to add image', 400);
    return ResponseHelper.success(res, 'Image added', result.data, 201);
  }

  async getByProduct(req: Request, res: Response) {
    const { productId } = req.params;
    const result = await ProductImageService.getByProduct(productId);
    if (!result.success) return ResponseHelper.error(res, result.error || 'Failed to fetch images', 400);
    return ResponseHelper.success(res, 'Images retrieved', result.data);
  }

  async setPrimary(req: Request, res: Response) {
    const { imageId, productId } = req.body;
    const result = await ProductImageService.setPrimary(imageId, productId);
    if (!result.success) return ResponseHelper.error(res, result.error || 'Failed to set primary image', 400);
    return ResponseHelper.success(res, 'Primary image set', result.data);
  }

  async delete(req: Request, res: Response) {
    const { imageId } = req.params;
    const result = await ProductImageService.delete(imageId);
    if (!result.success) return ResponseHelper.error(res, result.error || 'Failed to delete image', 400);
    return ResponseHelper.success(res, 'Image deleted');
  }
}

export default new ProductImageController();
