// =====================================================
// PAYMENT METHODS CONTROLLER
// =====================================================

import { Request, Response } from 'express';
import paymentMethodService from '../services/PaymentMethodService';
import {
  CreatePaymentMethodData,
  UpdatePaymentMethodData,
  PaymentMethodSearchParams,
  CardValidationData,
  MobileMoneyValidationData
} from '../types/paymentMethod.types';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role?: string;
    [key: string]: any;
  };
}

/**
 * Payment Methods Controller Class
 */
export class PaymentMethodController {

  /**
   * Create a new payment method
   */
  async createPaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const user_id = authReq.user?.id;
      if (!user_id) {
        res.status(401).json({
          success: false,
          message: 'User authentication required',
        });
        return;
      }

      const data: CreatePaymentMethodData = {
        ...req.body,
        user_id: user_id, // use snake_case for DB
      };

      // Validate required fields
      if (!data.type) {
        res.status(400).json({
          success: false,
          message: 'Payment method type is required',
        });
        return;
      }

      const result = await paymentMethodService.create(data);
      
      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error || 'Failed to create payment method',
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Payment method created successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Get payment method by ID
   */
  async getPaymentMethodById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const authReq = req as AuthenticatedRequest;
      const user_id = authReq.user?.id;

      if (!user_id) {
        res.status(401).json({
          success: false,
          message: 'User authentication required',
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Payment method ID is required',
        });
        return;
      }

      const result = await paymentMethodService.getById(id);
      
      if (!result.success) {
        res.status(404).json({
          success: false,
          message: result.error || 'Payment method not found',
        });
        return;
      }

      // Ensure user can only access their own payment methods
      if (result.data?.user_id !== user_id) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Get user's payment methods with filters
   */
  async getUserPaymentMethods(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const user_id = authReq.user?.id;
      if (!user_id) {
        res.status(401).json({
          success: false,
          message: 'User authentication required',
        });
        return;
      }

      const searchParams: PaymentMethodSearchParams = {
        user_id: user_id,
        type: req.query.type as any,
        provider: req.query.provider as any,
        is_default: req.query.is_default === 'true' ? true : req.query.is_default === 'false' ? false : undefined,
        is_verified: req.query.is_verified === 'true' ? true : req.query.is_verified === 'false' ? false : undefined,
        currency: req.query.currency as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const result = await paymentMethodService.getPaginated(
        {
          user_id: user_id,
          type: searchParams.type,
          provider: searchParams.provider,
          is_default: searchParams.is_default,
          is_verified: searchParams.is_verified,
          currency: searchParams.currency
        },
        searchParams.page || 1,
        searchParams.limit || 20
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error || 'Failed to fetch payment methods',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const authReq = req as AuthenticatedRequest;
      const user_id = authReq.user?.id;

      if (!user_id) {
        res.status(401).json({
          success: false,
          message: 'User authentication required',
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Payment method ID is required',
        });
        return;
      }

      const data: UpdatePaymentMethodData = req.body;

      // First check if the payment method exists and belongs to the user
      const existingResult = await paymentMethodService.getById(id);
      if (!existingResult.success) {
        res.status(404).json({
          success: false,
          message: existingResult.error || 'Payment method not found',
        });
        return;
      }

      if (existingResult.data?.user_id !== user_id) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      const result = await paymentMethodService.update(id, data);
      
      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error || 'Failed to update payment method',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data,
        message: 'Payment method updated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const authReq = req as AuthenticatedRequest;
      const user_id = authReq.user?.id;

      if (!user_id) {
        res.status(401).json({
          success: false,
          message: 'User authentication required',
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Payment method ID is required',
        });
        return;
      }

      // First check if the payment method exists and belongs to the user
      const existingResult = await paymentMethodService.getById(id);
      if (!existingResult.success) {
        res.status(404).json({
          success: false,
          message: existingResult.error || 'Payment method not found',
        });
        return;
      }

      if (existingResult.data?.user_id !== user_id) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      const result = await paymentMethodService.delete(id);
      
      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error || 'Failed to delete payment method',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Payment method deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const authReq = req as AuthenticatedRequest;
      const user_id = authReq.user?.id;

      if (!user_id) {
        res.status(401).json({
          success: false,
          message: 'User authentication required',
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Payment method ID is required',
        });
        return;
      }

      const result = await paymentMethodService.setAsDefault(id, user_id);
      
      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error || 'Failed to set default payment method',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data,
        message: 'Default payment method set successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Verify payment method
   */
  async verifyPaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const authReq = req as AuthenticatedRequest;
      const user_id = authReq.user?.id;

      if (!user_id) {
        res.status(401).json({
          success: false,
          message: 'User authentication required',
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Payment method ID is required',
        });
        return;
      }

      // First check if the payment method exists and belongs to the user
      const existingResult = await paymentMethodService.getById(id);
      if (!existingResult.success) {
        res.status(404).json({
          success: false,
          message: existingResult.error || 'Payment method not found',
        });
        return;
      }

      if (existingResult.data?.user_id !== user_id) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      const result = await paymentMethodService.verify(id);
      
      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error || 'Failed to verify payment method',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data,
        message: 'Payment method verified successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Get payment method analytics for user
   */
  async getPaymentMethodAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const user_id = authReq.user?.id;
      if (!user_id) {
        res.status(401).json({
          success: false,
          message: 'User authentication required',
        });
        return;
      }

      const result = await paymentMethodService.getAnalytics(user_id);

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error || 'Failed to fetch analytics',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Validate card details
   */
  async validateCard(req: Request, res: Response): Promise<void> {
    try {
      const cardData: CardValidationData = req.body;

      if (!cardData.card_number || !cardData.exp_month || !cardData.exp_year || !cardData.cvv) {
        res.status(400).json({
          success: false,
          message: 'Missing required card details: card_number, exp_month, exp_year, cvv',
        });
        return;
      }

      // Basic client-side validation
      const validation = this.validateCardDetails(cardData);

      res.status(200).json({
        success: true,
        data: validation,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Validate mobile money details
   */
  async validateMobileMoney(req: Request, res: Response): Promise<void> {
    try {
      const mobileMoneyData: MobileMoneyValidationData = req.body;

      if (!mobileMoneyData.phone_number || !mobileMoneyData.provider) {
        res.status(400).json({
          success: false,
          message: 'Missing required mobile money details: phone_number, provider',
        });
        return;
      }

      // Basic client-side validation
      const validation = this.validateMobileMoneyDetails(mobileMoneyData);

      res.status(200).json({
        success: true,
        data: validation,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Get all payment methods (admin only)
   */
// In src/controllers/paymentMethod.controller.ts
async getAllPaymentMethods(req: Request, res: Response): Promise<void> {
  try {
    // Remove admin check so any authenticated user can access
    const result = await paymentMethodService.getAll();
    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

  /**
   * Basic card validation logic
   */
  private validateCardDetails(data: CardValidationData): { isValid: boolean; error?: string } {
    // Basic card number validation (simple length check)
    const cleanNumber = data.card_number.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cleanNumber)) {
      return { isValid: false, error: 'Invalid card number format' };
    }

    // Expiry date validation
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    if (data.exp_year < currentYear || (data.exp_year === currentYear && data.exp_month < currentMonth)) {
      return { isValid: false, error: 'Card has expired' };
    }

    if (data.exp_month < 1 || data.exp_month > 12) {
      return { isValid: false, error: 'Invalid expiry month' };
    }

    // CVV validation
    if (!/^\d{3,4}$/.test(data.cvv)) {
      return { isValid: false, error: 'Invalid CVV' };
    }

    return { isValid: true };
  }

  /**
   * Basic mobile money validation logic
   */
  private validateMobileMoneyDetails(data: MobileMoneyValidationData): { isValid: boolean; error?: string } {
    // Phone number validation
    if (!/^\+?[\d\s-()]{10,15}$/.test(data.phone_number)) {
      return { isValid: false, error: 'Invalid phone number format' };
    }

    // Provider validation
    const validMobileProviders = ['mtn_momo', 'airtel_money'];
    if (!validMobileProviders.includes(data.provider as string)) {
      return { isValid: false, error: 'Invalid mobile money provider' };
    }

    return { isValid: true };
  }
}

// Export instance
export const paymentMethodController = new PaymentMethodController();
