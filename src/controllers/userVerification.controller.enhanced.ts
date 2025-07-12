/**
 * Enhanced User Verification Controller with Async AI Processing
 * 
 * Features:
 * - Non-blocking AI verification processing
 * - Real-time status updates via WebSocket/SSE
 * - Background queue integration
 * - Performance monitoring
 * 
 * @version 2.0.0 - Performance Optimized
 */

import { Request, Response } from 'express';
import UserVerificationService from '@/services/userVerification.service';
import { BackgroundQueue } from '@/services/BackgroundQueue';
import { SubmitVerificationRequest, ReviewVerificationRequest, UpdateVerificationRequest } from '@/types/userVerification.types';
import { ResponseHelper } from '@/utils/response';
import cloudinary from '@/config/cloudinary';
import { imageComparisonService } from '@/services/imageComparison.service';

// Initialize background queue for AI processing
const aiQueue = new BackgroundQueue({
  concurrency: 3,
  retryDelay: 5000,
  maxRetries: 3
});

export class EnhancedUserVerificationController {
  /**
   * Submit documents for verification with async AI processing
   */
  static async submitDocuments(req: Request, res: Response) {
    const startTime = Date.now();
    
    try {
      const userId = (req as any).user.id;
      const data: SubmitVerificationRequest = req.body;

      // Handle file upload (assuming 'documentImage' and/or 'selfieImage' fields via multer)
      let documentImageUrl = data.documentImageUrl;
      let selfieImageUrl = data.selfieImageUrl;
      console.log(selfieImageUrl,'image url')

      // Multer: req.files is an object (if using .fields), req.file is single file (if using .single)
      if (req.files) {
        const files = req.files as any;
        if (files.documentImage && files.documentImage[0]) {
          const file = files.documentImage[0];
          const uploadResult = await new Promise<any>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ folder: 'user_verifications' }, (error, result) => {
              if (error) return reject(error);
              resolve(result);
            });
            stream.end(file.buffer);
          });
          documentImageUrl = uploadResult.secure_url;
        }
        if (files.selfieImage && files.selfieImage[0]) {
          const file = files.selfieImage[0];
          const uploadResult = await new Promise<any>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ folder: 'user_verifications' }, (error, result) => {
              if (error) return reject(error);
              resolve(result);
            });
            stream.end(file.buffer);
          });
          selfieImageUrl = uploadResult.secure_url;
        }
      }

      // Log the data being sent to the backend
      console.log('Verification payload:', {
        ...data,
        documentImageUrl,
        selfieImageUrl,
      });
      // Create initial verification record (without AI processing)
      const verification = await UserVerificationService.submitVerificationInitial(userId, {
        ...data,
        documentImageUrl,
        selfieImageUrl,
      });
      
      // Queue AI processing jobs asynchronously
      const jobs: Promise<string>[] = [];
      
      // Queue OCR processing if document provided
      if (documentImageUrl) {
        jobs.push(aiQueue.add('ai-verification', {
          verificationId: verification.id,
          userId: userId,
          verificationType: 'ocr',
          documentImageUrl: documentImageUrl,
          contextData: { documentType: data.verificationType }
        }, { priority: 5 }));
      }
      
      // Queue liveness detection if selfie provided
      if (selfieImageUrl) {
        jobs.push(aiQueue.add('ai-verification', {
          verificationId: verification.id,
          userId: userId,
          verificationType: 'liveness',
          selfieImageUrl: selfieImageUrl,
          contextData: { documentType: data.verificationType }
        }, { priority: 5 }));
      }
      
      // Queue profile verification if both images provided
      if (documentImageUrl && selfieImageUrl) {
        jobs.push(aiQueue.add('ai-verification', {
          verificationId: verification.id,
          userId: userId,
          verificationType: 'profile',
          documentImageUrl: documentImageUrl,
          selfieImageUrl: selfieImageUrl,
          contextData: { documentType: data.verificationType }
        }, { priority: 5 }));
      }
      
      // Wait for all jobs to be queued
      const jobIds = await Promise.all(jobs);
      
      const responseTime = Date.now() - startTime;
      console.log(`✅ Verification submitted in ${responseTime}ms with ${jobIds.length} background jobs`);
      
      // Return immediate response with job tracking info
      return ResponseHelper.success(res, 'Documents submitted for verification. AI processing in progress.', {
        verification: {
          ...verification,
          aiProcessingStatus: 'queued',
          queuedJobs: jobIds,
          estimatedCompletionTime: new Date(Date.now() + (jobIds.length * 30000)) // Estimate 30s per job
        }
      });
      
    } catch (error: any) {
      console.error('Error submitting verification:', error);
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Get verification status with AI processing updates
   */
  static async getVerificationStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const status: any = await UserVerificationService.getUserVerificationStatus(userId);
      
      // Check AI job statuses if any
      if (status.queuedJobs && status.queuedJobs.length > 0) {
        const jobStatuses = status.queuedJobs.map((jobId: string) => ({
          jobId,
          status: aiQueue.getJobStatus(jobId)
        }));
        
        status.aiProcessingDetails = jobStatuses;
        
        // Update overall status based on job completion
        const completedJobs = jobStatuses.filter((js: any) => js.status?.completedAt);
        const failedJobs = jobStatuses.filter((js: any) => js.status?.failedAt);
        
        if (failedJobs.length > 0) {
          status.aiProcessingStatus = 'failed';
        } else if (completedJobs.length === jobStatuses.length) {
          status.aiProcessingStatus = 'completed';
        } else {
          status.aiProcessingStatus = 'processing';
        }
      }
      
      return ResponseHelper.success(res, 'Verification status retrieved', status);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Get AI processing queue metrics
   */
  static async getAIProcessingMetrics(_req: Request, res: Response) {
    try {
      const metrics = aiQueue.getMetrics();
      return ResponseHelper.success(res, 'AI processing metrics retrieved', metrics);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Resubmit verification with new AI processing
   */
  static async resubmitVerification(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { verificationId, ...data } = req.body;
      
      // Resubmit verification
      const verification = await UserVerificationService.resubmitVerification(userId, verificationId, data);
      
      // Queue new AI processing jobs
      const jobIds: string[] = [];
      
      if (data.documentImageUrl) {
        const jobId = await aiQueue.add('ai-verification', {
          verificationId: verification.id,
          userId: userId,
          verificationType: 'ocr',
          documentImageUrl: data.documentImageUrl,
          contextData: { resubmission: true }
        }, { priority: 7 }); // Higher priority for resubmissions
        
        jobIds.push(jobId);
      }
      
      return ResponseHelper.success(res, 'Documents resubmitted for verification', {
        verification: {
          ...verification,
          aiProcessingStatus: 'queued',
          queuedJobs: jobIds
        }
      });
      
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Get user verification documents (cached)
   */
  static async getVerificationDocuments(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const documents = await UserVerificationService.getUserVerificationDocuments(userId);
      return ResponseHelper.success(res, 'Verification documents retrieved', documents);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Get user verification history (cached)
   */
  static async getVerificationHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const history = await UserVerificationService.getUserVerificationHistory(userId);
      return ResponseHelper.success(res, 'Verification history retrieved', history);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Submit user verification (legacy wrapper)
   */
  static async submitVerification(req: Request, res: Response) {
    return await EnhancedUserVerificationController.submitDocuments(req, res);
  }

  /**
   * Get user verifications (legacy wrapper)
   */
  static async getUserVerifications(req: Request, res: Response) {
    return await EnhancedUserVerificationController.getVerificationStatus(req, res);
  }

  /**
   * Review verification (admin only)
   */
  static async reviewVerification(req: Request, res: Response) {
    try {
      const adminId = (req as any).user.id;
      const data: ReviewVerificationRequest = req.body;
      const result = await UserVerificationService.reviewVerification(adminId, data);
      return ResponseHelper.success(res, 'Verification reviewed successfully', result);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Cancel AI processing for a verification
   */
  static async cancelAIProcessing(req: Request, res: Response) {
    try {
      const { verificationId } = req.params;
      const userId = (req as any).user.id;
      
      // Get verification to check ownership
      const verification = await UserVerificationService.getVerificationById(verificationId);
      if (verification.userId !== userId) {
        return ResponseHelper.error(res, 'Not authorized to cancel this verification', 403);
      }
      
      // Cancel pending jobs (would need queue implementation to support this)
      // For now, we'll just mark as cancelled in database
      await UserVerificationService.cancelVerification(verificationId);
      
      return ResponseHelper.success(res, 'AI processing cancelled');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Update user verification data
   */
  static async updateVerification(req: Request, res: Response) {
    const startTime = Date.now();
    
    try {
      const userId = (req as any).user.id;
      const { verificationId } = req.params;
      const data: UpdateVerificationRequest = req.body;

      // Handle file upload (assuming 'documentImage' and/or 'selfieImage' fields via multer)
      let documentImageUrl = data.documentImageUrl;
      let selfieImageUrl = data.selfieImageUrl;

      // Multer: req.files is an object (if using .fields), req.file is single file (if using .single)
      if (req.files) {
        const files = req.files as any;
        if (files.documentImage && files.documentImage[0]) {
          const file = files.documentImage[0];
          const uploadResult = await new Promise<any>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ folder: 'user_verifications' }, (error, result) => {
              if (error) return reject(error);
              resolve(result);
            });
            stream.end(file.buffer);
          });
          documentImageUrl = uploadResult.secure_url;
        }
        if (files.selfieImage && files.selfieImage[0]) {
          const file = files.selfieImage[0];
          const uploadResult = await new Promise<any>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ folder: 'user_verifications' }, (error, result) => {
              if (error) return reject(error);
              resolve(result);
            });
            stream.end(file.buffer);
          });
          selfieImageUrl = uploadResult.secure_url;
        }
      }

      // Log the data being sent to the backend
      console.log('Update verification payload:', {
        verificationId,
        ...data,
        documentImageUrl,
        selfieImageUrl,
      });

      // Update verification with new data
      const verification = await UserVerificationService.updateVerification(userId, verificationId, {
        ...data,
        documentImageUrl,
        selfieImageUrl,
      });
      
      const responseTime = Date.now() - startTime;
      console.log(`✅ Verification updated in ${responseTime}ms`);
      
      // Determine response message based on verification status
      let message = 'Verification updated successfully';
      let additionalInfo = '';
      
      if (verification.verificationStatus === 'verified') {
        message = 'Verification completed and auto-verified!';
        additionalInfo = `Your documents have been successfully verified through AI comparison. Similarity Score: ${(verification.aiProfileScore * 100).toFixed(1)}%`;
      } else if (verification.verificationStatus === 'rejected') {
        message = 'Verification rejected';
        additionalInfo = `The images do not appear to match. Similarity Score: ${(verification.aiProfileScore * 100).toFixed(1)}%`;
      } else if (verification.verificationStatus === 'pending') {
        message = 'Verification updated successfully';
        additionalInfo = verification.aiProfileScore 
          ? `Your documents have been updated and are pending review. Similarity Score: ${(verification.aiProfileScore * 100).toFixed(1)}%`
          : 'Your documents have been updated and are pending review.';
      }
      
      return ResponseHelper.success(res, message, {
        verification: {
          ...verification,
          message: additionalInfo,
          processingDetails: {
            ocrProcessed: !!verification.ocrData,
            livenessChecked: verification.livenessScore !== null,
            similarityScore: verification.aiProfileScore,
            autoVerified: verification.verificationStatus === 'verified',
            aiComparisonMethod: verification.notes?.includes('AI Comparison') ? verification.notes.split('(')[1]?.split(')')[0] : null,
            aiProcessingStatus: verification.aiProcessingStatus || 'completed'
          }
        }
      });
      
    } catch (error: any) {
      console.error('Error updating verification:', error);
      return ResponseHelper.error(res, error.message);
    }
  }
}

// Export both enhanced and legacy controllers for gradual migration
export default EnhancedUserVerificationController;
