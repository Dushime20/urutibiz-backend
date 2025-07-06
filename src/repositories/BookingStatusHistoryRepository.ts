// =====================================================
// BOOKING STATUS HISTORY REPOSITORY
// =====================================================

import { 
  BookingStatusHistoryData, 
  CreateBookingStatusHistoryData,
  BookingStatusHistoryFilters
} from '@/types/bookingStatusHistory.types';
import { v4 as uuidv4 } from 'uuid';

// Demo repository - In-memory implementation for now
export class BookingStatusHistoryRepository {
  private static statusHistory: BookingStatusHistoryData[] = [];

  /**
   * Create a new status history record
   */
  async create(data: CreateBookingStatusHistoryData): Promise<BookingStatusHistoryData> {
    const record: BookingStatusHistoryData = {
      id: uuidv4(),
      ...data,
      createdAt: new Date()
    };

    BookingStatusHistoryRepository.statusHistory.push(record);
    return record;
  }

  /**
   * Find status history by booking ID
   */
  async findByBookingId(bookingId: string): Promise<BookingStatusHistoryData[]> {
    return BookingStatusHistoryRepository.statusHistory
      .filter(history => history.bookingId === bookingId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  /**
   * Find status history by ID
   */
  async findById(id: string): Promise<BookingStatusHistoryData | null> {
    return BookingStatusHistoryRepository.statusHistory.find(history => history.id === id) || null;
  }

  /**
   * Find all status history records
   */
  async findAll(): Promise<BookingStatusHistoryData[]> {
    return BookingStatusHistoryRepository.statusHistory;
  }

  /**
   * Find paginated status history with filters
   */
  async findPaginated(
    filters: BookingStatusHistoryFilters,
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{
    data: BookingStatusHistoryData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    let filtered = BookingStatusHistoryRepository.statusHistory;

    // Apply filters
    if (filters.bookingId) {
      filtered = filtered.filter(h => h.bookingId === filters.bookingId);
    }
    if (filters.changedBy) {
      filtered = filtered.filter(h => h.changedBy === filters.changedBy);
    }
    if (filters.oldStatus) {
      filtered = filtered.filter(h => h.oldStatus === filters.oldStatus);
    }
    if (filters.newStatus) {
      filtered = filtered.filter(h => h.newStatus === filters.newStatus);
    }
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(h => new Date(h.createdAt) >= startDate);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filtered = filtered.filter(h => new Date(h.createdAt) <= endDate);
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = sortBy === 'created_at' ? new Date(a.createdAt).getTime() : (a as any)[sortBy];
      const bValue = sortBy === 'created_at' ? new Date(b.createdAt).getTime() : (b as any)[sortBy];
      
      if (sortOrder === 'desc') {
        return bValue - aValue;
      }
      return aValue - bValue;
    });

    // Paginate
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const data = filtered.slice(offset, offset + limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Update status history (not recommended for audit records)
   */
  async update(id: string, _data: Partial<BookingStatusHistoryData>): Promise<BookingStatusHistoryData | null> {
    // Status history should not be updated for audit integrity
    throw new Error('Status history records cannot be modified for audit integrity');
  }

  /**
   * Delete status history (not recommended for audit records)
   */
  async delete(id: string): Promise<boolean> {
    // Status history should not be deleted for audit integrity
    throw new Error('Status history records cannot be deleted for audit integrity');
  }

  /**
   * Get status change statistics
   */
  async getStatusChangeStats(bookingId?: string): Promise<{
    totalChanges: number;
    statusDistribution: Record<string, number>;
    frequentChangers: Record<string, number>;
  }> {
    const history = bookingId 
      ? await this.findByBookingId(bookingId)
      : BookingStatusHistoryRepository.statusHistory;

    const statusDistribution: Record<string, number> = {};
    const frequentChangers: Record<string, number> = {};

    history.forEach(h => {
      // Count status changes
      if (h.newStatus) {
        statusDistribution[h.newStatus] = (statusDistribution[h.newStatus] || 0) + 1;
      }
      
      // Count changes by user
      if (h.changedBy) {
        frequentChangers[h.changedBy] = (frequentChangers[h.changedBy] || 0) + 1;
      }
    });

    return {
      totalChanges: history.length,
      statusDistribution,
      frequentChangers
    };
  }
}

export default new BookingStatusHistoryRepository();
