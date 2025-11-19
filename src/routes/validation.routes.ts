import { Router } from 'express';
import { ResponseHelper } from '@/utils/response';
import logger from '@/utils/logger';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Validation
 *   description: General validation endpoints
 */

/**
 * @swagger
 * /api/v1/validate:
 *   post:
 *     summary: General validation endpoint
 *     tags: [Validation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [email, phone, document, amount]
 *                 description: Type of validation to perform
 *               value:
 *                 type: string
 *                 description: Value to validate
 *               context:
 *                 type: object
 *                 description: Additional context for validation
 *     responses:
 *       200:
 *         description: Validation result
 *       400:
 *         description: Invalid request
 */
router.post('/', async (req, res) => {
  try {
    const { type, value } = req.body;

    if (!type || !value) {
      return ResponseHelper.error(res, 'Type and value are required', undefined, 400);
    }

    let result = { isValid: false, message: '' };

    switch (type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        result.isValid = emailRegex.test(value);
        result.message = result.isValid ? 'Valid email' : 'Invalid email format';
        break;

      case 'phone':
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        result.isValid = phoneRegex.test(value);
        result.message = result.isValid ? 'Valid phone number' : 'Invalid phone number format';
        break;

      case 'document':
        result.isValid = value.length >= 5;
        result.message = result.isValid ? 'Valid document number' : 'Document number too short';
        break;

      case 'amount':
        const amount = parseFloat(value);
        result.isValid = !isNaN(amount) && amount > 0;
        result.message = result.isValid ? 'Valid amount' : 'Invalid amount';
        break;

      default:
        return ResponseHelper.error(res, 'Unsupported validation type', undefined, 400);
    }

    logger.info(`Validation performed: ${type} = ${result.isValid}`);

    return ResponseHelper.success(res, 'Validation completed', result);
  } catch (error: any) {
    logger.error(`Error in validation: ${error.message}`);
    return ResponseHelper.error(res, 'Validation failed', error);
  }
});

export default router;
