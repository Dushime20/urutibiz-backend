import { Request, Response } from 'express';
import UserVerificationService from '@/services/userVerification.service';
import { ResponseHelper } from '@/utils/response';

export default class AdminVerificationController {
  /**
   * List all verifications with optional filters
   */
  static async listVerifications(req: Request, res: Response) {
    try {
      const db = require('@/config/database').getDatabase();
      const { status, type, userId, page = 1, limit = 50 } = req.query;
      let query = db('user_verifications')
        .select('user_verifications.*', 'users.email', 'users.first_name', 'users.last_name')
        .leftJoin('users', 'user_verifications.user_id', 'users.id');
      
      if (status) query = query.where('verification_status', status);
      if (type) query = query.where('verification_type', type);
      if (userId) query = query.where('user_id', userId);
      
      const offset = (Number(page) - 1) * Number(limit);
      const verifications = await query
        .orderBy('created_at', 'desc')
        .limit(Number(limit))
        .offset(offset);
      
      const total = await db('user_verifications').count('* as count').first();
      
      return ResponseHelper.success(res, 'Verifications fetched', {
        verifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: total.count,
          totalPages: Math.ceil(total.count / Number(limit))
        }
      });
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Get details for a specific verification
   */
  static async getVerification(req: Request, res: Response) {
    try {
      const db = require('@/config/database').getDatabase();
      const { id } = req.params;
      const verification = await db('user_verifications')
        .select('user_verifications.*', 'users.email', 'users.first_name', 'users.last_name', 'users.kyc_status')
        .leftJoin('users', 'user_verifications.user_id', 'users.id')
        .where('user_verifications.id', id)
        .first();
      
      if (!verification) {
        return ResponseHelper.error(res, 'Verification not found', 404);
      }
      
      return ResponseHelper.success(res, 'Verification fetched', verification);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Get pending verifications
   */
  static async getPendingVerifications(req: Request, res: Response) {
    try {
      const db = require('@/config/database').getDatabase();
      const { limit = 20 } = req.query;
      
      const pendingVerifications = await db('user_verifications')
        .select('user_verifications.*', 'users.email', 'users.first_name', 'users.last_name')
        .leftJoin('users', 'user_verifications.user_id', 'users.id')
        .where('verification_status', 'pending')
        .orderBy('created_at', 'asc')
        .limit(Number(limit));
      
      return ResponseHelper.success(res, 'Pending verifications fetched', pendingVerifications);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Get verification statistics
   */
  static async getVerificationStats(_req: Request, res: Response) {
    try {
      const db = require('@/config/database').getDatabase();
      
      const stats = await db('user_verifications')
        .select('verification_status')
        .count('* as count')
        .groupBy('verification_status');
      
      const typeStats = await db('user_verifications')
        .select('verification_type')
        .count('* as count')
        .groupBy('verification_type');
      
      const totalUsers = await db('users').count('* as count').first();
      const verifiedUsers = await db('users').where('kyc_status', 'verified').count('* as count').first();
      
      const recentActivity = await db('user_verifications')
        .where('created_at', '>=', db.raw("NOW() - INTERVAL '7 days'"))
        .count('* as count')
        .first();
      
      return ResponseHelper.success(res, 'Verification statistics fetched', {
        statusBreakdown: stats.reduce((acc: any, stat: any) => {
          acc[stat.verification_status] = stat.count;
          return acc;
        }, {}),
        typeBreakdown: typeStats.reduce((acc: any, stat: any) => {
          acc[stat.verification_type] = stat.count;
          return acc;
        }, {}),
        totalUsers: totalUsers.count,
        verifiedUsers: verifiedUsers.count,
        verificationRate: totalUsers.count > 0 ? (verifiedUsers.count / totalUsers.count * 100).toFixed(2) : 0,
        recentActivity: recentActivity.count
      });
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Approve a verification
   */
  static async approveVerification(req: Request, res: Response) {
    try {
      const adminId = (req as any).user.id;
      const { id } = req.params;
      const { notes } = req.body;
      
      const verification = await UserVerificationService.reviewVerification(adminId, {
        verificationId: id,
        status: 'verified',
        notes: notes || 'Approved by admin'
      });
      
      return ResponseHelper.success(res, 'Verification approved successfully', verification);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Reject a verification
   */
  static async rejectVerification(req: Request, res: Response) {
    try {
      const adminId = (req as any).user.id;
      const { id } = req.params;
      const { notes } = req.body;
      
      if (!notes) {
        return ResponseHelper.error(res, 'Rejection reason is required', 400);
      }
      
      const verification = await UserVerificationService.reviewVerification(adminId, {
        verificationId: id,
        status: 'rejected',
        notes
      });
      
      return ResponseHelper.success(res, 'Verification rejected', verification);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Bulk review verifications
   */
  static async bulkReviewVerifications(req: Request, res: Response) {
    try {
      const adminId = (req as any).user.id;
      const { verificationIds, status, notes } = req.body;
      
      // Enhanced validation
      if (!verificationIds || !Array.isArray(verificationIds) || verificationIds.length === 0) {
        return ResponseHelper.error(res, 'Verification IDs array is required and must not be empty', 400);
      }
      
      if (verificationIds.length > 100) {
        return ResponseHelper.error(res, 'Cannot process more than 100 verifications at once', 400);
      }
      
      if (!['verified', 'rejected'].includes(status)) {
        return ResponseHelper.error(res, 'Status must be either "verified" or "rejected"', 400);
      }
      
      if (notes && typeof notes !== 'string') {
        return ResponseHelper.error(res, 'Notes must be a string', 400);
      }
      
      const db = require('@/config/database').getDatabase();
      
      // Start transaction for better data consistency
      const trx = await db.transaction();
      
      try {
        const results: Array<{
          verificationId: string;
          status: string;
          data: any;
        }> = [];
        const errors: Array<{
          verificationId: string;
          error: string;
        }> = [];
        
        // Process verifications in batches for better performance
        const batchSize = 10;
        for (let i = 0; i < verificationIds.length; i += batchSize) {
          const batch = verificationIds.slice(i, i + batchSize);
          
          await Promise.all(batch.map(async (verificationId) => {
            try {
              // Validate verification exists and is in pending status
              const verification = await trx('user_verifications')
                .where({ id: verificationId, verification_status: 'pending' })
                .first();
              
              if (!verification) {
                errors.push({ 
                  verificationId, 
                  error: 'Verification not found or not in pending status' 
                });
                return;
              }
              
              // Process the verification
              const result = await UserVerificationService.reviewVerification(adminId, {
                verificationId,
                status,
                notes: notes || `Bulk ${status} by admin ${adminId}`
              }, trx);
              
              results.push({
                verificationId,
                status: 'success',
                data: result
              });
              
            } catch (error: any) {
              errors.push({ 
                verificationId, 
                error: error.message || 'Unknown error occurred' 
              });
            }
          }));
        }
        
        // Commit transaction if successful
        await trx.commit();
        
        // Log the bulk operation
        console.log(`[BULK_REVIEW] Admin ${adminId} processed ${verificationIds.length} verifications:`, {
          successful: results.length,
          failed: errors.length,
          status,
          timestamp: new Date().toISOString()
        });
        
        return ResponseHelper.success(res, 'Bulk review completed', {
          total: verificationIds.length,
          successful: results.length,
          failed: errors.length,
          results,
          errors,
          summary: {
            status,
            processedAt: new Date().toISOString(),
            adminId
          }
        });
        
      } catch (transactionError: any) {
        // Rollback transaction on error
        await trx.rollback();
        throw transactionError;
      }
      
    } catch (error: any) {
      console.error('[BULK_REVIEW_ERROR]', error);
      return ResponseHelper.error(res, `Bulk review failed: ${error.message}`, 500);
    }
  }

  /**
   * Get user verifications (for specific user)
   */
  static async getUserVerifications(req: Request, res: Response) {
    try {
      const { id: userId } = req.params;
      const verifications = await UserVerificationService.getUserVerifications(userId);
      
      // Get user info
      const db = require('@/config/database').getDatabase();
      const user = await db('users')
        .select('id', 'email', 'first_name', 'last_name', 'kyc_status', 'id_verification_status')
        .where('id', userId)
        .first();
      
      if (!user) {
        return ResponseHelper.error(res, 'User not found', 404);
      }
      
      return ResponseHelper.success(res, 'User verifications fetched', {
        user,
        verifications
      });
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Update user KYC status
   */
  static async updateUserKycStatus(req: Request, res: Response) {
    try {
      const { id: userId } = req.params;
      const { kycStatus, notes } = req.body;
      const adminId = (req as any).user.id;
      
      const validKycStatuses = ['unverified', 'basic', 'pending_review', 'verified', 'rejected', 'suspended', 'expired'];
      if (!validKycStatuses.includes(kycStatus)) {
        return ResponseHelper.error(res, 'Invalid KYC status', 400);
      }
      
      const db = require('@/config/database').getDatabase();
      
      // Check if user exists
      const user = await db('users').where('id', userId).first();
      if (!user) {
        return ResponseHelper.error(res, 'User not found', 404);
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
      return ResponseHelper.error(res, error.message);
    }
  }
}
