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

  async createMultiple(req: Request, res: Response) {
    const product_id = req.body.product_id;
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded' });
    }
    try {
      const imagePromises = (req.files as Express.Multer.File[]).map(async (file: Express.Multer.File) => {
        const result = await cloudinary.uploader.upload(file.path, { folder: 'products' });
        // Save each image to DB
        return ProductImageService.create({
          product_id,
          image_url: result.secure_url,
          // Add other fields as needed (thumbnail_url, alt_text, etc.)
        });
      });
      const images = await Promise.all(imagePromises);
      // Flatten to just the data property if service returns { success, data }
      const imageData = images.map(img => img.data || img);
      return res.status(201).json({ success: true, data: imageData });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to upload images', error: err.message });
    }
  }

  async getByProduct(req: Request, res: Response) {
    const { productId } = req.params;
    const result = await ProductImageService.getByProduct(productId);
    if (!result.success) return ResponseHelper.error(res, result.error || 'Failed to fetch images', 400);
    return ResponseHelper.success(res, 'Images retrieved', result.data);
  }

  async getAll(req: Request, res: Response) {
    const result = await ProductImageService.getAll();
    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error || 'Failed to fetch images' });
    }
    return res.status(200).json({ success: true, data: result.data });
  }

  async getById(req: Request, res: Response) {
    const { imageId } = req.params;
    const result = await ProductImageService.getById(imageId);
    if (!result.success || !result.data) {
      return res.status(404).json({ success: false, message: result.error || 'Image not found' });
    }
    return res.status(200).json({ success: true, data: result.data });
  }

  async update(req: Request, res: Response) {
    const { imageId } = req.params;
    let imageUrl = req.body.image_url;
    let thumbnailUrl = req.body.thumbnail_url;
    // If a file is uploaded, upload to Cloudinary
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, { folder: 'products' });
        imageUrl = result.secure_url;
        thumbnailUrl = result.secure_url;
      } catch (err) {
        return ResponseHelper.error(res, 'Cloudinary upload failed', 500);
      }
    }
    const data: any = {
      image_url: imageUrl,
      thumbnailUrl: thumbnailUrl,
      altText: req.body.altText,
      sortOrder: req.body.sortOrder ? parseInt(req.body.sortOrder) : undefined,
      isPrimary: req.body.isPrimary === 'true' || req.body.isPrimary === true,
      aiAnalysis: req.body.aiAnalysis
    };
    // Remove undefined fields
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
    const result = await ProductImageService.update(imageId, data);
    if (!result.success) return ResponseHelper.error(res, result.error || 'Failed to update image', 400);
    return ResponseHelper.success(res, 'Image updated', result.data);
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
