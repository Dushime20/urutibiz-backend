// =====================================================
// PAYMENT TRANSACTION CONTROLLER
// =====================================================

import { Request, Response } from 'express';
import { PaymentTransactionService } from '../services/PaymentTransactionService';
import {
  ProcessPaymentRequest,
  RefundRequest,
  PaymentTransactionSearchParams
} from '../types/paymentTransaction.types';
import { PaymentTransactionError, PaymentProviderError } from '../types/paymentTransaction.types';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role?: string;
    [key: string]: any;
  };
}

/**
 * Controller for handling payment transaction HTTP requests
 */
export class PaymentTransactionController {
  private service: PaymentTransactionService;

  constructor(service?: PaymentTransactionService) {
    this.service = service || new PaymentTransactionService();
  }

  /**
   * Create a new payment transaction
   * POST /api/payment-transactions
   */
  public createTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const transactionData: any = { // Assuming CreatePaymentTransactionData is removed or replaced
        ...req.body,
        createdBy: req.body.createdBy || 'api_user' // In production, get from auth context
      };

      const transaction = await this.service.createTransaction(transactionData);

      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Payment transaction created successfully'
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to create payment transaction');
    }
  };

  /**
   * Get a transaction by ID
   * GET /api/payment-transactions/:id
   */
  public getTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const transaction = await this.service.getTransactionById(id);

      if (!transaction) {
        res.status(404).json({
          success: false,
          message: 'Payment transaction not found'
        });
        return;
      }

      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve payment transaction');
    }
  };

  /**
   * Get transactions with filters and pagination
   * GET /api/payment-transactions
   */
  public getTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
      const searchParams: PaymentTransactionSearchParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        sort_by: (req.query.sortBy as any) || 'id',
        sort_order: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        search: req.query.search as string,

        // Filters
        user_id: req.query.userId as string,
        booking_id: req.query.bookingId as string,
        payment_method_id: req.query.paymentMethodId as string,
        transaction_type: req.query.transactionType as any,
        status: req.query.status as any,
        provider: req.query.provider as any,
        currency: req.query.currency as any,
        amount_min: req.query.amountMin ? parseFloat(req.query.amountMin as string) : undefined,
        amount_max: req.query.amountMax ? parseFloat(req.query.amountMax as string) : undefined,
        created_after: req.query.createdAfter ? new Date(req.query.createdAfter as string) : undefined,
        created_before: req.query.createdBefore ? new Date(req.query.createdBefore as string) : undefined,
        processed_after: req.query.processedAfter ? new Date(req.query.processedAfter as string) : undefined,
        processed_before: req.query.processedBefore ? new Date(req.query.processedBefore as string) : undefined
      };

      const result = await this.service.getTransactions(searchParams);

      res.json({
        success: true,
        data: result.transactions,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve payment transactions');
    }
  };

  /**
   * Get transactions by user ID
   * GET /api/payment-transactions/user/:userId
   */
  public getTransactionsByUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const transactions = await this.service.getTransactionsByUserId(userId);

      res.json({
        success: true,
        data: transactions,
        count: transactions.length
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve user transactions');
    }
  };

  /**
   * Get received transactions by user ID
   * GET /api/payment-transactions/received/:userId
   */
  public getReceivedTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const transactions = await this.service.getReceivedTransactionsByUserId(userId);

      res.json({
        success: true,
        data: transactions,
        count: transactions.length
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve received transactions');
    }
  };

  /**
   * Get payment transactions for an inspector
   * GET /api/v1/payment-transactions/inspector/:inspectorId
   */
  public getInspectorPayments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { inspectorId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const status = req.query.status
        ? (Array.isArray(req.query.status) ? req.query.status : [req.query.status]) as any
        : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const result = await this.service.getInspectorPayments(inspectorId, {
        page,
        limit,
        status,
        startDate,
        endDate
      });

      res.json({
        success: true,
        data: result.transactions,
        stats: result.stats,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        },
        message: 'Inspector payments retrieved successfully'
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve inspector payments');
    }
  };

  /**
   * Get transactions by booking ID
   * GET /api/payment-transactions/booking/:bookingId
   */
  public getTransactionsByBooking = async (req: Request, res: Response): Promise<void> => {
    try {
      const { bookingId } = req.params;
      const transactions = await this.service.getTransactionsByBookingId(bookingId);

      res.json({
        success: true,
        data: transactions,
        count: transactions.length
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve booking transactions');
    }
  };

  /**
   * Update a payment transaction
   * PUT /api/payment-transactions/:id
   */
  public updateTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: any = { // Assuming UpdatePaymentTransactionData is removed or replaced
        ...req.body,
        updatedBy: req.body.updatedBy || 'api_user' // In production, get from auth context
      };

      const transaction = await this.service.updateTransaction(id, updateData);

      res.json({
        success: true,
        data: transaction,
        message: 'Payment transaction updated successfully'
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to update payment transaction');
    }
  };

  /**
   * Update transaction status
   * PATCH /api/payment-transactions/:id/status
   */
  public updateTransactionStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, ...updates } = req.body;

      if (!status) {
        res.status(400).json({
          success: false,
          message: 'Status is required'
        });
        return;
      }

      const transaction = await this.service.updateTransactionStatus(id, status, {
        ...updates,
        updatedBy: updates.updatedBy || 'api_user'
      });

      res.json({
        success: true,
        data: transaction,
        message: 'Transaction status updated successfully'
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to update transaction status');
    }
  };

  /**
   * Process a payment
   * POST /api/payment-transactions/process
   */
  public processPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
        return;
      }

      const paymentRequest: ProcessPaymentRequest = {
        ...req.body,
        user_id: userId // Use authenticated user's ID
      };

      if (!paymentRequest.payment_method_id || !paymentRequest.amount || !paymentRequest.transaction_type) {
        res.status(400).json({
          success: false,
          message: 'Missing required payment fields: payment_method_id, amount, transaction_type'
        });
        return;
      }

      const result = await this.service.processPayment(paymentRequest);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      this.handleError(res, error, 'Payment processing failed');
    }
  };

  /**
   * Process a refund
   * POST /api/payment-transactions/:id/refund
   */
  public processRefund = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
        return;
      }

      const { id } = req.params;
      const refundRequest: RefundRequest = {
        transaction_id: id,
        ...req.body
      };

      if (!refundRequest.reason) {
        res.status(400).json({
          success: false,
          message: 'Refund reason is required'
        });
        return;
      }

      const result = await this.service.processRefund(refundRequest);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      this.handleError(res, error, 'Refund processing failed');
    }
  };

  /**
   * Get transaction summary for a user
   * GET /api/payment-transactions/user/:userId/summary
   */
  public getUserTransactionSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const authenticatedUserId = authReq.user?.id;
      const { userId } = req.params;

      if (!authenticatedUserId) {
        res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
        return;
      }

      // Users can only access their own transaction summary, unless they're admin
      if (authenticatedUserId !== userId && authReq.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      const summary = await this.service.getUserTransactionSummary(userId);

      if (!summary) {
        res.status(404).json({
          success: false,
          message: 'No transactions found for user'
        });
        return;
      }

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve transaction summary');
    }
  };

  /**
   * Get transaction statistics
   * GET /api/payment-transactions/stats
   */
  public getTransactionStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
        return;
      }

      const isAdmin = authReq.user?.role === 'admin' || authReq.user?.role === 'super_admin';

      // Build filters from query parameters
      const filters: any = {
        user_id: req.query.user_id as string,
        booking_id: req.query.booking_id as string,
        transaction_type: req.query.transaction_type as any,
        status: req.query.status as any,
        provider: req.query.provider as any,
        currency: req.query.currency as any,
        created_after: req.query.created_after ? new Date(req.query.created_after as string) : undefined,
        created_before: req.query.created_before ? new Date(req.query.created_before as string) : undefined
      };

      // If not admin, force user_id to authenticated user
      if (!isAdmin) {
        if (filters.user_id && filters.user_id !== userId) {
          res.status(403).json({ success: false, message: 'Access denied' });
          return;
        }
        filters.user_id = userId;
      }

      // Non-admin users can only see their own stats (redundant but explicit)
      if (!isAdmin && filters.user_id !== userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const cleanedFilters = Object.keys(filters).reduce((acc: any, k: string) => {
        const v = (filters as any)[k];
        if (v !== undefined && v !== null && v !== '') acc[k] = v;
        return acc;
      }, {});

      const stats = await this.service.getTransactionStats(Object.keys(cleanedFilters).length > 0 ? cleanedFilters : undefined);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve transaction statistics');
    }
  };

  /**
   * Delete a transaction (soft delete)
   * DELETE /api/payment-transactions/:id
   */
  public deleteTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await this.service.deleteTransaction(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Payment transaction not found or cannot be deleted'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Payment transaction deleted successfully'
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to delete payment transaction');
    }
  };

  /**
   * Health check endpoint
   * GET /api/payment-transactions/health
   */
  public healthCheck = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json({
        success: true,
        message: 'Payment Transaction service is healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    } catch (error) {
      this.handleError(res, error, 'Health check failed');
    }
  };

  /**
   * Handle errors consistently
   */
  private handleError(res: Response, error: any, defaultMessage: string): void {
    console.error('Payment Transaction Controller Error:', error);

    if (error instanceof PaymentTransactionError) {
      const statusCode = this.getStatusCodeFromErrorCode(error.code);
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
        details: error.details
      });
      return;
    }

    if (error instanceof PaymentProviderError) {
      res.status(400).json({
        success: false,
        message: error.message,
        error: 'PAYMENT_PROVIDER_ERROR',
        provider: error.provider,
        providerCode: error.provider_code,
        details: error.details
      });
      return;
    }

    // Generic error
    res.status(500).json({
      success: false,
      message: defaultMessage,
      error: 'INTERNAL_SERVER_ERROR'
    });
  }

  /**
   * Map error codes to HTTP status codes
   */
  private getStatusCodeFromErrorCode(errorCode: string): number {
    const statusMap: Record<string, number> = {
      'INVALID_ID': 400,
      'INVALID_USER_ID': 400,
      'INVALID_BOOKING_ID': 400,
      'TRANSACTION_NOT_FOUND': 404,
      'VALIDATION_ERROR': 400,
      'INVALID_TRANSACTION_STATUS': 400,
      'INVALID_REFUND_AMOUNT': 400,
      'INVALID_OPERATION': 400,
      'INVALID_STATUS_TRANSITION': 400,
      'PROCESSING_ERROR': 500,
      'REFUND_ERROR': 500
    };

    return statusMap[errorCode] || 500;
  }
}