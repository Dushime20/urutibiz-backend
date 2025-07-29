import { OptimizedBaseRepository } from './BaseRepository.optimized';
import Booking from '@/models/Booking.model';
import { BookingData, CreateBookingData, UpdateBookingData } from '@/types/booking.types';
import { getDatabase } from '@/config/database';

class BookingRepository extends OptimizedBaseRepository<BookingData, CreateBookingData, UpdateBookingData> {
  protected readonly tableName = 'bookings';
  protected readonly modelClass = Booking;
  private knex = getDatabase();
  
  constructor() {
    super();
    
    // Configure search fields for bookings
    this.searchFields = ['booking_reference', 'status', 'notes'];
    
    // Configure cache settings for bookings (shorter cache due to frequent updates)
    this.defaultCacheTTL = 60; // 1 minute
    this.cacheKeyPrefix = 'booking';
  }

  // Override create to remove features from payload
  async create(data: CreateBookingData) {
    const { features, ...safeData } = data;
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
   */
  async findConflictingBooking(renter_id: string, product_id: string, start_date: string, end_date: string) {
    try {
      const booking = await this.knex('bookings')
        .where({ renter_id, product_id })
        .whereIn('status', ['pending', 'confirmed', 'in_progress'])
        .where(function() {
          this.where('start_date', '<=', end_date)
              .andWhere('end_date', '>=', start_date);
        })
        .first();
      
      return booking || null;
    } catch (error) {
      console.error('Error checking for conflicting booking:', error);
      throw new Error('Failed to check for overlapping booking');
    }
  }
}

export default new BookingRepository();
