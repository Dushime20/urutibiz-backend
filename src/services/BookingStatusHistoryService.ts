// =====================================================
// BOOKING STATUS HISTORY SERVICE
// =====================================================

import BookingStatusHistoryRepository from '../repositories/BookingStatusHistoryRepository';
import { 
  BookingStatusHistoryData, 
  CreateBookingStatusHistoryData,
  BookingStatusHistoryFilters
} from '@/types/bookingStatusHistory.types';

class BookingStatusHistoryService {
  private repository = BookingStatusHistoryRepository;

  /**
   * Get status history for a specific booking
   */
  async getByBookingId(bookingId: string): Promise<{ success: boolean; data?: BookingStatusHistoryData[]; error?: string }> {
    try {
      const result = await this.repository.findByBookingId(bookingId);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error fetching booking status history:', error);
      return { success: false, error: 'Failed to fetch booking status history' };
    }
  }

  /**
   * Record a status change for a booking
   */
  async recordStatusChange(
    bookingId: string,
    oldStatus: string | undefined,
    newStatus: string,
    changedBy: string,
    reason?: string,
    notes?: string
  ): Promise<{ success: boolean; data?: BookingStatusHistoryData; error?: string }> {
    try {
      const historyData: CreateBookingStatusHistoryData = {
        bookingId,
        oldStatus: oldStatus as any,
        newStatus: newStatus as any,
        changedBy,
        reason,
        notes
      };

      const result = await this.repository.create(historyData);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error recording status change:', error);
      return { success: false, error: 'Failed to record status change' };
    }
  }

  /**
   * Get paginated status history with filters
   */
  async getPaginatedHistory(
    filters: BookingStatusHistoryFilters,
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await this.repository.findPaginated(filters, page, limit, sortBy, sortOrder);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error fetching paginated status history:', error);
      return { success: false, error: 'Failed to fetch status history' };
    }
  }

  /**
   * Get status history analytics for a booking
   */
  async getStatusAnalytics(bookingId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const history = await this.getByBookingId(bookingId);
      
      if (!history.success || !history.data) {
        return { success: false, error: 'No status history found' };
      }

      const analytics = {
        totalChanges: history.data.length,
        statusFlow: history.data.map(h => ({
          from: h.oldStatus,
          to: h.newStatus,
          timestamp: h.createdAt,
          changedBy: h.changedBy,
          reason: h.reason
        })),
        timeInStatus: this.calculateTimeInStatus(history.data),
        frequentChangers: this.getFrequentChangers(history.data)
      };

      return { success: true, data: analytics };
    } catch (error) {
      console.error('Error generating status analytics:', error);
      return { success: false, error: 'Failed to generate analytics' };
    }
  }

  /**
   * Get global status change statistics
   */
  async getGlobalStats(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const stats = await this.repository.getStatusChangeStats();
      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching global status stats:', error);
      return { success: false, error: 'Failed to fetch statistics' };
    }
  }

  /**
   * Calculate time spent in each status
   */
  private calculateTimeInStatus(history: BookingStatusHistoryData[]): Record<string, number> {
    const timeInStatus: Record<string, number> = {};
    
    for (let i = 0; i < history.length; i++) {
      const current = history[i];
      const next = history[i + 1];
      
      if (current.oldStatus) {
        const timeSpent = next 
          ? new Date(next.createdAt).getTime() - new Date(current.createdAt).getTime()
          : Date.now() - new Date(current.createdAt).getTime();
        
        timeInStatus[current.oldStatus] = (timeInStatus[current.oldStatus] || 0) + timeSpent;
      }
    }
    
    return timeInStatus;
  }

  /**
   * Get users who frequently change booking statuses
   */
  private getFrequentChangers(history: BookingStatusHistoryData[]): Record<string, number> {
    const changers: Record<string, number> = {};
    
    history.forEach(h => {
      if (h.changedBy) {
        changers[h.changedBy] = (changers[h.changedBy] || 0) + 1;
      }
    });
    
    return changers;
  }
}

export default new BookingStatusHistoryService();
