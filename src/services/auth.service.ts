import { getDatabase } from '@/config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import { UserSessionService } from './userSession.service';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

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
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, kyc_status: (user as any).kyc_status || 'unverified' }
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

  static async forgotPassword({ email: _email }: any) {
    // Stub: In production, send email
    return { success: true, message: 'Password reset link sent if email exists' };
  }

  static async resetPassword(_body: any) {
    // Stub: In production, verify token and update password
    return { success: true, message: 'Password reset successful' };
  }
}
