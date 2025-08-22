export interface AdminDashboardStats {
  overview: {
    totalUsers: number;
    totalProducts: number;
    totalBookings: number;
    totalRevenue: number;
    activeUsers: number;
    pendingApprovals: number;
    disputedBookings: number;
    platformGrowth: number;
  };
  userMetrics: {
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    usersByRole: { role: string; count: number }[];
    usersByStatus: { status: string; count: number }[];
    usersByCountry: { country: string; count: number }[];
  };
  productMetrics: {
    newProductsToday: number;
    newProductsThisWeek: number;
    newProductsThisMonth: number;
    productsByCategory: { category: string; count: number }[];
    productsByStatus: { status: string; count: number }[];
    topPerformingProducts: ProductPerformance[];
  };
  bookingMetrics: {
    bookingsToday: number;
    bookingsThisWeek: number;
    bookingsThisMonth: number;
    bookingsByStatus: { status: string; count: number }[];
    averageBookingValue: number;
    conversionRate: number;
  };
  financialMetrics: {
    revenueToday: number;
    revenueThisWeek: number;
    revenueThisMonth: number;
    revenueThisYear: number;
    platformFees: number;
    payoutsPending: number;
    refundsProcessed: number;
  };
}

export interface ProductPerformance {
  id: string;
  title: string;
  ownerName: string;
  totalBookings: number;
  totalRevenue: number;
  rating: number;
  viewCount: number;
}

export interface UserModerationAction {
  id: string;
  userId: string;
  adminId: string;
  action: 'suspend' | 'ban' | 'activate' | 'verify' | 'warn';
  reason: string;
  duration?: number; // in days
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface ProductModerationAction {
  id: string;
  productId: string;
  adminId: string;
  action: 'approve' | 'reject' | 'flag' | 'quarantine' | 'delete' | 'draft';
  reason: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface DisputeData {
  id: string;
  bookingId: string;
  reporterId: string;
  reportedUserId: string;
  type: 'payment' | 'property_damage' | 'no_show' | 'behavior' | 'other';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  evidence?: string[];
  resolution?: string;
  assignedAdminId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  version: string;
  environment: string;
  database: {
    status: 'connected' | 'disconnected';
    responseTime: number;
    connections: number;
  };
  redis: {
    status: 'connected' | 'disconnected';
    responseTime: number;
    memory: number;
  };
  services: {
    email: boolean;
    sms: boolean;
    payment: boolean;
    ai: boolean;
    storage: boolean;
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
  };
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  action: string;
  resource: string;
  resourceId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

export interface AdminFilters {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  role?: string;
  country?: string;
  search?: string;
}

export interface FinancialReport {
  period: string;
  totalRevenue: number;
  platformFees: number;
  payouts: number;
  refunds: number;
  netRevenue: number;
  transactionCount: number;
  averageTransactionValue: number;
  topEarners: {
    userId: string;
    username: string;
    earnings: number;
  }[];
  revenueByCategory: {
    category: string;
    revenue: number;
  }[];
  revenueByCountry: {
    country: string;
    revenue: number;
  }[];
}
