/**
 * Country Business Rules Controller
 * 
 * HTTP endpoints for managing country-specific business rules
 */
import { Request, Response } from 'express';
import { CountryBusinessRulesService } from '../services/localization/CountryBusinessRulesService';
import { CreateCountryBusinessRulesData, UpdateCountryBusinessRulesData } from '../types/localization.types';

export class CountryBusinessRulesController {

  /**
   * Create new country business rules
   * POST /api/country-business-rules
   */
  static async createCountryBusinessRules(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateCountryBusinessRulesData = req.body;
      const result = await CountryBusinessRulesService.createCountryBusinessRules(data);

      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get country business rules by ID
   * GET /api/country-business-rules/:id
   */
  static async getCountryBusinessRulesById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await CountryBusinessRulesService.getCountryBusinessRulesById(id);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get country business rules by country ID
   * GET /api/country-business-rules/country/:countryId
   */
  static async getCountryBusinessRulesByCountryId(req: Request, res: Response): Promise<void> {
    try {
      const { countryId } = req.params;
      const result = await CountryBusinessRulesService.getCountryBusinessRulesByCountryId(countryId);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get all country business rules with pagination
   * GET /api/country-business-rules
   */
  static async getAllCountryBusinessRules(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

      const result = await CountryBusinessRulesService.getAllCountryBusinessRules(page, limit);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update country business rules
   * PUT /api/country-business-rules/:id
   */
  static async updateCountryBusinessRules(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateCountryBusinessRulesData = req.body;
      const result = await CountryBusinessRulesService.updateCountryBusinessRules(id, data);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Delete country business rules
   * DELETE /api/country-business-rules/:id
   */
  static async deleteCountryBusinessRules(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await CountryBusinessRulesService.deleteCountryBusinessRules(id);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Check if KYC is required for a country
   * GET /api/country-business-rules/country/:countryId/kyc-required
   */
  static async isKycRequired(req: Request, res: Response): Promise<void> {
    try {
      const { countryId } = req.params;
      const kycRequired = await CountryBusinessRulesService.isKycRequiredForCountry(countryId);

      res.status(200).json({
        success: true,
        data: {
          country_id: countryId,
          kyc_required: kycRequired
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get minimum user age for a country
   * GET /api/country-business-rules/country/:countryId/min-age
   */
  static async getMinUserAge(req: Request, res: Response): Promise<void> {
    try {
      const { countryId } = req.params;
      const minAge = await CountryBusinessRulesService.getMinUserAgeForCountry(countryId);

      res.status(200).json({
        success: true,
        data: {
          country_id: countryId,
          min_user_age: minAge
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Calculate fees for a country and amount
   * POST /api/country-business-rules/country/:countryId/calculate-fees
   */
  static async calculateFees(req: Request, res: Response): Promise<void> {
    try {
      const { countryId } = req.params;
      const { amount } = req.body;

      if (!amount || typeof amount !== 'number' || amount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Valid amount is required'
        });
        return;
      }

      const serviceFee = await CountryBusinessRulesService.calculateServiceFee(countryId, amount);
      const processingFee = await CountryBusinessRulesService.calculatePaymentProcessingFee(countryId, amount);
      const totalFees = serviceFee + processingFee;

      res.status(200).json({
        success: true,
        data: {
          country_id: countryId,
          amount,
          service_fee: serviceFee,
          processing_fee: processingFee,
          total_fees: totalFees,
          total_amount: amount + totalFees
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Check support availability for a country
   * GET /api/country-business-rules/country/:countryId/support-availability
   */
  static async checkSupportAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { countryId } = req.params;
      const dateParam = req.query.date as string;
      const checkDate = dateParam ? new Date(dateParam) : new Date();

      const isAvailable = await CountryBusinessRulesService.isSupportAvailable(countryId, checkDate);

      res.status(200).json({
        success: true,
        data: {
          country_id: countryId,
          check_date: checkDate,
          support_available: isAvailable
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Validate booking amount for a country
   * POST /api/country-business-rules/country/:countryId/validate-amount
   */
  static async validateBookingAmount(req: Request, res: Response): Promise<void> {
    try {
      const { countryId } = req.params;
      const { amount } = req.body;

      if (!amount || typeof amount !== 'number' || amount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Valid amount is required'
        });
        return;
      }

      const isValid = await CountryBusinessRulesService.isBookingAmountValid(countryId, amount);

      res.status(200).json({
        success: true,
        data: {
          country_id: countryId,
          amount,
          is_valid: isValid
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default CountryBusinessRulesController;
