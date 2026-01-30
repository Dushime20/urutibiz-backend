/**
 * High-Performance Booking Management Controller
 * 
 * Optimized for enterprise-scale workloads with:
 * - Concurrent booking handling with race condition prevention
 * - Database transaction optimization
 * - Real-time availability checking
 * - Memory-efficient state management
 * 
 * @version 2.0.0 - Performance Optimized
 */

import { Response } from 'express';
import { BaseController } from './BaseController';
import BookingService from '@/services/BookingService';
import ProductService from '@/services/ProductService';
import UserVerificationService from '@/services/userVerification.service';
import Booking from '@/models/Booking.model';
import { PaymentTransactionService } from '@/services/PaymentTransactionService';
import BookingStatusHistoryService from '@/services/BookingStatusHistoryService';
import paymentMethodService from '@/services/PaymentMethodService';
import { BookingExpirationService } from '@/services/bookingExpiration.service';
import RentalReminderService from '@/services/rentalReminder.service';
import logger from '@/utils/logger';
import { 
  AuthenticatedRequest,
  CreateBookingData,
  BookingFilters,
  BookingData
} from '@/types';
import { InsuranceType } from '@/types/booking.types';
import { DeliveryService } from '@/services/delivery.service';
import type { DeliveryMethod, DeliveryTimeWindow, DeliveryStatus } from '@/types/product.types';
import { ResponseHelper } from '@/utils/response';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '@/config/database';
import NotificationEngine from '@/services/notification/NotificationEngine';
import { NotificationType, NotificationPriority } from '@/services/notification/types';

// Performance: Cache configuration
const CACHE_TTL = {
  BOOKING_DETAILS: 120,     // 2 minutes
  BOOKING_LIST: 60,         // 1 minute
  ANALYTICS: 300,           // 5 minutes
  TIMELINE: 180,            // 3 minutes
} as const;

// Performance: Pre-allocated caches
const bookingCache = new Map<string, { data: any; timestamp: number }>();
const analyticsCache = new Map<string, { data: any; timestamp: number }>();
const timelineCache = new Map<string, { data: any; timestamp: number }>();

// Performance: Optimized validation sets
const VALID_BOOKING_STATUSES = new Set(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']);
const VALID_PAYMENT_STATUSES = new Set(['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded']);

// Performance: Concurrent booking management
const bookingLocks = new Map<string, Promise<any>>();

/**
 * High-performance filter normalization for bookings
 */
const normalizeBookingFilters = (query: any, user_id: string, role: 'renter' | 'owner'): BookingFilters => {
  const filters: BookingFilters = {};
  
  // Role-based filtering
  if (role === 'renter') {
    (filters as any).renterId = user_id;
  } else if (role === 'owner') {
    (filters as any).ownerId = user_id;
  }
  
  // Fast set-based validation
  if (query.status && VALID_BOOKING_STATUSES.has(query.status)) {
    filters.status = query.status;
  }
  if (query.payment_status && VALID_PAYMENT_STATUSES.has(query.payment_status)) {
    filters.payment_status = query.payment_status;
  }
  
  // Date range filtering with validation
  if (query.start_date) {
    const date = new Date(query.start_date);
    if (!isNaN(date.getTime())) {
      filters.start_date = date.toISOString();
    }
  }
  if (query.end_date) {
    const date = new Date(query.end_date);
    if (!isNaN(date.getTime())) {
      filters.end_date = date.toISOString();
    }
  }
  
  if (query.product_id && typeof query.product_id === 'string') {
    filters.product_id = query.product_id;
  }
  
  return filters;
};

/**
 * Convert filters to database query format
 */
const convertFiltersToQuery = (filters: BookingFilters): Partial<BookingData> => {
  const query: Partial<BookingData> = {};
  
  // Accept both camelCase and snake_case for robustness
  const renterId = (filters as any).renterId || (filters as any).renter_id;
  const ownerId = (filters as any).ownerId || (filters as any).owner_id;
  const productId = (filters as any).productId || (filters as any).product_id;

  if (renterId) (query as any).renter_id = renterId;
  if (ownerId) (query as any).owner_id = ownerId;
  if (productId) (query as any).product_id = productId;
  if (filters.status) query.status = filters.status;
  if (filters.payment_status) query.payment_status = filters.payment_status;
  
  const startDate = (filters as any).startDate || (filters as any).start_date;
  const endDate = (filters as any).endDate || (filters as any).end_date;

  if (startDate) {
    const date = new Date(startDate);
    if (!isNaN(date.getTime())) {
      query.start_date = date.toISOString();
    }
  }
  if (endDate) {
    const date = new Date(endDate);
    if (!isNaN(date.getTime())) {
      query.end_date = date.toISOString();
    }
  }
  
  return query;
};

export class BookingsController extends BaseController {
  /**
   * Create new booking with enhanced validation
   * POST /api/v1/bookings
   */
  public createBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    console.log(req.user,'req user from header')
    if (this.handleValidationErrors(req as any, res)) return;

    const {
      product_id,
      renter_id,
      owner_id,
      start_date,
      end_date,
      pickup_time,
      return_time,
      pickup_method,
      delivery_method,
      pickup_address,
      delivery_address,
      meet_public_location,
      pickup_coordinates,
      delivery_coordinates,
      meet_public_coordinates,
      delivery_time_window,
      special_instructions,
      renter_notes,
      insurance_type,
      security_deposit,
      metadata,
      check_in_time,
      check_out_time,
      parent_booking_id
    }: CreateBookingData = req.body;

    // Check product availability before booking
    const isAvailable = await BookingService.isProductAvailable(product_id, start_date, end_date);
    if (!isAvailable) {
      return ResponseHelper.conflict(res, 'Product is not available for the selected dates');
    }

    // Performance: Concurrent booking prevention using lock
    const lockKey = `booking_${product_id}_${start_date}_${end_date}`;
    
    if (bookingLocks.has(lockKey)) {
      return ResponseHelper.conflict(res, 'Another booking is being processed for this time slot. Please try again.');
    }

    const bookingPromise = this.processBookingCreation(res, req.user.id, req.user, {
      product_id,
      owner_id,
      start_date,
      end_date,
      pickup_time,
      return_time,
      pickup_method,
      delivery_method,
      pickup_address,
      delivery_address,
      meet_public_location,
      pickup_coordinates,
      delivery_coordinates,
      meet_public_coordinates,
      delivery_time_window,
      special_instructions,
      renter_notes,
      insurance_type,
      security_deposit,
      metadata,
      check_in_time,
      check_out_time,
      parent_booking_id
    });
    bookingLocks.set(lockKey, bookingPromise);

    try {
      const result = await bookingPromise;
      this.logAction('CREATE_BOOKING', renter_id, 'new-booking', { product_id, start_date, end_date });
      return result;
    } finally {
      bookingLocks.delete(lockKey); // Always cleanup
    }
  });

  /**
   * Optimized user bookings retrieval with intelligent caching
   * GET /api/v1/bookings
   */
  public getUserBookings = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user_id = req.user.id;
    const { page, limit } = this.getPaginationParams(req as any);
    const { sortBy, sortOrder } = this.getSortParams(req as any, 'created_at', 'desc');
    
    const role = (req.query.role as 'renter' | 'owner') || 'renter';
    const filters = normalizeBookingFilters(req.query, user_id, role);

    

    // Performance: Generate cache key
    const cacheKey = `bookings_${user_id}_${role}_${JSON.stringify(filters)}_${page}_${limit}`;
    const cached = (req.query._nocache === '1') ? undefined : bookingCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL.BOOKING_LIST * 1000) {
      return this.formatPaginatedResponse(res, 'Bookings retrieved successfully (cached)', cached.data);
    }

    // Convert to optimized query
    const query = convertFiltersToQuery(filters);
    
    
    const result = await BookingService.getPaginated(query, page, limit, sortBy, sortOrder);

    // Console log to debug status issue
    if (result.success && result.data?.data) {
      console.log('🔍 [getUserBookings] Bookings from database:', {
        total: result.data.total,
        bookings: result.data.data.map((b: any) => ({
          id: b.id,
          booking_number: b.booking_number,
          status: b.status,
          payment_status: b.payment_status,
          renter_id: b.renter_id,
          owner_id: b.owner_id,
          rawData: b // Full booking object to inspect
        }))
      });
    }

    this.logAction('GET_USER_BOOKINGS', user_id, undefined, { role, filters });

    if (!result.success || !result.data) {
      return ResponseHelper.badRequest(res, result.error || 'Failed to fetch bookings');
    }

    // Cache the result
    bookingCache.set(cacheKey, {
      data: result.data,
      timestamp: Date.now()
    });

    // Performance: Clean cache periodically
    if (bookingCache.size > 150) {
      this.cleanExpiredCache(bookingCache, CACHE_TTL.BOOKING_LIST);
    }

    return this.formatPaginatedResponse(res, 'Bookings retrieved successfully', result.data);
  });

  /**
   * High-performance single booking retrieval
   * GET /api/v1/bookings/:id
   */
  public getBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user_id = req.user.id;
    
    // Performance: Check cache first
    const cacheKey = `booking_${id}`;
    const cached = bookingCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL.BOOKING_DETAILS * 1000) {
      // Still need to check authorization for cached data
      if (!this.checkBookingAccess(cached.data, user_id)) {
        return this.handleUnauthorized(res, 'Not authorized to view this booking');
      }
      return ResponseHelper.success(res, 'Booking retrieved successfully (cached)', cached.data);
    }

    const result = await BookingService.getById(id);
    if (!result.success || !result.data) {
      return this.handleNotFound(res, 'Booking');
    }

    // Authorization check
    if (!this.checkBookingAccess(result.data, user_id)) {
      return this.handleUnauthorized(res, 'Not authorized to view this booking');
    }

    // Cache the result
    bookingCache.set(cacheKey, {
      data: result.data,
      timestamp: Date.now()
    });

    this.logAction('GET_BOOKING', user_id, id);
    return ResponseHelper.success(res, 'Booking retrieved successfully', result.data);
  });

  /**
   * Get booking status history
   * GET /api/v1/bookings/:id/status-history
   */
  public getBookingStatusHistory = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user_id = req.user.id;

    const booking = await Booking.findById(id);
    if (!booking) {
      return this.handleNotFound(res, 'Booking');
    }

    if (!this.checkBookingAccess(booking, user_id) && req.user.role !== 'admin') {
      return this.handleUnauthorized(res, 'Not authorized to view this booking status history');
    }

    const result = await BookingStatusHistoryService.getByBookingId(id);
    
    if (!result.success) {
      return ResponseHelper.badRequest(res, result.error || 'Failed to fetch status history');
    }

    this.logAction('GET_BOOKING_STATUS_HISTORY', user_id, id);

    return ResponseHelper.success(res, 'Booking status history retrieved successfully', result.data);
  });

  /**
   * Get booking status analytics
   * GET /api/v1/bookings/:id/status-analytics
   */
  public getBookingStatusAnalytics = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user_id = req.user.id;

    const booking = await Booking.findById(id);
    if (!booking) {
      return this.handleNotFound(res, 'Booking');
    }

    if (!this.checkBookingAccess(booking, user_id) && req.user.role !== 'admin') {
      return this.handleUnauthorized(res, 'Not authorized to view this booking analytics');
    }

    const result = await BookingStatusHistoryService.getStatusAnalytics(id);
    
    if (!result.success) {
      return ResponseHelper.badRequest(res, result.error || 'Failed to fetch status analytics');
    }

    this.logAction('GET_BOOKING_STATUS_ANALYTICS', user_id, id);

    return ResponseHelper.success(res, 'Booking status analytics retrieved successfully', result.data);
  });

  /**
   * Get global booking status statistics (admin only)
   * GET /api/v1/bookings/status-stats
   */
  public getGlobalStatusStats = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Fast authorization check
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return this.handleUnauthorized(res, 'Admin access required');
    }

    const result = await BookingStatusHistoryService.getGlobalStats();
    
    if (!result.success) {
      return ResponseHelper.badRequest(res, result.error || 'Failed to fetch status statistics');
    }

    this.logAction('GET_GLOBAL_STATUS_STATS', req.user.id);

    return ResponseHelper.success(res, 'Global status statistics retrieved successfully', result.data);
  });

  /**
   * Optimized booking update with selective field updates
   * PUT /api/v1/bookings/:id
   */
  public updateBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;
    
    const { id } = req.params;
    const user_id = req.user.id;

    const booking = await Booking.findById(id);
    if (!booking) {
      return this.handleNotFound(res, 'Booking');
    }

    if (!this.checkBookingAccess(booking, user_id) && req.user.role !== 'admin') {
      return this.handleUnauthorized(res, 'Not authorized to update this booking');
    }

    // Performance: Efficient update data preparation
    const updateData = await this.prepareBookingUpdateData(req.body);
    updateData.last_modified_by = user_id;

    // Track status change if status is being updated
    const old_status = booking.status;
    
    const updatedBooking = await booking.update(updateData);

    // Record status change in audit trail if status changed
    if (updateData.status && updateData.status !== old_status) {
      await this.recordStatusChange(
        id,
        old_status,
        updateData.status,
        user_id,
        req.body.reason,
        req.body.notes || 'Booking status updated'
      );

      // Handle reminder system integration based on status change
      try {
        if (updateData.status === 'cancelled' || updateData.status === 'completed') {
          // Cancel pending reminders when booking is cancelled or completed
          await RentalReminderService.cancelPendingReminders(id, `Booking status changed to ${updateData.status}`);
        } else if (updateData.status === 'returned') {
          // Mark as returned early if returned before return date
          await RentalReminderService.markBookingReturnedEarly(id, new Date());
        }
      } catch (error) {
        logger.error(`Error handling reminder integration for booking ${id}:`, error);
        // Don't fail the booking update if reminder handling fails
      }
    }

    // Handle return date changes
    if (updateData.return_date && updateData.return_date !== (booking as any).return_date) {
      try {
        // Reset reminder schedule when return date is updated
        await RentalReminderService.resetReminderSchedule(id);
        logger.info(`Reset reminder schedule for booking ${id} due to return date change`);
      } catch (error) {
        logger.error(`Error resetting reminder schedule for booking ${id}:`, error);
        // Don't fail the booking update if reminder reset fails
      }
    }

    // Performance: Invalidate related caches
    this.invalidateBookingCaches(booking.renter_id, booking.owner_id, id);

    this.logAction('UPDATE_BOOKING', user_id, id, updateData);

    return ResponseHelper.success(res, 'Booking updated successfully', updatedBooking.toJSON());
  });

  /**
   * Automatic time-based booking cancellation
   * POST /api/v1/bookings/:id/cancel
   * ONLY applies to CONFIRMED bookings (where payment has been made and availability is blocked)
   * Pending bookings don't need cancellation logic (other users can still book)
   */
  public cancelBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { reason }: { reason?: string } = req.body;
    const user_id = req.user.id;

    // Validate reason is provided
    if (!reason || reason.trim().length === 0) {
      return ResponseHelper.badRequest(res, 'Cancellation reason is required');
    }

    if (reason.trim().length < 10) {
      return ResponseHelper.badRequest(res, 'Cancellation reason must be at least 10 characters');
    }

    // Use BookingService to query database instead of in-memory array
    const bookingResult = await BookingService.getById(id);
    if (!bookingResult.success || !bookingResult.data) {
      return this.handleNotFound(res, 'Booking');
    }
    const bookingData = bookingResult.data;

    // Authorization check
    if (!this.checkBookingAccess(bookingData, user_id)) {
      return this.handleUnauthorized(res, 'Not authorized to cancel this booking');
    }

    // ONLY allow cancellation for CONFIRMED bookings
    // Pending bookings don't need cancellation logic (other users can still book)
    if (bookingData.status !== 'confirmed') {
      return ResponseHelper.badRequest(res, 'Only confirmed bookings can be cancelled. Pending bookings do not block availability.');
    }

    // Calculate cancellation refund based on time until booking start
    // ONLY for confirmed bookings (payment completed)
    const cancellationDetails = this.calculateCancellationRefund(bookingData);

    const db = getDatabase();
    const now = new Date();

    // Update booking status to cancelled
    await db('bookings')
      .where('id', id)
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancellation_requested_at: now,
        cancellation_fee: cancellationDetails.cancellationFee,
        refund_amount: cancellationDetails.refundAmount,
        payment_status: cancellationDetails.refundAmount > 0 ? 'refund_pending' : 'cancelled',
        last_modified_by: user_id,
        updated_at: now
      });

    // Process refund if applicable (only for confirmed bookings with refund)
    if (cancellationDetails.refundAmount > 0) {
      try {
        // Find the original payment transaction
        const paymentTransaction = await db('payment_transactions')
          .where('booking_id', id)
          .where('status', 'completed')
          .where('transaction_type', 'payment')
          .orderBy('created_at', 'desc')
          .first();

        if (paymentTransaction) {
          // Create refund transaction
          const paymentService = new PaymentTransactionService();
          const refundResult = await paymentService.processRefund({
            transaction_id: paymentTransaction.id,
            amount: cancellationDetails.refundAmount,
            reason: `Booking cancellation: ${reason}`,
            metadata: {
              booking_id: id,
              cancellation_fee: cancellationDetails.cancellationFee,
              platform_fee: cancellationDetails.platformFee,
              cancellation_policy: cancellationDetails.reason
            }
          });

          if (refundResult.success) {
            // Update booking payment status to refunded
            await db('bookings')
              .where('id', id)
              .update({
                payment_status: 'refunded',
                refund_processed_at: now
              });
          }
        }
      } catch (refundError) {
        console.error('Error processing refund:', refundError);
        // Don't fail the cancellation if refund fails - log and continue
        // The refund can be processed manually later
      }
    }

    // Clear product availability for cancelled booking (only confirmed bookings block availability)
    await this.clearAvailabilityForBookingRange(bookingData);

    // Record status change in audit trail
    await this.recordStatusChange(
      id,
      bookingData.status,
      'cancelled',
      user_id,
      reason,
      cancellationDetails.reason
    );

    // Performance: Invalidate related caches
    this.invalidateBookingCaches(bookingData.renter_id, bookingData.owner_id, id);

    this.logAction('CANCEL_BOOKING', user_id, id, { 
      reason, 
      refundAmount: cancellationDetails.refundAmount,
      cancellationFee: cancellationDetails.cancellationFee,
      platformFee: cancellationDetails.platformFee
    });

    // Return cancellation details
    return ResponseHelper.success(res, 'Booking cancelled successfully', {
      booking_id: id,
      status: 'cancelled',
      refund_amount: cancellationDetails.refundAmount,
      cancellation_fee: cancellationDetails.cancellationFee,
      platform_fee: cancellationDetails.platformFee,
      reason: cancellationDetails.reason,
      message: cancellationDetails.refundAmount > 0 
        ? `Refund of ${cancellationDetails.refundAmount} will be processed automatically.`
        : 'No refund applicable based on cancellation policy.'
    });
  });

  /**
   * Request cancellation (renter only)
   * POST /api/v1/bookings/:id/request-cancellation
   * Renter submits cancellation request with reason
   */
  public requestCancellation = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { reason }: { reason: string } = req.body;
    const user_id = req.user.id;

    // Validate reason is provided
    if (!reason || reason.trim().length === 0) {
      return ResponseHelper.badRequest(res, 'Cancellation reason is required');
    }

    if (reason.trim().length < 10) {
      return ResponseHelper.badRequest(res, 'Cancellation reason must be at least 10 characters');
    }

    // Get booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return this.handleNotFound(res, 'Booking');
    }

    // Authorization: Only renter can request cancellation
    if (String(booking.renter_id) !== String(user_id)) {
      return this.handleUnauthorized(res, 'Only the renter can request cancellation');
    }

    // Status validation: Only confirmed bookings can be cancelled
    if (booking.status !== 'confirmed') {
      return ResponseHelper.badRequest(res, 'Only confirmed bookings can be cancelled');
    }

    // Update booking to cancellation_requested status
    const db = getDatabase();
    const now = new Date();
    
    await db('bookings')
      .where('id', id)
      .update({
        status: 'cancellation_requested',
        cancellation_reason: reason,
        cancellation_requested_at: now,
        last_modified_by: user_id,
        updated_at: now
      });

    // Get updated booking
    const updatedBooking = await Booking.findById(id);

    // Record status change in audit trail
    await this.recordStatusChange(
      id,
      'confirmed',
      'cancellation_requested',
      user_id,
      reason,
      'Renter requested cancellation'
    );

    // Invalidate related caches
    this.invalidateBookingCaches(booking.renter_id, booking.owner_id, id);

    this.logAction('REQUEST_CANCELLATION', user_id, id, { reason });

    return ResponseHelper.success(res, 'Cancellation request submitted successfully. Waiting for owner approval.', updatedBooking?.toJSON());
  });

  /**
   * Review cancellation (owner only)
   * POST /api/v1/bookings/:id/review-cancellation
   * Owner approves or rejects the cancellation request
   */
  public reviewCancellation = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { action, notes }: { action: 'approve' | 'reject'; notes?: string } = req.body;
    const user_id = req.user.id;

    // Get booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return this.handleNotFound(res, 'Booking');
    }

    // Authorization: Only owner can review cancellation
    if (String(booking.owner_id) !== String(user_id) && req.user.role !== 'admin') {
      return this.handleUnauthorized(res, 'Only the owner can review cancellation requests');
    }

    // Status validation: Must be in cancellation_requested status
    if (booking.status !== 'cancellation_requested') {
      return ResponseHelper.badRequest(res, 'Booking is not awaiting cancellation review');
    }

    const db = getDatabase();
    const now = new Date();

    if (action === 'approve') {
      // Approve cancellation
      await db('bookings')
        .where('id', id)
        .update({
          status: 'cancelled',
          owner_decision: 'approved',
          cancellation_approved_at: now,
          last_modified_by: user_id,
          updated_at: now,
          owner_notes: notes || 'Cancellation approved'
        });

      // Clear product availability for cancelled booking dates
      await this.clearAvailabilityForBookingRange(booking);

      // Record status change in audit trail
      await this.recordStatusChange(
        id,
        'cancellation_requested',
        'cancelled',
        user_id,
        notes,
        'Owner approved cancellation'
      );

      this.logAction('APPROVE_CANCELLATION', user_id, id, { notes });

      return ResponseHelper.success(res, 'Cancellation approved successfully. Refund processing will be initiated.', booking);
    } else {
      // Reject cancellation
      await db('bookings')
        .where('id', id)
        .update({
          status: 'confirmed',
          owner_decision: 'rejected',
          cancellation_rejected_at: now,
          cancellation_rejected_reason: notes || 'Cancellation rejected by owner',
          last_modified_by: user_id,
          updated_at: now
        });

      // Record status change in audit trail
      await this.recordStatusChange(
        id,
        'cancellation_requested',
        'confirmed',
        user_id,
        notes,
        'Owner rejected cancellation'
      );

      this.logAction('REJECT_CANCELLATION', user_id, id, { notes });

      return ResponseHelper.success(res, 'Cancellation rejected. Booking remains confirmed.', booking);
    }
  });

  /**
   * Admin cancel (admin override)
   * POST /api/v1/bookings/:id/admin-cancel
   * Admin can force cancel any booking for fraud prevention
   */
  public adminCancel = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { reason, admin_notes, force_refund }: { reason: string; admin_notes?: string; force_refund?: boolean } = req.body;
    const user_id = req.user.id;

    // Authorization: Only admin can override
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return this.handleUnauthorized(res, 'Admin access required');
    }

    // Validate reason
    if (!reason || reason.trim().length < 10) {
      return ResponseHelper.badRequest(res, 'Admin cancellation reason must be at least 10 characters');
    }

    // Get booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return this.handleNotFound(res, 'Booking');
    }

    const db = getDatabase();
    const now = new Date();

    // Admin override - force cancel
    await db('bookings')
      .where('id', id)
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        admin_override: true,
        admin_notes: admin_notes || 'Admin forced cancellation',
        cancellation_approved_at: now,
        cancelled_at: now,
        last_modified_by: user_id,
        updated_at: now
      });

    // Clear product availability
    await this.clearAvailabilityForBookingRange(booking);

    // Record status change in audit trail
    await this.recordStatusChange(
      id,
      booking.status,
      'cancelled',
      user_id,
      reason,
      `Admin forced cancellation: ${admin_notes || 'No additional notes'}`
    );

    // Invalidate caches
    this.invalidateBookingCaches(booking.renter_id, booking.owner_id, id);

    this.logAction('ADMIN_CANCEL', user_id, id, { reason, admin_notes, force_refund });

    return ResponseHelper.success(res, 'Booking cancelled by admin. Refund consistency will be initiated if applicable.', booking);
  });

  /**
   * Process refund (admin only)
   * POST /api/v1/bookings/:id/process-refund
   * Admin processes refund after cancellation is approved
   */
  public processRefund = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { refund_amount, cancellation_fee, reason }: { refund_amount?: number; cancellation_fee?: number; reason?: string } = req.body;
    const user_id = req.user.id;

    // Authorization: Only admin can process refunds
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return this.handleUnauthorized(res, 'Admin access required');
    }

    // Get booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return this.handleNotFound(res, 'Booking');
    }

    // Status validation: Must be cancelled
    if (booking.status !== 'cancelled') {
      return ResponseHelper.badRequest(res, 'Booking must be cancelled before processing refund');
    }

    const db = getDatabase();
    const now = new Date();

    // Calculate refund amount
    const totalPaid = booking.total_amount || 0;
    const fee = cancellation_fee || 0; // Could be calculated based on cancellation policy
    const refundToProcess = refund_amount || (totalPaid - fee);

    // Update booking with refund info
    await db('bookings')
      .where('id', id)
      .update({
        payment_status: 'refunded',
        status: 'refunded',
        refund_amount: refundToProcess,
        cancellation_fee: fee,
        updated_at: now,
        last_modified_by: user_id
      });

    // TODO: Create refund transaction record
    // TODO: Call payment gateway to process refund
    // TODO: Send refund notification to renter

    // Record status change
    await this.recordStatusChange(
      id,
      'cancelled',
      'refunded',
      user_id,
      reason || `Refund processed: ${refundToProcess}, Fee: ${fee}`,
      'Refund processed by admin'
    );

    this.logAction('PROCESS_REFUND', user_id, id, { refund_amount: refundToProcess, cancellation_fee: fee });

    return ResponseHelper.success(res, 'Refund processed successfully', {
      booking_id: id,
      refund_amount: refundToProcess,
      cancellation_fee: fee,
      message: 'Refund transaction has been initiated'
    });
  });

  /**
   * Optimized booking confirmation (owner only)
   * POST /api/v1/bookings/:id/confirm
   */
  public confirmBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user_id = req.user.id;

    const booking = await Booking.findById(id);
    if (!booking) {
      return this.handleNotFound(res, 'Booking');
    }

    // Authorization - only owner can confirm
    if (booking.owner_id !== user_id && req.user.role !== 'admin') {
      return this.handleUnauthorized(res, 'Only the product owner can confirm this booking');
    }

    if (booking.status !== 'pending') {
      return this.handleBadRequest(res, 'Booking cannot be confirmed at this stage');
    }

    const confirmedBooking = await booking.updateStatus('confirmed', user_id);

    // Set booking expiration for confirmed bookings
    try {
      await BookingExpirationService.setBookingExpiration(id);
      console.log(`Expiration set for confirmed booking ${id}`);
    } catch (error) {
      console.error(`Failed to set expiration for confirmed booking ${id}:`, error);
      // Don't fail the confirmation if expiration setting fails
    }

    // Block product availability for confirmed booking dates
    await this.blockAvailabilityForBookingRange(confirmedBooking);

    // Record status change in audit trail
    await this.recordStatusChange(
      id,
      booking.status,
      'confirmed',
      user_id,
      undefined,
      'Booking confirmed by owner'
    );

    // Notify renter that they can proceed with payment
    await this.sendOwnerConfirmationNotifications(id, 'confirmed');

    // Performance: Invalidate related caches
    this.invalidateBookingCaches(booking.renter_id, booking.owner_id, id);

    this.logAction('CONFIRM_BOOKING', user_id, id);

    return ResponseHelper.success(
      res,
      'Booking confirmed successfully. Renter has been notified to proceed with payment.',
      confirmedBooking.toJSON()
    );
  });

  /**
   * High-performance check-in process
   * POST /api/v1/bookings/:id/checkin
   */
  public checkIn = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user_id = req.user.id;

    // Use BookingService to query database instead of in-memory array
    const bookingResult = await BookingService.getById(id);
    if (!bookingResult.success || !bookingResult.data) {
      return this.handleNotFound(res, 'Booking');
    }
    // Create Booking instance from data to access instance methods (checkIn, checkOut)
    const booking = new Booking(bookingResult.data as any);

    if (!this.checkBookingAccess(booking, user_id) && req.user.role !== 'admin') {
      return this.handleUnauthorized(res, 'Not authorized to check-in this booking');
    }

    if (booking.status !== 'confirmed') {
      return this.handleBadRequest(res, 'Booking must be confirmed before check-in');
    }

    const updatedBooking = await booking.checkIn(user_id);
    
    // Persist status change to database
    await BookingService.update(id, { status: 'in_progress' } as any);

    // Ensure product availability is still blocked for in_progress booking
    await this.blockAvailabilityForBookingRange(updatedBooking);

    // Record status change in audit trail
    await this.recordStatusChange(
      id,
      booking.status,
      'in_progress',
      user_id,
      undefined,
      'Booking check-in completed'
    );

    // Performance: Invalidate related caches
    this.invalidateBookingCaches(booking.renter_id, booking.owner_id, id);

    this.logAction('CHECKIN_BOOKING', user_id, id);

    return ResponseHelper.success(res, 'Check-in completed successfully', updatedBooking.toJSON());
  });

  /**
   * High-performance check-out process
   * POST /api/v1/bookings/:id/checkout
   */
  public checkOut = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user_id = req.user.id;

    // Use BookingService to query database instead of in-memory array
    const bookingResult = await BookingService.getById(id);
    if (!bookingResult.success || !bookingResult.data) {
      return this.handleNotFound(res, 'Booking');
    }
    // Create Booking instance from data to access instance methods (checkIn, checkOut)
    const booking = new Booking(bookingResult.data as any);

    if (!this.checkBookingAccess(booking, user_id) && req.user.role !== 'admin') {
      return this.handleUnauthorized(res, 'Not authorized to check-out this booking');
    }

    if (booking.status !== 'in_progress') {
      return this.handleBadRequest(res, 'Booking must be in progress to check-out');
    }

    const updatedBooking = await booking.checkOut(user_id);
    
    // Persist status change to database
    await BookingService.update(id, { status: 'completed' } as any);

    // Clear product availability for completed booking dates
    await this.clearAvailabilityForBookingRange(updatedBooking);

    // Record status change in audit trail
    await this.recordStatusChange(
      id,
      booking.status,
      'completed',
      user_id,
      undefined,
      'Booking check-out completed'
    );

    // Performance: Invalidate related caches
    this.invalidateBookingCaches(booking.renter_id, booking.owner_id, id);

    this.logAction('CHECKOUT_BOOKING', user_id, id);

    return ResponseHelper.success(res, 'Check-out completed successfully', updatedBooking.toJSON());
  });

  /**
   * Optimized booking timeline with caching
   * GET /api/v1/bookings/:id/timeline
   */
  public getBookingTimeline = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user_id = req.user.id;

    // Performance: Check timeline cache
    const cacheKey = `timeline_${id}`;
    const cached = timelineCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL.TIMELINE * 1000) {
      return ResponseHelper.success(res, 'Booking timeline retrieved successfully (cached)', cached.data);
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return this.handleNotFound(res, 'Booking');
    }

    if (!this.checkBookingAccess(booking, user_id) && req.user.role !== 'admin') {
      return this.handleUnauthorized(res, 'Not authorized to view this booking timeline');
    }

    const timeline = await booking.getTimeline();

    // Cache the result
    timelineCache.set(cacheKey, {
      data: timeline,
      timestamp: Date.now()
    });

    this.logAction('GET_BOOKING_TIMELINE', user_id, id);

    return ResponseHelper.success(res, 'Booking timeline retrieved successfully', timeline);
  });

  /**
   * High-performance booking analytics (admin only)
   * GET /api/v1/bookings/analytics
   */
  public getBookingAnalytics = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Fast authorization check
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return this.handleUnauthorized(res, 'Admin access required');
    }

    const params = this.parseAnalyticsParams(req.query);
    
    // Performance: Check analytics cache
    const cacheKey = `analytics_${JSON.stringify(params)}`;
    const cached = analyticsCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL.ANALYTICS * 1000) {
      return ResponseHelper.success(res, 'Booking analytics retrieved successfully (cached)', cached.data);
    }

    const AnalyticsService = (await import('@/services/analytics.service')).default;
    const analytics = await AnalyticsService.getBookingAnalytics(params);

    // Cache the result
    analyticsCache.set(cacheKey, {
      data: analytics,
      timestamp: Date.now()
    });

    this.logAction('GET_BOOKING_ANALYTICS', req.user.id, undefined, params);

    return ResponseHelper.success(res, 'Booking analytics retrieved successfully', analytics);
  });

  /**
   * Record product condition at check-in
   * POST /api/v1/bookings/:id/record-condition
   */
  public recordCondition = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { 
      conditionType, // 'initial' or 'final'
      condition, 
      notes, 
      photos 
    }: { 
      conditionType: 'initial' | 'final';
      condition: string;
      notes?: string;
      photos?: string[];
    } = req.body;
    const user_id = req.user.id;

    const booking = await Booking.findById(id);
    if (!booking) {
      return this.handleNotFound(res, 'Booking');
    }

    if (!this.checkBookingAccess(booking, user_id) && req.user.role !== 'admin') {
      return this.handleUnauthorized(res, 'Not authorized to record condition for this booking');
    }

    const updateData: any = {};
    if (conditionType === 'initial') {
      updateData.initialCondition = condition;
      updateData.checkInTime = new Date();
      updateData.startedAt = new Date();
    } else {
      updateData.finalCondition = condition;
      updateData.checkOutTime = new Date();
      updateData.completedAt = new Date();
      if (notes) updateData.damageReport = notes;
      if (photos) updateData.damagePhotos = photos;
    }
    
    updateData.lastModifiedBy = user_id;

    const updatedBooking = await booking.update(updateData);

    // Performance: Invalidate related caches
    this.invalidateBookingCaches(booking.renter_id, booking.owner_id, id);

    this.logAction('RECORD_CONDITION', user_id, id, { conditionType, condition });

    return ResponseHelper.success(res, 'Product condition recorded successfully', updatedBooking.toJSON());
  });

  /**
   * Update booking insurance details
   * POST /api/v1/bookings/:id/insurance
   */
  public updateInsurance = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { 
      insuranceType,
      policyNumber,
      insuranceDetails
    }: { 
      insuranceType: InsuranceType;
      policyNumber?: string;
      insuranceDetails?: Record<string, any>;
    } = req.body;
    const user_id = req.user.id;

    const booking = await Booking.findById(id);
    if (!booking) {
      return this.handleNotFound(res, 'Booking');
    }

    if (!this.checkBookingAccess(booking, user_id) && req.user.role !== 'admin') {
      return this.handleUnauthorized(res, 'Not authorized to update insurance for this booking');
    }

    // Can only update insurance before confirmation
    if (!['pending'].includes(booking.status)) {
      return this.handleBadRequest(res, 'Insurance can only be updated for pending bookings');
    }

    // Recalculate pricing with new insurance
    const product = await ProductService.getById(booking.product_id);
    if (!product.success || !product.data) {
      return ResponseHelper.notFound(res, 'Product not found');
    }

    const newPricing = await this.calculateBookingPricing(
      product.data, 
      booking.start_date.toISOString(), 
      booking.end_date.toISOString(), 
      insuranceType,
      (booking as any).pickup_time,  // Use pickup time from existing booking
      (booking as any).return_time   // Use return time from existing booking
    );

    const updateData = {
      insuranceType,
      insurancePolicyNumber: policyNumber,
      insuranceDetails,
      pricing: newPricing,
      totalAmount: newPricing.totalAmount,
      lastModifiedBy: user_id
    };

    const updatedBooking = await booking.update(updateData as any);

    // Performance: Invalidate related caches
    this.invalidateBookingCaches(booking.renter_id, booking.owner_id, id);

    this.logAction('UPDATE_INSURANCE', user_id, id, { insuranceType, policyNumber });

    return ResponseHelper.success(res, 'Booking insurance updated successfully', updatedBooking.toJSON());
  });

  /**
   * Set payment method for booking
   * POST /api/v1/bookings/:id/payment-method
   */
  public setBookingPaymentMethod = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { paymentMethodId }: { paymentMethodId: string } = req.body;
    const user_id = req.user.id;

    if (!paymentMethodId) {
      return this.handleBadRequest(res, 'Payment method ID is required');
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return this.handleNotFound(res, 'Booking');
    }

    if (!this.checkBookingAccess(booking, user_id) && req.user.role !== 'admin') {
      return this.handleUnauthorized(res, 'Not authorized to modify this booking');
    }

    // Verify payment method belongs to the user
    const paymentMethodResult = await paymentMethodService.getById(paymentMethodId);
    if (!paymentMethodResult.success) {
      return this.handleBadRequest(res, 'Payment method not found');
    }

    if (paymentMethodResult.data?.user_id !== user_id) {
      return this.handleUnauthorized(res, 'Payment method does not belong to user');
    }

    if (!paymentMethodResult.data?.is_verified) {
      return this.handleBadRequest(res, 'Payment method must be verified before use');
    }

    // Update booking with payment method
    const updatedBooking = await booking.update({
      payment_method_id: paymentMethodId,
      last_modified_by: user_id
    });
    // Performance: Invalidate related caches
    this.invalidateBookingCaches(booking.renter_id, booking.owner_id, id);

    this.logAction('SET_PAYMENT_METHOD', user_id, id, { paymentMethodId });

    return ResponseHelper.success(res, 'Payment method set successfully', updatedBooking.toJSON());
  });

  /**
   * Get user's available payment methods for booking
   * GET /api/v1/bookings/:id/payment-methods
   */
  public getBookingPaymentMethods = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user_id = req.user.id;

    const booking = await Booking.findById(id);
    if (!booking) {
      return this.handleNotFound(res, 'Booking');
    }

    if (!this.checkBookingAccess(booking, user_id) && req.user.role !== 'admin') {
      return this.handleUnauthorized(res, 'Not authorized to view this booking');
    }

    // Get user's verified payment methods
    const result = await paymentMethodService.getPaginated(
      { user_id: user_id, is_verified: true },
      1,
      50
    );

    if (!result.success) {
      return ResponseHelper.badRequest(res, result.error || 'Failed to fetch payment methods');
    }

    this.logAction('GET_BOOKING_PAYMENT_METHODS', user_id, id);

    return ResponseHelper.success(res, 'Payment methods retrieved successfully', result.data);
  });

  // === PRIVATE HELPER METHODS ===

  /**
   * Process booking creation with optimizations
   */
  private async processBookingCreation(res: Response, renterId: string, user: any, bookingData: Omit<CreateBookingData, 'renter_id'>) {
    console.log('processBookingCreation called with:', { renterId, bookingData });
    
    const renter_id = renterId;
    const { 
      product_id,
      start_date, 
      end_date, 
      pickup_time,
      return_time,
      pickup_method,
      delivery_method,
      pickup_address,
      delivery_address,
      meet_public_location,
      pickup_coordinates,
      delivery_coordinates,
      meet_public_coordinates,
      delivery_time_window,
      special_instructions,
      renter_notes,
      insurance_type,
      security_deposit,
      metadata,
      check_in_time,
      check_out_time,
      parent_booking_id
    } = bookingData;

    // Performance: Parallel product fetch and KYC check
    console.log('Fetching product and checking KYC...');
    const [productResult, isVerified] = await Promise.all([
      ProductService.getById(product_id),
      UserVerificationService.isUserFullyKycVerified(renter_id)
    ]);

    console.log('Product result:', productResult);
    console.log('KYC verification result:', isVerified);

    if (!productResult.success || !productResult.data) {
      console.error('Product not found:', product_id);
      return ResponseHelper.notFound(res, 'Product not found');
    }

    const product = productResult.data;
    console.log('Product found:', { id: product.id, owner_id: product.owner_id, title: product.title });

    if (product.owner_id === renter_id) {
      return ResponseHelper.forbidden(res, 'You cannot book your own product');
    }

    if (!isVerified) {
      return ResponseHelper.forbidden(res, 'You must complete KYC verification to book or rent.');
    }

    // Performance: Optimized pricing calculation
    const pricing = await this.calculateBookingPricing(
      product, 
      start_date, 
      end_date, 
      insurance_type,
      pickup_time,  // Pass pickup time for accurate hour calculation
      return_time   // Pass return time for accurate hour calculation
    );
    const total_amount = pricing.totalAmount;
    const base_amount = pricing.subtotal;

    // Generate unique booking number
    const bookingNumber = this.generateBookingNumber();

    // Calculate AI risk score (placeholder implementation)
    const aiRiskScore = await this.calculateAIRiskScore(renter_id, product_id, { startDate: start_date, endDate: end_date });

    // Determine if this is a repeat booking
    const isRepeatBooking = !!parent_booking_id;

    // Helper function to combine date and time into UTC timestamp
    // Input: date string (YYYY-MM-DD) and time string (HH:MM)
    // Output: ISO string (YYYY-MM-DDTHH:MM:00.000Z) in UTC
    const combineDateTime = (dateStr: string, timeStr?: string): string => {
      if (!dateStr) {
        throw new Error('Date string is required');
      }
      
      // Parse the date string to ensure it's valid
      // Handle both ISO format and YYYY-MM-DD format
      let dateOnly = dateStr;
      if (dateStr.includes('T')) {
        // If already in ISO format, extract just the date part
        dateOnly = dateStr.split('T')[0];
      }
      
      // Validate date format (YYYY-MM-DD)
      const dateMatch = dateOnly.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!dateMatch) {
        throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD format.`);
      }
      
      // If no time provided or time is empty/null/undefined, use default times
      // Default: pickup at 09:00, return at 17:00
      let time = timeStr;
      if (!time || time.trim() === '' || time === 'null' || time === 'undefined') {
        time = '09:00'; // Default pickup time
      }
      
      // Clean up the time string - remove any extra spaces or invalid characters
      time = time.trim();
      
      // Ensure time format is HH:MM (add seconds if needed)
      const timeParts = time.split(':');
      if (timeParts.length < 2) {
        time = '09:00'; // Default if invalid format
      }
      
      const hours = timeParts[0] || '09';
      const minutes = timeParts[1] || '00';
      const seconds = timeParts[2] || '00';
      
      // Validate time components
      const hoursNum = parseInt(hours, 10);
      const minutesNum = parseInt(minutes, 10);
      const secondsNum = parseInt(seconds, 10);
      
      if (isNaN(hoursNum) || isNaN(minutesNum) || isNaN(secondsNum) ||
          hoursNum < 0 || hoursNum > 23 ||
          minutesNum < 0 || minutesNum > 59 ||
          secondsNum < 0 || secondsNum > 59) {
        // Invalid time, use default
        time = '09:00';
        const defaultParts = time.split(':');
        const defaultHours = defaultParts[0];
        const defaultMinutes = defaultParts[1];
        
        // Combine date and time as UTC timestamp
        const combinedDateTime = `${dateOnly}T${defaultHours}:${defaultMinutes}:00.000Z`;
        const date = new Date(combinedDateTime);
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid date/time combination: ${dateStr} ${time}`);
        }
        return date.toISOString();
      }
      
      // Combine date and time as UTC timestamp
      // This ensures consistent storage regardless of server timezone
      const combinedDateTime = `${dateOnly}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}.000Z`;
      
      // Validate the date
      const date = new Date(combinedDateTime);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date/time combination: ${dateStr} ${time}`);
      }
      
      return date.toISOString();
    };

    // Combine dates with times to create proper UTC timestamps
    const startDateTime = combineDateTime(start_date, pickup_time);
    const endDateTime = combineDateTime(end_date, return_time);

    const finalBookingData = {
      renter_id,
      owner_id: product.owner_id, // Get owner_id from product, not from request
      product_id,
      booking_number: bookingNumber,
      start_date: startDateTime,
      end_date: endDateTime,
      check_in_time: check_in_time ? new Date(check_in_time).toISOString() : undefined,
      check_out_time: check_out_time ? new Date(check_out_time).toISOString() : undefined,
      pickup_time,
      return_time,
      pickup_method: pickup_method || delivery_method, // Use pickup_method (database column), fallback to delivery_method if not set
      pickup_address,
      delivery_address,
      meet_public_location,
      pickup_coordinates,
      delivery_coordinates,
      meet_public_coordinates,
      delivery_time_window,
      special_instructions,
      renter_notes,
      // Only include insurance_type if provided, no hardcoded default
      ...(insurance_type && { insurance_type }),
      security_deposit,
      ai_risk_score: aiRiskScore,
      pricing: {
        // Product-level base price/currency were removed; pricing now comes from product_prices
        total_days: Math.ceil((new Date(endDateTime).getTime() - new Date(startDateTime).getTime()) / (1000 * 60 * 60 * 24)),
        subtotal: base_amount,
        platform_fee: pricing.platformFee,
        tax_amount: pricing.taxAmount,
        insurance_fee: pricing.insuranceFee,
        total_amount: total_amount,
        // Only include security_deposit and discount_amount if they have values (no hardcoded defaults)
        ...(security_deposit && security_deposit > 0 && { security_deposit: security_deposit }),
        ...(pricing.discountAmount && pricing.discountAmount > 0 && { discount_amount: pricing.discountAmount })
      },
      total_amount, // ensure not null
      base_amount,  // ensure not null
      metadata,
      is_repeat_booking: isRepeatBooking,
      parent_booking_id,
      created_by: renter_id,
      last_modified_by: renter_id,
      // Owner confirmation fields - default to pending
      owner_confirmed: false,
      owner_confirmation_status: 'pending',
      user // Attach the authenticated user object for business rules
    };

    // Remove features if present (should not be in bookings)
    if ('features' in finalBookingData) {
      delete (finalBookingData as any).features;
    }

    console.log('Creating booking with data:', finalBookingData);
    
    let created;
    try {
      created = await BookingService.create(finalBookingData);
      console.log('Booking creation result:', created);
      
      if (!created.success || !created.data) {
        console.error('Booking creation failed:', created.error);
        
        // If there are specific validation errors, use them instead of generic message
        if (created.errors && Array.isArray(created.errors) && created.errors.length > 0) {
          // Use the first error message as the main message for better UX
          const firstError = created.errors[0];
          return ResponseHelper.validationError(
            res, 
            firstError.message || 'Validation failed', 
            created.errors
          );
        }
        
        // Fallback to generic error if no specific errors provided
        return ResponseHelper.badRequest(res, created.error || 'Failed to create booking');
      }
      // Add this null check before sending success response
      if (!created.data) {
        console.error('Booking creation failed: no data returned');
        return ResponseHelper.error(res, 'Booking creation failed: no data returned', 500);
      }
    } catch (error) {
      console.error('Error in BookingService.create:', error);
      return ResponseHelper.error(res, 'Internal server error during booking creation', 500);
    }
    
    // Record initial status in audit trail
    if (created.data.id) {
      await this.recordStatusChange(
        created.data.id,
        undefined,
        'pending',
        renter_id,
        undefined,
        'Booking created'
      );
      await this.sendBookingCreatedNotifications(created.data.id);
      
      // Set booking expiration for confirmed bookings
      if (created.data.status === 'confirmed') {
        try {
          await BookingExpirationService.setBookingExpiration(created.data.id);
          console.log(`Expiration set for booking ${created.data.id}`);
        } catch (error) {
          console.error(`Failed to set expiration for booking ${created.data.id}:`, error);
          // Don't fail the booking creation if expiration setting fails
        }
      }
    }
    
    // Performance: Invalidate related caches
    this.invalidateBookingCaches(renter_id, product.owner_id);
    
    // Note: We DON'T mark product as unavailable here because booking is still 'pending'
    // Availability will be blocked only when booking status becomes 'confirmed' or 'in_progress'
    
    // Return the booking data from the service (which contains the database ID)
    return ResponseHelper.success(res, 'Booking created successfully', created.data, 201);
  }

  /**
   * Generate unique booking number
   */
  private generateBookingNumber(): string {
    const prefix = 'BK';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Block product availability for booking dates
   * Called when booking becomes confirmed or in_progress
   */
  private async blockAvailabilityForBookingRange(booking: any) {
    const db = getDatabase();
    const start = new Date(booking.start_date);
    const end = new Date(booking.end_date);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      await db('product_availability')
        .insert({
          id: uuidv4(),
          product_id: booking.product_id,
          date: dateStr,
          availability_type: 'unavailable',
          created_at: new Date(),
          notes: `Booked (${booking.status})`
        })
        .onConflict(['product_id', 'date'])
        .merge({ availability_type: 'unavailable', notes: `Booked (${booking.status})` });
    }
  }

  /**
   * Send renter/owner notifications when a booking is created
   */
  private async sendBookingCreatedNotifications(bookingId: string): Promise<void> {
    try {
      const booking = await this.getBookingNotificationContext(bookingId);
      if (!booking) {
        console.warn(`[BookingNotifications] Booking context not found for ${bookingId}`);
        return;
      }

      const productName = booking.product_title || 'your product';
      const bookingNumber = booking.booking_number || booking.id;
      const startDate = this.formatBookingDate(booking.start_date);
      const endDate = this.formatBookingDate(booking.end_date);
      const dateRangeText = startDate && endDate ? `${startDate} - ${endDate}` : '';

      const renterTitle = `Booking confirmed - ${productName}`;
      const renterMessage = `Hi ${booking.renter_first_name || 'there'}, your booking (${bookingNumber}) for ${productName} ${dateRangeText ? `from ${dateRangeText}` : ''} has been created successfully. We'll notify you if anything changes.`;

      const ownerTitle = `New booking request - ${productName}`;
      const ownerMessage = `Hi ${booking.owner_first_name || 'there'}, ${booking.renter_first_name || 'a renter'} just booked ${productName}${dateRangeText ? ` for ${dateRangeText}` : ''}. Review the booking details in your dashboard.`;

      const notifications: Promise<any>[] = [];

      // Send notification to renter
      if (booking.renter_id) {
        console.log(`[BookingNotifications] Sending notification to renter: ${booking.renter_id} for booking: ${bookingNumber}`);
        notifications.push(
          NotificationEngine.sendTemplatedNotification(
            'booking_created_renter',
            booking.renter_id,
            {
              recipientName: booking.renter_first_name || booking.renter_email || 'there',
              productName,
              bookingNumber,
              startDate: startDate || '',
              endDate: endDate || ''
            },
            {
              recipientEmail: booking.renter_email || undefined,
              data: {
                bookingId: booking.id,
                role: 'renter'
              },
              metadata: {
                source: 'bookings_controller',
                event: 'booking_created'
              }
            }
          ).then(result => {
            console.log(`[BookingNotifications] Renter notification sent successfully for booking: ${bookingNumber}`);
            return result;
          }).catch(error => {
            console.error(`[BookingNotifications] Failed to send renter notification for booking: ${bookingNumber}`, error);
            throw error;
          })
        );
      } else {
        console.warn(`[BookingNotifications] No renter_id found for booking: ${bookingNumber}`);
      }

      // Send notification to owner
      if (booking.owner_id) {
        console.log(`[BookingNotifications] Sending notification to owner: ${booking.owner_id} for booking: ${bookingNumber}`);
        notifications.push(
          NotificationEngine.sendTemplatedNotification(
            'booking_created_owner',
            booking.owner_id,
            {
              recipientName: booking.owner_first_name || booking.owner_email || 'there',
              renterName: booking.renter_first_name || 'a renter',
              productName,
              bookingNumber,
              startDate: startDate || '',
              endDate: endDate || ''
            },
            {
              recipientEmail: booking.owner_email || undefined,
              data: {
                bookingId: booking.id,
                role: 'owner'
              },
              metadata: {
                source: 'bookings_controller',
                event: 'booking_created'
              }
            }
          ).then(result => {
            console.log(`[BookingNotifications] Owner notification sent successfully for booking: ${bookingNumber}`);
            return result;
          }).catch(error => {
            console.error(`[BookingNotifications] Failed to send owner notification for booking: ${bookingNumber}`, error);
            throw error;
          })
        );
      } else {
        console.warn(`[BookingNotifications] No owner_id found for booking: ${bookingNumber}`);
      }

      // Send all notifications in parallel
      if (notifications.length > 0) {
        const results = await Promise.allSettled(notifications);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        console.log(`[BookingNotifications] Completed: ${successful} successful, ${failed} failed for booking: ${bookingNumber}`);
      } else {
        console.warn(`[BookingNotifications] No notifications to send for booking: ${bookingNumber}`);
      }
    } catch (error) {
      console.error('[BookingNotifications] Failed to send booking notifications', error);
    }
  }

  private async getBookingNotificationContext(bookingId: string) {
    const db = getDatabase();
    return await db('bookings')
      .select(
        'bookings.id',
        'bookings.booking_number',
        'bookings.start_date',
        'bookings.end_date',
        'bookings.product_id',
        'bookings.renter_id',
        db.raw('COALESCE(bookings.owner_id, products.owner_id) as owner_id'), // Use bookings.owner_id first, fallback to products.owner_id
        'products.title as product_title',
        'renter.first_name as renter_first_name',
        'renter.email as renter_email',
        'owner.first_name as owner_first_name',
        'owner.email as owner_email'
      )
      .leftJoin('products', 'products.id', 'bookings.product_id')
      .leftJoin({ renter: 'users' }, 'renter.id', 'bookings.renter_id')
      .leftJoin({ owner: 'users' }, 'owner.id', db.raw('COALESCE(bookings.owner_id, products.owner_id)'))
      .where('bookings.id', bookingId)
      .first();
  }

  private formatBookingDate(dateStr?: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Clear product availability for booking dates
   * Called when booking is cancelled or completed
   */
  private async clearAvailabilityForBookingRange(booking: any) {
    const db = getDatabase();
    const start = booking.start_date.slice(0, 10); // Get YYYY-MM-DD format
    const end = booking.end_date.slice(0, 10);
    
    await db('product_availability')
      .where('product_id', booking.product_id)
      .andWhereBetween('date', [start, end])
      .where('notes', 'like', '%Booked%')
      .delete();
  }

  /**
   * Calculate AI risk score for booking
   */
  private async calculateAIRiskScore(_renterId: string, _productId: string, bookingData: { startDate: string; endDate: string }): Promise<number> {
    // Placeholder implementation - in production this would use ML models
    // Factors to consider: user history, product type, duration, seasonal patterns, etc.
    
    let riskScore = 0.5; // Base risk score (0-1 scale)
    
    // Adjust based on booking duration
    const duration = new Date(bookingData.endDate).getTime() - new Date(bookingData.startDate).getTime();
    const days = duration / (1000 * 60 * 60 * 24);
    
    if (days > 30) riskScore += 0.1; // Longer bookings slightly more risky
    if (days < 1) riskScore += 0.15; // Very short bookings can be suspicious
    
    // In production, this would factor in:
    // - User verification level and history (using renterId)
    // - Product category and value (using productId)
    // - Seasonal patterns
    // - Geographic factors
    // - Payment method
    
    // TODO: Implement actual ML-based risk assessment using renterId and productId
    
    return Math.min(1.0, Math.max(0.0, riskScore));
  }

  /**
   * Calculate booking pricing with insurance considerations
   * Now supports hourly pricing when price_per_hour is available
   * 
   * @param product - Product object
   * @param startDate - Start date string (YYYY-MM-DD)
   * @param endDate - End date string (YYYY-MM-DD)
   * @param insuranceType - Optional insurance type
   * @param pickupTime - Optional pickup time string (HH:MM)
   * @param returnTime - Optional return time string (HH:MM)
   */
  private async calculateBookingPricing(
    product: any, 
    startDate: string, 
    endDate: string, 
    insuranceType?: InsuranceType,
    pickupTime?: string,
    returnTime?: string
  ) {
    // Helper function to combine date and time into Date object for accurate hour calculation
    const combineDateTime = (dateStr: string, timeStr?: string): Date => {
      if (!dateStr) {
        throw new Error('Date string is required');
      }
      const time = timeStr || '00:00';
      const timeParts = time.split(':');
      const hours = timeParts[0] || '00';
      const minutes = timeParts[1] || '00';
      const seconds = timeParts[2] || '00';
      const combinedDateTime = `${dateStr}T${hours}:${minutes}:${seconds}.000Z`;
      const date = new Date(combinedDateTime);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date/time combination: ${dateStr} ${time}`);
      }
      return date;
    };

    // Calculate exact timestamps if times are provided, otherwise use dates only
    const startDateTime = pickupTime ? combineDateTime(startDate, pickupTime) : new Date(startDate);
    const endDateTime = returnTime ? combineDateTime(endDate, returnTime) : new Date(endDate);
    
    // Calculate exact duration in milliseconds, then convert to hours
    const durationMs = endDateTime.getTime() - startDateTime.getTime();
    const totalHours = durationMs / (1000 * 60 * 60); // Convert milliseconds to hours
    const totalDays = Math.floor(totalHours / 24); // Full days
    const remainingHours = totalHours % 24; // Remaining hours after full days
    
    // For tier selection (weekly/monthly), use ceiling of days
    const totalDaysForTier = Math.ceil(totalHours / 24);
    
    try {
      // Use Knex directly to get pricing (avoid Sequelize service issues)
      const db = getDatabase();
      
      const priceRecord = await db('product_prices')
        .where({
          product_id: product.id,
          country_id: product.country_id || '1',
          is_active: true
        })
        .where('effective_from', '<=', startDateTime)
        .where(function() {
          this.whereNull('effective_until')
              .orWhere('effective_until', '>=', startDateTime);
        })
        .orderBy('created_at', 'desc')
        .first();
      
      if (!priceRecord) {
        console.log('[BookingsController] No active pricing found, using fallback');
        throw new Error('No active pricing found');
      }
      
      const hasHourlyPricing = priceRecord.price_per_hour && parseFloat(priceRecord.price_per_hour) > 0;
      const pricePerDay = parseFloat(priceRecord.price_per_day);
      const pricePerHour = hasHourlyPricing ? parseFloat(priceRecord.price_per_hour) : null;
      
      console.log('[BookingsController] Found pricing record:', {
        price_per_day: pricePerDay,
        price_per_hour: pricePerHour,
        currency: priceRecord.currency,
        totalHours: totalHours.toFixed(2),
        totalDays: totalDays,
        remainingHours: remainingHours.toFixed(2),
        hasHourlyPricing
      });
      
      let baseAmount = 0;
      let baseRate: number;
      let unitsUsed: number;
      let pricingType: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'mixed';
      
      // Check if hourly pricing is available
      if (hasHourlyPricing) {
        if (totalHours < 24) {
          // Less than 24 hours: charge hourly only
          baseRate = pricePerHour!;
          unitsUsed = totalHours;
          baseAmount = baseRate * unitsUsed;
          pricingType = 'hourly';
          console.log('[BookingsController] Using hourly pricing:', { hours: totalHours.toFixed(2), rate: baseRate });
        } else {
          // 24 hours or more: charge daily for full days + hourly for remaining hours
          baseRate = pricePerDay;
          unitsUsed = totalDays;
          const dailyAmount = baseRate * unitsUsed;
          
          // Add hourly charge for remaining hours (if any)
          const hourlyAmount = remainingHours > 0 ? pricePerHour! * remainingHours : 0;
          baseAmount = dailyAmount + hourlyAmount;
          pricingType = 'mixed';
          console.log('[BookingsController] Using mixed pricing:', { 
            days: totalDays, 
            remainingHours: remainingHours.toFixed(2),
            dailyAmount,
            hourlyAmount
          });
        }
      } else {
        // No hourly pricing available: use daily/weekly/monthly pricing tiers only
        const rentalDays = totalDaysForTier;
        
        // Choose the most economical pricing tier
        if (rentalDays >= 30 && priceRecord.price_per_month) {
          baseRate = parseFloat(priceRecord.price_per_month);
          unitsUsed = Math.ceil(rentalDays / 30);
          pricingType = 'monthly';
        } else if (rentalDays >= 7 && priceRecord.price_per_week) {
          baseRate = parseFloat(priceRecord.price_per_week);
          unitsUsed = Math.ceil(rentalDays / 7);
          pricingType = 'weekly';
        } else {
          // Always use daily rate as minimum (minimum 1 day)
          baseRate = pricePerDay;
          unitsUsed = Math.max(1, Math.ceil(rentalDays));
          pricingType = 'daily';
        }
        
        baseAmount = baseRate * unitsUsed;
        console.log('[BookingsController] Using daily-only pricing:', { 
          type: pricingType,
          days: rentalDays,
          units: unitsUsed,
          rate: baseRate
        });
      }
      
      // Apply market adjustment
      const marketAdjustment = parseFloat(priceRecord.market_adjustment_factor || 1);
      baseAmount *= marketAdjustment;
      
      const subtotal = baseAmount;
      const platformFee = subtotal * 0.1; // 10% platform fee
      const taxAmount = subtotal * 0.08; // 8% tax
      
      // Calculate insurance fee based on type
      let insuranceFee = 0;
      if (insuranceType && insuranceType !== 'none') {
        const insuranceRates: Record<string, number> = {
          basic: 0.02,    // 2% of subtotal
          standard: 0.04, // 4% of subtotal
          premium: 0.06   // 6% of subtotal
        };
        insuranceFee = subtotal * (insuranceRates[insuranceType] || 0);
      }
      
      const totalAmount = subtotal + platformFee + taxAmount + insuranceFee;

      return {
        basePrice: baseRate,
        currency: priceRecord.currency || 'RWF',
        totalDays: Math.ceil(totalHours / 24), // Keep for backward compatibility
        totalHours: totalHours, // Add hours for transparency
        pricingType: pricingType, // Add pricing type for transparency
        subtotal,
        platformFee,
        taxAmount,
        insuranceFee,
        totalAmount,
        securityDeposit: parseFloat(priceRecord.security_deposit || 0),
        discountAmount: 0
      };
      
    } catch (error) {
      console.error('[BookingsController] Error calculating pricing:', error);
      
      // Fallback to simple calculation if pricing service fails
      const basePrice = product.price || 0; // Use product.price as fallback
      const subtotal = basePrice * Math.max(1, Math.ceil(totalHours / 24)); // At least 1 day
      const platformFee = subtotal * 0.1; // 10% platform fee
      const taxAmount = subtotal * 0.08; // 8% tax
      
      let insuranceFee = 0;
      if (insuranceType && insuranceType !== 'none') {
        const insuranceRates: Record<string, number> = {
          basic: 0.02,    // 2% of subtotal
          standard: 0.04, // 4% of subtotal
          premium: 0.06   // 6% of subtotal
        };
        insuranceFee = subtotal * (insuranceRates[insuranceType] || 0);
      }
      
      const totalAmount = subtotal + platformFee + taxAmount + insuranceFee;

      return {
        basePrice: basePrice,
        currency: 'RWF',
        totalDays: Math.max(1, Math.ceil(totalHours / 24)),
        totalHours: totalHours,
        pricingType: 'daily',
        subtotal,
        platformFee,
        taxAmount,
        insuranceFee,
        totalAmount,
        securityDeposit: 0,
        discountAmount: 0
      };
    }
  }

  /**
   * Recalculate booking pricing (admin endpoint)
   * PUT /api/v1/bookings/:id/recalculate-pricing
   */
  public recalculateBookingPricing = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return ResponseHelper.unauthorized(res, 'Authentication required');
    }

    // Only admin can recalculate pricing
    if (req.user?.role !== 'admin') {
      return ResponseHelper.forbidden(res, 'Admin access required');
    }

    try {
      const db = getDatabase();
      
      // Get the booking
      const booking = await db('bookings').where('id', id).first();
      if (!booking) {
        return ResponseHelper.notFound(res, 'Booking not found');
      }

      // Get the product
      const product = await db('products').where('id', booking.product_id).first();
      if (!product) {
        return ResponseHelper.notFound(res, 'Product not found');
      }

      // Recalculate pricing
      // Extract dates from timestamps (they're already combined with times)
      const startDate = booking.start_date instanceof Date 
        ? booking.start_date 
        : new Date(booking.start_date);
      const endDate = booking.end_date instanceof Date 
        ? booking.end_date 
        : new Date(booking.end_date);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const pricing = await this.calculateBookingPricing(
        product, 
        startDateStr, 
        endDateStr, 
        (booking as any).insurance_type,
        (booking as any).pickup_time,  // Use pickup time from existing booking
        (booking as any).return_time   // Use return time from existing booking
      );

      // Update the booking with new pricing
      await db('bookings')
        .where('id', id)
        .update({
          total_amount: pricing.totalAmount,
          base_amount: pricing.subtotal,
          updated_at: new Date()
        });

      return ResponseHelper.success(res, 'Booking pricing recalculated successfully', {
        booking_id: id,
        new_pricing: pricing
      });

    } catch (error) {
      console.error('[BookingsController] Error recalculating pricing:', error);
      return ResponseHelper.error(res, 'Failed to recalculate booking pricing', error, 500);
    }
  });

  /**
   * Check booking access authorization
   */
  private checkBookingAccess(booking: any, userId: string): boolean {
    return booking.renter_id === userId || booking.owner_id === userId;
  }

  /**
   * Prepare booking update data efficiently
   */
  private async prepareBookingUpdateData(body: any) {
    const updateData: any = {};
    
    // Performance: Direct assignment for defined values only
    if (body.status !== undefined && VALID_BOOKING_STATUSES.has(body.status)) {
      updateData.status = body.status;
    }
    if (body.specialInstructions !== undefined) {
      updateData.specialInstructions = body.specialInstructions;
    }
    if (body.paymentStatus !== undefined && VALID_PAYMENT_STATUSES.has(body.paymentStatus)) {
      updateData.paymentStatus = body.paymentStatus;
    }
    
    // Additional fields from database schema
    if (body.renterNotes !== undefined) {
      updateData.renterNotes = body.renterNotes;
    }
    if (body.ownerNotes !== undefined) {
      updateData.ownerNotes = body.ownerNotes;
    }
    if (body.pickupTime !== undefined) {
      updateData.pickupTime = new Date(body.pickupTime);
    }
    if (body.returnTime !== undefined) {
      updateData.returnTime = new Date(body.returnTime);
    }
    if (body.initialCondition !== undefined) {
      updateData.initialCondition = body.initialCondition;
    }
    if (body.finalCondition !== undefined) {
      updateData.finalCondition = body.finalCondition;
    }
    if (body.damageReport !== undefined) {
      updateData.damageReport = body.damageReport;
    }
    if (body.damagePhotos !== undefined) {
      updateData.damagePhotos = body.damagePhotos;
    }
    if (body.insurancePolicyNumber !== undefined) {
      updateData.insurancePolicyNumber = body.insurancePolicyNumber;
    }
    if (body.confirmedAt !== undefined) {
      updateData.confirmedAt = new Date(body.confirmedAt);
    }
    if (body.startedAt !== undefined) {
      updateData.startedAt = new Date(body.startedAt);
    }
    if (body.completedAt !== undefined) {
      updateData.completedAt = new Date(body.completedAt);
    }
    if (body.cancelledAt !== undefined) {
      updateData.cancelledAt = new Date(body.cancelledAt);
    }
    
    return updateData;
  }

  /**
   * Parse analytics parameters efficiently
   */
  private parseAnalyticsParams(query: any) {
    return {
      period: (query.period as string) || '30d',
      granularity: (query.granularity as any) || 'day',
      startDate: query.startDate as string,
      endDate: query.endDate as string,
      filters: {
        status: query.status ? (query.status as string).split(',') : undefined,
        countryId: query.countryId as string,
        categoryId: query.categoryId as string,
        ownerId: query.ownerId as string,
        renterId: query.renterId as string,
        minAmount: query.minAmount ? parseFloat(query.minAmount as string) : undefined,
        maxAmount: query.maxAmount ? parseFloat(query.maxAmount as string) : undefined,
        productIds: query.productIds ? (query.productIds as string).split(',') : undefined
      }
    };
  }

  /**
   * Invalidate booking-related caches
   */
  private invalidateBookingCaches(renterId?: string, ownerId?: string, bookingId?: string): void {
    const keysToDelete = Array.from(bookingCache.keys()).filter(key => {
      if (bookingId && key.includes(bookingId)) return true;
      if (renterId && key.includes(renterId)) return true;
      if (ownerId && key.includes(ownerId)) return true;
      if (key.startsWith('bookings_')) return true;
      return false;
    });
    
    for (const key of keysToDelete) {
      bookingCache.delete(key);
    }

    // Also clear timeline cache for the booking
    if (bookingId) {
      const timelineKeys = Array.from(timelineCache.keys()).filter(key => 
        key.includes(bookingId)
      );
      for (const key of timelineKeys) {
        timelineCache.delete(key);
      }
    }
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(cache: Map<string, { data: any; timestamp: number }>, ttlSeconds: number): void {
    const now = Date.now();
    const expiredKeys = Array.from(cache.entries())
      .filter(([_, entry]) => (now - entry.timestamp) > ttlSeconds * 1000)
      .map(([key]) => key);
    
    for (const key of expiredKeys) {
      cache.delete(key);
    }
  }

  /**
   * Record a status change in the audit trail
   */
  private async recordStatusChange(
    bookingId: string,
    oldStatus: string | undefined,
    newStatus: string,
    changedBy: string,
    reason?: string,
    notes?: string
  ): Promise<void> {
    try {
      await BookingStatusHistoryService.recordStatusChange(
        bookingId,
        oldStatus,
        newStatus,
        changedBy,
        reason,
        notes
      );
    } catch (error) {
      console.error('Failed to record status change:', error);
      // Don't throw error as this is audit logging and shouldn't break the main flow
    }
  }

  /**
   * Calculate cancellation refund based on time until booking start
   * ONLY applies to CONFIRMED bookings (where payment has been made)
   */
  private calculateCancellationRefund(booking: BookingData): {
    refundAmount: number;
    cancellationFee: number;
    platformFee: number;
    reason: string;
  } {
    // Calculate days until booking start
    const now = new Date();
    const startDate = new Date(booking.start_date);
    const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const daysUntilStart = hoursUntilStart / 24;

    const totalAmount = booking.total_amount || 0;
    const platformFee = totalAmount * 0.10; // 10% platform fee (always non-refundable)

    // Scenario 5: <24 hours before start - No refund, full cancellation fee
    if (hoursUntilStart < 24) {
      return {
        refundAmount: 0,
        cancellationFee: totalAmount, // 100% cancellation fee
        platformFee: platformFee,
        reason: 'Cancellation within 24 hours - full amount charged'
      };
    }

    // Scenario 4: 1-3 days before start - No refund, 20% cancellation fee
    if (daysUntilStart >= 1 && daysUntilStart < 3) {
      const cancellationFee = totalAmount * 0.20; // 20% cancellation fee
      return {
        refundAmount: 0,
        cancellationFee: cancellationFee,
        platformFee: platformFee,
        reason: 'Cancellation 1-3 days before start - 20% cancellation fee'
      };
    }

    // Scenario 3: 3-7 days before start - 50% refund minus platform fee
    if (daysUntilStart >= 3 && daysUntilStart < 7) {
      const refundPercentage = 0.50;
      const refundAmount = (totalAmount * refundPercentage) - platformFee;
      return {
        refundAmount: Math.max(0, refundAmount), // Ensure non-negative
        cancellationFee: 0,
        platformFee: platformFee,
        reason: 'Cancellation 3-7 days before start - 50% refund minus platform fee'
      };
    }

    // Scenario 2: 7+ days before start - Full refund minus platform fee
    if (daysUntilStart >= 7) {
      const refundAmount = totalAmount - platformFee;
      return {
        refundAmount: Math.max(0, refundAmount), // Ensure non-negative
        cancellationFee: 0,
        platformFee: platformFee,
        reason: 'Cancellation 7+ days before start - full refund minus platform fee'
      };
    }

    // Default: No refund (shouldn't reach here, but safety fallback)
    return {
      refundAmount: 0,
      cancellationFee: 0,
      platformFee: platformFee,
      reason: 'No refund applicable'
    };
  }

  /**
   * Owner confirms booking - confirms product availability and accessibility
   * POST /api/v1/bookings/:id/confirm
   */
  public confirmBookingByOwner = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const ownerId = req.user.id;
    const { notes } = req.body;

    // Get booking
    const bookingResult = await BookingService.getById(id);
    if (!bookingResult.success || !bookingResult.data) {
      return ResponseHelper.notFound(res, 'Booking not found');
    }

    const booking = bookingResult.data;

    // Verify user is the owner
    if (booking.owner_id !== ownerId) {
      return ResponseHelper.forbidden(res, 'Only the product owner can confirm this booking');
    }

    // Check if already confirmed
    if (booking.owner_confirmed === true) {
      return ResponseHelper.badRequest(res, 'Booking is already confirmed by owner');
    }

    // Check if already rejected
    if (booking.owner_confirmation_status === 'rejected') {
      return ResponseHelper.badRequest(res, 'Booking has already been rejected');
    }

    // Update booking with owner confirmation
    const updateData: any = {
      owner_confirmed: true,
      owner_confirmation_status: 'confirmed',
      owner_confirmed_at: new Date().toISOString(),
      last_modified_by: ownerId
    };

    if (notes) {
      updateData.owner_confirmation_notes = notes;
    }

    const updateResult = await BookingService.update(id, updateData);
    if (!updateResult.success || !updateResult.data) {
      return ResponseHelper.error(res, 'Failed to confirm booking', updateResult.error, 500);
    }

    // Record status change
    await this.recordStatusChange(
      id,
      booking.owner_confirmation_status || 'pending',
      'confirmed',
      ownerId,
      undefined,
      'Owner confirmed booking - product is available and accessible'
    );

    // Send notifications
    await this.sendOwnerConfirmationNotifications(id, 'confirmed');

    // Invalidate cache
    this.invalidateBookingCaches(booking.renter_id, ownerId);

    return ResponseHelper.success(res, 'Booking confirmed successfully. Renter can now proceed with payment.', updateResult.data);
  });

  /**
   * Owner rejects booking - product unavailable or damaged
   * POST /api/v1/bookings/:id/reject
   */
  public rejectBookingByOwner = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const ownerId = req.user.id;
    const { reason, notes } = req.body;

    if (!reason || reason.trim().length === 0) {
      return ResponseHelper.badRequest(res, 'Rejection reason is required');
    }

    // Get booking
    const bookingResult = await BookingService.getById(id);
    if (!bookingResult.success || !bookingResult.data) {
      return ResponseHelper.notFound(res, 'Booking not found');
    }

    const booking = bookingResult.data;

    // Verify user is the owner
    if (booking.owner_id !== ownerId) {
      return ResponseHelper.forbidden(res, 'Only the product owner can reject this booking');
    }

    // Check if already confirmed
    if (booking.owner_confirmed === true) {
      return ResponseHelper.badRequest(res, 'Cannot reject an already confirmed booking');
    }

    // Check if already rejected
    if (booking.owner_confirmation_status === 'rejected') {
      return ResponseHelper.badRequest(res, 'Booking has already been rejected');
    }

    // Update booking with owner rejection
    const updateData: any = {
      owner_confirmed: false,
      owner_confirmation_status: 'rejected',
      owner_rejection_reason: reason,
      last_modified_by: ownerId,
      status: 'cancelled' // Auto-cancel the booking when rejected
    };

    if (notes) {
      updateData.owner_confirmation_notes = notes;
    }

    const updateResult = await BookingService.update(id, updateData);
    if (!updateResult.success || !updateResult.data) {
      return ResponseHelper.error(res, 'Failed to reject booking', updateResult.error, 500);
    }

    // Record status change
    await this.recordStatusChange(
      id,
      booking.status,
      'cancelled',
      ownerId,
      undefined,
      `Owner rejected booking: ${reason}`
    );

    // Send notifications
    await this.sendOwnerConfirmationNotifications(id, 'rejected', reason);

    // Invalidate cache
    this.invalidateBookingCaches(booking.renter_id, ownerId);

    return ResponseHelper.success(res, 'Booking rejected successfully', updateResult.data);
  });

  /**
   * Send notifications for owner confirmation/rejection
   */
  private async sendOwnerConfirmationNotifications(
    bookingId: string,
    action: 'confirmed' | 'rejected',
    reason?: string
  ): Promise<void> {
    try {
      const booking = await this.getBookingNotificationContext(bookingId);
      if (!booking) {
        console.warn(`[OwnerConfirmation] Booking context not found for ${bookingId}`);
        return;
      }

      // Import notification engine
      const NotificationEngine = (await import('../services/notification/NotificationEngine')).default;
      const { NotificationType } = await import('../services/notification/types');

      if (action === 'confirmed') {
        // Notify renter that booking is confirmed
        await NotificationEngine.sendNotification({
          type: NotificationType.BOOKING_CONFIRMED,
          recipientId: booking.renter_id,
          title: 'Booking Confirmed by Owner',
          message: `The owner has confirmed your booking for "${booking.product_title}". You can now proceed with payment.`,
          data: {
            booking_id: bookingId,
            product_id: booking.product_id,
            action: 'confirmed'
          }
        });
      } else if (action === 'rejected') {
        // Notify renter that booking is rejected
        await NotificationEngine.sendNotification({
          type: NotificationType.BOOKING_CANCELLED,
          recipientId: booking.renter_id,
          title: 'Booking Rejected by Owner',
          message: `The owner has rejected your booking for "${booking.product_title}". ${reason ? `Reason: ${reason}` : ''}`,
          data: {
            booking_id: bookingId,
            product_id: booking.product_id,
            action: 'rejected',
            reason: reason
          }
        });
      }
    } catch (error) {
      console.error('[OwnerConfirmation] Error sending notifications:', error);
    }
  }

  /**
   * Calculate delivery fee
   * POST /api/v1/bookings/delivery/calculate-fee
   */
  public calculateDeliveryFee = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        product_id,
        delivery_method,
        delivery_address,
        delivery_coordinates,
        delivery_time_window,
        meet_public_location,
        meet_public_coordinates
      } = req.body;

      if (!product_id || !delivery_method) {
        return ResponseHelper.badRequest(res, 'Product ID and delivery method are required');
      }

      // Validate delivery method
      const validMethods: DeliveryMethod[] = ['pickup', 'delivery', 'meet_public', 'visit'];
      if (!validMethods.includes(delivery_method)) {
        return ResponseHelper.badRequest(res, 'Invalid delivery method');
      }

      // Prepare delivery options
      const deliveryOptions = {
        method: delivery_method as DeliveryMethod,
        timeWindow: delivery_time_window as DeliveryTimeWindow | undefined,
        address: delivery_address,
        coordinates: delivery_coordinates,
        meetPublicLocation: meet_public_location,
        meetPublicCoordinates: meet_public_coordinates
      };

      // Validate delivery options
      const validation = DeliveryService.validateDeliveryOptions(deliveryOptions);
      if (!validation.valid) {
        return ResponseHelper.badRequest(res, validation.error || 'Invalid delivery options');
      }

      // Calculate delivery fee
      const feeCalculation = await DeliveryService.calculateDeliveryFee(
        product_id,
        deliveryOptions,
        delivery_coordinates
      );

      return ResponseHelper.success(res, 'Delivery fee calculated successfully', feeCalculation);
    } catch (error: any) {
      console.error('[CalculateDeliveryFee] Error:', error);
      return ResponseHelper.error(res, error.message || 'Failed to calculate delivery fee', 500);
    }
  });

  /**
   * Update delivery status
   * POST /api/v1/bookings/:id/delivery/update-status
   */
  public updateDeliveryStatus = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const {
        status,
        location,
        tracking_number,
        eta,
        driver_contact,
        notes
      } = req.body;

      if (!status) {
        return ResponseHelper.badRequest(res, 'Delivery status is required');
      }

      // Validate status
      const validStatuses: DeliveryStatus[] = [
        'scheduled', 'confirmed', 'out_for_delivery', 'in_transit',
        'delivered', 'failed', 'cancelled'
      ];
      if (!validStatuses.includes(status)) {
        return ResponseHelper.badRequest(res, 'Invalid delivery status');
      }

      // Get booking
      const bookingResult = await BookingService.getById(id);
      if (!bookingResult.success || !bookingResult.data) {
        return ResponseHelper.notFound(res, 'Booking not found');
      }

      const booking = bookingResult.data;

      // Check authorization (owner or renter can update)
      if (booking.owner_id !== req.user.id && booking.renter_id !== req.user.id) {
        return ResponseHelper.forbidden(res, 'Not authorized to update this booking');
      }

      // Update delivery status
      const tracking = await DeliveryService.updateDeliveryStatus(
        id,
        status as DeliveryStatus,
        location,
        notes
      );

      // Update booking with delivery information
      const updateData: any = {
        delivery_status: status,
        metadata: {
          ...(booking.metadata || {}),
          delivery_tracking: tracking,
          delivery_tracking_number: tracking_number,
          delivery_eta: eta,
          delivery_driver_contact: driver_contact
        }
      };

      await BookingService.update(id, updateData);

      // Send notification
      try {
        const recipientId = booking.owner_id === req.user.id ? booking.renter_id : booking.owner_id;
        await NotificationEngine.sendNotification({
          type: NotificationType.BOOKING_REMINDER, // Using BOOKING_REMINDER as BOOKING_UPDATE doesn't exist
          recipientId,
          title: 'Delivery Status Updated',
          message: `Delivery status updated to: ${status}`,
          data: {
            booking_id: id,
            delivery_status: status,
            action: 'delivery_status_updated'
          }
        });
      } catch (notifError) {
        console.error('[UpdateDeliveryStatus] Error sending notification:', notifError);
      }

      // Emit real-time update via Socket.IO
      try {
        const { getSocketServer } = await import('../socket/socketManager');
        const io = getSocketServer();
        if (io) {
          io.to(`booking-${id}`).emit('delivery-status-changed', {
            bookingId: id,
            status,
            location,
            tracking_number,
            eta,
            driver_contact,
            notes,
            updatedBy: req.user.id,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (socketError) {
        console.error('[UpdateDeliveryStatus] Error emitting socket event:', socketError);
      }

      return ResponseHelper.success(res, 'Delivery status updated successfully', tracking);
    } catch (error: any) {
      console.error('[UpdateDeliveryStatus] Error:', error);
      return ResponseHelper.error(res, error.message || 'Failed to update delivery status', 500);
    }
  });

  /**
   * Get delivery tracking information
   * GET /api/v1/bookings/:id/delivery/tracking
   */
  public getDeliveryTracking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Get booking
      const bookingResult = await BookingService.getById(id);
      if (!bookingResult.success || !bookingResult.data) {
        return ResponseHelper.notFound(res, 'Booking not found');
      }

      const booking = bookingResult.data;

      // Check authorization
      if (booking.owner_id !== req.user.id && booking.renter_id !== req.user.id) {
        return ResponseHelper.forbidden(res, 'Not authorized to view this booking');
      }

      // Get tracking from metadata
      const tracking = (booking.metadata as any)?.delivery_tracking || {
        status: booking.delivery_status || 'scheduled',
        updates: []
      };

      return ResponseHelper.success(res, tracking, 'Delivery tracking retrieved successfully');
    } catch (error: any) {
      console.error('[GetDeliveryTracking] Error:', error);
      return ResponseHelper.error(res, error.message || 'Failed to get delivery tracking', 500);
    }
  });

  /**
   * Get available delivery time windows
   * GET /api/v1/bookings/delivery/available-time-windows
   */
  public getAvailableTimeWindows = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { date } = req.query;

      if (!date || typeof date !== 'string') {
        return ResponseHelper.badRequest(res, 'Date parameter is required');
      }

      // Validate date format
      const deliveryDate = new Date(date);
      if (isNaN(deliveryDate.getTime())) {
        return ResponseHelper.badRequest(res, 'Invalid date format');
      }

      // Get available time windows
      const windows = DeliveryService.getAvailableTimeWindows(date);

      return ResponseHelper.success(res, 'Available time windows retrieved successfully', windows);
    } catch (error: any) {
      console.error('[GetAvailableTimeWindows] Error:', error);
      return ResponseHelper.error(res, error.message || 'Failed to get available time windows', 500);
    }
  });
}

export default new BookingsController();
