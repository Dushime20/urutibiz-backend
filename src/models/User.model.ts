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
  public emailVerified: boolean;
  public phoneVerified: boolean;
  public passwordHash?: string;
  public kyc_status: 'unverified' | 'verified' | 'rejected';

  // In-memory storage for demo
  private static users: User[] = [];

  constructor(data: any) {
    this.id = data.id || uuidv4();
    this.email = data.email;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.role = data.role || 'renter';
    this.status = data.status || 'pending';
    this.phone = data.phone;
    this.countryId = data.countryId;
    this.emailVerified = data.emailVerified || false;
    this.phoneVerified = data.phoneVerified || false;
    this.passwordHash = data.passwordHash;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.kyc_status = data.kyc_status || 'unverified';
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
      phone: row.phone,
      countryId: row.country_id,
      emailVerified: row.email_verified,
      phoneVerified: row.phone_verified,
      passwordHash: row.password_hash,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      kyc_status: row.kyc_status // <-- Ensure this is mapped
    });
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
      idVerificationStatus: (this as any).id_verification_status || (this as any).idVerificationStatus,
      kyc_status: this.kyc_status || 'unverified', // <-- Ensure this is included
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
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
