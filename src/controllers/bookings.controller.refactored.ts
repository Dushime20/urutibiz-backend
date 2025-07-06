/**
 * Refactored High-Performance Booking Management Controller
 * 
 * Applied refactoring patterns:
 * - Method extraction for complex booking operations
 * - Cache management for booking data
 * - Validation pipeline for booking rules
 * - Centralized error handling
 * - Concurrent booking protection
 * 
 * @version 3.0.0 - Refactored for Maintainability
 */

import { Response } from 'express';
import { EnhancedBaseController } from './EnhancedBaseController';
import BookingService from '@/services/BookingService';
import ProductService from '@/services/ProductService';
import { AuthenticatedRequest, CreateBookingData } from '@/types';
import { NotFoundError, ForbiddenError, ConflictError } from '@/utils/ErrorHandler';

/**
 * Refactored Bookings Controller with improved maintainability
 */
export class RefactoredBookingsController extends EnhancedBaseController {
  private concurrentBookingLocks = new Map<string, Promise<any>>();

  /**
   * Create new booking with enhanced validation
   * POST /api/v1/bookings
   */
  public createBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const renterId = req.user.id;
    const bookingData: CreateBookingData = req.body;

    // Validate booking data using validation chain
    const validation = await this.validateRequest('bookingCreation', {
      userId: renterId,
      productId: bookingData.productId,
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      requireKyc: true
    });

    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Prevent concurrent bookings for same time slot
    const lockKey = this.generateBookingLockKey(bookingData);
    if (this.concurrentBookingLocks.has(lockKey)) {
      throw new ConflictError('Another booking is being processed for this time slot. Please try again.');
    }

    try {
      // Create booking with concurrency protection
      const bookingPromise = this.processBookingCreation(renterId, bookingData);
      this.concurrentBookingLocks.set(lockKey, bookingPromise);
      
      const booking = await bookingPromise;
      
      // Invalidate related caches
      await this.invalidateBookingCaches(renterId, bookingData.productId);
      
      this.logAction('CREATE_BOOKING', renterId, booking.id, { productId: bookingData.productId });
      return this.sendSuccess(res, 'Booking created successfully', booking);
    } finally {
      this.concurrentBookingLocks.delete(lockKey);
    }
  });

  /**
   * Get user bookings with filtering and pagination
   * GET /api/v1/bookings
   */
  public getUserBookings = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user.id;
    const { page, limit } = this.getPaginationParams(req as any);
    const { sortBy, sortOrder } = this.getSortParams(req as any);
    const role = (req.query.role as 'renter' | 'owner') || 'renter';

    // Get cached or fresh data
    const bookings = await this.getCachedOrFetch(
      'bookings',
      { userId, role, page, limit, sortBy, sortOrder },
      () => this.fetchUserBookings(userId, role, page, limit, sortBy, sortOrder),
      120 // 2 minutes TTL
    );

    this.logAction('GET_USER_BOOKINGS', userId, undefined, { role });
    return this.sendSuccess(res, 'Bookings retrieved successfully', bookings);
  });

  /**
   * Get single booking details
   * GET /api/v1/bookings/:id
   */
  public getBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Get booking data
    const booking = await this.getBookingWithAccess(id, userId, req.user.role);
    
    this.logAction('GET_BOOKING', userId, id);
    return this.sendSuccess(res, 'Booking retrieved successfully', booking);
  });

  /**
   * Update booking details
   * PUT /api/v1/bookings/:id
   */
  public updateBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate access and get booking
    const booking = await this.getBookingWithAccess(id, userId, req.user.role);
    
    // Validate update permissions
    this.validateBookingUpdatePermissions(booking, userId, req.user.role);
    
    // Prepare update data
    const updateData = this.prepareBookingUpdateData(req.body, booking.status);
    
    // Perform update
    const updatedBooking = await this.performBookingUpdate(id, updateData);
    
    // Invalidate caches
    await this.invalidateBookingCaches(booking.renterId, booking.productId);
    
    this.logAction('UPDATE_BOOKING', userId, id, updateData);
    return this.sendSuccess(res, 'Booking updated successfully', updatedBooking);
  });

  /**
   * Cancel booking
   * POST /api/v1/bookings/:id/cancel
   */
  public cancelBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    // Validate access and get booking
    const booking = await this.getBookingWithAccess(id, userId, req.user.role);
    
    // Validate cancellation permissions
    this.validateCancellationPermissions(booking, userId);
    
    // Process cancellation
    const cancelledBooking = await this.processCancellation(booking, reason, userId);
    
    // Invalidate caches
    await this.invalidateBookingCaches(booking.renterId, booking.productId);
    
    this.logAction('CANCEL_BOOKING', userId, id, { reason });
    return this.sendSuccess(res, 'Booking cancelled successfully', cancelledBooking);
  });

  /**
   * Check-in to booking
   * POST /api/v1/bookings/:id/checkin
   */
  public checkIn = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate access and get booking
    const booking = await this.getBookingWithAccess(id, userId, req.user.role);
    
    // Validate check-in permissions
    this.validateCheckInPermissions(booking, userId);
    
    // Process check-in
    const checkedInBooking = await this.processCheckIn(booking, userId);
    
    // Invalidate caches
    await this.invalidateBookingCaches(booking.renterId, booking.productId);
    
    this.logAction('CHECKIN_BOOKING', userId, id);
    return this.sendSuccess(res, 'Check-in completed successfully', checkedInBooking);
  });

  /**
   * Check-out from booking
   * POST /api/v1/bookings/:id/checkout
   */
  public checkOut = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate access and get booking
    const booking = await this.getBookingWithAccess(id, userId, req.user.role);
    
    // Validate check-out permissions
    this.validateCheckOutPermissions(booking, userId);
    
    // Process check-out
    const checkedOutBooking = await this.processCheckOut(booking, userId);
    
    // Invalidate caches
    await this.invalidateBookingCaches(booking.renterId, booking.productId);
    
    this.logAction('CHECKOUT_BOOKING', userId, id);
    return this.sendSuccess(res, 'Check-out completed successfully', checkedOutBooking);
  });

  /**
   * Confirm booking (approve/accept)
   * POST /api/v1/bookings/:id/confirm
   */
  public confirmBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate access and get booking
    const booking = await this.getBookingWithAccess(id, userId, req.user.role);
    this.validateBookingConfirmation(booking, userId);

    // Process confirmation with atomic operation
    const confirmedBooking = await this.processBookingConfirmation(booking, userId);

    // Cache management
    await this.invalidateBookingCaches(booking.renterId, booking.productId);

    this.logAction('CONFIRM_BOOKING', userId, id);
    return this.sendSuccess(res, 'Booking confirmed successfully', confirmedBooking);
  });

  /**
   * Get booking timeline/history
   * GET /api/v1/bookings/:id/timeline
   */
  public getBookingTimeline = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify access to booking
    await this.getBookingWithAccess(id, userId, req.user.role);
    
    // Get timeline with caching
    const timeline = await this.getCachedOrFetch(
      'bookingTimeline',
      { bookingId: id },
      () => this.getBookingTimelineData(id),
      300 // 5 minutes cache
    );

    this.logAction('GET_BOOKING_TIMELINE', userId, id);
    return this.sendSuccess(res, 'Timeline retrieved successfully', timeline);
  });

  /**
   * Get booking status history
   * GET /api/v1/bookings/:id/status-history
   */
  public getBookingStatusHistory = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify access to booking
    await this.getBookingWithAccess(id, userId, req.user.role);
    
    // Get status history with caching
    const statusHistory = await this.getCachedOrFetch(
      'bookingStatusHistory',
      { bookingId: id },
      () => this.getBookingStatusHistoryData(id),
      600 // 10 minutes cache
    );

    this.logAction('GET_BOOKING_STATUS_HISTORY', userId, id);
    return this.sendSuccess(res, 'Status history retrieved successfully', statusHistory);
  });

  // ===== EXTRACTED HELPER METHODS =====

  /**
   * Generate unique lock key for concurrent booking protection
   */
  private generateBookingLockKey(bookingData: CreateBookingData): string {
    return `booking_${bookingData.productId}_${bookingData.startDate}_${bookingData.endDate}`;
  }

  /**
   * Process booking creation with validation and pricing
   */
  private async processBookingCreation(renterId: string, bookingData: CreateBookingData): Promise<any> {
    // Get product details and validate availability
    const product = await this.getProductForBooking(bookingData.productId);
    
    // Calculate pricing
    const pricing = this.calculateBookingPricing(product, bookingData.startDate, bookingData.endDate);
    
    // Create booking with calculated data
    const bookingPayload = {
      ...bookingData,
      renterId,
      ownerId: product.ownerId,
      totalCost: pricing.totalAmount,
      currency: product.currency,
      status: 'pending'
    };

    const result = await BookingService.create(bookingPayload);
    if (!result.success) {
      throw new Error(result.error || 'Failed to create booking');
    }

    return result.data;
  }

  /**
   * Get product details for booking
   */
  private async getProductForBooking(productId: string): Promise<any> {
    const result = await ProductService.getById(productId);
    if (!result.success) {
      throw new NotFoundError(`Product with ID ${productId} not found`);
    }
    return result.data;
  }

  /**
   * Calculate booking pricing
   */
  private calculateBookingPricing(product: any, startDate: string, endDate: string): any {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    
    const subtotal = product.basePrice * totalDays;
    const platformFee = subtotal * 0.1; // 10% platform fee
    const taxAmount = subtotal * 0.08; // 8% tax
    const totalAmount = subtotal + platformFee + taxAmount;

    return {
      basePrice: product.basePrice,
      totalDays,
      subtotal,
      platformFee,
      taxAmount,
      totalAmount
    };
  }

  /**
   * Fetch user bookings with role-based filtering
   */
  private async fetchUserBookings(
    userId: string, 
    role: 'renter' | 'owner', 
    page: number, 
    limit: number, 
    sortBy: string, 
    sortOrder: 'asc' | 'desc'
  ): Promise<any> {
    const filters = role === 'renter' ? { renterId: userId } : { ownerId: userId };
    
    const result = await BookingService.getPaginated(filters, page, limit, sortBy, sortOrder);
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch bookings');
    }
    
    return result.data;
  }

  /**
   * Get booking with access validation
   */
  private async getBookingWithAccess(bookingId: string, userId: string, userRole?: string): Promise<any> {
    const result = await BookingService.getById(bookingId);
    if (!result.success) {
      throw new NotFoundError(`Booking with ID ${bookingId} not found`);
    }

    const booking = result.data;
    const hasAccess = this.checkBookingAccess(booking, userId, userRole);
    
    if (!hasAccess) {
      throw new ForbiddenError('Not authorized to access this booking');
    }

    return booking;
  }

  /**
   * Check booking access permissions
   */
  private checkBookingAccess(booking: any, userId: string, userRole?: string): boolean {
    const isRenter = booking.renterId === userId;
    const isOwner = booking.ownerId === userId;
    const isAdmin = userRole === 'admin';
    
    return isRenter || isOwner || isAdmin;
  }

  /**
   * Validate booking update permissions
   */
  private validateBookingUpdatePermissions(booking: any, userId: string, userRole?: string): void {
    const isRenter = booking.renterId === userId;
    const isOwner = booking.ownerId === userId;
    const isAdmin = userRole === 'admin';
    
    if (!isRenter && !isOwner && !isAdmin) {
      throw new ForbiddenError('Not authorized to update this booking');
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      throw new Error('Cannot update completed or cancelled bookings');
    }
  }

  /**
   * Prepare booking update data
   */
  private prepareBookingUpdateData(body: any, currentStatus: string): any {
    const allowedFields = ['specialInstructions', 'renterNotes'];
    
    // Only allow status updates for pending bookings
    if (currentStatus === 'pending' && body.status) {
      allowedFields.push('status');
    }
    
    return this.prepareUpdateData(body, allowedFields);
  }

  /**
   * Perform booking update
   */
  private async performBookingUpdate(id: string, updateData: any): Promise<any> {
    const result = await BookingService.update(id, updateData);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update booking');
    }
    return result.data;
  }

  /**
   * Validate cancellation permissions
   */
  private validateCancellationPermissions(booking: any, userId: string): void {
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      throw new Error('Cannot cancel completed or already cancelled bookings');
    }

    const isRenter = booking.renterId === userId;
    const isOwner = booking.ownerId === userId;
    
    if (!isRenter && !isOwner) {
      throw new ForbiddenError('Not authorized to cancel this booking');
    }
  }

  /**
   * Process booking cancellation
   */
  private async processCancellation(booking: any, reason: string, userId: string): Promise<any> {
    const updateData = {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelledBy: userId,
      cancellationReason: reason
    };

    return await this.performBookingUpdate(booking.id, updateData);
  }

  /**
   * Validate check-in permissions
   */
  private validateCheckInPermissions(booking: any, userId: string): void {
    if (booking.status !== 'confirmed') {
      throw new Error('Booking must be confirmed to check-in');
    }

    if (booking.renterId !== userId && booking.ownerId !== userId) {
      throw new ForbiddenError('Not authorized to check-in this booking');
    }
  }

  /**
   * Process check-in
   */
  private async processCheckIn(booking: any, userId: string): Promise<any> {
    const updateData = {
      status: 'in_progress',
      checkinTime: new Date().toISOString(),
      checkedInBy: userId
    };

    return await this.performBookingUpdate(booking.id, updateData);
  }

  /**
   * Validate check-out permissions
   */
  private validateCheckOutPermissions(booking: any, userId: string): void {
    if (booking.status !== 'in_progress') {
      throw new Error('Booking must be in progress to check-out');
    }

    if (booking.renterId !== userId && booking.ownerId !== userId) {
      throw new ForbiddenError('Not authorized to check-out this booking');
    }
  }

  /**
   * Process check-out
   */
  private async processCheckOut(booking: any, userId: string): Promise<any> {
    const updateData = {
      status: 'completed',
      checkoutTime: new Date().toISOString(),
      checkedOutBy: userId
    };

    return await this.performBookingUpdate(booking.id, updateData);
  }

  /**
   * Validate booking confirmation
   */
  private validateBookingConfirmation(booking: any, userId: string): void {
    const isOwner = booking.ownerId === userId;
    const isPending = booking.status === 'pending';

    if (!isOwner || !isPending) {
      throw new ForbiddenError('Not authorized to confirm this booking');
    }
  }

  /**
   * Process booking confirmation
   */
  private async processBookingConfirmation(booking: any, userId: string): Promise<any> {
    const updateData = {
      status: 'confirmed',
      confirmedAt: new Date().toISOString(),
      confirmedBy: userId
    };

    return await this.performBookingUpdate(booking.id, updateData);
  }

  /**
   * Invalidate booking-related caches
   */
  private async invalidateBookingCaches(renterId: string, productId: string): Promise<void> {
    await Promise.all([
      this.invalidateEntityCache('bookings', renterId),
      this.invalidateEntityCache('bookings', productId),
      this.invalidateEntityCache('products', productId)
    ]);
  }

  /**
   * Get booking timeline data
   */
  private async getBookingTimelineData(bookingId: string): Promise<any[]> {
    // Simplified timeline implementation
    const db = require('@/config/database').getDatabase();
    
    return await db('booking_status_history')
      .select('status', 'created_at', 'notes', 'changed_by')
      .where({ booking_id: bookingId })
      .orderBy('created_at', 'asc');
  }

  /**
   * Get booking status history data
   */
  private async getBookingStatusHistoryData(bookingId: string): Promise<any[]> {
    // Simplified status history implementation
    const db = require('@/config/database').getDatabase();
    
    return await db('booking_status_history')
      .select('*')
      .where({ booking_id: bookingId })
      .orderBy('created_at', 'desc');
  }
}

export default new RefactoredBookingsController();
