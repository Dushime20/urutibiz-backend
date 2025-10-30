import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import AdminService from '@/services/admin.service';
import AnalyticsService from '@/services/analytics.service';
import ModerationService from '@/services/moderation.service';
import { ResponseHelper } from '@/utils/response';
import logger from '@/utils/logger';

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Admin dashboard and management endpoints
 */

export class AdminController extends BaseController {
  /**
   * @swagger
   * /admin/dashboard:
   *   get:
   *     summary: Get main dashboard stats
   *     tags: [Admin]
   *     responses:
   *       200:
   *         description: Dashboard statistics
   */
  public async getDashboard(req: Request, res: Response) {
    try {
      const { timeframe = '30d' } = req.query;
      const stats = await AdminService.getDashboardStats(timeframe as string);
      return ResponseHelper.success(res, 'Dashboard stats retrieved successfully', stats);
    } catch (error: any) {
      logger.error(`Error in getDashboard: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve dashboard stats', error);
    }
  }

  /**
   * @swagger
   * /admin/analytics:
   *   get:
   *     summary: Get advanced analytics
   *     tags: [Admin]
   *     responses:
   *       200:
   *         description: Analytics data
   */
  public async getAnalytics(req: Request, res: Response) {
    try {
      const { period = '30d', granularity = 'day' } = req.query;
      const analytics = await AdminService.getAnalytics(period as string, granularity as string);
      return ResponseHelper.success(res, 'Analytics retrieved successfully', analytics);
    } catch (error: any) {
      logger.error(`Error in getAnalytics: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve analytics', error);
    }
  }

  /**
   * @swagger
   * /admin/products/analytics:
   *   get:
   *     summary: Get products analytics for reports
   *     tags: [Admin]
   *     parameters:
   *       - in: query
   *         name: period
   *         schema:
   *           type: string
   *           enum: [7d, 30d, 90d, 1y]
   *           default: 30d
   *     responses:
   *       200:
   *         description: Products analytics data
   */
  public async getProductAnalytics(req: Request, res: Response) {
    try {
      const { period = '30d' } = req.query as any;
      const analytics = await AnalyticsService.getProductAnalytics({ period: period as string });
      return ResponseHelper.success(res, 'Product analytics retrieved successfully', analytics);
    } catch (error: any) {
      logger.error(`Error in getProductAnalytics: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve product analytics', error);
    }
  }

  /**
   * @swagger
   * /admin/metrics/realtime:
   *   get:
   *     summary: Get live metrics
   *     tags: [Admin]
   *     responses:
   *       200:
   *         description: Real-time metrics
   */
  public async getRealTimeMetrics(req: Request, res: Response) {
    try {
      const metrics = await AdminService.getRealTimeMetrics();
      return ResponseHelper.success(res, 'Real-time metrics retrieved successfully', metrics);
    } catch (error: any) {
      logger.error(`Error in getRealTimeMetrics: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve real-time metrics', error);
    }
  }

  /**
   * @swagger
   * /admin/activity:
   *   get:
   *     summary: Get activity feed
   *     tags: [Admin]
   *     responses:
   *       200:
   *         description: Activity feed
   */
  public async getActivity(req: Request, res: Response) {
    try {
      const { page = 1, limit = 50 } = req.query;
      const activity = await AdminService.getActivityFeed(Number(page), Number(limit));
      return ResponseHelper.success(res, 'Activity feed retrieved successfully', activity);
    } catch (error: any) {
      logger.error(`Error in getActivity: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve activity feed', error);
    }
  }

  /**
   * @swagger
   * /admin/users:
   *   get:
   *     summary: List users with stats
   *     tags: [Admin]
   *     responses:
   *       200:
   *         description: List of users
   */
  public async getUsers(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const filters = req.query;
      const result = await AdminService.getUsersWithStats(Number(page), Number(limit), filters);
      return ResponseHelper.success(res, 'Users retrieved successfully', result);
    } catch (error: any) {
      logger.error(`Error in getUsers: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve users', error);
    }
  }

  /**
   * @swagger
   * /admin/users/{id}:
   *   get:
   *     summary: Get user details
   *     tags: [Admin]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: User details
   */
  public async getUserDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userDetails = await AdminService.getUserDetails(id);
      if (!userDetails) return ResponseHelper.error(res, 'User not found', undefined, 404);
      return ResponseHelper.success(res, 'User details retrieved successfully', userDetails);
    } catch (error: any) {
      logger.error(`Error in getUserDetails: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve user details', error);
    }
  }

  /**
   * @swagger
   * /admin/users/{id}/moderate:
   *   post:
   *     summary: Moderate user
   *     tags: [Admin]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               action:
   *                 type: string
   *               reason:
   *                 type: string
   *               duration:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Moderation result
   */
  public async moderateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { action, reason, duration } = req.body;
      const user = (req as any).user;
      const moderationAction = { userId: id, adminId: user.id, action, reason, duration };
      const result = await ModerationService.moderateUser(moderationAction);
      return ResponseHelper.success(res, 'User moderation action completed successfully', result);
    } catch (error: any) {
      logger.error(`Error in moderateUser: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to moderate user', error);
    }
  }

  /**
   * Register new user (Admin only)
   * @swagger
   * /admin/users/register:
   *   post:
   *     summary: Register new user as admin
   *     tags: [Admin]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [firstName, lastName, email, password, role]
   *             properties:
   *               firstName:
   *                 type: string
   *                 minLength: 2
   *                 maxLength: 50
   *               lastName:
   *                 type: string
   *                 minLength: 2
   *                 maxLength: 50
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 minLength: 8
   *               role:
   *                 type: string
   *                 enum: [admin, user, provider, moderator, inspector]
   *               phone:
   *                 type: string
   *               countryId:
   *                 type: string
   *     responses:
   *       201:
   *         description: User registered successfully
   *       400:
   *         description: Invalid input data
   *       409:
   *         description: Email already exists
   */
  public async registerUser(req: Request, res: Response) {
    try {
      const { firstName, lastName, email, password, role, phone } = req.body;
      const adminId = (req as any).user.id;

      // Validate required fields
      if (!firstName || !lastName || !email || !password || !role) {
        return ResponseHelper.error(res, 'Missing required fields: firstName, lastName, email, password, role', undefined, 400);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return ResponseHelper.error(res, 'Invalid email format', undefined, 400);
      }

      // Validate password strength
      if (password.length < 8) {
        return ResponseHelper.error(res, 'Password must be at least 8 characters long', undefined, 400);
      }

      // Validate role
      const validRoles = ['admin', 'user', 'provider', 'moderator', 'inspector'];
      if (!validRoles.includes(role)) {
        return ResponseHelper.error(res, 'Invalid role. Must be one of: admin, user, provider, moderator, inspector', undefined, 400);
      }

      // Check if email already exists
      const db = require('@/config/database').getDatabase();
      const existingUser = await db('users').where('email', email).first();
      if (existingUser) {
        return ResponseHelper.error(res, 'Email already exists', undefined, 409);
      }

      // Hash password
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user - using the actual database schema
      const [userRow] = await db('users').insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        password_hash: passwordHash,
        role: role,
        phone: phone || null, // Using 'phone' instead of 'phone_number'
        status: 'active', // Using 'status' instead of 'is_active'
        email_verified: true, // Admin-created users are auto-verified
        created_at: new Date(),
        updated_at: new Date()
      }, ['id', 'email', 'first_name', 'last_name', 'role', 'status', 'email_verified', 'created_at']);

      // Log admin action
      logger.info(`Admin ${adminId} registered new user: ${email} with role: ${role}`);

      return ResponseHelper.success(res, 'User registered successfully', {
        id: userRow.id,
        email: userRow.email,
        firstName: userRow.first_name,
        lastName: userRow.last_name,
        role: userRow.role,
        status: userRow.status,
        emailVerified: userRow.email_verified,
        createdAt: userRow.created_at
      }, 201);

    } catch (error: any) {
      logger.error(`Error in registerUser: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to register user', error);
    }
  }

  /**
   * Update user KYC status
   */
  public async updateUserKycStatus(req: Request, res: Response) {
    try {
      const { id: userId } = req.params;
      const { kycStatus, notes } = req.body;
      const adminId = (req as any).user.id;
      
      const validKycStatuses = ['unverified', 'basic', 'pending_review', 'verified', 'rejected', 'suspended', 'expired'];
      if (!validKycStatuses.includes(kycStatus)) {
        return ResponseHelper.error(res, 'Invalid KYC status', undefined, 400);
      }
      
      const db = require('@/config/database').getDatabase();
      
      // Check if user exists
      const user = await db('users').where('id', userId).first();
      if (!user) {
        return ResponseHelper.error(res, 'User not found', undefined, 404);
      }
      
      // Update user KYC status
      await db('users')
        .where('id', userId)
        .update({
          kyc_status: kycStatus,
          updated_at: new Date()
        });
      
      // Log the status change
      await db('audit_logs').insert({
        id: require('uuid').v4(),
        user_id: userId,
        admin_id: adminId,
        action: 'kyc_status_update',
        details: {
          old_status: user.kyc_status,
          new_status: kycStatus,
          notes
        },
        created_at: new Date()
      }).catch(() => {
        // Audit log is optional, don't fail if table doesn't exist
      });
      
      // Get updated user
      const updatedUser = await db('users').where('id', userId).first();
      
      return ResponseHelper.success(res, 'User KYC status updated successfully', {
        user: updatedUser,
        changedBy: adminId,
        notes
      });
    } catch (error: any) {
      logger.error(`Error in updateUserKycStatus: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to update user KYC status', error);
    }
  }

  /**
   * @swagger
   * /admin/products:
   *   get:
   *     summary: List products
   *     tags: [Admin]
   *     responses:
   *       200:
   *         description: List of products
   */
  public async getProducts(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const filters = req.query;
      const result = await AdminService.getProductsWithStats(Number(page), Number(limit), filters);
      return ResponseHelper.success(res, 'Products retrieved successfully', result);
    } catch (error: any) {
      logger.error(`Error in getProducts: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve products', error);
    }
  }

  /**
   * @swagger
   * /admin/products/{id}:
   *   get:
   *     summary: Get product details
   *     tags: [Admin]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Product details
   */
  public async getProductDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const productDetails = await AdminService.getProductDetails(id);
      if (!productDetails) return ResponseHelper.error(res, 'Product not found', undefined, 404);
      return ResponseHelper.success(res, 'Product details retrieved successfully', productDetails);
    } catch (error: any) {
      logger.error(`Error in getProductDetails: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve product details', error);
    }
  }

  /**
   * @swagger
   * /admin/products/{id}/moderate:
   *   post:
   *     summary: Moderate product
   *     tags: [Admin]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               action:
   *                 type: string
   *               reason:
   *                 type: string
   *     responses:
   *       200:
   *         description: Moderation result
   */
  public async moderateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { action, reason } = req.body;
      const user = (req as any).user;
      const moderationAction = { productId: id, adminId: user.id, action, reason };
      const result = await ModerationService.moderateProduct(moderationAction);
      return ResponseHelper.success(res, 'Product moderation action completed successfully', result);
    } catch (error: any) {
      logger.error(`Error in moderateProduct: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to moderate product', error);
    }
  }

  /**
   * @swagger
   * /admin/bookings:
   *   get:
   *     summary: List bookings
   *     tags: [Admin]
   *     responses:
   *       200:
   *         description: List of bookings
   */
  public async getBookings(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const filters = req.query;
      const result = await AdminService.getBookingsWithDetails(Number(page), Number(limit), filters);
      return ResponseHelper.success(res, 'Bookings retrieved successfully', result);
    } catch (error: any) {
      logger.error(`Error in getBookings: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve bookings', error);
    }
  }

  /**
   * @swagger
   * /admin/bookings/{id}:
   *   get:
   *     summary: Get booking details
   *     tags: [Admin]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Booking details
   */
  public async getBookingDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const bookingDetails = await AdminService.getBookingDetails(id);
      if (!bookingDetails) return ResponseHelper.error(res, 'Booking not found', undefined, 404);
      return ResponseHelper.success(res, 'Booking details retrieved successfully', bookingDetails);
    } catch (error: any) {
      logger.error(`Error in getBookingDetails: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve booking details', error);
    }
  }

  /**
   * @swagger
   * /admin/bookings/{id}/override-status:
   *   post:
   *     summary: Override booking status
   *     tags: [Admin]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               status:
   *                 type: string
   *               reason:
   *                 type: string
   *     responses:
   *       200:
   *         description: Status override result
   */
  public async overrideBookingStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const user = (req as any).user;
      const result = await AdminService.overrideBookingStatus(id, status, user.id, reason);
      return ResponseHelper.success(res, 'Booking status overridden successfully', result);
    } catch (error: any) {
      logger.error(`Error in overrideBookingStatus: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to override booking status', error);
    }
  }

  /**
   * @swagger
   * /admin/disputes:
   *   get:
   *     summary: List disputes
   *     tags: [Admin]
   *     responses:
   *       200:
   *         description: List of disputes
   */
  public async getDisputes(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const filters = req.query;
      const result = await AdminService.getDisputes(Number(page), Number(limit), filters);
      return ResponseHelper.success(res, 'Disputes retrieved successfully', result);
    } catch (error: any) {
      logger.error(`Error in getDisputes: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve disputes', error);
    }
  }

  /**
   * @swagger
   * /admin/disputes/{id}/assign:
   *   post:
   *     summary: Assign dispute to admin
   *     tags: [Admin]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               adminId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Dispute assignment result
   */
  public async assignDispute(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { adminId } = req.body;
      const user = (req as any).user;
      const result = await AdminService.assignDispute(id, adminId || user.id);
      return ResponseHelper.success(res, 'Dispute assigned successfully', result);
    } catch (error: any) {
      logger.error(`Error in assignDispute: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to assign dispute', error);
    }
  }

  /**
   * @swagger
   * /admin/disputes/{id}/resolve:
   *   post:
   *     summary: Resolve dispute
   *     tags: [Admin]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               resolution:
   *                 type: string
   *               actions:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: Dispute resolution result
   */
  public async resolveDispute(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { resolution, actions } = req.body;
      const user = (req as any).user;
      const result = await AdminService.resolveDispute(id, resolution, actions, user.id);
      return ResponseHelper.success(res, 'Dispute resolved successfully', result);
    } catch (error: any) {
      logger.error(`Error in resolveDispute: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to resolve dispute', error);
    }
  }

  /**
   * @swagger
   * /admin/financial/reports:
   *   get:
   *     summary: Get financial reports
   *     tags: [Admin]
   *     responses:
   *       200:
   *         description: Financial report
   */
  public async getFinancialReports(req: Request, res: Response) {
    try {
      const { period = 'month', year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
      const report = await AdminService.getFinancialReport(
        period as string,
        parseInt(year as string),
        parseInt(month as string)
      );
      return ResponseHelper.success(res, 'Financial report retrieved successfully', report);
    } catch (error: any) {
      logger.error(`Error in getFinancialReports: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve financial report', error);
    }
  }

  /**
   * @swagger
   * /admin/financial/payouts/process:
   *   post:
   *     summary: Process payouts
   *     tags: [Admin]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               payoutIds:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: Payout processing result
   */
  public async processPayouts(req: Request, res: Response) {
    try {
      const { payoutIds } = req.body;
      const user = (req as any).user;
      const result = await AdminService.processPayouts(payoutIds, user.id);
      return ResponseHelper.success(res, 'Payouts processed successfully', result);
    } catch (error: any) {
      logger.error(`Error in processPayouts: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to process payouts', error);
    }
  }

  /**
   * @swagger
   * /admin/system/health:
   *   get:
   *     summary: Get system health
   *     tags: [Admin]
   *     responses:
   *       200:
   *         description: System health
   */
  public async getSystemHealth(req: Request, res: Response) {
    try {
      const health = await AdminService.getSystemHealth();
      return ResponseHelper.success(res, 'System health retrieved successfully', health);
    } catch (error: any) {
      logger.error(`Error in getSystemHealth: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve system health', error);
    }
  }

  /**
   * @swagger
   * /admin/audit-logs:
   *   get:
   *     summary: Get audit logs
   *     tags: [Admin]
   *     responses:
   *       200:
   *         description: Audit logs
   */
  public async getAuditLogs(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const filters = req.query;
      const result = await AdminService.getAuditLogs(Number(page), Number(limit), filters);
      return ResponseHelper.success(res, 'Audit logs retrieved successfully', result);
    } catch (error: any) {
      logger.error(`Error in getAuditLogs: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve audit logs', error);
    }
  }

  /**
   * @swagger
   * /admin/export:
   *   post:
   *     summary: Export data
   *     tags: [Admin]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               type:
   *                 type: string
   *               filters:
   *                 type: object
   *               format:
   *                 type: string
   *     responses:
   *       200:
   *         description: Export result
   */
  public async exportData(req: Request, res: Response) {
    try {
      const { type, filters, format = 'csv' } = req.body;
      const exportResult = await AdminService.exportData(type, filters, format);
      return ResponseHelper.success(res, 'Data export initiated successfully', exportResult);
    } catch (error: any) {
      logger.error(`Error in exportData: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to export data', error);
    }
  }

  /**
   * @swagger
   * /admin/announcements:
   *   post:
   *     summary: Send platform-wide announcement
   *     tags: [Admin]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               message:
   *                 type: string
   *               type:
   *                 type: string
   *               targetAudience:
   *                 type: string
   *               channels:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: Announcement result
   */
  public async sendAnnouncement(req: Request, res: Response) {
    try {
      const { title, message, type = 'info', targetAudience = 'all', channels = ['email', 'push'] } = req.body;
      const user = (req as any).user;
      const result = await AdminService.sendAnnouncement({
        title,
        message,
        type,
        targetAudience,
        channels,
        adminId: user.id
      });
      return ResponseHelper.success(res, 'Announcement sent successfully', result);
    } catch (error: any) {
      logger.error(`Error in sendAnnouncement: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to send announcement', error);
    }
  }

  /**
   * @swagger
   * /admin/config:
   *   get:
   *     summary: Get platform configuration
   *     tags: [Admin]
   *     responses:
   *       200:
   *         description: Configuration
   *   put:
   *     summary: Update platform configuration
   *     tags: [Admin]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               configKey:
   *                 type: string
   *               configValue:
   *                 type: string
   *     responses:
   *       200:
   *         description: Update result
   */
  public async updateConfig(req: Request, res: Response) {
    try {
      const { configKey, configValue } = req.body;
      const user = (req as any).user;
      const result = await AdminService.updatePlatformConfig(configKey, configValue, user.id);
      return ResponseHelper.success(res, 'Configuration updated successfully', result);
    } catch (error: any) {
      logger.error(`Error in updateConfig: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to update configuration', error);
    }
  }

  public async getConfig(req: Request, res: Response) {
    try {
      const config = await AdminService.getPlatformConfig();
      return ResponseHelper.success(res, 'Configuration retrieved successfully', config);
    } catch (error: any) {
      logger.error(`Error in getConfig: ${error.message}`);
      return ResponseHelper.error(res, 'Failed to retrieve configuration', error);
    }
  }
}

export default new AdminController();
