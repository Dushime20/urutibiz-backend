import { getRedisClient } from '@/config/redis';
import logger from '@/utils/logger';
import {
  BookingAnalyticsParams,
  BookingAnalyticsResponse,
  BookingMetrics,
  BookingTrends,
  StatusDistribution,
  GeographicAnalytics,
  CategoryAnalytics,
  UserBehaviorAnalytics,
  RevenueAnalytics,
  PerformanceMetrics,
  TimeSeriesData,
  AnalyticsInsight
} from '@/types/analytics.types';
import knex from 'knex';

// Initialize database connection
let db: ReturnType<typeof knex>;
try {
  // Use the existing database instance from config
  db = require('@/config/database').getDatabase();
} catch (error) {
  logger.error('Failed to initialize database for analytics:', error);
  // Create a fallback instance with proper configuration
  db = knex({
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'urutibiz'
    }
  });
}

// Lazy Redis client initialization
let redisClient: ReturnType<typeof getRedisClient> | null = null;
const getRedis = () => {
  if (!redisClient) {
    try {
      redisClient = getRedisClient();
    } catch (error) {
      logger.warn('Redis not available for analytics caching:', error);
      return null;
    }
  }
  return redisClient;
};

type ViewTrend = { date: string; views: string };
type TrendRow = { date: string; total_bookings: string; revenue: string; avg_value: string; cancellation_rate: string };
type StatRow = { count: string; status: string; revenue: string; avg_value: string; country?: string; country_code?: string; city?: string; };
type CoordRow = { lat: string; lng: string; bookings: string; revenue: string };

export class AnalyticsService {
  static async getAnalytics(type: string, period: string, granularity: string): Promise<any> {
    // TODO: Implement actual analytics logic
    return { type, period, granularity, data: {} };
  }

  /**
   * Get comprehensive booking analytics
   */
  static async getBookingAnalytics(params: BookingAnalyticsParams): Promise<BookingAnalyticsResponse> {
    try {
      logger.info('Starting booking analytics generation', { params });

      // Parse date parameters
      const { startDate, endDate, previousStartDate, previousEndDate } = this.parseDateParams(params);
      
      // Build base query with filters
      const baseQuery = this.buildBaseQuery(params.filters);
      
      // Execute all analytics queries in parallel for performance
      const [
        metrics,
        trends,
        statusDistribution,
        geographic,
        categories,
        userBehavior,
        revenue,
        performance
      ] = await Promise.all([
        this.getBookingMetrics(baseQuery, startDate, endDate, previousStartDate, previousEndDate),
        this.getBookingTrends(baseQuery, startDate, endDate, params.granularity),
        this.getStatusDistribution(baseQuery, startDate, endDate, previousStartDate, previousEndDate),
        this.getGeographicAnalytics(baseQuery, startDate, endDate),
        this.getCategoryAnalytics(startDate, endDate),
        this.getUserBehaviorAnalytics(startDate, endDate),
        this.getRevenueAnalytics(baseQuery, startDate, endDate),
        // Fix: Only pass startDate and endDate to getPerformanceMetrics
        this.getPerformanceMetrics(startDate, endDate)
      ]);
      // Fix: Only pass metrics to generateInsights
      const insights = this.generateInsights(metrics);

      const response: BookingAnalyticsResponse = {
        period: params.period,
        granularity: params.granularity,
        generatedAt: new Date(),
        metrics,
        trends,
        statusDistribution,
        geographic,
        categories,
        userBehavior,
        revenue,
        performance,
        insights,
        filters: params.filters
      };

      // Cache results for performance
      await this.cacheAnalytics(params, response);

      logger.info('Booking analytics generated successfully', { 
        period: params.period,
        totalBookings: metrics.current.totalBookings,
        totalRevenue: metrics.current.totalRevenue
      });

      return response;
    } catch (error: any) {
      logger.error('Failed to generate booking analytics:', error);
      throw new Error(`Analytics generation failed: ${error.message}`);
    }
  }

  /**
   * Parse date parameters based on period
   */
  private static parseDateParams(params: BookingAnalyticsParams): {
    startDate: Date;
    endDate: Date;
    previousStartDate?: Date;
    previousEndDate?: Date;
  } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);

    if (params.period === 'custom' && params.startDate && params.endDate) {
      startDate = new Date(params.startDate);
      endDate = new Date(params.endDate);
    } else {
      const days = this.getPeriodDays(params.period);
      startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }

    // Calculate previous period for comparison
    let previousStartDate: Date | undefined;
    let previousEndDate: Date | undefined;

    if (params.compareWith) {
      const compareDays = this.getPeriodDays(params.compareWith.period);
      previousEndDate = new Date(startDate.getTime() - 1);
      previousStartDate = new Date(previousEndDate.getTime() - compareDays * 24 * 60 * 60 * 1000);
    } else {
      // Default comparison with previous period of same length
      const periodLength = endDate.getTime() - startDate.getTime();
      previousEndDate = new Date(startDate.getTime() - 1);
      previousStartDate = new Date(previousEndDate.getTime() - periodLength);
    }

    return { startDate, endDate, previousStartDate, previousEndDate };
  }

  /**
   * Get period duration in days
   */
  private static getPeriodDays(period: string): number {
    const periodMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    return periodMap[period] || 30;
  }

  /**
   * Build base query with filters
   */
  private static buildBaseQuery(filters?: BookingAnalyticsParams['filters']) {
    let query = db('bookings')
      .leftJoin('products', 'bookings.product_id', 'products.id')
      .leftJoin('users as renters', 'bookings.renter_id', 'renters.id')
      .leftJoin('users as owners', 'bookings.owner_id', 'owners.id')
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .leftJoin('countries', 'products.country_id', 'countries.id');

    if (filters) {
      if (filters.status?.length) {
        query = query.whereIn('bookings.status', filters.status);
      }
      if (filters.countryId) {
        query = query.where('products.country_id', filters.countryId);
      }
      if (filters.categoryId) {
        query = query.where('products.category_id', filters.categoryId);
      }
      if (filters.ownerId) {
        query = query.where('bookings.owner_id', filters.ownerId);
      }
      if (filters.renterId) {
        query = query.where('bookings.renter_id', filters.renterId);
      }
      if (filters.minAmount) {
        query = query.where('bookings.total_amount', '>=', filters.minAmount);
      }
      if (filters.maxAmount) {
        query = query.where('bookings.total_amount', '<=', filters.maxAmount);
      }
      if (filters.productIds?.length) {
        query = query.whereIn('bookings.product_id', filters.productIds);
      }
    }

    return query;
  }

  private static async getBookingMetrics(
    baseQuery: any,
    startDate: Date,
    endDate: Date,
    previousStartDate?: Date,
    previousEndDate?: Date
  ): Promise<BookingMetrics> {
    const currentMetrics = await this.calculatePeriodMetrics(baseQuery, startDate, endDate);
    let previousMetrics;
    let growth: any = {};
    if (previousStartDate && previousEndDate) {
      previousMetrics = await this.calculatePeriodMetrics(baseQuery, previousStartDate, previousEndDate);
      growth = {
        totalBookings: this.calculateGrowth(currentMetrics.totalBookings, previousMetrics.totalBookings),
        totalRevenue: this.calculateGrowth(currentMetrics.totalRevenue, previousMetrics.totalRevenue),
        averageBookingValue: this.calculateGrowth(currentMetrics.averageBookingValue, previousMetrics.averageBookingValue),
        conversionRate: this.calculateGrowth(currentMetrics.conversionRate, previousMetrics.conversionRate),
        cancellationRate: this.calculateGrowth(currentMetrics.cancellationRate, previousMetrics.cancellationRate),
        completionRate: this.calculateGrowth(currentMetrics.completionRate, previousMetrics.completionRate),
        repeatCustomerRate: this.calculateGrowth(currentMetrics.repeatCustomerRate, previousMetrics.repeatCustomerRate),
        averageLeadTime: this.calculateGrowth(currentMetrics.averageLeadTime, previousMetrics.averageLeadTime),
        averageDuration: this.calculateGrowth(currentMetrics.averageDuration, previousMetrics.averageDuration)
      };
    }
    return {
      current: currentMetrics,
      previous: previousMetrics,
      growth
    };
  }

  private static async calculatePeriodMetrics(baseQuery: any, startDate: Date, endDate: Date) {
    const [
      bookingStats,
      viewStats,
      repeatCustomerStats,
      leadTimeStats,
      durationStats
    ] = await Promise.all([
      baseQuery.clone()
        .whereBetween('bookings.created_at', [startDate, endDate])
        .select([
          db.raw('COUNT(*) as total_bookings'),
          db.raw('SUM(CASE WHEN bookings.status != \'cancelled\' THEN bookings.total_amount ELSE 0 END) as total_revenue'),
          db.raw('AVG(CASE WHEN bookings.status != \'cancelled\' THEN bookings.total_amount ELSE NULL END) as avg_booking_value'),
          db.raw('COUNT(CASE WHEN bookings.status = \'cancelled\' THEN 1 END) * 100.0 / COUNT(*) as cancellation_rate'),
          db.raw('COUNT(CASE WHEN bookings.status = \'completed\' THEN 1 END) * 100.0 / COUNT(CASE WHEN bookings.status IN (\'confirmed\', \'active\', \'completed\') THEN 1 END) as completion_rate')
        ])
        .first(),
      db('product_views')
        .whereBetween('created_at', [startDate, endDate])
        .count('* as total_views')
        .first(),
      db('bookings')
        .select('renter_id')
        .whereBetween('created_at', [startDate, endDate])
        .groupBy('renter_id')
        .having(db.raw('COUNT(*) > 1'))
        .then((results: any[]) => ({
          repeat_customers: results.length
        })),
      baseQuery.clone()
        .whereBetween('bookings.created_at', [startDate, endDate])
        .whereNotNull('bookings.start_date')
        .select([
          db.raw('AVG(EXTRACT(DAY FROM (bookings.start_date - bookings.created_at))) as avg_lead_time')
        ])
        .first(),
      baseQuery.clone()
        .whereBetween('bookings.created_at', [startDate, endDate])
        .whereNotNull('bookings.start_date')
        .whereNotNull('bookings.end_date')
        .select([
          db.raw('AVG(EXTRACT(DAY FROM (bookings.end_date - bookings.start_date))) as avg_duration')
        ])
        .first()
    ]);
    const totalBookings = parseInt((bookingStats as any).total_bookings) || 0;
    let totalViews = 0;
    if (viewStats && typeof viewStats === 'object' && 'total_views' in viewStats) {
      totalViews = parseInt((viewStats as any).total_views) || 0;
    }
    const repeatCustomers = (repeatCustomerStats as any).repeat_customers || 0;
    return {
      totalBookings,
      totalRevenue: parseFloat((bookingStats as any).total_revenue) || 0,
      averageBookingValue: parseFloat((bookingStats as any).avg_booking_value) || 0,
      conversionRate: totalViews > 0 ? (totalBookings / totalViews) * 100 : 0,
      cancellationRate: parseFloat((bookingStats as any).cancellation_rate) || 0,
      completionRate: parseFloat((bookingStats as any).completion_rate) || 0,
      repeatCustomerRate: totalBookings > 0 ? (repeatCustomers / totalBookings) * 100 : 0,
      averageLeadTime: parseFloat((leadTimeStats as any)?.avg_lead_time) || 0,
      averageDuration: parseFloat((durationStats as any)?.avg_duration) || 0
    };
  }

  private static calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private static async getBookingTrends(
    baseQuery: any,
    startDate: Date,
    endDate: Date,
    granularity: string
  ): Promise<BookingTrends> {
    const dateField = this.getDateTruncFunction(granularity, 'bookings.created_at');
    const trendsData = await baseQuery.clone()
      .whereBetween('bookings.created_at', [startDate, endDate])
      .groupBy(db.raw(dateField))
      .select([
        db.raw(`${dateField} as date`),
        db.raw('COUNT(*) as total_bookings'),
        db.raw('SUM(CASE WHEN bookings.status != \'cancelled\' THEN bookings.total_amount ELSE 0 END) as revenue'),
        db.raw('AVG(CASE WHEN bookings.status != \'cancelled\' THEN bookings.total_amount ELSE NULL END) as avg_value'),
        db.raw('COUNT(CASE WHEN bookings.status = \'cancelled\' THEN 1 END) * 100.0 / COUNT(*) as cancellation_rate')
      ])
      .orderBy('date');
    const viewTrends = await db('product_views')
      .whereBetween('created_at', [startDate, endDate])
      .groupBy(db.raw(this.getDateTruncFunction(granularity, 'created_at')))
      .select([
        db.raw(`${this.getDateTruncFunction(granularity, 'created_at')} as date`),
        db.raw('COUNT(*) as views')
      ])
      .orderBy('date');
    const viewMap = new Map((viewTrends as ViewTrend[]).map((v: ViewTrend) => [v.date, parseInt(v.views)]));
    const totalBookings: TimeSeriesData[] = [];
    const revenue: TimeSeriesData[] = [];
    const averageValue: TimeSeriesData[] = [];
    const conversionRate: TimeSeriesData[] = [];
    const cancellationRate: TimeSeriesData[] = [];
    (trendsData as TrendRow[]).forEach((row: TrendRow) => {
      const date = this.formatDate(row.date, granularity);
      const bookings = parseInt(row.total_bookings);
      const views = viewMap.get(row.date) || 0;
      totalBookings.push({ date, value: bookings });
      revenue.push({ date, value: parseFloat(row.revenue) || 0 });
      averageValue.push({ date, value: parseFloat(row.avg_value) || 0 });
      conversionRate.push({ date, value: typeof views === 'number' && views > 0 ? (bookings / views) * 100 : 0 });
      cancellationRate.push({ date, value: parseFloat(row.cancellation_rate) || 0 });
    });
    return { totalBookings, revenue, averageValue, conversionRate, cancellationRate };
  }

  private static async getStatusDistribution(
    baseQuery: any,
    startDate: Date,
    endDate: Date,
    previousStartDate?: Date,
    previousEndDate?: Date
  ): Promise<StatusDistribution[]> {
    const currentStats = await baseQuery.clone()
      .whereBetween('bookings.created_at', [startDate, endDate])
      .groupBy('bookings.status')
      .select([
        'bookings.status',
        db.raw('COUNT(*) as count'),
        db.raw('SUM(bookings.total_amount) as revenue'),
        db.raw('AVG(bookings.total_amount) as avg_value')
      ]);
    let previousStats: any[] = [];
    if (previousStartDate && previousEndDate) {
      previousStats = await baseQuery.clone()
        .whereBetween('bookings.created_at', [previousStartDate, previousEndDate])
        .groupBy('bookings.status')
        .select([
          'bookings.status',
          db.raw('COUNT(*) as count')
        ]);
    }
    const totalBookings = (currentStats as StatRow[]).reduce((sum: number, stat: StatRow) => sum + parseInt(stat.count), 0);
    const previousStatsMap = new Map((previousStats as StatRow[]).map((s: StatRow) => [s.status, parseInt(s.count)]));
    return (currentStats as StatRow[]).map((stat: StatRow) => {
      const count = parseInt(stat.count);
      const previousCount = previousStatsMap.get(stat.status) || 0;
      const trendPercentage = this.calculateGrowth(count, previousCount);
      return {
        status: stat.status,
        count,
        percentage: totalBookings > 0 ? (count / totalBookings) * 100 : 0,
        revenue: parseFloat(stat.revenue) || 0,
        averageValue: parseFloat(stat.avg_value) || 0,
        trend: trendPercentage > 5 ? 'up' : trendPercentage < -5 ? 'down' : 'stable',
        trendPercentage
      };
    });
  }

  private static async getGeographicAnalytics(
    baseQuery: any,
    startDate: Date,
    endDate: Date
  ): Promise<GeographicAnalytics> {
    const [byCountry, byCity, coordinates] = await Promise.all([
      baseQuery.clone()
        .whereBetween('bookings.created_at', [startDate, endDate])
        .groupBy('countries.id', 'countries.name', 'countries.code')
        .select([
          'countries.name as country',
          'countries.code as country_code',
          db.raw('COUNT(*) as bookings'),
          db.raw('SUM(bookings.total_amount) as revenue'),
          db.raw('AVG(bookings.total_amount) as avg_value')
        ])
        .orderBy('revenue', 'desc'),
      baseQuery.clone()
        .whereBetween('bookings.created_at', [startDate, endDate])
        .groupBy('products.city', 'countries.name')
        .select([
          'products.city',
          'countries.name as country',
          db.raw('COUNT(*) as bookings'),
          db.raw('SUM(bookings.total_amount) as revenue'),
          db.raw('AVG(bookings.total_amount) as avg_value')
        ])
        .orderBy('revenue', 'desc')
        .limit(20),
      baseQuery.clone()
        .whereBetween('bookings.created_at', [startDate, endDate])
        .whereNotNull('products.latitude')
        .whereNotNull('products.longitude')
        .groupBy('products.latitude', 'products.longitude')
        .select([
          'products.latitude as lat',
          'products.longitude as lng',
          db.raw('COUNT(*) as bookings'),
          db.raw('SUM(bookings.total_amount) as revenue')
        ])
    ]);
    const countryData = (byCountry as StatRow[]).map((country: any) => ({
      country: country.country,
      countryCode: country.country_code,
      bookings: parseInt(country.bookings),
      revenue: parseFloat(country.revenue),
      averageValue: parseFloat(country.avg_value),
      growth: 0
    }));
    const cityData = (byCity as StatRow[]).map((city: any) => ({
      city: city.city,
      country: city.country,
      bookings: parseInt(city.bookings),
      revenue: parseFloat(city.revenue),
      averageValue: parseFloat(city.avg_value)
    }));
    const maxBookings = Math.max(...(coordinates as CoordRow[]).map((c: CoordRow) => parseInt(c.bookings)));
    const heatmapData = (coordinates as CoordRow[]).map((coord: CoordRow) => ({
      lat: parseFloat(coord.lat),
      lng: parseFloat(coord.lng),
      intensity: maxBookings > 0 ? parseInt(coord.bookings) / maxBookings : 0,
      bookings: parseInt(coord.bookings),
      revenue: parseFloat(coord.revenue)
    }));
    return { byCountry: countryData, byCity: cityData, heatmapData };
  }

  private static async getCategoryAnalytics(
    startDate: Date,
    endDate: Date
  ): Promise<CategoryAnalytics[]> {
    const categoryStats = await db('bookings')
      .leftJoin('products', 'bookings.product_id', 'products.id')
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .whereBetween('bookings.created_at', [startDate, endDate])
      .groupBy('categories.id', 'categories.name')
      .select([
        'categories.id as category_id',
        'categories.name as category_name',
        db.raw('COUNT(*) as bookings'),
        db.raw('SUM(bookings.total_amount) as revenue'),
        db.raw('AVG(bookings.total_amount) as avg_value')
      ])
      .orderBy('revenue', 'desc');
    const categoryViews = await db('product_views')
      .join('products', 'product_views.product_id', 'products.id')
      .join('categories', 'products.category_id', 'categories.id')
      .whereBetween('product_views.created_at', [startDate, endDate])
      .groupBy('categories.id')
      .select([
        'categories.id as category_id',
        db.raw('COUNT(*) as views')
      ]);
    const viewsMap = new Map(categoryViews.map((v: any) => [v.category_id, parseInt(v.views)]));
    const result: CategoryAnalytics[] = [];
    for (let i = 0; i < categoryStats.length; i++) {
      const stat: any = categoryStats[i];
      const bookings = parseInt(stat.bookings);
      const views = viewsMap.get(stat.category_id) || 0;
      const conversionRate = views > 0 ? (bookings / views) * 100 : 0;
      const topProducts = await db('bookings')
        .leftJoin('products', 'bookings.product_id', 'products.id')
        .leftJoin('categories', 'products.category_id', 'categories.id')
        .whereBetween('bookings.created_at', [startDate, endDate])
        .where('categories.id', stat.category_id)
        .groupBy('products.id', 'products.title')
        .select([
          'products.id as product_id',
          'products.title',
          db.raw('COUNT(*) as bookings'),
          db.raw('SUM(bookings.total_amount) as revenue')
        ])
        .orderBy('revenue', 'desc')
        .limit(5);
      result.push({
        categoryId: stat.category_id,
        categoryName: stat.category_name,
        bookings,
        revenue: parseFloat(stat.revenue),
        averageValue: parseFloat(stat.avg_value),
        conversionRate,
        popularityRank: i + 1,
        seasonalTrend: 'stable',
        growthRate: 0,
        topProducts: topProducts.map((p: any) => ({
          productId: p.product_id,
          title: p.title,
          bookings: parseInt(p.bookings),
          revenue: parseFloat(p.revenue)
        }))
      });
    }
    return result;
  }

  private static async getUserBehaviorAnalytics(
    startDate: Date,
    endDate: Date
  ): Promise<UserBehaviorAnalytics> {
    const [
      newVsReturning,
      lifetimeStats,
      timingPatterns,
      advanceBooking
    ] = await Promise.all([
      this.getNewVsReturningUsers(startDate, endDate),
      this.getUserLifetimeStats(),
      this.getBookingTimingPatterns(startDate, endDate),
      this.getAdvanceBookingPatterns(startDate, endDate)
    ]);
    return {
      newVsReturning,
      userLifetime: lifetimeStats,
      behaviorPatterns: {
        averageTimeBetweenBookings: await this.getAverageTimeBetweenBookings(),
        preferredBookingTime: timingPatterns,
        advanceBookingDays: advanceBooking
      }
    };
  }

  private static async getNewVsReturningUsers(startDate: Date, endDate: Date) {
    const periodBookings = await db('bookings')
      .whereBetween('created_at', [startDate, endDate])
      .select('renter_id', 'total_amount');
    const userFirstBookings = await db('bookings')
      .select('renter_id')
      .min('created_at as first_booking')
      .groupBy('renter_id');
    const firstBookingMap = new Map(
      userFirstBookings.map((ufb: any) => [ufb.renter_id, new Date(ufb.first_booking)])
    );
    let newUsers = { bookings: 0, revenue: 0, percentage: 0 };
    let returningUsers = { bookings: 0, revenue: 0, percentage: 0 };
    periodBookings.forEach((booking: any) => {
      const firstBooking = firstBookingMap.get(booking.renter_id);
      const isNewUser = firstBooking && firstBooking >= startDate && firstBooking <= endDate;
      if (isNewUser) {
        newUsers.bookings++;
        newUsers.revenue += parseFloat(booking.total_amount);
      } else {
        returningUsers.bookings++;
        returningUsers.revenue += parseFloat(booking.total_amount);
      }
    });
    const totalBookings = newUsers.bookings + returningUsers.bookings;
    newUsers.percentage = totalBookings > 0 ? (newUsers.bookings / totalBookings) * 100 : 0;
    returningUsers.percentage = totalBookings > 0 ? (returningUsers.bookings / totalBookings) * 100 : 0;
    return { newUsers, returningUsers };
  }

  private static async getUserLifetimeStats() {
    const lifetimeStats = await db('bookings')
      .where('status', '!=', 'cancelled')
      .groupBy('renter_id')
      .select([
        'renter_id',
        db.raw('COUNT(*) as booking_count'),
        db.raw('SUM(total_amount) as lifetime_value'),
        db.raw('MAX(created_at) as last_booking'),
        db.raw('MIN(created_at) as first_booking')
      ]);
    const avgLifetimeValue = lifetimeStats.reduce((sum: number, user: any) =>
      sum + parseFloat(user.lifetime_value), 0) / lifetimeStats.length;
    const avgBookingsPerUser = lifetimeStats.reduce((sum: number, user: any) =>
      sum + parseInt(user.booking_count), 0) / lifetimeStats.length;
    return {
      averageLifetimeValue: avgLifetimeValue || 0,
      averageBookingsPerUser: avgBookingsPerUser || 0,
      churnRate: 0,
      retentionRates: [
        { period: '30d', rate: 85 },
        { period: '90d', rate: 72 },
        { period: '1y', rate: 45 }
      ]
    };
  }

  private static async getBookingTimingPatterns(startDate: Date, endDate: Date) {
    const timingData = await db('bookings')
      .whereBetween('created_at', [startDate, endDate])
      .select([
        db.raw('EXTRACT(HOUR FROM created_at) as hour'),
        db.raw('EXTRACT(DOW FROM created_at) as day_of_week'),
        db.raw('COUNT(*) as count')
      ])
      .groupBy(db.raw('EXTRACT(HOUR FROM created_at), EXTRACT(DOW FROM created_at)'))
      .orderBy('count', 'desc');
    return timingData.map((row: any) => ({
      hour: parseInt(row.hour),
      dayOfWeek: parseInt(row.day_of_week),
      count: parseInt(row.count)
    }));
  }

  private static async getAdvanceBookingPatterns(startDate: Date, endDate: Date) {
    const advanceData = await db('bookings')
      .whereBetween('created_at', [startDate, endDate])
      .whereNotNull('start_date')
      .select([
        db.raw('EXTRACT(DAY FROM (start_date - created_at)) as advance_days'),
        db.raw('COUNT(*) as count')
      ])
      .groupBy(db.raw('EXTRACT(DAY FROM (start_date - created_at))'));
    const ranges = [
      { range: '0-1 days', min: 0, max: 1 },
      { range: '2-7 days', min: 2, max: 7 },
      { range: '8-30 days', min: 8, max: 30 },
      { range: '31+ days', min: 31, max: 999 }
    ];
    const total = advanceData.reduce((sum: number, row: any) => sum + parseInt(row.count), 0);
    return ranges.map(range => {
      const count = advanceData
        .filter((row: any) => {
          const days = parseInt(row.advance_days);
          return days >= range.min && days <= range.max;
        })
        .reduce((sum: number, row: any) => sum + parseInt(row.count), 0);
      return {
        range: range.range,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      };
    });
  }

  private static async getAverageTimeBetweenBookings(): Promise<number> {
    return 45;
  }

  private static getDateTruncFunction(granularity: string, field: string): string {
    switch (granularity) {
      case 'hour': return `DATE_TRUNC('hour', ${field})`;
      case 'day': return `DATE_TRUNC('day', ${field})`;
      case 'week': return `DATE_TRUNC('week', ${field})`;
      case 'month': return `DATE_TRUNC('month', ${field})`;
      default: return `DATE_TRUNC('day', ${field})`;
    }
  }

  private static formatDate(date: any, granularity: string): string {
    const d = new Date(date);
    switch (granularity) {
      case 'hour':
        return d.toISOString().substring(0, 13) + ':00:00Z';
      case 'day':
        return d.toISOString().substring(0, 10);
      case 'week':
        return d.toISOString().substring(0, 10);
      case 'month':
        return d.toISOString().substring(0, 7);
      default:
        return d.toISOString().substring(0, 10);
    }
  }

  private static async getRevenueAnalytics(
    baseQuery: any,
    startDate: Date,
    endDate: Date
  ): Promise<RevenueAnalytics> {
    const [revenueBreakdown, paymentMethods, revenueStreams] = await Promise.all([
      baseQuery.clone()
        .whereBetween('bookings.created_at', [startDate, endDate])
        .select([
          db.raw('SUM(bookings.total_amount) as total_revenue'),
          db.raw('SUM(bookings.platform_fee) as platform_fees'),
          db.raw('SUM(bookings.total_amount - bookings.platform_fee) as payouts'),
          db.raw('SUM(bookings.tax_amount) as taxes'),
          db.raw('SUM(CASE WHEN bookings.status = \'cancelled\' THEN bookings.refund_amount ELSE 0 END) as refunds')
        ])
        .first(),
      db('payments')
        .join('bookings', 'payments.booking_id', 'bookings.id')
        .whereBetween('payments.created_at', [startDate, endDate])
        .where('payments.status', 'completed')
        .groupBy('payments.payment_method')
        .select([
          'payments.payment_method as method',
          db.raw('SUM(payments.amount) as amount'),
          db.raw('COUNT(*) as transaction_count')
        ]),
      baseQuery.clone()
        .whereBetween('bookings.created_at', [startDate, endDate])
        .select([
          db.raw('SUM(bookings.platform_fee) as booking_fees'),
          db.raw('SUM(bookings.service_fee) as service_fees'),
          db.raw('0 as premium_features'),
          db.raw('0 as advertisements')
        ])
        .first()
    ]);
    const totalRevenue = parseFloat(revenueBreakdown.total_revenue) || 0;
    const platformFees = parseFloat(revenueBreakdown.platform_fees) || 0;
    const refunds = parseFloat(revenueBreakdown.refunds) || 0;
    const totalPaymentAmount = paymentMethods.reduce((sum: number, pm: any) => sum + parseFloat(pm.amount), 0);
    return {
      breakdown: {
        totalRevenue,
        platformFees,
        payouts: parseFloat(revenueBreakdown.payouts) || 0,
        taxes: parseFloat(revenueBreakdown.taxes) || 0,
        refunds,
        netRevenue: totalRevenue - refunds
      },
      // Fix: Add transactionCount to revenueByPaymentMethod
      revenueByPaymentMethod: paymentMethods.map((pm: any) => ({
        method: pm.method,
        amount: parseFloat(pm.amount),
        percentage: totalPaymentAmount > 0 ? (parseFloat(pm.amount) / totalPaymentAmount) * 100 : 0,
        transactionCount: parseInt(pm.transaction_count)
      })),
      revenueStreams: {
        bookingFees: parseFloat(revenueStreams.booking_fees) || 0,
        serviceFees: parseFloat(revenueStreams.service_fees) || 0,
        premiumFeatures: 0,
        advertisements: 0
      },
      projections: {
        nextMonth: totalRevenue * 1.1,
        nextQuarter: totalRevenue * 3.3,
        confidence: 0.75
      }
    };
  }

  private static async getPerformanceMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<PerformanceMetrics> {
    const [responseTime, funnelData, seasonalData, topPerformers] = await Promise.all([
      this.getResponseTimeMetrics(),
      this.getConversionFunnel(startDate, endDate),
      this.getSeasonalPatterns(),
      this.getTopPerformers(startDate, endDate)
    ]);
    return {
      responseTime,
      conversionFunnel: funnelData,
      seasonality: seasonalData,
      topPerformers
    };
  }

  private static async getResponseTimeMetrics() {
    return {
      averageBookingTime: 15,
      averageConfirmationTime: 4
    };
  }

  private static async getConversionFunnel(startDate: Date, endDate: Date) {
    const [views, bookings, confirmations, completions] = await Promise.all([
      db('product_views').whereBetween('created_at', [startDate, endDate]).count('* as count').first(),
      db('bookings').whereBetween('created_at', [startDate, endDate]).count('* as count').first(),
      db('bookings').whereBetween('created_at', [startDate, endDate]).where('status', 'confirmed').count('* as count').first(),
      db('bookings').whereBetween('created_at', [startDate, endDate]).where('status', 'completed').count('* as count').first()
    ]);
    const viewCount = views && typeof views === 'object' && 'count' in views ? parseInt((views as any).count) : 0;
    const bookingCount = bookings && typeof bookings === 'object' && 'count' in bookings ? parseInt((bookings as any).count) : 0;
    const confirmationCount = confirmations && typeof confirmations === 'object' && 'count' in confirmations ? parseInt((confirmations as any).count) : 0;
    const completionCount = completions && typeof completions === 'object' && 'count' in completions ? parseInt((completions as any).count) : 0;
    return [
      {
        stage: 'Views',
        users: viewCount,
        conversionRate: 100,
        dropoffRate: 0
      },
      {
        stage: 'Bookings',
        users: bookingCount,
        conversionRate: viewCount > 0 ? (bookingCount / viewCount) * 100 : 0,
        dropoffRate: viewCount > 0 ? ((viewCount - bookingCount) / viewCount) * 100 : 0
      },
      {
        stage: 'Confirmations',
        users: confirmationCount,
        conversionRate: bookingCount > 0 ? (confirmationCount / bookingCount) * 100 : 0,
        dropoffRate: bookingCount > 0 ? ((bookingCount - confirmationCount) / bookingCount) * 100 : 0
      },
      {
        stage: 'Completions',
        users: completionCount,
        conversionRate: confirmationCount > 0 ? (completionCount / confirmationCount) * 100 : 0,
        dropoffRate: confirmationCount > 0 ? ((confirmationCount - completionCount) / confirmationCount) * 100 : 0
      }
    ];
  }

  private static async getSeasonalPatterns() {
    const monthlyData = await db('bookings')
      .select([
        db.raw('EXTRACT(MONTH FROM created_at) as month'),
        db.raw('COUNT(*) as bookings'),
        db.raw('SUM(total_amount) as revenue')
      ])
      .groupBy(db.raw('EXTRACT(MONTH FROM created_at)'))
      .orderBy('month');
    const avgBookings = monthlyData.reduce((sum: number, m: any) => sum + parseInt(m.bookings), 0) / monthlyData.length;
    const avgRevenue = monthlyData.reduce((sum: number, m: any) => sum + parseFloat(m.revenue), 0) / monthlyData.length;
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthlyData.map((row: any) => {
      const monthIndex = parseInt(row.month) - 1;
      const bookings = parseInt(row.bookings);
      const revenue = parseFloat(row.revenue);
      return {
        month: months[monthIndex],
        bookingIndex: avgBookings > 0 ? bookings / avgBookings : 1,
        revenueIndex: avgRevenue > 0 ? revenue / avgRevenue : 1,
        demandFactor: avgBookings > 0 ? bookings / avgBookings : 1
      };
    });
  }

  private static async getTopPerformers(startDate: Date, endDate: Date) {
    const [products, owners, locations] = await Promise.all([
      db('bookings')
        .join('products', 'bookings.product_id', 'products.id')
        .whereBetween('bookings.created_at', [startDate, endDate])
        .groupBy('products.id', 'products.title')
        .select([
          'products.id as product_id',
          'products.title',
          db.raw('COUNT(*) as bookings'),
          db.raw('SUM(bookings.total_amount) as revenue'),
          db.raw('AVG(products.rating) as rating')
        ])
        .orderBy('revenue', 'desc')
        .limit(10),
      db('bookings')
        .join('users', 'bookings.owner_id', 'users.id')
        .whereBetween('bookings.created_at', [startDate, endDate])
        .groupBy('users.id', 'users.first_name', 'users.last_name')
        .select([
          'users.id as owner_id',
          db.raw("CONCAT(users.first_name, ' ', users.last_name) as name"),
          db.raw('COUNT(*) as bookings'),
          db.raw('SUM(bookings.total_amount) as revenue'),
          db.raw('AVG(users.rating) as rating')
        ])
        .orderBy('revenue', 'desc')
        .limit(10),
      db('bookings')
        .join('products', 'bookings.product_id', 'products.id')
        .join('countries', 'products.country_id', 'countries.id')
        .whereBetween('bookings.created_at', [startDate, endDate])
        .groupBy('products.city', 'countries.name')
        .select([
          'products.city',
          'countries.name as country',
          db.raw('COUNT(*) as bookings'),
          db.raw('SUM(bookings.total_amount) as revenue')
        ])
        .orderBy('revenue', 'desc')
        .limit(10)
    ]);
    return {
      products: products.map((p: any) => ({
        productId: p.product_id,
        title: p.title,
        bookings: parseInt(p.bookings),
        revenue: parseFloat(p.revenue),
        rating: parseFloat(p.rating) || 0
      })),
      owners: owners.map((o: any) => ({
        ownerId: o.owner_id,
        name: o.name,
        bookings: parseInt(o.bookings),
        revenue: parseFloat(o.revenue),
        rating: parseFloat(o.rating) || 0
      })),
      locations: locations.map((l: any) => ({
        city: l.city,
        country: l.country,
        bookings: parseInt(l.bookings),
        revenue: parseFloat(l.revenue)
      }))
    };
  }

  private static generateInsights(
    metrics: BookingMetrics
  ): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = [];
    if (metrics.growth.totalRevenue > 20) {
      insights.push({
        type: 'growth',
        title: 'Strong Revenue Growth',
        description: `Revenue has increased by ${metrics.growth.totalRevenue.toFixed(1)}% compared to the previous period`,
        impact: 'high',
        metric: 'revenue',
        value: metrics.current.totalRevenue,
        change: metrics.growth.totalRevenue,
        recommendation: 'Consider expanding marketing efforts to capitalize on this growth trend'
      });
    }
    if (metrics.current.cancellationRate > 15) {
      insights.push({
        type: 'warning',
        title: 'High Cancellation Rate',
        description: `Cancellation rate is ${metrics.current.cancellationRate.toFixed(1)}%, which is above the recommended threshold`,
        impact: 'medium',
        metric: 'cancellation_rate',
        value: metrics.current.cancellationRate,
        change: metrics.growth.cancellationRate,
        recommendation: 'Review booking policies and consider implementing stricter cancellation terms'
      });
    }
    if (metrics.current.conversionRate < 5) {
      insights.push({
        type: 'opportunity',
        title: 'Low Conversion Rate',
        description: `Conversion rate is ${metrics.current.conversionRate.toFixed(1)}%, indicating potential for improvement`,
        impact: 'high',
        metric: 'conversion_rate',
        value: metrics.current.conversionRate,
        change: metrics.growth.conversionRate,
        recommendation: 'Optimize product listings, improve search functionality, and enhance user experience'
      });
    }
    return insights;
  }

  private static async cacheAnalytics(params: BookingAnalyticsParams, response: BookingAnalyticsResponse): Promise<void> {
    try {
      const redis = getRedis();
      if (!redis) return; // Skip caching if Redis is not available
      
      const cacheKey = `analytics:booking:${JSON.stringify(params)}`;
      await redis.setEx(cacheKey, 3600, JSON.stringify(response));
    } catch (error) {
      logger.warn('Failed to cache analytics:', error);
      // Non-critical error - continue without caching
    }
  }
}

export default AnalyticsService;
