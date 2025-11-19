import { Request, Response } from 'express';
import ProductAvailabilityService from '@/services/productAvailability.service';
import { ResponseHelper } from '@/utils/response';

class ProductAvailabilityController {
  async create(req: Request, res: Response) {
    const result = await ProductAvailabilityService.create(req.body);
    if (!result.success) return ResponseHelper.error(res, result.error || 'Failed to add availability', 400);
    return ResponseHelper.success(res, 'Availability added', result.data, 201);
  }

  async getByProduct(req: Request, res: Response) {
    const { productId } = req.params;
    const result = await ProductAvailabilityService.getByProduct(productId);
    if (!result.success) return ResponseHelper.error(res, 'Failed to fetch availability', undefined, 400);
    return ResponseHelper.success(res, 'Availability retrieved', result.data);
  }

  async setAvailability(req: Request, res: Response) {
    const { productId, date, type, priceOverride, notes } = req.body;
    const result = await ProductAvailabilityService.setAvailability(productId, date, type, priceOverride, notes);
    if (!result.success) return ResponseHelper.error(res, result.error || 'Failed to set availability', 400);
    return ResponseHelper.success(res, 'Availability set', result.data);
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const result = await ProductAvailabilityService.delete(id);
    if (!result.success) return ResponseHelper.error(res, result.error || 'Failed to delete availability', 400);
    return ResponseHelper.success(res, 'Availability deleted');
  }
}

export default new ProductAvailabilityController();
