import { getDatabase } from '@/config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import { UserSessionService } from './userSession.service';
// import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { EmailService } from './email.service';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export default class AuthService {
  static async register({ email, password, firstName, lastName }: any) {
    const db = getDatabase();
    const existing = await User.findByEmail(email);
    if (existing) return { success: false, message: 'Email already registered' };
    const hash = await bcrypt.hash(password, 10);
    const [userRow] = await db('users').insert(
      {
        email,
        first_name: firstName,
        last_name: lastName,
        password_hash: hash
      },
      ['id', 'email', 'first_name', 'last_name', 'kyc_status']
    );
    const user = User.fromDb(userRow);
    return { success: true, user: { ...user, kyc_status: user.kyc_status || 'unverified' } };
  }

  static async login({ email, password, ip_address, user_agent }: any) {
    const user = await User.findByEmail(email);
    if (!user) return { success: false, message: 'Invalid credentials' };
    const valid = await user.verifyPassword(password);
    if (!valid) return { success: false, message: 'Invalid credentials' };
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    // Generate session and refresh tokens
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
    await UserSessionService.createSession({
      user_id: user.id,
      session_token: sessionToken,
      refresh_token: refreshToken,
      ip_address: ip_address ? String(ip_address) : undefined,
      user_agent: user_agent ? String(user_agent) : undefined,
      expires_at: expiresAt,
    });
    return {
      success: true,
      token,
      sessionToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        kyc_status: (user as any).kyc_status || 'unverified',
        role: user.role // <-- include role
      }
    };
  }

  static async refresh({ refreshToken }: { refreshToken: string }) {
    const session = await UserSessionService.getSessionByRefreshToken(refreshToken);
    if (!session) return { success: false, message: 'Invalid refresh token' };
    const user = await User.findById(session.user_id);
    if (!user) return { success: false, message: 'User not found' };
    const newToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    // Optionally rotate refresh token here
    return { success: true, token: newToken };
  }

  static async logout({ sessionToken }: { sessionToken: string }) {
    await UserSessionService.deleteSession(sessionToken);
    return { success: true };
  }

  static async forgotPassword({ email }: { email: string }) {
    const db = getDatabase();
    
    try {
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        // Return success even if email doesn't exist for security
        return { 
          success: true, 
          message: 'If an account with that email exists, password reset instructions have been sent.' 
        };
      }

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store reset token in database
      await db('password_reset_tokens').insert({
        user_id: user.id,
        token: resetToken,
        expires_at: expiresAt,
        is_used: false
      });

      // Send password reset email
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
      
      const emailContent = {
        to: user.email,
        subject: 'Password Reset Request - UrutiBiz',
        template: 'password-reset',
        data: {
          firstName: user.firstName,
          resetUrl,
          expiresIn: '15 minutes',
          supportEmail: process.env.SUPPORT_EMAIL || 'support@urutibiz.com'
        }
      };

      // Send email using EmailService
      try {
        const emailService = new EmailService();
        await emailService.sendEmail(emailContent);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // In development, log the reset URL
        if (process.env.NODE_ENV === 'development') {
          console.log('Password reset URL (development):', resetUrl);
        }
      }

      return { 
        success: true, 
        message: 'Password reset instructions have been sent to your email address.' 
      };

    } catch (error) {
      console.error('Forgot password error:', error);
      return { 
        success: false, 
        message: 'An error occurred while processing your request. Please try again.' 
      };
    }
  }

  static async resetPassword({ token, newPassword }: { token: string; newPassword: string }) {
    const db = getDatabase();
    
    try {
      // Find and validate reset token
      const [resetToken] = await db('password_reset_tokens')
        .where({ 
          token, 
          is_used: false 
        })
        .where('expires_at', '>', new Date());

      if (!resetToken) {
        return { 
          success: false, 
          message: 'Invalid or expired reset token. Please request a new password reset.' 
        };
      }

      // Validate password strength
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        return {
          success: false,
          message: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.'
        };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password
      await db('users')
        .where({ id: resetToken.user_id })
        .update({ password_hash: hashedPassword });

      // Mark token as used
      await db('password_reset_tokens')
        .where({ id: resetToken.id })
        .update({ is_used: true });

      // Invalidate all existing sessions for this user
      await UserSessionService.deleteAllSessionsForUser(resetToken.user_id);

      // Get updated user data
      const user = await User.findById(resetToken.user_id);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Generate new session tokens
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const refreshToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
      
      await UserSessionService.createSession({
        user_id: user.id,
        session_token: sessionToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
      });

      const jwtToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });

      return {
        success: true,
        message: 'Password reset successful. You have been automatically logged in.',
        data: {
          token: jwtToken,
          sessionToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            kyc_status: (user as any).kyc_status || 'unverified',
            role: user.role
          }
        }
      };

    } catch (error) {
      console.error('Reset password error:', error);
      return { 
        success: false, 
        message: 'An error occurred while resetting your password. Please try again.' 
      };
    }
  }

  static async validateResetToken(token: string) {
    const db = getDatabase();
    
    try {
      const [resetToken] = await db('password_reset_tokens')
        .where({ 
          token, 
          is_used: false 
        })
        .where('expires_at', '>', new Date());

      return {
        success: !!resetToken,
        message: resetToken ? 'Valid token' : 'Invalid or expired token'
      };
    } catch (error) {
      console.error('Token validation error:', error);
      return { success: false, message: 'Error validating token' };
    }
  }
}
