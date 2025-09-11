import { BaseService } from './BaseService';
import UserRepository from '@/repositories/UserRepository';
import { UserData, CreateUserData, UpdateUserData } from '@/types/user.types';
import { ValidationError } from '@/types';
import User from '@/models/User.model';

class UserService extends BaseService<UserData, CreateUserData, UpdateUserData> {
  constructor() {
    super(UserRepository);
  }

  protected async validateCreate(data: CreateUserData): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    if (!data.email) errors.push({ field: 'email', message: 'Email is required' });
    if (!data.password) errors.push({ field: 'password', message: 'Password is required' });
    if (!data.firstName) errors.push({ field: 'firstName', message: 'First name is required' });
    if (!data.lastName) errors.push({ field: 'lastName', message: 'Last name is required' });
    if (!data.countryId) errors.push({ field: 'countryId', message: 'Country is required' });
    // Add more advanced validation as needed
    return errors;
  }

  protected async validateUpdate(_data: UpdateUserData): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    // Add update-specific validation as needed
    return errors;
  }

  protected async applyCreateBusinessRules(data: CreateUserData): Promise<CreateUserData> {
    // Add business logic (e.g., set default role)
    if (!data.role) data.role = 'renter';
    // Default preferred currency
    if (!data.preferred_currency) data.preferred_currency = 'USD';
    return data;
  }

  protected async applyUpdateBusinessRules(data: UpdateUserData): Promise<UpdateUserData> {
    // Add business logic for updates if needed
    return data;
  }

  public async verifyPassword(userId: string, password: string): Promise<boolean> {
    // Fetch the user model instance
    const userModel = await User.findById(userId);
    if (!userModel) return false;
    return userModel.verifyPassword(password);
  }

  public async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    const userModel = await User.findById(userId);
    if (!userModel) return false;
    await userModel.changePassword(newPassword);
    return true;
  }
}

export default new UserService();
