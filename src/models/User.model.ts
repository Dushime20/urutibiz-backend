// =====================================================
// USER MODEL (STUB)
// =====================================================

import { UserData } from '@/types/user.types';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '@/config/database';
import bcrypt from 'bcryptjs';

// Minimal User model for demo purposes
export class User implements Partial<UserData> {
  public id: string;
  public email: string;
  public firstName: string;
  public lastName: string;
  public role: 'renter' | 'owner' | 'admin' | 'moderator';
  public status: 'pending' | 'active' | 'suspended' | 'banned';
  public createdAt: Date;
  public updatedAt: Date;
  public phone: string;
  public countryId: string;
  public profileImageUrl?: string;
  public profileImagePublicId?: string; // Cloudinary public ID for profile image
  public emailVerified: boolean;
  public phoneVerified: boolean;
  public passwordHash?: string;
  public kyc_status: 'unverified' | 'verified' | 'rejected';
  public gender?: string;
  public province?: string;
  public addressLine?: string;
  public location?: { latitude: number; longitude: number };
  public bio?: string;
  public dateOfBirth?: Date;
  // Two-factor authentication
  public twoFactorEnabled?: boolean;
  public twoFactorSecret?: string;
  public twoFactorBackupCodes?: string[];
  public twoFactorVerified?: boolean;
  // Location fields for Rwanda administrative structure
  public district?: string;
  public sector?: string;
  public cell?: string;
  public village?: string;

  // In-memory storage for demo
  // private static users: User[] = []; // Removed unused variable

  constructor(data: any) {
    this.id = data.id || uuidv4();
    this.email = data.email;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.role = data.role || 'renter';
    this.status = data.status || 'pending';
    this.phone = data.phone || data.phone_number; // Handle both phone and phone_number
    this.countryId = data.countryId;
    this.emailVerified = data.emailVerified || false;
    this.phoneVerified = data.phoneVerified || false;
    this.passwordHash = data.passwordHash;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.kyc_status = data.kyc_status || 'unverified';
    // Profile image fields
    this.profileImageUrl = data.profileImageUrl;
    this.profileImagePublicId = data.profileImagePublicId;
    // Location fields
    this.district = data.district;
    this.sector = data.sector;
    this.cell = data.cell;
    this.village = data.village;
    this.gender = data.gender;
    this.province = data.province;
    this.addressLine = data.addressLine || data.address_line;
    this.location = data.location;
    this.bio = data.bio;
    this.dateOfBirth = data.dateOfBirth;
    // Two-factor authentication
    this.twoFactorEnabled = data.twoFactorEnabled;
    this.twoFactorSecret = data.twoFactorSecret;
    this.twoFactorBackupCodes = data.twoFactorBackupCodes;
    this.twoFactorVerified = data.twoFactorVerified;
  }

  static async findById(id: string): Promise<User | null> {
    const db = getDatabase();
    const user = await db('users').where({ id }).first();
    return user ? User.fromDb(user) : null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const db = getDatabase();
    const user = await db('users').where({ email }).first();
    return user ? User.fromDb(user) : null;
  }

  static fromDb(row: any): User {
    return new User({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      status: row.status,
      phone: row.phone_number || row.phone, // Fix: Use phone_number column
      countryId: row.country_id,
      emailVerified: row.email_verified,
      phoneVerified: row.phone_verified,
      passwordHash: row.password_hash,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      kyc_status: row.kyc_status, // <-- Ensure this is mapped
      profileImageUrl: row.profile_image_url,
      profileImagePublicId: row.profile_image_public_id,
      district: row.district,
      sector: row.sector,
      cell: row.cell,
      village: row.village,
      gender: row.gender,
      province: row.province,
      addressLine: row.address_line,
      bio: row.bio,
      dateOfBirth: row.date_of_birth,
      // Two-factor authentication
      twoFactorEnabled: row.two_factor_enabled,
      twoFactorSecret: row.two_factor_secret,
      twoFactorBackupCodes: row.two_factor_backup_codes ? this.safeParseJson(row.two_factor_backup_codes) : undefined,
      twoFactorVerified: row.two_factor_verified,
      location: undefined
    });
  }

  private static safeParseJson(value: any): any {
    try {
      if (typeof value === 'string') {
        return JSON.parse(value);
      }
      if (typeof value === 'object' && value !== null) {
        return value; // Already an object, return as is
      }
      return undefined;
    } catch (error) {
      console.warn('Failed to parse JSON value:', value);
      return undefined;
    }
  }

  static async getPaginated(page: number, limit: number, _filters: any): Promise<{
    data: User[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    return {
      data: [],
      page,
      limit,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    };
  }

  async update(data: any): Promise<User> {
    Object.assign(this, data);
    this.updatedAt = new Date();
    return this;
  }

  toJSON(): any {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      status: this.status,
      phone: this.phone, // Include phone field
      phoneVerified: this.phoneVerified, // Include phone verification status
      profileImageUrl: this.profileImageUrl,
      profileImagePublicId: this.profileImagePublicId,
      idVerificationStatus: (this as any).id_verification_status || (this as any).idVerificationStatus,
      kyc_status: this.kyc_status || 'unverified', // <-- Ensure this is included
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      district: this.district,
      sector: this.sector,
      cell: this.cell,
      village: this.village
      ,gender: this.gender
      ,province: this.province
      ,addressLine: this.addressLine
      ,bio: this.bio
      ,dateOfBirth: this.dateOfBirth
      ,twoFactorEnabled: this.twoFactorEnabled
      ,twoFactorVerified: this.twoFactorVerified
    };
  }

  async verifyPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash || '');
  }

  async changePassword(_newPassword: string): Promise<void> {
    // Demo implementation
  }

  static async getUserStatistics(_id: string): Promise<any> {
    return {
      totalBookings: 0,
      totalRevenue: 0,
      averageRating: 0
    };
  }

  async updatePreferences(_preferences: any): Promise<User> {
    return this;
  }

  static async getRentalHistory(_id: string, page: number, limit: number): Promise<any> {
    return {
      data: [],
      page,
      limit,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    };
  }
}

export default User;
