/**
 * Delivery Service
 * 
 * Handles delivery fee calculation, delivery management, and tracking
 */

import { getDatabase } from '../config/database';
import logger from '../utils/logger';
import type { DeliveryMethod, DeliveryTimeWindow, DeliveryStatus } from '../types/product.types';

export interface DeliveryFeeCalculation {
  baseFee: number;
  distanceFee?: number;
  timeWindowFee?: number;
  urgencyFee?: number;
  totalFee: number;
  currency: string;
  breakdown: {
    item: string;
    amount: number;
    description?: string;
  }[];
}

export interface DeliveryOptions {
  method: DeliveryMethod;
  timeWindow?: DeliveryTimeWindow;
  instructions?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  meetPublicLocation?: string;
  meetPublicCoordinates?: { lat: number; lng: number };
}

export interface DeliveryTracking {
  status: DeliveryStatus;
  currentLocation?: { lat: number; lng: number };
  eta?: string;
  trackingNumber?: string;
  driverContact?: string;
  updates: Array<{
    status: DeliveryStatus;
    timestamp: string;
    location?: { lat: number; lng: number };
    notes?: string;
  }>;
}

export class DeliveryService {
  private static readonly BASE_DELIVERY_FEE = 5.00; // Base delivery fee in USD
  private static readonly PER_KM_RATE = 0.50; // Per kilometer rate
  private static readonly TIME_WINDOW_FEES: Record<DeliveryTimeWindow, number> = {
    morning: 0,
    afternoon: 0,
    evening: 2.00, // Evening premium
    flexible: 0,
  };
  private static readonly URGENCY_FEE = 10.00; // Same-day delivery fee

  /**
   * Calculate delivery fee based on distance, time window, and urgency
   */
  static async calculateDeliveryFee(
    productId: string,
    deliveryOptions: DeliveryOptions,
    renterCoordinates?: { lat: number; lng: number }
  ): Promise<DeliveryFeeCalculation> {
    try {
      const db = getDatabase();
      
      // Get product location
      const product = await db('products')
        .where('id', productId)
        .select('location', 'delivery_fee', 'delivery_radius_km', 'base_currency')
        .first();

      if (!product) {
        throw new Error('Product not found');
      }

      const currency = product.base_currency || 'USD';
      const baseFee = product.delivery_fee || this.BASE_DELIVERY_FEE;
      const breakdown: DeliveryFeeCalculation['breakdown'] = [];
      let totalFee = 0;

      // Base delivery fee
      breakdown.push({
        item: 'Base Delivery Fee',
        amount: baseFee,
        description: 'Standard delivery service'
      });
      totalFee += baseFee;

      // Distance-based fee (if coordinates provided)
      if (deliveryOptions.coordinates && product.location) {
        const distance = this.calculateDistance(
          { lat: product.location.latitude || product.location.lat, lng: product.location.longitude || product.location.lng },
          deliveryOptions.coordinates
        );

        if (distance > 0) {
          // Check if within delivery radius
          const deliveryRadius = product.delivery_radius_km || 50; // Default 50km
          
          if (distance > deliveryRadius) {
            throw new Error(`Delivery address is outside the ${deliveryRadius}km delivery radius`);
          }

          const distanceFee = distance * this.PER_KM_RATE;
          breakdown.push({
            item: 'Distance Fee',
            amount: distanceFee,
            description: `${distance.toFixed(1)} km × $${this.PER_KM_RATE}/km`
          });
          totalFee += distanceFee;
        }
      }

      // Time window fee
      if (deliveryOptions.timeWindow && deliveryOptions.timeWindow !== 'flexible') {
        const timeWindowFee = this.TIME_WINDOW_FEES[deliveryOptions.timeWindow] || 0;
        if (timeWindowFee > 0) {
          breakdown.push({
            item: 'Time Window Fee',
            amount: timeWindowFee,
            description: `${deliveryOptions.timeWindow} delivery window`
          });
          totalFee += timeWindowFee;
        }
      }

      // Same-day/urgent delivery fee (if delivery is today)
      const isUrgent = this.isUrgentDelivery(deliveryOptions);
      if (isUrgent) {
        breakdown.push({
          item: 'Urgency Fee',
          amount: this.URGENCY_FEE,
          description: 'Same-day delivery'
        });
        totalFee += this.URGENCY_FEE;
      }

      return {
        baseFee,
        distanceFee: breakdown.find(b => b.item === 'Distance Fee')?.amount,
        timeWindowFee: breakdown.find(b => b.item === 'Time Window Fee')?.amount,
        urgencyFee: isUrgent ? this.URGENCY_FEE : undefined,
        totalFee: Math.round(totalFee * 100) / 100, // Round to 2 decimal places
        currency,
        breakdown
      };
    } catch (error: any) {
      logger.error('Error calculating delivery fee:', error);
      throw new Error(`Failed to calculate delivery fee: ${error.message}`);
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private static calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lng - point1.lng);
    const lat1 = this.toRad(point1.lat);
    const lat2 = this.toRad(point2.lat);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Check if delivery is urgent (same-day)
   */
  private static isUrgentDelivery(deliveryOptions: DeliveryOptions): boolean {
    // This would check if delivery date is today
    // For now, return false - can be enhanced with actual date checking
    return false;
  }

  /**
   * Get available delivery time windows for a given date
   */
  static getAvailableTimeWindows(date: string): DeliveryTimeWindow[] {
    const deliveryDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deliveryDate.setHours(0, 0, 0, 0);

    const isToday = deliveryDate.getTime() === today.getTime();
    const currentHour = new Date().getHours();

    const windows: DeliveryTimeWindow[] = [];

    if (isToday) {
      // If today, only show future time windows
      if (currentHour < 12) {
        windows.push('afternoon', 'evening', 'flexible');
      } else if (currentHour < 17) {
        windows.push('evening', 'flexible');
      } else {
        windows.push('flexible'); // Only flexible available for same-day evening
      }
    } else {
      // Future dates - all windows available
      windows.push('morning', 'afternoon', 'evening', 'flexible');
    }

    return windows;
  }

  /**
   * Get time range for a delivery time window
   */
  static getTimeWindowRange(window: DeliveryTimeWindow): { start: string; end: string } {
    const ranges: Record<DeliveryTimeWindow, { start: string; end: string }> = {
      morning: { start: '08:00', end: '12:00' },
      afternoon: { start: '12:00', end: '17:00' },
      evening: { start: '17:00', end: '21:00' },
      flexible: { start: '08:00', end: '21:00' }
    };

    return ranges[window] || ranges.flexible;
  }

  /**
   * Create delivery tracking record
   */
  static async createDeliveryTracking(
    bookingId: string,
    initialStatus: DeliveryStatus = 'scheduled'
  ): Promise<DeliveryTracking> {
    const tracking: DeliveryTracking = {
      status: initialStatus,
      updates: [{
        status: initialStatus,
        timestamp: new Date().toISOString(),
        notes: 'Delivery scheduled'
      }]
    };

    // Store in booking metadata or separate tracking table
    // For now, return the tracking object
    return tracking;
  }

  /**
   * Update delivery status
   */
  static async updateDeliveryStatus(
    bookingId: string,
    status: DeliveryStatus,
    location?: { lat: number; lng: number },
    notes?: string
  ): Promise<DeliveryTracking> {
    // This would update the tracking in database
    // For now, return updated tracking
    const tracking: DeliveryTracking = {
      status,
      currentLocation: location,
      updates: [{
        status,
        timestamp: new Date().toISOString(),
        location,
        notes
      }]
    };

    return tracking;
  }

  /**
   * Validate delivery options
   */
  static validateDeliveryOptions(options: DeliveryOptions): { valid: boolean; error?: string } {
    if (!options.method) {
      return { valid: false, error: 'Delivery method is required' };
    }

    if (options.method === 'delivery') {
      if (!options.address && !options.coordinates) {
        return { valid: false, error: 'Delivery address or coordinates are required' };
      }
    }

    if (options.method === 'meet_public') {
      if (!options.meetPublicLocation && !options.meetPublicCoordinates) {
        return { valid: false, error: 'Meet location is required for public meeting' };
      }
    }

    return { valid: true };
  }
}

