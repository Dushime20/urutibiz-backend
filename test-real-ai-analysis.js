#!/usr/bin/env node

/**
 * Test Real AI Image Analysis
 * 
 * This script tests the real image processing and AI analysis
 * by downloading and analyzing actual images.
 */

const { runProfileVerification, getDefaultModelPath } = require('./dist/utils/onnxProfileVerification');
const ort = require('onnxruntime-node');

// Test images (replace with your actual image URLs)
const TEST_IMAGES = {
  document: 'https://res.cloudinary.com/djsqiowhp/image/upload/v1752329170/user_verifications/ldq3aoam85efx42r8cio.jpg',
  selfie: 'https://res.cloudinary.com/djsqiowhp/image/upload/v1752329189/user_verifications/ild9ewc8rilh1yeexjmj.jpg'
};

async function testRealImageAnalysis() {
  console.log('🧪 Testing Real AI Image Analysis');
  console.log('==================================');
  
  try {
    // Create dummy tensors (for compatibility)
    const docTensor = new ort.Tensor('float32', new Float32Array(224 * 224 * 3), [1, 224, 224, 3]);
    const selfieTensor = new ort.Tensor('float32', new Float32Array(224 * 224 * 3), [1, 224, 224, 3]);
    
    console.log('📥 Testing with real image URLs...');
    console.log(`Document: ${TEST_IMAGES.document}`);
    console.log(`Selfie: ${TEST_IMAGES.selfie}`);
    
    // Test real image analysis
    const score = await runProfileVerification(getDefaultModelPath(), {
      doc_image: docTensor,
      selfie_image: selfieTensor,
      doc_url: TEST_IMAGES.document,
      selfie_url: TEST_IMAGES.selfie
    });
    
    console.log(`\n📊 Analysis Results:`);
    console.log(`Similarity Score: ${score.toFixed(3)}`);
    console.log(`Verification Status: ${score > 0.8 ? 'VERIFIED' : score > 0.3 ? 'FALLBACK_VERIFIED' : 'PENDING'}`);
    
    if (score > 0.8) {
      console.log('✅ High confidence match - likely same person');
    } else if (score > 0.5) {
      console.log('⚠️  Moderate confidence - possible match');
    } else {
      console.log('❌ Low confidence - likely different person');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
if (require.main === module) {
  testRealImageAnalysis().then(() => {
    console.log('\n✨ Test completed!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testRealImageAnalysis }; 