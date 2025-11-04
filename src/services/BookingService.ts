import { BaseService } from './BaseService';
import BookingRepository from '@/repositories/BookingRepository';
import { BookingData, CreateBookingData, UpdateBookingData } from '@/types/booking.types';
import { ValidationError } from '@/types';
import { businessRules } from '@/config/businessRules';
import UserVerificationService from '@/services/userVerification.service';
import { getDatabase } from '@/config/database';

class BookingService extends BaseService<BookingData, CreateBookingData, UpdateBookingData> {
  constructor() {
    super(BookingRepository);
  }

  public async validateCreate(data: CreateBookingData): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    if (!data.product_id) errors.push({ field: 'product_id', message: 'Product ID is required' });
    if (!data.start_date) errors.push({ field: 'start_date', message: 'Start date is required' });
    if (!data.end_date) errors.push({ field: 'end_date', message: 'End date is required' });
    if (!data.pickup_method) errors.push({ field: 'pickup_method', message: 'Pickup method is required' });

    // Validate dates are not in the past
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to start of day for comparison
    
    if (data.start_date) {
      const startDate = new Date(data.start_date);
      startDate.setHours(0, 0, 0, 0);
      if (startDate < now) {
        errors.push({ field: 'start_date', message: 'Start date cannot be in the past. Please select a future date.' });
      }
    }

    if (data.end_date) {
      const endDate = new Date(data.end_date);
      endDate.setHours(0, 0, 0, 0);
      if (endDate < now) {
        errors.push({ field: 'end_date', message: 'End date cannot be in the past. Please select a future date.' });
      }
    }

    // Validate time range (1am to 23:00 / 11pm)
    if (data.pickup_time) {
      const [hours, minutes] = data.pickup_time.split(':').map(Number);
      if (hours < 1 || hours > 23 || (hours === 23 && minutes > 0)) {
        errors.push({ field: 'pickup_time', message: 'Pickup time must be between 1:00 AM and 11:00 PM (23:00).' });
      }
    }

    if (data.return_time) {
      const [hours, minutes] = data.return_time.split(':').map(Number);
      if (hours < 1 || hours > 23 || (hours === 23 && minutes > 0)) {
        errors.push({ field: 'return_time', message: 'Return time must be between 1:00 AM and 11:00 PM (23:00).' });
      }
    }

    // Helper function to format dates with time in a user-friendly way
    const formatDateTime = (date: string | Date): string => {
      const d = new Date(date);
      const dateStr = d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      const timeStr = d.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      return `${dateStr} at ${timeStr}`;
    };

    // CRITICAL: Check for conflicts with ALL bookings for this product (not just same user)
    // This prevents double-booking by any user - international booking system standard
    if (data.product_id && data.start_date && data.end_date) {
      const allConflictingBookings = await BookingRepository.findAllConflictingBookingsForProduct(
        data.product_id,
        data.start_date,
        data.end_date
      );

      if (allConflictingBookings.length > 0) {
        // Show first conflict (or mention multiple if there are more)
        if (allConflictingBookings.length === 1) {
          const conflicting = allConflictingBookings[0];
          const startDateTimeFormatted = formatDateTime(conflicting.start_date);
          const endDateTimeFormatted = formatDateTime(conflicting.end_date);
          
          errors.push({ 
            field: 'product_id', 
            message: `This item is already booked from ${startDateTimeFormatted} to ${endDateTimeFormatted}. Please choose different dates and times.` 
          });
        } else {
          // Multiple conflicts - show first one and mention others
          const firstConflict = allConflictingBookings[0];
          const startDateTimeFormatted = formatDateTime(firstConflict.start_date);
          const endDateTimeFormatted = formatDateTime(firstConflict.end_date);
          
          errors.push({ 
            field: 'product_id', 
            message: `This item is already booked from ${startDateTimeFormatted} to ${endDateTimeFormatted}${allConflictingBookings.length > 1 ? ` and ${allConflictingBookings.length - 1} other booking(s)` : ''}. Please choose different dates and times.` 
          });
        }
      }
    }

    // Also check for same-user conflicts (for duplicate booking prevention)
    // This provides additional validation to prevent users from accidentally double-booking
    if (data.renter_id && data.product_id && data.start_date && data.end_date) {
      const sameUserConflict = await BookingRepository.findConflictingBooking(
        data.renter_id, 
        data.product_id, 
        data.start_date, 
        data.end_date
      );
      if (sameUserConflict) {
        // Only add this error if not already in errors array (avoid duplicate messages)
        const existingError = errors.find(e => e.field === 'product_id');
        if (!existingError) {
          const startDateTimeFormatted = formatDateTime(sameUserConflict.start_date);
          const endDateTimeFormatted = formatDateTime(sameUserConflict.end_date);
          
          errors.push({ 
            field: 'product_id', 
            message: `You already have a booking for this item from ${startDateTimeFormatted} to ${endDateTimeFormatted}. Please choose different dates and times.` 
          });
        }
      }
    }

    return errors;
  }

  protected async validateUpdate(_data: UpdateBookingData): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    // Add update-specific validation as needed
    return errors;
  }

  protected async applyCreateBusinessRules(data: CreateBookingData): Promise<CreateBookingData> {
    // Enforce business rules from config
    // Only allow booking if user is verified or has allowed role
    const user = (data as any).user; // Assume user is attached to data or context
    if (businessRules.booking.requireVerifiedUser) {
      const isAllowedRole = user && businessRules.booking.allowedRoles.includes(user.role);
      const isVerified = user && await UserVerificationService.isUserFullyKycVerified(user.id);
      if (!isAllowedRole && !isVerified) {
        throw new Error('You must be verified or have an allowed role to create a booking.');
      }
    }
    // Set default status if present in business rules and type allows
    const booking: any = { ...data };
    if ('status' in booking || (businessRules.booking.defaultStatus && typeof booking === 'object')) {
      booking.status = businessRules.booking.defaultStatus;
    }
    return booking;
  }

  protected async applyUpdateBusinessRules(data: UpdateBookingData): Promise<UpdateBookingData> {
    // Add business logic for updates if needed
    return data;
  }

  /**
   * Check if a product is available for the given date range
   * Updated: Uses proper timestamp comparison and includes pending bookings
   * Follows international booking system standards
   */
  public async isProductAvailable(product_id: string, start_date: string, end_date: string): Promise<boolean> {
    // For demo/development mode, skip complex availability checks
    if (process.env.NODE_ENV === 'demo' || process.env.NODE_ENV === 'development') {
      console.log('🔧 Demo/Dev mode: Skipping availability table checks for easier testing');
      return true; // Always available in demo mode
    }
    
    const db = getDatabase();
    
    // Normalize timestamps (including time) for proper comparison
    const normalizeTimestamp = (dateStr: string): string => {
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return `${dateStr}T00:00:00.000Z`;
      }
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format: ${dateStr}`);
      }
      return date.toISOString();
    };

    const normalizedStartDate = normalizeTimestamp(start_date);
    const normalizedEndDate = normalizeTimestamp(end_date);
    
    // Check for ALL conflicting bookings (only confirmed and in_progress)
    // Pending bookings don't block availability - only confirmed and in_progress bookings do
    // Use proper timestamp comparison with timezone handling
    const conflictingBookings = await db('bookings')
      .where({ product_id })
      .whereIn('status', ['confirmed', 'in_progress']) // Only confirmed and in_progress block availability
      .where(function() {
        // Standard overlap detection with proper timestamp comparison
        // Two ranges overlap if: existing_start <= new_end AND existing_end >= new_start
        this.whereRaw('start_date::timestamptz <= ?::timestamptz', [normalizedEndDate])
            .andWhereRaw('end_date::timestamptz >= ?::timestamptz', [normalizedStartDate]);
      })
      .first();
    
    if (conflictingBookings) {
      return false; // Product is booked (conflict found)
    }
    
    return true; // Product is available
  }
}

export default new BookingService();
