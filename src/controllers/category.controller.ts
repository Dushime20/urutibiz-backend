import { Request, Response } from 'express';
import CategoryService from '../services/category.service';

export default class CategoryController {
  static async createCategory(req: Request, res: Response) {
    try {
      const category = await CategoryService.createCategory(req.body);
      res.status(201).json(category);
    } catch (err) {
      res.status(400).json({ error: 'Failed to create category', details: err instanceof Error ? err.message : String(err) });
    }
  }

  /**
   * Get category by ID
   * Public endpoint - accessible to all users (authenticated and non-authenticated)
   * Only returns active categories
   * GET /api/v1/categories/:id
   */
  static async getCategoryById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const category = await CategoryService.getCategoryById(id);
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json(category);
  }

  /**
   * List all categories
   * Public endpoint - accessible to all users (authenticated and non-authenticated)
   * Only returns active categories for public access
   * GET /api/v1/categories
   */
  static async listCategories(_req: Request, res: Response) {
    const categories = await CategoryService.listCategories();
    res.json(categories);
  }

  static async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const category = await CategoryService.updateCategory(id, req.body);
      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }
      res.json(category);
    } catch (err) {
      res.status(400).json({ error: 'Failed to update category', details: err instanceof Error ? err.message : String(err) });
    }
  }

  static async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const hardDelete = req.query.hard === 'true'; // Check for ?hard=true query parameter
      
      const success = await CategoryService.deleteCategory(id, hardDelete);
      
      if (!success) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }
      
      const message = hardDelete 
        ? 'Category permanently deleted successfully' 
        : 'Category deleted successfully (soft delete)';
      
      res.json({ 
        success: true, 
        message,
        hardDelete 
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      if (errorMessage.includes('subcategories') || errorMessage.includes('products')) {
        res.status(400).json({ 
          error: 'Cannot delete category', 
          details: errorMessage 
        });
        return;
      }
      
      res.status(500).json({ 
        error: 'Failed to delete category', 
        details: errorMessage 
      });
    }
  }

  static async restoreCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const category = await CategoryService.restoreCategory(id);
      
      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }
      
      res.json({ 
        success: true, 
        message: 'Category restored successfully',
        data: category
      });
    } catch (err) {
      res.status(500).json({ 
        error: 'Failed to restore category', 
        details: err instanceof Error ? err.message : String(err) 
      });
    }
  }
}
