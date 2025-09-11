import { getDatabase } from '@/config/database';
import { emailService } from '@/services/email.service';
import User from '@/models/User.model';

function generateSixDigitOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export class EmailVerificationService {
  static async requestEmailOtp(email: string): Promise<{ success: boolean; message: string }> {
    const db = getDatabase();
    const user = await User.findByEmail(email);
    if (!user) {
      return { success: true, message: 'If the email exists, an OTP has been sent' }; // do not leak
    }

    const otp = generateSixDigitOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create table if missing? We assume migration exists. Insert record.
    await db('email_verification_otps').insert({
      user_id: user.id,
      email,
      otp_code: otp,
      verified: false,
      created_at: new Date(),
      expires_at: expiresAt
    }).catch(() => {});

    // Send OTP via email (best-effort)
    await emailService.sendEmail({
      to: email,
      subject: 'Your email verification code',
      html: `<p>Your verification code is <b>${otp}</b>. It expires in 10 minutes.</p>`,
      text: `Your verification code is ${otp}. It expires in 10 minutes.`
    });

    return { success: true, message: 'If the email exists, an OTP has been sent' };
  }

  static async verifyEmailOtp(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    const db = getDatabase();
    const user = await User.findByEmail(email);
    if (!user) {
      return { success: false, message: 'Invalid email or OTP' };
    }

    const record = await db('email_verification_otps')
      .where({ user_id: user.id, email, otp_code: otp, verified: false })
      .andWhere('expires_at', '>', new Date())
      .orderBy('created_at', 'desc')
      .first();

    if (!record) {
      return { success: false, message: 'Invalid or expired OTP' };
    }

    // Mark OTP as used
    await db('email_verification_otps').where({ id: record.id }).update({ verified: true, verified_at: new Date() }).catch(() => {});

    // Update user as email verified
    await db('users').where({ id: user.id }).update({ email_verified: true, updated_at: new Date() });

    return { success: true, message: 'Email verified successfully' };
  }
}

export default EmailVerificationService;


