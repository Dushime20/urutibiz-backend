// =====================================================
// USER TYPES
// =====================================================

export type UserRole = 'renter' | 'owner' | 'admin' | 'moderator' | 'inspector';
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
  preferred_currency?: string;
  dateOfBirth?: Date;
  gender?: string;
  province?: string;
  addressLine?: string;
  // Geometry location
  location?: { latitude: number; longitude: number };
  countryId: string;
  profileImageUrl?: string;
  profileImagePublicId?: string; // Cloudinary public ID for profile image
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt?: Date;
  preferences?: Record<string, any>;
  kyc_status: string;
  bio?: string;
  // Two-factor authentication
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
  twoFactorVerified?: boolean;
  // Location fields for Rwanda administrative structure
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
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
  preferred_currency?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  profileImagePublicId?: string; // Cloudinary public ID for profile image
  dateOfBirth?: Date;
  gender?: string;
  province?: string;
  addressLine?: string;
  location?: { latitude: number; longitude: number };
  status?: UserStatus;
  passwordHash?: string;
  lastLoginAt?: Date;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  preferences?: Record<string, any>;
  bio?: string;
  // Two-factor authentication
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
  twoFactorVerified?: boolean;
  // Location fields
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  preferred_currency?: string;
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
  gender?: string;
  province?: string;
  addressLine?: string;
  location?: { latitude: number; longitude: number };
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
