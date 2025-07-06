import BaseModel from './BaseModel';

export enum VerificationStatus {
  Pending = 'pending',
  Verified = 'verified',
  Rejected = 'rejected',
  Expired = 'expired',
}

export enum VerificationType {
  NationalId = 'national_id',
  Passport = 'passport',
  DriversLicense = 'drivers_license',
  Address = 'address',
  Selfie = 'selfie',
  BankStatement = 'bank_statement',
  UtilityBill = 'utility_bill',
}

export interface IUserVerification {
  id: string;
  user_id: string;
  verification_type: VerificationType;
  status: VerificationStatus;
  document_number?: string | null;
  document_image_url?: string | null;
  address_line?: string | null;
  city?: string | null;
  district?: string | null;
  country?: string | null;
  selfie_image_url?: string | null;
  admin_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: Date | null;
  expiry_date?: Date | null;
  ai_profile_score?: number | null;
  created_at: Date;
  updated_at: Date;
}

class UserVerification extends BaseModel {
  static get tableName() {
    return 'user_verifications';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['user_id', 'verification_type', 'status'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        user_id: { type: 'string', format: 'uuid' },
        verification_type: { 
          type: 'string',
          enum: ['national_id', 'passport', 'drivers_license', 'address', 'selfie', 'bank_statement', 'utility_bill']
        },
        status: {
          type: 'string',
          enum: ['pending', 'verified', 'rejected', 'expired']
        },
        document_number: { type: ['string', 'null'] },
        document_image_url: { type: ['string', 'null'] },
        address_line: { type: ['string', 'null'] },
        city: { type: ['string', 'null'] },
        district: { type: ['string', 'null'] },
        country: { type: ['string', 'null'] },
        selfie_image_url: { type: ['string', 'null'] },
        admin_notes: { type: ['string', 'null'] },
        reviewed_by: { type: ['string', 'null'], format: 'uuid' },
        reviewed_at: { type: ['string', 'null'], format: 'date-time' },
        expiry_date: { type: ['string', 'null'], format: 'date-time' },
        ai_profile_score: { type: ['number', 'null'], minimum: 0, maximum: 100 },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const User = require('./User.model').default;
    
    return {
      user: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'user_verifications.user_id',
          to: 'users.id'
        }
      },
      reviewer: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'user_verifications.reviewed_by',
          to: 'users.id'
        }
      }
    };
  }

  // Instance methods
  
  async approve(reviewerId: string, notes?: string): Promise<UserVerification> {
    return await this.$query().patchAndFetch({
      status: 'verified',
      reviewed_by: reviewerId,
      reviewed_at: new Date(),
      admin_notes: notes,
      updated_at: new Date()
    });
  }

  async reject(reviewerId: string, notes: string): Promise<UserVerification> {
    return await this.$query().patchAndFetch({
      status: 'rejected',
      reviewed_by: reviewerId,
      reviewed_at: new Date(),
      admin_notes: notes,
      updated_at: new Date()
    });
  }

  async expire(): Promise<UserVerification> {
    return await this.$query().patchAndFetch({
      status: 'expired',
      updated_at: new Date()
    });
  }

  // Static methods
  
  static async getUserVerifications(userId: string): Promise<UserVerification[]> {
    return await this.query()
      .where('user_id', userId)
      .orderBy('created_at', 'desc');
  }

  static async getUserVerificationsByType(userId: string, verificationType: string): Promise<UserVerification[]> {
    return await this.query()
      .where('user_id', userId)
      .where('verification_type', verificationType)
      .orderBy('created_at', 'desc');
  }

  static async getPendingVerifications(): Promise<UserVerification[]> {
    return await this.query()
      .where('status', 'pending')
      .withGraphFetched('user')
      .orderBy('created_at', 'asc');
  }

  static async getVerificationById(id: string): Promise<UserVerification | undefined> {
    return await this.query()
      .findById(id)
      .withGraphFetched('[user, reviewer]');
  }

  static async createVerification(data: Partial<IUserVerification>): Promise<UserVerification> {
    return await this.query().insert({
      ...data,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  static async updateVerification(id: string, data: Partial<IUserVerification>): Promise<UserVerification> {
    return await this.query().patchAndFetchById(id, {
      ...data,
      updated_at: new Date()
    });
  }

  static async deleteVerification(id: string): Promise<number> {
    return await this.query().deleteById(id);
  }

  // Check if user has verified a specific document type
  static async hasVerifiedDocumentType(userId: string, verificationType: string): Promise<boolean> {
    const verification = await this.query()
      .where('user_id', userId)
      .where('verification_type', verificationType)
      .where('status', 'verified')
      .first();
    
    return !!verification;
  }

  // Get user's overall verification status
  static async getUserVerificationStatus(userId: string): Promise<{
    isFullyVerified: boolean;
    verifiedTypes: string[];
    pendingTypes: string[];
    rejectedTypes: string[];
    totalVerifications: number;
  }> {
    const verifications = await this.getUserVerifications(userId);
    
    const verifiedTypes = verifications
      .filter(v => v.status === 'verified')
      .map(v => v.verification_type);
    
    const pendingTypes = verifications
      .filter(v => v.status === 'pending')
      .map(v => v.verification_type);
    
    const rejectedTypes = verifications
      .filter(v => v.status === 'rejected')
      .map(v => v.verification_type);
    
    // Define required verification types for full verification
    const requiredTypes = ['national_id', 'address', 'selfie'];
    const isFullyVerified = requiredTypes.every(type => verifiedTypes.includes(type));
    
    return {
      isFullyVerified,
      verifiedTypes: [...new Set(verifiedTypes)],
      pendingTypes: [...new Set(pendingTypes)],
      rejectedTypes: [...new Set(rejectedTypes)],
      totalVerifications: verifications.length
    };
  }
}

export default UserVerification;
