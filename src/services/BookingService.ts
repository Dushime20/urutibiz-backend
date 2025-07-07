import { BaseService } from './BaseService';
import BookingRepository from '@/repositories/BookingRepository';
import { BookingData, CreateBookingData, UpdateBookingData } from '@/types/booking.types';
import { ValidationError } from '@/types';
import { businessRules } from '@/config/businessRules';
import UserVerificationService from '@/services/userVerification.service';

class BookingService extends BaseService<BookingData, CreateBookingData, UpdateBookingData> {
  constructor() {
    super(BookingRepository);
  }

  protected async validateCreate(data: CreateBookingData): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    if (!data.productId) errors.push({ field: 'productId', message: 'Product ID is required' });
    if (!data.startDate) errors.push({ field: 'startDate', message: 'Start date is required' });
    if (!data.endDate) errors.push({ field: 'endDate', message: 'End date is required' });
    if (!data.pickupMethod) errors.push({ field: 'pickupMethod', message: 'Pickup method is required' });
    // Add more advanced validation as needed
    return errors;
  }

  protected async validateUpdate(_data: UpdateBookingData): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    // Add update-specific validation as needed
    return errors;
  }

  protected async applyCreateBusinessRules(data: CreateBookingData): Promise<CreateBookingData> {
    // Enforce business rules from config
    // Only allow booking if user is verified or has allowed role
    const user = (data as any).user; // Assume user is attached to data or context
    if (businessRules.booking.requireVerifiedUser) {
      const isAllowedRole = user && businessRules.booking.allowedRoles.includes(user.role);
      const isVerified = user && await UserVerificationService.isUserFullyKycVerified(user.id);
      if (!isAllowedRole && !isVerified) {
        throw new Error('You must be verified or have an allowed role to create a booking.');
      }
    }
    // Set default status if present in business rules and type allows
    const booking: any = { ...data };
    if ('status' in booking || (businessRules.booking.defaultStatus && typeof booking === 'object')) {
      booking.status = businessRules.booking.defaultStatus;
    }
    return booking;
  }

  protected async applyUpdateBusinessRules(data: UpdateBookingData): Promise<UpdateBookingData> {
    // Add business logic for updates if needed
    return data;
  }
}

export default new BookingService();
