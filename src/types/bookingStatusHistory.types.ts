// =====================================================
// BOOKING STATUS HISTORY TYPES
// =====================================================

import { BookingStatus } from './booking.types';

export interface BookingStatusHistoryData {
  id: string;
  bookingId: string;
  oldStatus?: BookingStatus;
  newStatus: BookingStatus;
  changedBy?: string;
  reason?: string;
  notes?: string;
  createdAt: Date;
}

export interface CreateBookingStatusHistoryData {
  bookingId: string;
  oldStatus?: BookingStatus;
  newStatus: BookingStatus;
  changedBy?: string;
  reason?: string;
  notes?: string;
}

export interface BookingStatusHistoryFilters {
  bookingId?: string;
  changedBy?: string;
  oldStatus?: BookingStatus;
  newStatus?: BookingStatus;
  startDate?: string;
  endDate?: string;
}

export interface BookingStatusHistorySearchParams {
  bookingId?: string;
  changedBy?: string;
  status?: BookingStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}
