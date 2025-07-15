import { Router } from 'express';
import ProductImageController from '@/controllers/productImage.controller';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

const router = Router();

router.post('/',upload.single('image'), ProductImageController.create);
router.get('/product/:productId', ProductImageController.getByProduct);
router.post('/set-primary', ProductImageController.setPrimary);
router.delete('/:imageId', ProductImageController.delete);

export default router;
