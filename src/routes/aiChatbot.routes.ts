import { Router } from 'express';
import AIChatbotController from '../controllers/aiChatbot.controller';

const router = Router();

// Endpoint for processing AI chat queries
router.post('/query', (req, res) => AIChatbotController.query(req, res));

export default router;
