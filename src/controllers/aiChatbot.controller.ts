import { Request, Response } from 'express';
import AIChatbotService from '../services/aiChatbot.service';
import logger from '../utils/logger';

export class AIChatbotController {
  /**
   * Handles chat query requests
   */
  async query(req: Request, res: Response): Promise<void> {
    try {
      console.log('🤖 [AIChatbotController] Incoming request:', req.body);
      const { message } = req.body;

      if (!message || typeof message !== 'string') {
        console.log('🤖 [AIChatbotController] Error: Invalid message');
        res.status(400).json({
          success: false,
          error: 'Message is required and must be a string'
        });
        return;
      }

      const userId = (req as any).user?.id; // Assuming auth middleware attaches user
      const result = await AIChatbotService.processChatQuery(message, userId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('[AIChatbotController] Error:', error);
      res.status(500).json({
        success: false,
        error: 'An error occurred while processing your request'
      });
    }
  }
}

export default new AIChatbotController();
