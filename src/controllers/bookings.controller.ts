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
import BookingStatusHistoryService from '@/services/BookingStatusHistoryService';
import paymentMethodService from '@/services/PaymentMethodService';
import { 
  AuthenticatedRequest,
  CreateBookingData,
  BookingFilters,
  BookingData
} from '@/types';
import { InsuranceType } from '@/types/booking.types';
import { ResponseHelper } from '@/utils/response';

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
    filters.renter_id = user_id;
  } else if (role === 'owner') {
    filters.owner_id = user_id;
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
  
  if (filters.renter_id) query.renter_id = filters.renter_id;
  if (filters.owner_id) query.owner_id = filters.owner_id;
  if (filters.product_id) query.product_id = filters.product_id;
  if (filters.status) query.status = filters.status;
  if (filters.payment_status) query.payment_status = filters.payment_status;
  
  if (filters.start_date) {
    const date = new Date(filters.start_date);
    if (!isNaN(date.getTime())) {
      query.start_date = date.toISOString();
    }
  }
  if (filters.end_date) {
    const date = new Date(filters.end_date);
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
      pickup_address,
      delivery_address,
      pickup_coordinates,
      delivery_coordinates,
      special_instructions,
      renter_notes,
      insurance_type,
      security_deposit,
      metadata,
      check_in_time,
      check_out_time,
      parent_booking_id
    }: CreateBookingData = req.body;

    // Performance: Concurrent booking prevention using lock
    const lockKey = `booking_${product_id}_${start_date}_${end_date}`;
    
    if (bookingLocks.has(lockKey)) {
      return ResponseHelper.error(res, 'Another booking is being processed for this time slot. Please try again.', 409);
    }

    const bookingPromise = this.processBookingCreation(res, req.user.id, req.user, {
      product_id,
      owner_id,
      start_date,
      end_date,
      pickup_time,
      return_time,
      pickup_method,
      pickup_address,
      delivery_address,
      pickup_coordinates,
      delivery_coordinates,
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
    const cached = bookingCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL.BOOKING_LIST * 1000) {
      return this.formatPaginatedResponse(res, 'Bookings retrieved successfully (cached)', cached.data);
    }

    // Convert to optimized query
    const query = convertFiltersToQuery(filters);
    
    const result = await BookingService.getPaginated(query, page, limit, sortBy, sortOrder);

    this.logAction('GET_USER_BOOKINGS', user_id, undefined, { role, filters });

    if (!result.success || !result.data) {
      return ResponseHelper.error(res, result.error || 'Failed to fetch bookings', 400);
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
      return ResponseHelper.error(res, result.error || 'Failed to fetch status history', 400);
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
      return ResponseHelper.error(res, result.error || 'Failed to fetch status analytics', 400);
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
      return ResponseHelper.error(res, result.error || 'Failed to fetch status statistics', 400);
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
    }

    // Performance: Invalidate related caches
    this.invalidateBookingCaches(booking.renter_id, booking.owner_id, id);

    this.logAction('UPDATE_BOOKING', user_id, id, updateData);

    return ResponseHelper.success(res, 'Booking updated successfully', updatedBooking.toJSON());
  });

  /**
   * High-performance booking cancellation
   * POST /api/v1/bookings/:id/cancel
   */
  public cancelBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { reason }: { reason?: string } = req.body;
    const user_id = req.user.id;

    // Performance: Use optimized model method
    const booking = await Booking.findById(id);
    if (!booking) {
      return this.handleNotFound(res, 'Booking');
    }

    // Authorization check
    if (!this.checkBookingAccess(booking, user_id)) {
      return this.handleUnauthorized(res, 'Not authorized to cancel this booking');
    }

    // Status validation
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return this.handleBadRequest(res, 'Booking cannot be cancelled at this stage');
    }

    const cancelledBooking = await booking.cancel(user_id, reason);

    // Record status change in audit trail
    await this.recordStatusChange(
      id,
      booking.status,
      'cancelled',
      user_id,
      reason,
      'Booking cancelled by user'
    );

    // Performance: Invalidate related caches
    this.invalidateBookingCaches(booking.renter_id, booking.owner_id, id);

    this.logAction('CANCEL_BOOKING', user_id, id, { reason });

    return ResponseHelper.success(res, 'Booking cancelled successfully', cancelledBooking.toJSON());
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

    // Record status change in audit trail
    await this.recordStatusChange(
      id,
      booking.status,
      'confirmed',
      user_id,
      undefined,
      'Booking confirmed by owner'
    );

    // Performance: Invalidate related caches
    this.invalidateBookingCaches(booking.renter_id, booking.owner_id, id);

    this.logAction('CONFIRM_BOOKING', user_id, id);

    return ResponseHelper.success(res, 'Booking confirmed successfully', confirmedBooking.toJSON());
  });

  /**
   * High-performance check-in process
   * POST /api/v1/bookings/:id/checkin
   */
  public checkIn = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user_id = req.user.id;

    const booking = await Booking.findById(id);
    if (!booking) {
      return this.handleNotFound(res, 'Booking');
    }

    if (!this.checkBookingAccess(booking, user_id) && req.user.role !== 'admin') {
      return this.handleUnauthorized(res, 'Not authorized to check-in this booking');
    }

    if (booking.status !== 'confirmed') {
      return this.handleBadRequest(res, 'Booking must be confirmed before check-in');
    }

    const updatedBooking = await booking.checkIn(user_id);

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
    const userId = req.user.id;

    const booking = await Booking.findById(id);
    if (!booking) {
      return this.handleNotFound(res, 'Booking');
    }

    if (!this.checkBookingAccess(booking, userId) && req.user.role !== 'admin') {
      return this.handleUnauthorized(res, 'Not authorized to check-out this booking');
    }

    if (booking.status !== 'in_progress') {
      return this.handleBadRequest(res, 'Booking must be in progress to check-out');
    }

    const updatedBooking = await booking.checkOut(userId);

    // Record status change in audit trail
    await this.recordStatusChange(
      id,
      booking.status,
      'completed',
      userId,
      undefined,
      'Booking check-out completed'
    );

    // Performance: Invalidate related caches
    this.invalidateBookingCaches(booking.renter_id, booking.owner_id, id);

    this.logAction('CHECKOUT_BOOKING', userId, id);

    return ResponseHelper.success(res, 'Check-out completed successfully', updatedBooking.toJSON());
  });

  /**
   * Optimized booking timeline with caching
   * GET /api/v1/bookings/:id/timeline
   */
  public getBookingTimeline = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user.id;

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

    if (!this.checkBookingAccess(booking, userId) && req.user.role !== 'admin') {
      return this.handleUnauthorized(res, 'Not authorized to view this booking timeline');
    }

    const timeline = await booking.getTimeline();

    // Cache the result
    timelineCache.set(cacheKey, {
      data: timeline,
      timestamp: Date.now()
    });

    this.logAction('GET_BOOKING_TIMELINE', userId, id);

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
    const userId = req.user.id;

    const booking = await Booking.findById(id);
    if (!booking) {
      return this.handleNotFound(res, 'Booking');
    }

    if (!this.checkBookingAccess(booking, userId) && req.user.role !== 'admin') {
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
    
    updateData.lastModifiedBy = userId;

    const updatedBooking = await booking.update(updateData);

    // Performance: Invalidate related caches
    this.invalidateBookingCaches(booking.renter_id, booking.owner_id, id);

    this.logAction('RECORD_CONDITION', userId, id, { conditionType, condition });

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
    const userId = req.user.id;

    const booking = await Booking.findById(id);
    if (!booking) {
      return this.handleNotFound(res, 'Booking');
    }

    if (!this.checkBookingAccess(booking, userId) && req.user.role !== 'admin') {
      return this.handleUnauthorized(res, 'Not authorized to update insurance for this booking');
    }

    // Can only update insurance before confirmation
    if (!['pending'].includes(booking.status)) {
      return this.handleBadRequest(res, 'Insurance can only be updated for pending bookings');
    }

    // Recalculate pricing with new insurance
    const product = await ProductService.getById(booking.product_id);
    if (!product.success || !product.data) {
      return ResponseHelper.error(res, 'Product not found', 404);
    }

    const newPricing = this.calculateBookingPricing(
      product.data, 
      booking.start_date.toISOString(), 
      booking.end_date.toISOString(), 
      insuranceType
    );

    const updateData = {
      insuranceType,
      insurancePolicyNumber: policyNumber,
      insuranceDetails,
      pricing: newPricing,
      totalAmount: newPricing.totalAmount,
      lastModifiedBy: userId
    };

    const updatedBooking = await booking.update({
      insuranceType,
      insurancePolicyNumber: policyNumber,
      insuranceDetails,
      pricing: newPricing,
      totalAmount: newPricing.totalAmount,
      lastModifiedBy: userId
    } as any); // Cast to any to bypass type error, or update UpdateBookingData type accordingly

    // Performance: Invalidate related caches
    this.invalidateBookingCaches(booking.renter_id, booking.owner_id, id);

    this.logAction('UPDATE_INSURANCE', userId, id, { insuranceType, policyNumber });

    return ResponseHelper.success(res, 'Booking insurance updated successfully', updatedBooking.toJSON());
  });

  /**
   * Set payment method for booking
   * POST /api/v1/bookings/:id/payment-method
   */
  public setBookingPaymentMethod = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { paymentMethodId }: { paymentMethodId: string } = req.body;
    const userId = req.user.id;

    if (!paymentMethodId) {
      return this.handleBadRequest(res, 'Payment method ID is required');
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return this.handleNotFound(res, 'Booking');
    }

    if (!this.checkBookingAccess(booking, userId) && req.user.role !== 'admin') {
      return this.handleUnauthorized(res, 'Not authorized to modify this booking');
    }

    // Verify payment method belongs to the user
    const paymentMethodResult = await paymentMethodService.getById(paymentMethodId);
    if (!paymentMethodResult.success) {
      return this.handleBadRequest(res, 'Payment method not found');
    }

    if (paymentMethodResult.data?.userId !== userId) {
      return this.handleUnauthorized(res, 'Payment method does not belong to user');
    }

    if (!paymentMethodResult.data?.isVerified) {
      return this.handleBadRequest(res, 'Payment method must be verified before use');
    }

    // Update booking with payment method
    const updatedBooking = await booking.update({
      payment_method_id: paymentMethodId,
      last_modified_by: userId
    });
    // Performance: Invalidate related caches
    this.invalidateBookingCaches(booking.renter_id, booking.owner_id, id);

    this.logAction('SET_PAYMENT_METHOD', userId, id, { paymentMethodId });

    return ResponseHelper.success(res, 'Payment method set successfully', updatedBooking.toJSON());
  });

  /**
   * Get user's available payment methods for booking
   * GET /api/v1/bookings/:id/payment-methods
   */
  public getBookingPaymentMethods = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findById(id);
    if (!booking) {
      return this.handleNotFound(res, 'Booking');
    }

    if (!this.checkBookingAccess(booking, userId) && req.user.role !== 'admin') {
      return this.handleUnauthorized(res, 'Not authorized to view this booking');
    }

    // Get user's verified payment methods
    const result = await paymentMethodService.getPaginated(
      { userId, isVerified: true },
      1,
      50
    );

    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to fetch payment methods', 400);
    }

    this.logAction('GET_BOOKING_PAYMENT_METHODS', userId, id);

    return ResponseHelper.success(res, 'Payment methods retrieved successfully', result.data);
  });

  // === PRIVATE HELPER METHODS ===

  /**
   * Process booking creation with optimizations
   */
  private async processBookingCreation(res: Response, renterId: string, user: any, bookingData: Omit<CreateBookingData, 'renter_id'>) {
    const renter_id = renterId;
    const { 
      product_id,
      owner_id,
      start_date, 
      end_date, 
      pickup_time,
      return_time,
      pickup_method,
      pickup_address,
      delivery_address,
      pickup_coordinates,
      delivery_coordinates,
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
    const [productResult, isVerified] = await Promise.all([
      ProductService.getById(product_id),
      UserVerificationService.isUserFullyKycVerified(renter_id)
    ]);

    if (!productResult.success || !productResult.data) {
      return ResponseHelper.error(null as any, 'Product not found', 404);
    }

    const product = productResult.data;

    if (product.owner_id === renter_id) {
      return ResponseHelper.error(null as any, 'You cannot book your own product', 400);
    }

    if (!isVerified) {
      return ResponseHelper.error(null as any, 'You must complete KYC verification to book or rent.', 403);
    }

    // Performance: Optimized pricing calculation
    const pricing = this.calculateBookingPricing(product, start_date, end_date, insurance_type);
    const total_amount = pricing.totalAmount;
    const base_amount = pricing.subtotal;

    // Generate unique booking number
    const bookingNumber = this.generateBookingNumber();

    // Calculate AI risk score (placeholder implementation)
    const aiRiskScore = await this.calculateAIRiskScore(renter_id, product_id, { startDate: start_date, endDate: end_date });

    // Determine if this is a repeat booking
    const isRepeatBooking = !!parent_booking_id;

    const finalBookingData = {
      renter_id,
      owner_id,
      product_id,
      booking_number: bookingNumber,
      start_date: new Date(start_date).toISOString(),
      end_date: new Date(end_date).toISOString(),
      check_in_time: check_in_time ? new Date(check_in_time).toISOString() : undefined,
      check_out_time: check_out_time ? new Date(check_out_time).toISOString() : undefined,
      pickup_time,
      return_time,
      pickup_method,
      pickup_address,
      delivery_address,
      pickup_coordinates,
      delivery_coordinates,
      special_instructions,
      renter_notes,
      insurance_type: insurance_type || 'none',
      security_deposit,
      ai_risk_score: aiRiskScore,
      pricing,
      total_amount, // ensure not null
      base_amount,  // ensure not null
      metadata,
      is_repeat_booking: isRepeatBooking,
      parent_booking_id,
      created_by: renter_id,
      last_modified_by: renter_id,
      user // Attach the authenticated user object for business rules
    };

    const created = await BookingService.create(finalBookingData);
    if (!created.success || !created.data) {
      return ResponseHelper.error(res, created.error || 'Failed to create booking', 400);
    }
    // Add this null check before sending success response
    if (!created.data) {
      return ResponseHelper.error(res, 'Booking creation failed: no data returned', 500);
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
    }
    // Performance: Invalidate related caches
    this.invalidateBookingCaches(renter_id, owner_id);
    // Log action would be handled in the main method
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
   */
  private calculateBookingPricing(product: any, startDate: string, endDate: string, insuranceType?: InsuranceType) {
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const totalDays = Math.max(1, Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)));
    
    const subtotal = product.basePrice * totalDays;
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
      basePrice: product.basePrice,
      currency: product.currency || 'USD',
      totalDays,
      subtotal,
      platformFee,
      taxAmount,
      insuranceFee,
      totalAmount,
      securityDeposit: product.securityDeposit || 0,
      discountAmount: 0 // Could be calculated based on promotions
    };
  }

  /**
   * Check booking access authorization
   */
  private checkBookingAccess(booking: any, userId: string): boolean {
    return booking.renterId === userId || booking.ownerId === userId;
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
}

export default new BookingsController();
