import { Router } from 'express';
import ProductImageController from '@/controllers/productImage.controller';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

const router = Router();

router.post('/',upload.single('image'), ProductImageController.create);
router.get('/product/:productId', ProductImageController.getByProduct);
router.post('/set-primary', ProductImageController.setPrimary);
router.delete('/:imageId', ProductImageController.delete);
router.post('/multiple', upload.array('images', 10), ProductImageController.createMultiple);
router.get('/:imageId', ProductImageController.getById);
router.get('/', ProductImageController.getAll);
router.put('/:imageId', upload.single('image'), ProductImageController.update);

export default router;
