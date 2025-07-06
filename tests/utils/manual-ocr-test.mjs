// Simple OCR test script to verify Tesseract.js integration
import { runOcrOnImage, runLivenessCheck } from './src/utils/kycAutomation.js';

async function manualOCRTest() {
  console.log('🧪 Manual OCR Test with Tesseract.js\n');
  
  console.log('Testing OCR with a placeholder image URL...');
  try {
    // Test with a simple text image URL
    const testImageUrl = 'https://via.placeholder.com/400x200/000000/FFFFFF?text=JOHN+DOE%0AID%3A+123456789%0ADOB%3A+01%2F01%2F1990';
    
    console.log(`📸 Processing image: ${testImageUrl}`);
    const ocrResult = await runOcrOnImage(testImageUrl);
    
    console.log('\n📋 OCR Results:');
    console.log('===============');
    console.log(`Name: ${ocrResult.name || 'Not detected'}`);
    console.log(`Document Number: ${ocrResult.documentNumber || 'Not detected'}`);
    console.log(`Date of Birth: ${ocrResult.dob || 'Not detected'}`);
    console.log(`Confidence: ${ocrResult.confidence}%`);
    console.log(`Processing Time: ${ocrResult.processingTime}ms`);
    console.log(`\nExtracted Text: "${ocrResult.extractedText}"`);
    
    if (ocrResult.error) {
      console.log(`❌ Error: ${ocrResult.error}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n🔍 Testing liveness check...');
  try {
    const testSelfieUrl = 'https://via.placeholder.com/300x400/0000FF/FFFFFF?text=SELFIE';
    console.log(`📸 Processing selfie: ${testSelfieUrl}`);
    
    const livenessScore = await runLivenessCheck(testSelfieUrl);
    console.log(`✅ Liveness Score: ${livenessScore}`);
    
  } catch (error) {
    console.error('❌ Liveness test failed:', error.message);
  }
  
  console.log('\n🏁 Manual OCR test complete!');
}

manualOCRTest();
