import { Router } from 'express';
import CategoryController from '../controllers/category.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.post('/', requireAuth, requireRole(['admin', 'moderator']), CategoryController.createCategory);
router.get('/:id', CategoryController.getCategoryById);
router.get('/', CategoryController.listCategories);
router.put('/:id', requireAuth, requireRole(['admin', 'moderator']), CategoryController.updateCategory);
router.delete('/:id', requireAuth, requireRole(['admin', 'moderator']), CategoryController.deleteCategory);
router.patch('/:id/restore', requireAuth, requireRole(['admin', 'moderator']), CategoryController.restoreCategory);

export default router;
