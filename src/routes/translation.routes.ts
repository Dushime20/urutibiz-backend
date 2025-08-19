import { Router } from 'express';
import { translationController } from '../controllers/translation.controller';

const router = Router();

// POST /api/v1/localization/translate
router.post('/translate', translationController.translate);

export default router;


