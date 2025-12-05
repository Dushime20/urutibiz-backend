# User Verification System - Complete Flow Documentation

## Overview

The User Verification System is a comprehensive KYC (Know Your Customer) solution that enables users to verify their identity through multiple verification types. The system uses AI-powered document processing, liveness detection, and profile matching to automate verification while maintaining manual review capabilities for admins.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Verification Types](#verification-types)
3. [Complete Flow - Step by Step](#complete-flow---step-by-step)
4. [API Endpoints](#api-endpoints)
5. [Database Schema](#database-schema)
6. [AI Processing Pipeline](#ai-processing-pipeline)
7. [Admin Review Process](#admin-review-process)
8. [Trust Score Calculation](#trust-score-calculation)
9. [Phone Verification](#phone-verification)
10. [Error Handling](#error-handling)

---

## System Architecture

### Components

```
┌─────────────────┐
│   Frontend      │
│  (React App)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Routes    │
│ userVerification│
│    .routes.ts   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Controllers   │
│ EnhancedUser    │
│ Verification    │
│  Controller     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Services     │
│ UserVerification│
│    Service      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│Database│ │AI Queue  │
│(Knex)  │ │(Background)│
└────────┘ └──────────┘
```

### Key Files

- **Routes**: `src/routes/userVerification.routes.ts`
- **Controller**: `src/controllers/userVerification.controller.enhanced.ts`
- **Service**: `src/services/userVerification.service.ts`
- **Types**: `src/types/userVerification.types.ts`
- **AI Utils**: `src/utils/kycAutomation.ts`, `src/utils/onnxProfileVerification.ts`

---

## Verification Types

The system supports the following verification types:

1. **national_id** - National ID card verification
2. **passport** - Passport verification
3. **driving_license** - Driver's license verification
4. **address** - Address verification (utility bills, bank statements)
5. **selfie** - Selfie with liveness detection

### Verification Statuses

- `unverified` - No verification submitted
- `pending` - Verification submitted, awaiting review
- `verified` - Verification approved by admin
- `rejected` - Verification rejected by admin
- `expired` - Verification expired

---

## Complete Flow - Step by Step

### Phase 1: User Submission

#### Step 1: User Initiates Verification
- User navigates to verification page in frontend
- User selects verification type (e.g., `national_id`, `passport`, etc.)
- User uploads required documents:
  - **Document Image**: Front/back of ID document
  - **Selfie Image**: Selfie photo for face matching

#### Step 2: Frontend Uploads Documents
```
POST /api/v1/user-verification/submit-documents
Content-Type: multipart/form-data

{
  verificationType: "national_id",
  documentNumber: "123456789",
  documentImage: <File>,
  selfieImage: <File>,
  addressLine: "123 Main St",
  city: "New York",
  district: "Manhattan",
  country: "USA"
}
```

#### Step 3: Controller Receives Request
**File**: `src/controllers/userVerification.controller.enhanced.ts`

```typescript
static async submitDocuments(req: Request, res: Response)
```

**Process**:
1. Extract `userId` from authenticated request (`req.user.id`)
2. Handle file uploads via Multer middleware
3. Upload images to Cloudinary storage
4. Get secure URLs for uploaded images

#### Step 4: Service Creates Initial Record
**File**: `src/services/userVerification.service.ts`

```typescript
static async submitVerificationInitial(userId: string, data: SubmitVerificationRequest)
```

**Process**:
1. Create verification record in `user_verifications` table with status `pending`
2. Store document URLs, user phone number, and metadata
3. Return verification object immediately (non-blocking)

**Database Insert**:
```sql
INSERT INTO user_verifications (
  id,
  user_id,
  verification_type,
  document_number,
  document_image_url,
  selfie_image_url,
  phone_number,
  verification_status,
  created_at
) VALUES (...)
```

---

### Phase 2: AI Processing (Background)

#### Step 5: Queue AI Processing Jobs
**File**: `src/controllers/userVerification.controller.enhanced.ts`

After creating the initial record, the system queues background jobs:

```typescript
// Queue OCR processing
if (documentImageUrl) {
  aiQueue.add('ai-verification', {
    verificationId: verification.id,
    verificationType: 'ocr',
    documentImageUrl: documentImageUrl
  });
}

// Queue liveness detection
if (selfieImageUrl) {
  aiQueue.add('ai-verification', {
    verificationType: 'liveness',
    selfieImageUrl: selfieImageUrl
  });
}

// Queue profile verification (face matching)
if (documentImageUrl && selfieImageUrl) {
  aiQueue.add('ai-verification', {
    verificationType: 'profile',
    documentImageUrl: documentImageUrl,
    selfieImageUrl: selfieImageUrl
  });
}
```

#### Step 6: OCR Processing
**File**: `src/utils/kycAutomation.ts`

```typescript
async function runOcrOnImage(imageUrl: string)
```

**Process**:
1. Download image from Cloudinary URL
2. Run OCR (Optical Character Recognition) using Tesseract.js
3. Extract text from document:
   - Document number
   - Name
   - Date of birth
   - Expiry date
   - Other relevant fields
4. Store OCR data in `ocr_data` JSON field

**Output**: JSON object with extracted text fields

#### Step 7: Liveness Detection
**File**: `src/utils/kycAutomation.ts`

```typescript
async function runLivenessCheck(selfieImageUrl: string)
```

**Process**:
1. Download selfie image
2. Run liveness detection algorithm
3. Calculate liveness score (0-100)
   - Detects if person is real (not photo of photo)
   - Checks for face presence
   - Validates image quality
4. Store score in `liveness_score` field

**Output**: Number (0-100) representing liveness confidence

#### Step 8: Profile Verification (Face Matching)
**File**: `src/utils/onnxProfileVerification.ts`

```typescript
async function runProfileVerification(modelPath: string, images: { doc_image, selfie_image })
```

**Process**:
1. Load ONNX model for face recognition
2. Preprocess both images (document photo + selfie)
3. Extract face embeddings from both images
4. Calculate similarity score between embeddings
5. Store score in `ai_profile_score` field

**Output**: Number (0-100) representing face match confidence

#### Step 9: Update Verification Record
After all AI processing completes:

```typescript
await db('user_verifications')
  .where({ id: verificationId })
  .update({
    ocr_data: ocrData,
    liveness_score: livenessScore,
    ai_profile_score: aiProfileScore,
    updated_at: new Date()
  });
```

---

### Phase 3: Admin Review

#### Step 10: Admin Views Pending Verifications
**Endpoint**: Admin dashboard shows pending verifications

**Query**:
```sql
SELECT * FROM user_verifications 
WHERE verification_status = 'pending'
ORDER BY created_at DESC
```

#### Step 11: Admin Reviews Verification
**File**: `src/services/userVerification.service.ts`

```typescript
static async reviewVerification(adminId: string, data: ReviewVerificationRequest)
```

**Admin Actions**:
1. View document images
2. Review OCR extracted data
3. Check AI scores:
   - OCR confidence
   - Liveness score (should be > 70)
   - Profile match score (should be > 80)
4. Make decision: `verified` or `rejected`
5. Add notes if needed

**Request**:
```
POST /api/v1/user-verification/review
{
  verificationId: "uuid",
  status: "verified" | "rejected",
  notes: "Optional admin notes"
}
```

#### Step 12: Update Verification Status
**Process**:
1. Update verification record:
   ```sql
   UPDATE user_verifications
   SET verification_status = 'verified',
       verified_by = adminId,
       verified_at = NOW(),
       notes = 'Admin notes'
   WHERE id = verificationId
   ```

2. Update user's ID verification status:
   ```sql
   UPDATE users
   SET id_verification_status = 'verified'
   WHERE id = userId
   ```

3. Check if user is fully KYC verified:
   ```typescript
   static async isUserFullyKycVerified(userId: string): Promise<boolean>
   ```
   
   **Logic**: Checks if user has at least 3 verified verification types

4. Update user's KYC status:
   ```sql
   UPDATE users
   SET kyc_status = 'verified'  -- or 'pending_review'
   WHERE id = userId
   ```

5. If KYC is fully verified:
   - Update `phone_verified` to `true`
   - Send notification to user

6. Send notification:
   ```typescript
   await NotificationService.sendKycStatusChange(userId, newKycStatus);
   ```

---

### Phase 4: User Status Check

#### Step 13: User Checks Verification Status
**Endpoint**: `GET /api/v1/user-verification/status`

**File**: `src/services/userVerification.service.ts`

```typescript
static async getUserVerificationStatus(userId: string)
```

**Process**:
1. Query all verifications for user
2. Calculate summary:
   - `overall_status`: 'unverified' | 'pending' | 'verified' | 'rejected'
   - `kyc_status`: Overall KYC completion status
   - `verification_types`: Status for each type
   - `pending_count`: Number of pending verifications
   - `verified_count`: Number of verified verifications
   - `rejected_count`: Number of rejected verifications

**Response**:
```json
{
  "success": true,
  "data": {
    "overall_status": "pending",
    "kyc_status": "pending_review",
    "verification_types": {
      "national_id": {
        "status": "pending",
        "submitted_at": "2024-01-15T10:00:00Z"
      },
      "selfie": {
        "status": "verified",
        "verified_at": "2024-01-15T11:00:00Z"
      }
    },
    "pending_count": 1,
    "verified_count": 1,
    "rejected_count": 0
  }
}
```

---

## API Endpoints

### User Endpoints

#### 1. Submit Documents
```
POST /api/v1/user-verification/submit-documents
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- verificationType: string (required)
- documentNumber: string (optional)
- documentImage: File (optional)
- selfieImage: File (optional)
- addressLine: string (optional)
- city: string (optional)
- district: string (optional)
- country: string (optional)
```

#### 2. Get Verification Status
```
GET /api/v1/user-verification/status
Authorization: Bearer <token>
```

#### 3. Get Verification Documents
```
GET /api/v1/user-verification/documents
Authorization: Bearer <token>
```

#### 4. Get Verification History
```
GET /api/v1/user-verification/history
Authorization: Bearer <token>
```

#### 5. Resubmit Verification
```
PUT /api/v1/user-verification/resubmit
Authorization: Bearer <token>

Body:
{
  verificationId: string,
  verificationType: string,
  documentImageUrl: string,
  selfieImageUrl: string,
  ...
}
```

#### 6. Update Verification
```
PUT /api/v1/user-verification/:verificationId
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

#### 7. Request Phone OTP
```
POST /api/v1/user-verification/request-phone-otp
Authorization: Bearer <token>

Body:
{
  phoneNumber: string,
  countryCode: string
}
```

#### 8. Verify Phone OTP
```
POST /api/v1/user-verification/verify-phone-otp
Authorization: Bearer <token>

Body:
{
  phoneNumber: string,
  otp: string
}
```

### Admin Endpoints

#### 1. Review Verification
```
POST /api/v1/user-verification/review
Authorization: Bearer <admin_token>

Body:
{
  verificationId: string,
  status: "verified" | "rejected",
  notes: string (optional)
}
```

---

## Database Schema

### `user_verifications` Table

```sql
CREATE TABLE user_verifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  verification_type VARCHAR(50) NOT NULL,
  document_number VARCHAR(255),
  document_image_url TEXT,
  selfie_image_url TEXT,
  phone_number VARCHAR(20),
  address_line VARCHAR(255),
  city VARCHAR(100),
  district VARCHAR(100),
  country VARCHAR(100),
  verification_status VARCHAR(20) DEFAULT 'pending',
  ocr_data JSONB,
  liveness_score DECIMAL(5,2),
  ai_profile_score DECIMAL(5,2),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### `users` Table (Relevant Fields)

```sql
ALTER TABLE users ADD COLUMN id_verification_status VARCHAR(20) DEFAULT 'unverified';
ALTER TABLE users ADD COLUMN kyc_status VARCHAR(20) DEFAULT 'unverified';
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
```

---

## AI Processing Pipeline

### OCR Processing Flow

```
Document Image
    │
    ▼
Download from Cloudinary
    │
    ▼
Preprocess Image
    │
    ▼
Run Tesseract OCR
    │
    ▼
Extract Text Fields
    │
    ▼
Store in ocr_data JSON
```

### Liveness Detection Flow

```
Selfie Image
    │
    ▼
Download from Cloudinary
    │
    ▼
Face Detection
    │
    ▼
Liveness Algorithm
    │
    ▼
Calculate Score (0-100)
    │
    ▼
Store in liveness_score
```

### Profile Verification Flow

```
Document Photo + Selfie
    │
    ▼
Download Both Images
    │
    ▼
Preprocess to ONNX Format
    │
    ▼
Load ONNX Model
    │
    ▼
Extract Face Embeddings
    │
    ▼
Calculate Similarity
    │
    ▼
Store in ai_profile_score
```

---

## Admin Review Process

### Review Criteria

1. **Document Quality**
   - Image clarity
   - Document validity (not expired)
   - Document authenticity

2. **OCR Data Validation**
   - Extracted text matches document
   - Document number format correct
   - Information consistency

3. **Liveness Score**
   - Minimum threshold: 70
   - Ensures real person, not photo

4. **Profile Match Score**
   - Minimum threshold: 80
   - Face in document matches selfie

5. **Additional Checks**
   - Address verification (if applicable)
   - Phone number verification
   - Cross-reference with user profile

### Admin Actions

- **Approve**: Set status to `verified`
- **Reject**: Set status to `rejected` with notes
- **Request More Info**: Add notes, keep as `pending`

---

## Trust Score Calculation

The system includes an advanced trust score system (in `verification.service.ts`) that calculates user trustworthiness:

### Components

1. **Identity Verification** (25% weight)
   - Document quality
   - Biometric match
   - Liveness score

2. **Transaction History** (25% weight)
   - Completion rate
   - Cancellation rate
   - Dispute rate
   - Average rating

3. **User Reviews** (25% weight)
   - Average rating
   - Review count
   - Response rate
   - Review quality

4. **Social Proof** (15% weight)
   - LinkedIn verification
   - Social connections
   - Professional status
   - Account age

5. **Response Time** (10% weight)
   - Average response time
   - Availability score
   - Communication quality

### Trust Score Levels

- **LOW**: 0-30
- **MEDIUM**: 31-60
- **HIGH**: 61-80
- **VERY_HIGH**: 81-95
- **EXCELLENT**: 96-100

---

## Phone Verification

### Flow

1. **Request OTP**
   ```
   POST /api/v1/user-verification/request-phone-otp
   {
     phoneNumber: "+1234567890",
     countryCode: "+1"
   }
   ```

2. **System Sends SMS**
   - Generate 6-digit OTP
   - Send via Twilio
   - Store OTP with expiration (5 minutes)

3. **User Verifies OTP**
   ```
   POST /api/v1/user-verification/verify-phone-otp
   {
     phoneNumber: "+1234567890",
     otp: "123456"
   }
   ```

4. **Update Phone Verification**
   - Mark phone as verified
   - Update user record

---

## Error Handling

### Common Errors

1. **Invalid Document Format**
   - Error: "Invalid document image format"
   - Solution: Ensure image is JPG/PNG, under 10MB

2. **Low Liveness Score**
   - Error: "Liveness check failed"
   - Solution: Retake selfie with better lighting

3. **Face Match Failed**
   - Error: "Profile verification failed"
   - Solution: Ensure selfie matches document photo

4. **OCR Extraction Failed**
   - Error: "Could not extract document data"
   - Solution: Upload clearer document image

5. **Verification Already Exists**
   - Error: "Verification already submitted"
   - Solution: Use resubmit endpoint or update existing

### Retry Logic

- AI processing jobs retry up to 3 times
- Failed jobs logged for manual review
- Users can resubmit rejected verifications

---

## Security Considerations

1. **Authentication**: All endpoints require JWT token
2. **Authorization**: Users can only access their own verifications
3. **Image Storage**: Secure Cloudinary URLs with expiration
4. **Data Privacy**: Document numbers masked in responses
5. **Rate Limiting**: Prevents abuse of verification endpoints
6. **Audit Trail**: All admin actions logged

---

## Performance Optimizations

1. **Async AI Processing**: Non-blocking background jobs
2. **Caching**: Verification status cached for 60 seconds
3. **Image Optimization**: Cloudinary auto-optimization
4. **Database Indexing**: Indexed on `user_id` and `verification_status`
5. **Queue Management**: Background queue with concurrency limits

---

## Testing

### Test Files

- `test-user-verification-e2e.js` - End-to-end tests
- `test-verification-logic-standalone.js` - Unit tests
- `test-verification-services-integration.js` - Integration tests

### Test Scenarios

1. Submit verification with valid documents
2. Submit verification with invalid documents
3. Admin review and approval
4. Admin review and rejection
5. Resubmit rejected verification
6. Phone OTP verification
7. Status check after verification

---

## Future Enhancements

1. **Real-time Updates**: WebSocket notifications for status changes
2. **Advanced AI**: Integration with third-party verification providers (Jumio, Onfido)
3. **Biometric Verification**: Fingerprint and voice recognition
4. **Document Validation**: Real-time document authenticity checks
5. **Multi-language Support**: OCR in multiple languages
6. **Video Verification**: Live video call verification option

---

## Conclusion

The User Verification System provides a comprehensive, secure, and scalable solution for KYC verification. It combines automated AI processing with manual admin review to ensure accuracy while maintaining user experience.

For questions or issues, refer to:
- API Documentation: `/api-docs` (Swagger)
- Service Logs: Check application logs for detailed processing information
- Database: Query `user_verifications` table for verification records







