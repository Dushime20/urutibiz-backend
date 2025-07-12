/**
 * Image Comparison Service Usage Example
 * 
 * This example demonstrates how to use the AI image comparison service
 * for user verification in your application.
 */

const { imageComparisonService } = require('../dist/services/imageComparison.service');

// Example usage scenarios
async function demonstrateImageComparison() {
  console.log('🤖 Image Comparison Service Demo\n');

  // Scenario 1: Successful verification (same person)
  console.log('📋 Scenario 1: Same Person Verification');
  console.log('Expected: High similarity, VERIFIED status\n');
  
  try {
    const result1 = await imageComparisonService.compareImages(
      'https://example.com/document-same-person.jpg',
      'https://example.com/selfie-same-person.jpg'
    );
    
    console.log('✅ Results:');
    console.log(`   Method: ${result1.method}`);
    console.log(`   Similarity: ${(result1.similarity * 100).toFixed(1)}%`);
    console.log(`   Confidence: ${(result1.confidence * 100).toFixed(1)}%`);
    console.log(`   Is Match: ${result1.isMatch ? 'Yes' : 'No'}`);
    
    // Determine verification status
    if (result1.isMatch && result1.similarity > 0.75 && result1.confidence > 0.8) {
      console.log('   Status: ✅ VERIFIED');
    } else if (result1.similarity < 0.4) {
      console.log('   Status: ❌ REJECTED');
    } else {
      console.log('   Status: ⏳ PENDING REVIEW');
    }
    
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Scenario 2: Failed verification (different person)
  console.log('📋 Scenario 2: Different Person Verification');
  console.log('Expected: Low similarity, REJECTED status\n');
  
  try {
    const result2 = await imageComparisonService.compareImages(
      'https://example.com/document-different-person.jpg',
      'https://example.com/selfie-different-person.jpg'
    );
    
    console.log('❌ Results:');
    console.log(`   Method: ${result2.method}`);
    console.log(`   Similarity: ${(result2.similarity * 100).toFixed(1)}%`);
    console.log(`   Confidence: ${(result2.confidence * 100).toFixed(1)}%`);
    console.log(`   Is Match: ${result2.isMatch ? 'Yes' : 'No'}`);
    
    if (result2.similarity < 0.4) {
      console.log('   Status: ❌ REJECTED');
    } else {
      console.log('   Status: ⏳ PENDING REVIEW');
    }
    
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Scenario 3: Integration with verification service
  console.log('📋 Scenario 3: Integration Example');
  console.log('How to integrate with UserVerificationService\n');
  
  const integrationExample = `
// In your verification service
const updateVerification = async (userId, verificationId, data) => {
  const docUrl = data.documentImageUrl;
  const selfieUrl = data.selfieImageUrl;
  
  if (docUrl && selfieUrl) {
    // Perform AI comparison
    const aiResult = await imageComparisonService.compareImages(docUrl, selfieUrl);
    
    // Determine verification status
    let verificationStatus = 'pending';
    let notes = '';
    
    if (aiResult.isMatch && aiResult.similarity > 0.75 && aiResult.confidence > 0.8) {
      verificationStatus = 'verified';
      notes = \`AI Comparison (\${aiResult.method}): Similarity \${(aiResult.similarity * 100).toFixed(1)}%, Confidence \${(aiResult.confidence * 100).toFixed(1)}%\`;
    } else if (aiResult.similarity < 0.4) {
      verificationStatus = 'rejected';
      notes = \`AI Comparison (\${aiResult.method}): Similarity \${(aiResult.similarity * 100).toFixed(1)}%, Confidence \${(aiResult.confidence * 100).toFixed(1)}%\`;
    } else {
      verificationStatus = 'pending';
      notes = \`AI Comparison (\${aiResult.method}): Similarity \${(aiResult.similarity * 100).toFixed(1)}%, Confidence \${(aiResult.confidence * 100).toFixed(1)}%\`;
    }
    
    // Update database
    await db('user_verifications')
      .where({ id: verificationId, user_id: userId })
      .update({
        verification_status: verificationStatus,
        ai_profile_score: aiResult.similarity,
        notes: notes,
        verified_at: verificationStatus === 'verified' ? new Date() : null,
        verified_by: verificationStatus === 'verified' ? userId : null
      });
    
    return { verificationStatus, aiResult };
  }
};
  `;
  
  console.log(integrationExample);

  console.log('\n' + '='.repeat(50) + '\n');

  // Scenario 4: API endpoint usage
  console.log('📋 Scenario 4: API Endpoint Usage');
  console.log('How to use the verification API\n');
  
  const apiExample = `
// PUT /api/v1/user-verification/{verificationId}
// Content-Type: multipart/form-data

// Request body:
{
  "documentImage": [file upload],
  "selfieImage": [file upload],
  "verificationType": "national_id"
}

// Response:
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
  `;
  
  console.log(apiExample);

  console.log('\n' + '='.repeat(50) + '\n');

  // Summary
  console.log('📋 Summary');
  console.log('✅ Image comparison service is ready to use');
  console.log('✅ Multiple AI methods available with fallback');
  console.log('✅ Automatic verification status determination');
  console.log('✅ Detailed logging and error handling');
  console.log('✅ Easy integration with existing verification flow');
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Set up Google Vision API credentials (optional)');
  console.log('2. Set up AWS Rekognition credentials (optional)');
  console.log('3. Test with real image URLs');
  console.log('4. Adjust similarity thresholds as needed');
  console.log('5. Monitor performance and accuracy');
}

// Run the demo
if (require.main === module) {
  demonstrateImageComparison().catch(console.error);
}

module.exports = { demonstrateImageComparison }; 