import { Router } from 'express';
import CategoryController from '../controllers/category.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Protected routes (admin/moderator only)
router.post('/', requireAuth, requireRole(['admin', 'moderator']), CategoryController.createCategory);
router.put('/:id', requireAuth, requireRole(['admin', 'moderator']), CategoryController.updateCategory);
router.delete('/:id', requireAuth, requireRole(['admin', 'moderator']), CategoryController.deleteCategory);
router.patch('/:id/restore', requireAuth, requireRole(['admin', 'moderator']), CategoryController.restoreCategory);

// Public routes (accessible to all users - authenticated and non-authenticated)
// Only returns active categories for public access
router.get('/:id', CategoryController.getCategoryById);
router.get('/', CategoryController.listCategories);

export default router;
