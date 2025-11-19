import { OptimizedBaseRepository } from './BaseRepository.optimized';
import Booking from '@/models/Booking.model';
import { BookingData, CreateBookingData, UpdateBookingData } from '@/types/booking.types';
import { getDatabase } from '@/config/database';

class BookingRepository extends OptimizedBaseRepository<BookingData, CreateBookingData, UpdateBookingData> {
  protected readonly tableName = 'bookings';
  protected readonly modelClass = Booking as any;
  private knex = getDatabase();
  
  constructor() {
    super();
    
    // Configure search fields for bookings
    this.searchFields = ['booking_reference', 'status', 'notes'];
    
    // Configure cache settings for bookings (shorter cache due to frequent updates)
    this.defaultCacheTTL = 60; // 1 minute
    this.cacheKeyPrefix = 'booking';
  }

  // Override create to remove features from payload if present
  async create(data: CreateBookingData) {
    const { features, ...safeData } = data as any;
    return await super.create(safeData);
  }

  /**
   * Get bookings by user with optimized pagination
   */
  async getBookingsByUser(userId: string, page: number = 1, limit: number = 20) {
    const filters: any = { user_id: userId };
    const result = await this.findWithPagination(filters, page, limit, ['-created_at']);
    return result.success ? result.data : { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
  }
  
  /**
   * Get bookings by status with batch processing
   */
  async getBookingsByStatus(status: string, limit: number = 100) {
    const result = await this.batchFindBy('status', [status], limit);
    return result.success ? result.data : [];
  }

  /**
   * Check if a user already has an active booking for a given item
   * An "active" booking is one that is either pending, confirmed, or in_progress
   */
  async findActiveByUserAndItem(renter_id: string, product_id: string) {
    try {
      const booking = await this.knex('bookings')
        .where({ renter_id, product_id })
        .whereIn('status', ['pending', 'confirmed', 'in_progress'])
        .first();
      
      return booking || null;
    } catch (error) {
      console.error('Error checking for active booking:', error);
      throw new Error('Failed to check for existing booking');
    }
  }

  /**
   * Check for overlapping bookings for the same user and product within specific dates
   * This allows users to rebook the same item after their previous rental has ended
   * 
   * Fix: Normalize dates to timestamps to avoid timezone comparison issues
   */
  async findConflictingBooking(renter_id: string, product_id: string, start_date: string, end_date: string) {
    try {
      // Normalize input dates to UTC timestamps to ensure proper comparison
      // This avoids timezone issues when comparing date strings with database timestamps
      const normalizeDate = (dateStr: string): string => {
        // If it's just a date string (YYYY-MM-DD), normalize to UTC midnight
        // This ensures consistent comparison regardless of server timezone
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Parse as UTC midnight to avoid timezone conversion issues
          return `${dateStr}T00:00:00.000Z`;
        }
        // If it's already a timestamp, ensure it's in ISO format
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid date format: ${dateStr}`);
        }
        return date.toISOString();
      };

      const normalizedStartDate = normalizeDate(start_date);
      const normalizedEndDate = normalizeDate(end_date);

      // Debug logging to help diagnose date comparison issues
      console.log('[findConflictingBooking] Date comparison:', {
        renter_id,
        product_id,
        input_start_date: start_date,
        input_end_date: end_date,
        normalized_start_date: normalizedStartDate,
        normalized_end_date: normalizedEndDate
      });

      // Use proper timestamp comparison - PostgreSQL will handle timezone conversion
      // existing booking overlaps with new booking if:
      // existing_start_date <= new_end_date AND existing_end_date >= new_start_date
      const booking = await this.knex('bookings')
        .where({ renter_id, product_id })
        .whereIn('status', ['pending', 'confirmed', 'in_progress']) // Keep pending for same-user duplicate prevention
        .where(function() {
          this.whereRaw('start_date::timestamptz <= ?::timestamptz', [normalizedEndDate])
              .andWhereRaw('end_date::timestamptz >= ?::timestamptz', [normalizedStartDate]);
        })
        .first();

      if (booking) {
        console.log('[findConflictingBooking] Found conflicting booking:', {
          booking_id: booking.id,
          booking_start_date: booking.start_date,
          booking_end_date: booking.end_date,
          booking_status: booking.status,
          new_start_date: normalizedStartDate,
          new_end_date: normalizedEndDate
        });
      }
      
      return booking || null;
    } catch (error) {
      console.error('Error checking for conflicting booking:', error);
      throw new Error('Failed to check for overlapping booking');
    }
  }

  /**
   * Check for ALL overlapping bookings for a product (any user, any status)
   * This is the international standard approach - prevents double-booking by any user
   * 
   * Standard overlap detection algorithm:
   * Two time ranges overlap if: existing_start <= new_end AND existing_end >= new_start
   * 
   * @param product_id - The product to check
   * @param start_date - Start date/time of new booking (can be date-only or full timestamp)
   * @param end_date - End date/time of new booking (can be date-only or full timestamp)
   * @returns Array of conflicting bookings (empty if no conflicts)
   */
  async findAllConflictingBookingsForProduct(
    product_id: string, 
    start_date: string, 
    end_date: string
  ) {
    try {
      // Normalize input dates to UTC timestamps (including time)
      // This ensures consistent comparison regardless of timezone
      const normalizeTimestamp = (dateStr: string): string => {
        // If it's just a date string (YYYY-MM-DD), normalize to UTC midnight
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return `${dateStr}T00:00:00.000Z`;
        }
        // If it's already a timestamp, ensure it's in ISO format
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid date format: ${dateStr}`);
        }
        return date.toISOString();
      };

      const normalizedStartDate = normalizeTimestamp(start_date);
      const normalizedEndDate = normalizeTimestamp(end_date);

      console.log('[findAllConflictingBookingsForProduct] Checking conflicts:', {
        product_id,
        input_start_date: start_date,
        input_end_date: end_date,
        normalized_start_date: normalizedStartDate,
        normalized_end_date: normalizedEndDate
      });

      // Check for ALL conflicting bookings for this product (any user, confirmed/in_progress only)
      // Only check confirmed and in_progress bookings - pending bookings don't block availability
      // Standard overlap detection: existing_start <= new_end AND existing_end >= new_start
      // Use proper timestamp comparison with timezone handling
      const conflictingBookings = await this.knex('bookings')
        .where({ product_id })
        .whereIn('status', ['confirmed', 'in_progress']) // Only confirmed and in_progress block availability
        .where(function() {
          // Use whereRaw with timestamptz casting to ensure proper time comparison
          this.whereRaw('start_date::timestamptz <= ?::timestamptz', [normalizedEndDate])
              .andWhereRaw('end_date::timestamptz >= ?::timestamptz', [normalizedStartDate]);
        })
        .orderBy('start_date', 'asc');

      if (conflictingBookings.length > 0) {
        console.log('[findAllConflictingBookingsForProduct] Found conflicting bookings:', {
          count: conflictingBookings.length,
          bookings: conflictingBookings.map(b => ({
            id: b.id,
            renter_id: b.renter_id,
            start_date: b.start_date,
            end_date: b.end_date,
            status: b.status
          }))
        });
      }

      return conflictingBookings || [];
    } catch (error) {
      console.error('Error checking for conflicting bookings:', error);
      throw new Error('Failed to check for overlapping bookings');
    }
  }
}

export default new BookingRepository();
