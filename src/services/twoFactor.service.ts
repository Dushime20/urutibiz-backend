// =====================================================
// TWO-FACTOR AUTHENTICATION SERVICE
// =====================================================

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import { getDatabase } from '@/config/database';
import { TwoFactorSetup, TwoFactorStatus, TwoFactorBackupCode } from '@/types/twoFactor.types';
// ResponseHelper not needed in service layer

export class TwoFactorService {
  private static readonly BACKUP_CODES_COUNT = 10;
  private static readonly BACKUP_CODE_LENGTH = 8;

  // Configure TOTP settings to match Google Authenticator
  static {
    // Set TOTP algorithm to SHA1 (Google Authenticator default)
    authenticator.options = {
      algorithm: 'sha1' as any,
      digits: 6,
      period: 30,
      window: 1
    };
  }

    /**
   * Generate a new 2FA setup for a user
   */
   static async generateSetup(userId: string): Promise<TwoFactorSetup> {
     try {
       const db = getDatabase();
        
       // Get user's first name for the otpauth URL
       const user = await db('users')
         .select('first_name')
         .where({ id: userId })
         .first();
        
       if (!user?.first_name) {
         throw new Error('User first name not found');
       }
        
       // Generate a new secret with explicit TOTP configuration
       const secret = authenticator.generateSecret();
        
       // Generate QR code with user-friendly identifier (first name instead of ID)
       const otpauth = authenticator.keyuri(user.first_name, 'UrutiBiz', secret);
       console.log(`🔧 [2FA SETUP] otpauth URL: ${otpauth}`);
      const qrCode = await QRCode.toDataURL(otpauth);
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      
      // Store the secret temporarily (will be verified later)
      await db('users')
        .where({ id: userId })
        .update({
          two_factor_secret: secret,
          two_factor_backup_codes: JSON.stringify(backupCodes),
          two_factor_verified: false,
          updated_at: new Date()
        });

      // Debug: Generate a test token to verify configuration
      const testToken = authenticator.generate(secret);
      console.log(`🔧 [2FA SETUP] Generated secret: ${secret}`);
      console.log(`🔧 [2FA SETUP] Test token: ${testToken}`);
      console.log(`🔧 [2FA SETUP] Current time: ${new Date().toISOString()}`);
      console.log(`🔧 [2FA SETUP] TOTP config:`, authenticator.options);

      return {
        secret,
        qrCode,
        backupCodes: backupCodes.map(code => code.code)
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate 2FA setup: ${errorMessage}`);
    }
  }

  /**
   * Verify a 2FA token and enable 2FA for the user
   */
  static async verifyAndEnable(userId: string, token: string): Promise<boolean> {
    try {
      const db = getDatabase();
      
      console.log(`🔍 [2FA DEBUG] Verifying token for user: ${userId}`);
      console.log(`🔍 [2FA DEBUG] Token received: ${token}`);
      
      // Get user's 2FA secret
      const user = await db('users')
        .select('two_factor_secret')
        .where({ id: userId })
        .first();

      if (!user?.two_factor_secret) {
        console.log(`❌ [2FA DEBUG] No 2FA secret found for user: ${userId}`);
        throw new Error('No 2FA secret found. Please generate setup first.');
      }

      console.log(`🔍 [2FA DEBUG] User has secret: ${user.two_factor_secret ? 'YES' : 'NO'}`);
      console.log(`🔍 [2FA DEBUG] Secret length: ${user.two_factor_secret?.length || 0}`);
      console.log(`🔍 [2FA DEBUG] TOTP config:`, authenticator.options);

      // Verify the token with explicit TOTP configuration
      const isValid = authenticator.verify({
        token,
        secret: user.two_factor_secret
      });

      console.log(`🔍 [2FA DEBUG] Token validation result: ${isValid}`);
      console.log(`🔍 [2FA DEBUG] Current time: ${new Date().toISOString()}`);
      console.log(`🔍 [2FA DEBUG] Token length: ${token.length}`);
      console.log(`🔍 [2FA DEBUG] Token is numeric: ${/^\d{6}$/.test(token)}`);
      
      // Generate expected token for debugging
      const expectedToken = authenticator.generate(user.two_factor_secret);
      console.log(`🔍 [2FA DEBUG] Expected token: ${expectedToken}`);
      console.log(`🔍 [2FA DEBUG] Received token: ${token}`);
      console.log(`🔍 [2FA DEBUG] Tokens match: ${expectedToken === token}`);

      if (!isValid) {
        console.log(`❌ [2FA DEBUG] Token validation failed for user: ${userId}`);
        return false;
      }

      console.log(`✅ [2FA DEBUG] Token validation successful, enabling 2FA for user: ${userId}`);

      // Enable 2FA
      await db('users')
        .where({ id: userId })
        .update({
          two_factor_enabled: true,
          two_factor_verified: true,
          updated_at: new Date()
        });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [2FA DEBUG] Error in verifyAndEnable: ${errorMessage}`);
      throw new Error(`Failed to verify and enable 2FA: ${errorMessage}`);
    }
  }

  /**
   * Verify a 2FA token for login
   */
  static async verifyToken(userId: string, token: string): Promise<boolean> {
    try {
      const db = getDatabase();
      
      // Get user's 2FA secret
      const user = await db('users')
        .select('two_factor_secret', 'two_factor_enabled')
        .where({ id: userId })
        .first();

      if (!user?.two_factor_enabled) {
        throw new Error('2FA is not enabled for this user');
      }

      if (!user?.two_factor_secret) {
        throw new Error('2FA secret not found');
      }

      // Verify the token
      return authenticator.verify({
        token,
        secret: user.two_factor_secret
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to verify 2FA token: ${errorMessage}`);
    }
  }

  /**
   * Verify a backup code
   */
  static async verifyBackupCode(userId: string, backupCode: string): Promise<boolean> {
    try {
      const db = getDatabase();
      
      // Get user's backup codes
      const user = await db('users')
        .select('two_factor_backup_codes')
        .where({ id: userId })
        .first();

      if (!user?.two_factor_backup_codes) {
        return false;
      }

      const backupCodes: TwoFactorBackupCode[] = JSON.parse(user.two_factor_backup_codes);
      
      // Find and mark the backup code as used
      const codeIndex = backupCodes.findIndex(code => 
        code.code === backupCode && !code.used
      );

      if (codeIndex === -1) {
        return false;
      }

      // Mark code as used
      backupCodes[codeIndex].used = true;
      backupCodes[codeIndex].usedAt = new Date();

      // Update the database
      await db('users')
        .where({ id: userId })
        .update({
          two_factor_backup_codes: JSON.stringify(backupCodes),
          updated_at: new Date()
        });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to verify backup code: ${errorMessage}`);
    }
  }

  /**
   * Disable 2FA for a user
   */
  static async disable(userId: string, currentPassword: string): Promise<boolean> {
    try {
      const db = getDatabase();
      
      // Get user's current password hash
      const user = await db('users')
        .select('password_hash')
        .where({ id: userId })
        .first();

      if (!user?.password_hash) {
        throw new Error('User not found or no password set');
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isPasswordValid) {
        return false;
      }

      // Disable 2FA
      await db('users')
        .where({ id: userId })
        .update({
          two_factor_enabled: false,
          two_factor_secret: null,
          two_factor_backup_codes: null,
          two_factor_verified: false,
          updated_at: new Date()
        });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to disable 2FA: ${errorMessage}`);
    }
  }

  /**
   * Get 2FA status for a user
   */
  static async getStatus(userId: string): Promise<TwoFactorStatus> {
    try {
      const db = getDatabase();
      
      const user = await db('users')
        .select('two_factor_enabled', 'two_factor_verified', 'two_factor_secret', 'two_factor_backup_codes')
        .where({ id: userId })
        .first();

      if (!user) {
        throw new Error('User not found');
      }

      return {
        enabled: user.two_factor_enabled || false,
        verified: user.two_factor_verified || false,
        hasSecret: !!user.two_factor_secret,
        hasBackupCodes: !!user.two_factor_backup_codes
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get 2FA status: ${errorMessage}`);
    }
  }

  /**
   * Generate new backup codes
   */
  static async generateNewBackupCodes(userId: string, currentPassword: string): Promise<string[]> {
    try {
      const db = getDatabase();
      
      // Get user's current password hash
      const user = await db('users')
        .select('password_hash')
        .where({ id: userId })
        .first();

      if (!user?.password_hash) {
        throw new Error('User not found or no password set');
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isPasswordValid) {
        throw new Error('Invalid current password');
      }

      // Generate new backup codes
      const backupCodes = this.generateBackupCodes();
      
      // Update the database
      await db('users')
        .where({ id: userId })
        .update({
          two_factor_backup_codes: JSON.stringify(backupCodes),
          updated_at: new Date()
        });

      return backupCodes.map(code => code.code);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate new backup codes: ${errorMessage}`);
    }
  }

  /**
   * Generate backup codes
   */
  private static generateBackupCodes(): TwoFactorBackupCode[] {
    const codes: TwoFactorBackupCode[] = [];
    
    for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
      const code = this.generateRandomCode();
      codes.push({
        code,
        used: false
      });
    }
    
    return codes;
  }

  /**
   * Generate a random backup code
   */
  private static generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    for (let i = 0; i < this.BACKUP_CODE_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }
}

export default TwoFactorService;
