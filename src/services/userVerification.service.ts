import { getDatabase } from '@/config/database';
import { UserVerification, SubmitVerificationRequest, ReviewVerificationRequest } from '@/types/userVerification.types';
import { v4 as uuidv4 } from 'uuid';
import { runOcrOnImage, runLivenessCheck } from '@/utils/kycAutomation';
import NotificationService from '@/services/notification.service';
import { runProfileVerification } from '@/utils/onnxProfileVerification';
import * as ort from 'onnxruntime-node';

export default class UserVerificationService {
  static async submitVerification(userId: string, data: SubmitVerificationRequest): Promise<UserVerification> {
    const db = getDatabase();
    let ocrData, livenessScore, aiProfileScore;
    if (data.documentImageUrl && ['national_id', 'passport', 'driving_license'].includes(data.verificationType)) {
      ocrData = await runOcrOnImage(data.documentImageUrl);
    }
    if (data.selfieImageUrl && data.verificationType === 'selfie') {
      livenessScore = await runLivenessCheck(data.selfieImageUrl);
    }
    // --- AI profile score using ONNX model ---
    aiProfileScore = 0;
    try {
      if (data.documentImageUrl && data.selfieImageUrl) {
        // Download images as buffers (placeholder for future image processing)
        // const docImgResp = await axios.get(data.documentImageUrl, { responseType: 'arraybuffer' });
        // const selfieImgResp = await axios.get(data.selfieImageUrl, { responseType: 'arraybuffer' });
        // Preprocess images to ort.Tensor (implement as needed)
        // Example: const docTensor = preprocessImageToTensor(Buffer.from(docImgResp.data));
        // Example: const selfieTensor = preprocessImageToTensor(Buffer.from(selfieImgResp.data));
        // For demo, use dummy ort.Tensor
        const docTensor = new ort.Tensor('float32', new Float32Array(224 * 224 * 3), [1, 224, 224, 3]);
        const selfieTensor = new ort.Tensor('float32', new Float32Array(224 * 224 * 3), [1, 224, 224, 3]);
        aiProfileScore = await runProfileVerification('models/profile_verification.onnx', {
          doc_image: docTensor,
          selfie_image: selfieTensor
        });
      }
    } catch (err) {
      aiProfileScore = 0;
    }
    const [row] = await db('user_verifications')
      .insert({
        id: uuidv4(),
        user_id: userId,
        verification_type: data.verificationType,
        document_number: data.documentNumber,
        document_image_url: data.documentImageUrl,
        address_line: data.addressLine,
        city: data.city,
        district: data.district,
        country: data.country,
        selfie_image_url: data.selfieImageUrl,
        ocr_data: ocrData,
        liveness_score: livenessScore,
        ai_profile_score: aiProfileScore,
        verification_status: 'pending',
        created_at: new Date()
      }, '*');
    return UserVerificationService.fromDb(row);
  }

  static async getUserVerifications(userId: string): Promise<UserVerification[]> {
    const db = getDatabase();
    const rows = await db('user_verifications').where({ user_id: userId });
    return rows.map(UserVerificationService.fromDb);
  }

  static async getUserVerificationStatus(userId: string) {
    const db = getDatabase();
    const verifications = await db('user_verifications').where({ user_id: userId });
    
    const statusSummary = {
      overall_status: 'unverified',
      kyc_status: 'unverified',
      verification_types: {} as Record<string, any>,
      pending_count: 0,
      verified_count: 0,
      rejected_count: 0
    };

    verifications.forEach((v: any) => {
      statusSummary.verification_types[v.verification_type] = {
        status: v.verification_status,
        submitted_at: v.created_at,
        verified_at: v.verified_at,
        notes: v.notes
      };

      if (v.verification_status === 'pending') statusSummary.pending_count++;
      if (v.verification_status === 'verified') statusSummary.verified_count++;
      if (v.verification_status === 'rejected') statusSummary.rejected_count++;
    });

    // Determine overall status
    if (statusSummary.verified_count >= 3) { // Assuming 3 required types
      statusSummary.overall_status = 'verified';
      statusSummary.kyc_status = 'verified';
    } else if (statusSummary.pending_count > 0) {
      statusSummary.overall_status = 'pending';
      statusSummary.kyc_status = 'pending_review';
    } else if (statusSummary.rejected_count > 0) {
      statusSummary.overall_status = 'rejected';
      statusSummary.kyc_status = 'rejected';
    }

    return statusSummary;
  }

  static async resubmitVerification(userId: string, verificationId: string, data: SubmitVerificationRequest): Promise<UserVerification> {
    const db = getDatabase();
    
    // Check if the verification exists and belongs to the user
    const existing = await db('user_verifications')
      .where({ id: verificationId, user_id: userId })
      .first();
    
    if (!existing) {
      throw new Error('Verification not found or access denied');
    }

    // Process OCR and AI scoring again
    let ocrData, livenessScore, aiProfileScore;
    if (data.documentImageUrl && ['national_id', 'passport', 'driving_license'].includes(data.verificationType)) {
      ocrData = await runOcrOnImage(data.documentImageUrl);
    }
    if (data.selfieImageUrl && data.verificationType === 'selfie') {
      livenessScore = await runLivenessCheck(data.selfieImageUrl);
    }
    
    aiProfileScore = 0;
    try {
      if (data.documentImageUrl && data.selfieImageUrl) {
        // Download images as buffers (placeholder for future image processing)
        // const docImgResp = await axios.get(data.documentImageUrl, { responseType: 'arraybuffer' });
        // const selfieImgResp = await axios.get(data.selfieImageUrl, { responseType: 'arraybuffer' });
        const docTensor = new ort.Tensor('float32', new Float32Array(224 * 224 * 3), [1, 224, 224, 3]);
        const selfieTensor = new ort.Tensor('float32', new Float32Array(224 * 224 * 3), [1, 224, 224, 3]);
        aiProfileScore = await runProfileVerification('models/profile_verification.onnx', {
          doc_image: docTensor,
          selfie_image: selfieTensor
        });
      }
    } catch (err) {
      aiProfileScore = 0;
    }

    // Update the verification record
    const [row] = await db('user_verifications')
      .where({ id: verificationId, user_id: userId })
      .update({
        verification_type: data.verificationType,
        document_number: data.documentNumber,
        document_image_url: data.documentImageUrl,
        address_line: data.addressLine,
        city: data.city,
        district: data.district,
        country: data.country,
        selfie_image_url: data.selfieImageUrl,
        ocr_data: ocrData,
        liveness_score: livenessScore,
        ai_profile_score: aiProfileScore,
        verification_status: 'pending',
        verified_by: null,
        verified_at: null,
        notes: null,
        created_at: new Date()
      }, '*');

    return UserVerificationService.fromDb(row);
  }

  static async getUserVerificationDocuments(userId: string) {
    const db = getDatabase();
    const verifications = await db('user_verifications').where({ user_id: userId });
    
    return verifications.map((v: any) => ({
      id: v.id,
      verification_type: v.verification_type,
      document_number: v.document_number,
      document_image_url: v.document_image_url,
      selfie_image_url: v.selfie_image_url,
      verification_status: v.verification_status,
      submitted_at: v.created_at,
      ocr_data: v.ocr_data,
      ai_profile_score: v.ai_profile_score,
      liveness_score: v.liveness_score
    }));
  }

  static async getUserVerificationHistory(userId: string) {
    const db = getDatabase();
    const verifications = await db('user_verifications')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');
    
    return verifications.map((v: any) => ({
      id: v.id,
      verification_type: v.verification_type,
      verification_status: v.verification_status,
      submitted_at: v.created_at,
      verified_at: v.verified_at,
      verified_by: v.verified_by,
      notes: v.notes,
      document_number: v.document_number ? v.document_number.substring(0, 4) + '****' : null, // Masked for privacy
      ai_profile_score: v.ai_profile_score,
      liveness_score: v.liveness_score
    }));
  }

  static async reviewVerification(adminId: string, data: ReviewVerificationRequest): Promise<UserVerification> {
    const db = getDatabase();
    // Update the verification record
    const [row] = await db('user_verifications')
      .where({ id: data.verificationId })
      .update({
        verification_status: data.status,
        verified_by: adminId,
        verified_at: new Date(),
        notes: data.notes
      }, '*');
    // If approved or rejected, update user's id_verification_status and kyc_status
    if (row && (data.status === 'verified' || data.status === 'rejected')) {
      await db('users').where({ id: row.user_id }).update({
        id_verification_status: data.status
      });
      // If all required types are verified, set kyc_status to 'verified', else 'pending_review'
      const isFullyVerified = await UserVerificationService.isUserFullyKycVerified(row.user_id);
      const newKycStatus = isFullyVerified ? 'verified' : 'pending_review';
      await db('users').where({ id: row.user_id }).update({
        kyc_status: newKycStatus
      });
      // Send KYC status change notification
      await NotificationService.sendKycStatusChange(row.user_id, newKycStatus);
    }
    return UserVerificationService.fromDb(row);
  }

  // Helper: Check if user is fully KYC-verified (all required types are verified)
  static async isUserFullyKycVerified(userId: string): Promise<boolean> {
    const db = getDatabase();
    // Define required types for full KYC
    const requiredTypes = ['national_id', 'selfie', 'address'];
    const rows = await db('user_verifications')
      .where({ user_id: userId, verification_status: 'verified' });
    const verifiedTypes = new Set(rows.map((r: any) => r.verification_type));
    return requiredTypes.every(type => verifiedTypes.has(type));
  }

  static fromDb(row: any): UserVerification {
    return {
      id: row.id,
      userId: row.user_id,
      verificationType: row.verification_type,
      documentNumber: row.document_number,
      documentImageUrl: row.document_image_url,
      verificationStatus: row.verification_status,
      verifiedBy: row.verified_by,
      verifiedAt: row.verified_at ? row.verified_at.toISOString() : undefined,
      notes: row.notes,
      createdAt: row.created_at ? row.created_at.toISOString() : '',
      addressLine: row.address_line,
      city: row.city,
      district: row.district,
      country: row.country,
      ocrData: row.ocr_data,
      selfieImageUrl: row.selfie_image_url,
      livenessScore: row.liveness_score,
      aiProfileScore: row.ai_profile_score
    };
  }

  /**
   * Submit verification without AI processing (for async mode)
   */
  static async submitVerificationInitial(userId: string, data: SubmitVerificationRequest): Promise<UserVerification> {
    const db = getDatabase();
    
    const [row] = await db('user_verifications')
      .insert({
        id: uuidv4(),
        user_id: userId,
        verification_type: data.verificationType,
        document_number: data.documentNumber,
        document_image_url: data.documentImageUrl,
        address_line: data.addressLine,
        city: data.city,
        district: data.district,
        country: data.country,
        selfie_image_url: data.selfieImageUrl,
        verification_status: 'pending',
        ai_processing_status: 'queued',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    return row;
  }

  /**
   * Update verification with AI processing results
   */
  static async updateVerificationWithAI(verificationId: string, aiResults: {
    ocrData?: any;
    livenessScore?: number;
    profileScore?: number;
  }): Promise<void> {
    const db = getDatabase();
    
    const updateData: any = {
      updated_at: new Date(),
    };
    
    if (aiResults.ocrData) {
      updateData.ocr_data = JSON.stringify(aiResults.ocrData);
    }
    
    if (aiResults.livenessScore !== undefined) {
      updateData.liveness_score = aiResults.livenessScore;
    }
    
    if (aiResults.profileScore !== undefined) {
      updateData.ai_profile_score = aiResults.profileScore;
    }
    
    // Determine verification status based on AI results
    const allScoresGood = 
      (!aiResults.livenessScore || aiResults.livenessScore > 0.7) &&
      (!aiResults.profileScore || aiResults.profileScore > 0.8) &&
      (!aiResults.ocrData || aiResults.ocrData.confidence > 0.85);
    
    updateData.verification_status = allScoresGood ? 'verified' : 'pending';
    updateData.ai_processing_status = 'completed';
    
    await db('user_verifications')
      .where('id', verificationId)
      .update(updateData);
  }

  /**
   * Get verification by ID
   */
  static async getVerificationById(verificationId: string): Promise<UserVerification> {
    const db = getDatabase();
    
    const verification = await db('user_verifications')
      .where('id', verificationId)
      .first();
    
    if (!verification) {
      throw new Error('Verification not found');
    }
    
    return verification;
  }

  /**
   * Cancel verification processing
   */
  static async cancelVerification(verificationId: string): Promise<void> {
    const db = getDatabase();
    
    await db('user_verifications')
      .where('id', verificationId)
      .update({
        verification_status: 'cancelled',
        ai_processing_status: 'cancelled',
        updated_at: new Date()
      });
  }
}
