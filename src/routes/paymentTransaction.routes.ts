// =====================================================
// PAYMENT TRANSACTION ROUTES
// =====================================================

import { Router } from 'express';
import { PaymentTransactionController } from '../controllers/paymentTransaction.controller';
import { requireAdmin, requireAuth } from '@/middleware';

/**
 * Express router for payment transaction endpoints
 * All routes are prefixed with /api/payment-transactions
 */

// Create router instance
const router = Router();

// Create controller instance
const controller = new PaymentTransactionController();

// =====================================================
// PAYMENT TRANSACTION CRUD ROUTES
// =====================================================

/**
 * @route   POST /api/payment-transactions
 * @desc    Create a new payment transaction
 * @access  Private (requires authentication in production)
 * @body    CreatePaymentTransactionData
 */
router.post('/',requireAuth, controller.createTransaction);

/**
 * @route   GET /api/payment-transactions
 * @desc    Get all payment transactions with filters and pagination
 * @access  Private (requires authentication in production)
 * @query   page, limit, sortBy, sortOrder, search, userId, bookingId, etc.
 */
router.get('/',requireAuth, controller.getTransactions);

/**
 * @route   GET /api/payment-transactions/:id
 * @desc    Get a specific payment transaction by ID
 * @access  Private (requires authentication in production)
 * @params  id - Transaction ID
 */
router.get('/:id',requireAuth, controller.getTransaction);

/**
 * @route   PUT /api/payment-transactions/:id
 * @desc    Update a payment transaction
 * @access  Private (requires authentication in production)
 * @params  id - Transaction ID
 * @body    UpdatePaymentTransactionData
 */
router.put('/:id',requireAuth, controller.updateTransaction);

/**
 * @route   DELETE /api/payment-transactions/:id
 * @desc    Delete a payment transaction (soft delete)
 * @access  Private (requires authentication in production)
 * @params  id - Transaction ID
 */
router.delete('/:id', controller.deleteTransaction);

// =====================================================
// SPECIALIZED QUERY ROUTES
// =====================================================

/**
 * @route   GET /api/payment-transactions/user/:userId
 * @desc    Get all transactions for a specific user
 * @access  Private (requires authentication in production)
 * @params  userId - User ID
 */
router.get('/user/:userId',requireAuth, controller.getTransactionsByUser);

/**
 * @route   GET /api/payment-transactions/booking/:bookingId
 * @desc    Get all transactions for a specific booking
 * @access  Private (requires authentication in production)
 * @params  bookingId - Booking ID
 */
router.get('/booking/:bookingId', controller.getTransactionsByBooking);

/**
 * @route   GET /api/payment-transactions/user/:userId/summary
 * @desc    Get transaction summary for a specific user
 * @access  Private (requires authentication in production)
 * @params  userId - User ID
 */
router.get('/user/:userId/summary', requireAuth, controller.getUserTransactionSummary);

// =====================================================
// PAYMENT PROCESSING ROUTES
// =====================================================

/**
 * @route   POST /api/payment-transactions/process
 * @desc    Process a payment transaction
 * @access  Private (requires authentication in production)
 * @body    ProcessPaymentRequest
 */
router.post('/process',requireAuth, controller.processPayment);

/**
 * @route   POST /api/payment-transactions/:id/refund
 * @desc    Process a refund for a transaction
 * @access  Private (requires authentication in production)
 * @params  id - Transaction ID
 * @body    RefundRequest (without transactionId)
 */
router.post('/:id/refund',requireAuth, controller.processRefund);

/**
 * @route   PATCH /api/payment-transactions/:id/status
 * @desc    Update transaction status
 * @access  Private (requires authentication in production)
 * @params  id - Transaction ID
 * @body    { status: PaymentStatus, ...UpdatePaymentTransactionData }
 */
router.patch('/:id/status', controller.updateTransactionStatus);

// =====================================================
// ANALYTICS AND REPORTING ROUTES
// =====================================================

/**
 * @route   GET /api/payment-transactions/stats
 * @desc    Get payment transaction statistics
 * @access  Private (requires authentication in production)
 * @query   Optional filters: userId, bookingId, transactionType, status, provider, currency, createdAfter, createdBefore
 */
router.get('/stats',requireAuth, controller.getTransactionStats);

// =====================================================
// UTILITY ROUTES
// =====================================================

/**
 * @route   GET /api/payment-transactions/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health',requireAuth, controller.healthCheck);

// Export the router
export default router;

// =====================================================
// ROUTE DOCUMENTATION
// =====================================================

/**
 * PAYMENT TRANSACTION API ENDPOINTS
 * 
 * Base URL: /api/payment-transactions
 * 
 * CRUD Operations:
 * - POST   /                     Create new transaction
 * - GET    /                     List transactions (with filters)
 * - GET    /:id                  Get transaction by ID
 * - PUT    /:id                  Update transaction
 * - DELETE /:id                  Delete transaction (soft)
 * 
 * User-specific:
 * - GET    /user/:userId         Get user's transactions
 * - GET    /user/:userId/summary Get user's transaction summary
 * 
 * Booking-specific:
 * - GET    /booking/:bookingId   Get booking's transactions
 * 
 * Payment Processing:
 * - POST   /process              Process a payment
 * - POST   /:id/refund           Process a refund
 * - PATCH  /:id/status           Update transaction status
 * 
 * Analytics:
 * - GET    /stats                Get transaction statistics
 * 
 * Utility:
 * - GET    /health               Health check
 * 
 * Query Parameters for GET /:
 * - page: number (default: 1)
 * - limit: number (default: 10, max: 100)
 * - sortBy: string (default: 'createdAt')
 * - sortOrder: 'asc' | 'desc' (default: 'desc')
 * - search: string (searches in metadata, failure_reason, etc.)
 * - userId: string
 * - bookingId: string
 * - paymentMethodId: string
 * - transactionType: TransactionType
 * - status: PaymentStatus
 * - provider: PaymentProvider
 * - currency: CurrencyCode
 * - amountMin: number
 * - amountMax: number
 * - createdAfter: ISO date string
 * - createdBefore: ISO date string
 * - processedAfter: ISO date string
 * - processedBefore: ISO date string
 * 
 * Response Format:
 * {
 *   "success": boolean,
 *   "data": any,
 *   "message"?: string,
 *   "error"?: string,
 *   "pagination"?: {
 *     "page": number,
 *     "limit": number,
 *     "total": number,
 *     "totalPages": number
 *   }
 * }
 * 
 * Error Response Format:
 * {
 *   "success": false,
 *   "message": string,
 *   "error": string,
 *   "details"?: any
 * }
 */
