// =====================================================
// BOOKING MODEL
// =====================================================

import { 
  BookingData, 
  CreateBookingData, 
  UpdateBookingData, 
  BookingFilters,
  BookingStatus,
  BookingPricing,
  BookingTimelineEvent,
  BookingMessage,
  BookingStatusHistory,
  PickupMethod,
  PaymentStatus,
  InsuranceType,
  ConditionType
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Demo Booking Model - In-memory implementation
export class Booking {
  public id: string;
  public booking_number: string;
  public renter_id: string;
  public owner_id: string;
  public product_id: string;
  public start_date: Date;
  public end_date: Date;
  public status: BookingStatus;
  public payment_status: PaymentStatus;
  public insurance_type?: InsuranceType;
  
  // Pickup and delivery information
  public pickup_method: PickupMethod;
  public delivery_method?: string; // Enhanced: pickup, delivery, meet_public
  public pickup_address?: string;
  public delivery_address?: string;
  public meet_public_location?: string; // For meet_public method
  public pickup_coordinates?: { lat: number; lng: number };
  public delivery_coordinates?: { lat: number; lng: number };
  public meet_public_coordinates?: { lat: number; lng: number }; // For meet_public method
  
  // Enhanced delivery options
  public delivery_time_window?: string; // morning, afternoon, evening, flexible
  public delivery_instructions?: string; // Gate codes, special notes, preferred location
  public delivery_status?: string; // scheduled, confirmed, out_for_delivery, etc.
  public delivery_tracking_number?: string; // For courier services
  public delivery_eta?: string; // Estimated time of arrival
  public delivery_driver_contact?: string; // Driver/courier contact info
  
  // Insurance information
  public insurance_policy_number?: string;
  public insurance_premium?: number;
  public insurance_details?: Record<string, any>;
  
  // Financial information
  public pricing: BookingPricing;
  public total_amount: number;
  public security_deposit?: number;
  public platform_fee?: number;
  public tax_amount?: number;
  
  // AI and risk assessment
  public ai_risk_score?: number;
  public ai_assessment?: Record<string, any>;
  
  // Notes and instructions
  public special_instructions?: string;
  public renter_notes?: string;
  public owner_notes?: string;
  public admin_notes?: string;
  
  // Condition tracking
  public initial_condition?: ConditionType;
  public final_condition?: ConditionType;
  public damage_report?: string;
  public damage_photos?: string[];
  
  // System fields
  public timeline: BookingTimelineEvent[];
  public messages: BookingMessage[];
  public status_history: BookingStatusHistory[];
  public created_by?: string;
  public last_modified_by?: string;
  public created_at: Date;
  public updated_at: Date;
  
  // Additional metadata
  public metadata?: Record<string, any>;
  public is_repeat_booking?: boolean;
  public parent_booking_id?: string;
  public owner_confirmed?: boolean;
  public owner_confirmation_status?: 'pending' | 'confirmed' | 'rejected';
  public owner_confirmed_at?: Date;
  public owner_rejection_reason?: string;
  public owner_confirmation_notes?: string;

  // In-memory storage for demo
  private static bookings: Booking[] = [];

  constructor(data: CreateBookingData & { pricing: BookingPricing }) {
    // Use the ID from database if provided, otherwise generate one
    this.id = (data as any).id ;
    this.booking_number = (data as any).booking_number || this.generateBookingNumber();
    this.renter_id = data.renter_id;
    this.owner_id = data.owner_id;
    this.product_id = data.product_id;
    this.start_date = new Date(data.start_date);
    this.end_date = new Date(data.end_date);
    // IMPORTANT: Use status from data if provided (from database), otherwise default to 'pending' (new booking)
    // When loading from database, status will be in data; when creating new, it won't be
    this.status = (data as any).status || 'pending';
    this.payment_status = (data as any).payment_status || 'pending';
    this.pickup_method = data.pickup_method;
    this.delivery_method = (data as any).delivery_method;
    this.pickup_address = data.pickup_address;
    this.delivery_address = data.delivery_address;
    this.meet_public_location = (data as any).meet_public_location;
    this.pickup_coordinates = data.pickup_coordinates;
    this.delivery_coordinates = data.delivery_coordinates;
    this.meet_public_coordinates = (data as any).meet_public_coordinates;
    this.delivery_time_window = (data as any).delivery_time_window;
    this.delivery_instructions = (data as any).delivery_instructions;
    this.delivery_status = (data as any).delivery_status;
    this.delivery_tracking_number = (data as any).delivery_tracking_number;
    this.delivery_eta = (data as any).delivery_eta;
    this.delivery_driver_contact = (data as any).delivery_driver_contact;
    this.special_instructions = data.special_instructions;
    this.renter_notes = data.renter_notes;
    this.insurance_type = data.insurance_type || 'none';
    // Handle pricing - might not exist when loading from database
    this.pricing = data.pricing || (data as any).pricing || {};
    this.total_amount = data.pricing?.total_amount || (data as any).total_amount || 0;
    this.security_deposit = data.security_deposit || (data as any).security_deposit || 0;
    this.metadata = data.metadata;
    this.owner_confirmed = (data as any).owner_confirmed ?? (data as any).ownerConfirmed ?? false;
    this.owner_confirmation_status =
      (data as any).owner_confirmation_status ||
      (data as any).ownerConfirmationStatus ||
      'pending';
    this.owner_confirmed_at = (data as any).owner_confirmed_at
      ? new Date((data as any).owner_confirmed_at)
      : undefined;
    this.owner_rejection_reason =
      (data as any).owner_rejection_reason || (data as any).ownerRejectionReason;
    this.owner_confirmation_notes =
      (data as any).owner_confirmation_notes || (data as any).ownerConfirmationNotes;
    this.timeline = [];
    this.messages = [];
    this.status_history = [];
    this.created_by = (data as any).created_by || data.renter_id;
    this.created_at = (data as any).created_at ? new Date((data as any).created_at) : new Date();
    this.updated_at = (data as any).updated_at ? new Date((data as any).updated_at) : new Date();
    this.is_repeat_booking = data.is_repeat_booking;
    this.parent_booking_id = data.parent_booking_id;

    // Add initial timeline event
    this.addTimelineEvent('booking_created', data.renter_id, 'Booking request submitted');
    
    // Add initial status history
    this.addStatusHistoryEntry(undefined, 'pending', data.renter_id, 'Booking created');
  }

  // Generate unique booking number
  private generateBookingNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `BK${year}${month}${day}${random}`;
  }

  // Static methods for CRUD operations
  static async create(data: CreateBookingData & { renter_id: string; owner_id: string; pricing: BookingPricing }): Promise<Booking> {
    const booking = new Booking(data);
    Booking.bookings.push(booking);
    return booking;
  }

  static async findById(id: string): Promise<Booking | null> {
    return Booking.bookings.find(b => b.id === id) || null;
  }

  static async findByBookingNumber(booking_number: string): Promise<Booking | null> {
    return Booking.bookings.find(b => b.booking_number === booking_number) || null;
  }

  static async findAll(): Promise<Booking[]> {
    return Booking.bookings;
  }

  static async getPaginated(
    page: number = 1, 
    limit: number = 10, 
    filters: BookingFilters = {},
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{
    data: Booking[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    let filtered = Booking.bookings;

    // Apply filters
    if (filters.renter_id) {
      filtered = filtered.filter(b => b.renter_id === filters.renter_id);
    }

    if (filters.owner_id) {
      filtered = filtered.filter(b => b.owner_id === filters.owner_id);
    }

    if (filters.product_id) {
      filtered = filtered.filter(b => b.product_id === filters.product_id);
    }

    if (filters.status) {
      filtered = filtered.filter(b => b.status === filters.status);
    }

    if (filters.payment_status) {
      filtered = filtered.filter(b => b.payment_status === filters.payment_status);
    }

    if (filters.insurance_type) {
      filtered = filtered.filter(b => b.insurance_type === filters.insurance_type);
    }

    if (filters.booking_number) {
      filtered = filtered.filter(b => b.booking_number.toLowerCase().includes(filters.booking_number!.toLowerCase()));
    }

    if (filters.min_amount) {
      filtered = filtered.filter(b => b.total_amount >= filters.min_amount!);
    }

    if (filters.max_amount) {
      filtered = filtered.filter(b => b.total_amount <= filters.max_amount!);
    }

    if (filters.has_insurance !== undefined) {
      filtered = filtered.filter(b => (b.insurance_type !== 'none') === filters.has_insurance);
    }

    if (filters.is_damaged !== undefined) {
      filtered = filtered.filter(b => (b.damage_report !== undefined && b.damage_report !== '') === filters.is_damaged);
    }

    if (filters.start_date) {
      const filterDate = typeof filters.start_date === 'string' ? new Date(filters.start_date) : filters.start_date;
      filtered = filtered.filter(b => b.start_date >= (filterDate as Date));
    }

    if (filters.end_date) {
      const filterDate = typeof filters.end_date === 'string' ? new Date(filters.end_date) : filters.end_date;
      filtered = filtered.filter(b => b.end_date <= (filterDate as Date));
    }

    // Sorting
    filtered.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (sortBy) {
        case 'created_at':
          valueA = a.created_at;
          valueB = b.created_at;
          break;
        case 'start_date':
          valueA = a.start_date;
          valueB = b.start_date;
          break;
        case 'total_amount':
          valueA = a.total_amount;
          valueB = b.total_amount;
          break;
        case 'booking_number':
          valueA = a.booking_number;
          valueB = b.booking_number;
          break;
        default:
          valueA = a.created_at;
          valueB = b.created_at;
      }

      if (sortOrder === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });

    // Calculate pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const data = filtered.slice(offset, offset + limit);

    return {
      data,
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  // Instance methods
  async update(data: UpdateBookingData): Promise<Booking> {
    Object.keys(data).forEach(key => {
      if (data[key as keyof UpdateBookingData] !== undefined) {
        (this as any)[key] = data[key as keyof UpdateBookingData];
      }
    });
    this.updated_at = new Date();
    return this;
  }

  async updateStatus(status: BookingStatus, user_id: string, reason?: string): Promise<Booking> {
    const oldStatus = this.status;
    this.status = status;
    this.last_modified_by = user_id;
    this.updated_at = new Date();

    // Add timeline event
    const description = reason 
      ? `Status changed from ${oldStatus} to ${status}. Reason: ${reason}`
      : `Status changed from ${oldStatus} to ${status}`;
    
    this.addTimelineEvent('status_changed', user_id, description, { oldStatus, newStatus: status, reason });
    
    // Add status history entry
    this.addStatusHistoryEntry(oldStatus, status, user_id, reason);

    return this;
  }

  // Add status history entry
  private addStatusHistoryEntry(previousStatus: BookingStatus | undefined, newStatus: BookingStatus, changedBy: string, reason?: string): void {
    const historyEntry: BookingStatusHistory = {
      id: uuidv4(),
      booking_id: this.id,
      previous_status: previousStatus,
      new_status: newStatus,
      changed_by: changedBy,
      reason,
      changed_at: new Date()
    };
    this.status_history.push(historyEntry);
  }

  async cancel(user_id: string, reason?: string): Promise<Booking> {
    return this.updateStatus('cancelled', user_id, reason);
  }

  async checkIn(user_id: string): Promise<Booking> {
    this.status = 'in_progress';
    this.last_modified_by = user_id;
    this.updated_at = new Date();
    this.addTimelineEvent('checked_in', user_id, 'Rental period started');
    this.addStatusHistoryEntry('confirmed', 'in_progress', user_id, 'Check-in completed');
    return this;
  }

  async checkOut(user_id: string): Promise<Booking> {
    this.status = 'completed';
    this.last_modified_by = user_id;
    this.updated_at = new Date();
    this.addTimelineEvent('checked_out', user_id, 'Rental period completed');
    this.addStatusHistoryEntry('in_progress', 'completed', user_id, 'Check-out completed');
    return this;
  }

  canUpdateStatus(user_id: string, newStatus: BookingStatus): boolean {
    // Owner can confirm/reject pending bookings
    if (this.owner_id === user_id && this.status === 'pending' && ['confirmed', 'cancelled'].includes(newStatus)) {
      return true;
    }

    // Both parties can cancel
    if ((this.renter_id === user_id || this.owner_id === user_id) && newStatus === 'cancelled') {
      return true;
    }

    // Both parties can start/end rental
    if ((this.renter_id === user_id || this.owner_id === user_id) && 
        ((this.status === 'confirmed' && newStatus === 'in_progress') ||
         (this.status === 'in_progress' && newStatus === 'completed'))) {
      return true;
    }

    return false;
  }

  toJSON(): BookingData {
    return {
      id: this.id,
      booking_number: this.booking_number,
      renter_id: this.renter_id,
      owner_id: this.owner_id,
      product_id: this.product_id,
      start_date: this.start_date instanceof Date ? this.start_date.toISOString() : this.start_date,
      end_date: this.end_date instanceof Date ? this.end_date.toISOString() : this.end_date,
      status: this.status,
      payment_status: this.payment_status,
      insurance_type: this.insurance_type,
      pickup_method: this.pickup_method,
      pickup_address: this.pickup_address,
      delivery_address: this.delivery_address,
      pickup_coordinates: this.pickup_coordinates,
      delivery_coordinates: this.delivery_coordinates,
      insurance_policy_number: this.insurance_policy_number,
      insurance_premium: this.insurance_premium,
      insurance_details: this.insurance_details,
      special_instructions: this.special_instructions,
      renter_notes: this.renter_notes,
      owner_notes: this.owner_notes,
      admin_notes: this.admin_notes,
      pricing: {
        ...this.pricing,
        insurance_fee: typeof this.pricing.insurance_fee === 'number' ? this.pricing.insurance_fee : 0
      },
      total_amount: this.total_amount,
      security_deposit: this.security_deposit,
      platform_fee: this.platform_fee,
      tax_amount: this.tax_amount,
      ai_risk_score: this.ai_risk_score,
      ai_assessment: this.ai_assessment,
      initial_condition: this.initial_condition,
      final_condition: this.final_condition,
      damage_report: this.damage_report,
      damage_photos: this.damage_photos,
      created_by: this.created_by,
      last_modified_by: this.last_modified_by,
      created_at: this.created_at,
      updated_at: this.updated_at,
      metadata: this.metadata,
      is_repeat_booking: this.is_repeat_booking,
      parent_booking_id: this.parent_booking_id,
      owner_confirmed: this.owner_confirmed,
      owner_confirmation_status: this.owner_confirmation_status,
      owner_confirmed_at: this.owner_confirmed_at instanceof Date 
        ? this.owner_confirmed_at.toISOString() 
        : this.owner_confirmed_at,
      owner_rejection_reason: this.owner_rejection_reason,
      owner_confirmation_notes: this.owner_confirmation_notes,
      createdAt: this.created_at instanceof Date ? this.created_at : new Date(this.created_at),
      updatedAt: this.updated_at instanceof Date ? this.updated_at : new Date(this.updated_at)
    };
  }

  // Timeline management
  addTimelineEvent(eventType: string, user_id: string, description: string, metadata?: Record<string, any>): void {
    const event: BookingTimelineEvent = {
      id: uuidv4(),
      event_type: eventType,
      user_id,
      timestamp: new Date(),
      description,
      metadata
    };
    this.timeline.push(event);
  }

  async getTimeline(): Promise<BookingTimelineEvent[]> {
    return this.timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Get status history
  async getStatusHistory(): Promise<BookingStatusHistory[]> {
    return this.status_history.sort((a, b) => a.changed_at.getTime() - b.changed_at.getTime());
  }

  // Message management
  static async sendMessage(booking_id: string, sender_id: string, message: string): Promise<BookingMessage> {
    const messageObj: BookingMessage = {
      id: uuidv4(),
      booking_id,
      sender_id,
      message,
      timestamp: new Date(),
      is_read: false
    };

    const booking = await Booking.findById(booking_id);
    if (booking) {
      booking.messages.push(messageObj);
    }

    return messageObj;
  }

  static async getMessages(booking_id: string, page: number = 1, limit: number = 50): Promise<{
    data: BookingMessage[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    const booking = await Booking.findById(booking_id);
    if (!booking) {
      throw new Error('Booking not found');
    }

    const messages = booking.messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const total = messages.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const data = messages.slice(offset, offset + limit);

    return {
      data,
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  // Analytics
  static async getAnalytics(timeframe: string = '30d'): Promise<{
    total_bookings: number;
    total_revenue: number;
    average_booking_value: number;
    bookings_by_status: Record<BookingStatus, number>;
    revenue_over_time: Array<{ date: string; revenue: number; bookings: number }>;
    insurance_stats: Record<InsuranceType, number>;
    damage_stats: { total_damaged: number; damage_rate: number };
  }> {
    const bookings = Booking.bookings;
    
    // Calculate date range based on timeframe
    const now = new Date();
    const daysBack = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    
    const filteredBookings = bookings.filter(b => b.created_at >= startDate);
    
    const total_bookings = filteredBookings.length;
    const total_revenue = filteredBookings.reduce((sum, b) => sum + b.total_amount, 0);
    const average_booking_value = total_bookings > 0 ? total_revenue / total_bookings : 0;
    
    const bookings_by_status: Record<BookingStatus, number> = {
      pending: 0,
      confirmed: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      disputed: 0,
      cancellation_requested: 0
    };
    
    const insurance_stats: Record<InsuranceType, number> = {
      none: 0,
      basic: 0,
      standard: 0,
      premium: 0
    };
    
    filteredBookings.forEach(b => {
      bookings_by_status[b.status]++;
      if (b.insurance_type) {
        insurance_stats[b.insurance_type]++;
      }
    });
    
    // Damage statistics
    const damagedBookings = filteredBookings.filter(b => b.damage_report && b.damage_report.trim() !== '');
    const damage_stats = {
      total_damaged: damagedBookings.length,
      damage_rate: total_bookings > 0 ? (damagedBookings.length / total_bookings) * 100 : 0
    };
    
    // Mock revenue over time data
    const revenue_over_time = [];
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dayBookings = filteredBookings.filter(b => 
        b.created_at.toDateString() === date.toDateString()
      );
      
      revenue_over_time.push({
        date: date.toISOString().split('T')[0],
        revenue: dayBookings.reduce((sum, b) => sum + b.total_amount, 0),
        bookings: dayBookings.length
      });
    }

    return {
      total_bookings,
      total_revenue,
      average_booking_value,
      bookings_by_status,
      revenue_over_time,
      insurance_stats,
      damage_stats
    };
  }

  // Demo data seeding
  static async seed(): Promise<void> {
    if (Booking.bookings.length > 0) return;

    // Skip creating demo bookings to avoid confusion with real booking attempts
    console.log('📝 Demo mode: Skipping demo bookings creation to avoid data confusion');
    
    // Uncomment below if you want demo bookings:
    /*
    // Create some demo bookings after products are seeded
    const demoBookings = [
      {
        renter_id: 'demo-user-4',
        owner_id: 'demo-user-1',
        product_id: 'will-be-replaced-with-actual-product-id',
        start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        pickup_method: 'pickup' as PickupMethod,
        pickup_address: '123 Main St, Downtown',
        special_instructions: 'Please have the property cleaned and ready for check-in at 3 PM',
        renter_notes: 'First time renting, please provide detailed instructions',
        insurance_type: 'standard' as InsuranceType,
        security_deposit: 500,
        pricing: {
          base_price: 299.99,
          currency: 'USD',
          total_days: 3,
          subtotal: 899.97,
          platform_fee: 89.99,
          tax_amount: 71.99,
          insurance_fee: 25.00,
          total_amount: 1061.95
        }
      }
    ];

    for (const bookingData of demoBookings) {
      await Booking.create({
        ...bookingData,
        start_date: (bookingData.start_date instanceof Date)
          ? bookingData.start_date.toISOString()
          : bookingData.start_date,
        end_date: (bookingData.end_date instanceof Date)
          ? bookingData.end_date.toISOString()
          : bookingData.end_date,
        pricing: {
          ...bookingData.pricing,
          insurance_fee: typeof bookingData.pricing.insurance_fee === 'number' ? bookingData.pricing.insurance_fee : 0
        }
      });
    }
    */
  }
}

export default Booking;
