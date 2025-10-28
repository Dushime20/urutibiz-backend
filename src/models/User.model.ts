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
  // Preferences
  public preferred_currency?: string;

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
    // Preferences
    this.preferred_currency = data.preferred_currency || data.preferredCurrency;
  }

  static async findById(id: string): Promise<User | null> {
    try {
      const db = getDatabase();
      const user = await db('users').where({ id }).first();
      return user ? User.fromDb(user) : null;
    } catch (error: any) {
      // If database connection is lost, try to reconnect
      if (error.message.includes('Database is not initialized') || 
          error.message.includes('Undefined binding') ||
          error.message.includes('connection')) {
        console.warn('Database connection lost, attempting to reconnect...');
        try {
          const { connectDatabase } = require('@/config/database');
          await connectDatabase();
          
          // Wait for the connection to stabilize
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const db = getDatabase();
          
          // Use raw SQL query instead of Knex query builder to avoid schema issues
          const result = await db.raw(`
            SELECT * FROM users WHERE id = ? LIMIT 1
          `, [id]);
          
          if (result.rows && result.rows.length > 0) {
            return User.fromDb(result.rows[0]);
          }
          
          return null;
        } catch (reconnectError) {
          console.error('Failed to reconnect to database:', reconnectError);
          throw new Error('Database connection failed. Please try again.');
        }
      }
      throw error;
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    if (!email) {
      throw new Error('Email parameter is required');
    }
    
    const db = getDatabase();
  
    const result = await db.raw(
      'SELECT * FROM users WHERE email = ? LIMIT 1', // use ? for Knex raw
      [email]
    );
  
    if (result.rows && result.rows.length > 0) {
      return User.fromDb(result.rows[0]);
    }
  
    return null;
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
      preferred_currency: row.preferred_currency,
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
      ,preferred_currency: this.preferred_currency ?? null
    };
  }

  async verifyPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash || '');
  }

  async changePassword(newPassword: string): Promise<void> {
    const db = require('@/config/database').getDatabase();
    
    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new Error('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.');
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password in database
    const updateResult = await db('users')
      .where({ id: this.id })
      .update({ password_hash: hashedPassword });
    
    if (updateResult === 0) {
      throw new Error('Failed to update password - user not found');
    }
    
    // Update the local instance
    this.passwordHash = hashedPassword;
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
