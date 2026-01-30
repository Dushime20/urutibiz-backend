import { Request, Response } from 'express';
import AuthService from '../services/auth.service';
import EmailVerificationService from '@/services/emailVerification.service';

export default class AuthController {
  static async register(req: Request, res: Response) {
    try {
      // Debug logging to help identify the issue
      console.log('[AUTH REGISTER] Request body:', JSON.stringify(req.body, null, 2));
      console.log('[AUTH REGISTER] Request headers:', JSON.stringify(req.headers, null, 2));
      console.log('[AUTH REGISTER] Content-Type:', req.headers['content-type']);
      
      const { email, password, firstName, lastName } = req.body;
      
      // Debug individual field extraction
      console.log('[AUTH REGISTER] Extracted fields:', {
        email: email,
        password: password ? '[REDACTED]' : 'undefined',
        firstName: firstName,
        lastName: lastName
      });

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        console.log('[AUTH REGISTER] Validation failed:', {
          email: !!email,
          password: !!password,
          firstName: !!firstName,
          lastName: !!lastName
        });
        return res.status(400).json({
          success: false,
          message: 'All fields are required: email, password, firstName, lastName'
        });
      }

      // Call AuthService to register user
      const result = await AuthService.register({ email, password, firstName, lastName });

      // Return response
      return res.status(result.success ? 201 : 400).json(result);

    } catch (err: any) {
      console.error('Error in register controller:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
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

  static async me(req: Request, res: Response) {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Fetch location the same way /users/:id does
    const db = require('@/config/database').getDatabase();
    let locationData: any = null;
    try {
      const location = await db('users')
        .select(
          'location', 
          // Global address fields
          'street_address', 'city', 'state_province', 'postal_code', 'country',
          // Legacy fields
          'district', 'sector', 'cell', 'village', 'address_line'
        )
        .where({ id: user.id })
        .first();

      if (location) {
        locationData = {
          address: {
            // Global address fields
            street_address: location.street_address,
            city: location.city,
            state_province: location.state_province,
            postal_code: location.postal_code,
            country: location.country,
            // Legacy fields
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
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status ?? 'active',
      phone: user.phone ?? null,
      emailVerified: !!user.emailVerified,
      phoneVerified: !!user.phoneVerified,
      passwordHash: user.passwordHash ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      kyc_status: user.kyc_status ?? 'unverified',
      profileImageUrl: user.profileImageUrl ?? null,
      profileImagePublicId: user.profileImagePublicId ?? null,
      district: user.district ?? null,
      sector: user.sector ?? null,
      cell: user.cell ?? null,
      village: user.village ?? null,
      gender: user.gender ?? null,
      province: user.province ?? null,
      addressLine: user.addressLine ?? null,
      location: locationData,
      bio: user.bio ?? null,
      dateOfBirth: user.dateOfBirth ?? null,
      twoFactorEnabled: !!user.twoFactorEnabled,
      twoFactorSecret: user.twoFactorSecret ?? null,
      twoFactorVerified: !!user.twoFactorVerified,
      preferred_currency: user.preferred_currency ?? null,
    };

    return res.status(200).json({ success: true, message: 'User retrieved successfully', data: response });
  }
}
