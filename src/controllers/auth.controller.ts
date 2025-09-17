import { Request, Response } from 'express';
import AuthService from '../services/auth.service';
import EmailVerificationService from '@/services/emailVerification.service';
import { AuthenticatedRequest } from '@/types';

export default class AuthController {
  static async register(req: Request, res: Response) {
    const result = await AuthService.register(req.body);
    res.status(result.success ? 201 : 400).json(result);
  }

  static async login(req: Request, res: Response) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    const result = await AuthService.login({ ...req.body, ip_address: ip, user_agent: userAgent });
    res.status(result.success ? 200 : 401).json(result);
  }

  static async refresh(req: Request, res: Response) {
    const result = await AuthService.refresh(req.body);
    res.status(result.success ? 200 : 401).json(result);
  }

  static async logout(req: Request, res: Response) {
    const result = await AuthService.logout(req.body);
    res.status(200).json(result);
  }

  static async forgotPassword(req: Request, res: Response) {
    const result = await AuthService.forgotPassword(req.body);
    res.status(200).json(result);
  }

  static async resetPassword(req: Request, res: Response) {
    const result = await AuthService.resetPassword(req.body);
    res.status(result.success ? 200 : 400).json(result);
  }

  static async validateResetToken(req: Request, res: Response) {
    const { token } = req.params;
    const result = await AuthService.validateResetToken(token);
    res.status(result.success ? 200 : 400).json(result);
  }

  static async requestEmailOtp(req: Request, res: Response) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    const result = await EmailVerificationService.requestEmailOtp(email);
    return res.status(200).json(result);
  }

  static async verifyEmailOtp(req: Request, res: Response) {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    const result = await EmailVerificationService.verifyEmailOtp(email, otp);
    return res.status(result.success ? 200 : 400).json(result);
  }

  static async me(req: AuthenticatedRequest, res: Response) {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Fetch location the same way /users/:id does
    const db = require('@/config/database').getDatabase();
    let locationData: any = null;
    try {
      const location = await db('users')
        .select('location', 'district', 'sector', 'cell', 'village', 'address_line')
        .where({ id: user.id })
        .first();

      if (location) {
        locationData = {
          address: {
            district: location.district,
            sector: location.sector,
            cell: location.cell,
            village: location.village,
            addressLine: location.address_line
          }
        } as any;

        if (location.location) {
          try {
            const geoJsonResult = await db.raw(`SELECT ST_AsGeoJSON(ST_GeomFromWKB(?, 4326)) as geometry`, [Buffer.from(location.location, 'hex')]);
            if (geoJsonResult.rows?.[0]?.geometry) {
              locationData.geometry = JSON.parse(geoJsonResult.rows[0].geometry);
              if (locationData.geometry.type === 'Point' && locationData.geometry.coordinates) {
                locationData.coordinates = {
                  longitude: locationData.geometry.coordinates[0],
                  latitude: locationData.geometry.coordinates[1]
                };
              }
            }
          } catch {}
        }
      }
    } catch {}

    const response = {
      id: user.id,
      email: user.email,
      firstName: user.first_name ?? user.firstName,
      lastName: user.last_name ?? user.lastName,
      role: user.role,
      status: user.status ?? 'active',
      phone: user.phone ?? user.phone_number ?? null,
      emailVerified: !!(user.email_verified ?? user.emailVerified),
      phoneVerified: !!(user.phone_verified ?? user.phoneVerified),
      passwordHash: user.password_hash ?? undefined,
      createdAt: user.created_at ?? user.createdAt,
      updatedAt: user.updated_at ?? user.updatedAt,
      kyc_status: user.kyc_status ?? 'unverified',
      profileImageUrl: user.profile_image_url ?? user.profileImageUrl ?? null,
      profileImagePublicId: user.profile_image_public_id ?? user.profileImagePublicId ?? null,
      district: user.district ?? null,
      sector: user.sector ?? null,
      cell: user.cell ?? null,
      village: user.village ?? null,
      gender: user.gender ?? null,
      province: user.province ?? null,
      addressLine: user.address_line ?? user.addressLine ?? null,
      location: locationData,
      bio: user.bio ?? null,
      dateOfBirth: user.date_of_birth ?? user.dateOfBirth ?? null,
      twoFactorEnabled: !!(user.two_factor_enabled ?? user.twoFactorEnabled),
      twoFactorSecret: user.two_factor_secret ?? user.twoFactorSecret ?? null,
      twoFactorVerified: !!(user.two_factor_verified ?? user.twoFactorVerified),
      preferred_currency: user.preferred_currency ?? user.preferredCurrency ?? null,
    };

    return res.status(200).json({ success: true, message: 'User retrieved successfully', data: response });
  }
}
