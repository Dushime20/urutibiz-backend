# AI Image Comparison Implementation

## Overview

This implementation provides a comprehensive AI-powered image comparison service for user verification, comparing document photos with selfies to determine if they belong to the same person.

## Features

### 🤖 Multiple AI Methods
- **Google Vision API** - Most accurate for face detection and comparison
- **AWS Rekognition** - Alternative cloud-based face comparison
- **Basic Image Comparison** - Fallback method using pixel-based similarity

### 🔄 Automatic Fallback
- If Google Vision is unavailable, tries AWS Rekognition
- If AWS Rekognition is unavailable, uses basic comparison
- Always provides a result, never fails completely

### 📊 Smart Verification Logic
- **High Similarity (>75%) + High Confidence (>80%)** = ✅ **VERIFIED**
- **Low Similarity (<40%)** = ❌ **REJECTED**
- **Moderate Similarity (40-75%)** = ⏳ **PENDING** (manual review)

## Installation

### 1. Install Dependencies

```bash
npm install @google-cloud/vision google-auth-library
```

### 2. Environment Configuration

Add these environment variables to your `.env` file:

```env
# For Google Vision API
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json

# For AWS Rekognition (alternative)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### 3. Google Vision Setup

1. **Create Google Cloud Project:**
   ```bash
   # Go to Google Cloud Console
   # Create a new project or select existing
   ```

2. **Enable Vision API:**
   ```bash
   # In Google Cloud Console
   # Go to APIs & Services > Library
   # Search for "Cloud Vision API"
   # Click Enable
   ```

3. **Create Service Account:**
   ```bash
   # Go to IAM & Admin > Service Accounts
   # Click "Create Service Account"
   # Name: "vision-api-service"
   # Role: "Cloud Vision API User"
   ```

4. **Download Key File:**
   ```bash
   # Click on the service account
   # Go to Keys tab
   # Click "Add Key" > "Create new key"
   # Choose JSON format
   # Download and save as `google-vision-key.json`
   ```

5. **Set Environment Variable:**
   ```bash
   # Add to your .env file
   GOOGLE_APPLICATION_CREDENTIALS=./google-vision-key.json
   ```

### 4. AWS Rekognition Setup (Optional)

1. **Create AWS Account:**
   ```bash
   # Sign up for AWS account
   # Go to IAM Console
   ```

2. **Create IAM User:**
   ```bash
   # Create new user
   # Attach policy: AmazonRekognitionFullAccess
   # Generate access keys
   ```

3. **Set Environment Variables:**
   ```bash
   # Add to your .env file
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   ```

## Usage

### 1. Basic Usage

```typescript
import { imageComparisonService } from '@/services/imageComparison.service';

// Compare document and selfie images
const result = await imageComparisonService.compareImages(
  'https://example.com/document.jpg',
  'https://example.com/selfie.jpg'
);

console.log('Similarity:', result.similarity); // 0.0 - 1.0
console.log('Confidence:', result.confidence); // 0.0 - 1.0
console.log('Is Match:', result.isMatch); // boolean
console.log('Method:', result.method); // 'google_vision' | 'aws_rekognition' | 'basic_comparison'
```

### 2. Integration with Verification Service

The service is automatically integrated into the user verification flow:

```typescript
// In UserVerificationService.updateVerification()
const aiComparisonResult = await imageComparisonService.compareImages(docUrl, selfieUrl);

// Determine verification status
if (aiComparisonResult.isMatch && aiComparisonResult.similarity > 0.75 && aiComparisonResult.confidence > 0.8) {
  verificationStatus = 'verified';
} else if (aiComparisonResult.similarity < 0.4) {
  verificationStatus = 'rejected';
} else {
  verificationStatus = 'pending';
}
```

### 3. API Endpoint Usage

```bash
# Update verification with image comparison
PUT /api/v1/user-verification/{verificationId}

# Request body (multipart/form-data)
{
  "documentImage": [file upload],
  "selfieImage": [file upload],
  "verificationType": "national_id"
}

# Response
{
  "success": true,
  "message": "Verification completed and auto-verified!",
  "data": {
    "verification": {
      "verificationStatus": "verified",
      "aiProfileScore": 0.85,
      "processingDetails": {
        "similarityScore": 0.85,
        "autoVerified": true,
        "aiComparisonMethod": "google_vision",
        "aiProcessingStatus": "completed"
      }
    }
  }
}
```

## API Response Examples

### ✅ Successful Verification

```json
{
  "success": true,
  "message": "Verification completed and auto-verified!",
  "data": {
    "verification": {
      "id": "uuid-here",
      "verificationStatus": "verified",
      "aiProfileScore": 0.92,
      "notes": "AI Comparison (google_vision): Similarity 92.0%, Confidence 95.0%",
      "processingDetails": {
        "similarityScore": 0.92,
        "autoVerified": true,
        "aiComparisonMethod": "google_vision",
        "aiProcessingStatus": "completed"
      }
    }
  }
}
```

### ❌ Rejected Verification

```json
{
  "success": true,
  "message": "Verification rejected",
  "data": {
    "verification": {
      "id": "uuid-here",
      "verificationStatus": "rejected",
      "aiProfileScore": 0.25,
      "notes": "AI Comparison (aws_rekognition): Similarity 25.0%, Confidence 80.0%",
      "processingDetails": {
        "similarityScore": 0.25,
        "autoVerified": false,
        "aiComparisonMethod": "aws_rekognition",
        "aiProcessingStatus": "completed"
      }
    }
  }
}
```

### ⏳ Pending Review

```json
{
  "success": true,
  "message": "Verification updated successfully",
  "data": {
    "verification": {
      "id": "uuid-here",
      "verificationStatus": "pending",
      "aiProfileScore": 0.65,
      "notes": "AI Comparison (basic_comparison): Similarity 65.0%, Confidence 80.0%",
      "processingDetails": {
        "similarityScore": 0.65,
        "autoVerified": false,
        "aiComparisonMethod": "basic_comparison",
        "aiProcessingStatus": "completed"
      }
    }
  }
}
```

## Testing

### 1. Run Test Script

```bash
# Build the project first
npm run build

# Run the test script
node test-image-comparison.js
```

### 2. Test with Real Images

```typescript
// Replace with actual image URLs
const testResult = await imageComparisonService.compareImages(
  'https://your-domain.com/document.jpg',
  'https://your-domain.com/selfie.jpg'
);

console.log('Test Result:', testResult);
```

### 3. Test Different Scenarios

```typescript
// Test same person (should be high similarity)
const samePerson = await imageComparisonService.compareImages(doc1, selfie1);

// Test different person (should be low similarity)
const differentPerson = await imageComparisonService.compareImages(doc2, selfie2);

// Test poor quality (should be moderate similarity)
const poorQuality = await imageComparisonService.compareImages(doc3, selfie3);
```

## Configuration Options

### 1. Similarity Thresholds

You can adjust the verification thresholds in `UserVerificationService.updateVerification()`:

```typescript
// Current thresholds
if (aiComparisonResult.isMatch && aiComparisonResult.similarity > 0.75 && aiComparisonResult.confidence > 0.8) {
  verificationStatus = 'verified';
} else if (aiComparisonResult.similarity < 0.4) {
  verificationStatus = 'rejected';
} else {
  verificationStatus = 'pending';
}

// Adjust as needed
if (aiComparisonResult.similarity > 0.8) { // More strict
  verificationStatus = 'verified';
} else if (aiComparisonResult.similarity < 0.3) { // More strict
  verificationStatus = 'rejected';
}
```

### 2. Method Priority

The service tries methods in this order:
1. Google Vision API (most accurate)
2. AWS Rekognition (alternative)
3. Basic comparison (fallback)

You can modify the priority in `ImageComparisonService.compareImages()`.

### 3. Timeout Settings

```typescript
// In imageComparison.service.ts
private async downloadImageAsBuffer(url: string): Promise<Buffer> {
  const response = await axios.get(url, { 
    responseType: 'arraybuffer',
    timeout: 10000 // 10 second timeout - adjust as needed
  });
  return Buffer.from(response.data);
}
```

## Troubleshooting

### 1. Google Vision Not Working

```bash
# Check credentials
echo $GOOGLE_APPLICATION_CREDENTIALS

# Test credentials
node -e "
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();
console.log('Google Vision client created successfully');
"
```

### 2. AWS Rekognition Not Working

```bash
# Check environment variables
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
echo $AWS_REGION

# Test credentials
node -e "
const AWS = require('aws-sdk');
const rekognition = new AWS.Rekognition();
console.log('AWS Rekognition client created successfully');
"
```

### 3. Image Download Issues

```typescript
// Check if images are accessible
const testImage = async (url: string) => {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    console.log('Image accessible:', response.status === 200);
    console.log('Image size:', response.data.length);
  } catch (error) {
    console.error('Image not accessible:', error.message);
  }
};
```

### 4. Performance Issues

```typescript
// Add caching for processed images
const imageCache = new Map();

const getCachedImage = async (url: string) => {
  if (imageCache.has(url)) {
    return imageCache.get(url);
  }
  
  const buffer = await downloadImageAsBuffer(url);
  imageCache.set(url, buffer);
  return buffer;
};
```

## Security Considerations

### 1. Image Privacy
- Images are processed in memory and not stored permanently
- Consider implementing image encryption for sensitive documents
- Use HTTPS for all image URLs

### 2. API Rate Limits
- Google Vision: 1000 requests per minute
- AWS Rekognition: 5 requests per second
- Implement rate limiting in your application

### 3. Error Handling
- Never expose internal API keys in error messages
- Log errors securely without sensitive data
- Implement proper authentication for all endpoints

## Performance Optimization

### 1. Image Preprocessing
```typescript
// Resize images before processing
const preprocessImage = async (buffer: Buffer) => {
  return await sharp(buffer)
    .resize(512, 512) // Reduce size for faster processing
    .jpeg({ quality: 80 }) // Compress for faster upload
    .toBuffer();
};
```

### 2. Caching
```typescript
// Cache comparison results
const comparisonCache = new Map();

const getCachedComparison = (docUrl: string, selfieUrl: string) => {
  const key = `${docUrl}|${selfieUrl}`;
  return comparisonCache.get(key);
};
```

### 3. Batch Processing
```typescript
// Process multiple verifications in batch
const batchCompare = async (comparisons: Array<{doc: string, selfie: string}>) => {
  return await Promise.all(
    comparisons.map(c => imageComparisonService.compareImages(c.doc, c.selfie))
  );
};
```

## Monitoring and Logging

### 1. Add Logging
```typescript
// In imageComparison.service.ts
console.log(`🔍 Starting ${method} comparison...`);
console.log(`📊 ${method} - Similarity: ${similarity.toFixed(3)}, Confidence: ${confidence.toFixed(3)}`);
console.log(`🏆 Best comparison result: ${bestResult.method}`);
```

### 2. Metrics Collection
```typescript
// Track comparison metrics
const metrics = {
  totalComparisons: 0,
  successfulComparisons: 0,
  averageSimilarity: 0,
  methodUsage: {
    google_vision: 0,
    aws_rekognition: 0,
    basic_comparison: 0
  }
};
```

## Future Enhancements

### 1. Additional AI Services
- Azure Face API
- Face++ API
- Custom trained models

### 2. Advanced Features
- Liveness detection
- Document type detection
- OCR integration
- Fraud detection

### 3. Performance Improvements
- GPU acceleration
- Model optimization
- Distributed processing

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the logs for error messages
3. Test with the provided test script
4. Verify your API credentials and permissions 