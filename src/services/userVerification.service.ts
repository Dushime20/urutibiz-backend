import { getDatabase } from '@/config/database';
import { UserVerification, SubmitVerificationRequest, ReviewVerificationRequest, UpdateVerificationRequest } from '@/types/userVerification.types';
import { v4 as uuidv4 } from 'uuid';
import { runOcrOnImage, runLivenessCheck } from '@/utils/kycAutomation';
import NotificationService from '@/services/notification.service';
import { runProfileVerification, getDefaultModelPath, setupProfileVerificationModel } from '@/utils/onnxProfileVerification';
import { imageComparisonService } from '@/services/imageComparison.service';
import * as ort from 'onnxruntime-node';
import { compareFacesFaceApi } from './faceApiComparison.service';
import twilio from 'twilio';
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID || 'your_account_sid';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'your_auth_token';
const twilioPhone = process.env.TWILIO_PHONE_NUMBER || 'your_twilio_phone_number';
const twilioClient = twilio(accountSid, authToken);

// Real SMS sender using Twilio
async function sendSms(phoneNumber: string, message: string) {
  try {
    await twilioClient.messages.create({
      body: message,
      from: twilioPhone,
      to: phoneNumber
    });
    console.log(`[SMS] Sent to ${phoneNumber}`);
  } catch (err) {
    console.error('[SMS] Failed to send:', err);
    throw new Error('Failed to send SMS');
  }
}

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
        aiProfileScore = await runProfileVerification(getDefaultModelPath(), {
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
        aiProfileScore = await runProfileVerification(getDefaultModelPath(), {
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
      aiProcessingStatus: row.ai_processing_status || '', // <-- Add this line
      id: row.id,
      userId: row.user_id,
      verificationType: row.verification_type,
      documentNumber: row.document_number,
      documentImageUrl: row.document_image_url,
      verificationStatus: row.verification_status,
      verifiedBy: row.verified_by,
      verifiedAt: row.verified_at,
      notes: row.notes,
      createdAt: row.created_at,
      addressLine: row.address_line,
      city: row.city,
      district: row.district,
      country: row.country,
      ocrData: row.ocr_data,
      selfieImageUrl: row.selfie_image_url,
      livenessScore: row.liveness_score,
      aiProfileScore: row.ai_profile_score,
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
   * Update user verification data
   * @param userId - The user ID for authorization
   * @param verificationId - The verification ID to update
   * @param data - The data to update
   * @returns Updated verification object
   */
  static async updateVerification(userId: string, verificationId: string, data: UpdateVerificationRequest): Promise<UserVerification> {
    const db = getDatabase();
    
    console.log(`🔍 Debug: Checking verification ${verificationId} for user ${userId}`);
    
    // Check if the verification exists and belongs to the user
    const existing = await db('user_verifications')
      .where({ id: verificationId, user_id: userId })
      .first();
    
    console.log(`🔍 Debug: Database query result:`, existing ? 'Found' : 'Not found');
    
    if (!existing) {
      // Let's check if the verification exists at all (for debugging)
      const anyVerification = await db('user_verifications')
        .where({ id: verificationId })
        .first();
      
      if (anyVerification) {
        console.log(`🔍 Debug: Verification exists but belongs to user ${anyVerification.user_id}, not ${userId}`);
        throw new Error(`Verification not found or access denied. Verification belongs to user ${anyVerification.user_id}, but you are user ${userId}`);
      } else {
        console.log(`🔍 Debug: Verification ${verificationId} does not exist in database`);
        throw new Error(`Verification not found or access denied. Verification ID ${verificationId} does not exist.`);
      }
    }

    console.log(`🔍 Debug: Verification found. Status: ${existing.verification_status}`);

    // Only allow updates if verification is not already verified
    if (existing.verification_status === 'verified') {
      throw new Error('Cannot update already verified documents');
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date()
    };

    // Update basic fields if provided
    if (data.verificationType) {
      updateData.verification_type = data.verificationType;
    }
    if (data.documentNumber !== undefined) {
      updateData.document_number = data.documentNumber;
    }
    if (data.documentImageUrl !== undefined) {
      updateData.document_image_url = data.documentImageUrl;
    }
    if (data.addressLine !== undefined) {
      updateData.address_line = data.addressLine;
    }
    if (data.city !== undefined) {
      updateData.city = data.city;
    }
    if (data.district !== undefined) {
      updateData.district = data.district;
    }
    if (data.country !== undefined) {
      updateData.country = data.country;
    }
    if (data.selfieImageUrl !== undefined) {
      updateData.selfie_image_url = data.selfieImageUrl;
    }

    console.log(`🔍 Debug: Update data prepared:`, updateData);

    // OCR processing only happens during updates (not during initial submission)
    let ocrData = null;
    let livenessScore = null;
    let aiProfileScore = null;
    let verificationStatus = 'pending';
    
    // Process OCR if document image is provided
    if (data.documentImageUrl && ['national_id', 'passport', 'driving_license'].includes(data.verificationType || existing.verification_type)) {
      try {
        console.log('🔍 Debug: Starting OCR processing...');
        ocrData = await runOcrOnImage(data.documentImageUrl);
        updateData.ocr_data = ocrData;
        console.log(`🔍 Debug: OCR processing completed:`, ocrData);
      } catch (error) {
        console.error('OCR processing failed:', error);
      }
    }
    
    // Process liveness check if selfie image is provided
    if (data.selfieImageUrl && (data.verificationType === 'selfie' || existing.verification_type === 'selfie')) {
      try {
        console.log('🔍 Debug: Starting liveness check...');
        livenessScore = await runLivenessCheck(data.selfieImageUrl);
        updateData.liveness_score = livenessScore;
        console.log(`🔍 Debug: Liveness check completed:`, livenessScore);
      } catch (error) {
        console.error('Liveness check failed:', error);
      }
    }
    
    // Compare document and selfie images for similarity using AI
    const docUrl = data.documentImageUrl || existing.document_image_url;
    const selfieUrl = data.selfieImageUrl || existing.selfie_image_url;
    
    if (docUrl && selfieUrl)
      try {
        console.log('🔍 Starting AI image comparison (face-api.js)...');
        console.log(`🔍 Document URL: ${docUrl}`);
        console.log(`🔍 Selfie URL: ${selfieUrl}`);
        
        // Use face-api.js for image comparison
        const aiComparisonResult = await compareFacesFaceApi(docUrl, selfieUrl);
        
        aiProfileScore = aiComparisonResult.similarity;
        updateData.ai_profile_score = aiProfileScore;
        updateData.ai_processing_status = 'completed';
        
        console.log(`🔍 AI comparison completed:`, {
          similarity: aiComparisonResult.similarity,
          isMatch: aiComparisonResult.isMatch,
          distance: aiComparisonResult.distance,
          method: 'face-api.js'
        });
        
        // Determine verification status based on AI comparison results
        if (aiComparisonResult.isMatch && aiComparisonResult.similarity > 0.75) {
          verificationStatus = 'verified';
          console.log('✅ AI verification successful - setting status to verified');
        } else if (aiComparisonResult.similarity < 0.4) {
          verificationStatus = 'rejected';
          console.log('❌ AI verification failed - setting status to rejected');
        } else {
          verificationStatus = 'pending';
          console.log('⚠️ AI verification inconclusive - keeping status as pending');
        }
        
        // Add AI comparison details to notes
        const aiNotes = `AI Comparison (face-api.js): Similarity ${(aiComparisonResult.similarity * 100).toFixed(1)}%, Distance ${aiComparisonResult.distance.toFixed(3)}`;
        updateData.notes = aiNotes;
      } catch (error) {
        console.error('AI comparison failed:', error);
      }

    // Set verification status based on similarity comparison
    updateData.verification_status = verificationStatus;
    
    // If verified, set verification metadata
    if (verificationStatus === 'verified') {
      updateData.verified_by = userId; // Self-verified through AI
      updateData.verified_at = new Date();
      updateData.notes = 'Auto-verified through image similarity comparison';
    } else {
      updateData.verified_by = null;
      updateData.verified_at = null;
      updateData.notes = null;
    }

    console.log(`🔍 Debug: Final update data:`, updateData);

    // Update the verification record
    const [row] = await db('user_verifications')
      .where({ id: verificationId, user_id: userId })
      .update(updateData, '*');

    console.log(`🔍 Debug: Update completed. Rows affected:`, row ? 1 : 0);

    return UserVerificationService.fromDb(row);
  }

  /**
   * Get verification by ID with authorization check
   */
  static async getVerificationById(verificationId: string): Promise<UserVerification> {
    const db = getDatabase();
    const row = await db('user_verifications').where({ id: verificationId }).first();
    
    if (!row) {
      throw new Error('Verification not found');
    }
    
    return UserVerificationService.fromDb(row);
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

  /**
   * Request OTP for phone number update
   */
  static async requestPhoneOtp(userId: string, newPhoneNumber: string): Promise<void> {
    const db = getDatabase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP
    await db('phone_verification_otps').insert({
      user_id: userId,
      phone_number: newPhoneNumber,
      otp_code: otp,
      expires_at: expiresAt,
      verified: false,
      created_at: new Date()
    });

    // Send OTP via SMS
    await sendSms(newPhoneNumber, `Your verification code is: ${otp}`);
  }

  /**
   * Verify OTP and update phone number in user_verifications
   */
  static async verifyPhoneOtp(userId: string, newPhoneNumber: string, otp: string): Promise<void> {
    const db = getDatabase();
    const record = await db('phone_verification_otps')
      .where({ user_id: userId, phone_number: newPhoneNumber, otp_code: otp, verified: false })
      .andWhere('expires_at', '>', new Date())
      .first();

    if (!record) {
      throw new Error('Invalid or expired OTP');
    }

    // Mark OTP as used
    await db('phone_verification_otps').where({ id: record.id }).update({ verified: true });

    // Update phone number in user_verifications (latest verification)
    await db('user_verifications')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(1)
      .update({ phone_number: newPhoneNumber });

    // Check latest verification status and update user if needed
    const latestVerification = await db('user_verifications')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .first();

    if (
      latestVerification &&
      (latestVerification.verification_status === 'pending' || latestVerification.verification_status === 'verified')
    ) {
      await db('users')
        .where({ id: userId })
        .update({
          phone_verified: true,
          kyc_status: 'verified',
          id_verification_status: 'verified'
        });
    }
  }
}
