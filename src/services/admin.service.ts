import { FinancialReport, SystemHealth, AdminDashboardStats } from '@/types';
import { getDatabase } from '@/config/database';
import logger from '@/utils/logger';
declare const uuidv4: any;
export class AdminService {
  private static db = getDatabase();

  static async getDashboardStats(timeframe: string = '30d'): Promise<AdminDashboardStats> {
    try {
      const days = this.getTimeframeDays(timeframe);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get all stats in parallel
      const [
        totalUsers,
        totalBookings,
        totalRevenue,
        activeProducts,
        pendingVerifications,
        recentBookings,
        recentUsers
      ] = await Promise.all([
        this.db('users').count('* as count').first(),
        this.db('bookings').count('* as count').first(),
        this.db('bookings').sum('total_amount as total').first(),
        this.db('products').where('status', 'active').count('* as count').first(),
        this.db('user_verifications').where('verification_status', 'pending').count('* as count').first(),
        this.db('bookings').where('created_at', '>=', startDate).count('* as count').first(),
        this.db('users').where('created_at', '>=', startDate).count('* as count').first()
      ]);

      return {
        totalUsers: parseInt((totalUsers as any).count) || 0,
        totalBookings: parseInt((totalBookings as any).count) || 0,
        totalRevenue: parseFloat((totalRevenue as any).total) || 0,
        activeProducts: parseInt((activeProducts as any).count) || 0,
        pendingVerifications: parseInt((pendingVerifications as any).count) || 0,
        recentBookings: parseInt((recentBookings as any).count) || 0,
        recentUsers: parseInt((recentUsers as any).count) || 0,
        timeframe,
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      throw new Error('Failed to fetch dashboard stats');
    }
  }

  static async getAnalytics(period: string = '30d', granularity: string = 'day'): Promise<any> {
    try {
      const days = this.getTimeframeDays(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get analytics data
      const [bookingTrends, userGrowth, revenueData, topProducts] = await Promise.all([
        this.getBookingTrends(startDate, granularity),
        this.getUserGrowth(startDate, granularity),
        this.getRevenueAnalytics(startDate),
        this.getTopProducts(startDate)
      ]);

      return {
        period,
        granularity,
        bookingTrends,
        userGrowth,
        revenueData,
        topProducts,
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error fetching analytics:', error);
      throw new Error('Failed to fetch analytics');
    }
  }

  static async getRealTimeMetrics(): Promise<any> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const [activeUsers, currentBookings, systemLoad] = await Promise.all([
        this.db('users').where('last_login_at', '>=', oneHourAgo).count('* as count').first(),
        this.db('bookings').whereIn('status', ['confirmed', 'in_progress']).count('* as count').first(),
        this.getSystemLoad()
      ]);

      return {
        activeUsers: parseInt((activeUsers as any).count) || 0,
        currentBookings: parseInt((currentBookings as any).count) || 0,
        systemLoad: systemLoad,
        responseTime: Math.random() * 200 + 50, // Mock response time
        uptime: '99.9%',
        timestamp: now
      };
    } catch (error) {
      logger.error('Error fetching real-time metrics:', error);
      throw new Error('Failed to fetch real-time metrics');
    }
  }

  static async getActivityFeed(page: number = 1, limit: number = 50): Promise<any> {
    try {
      const offset = (page - 1) * limit;

      const activities = await this.db('audit_logs')
        .select('*')
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      const [{ count }] = await this.db('audit_logs').count('* as count');
      const total = parseInt(count as string);

      return {
        activities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching activity feed:', error);
      throw new Error('Failed to fetch activity feed');
    }
  }

  static async getUsersWithStats(page: number = 1, limit: number = 20, filters: any = {}): Promise<any> {
    try {
      const offset = (page - 1) * limit;
      
      // Build base query for data
      let dataQuery = this.db('users')
        .select(
          'users.*',
          this.db.raw('COUNT(DISTINCT bookings.id) as total_bookings'),
          this.db.raw('COUNT(DISTINCT products.id) as total_products'),
          this.db.raw('COUNT(DISTINCT reviews.id) as total_reviews')
        )
        .leftJoin('bookings', 'users.id', 'bookings.renter_id')
        .leftJoin('products', 'users.id', 'products.owner_id')
        .leftJoin('reviews', 'users.id', 'reviews.reviewer_id')
        .groupBy('users.id');

      // Build count query (simpler, no joins needed)
      let countQuery = this.db('users');

      // Apply filters to both queries
      if (filters.role) {
        dataQuery = dataQuery.where('users.role', filters.role);
        countQuery = countQuery.where('role', filters.role);
      }
      if (filters.status) {
        dataQuery = dataQuery.where('users.status', filters.status);
        countQuery = countQuery.where('status', filters.status);
      }
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        dataQuery = dataQuery.where(function() {
          this.where('users.email', 'ILIKE', searchTerm)
              .orWhere('users.first_name', 'ILIKE', searchTerm)
              .orWhere('users.last_name', 'ILIKE', searchTerm);
        });
        countQuery = countQuery.where(function() {
          this.where('email', 'ILIKE', searchTerm)
              .orWhere('first_name', 'ILIKE', searchTerm)
              .orWhere('last_name', 'ILIKE', searchTerm);
        });
      }
      if (filters.created_after) {
        dataQuery = dataQuery.where('users.created_at', '>=', filters.created_after);
        countQuery = countQuery.where('created_at', '>=', filters.created_after);
      }
      if (filters.created_before) {
        dataQuery = dataQuery.where('users.created_at', '<=', filters.created_before);
        countQuery = countQuery.where('created_at', '<=', filters.created_before);
      }

      // Get total count
      const [{ count }] = await countQuery.count('* as count');
      const total = parseInt(count as string);
      const totalPages = Math.ceil(total / limit);

      // Get paginated results
      const items = await dataQuery
        .orderBy('users.created_at', 'desc')
        .offset(offset)
        .limit(limit);

      return {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      logger.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  static async getUserDetails(id: string): Promise<any> {
    try {
      const user = await this.db('users')
        .select(
          'users.*',
          this.db.raw('COUNT(DISTINCT bookings.id) as total_bookings'),
          this.db.raw('COUNT(DISTINCT products.id) as total_products'),
          this.db.raw('COUNT(DISTINCT reviews.id) as total_reviews'),
          this.db.raw('AVG(reviews.rating) as average_rating')
        )
        .leftJoin('bookings', 'users.id', 'bookings.renter_id')
        .leftJoin('products', 'users.id', 'products.owner_id')
        .leftJoin('reviews', function() {
          this.on('users.id', '=', 'reviews.reviewer_id')
              .orOn('users.id', '=', 'reviews.reviewee_id');
        })
        .where('users.id', id)
        .groupBy('users.id')
        .first();

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Error fetching user details:', error);
      throw error;
    }
  }
  static async getProductsWithStats(_page: number, _limit: number, _filters: any): Promise<any> { return { items: [], pagination: { page: _page, limit: _limit, total: 0, totalPages: 0 } }; }
  static async getProductDetails(_id: string): Promise<any> { return null; }
  static async getBookingsWithDetails(page: number = 1, limit: number = 20, filters: any = {}): Promise<any> {
    try {
      const offset = (page - 1) * limit;
      
      // Build base query for data
      let dataQuery = this.db('bookings')
        .select(
          'bookings.*',
          'renters.email as renter_email',
          'renters.first_name as renter_first_name',
          'renters.last_name as renter_last_name',
          'owners.email as owner_email',
          'owners.first_name as owner_first_name',
          'owners.last_name as owner_last_name',
          'products.title as product_title',
          'products.description as product_description'
        )
        .leftJoin('users as renters', 'bookings.renter_id', 'renters.id')
        .leftJoin('users as owners', 'bookings.owner_id', 'owners.id')
        .leftJoin('products', 'bookings.product_id', 'products.id');

      // Build count query (simpler, no joins needed for count)
      let countQuery = this.db('bookings');

      // Apply filters to both queries
      if (filters.status) {
        dataQuery = dataQuery.where('bookings.status', filters.status);
        countQuery = countQuery.where('status', filters.status);
      }
      if (filters.renter_id) {
        dataQuery = dataQuery.where('bookings.renter_id', filters.renter_id);
        countQuery = countQuery.where('renter_id', filters.renter_id);
      }
      if (filters.owner_id) {
        dataQuery = dataQuery.where('bookings.owner_id', filters.owner_id);
        countQuery = countQuery.where('owner_id', filters.owner_id);
      }
      if (filters.product_id) {
        dataQuery = dataQuery.where('bookings.product_id', filters.product_id);
        countQuery = countQuery.where('product_id', filters.product_id);
      }
      if (filters.start_date) {
        dataQuery = dataQuery.where('bookings.start_date', '>=', filters.start_date);
        countQuery = countQuery.where('start_date', '>=', filters.start_date);
      }
      if (filters.end_date) {
        dataQuery = dataQuery.where('bookings.end_date', '<=', filters.end_date);
        countQuery = countQuery.where('end_date', '<=', filters.end_date);
      }

      // Get total count
      const [{ count }] = await countQuery.count('* as count');
      const total = parseInt(count as string);
      const totalPages = Math.ceil(total / limit);

      // Get paginated results
      const items = await dataQuery
        .orderBy('bookings.created_at', 'desc')
        .offset(offset)
        .limit(limit);

      return {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      logger.error('Error fetching bookings:', error);
      throw new Error('Failed to fetch bookings');
    }
  }
  static async getBookingDetails(id: string): Promise<any> {
    try {
      const booking = await this.db('bookings')
        .select(
          'bookings.*',
          'renters.email as renter_email',
          'renters.first_name as renter_first_name',
          'renters.last_name as renter_last_name',
          'owners.email as owner_email',
          'owners.first_name as owner_first_name',
          'owners.last_name as owner_last_name',
          'products.title as product_title',
          'products.description as product_description'
        )
        .leftJoin('users as renters', 'bookings.renter_id', 'renters.id')
        .leftJoin('users as owners', 'bookings.owner_id', 'owners.id')
        .leftJoin('products', 'bookings.product_id', 'products.id')
        .where('bookings.id', id)
        .first();

      if (!booking) {
        throw new Error('Booking not found');
      }

      return booking;
    } catch (error) {
      logger.error('Error fetching booking details:', error);
      throw error;
    }
  }
  static async overrideBookingStatus(_id: string, _status: string, _adminId: string, _reason: string): Promise<any> { return null; }
  static async getDisputes(_page: number, _limit: number, _filters: any): Promise<any> { return { items: [], pagination: { page: _page, limit: _limit, total: 0, totalPages: 0 } }; }
  static async assignDispute(_id: string, _adminId: string): Promise<any> { return null; }
  static async resolveDispute(_id: string, _resolution: string, _actions: any, _adminId: string): Promise<any> { return null; }
  static async getFinancialReport(_period: string, _year: number, _month?: number): Promise<FinancialReport> { return {} as FinancialReport; }
  static async processPayouts(_payoutIds: string[], _adminId: string): Promise<any> { return null; }
  static async getSystemHealth(): Promise<SystemHealth> { return {} as SystemHealth; }
  static async getAuditLogs(_page: number, _limit: number, _filters: any): Promise<any> { return { items: [], pagination: { page: _page, limit: _limit, total: 0, totalPages: 0 } }; }
  static async exportData(_type: string, _filters: any, _format: string): Promise<any> { return { exportId: uuidv4(), fileName: '', status: 'processing', recordCount: 0, estimatedCompletionTime: new Date() }; }
  static async sendAnnouncement(_announcement: any): Promise<any> { return null; }
  static async updatePlatformConfig(_configKey: string, _configValue: any, _adminId: string): Promise<any> { return null; }
  static async getPlatformConfig(): Promise<any> { return {}; }

  // Helper methods
  private static getTimeframeDays(timeframe: string): number {
    const timeframeMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    return timeframeMap[timeframe] || 30;
  }

  private static async getBookingTrends(startDate: Date, granularity: string): Promise<any[]> {
    const dateFormat = granularity === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM';
    return await this.db('bookings')
      .select(this.db.raw(`DATE_TRUNC('${granularity}', created_at) as date`))
      .count('* as count')
      .where('created_at', '>=', startDate)
      .groupBy('date')
      .orderBy('date');
  }

  private static async getUserGrowth(startDate: Date, granularity: string): Promise<any[]> {
    const dateFormat = granularity === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM';
    return await this.db('users')
      .select(this.db.raw(`DATE_TRUNC('${granularity}', created_at) as date`))
      .count('* as count')
      .where('created_at', '>=', startDate)
      .groupBy('date')
      .orderBy('date');
  }

  private static async getRevenueAnalytics(startDate: Date): Promise<any> {
    const revenue = await this.db('bookings')
      .select(
        this.db.raw('SUM(total_amount) as total_revenue'),
        this.db.raw('AVG(total_amount) as avg_booking_value'),
        this.db.raw('COUNT(*) as total_bookings')
      )
      .where('created_at', '>=', startDate)
      .where('status', '!=', 'cancelled')
      .first();

    return {
      totalRevenue: parseFloat((revenue as any).total_revenue) || 0,
      avgBookingValue: parseFloat((revenue as any).avg_booking_value) || 0,
      totalBookings: parseInt((revenue as any).total_bookings) || 0
    };
  }

  private static async getTopProducts(startDate: Date): Promise<any[]> {
    return await this.db('bookings')
      .select(
        'products.title',
        this.db.raw('COUNT(bookings.id) as booking_count'),
        this.db.raw('SUM(bookings.total_amount) as total_revenue')
      )
      .leftJoin('products', 'bookings.product_id', 'products.id')
      .where('bookings.created_at', '>=', startDate)
      .groupBy('products.id', 'products.title')
      .orderBy('booking_count', 'desc')
      .limit(10);
  }

  private static async getSystemLoad(): Promise<number> {
    // Mock system load calculation
    return Math.random() * 0.5 + 0.3; // Between 0.3 and 0.8
  }
}
export default AdminService;
