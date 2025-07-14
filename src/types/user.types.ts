// =====================================================
// USER TYPES
// =====================================================

export type UserRole = 'renter' | 'owner' | 'admin' | 'moderator';
export type UserStatus = 'pending' | 'active' | 'suspended' | 'banned';

export interface UserData {
  id: string;
  email: string;
  phone: string;
  passwordHash?: string;
  role: UserRole;
  status: UserStatus;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  countryId: string;
  profileImageUrl?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt?: Date;
  preferences?: Record<string, any>;
  kyc_status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  countryId: string;
  role?: UserRole;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  dateOfBirth?: Date;
  status?: UserStatus;
  passwordHash?: string;
  lastLoginAt?: Date;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  preferences?: Record<string, any>;
}

export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  countryId?: string;
  search?: string;
}

export interface UserStatistics {
  totalBookings: number;
  totalEarnings: number;
  totalProducts: number;
  averageRating: number;
  joinDate: Date;
  lastActivity: Date;
}

// Legacy types for backward compatibility
export interface UserCreateRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role?: string;
}

export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profileImage?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
