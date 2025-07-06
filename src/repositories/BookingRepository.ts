import { OptimizedBaseRepository } from './BaseRepository.optimized';
import Booking from '@/models/Booking.model';
import { BookingData, CreateBookingData, UpdateBookingData } from '@/types/booking.types';

class BookingRepository extends OptimizedBaseRepository<BookingData, CreateBookingData, UpdateBookingData> {
  protected readonly tableName = 'bookings';
  protected readonly modelClass = Booking;
  
  constructor() {
    super();
    
    // Configure search fields for bookings
    this.searchFields = ['booking_reference', 'status', 'notes'];
    
    // Configure cache settings for bookings (shorter cache due to frequent updates)
    this.defaultCacheTTL = 60; // 1 minute
    this.cacheKeyPrefix = 'booking';
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
}

export default new BookingRepository();
