// kycAutomation.ts - OCR and liveness integration with Tesseract.js

import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import axios from 'axios';

interface OCRResult {
  name?: string;
  documentNumber?: string;
  dob?: string;
  address?: string;
  issueDate?: string;
  expiryDate?: string;
  extractedText: string;
  confidence: number;
  extractedFrom: string;
  processingTime: number;
}

export async function runOcrOnImage(imageUrl: string): Promise<OCRResult> {
  const startTime = Date.now();
  
  try {
    console.log(`🔍 Starting OCR processing for: ${imageUrl}`);
    
    // Download the image
    const response = await axios.get(imageUrl, { 
      responseType: 'arraybuffer',
      timeout: 30000 // 30 second timeout
    });
    
    if (!response.data) {
      throw new Error('Failed to download image');
    }

    // Preprocess the image for better OCR results
    const processedImageBuffer = await preprocessImageForOCR(Buffer.from(response.data));
    
    // Initialize Tesseract worker with optimized settings
    const worker = await createWorker('eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    // Configure Tesseract for fast document recognition
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,:-/',
      tessedit_pageseg_mode: '6' as any, // Uniform block of text (faster than SINGLE_BLOCK) - using string to avoid type error
      tessedit_ocr_engine_mode: '1', // Neural nets LSTM only (faster)
      preserve_interword_spaces: '1',
      tessedit_do_invert: '0', // Skip inversion (faster)
      tessedit_do_adaptive_threshold: '0' // Skip adaptive threshold (faster)
    });

    // Perform OCR
    const { data } = await worker.recognize(processedImageBuffer);
    await worker.terminate();

    const processingTime = Date.now() - startTime;
    console.log(`✅ OCR completed in ${processingTime}ms with confidence: ${data.confidence}%`);

    // Extract structured data from the raw text
    const structuredData = extractStructuredData(data.text);

    return {
      ...structuredData,
      extractedText: data.text,
      confidence: data.confidence,
      extractedFrom: imageUrl,
      processingTime
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ OCR processing failed:', errorMessage);
    
    // Return error result with low confidence
    return {
      extractedText: '',
      confidence: 0,
      extractedFrom: imageUrl,
      processingTime,
      error: errorMessage
    } as OCRResult;
  }
}

export async function runLivenessCheck(selfieUrl: string): Promise<number> {
  try {
    console.log(`🔍 Starting liveness check for: ${selfieUrl}`);
    
    // Download the selfie image
    const response = await axios.get(selfieUrl, { 
      responseType: 'arraybuffer',
      timeout: 30000
    });
    
    if (!response.data) {
      throw new Error('Failed to download selfie image');
    }

    // Basic image quality checks for liveness indicators
    const imageBuffer = Buffer.from(response.data);
    const livenessScore = await performBasicLivenessChecks(imageBuffer);
    
    console.log(`✅ Liveness check completed with score: ${livenessScore}`);
    return livenessScore;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Liveness check failed:', errorMessage);
    return 0; // Failed liveness check
  }
}

/**
 * Preprocess image for better OCR results
 */
async function preprocessImageForOCR(imageBuffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(imageBuffer)
      // Convert to grayscale for better text recognition
      .grayscale()
      // Resize to optimal size for OCR (not too large, not too small)
      .resize({ width: 800, height: 600, fit: 'inside', withoutEnlargement: true })
      // Convert to PNG for consistent processing
      .png({ quality: 80, compressionLevel: 6 }) // Reduced quality for speed
      .toBuffer();
  } catch (error) {
    console.warn('⚠️ Image preprocessing failed, using original:', error instanceof Error ? error.message : 'Unknown error');
    return imageBuffer;
  }
}

/**
 * Extract structured data from raw OCR text
 */
function extractStructuredData(text: string): Partial<OCRResult> {
  const normalizedText = text.toUpperCase().replace(/\s+/g, ' ').trim();
  const result: Partial<OCRResult> = {};

  // Common patterns for different document types
  const patterns = {
    // Name patterns (usually after "NAME" or at the beginning)
    name: [
      /NAME[:\s]+([A-Z\s]+?)(?:\n|DATE|DOB|ID|ADDRESS)/,
      /FULL NAME[:\s]+([A-Z\s]+?)(?:\n|DATE|DOB|ID|ADDRESS)/,
      /^([A-Z]+\s[A-Z]+(?:\s[A-Z]+)?)/m
    ],
    
    // Document number patterns
    documentNumber: [
      /(?:ID|IDENTITY|PASSPORT|LICENSE|CARD)(?:\s*(?:NO|NUMBER|#))?[:\s]+([A-Z0-9]+)/,
      /\b([A-Z]{1,3}\d{6,12})\b/,
      /\b(\d{8,12})\b/
    ],
    
    // Date of birth patterns
    dob: [
      /(?:DOB|DATE OF BIRTH|BORN)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
      /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})\b/
    ],
    
    // Address patterns
    address: [
      /(?:ADDRESS|ADDR)[:\s]+([A-Z0-9\s,\.]+?)(?:\n|ISSUE|EXPIRY|VALID)/,
    ],
    
    // Issue date patterns
    issueDate: [
      /(?:ISSUE|ISSUED)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
    ],
    
    // Expiry date patterns
    expiryDate: [
      /(?:EXPIRY|EXPIRES|VALID UNTIL)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
    ]
  };

  // Extract data using patterns
  for (const [field, fieldPatterns] of Object.entries(patterns)) {
    for (const pattern of fieldPatterns) {
      const match = normalizedText.match(pattern);
      if (match && match[1]) {
        (result as any)[field] = match[1].trim();
        break;
      }
    }
  }

  // Clean up extracted data
  if (result.name) {
    result.name = result.name.replace(/\s+/g, ' ').trim();
  }
  
  if (result.address) {
    result.address = result.address.replace(/\s+/g, ' ').trim();
  }

  // Validate and format dates
  if (result.dob) {
    result.dob = formatDate(result.dob);
  }
  if (result.issueDate) {
    result.issueDate = formatDate(result.issueDate);
  }
  if (result.expiryDate) {
    result.expiryDate = formatDate(result.expiryDate);
  }

  return result;
}

/**
 * Format date to consistent YYYY-MM-DD format
 */
function formatDate(dateStr: string): string {
  try {
    // Handle different date formats
    const cleaned = dateStr.replace(/[^\d\/\-\.]/g, '');
    const parts = cleaned.split(/[\/\-\.]/);
    
    if (parts.length === 3) {
      let [part1, part2, part3] = parts;
      
      // Determine if it's DD/MM/YYYY, MM/DD/YYYY, or YYYY/MM/DD
      if (part3.length === 4) {
        // DD/MM/YYYY or MM/DD/YYYY format
        const day = parseInt(part1) > 12 ? part1 : part2;
        const month = parseInt(part1) > 12 ? part2 : part1;
        return `${part3}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else if (part1.length === 4) {
        // YYYY/MM/DD format
        return `${part1}-${part2.padStart(2, '0')}-${part3.padStart(2, '0')}`;
      }
    }
    
    return dateStr; // Return original if can't parse
  } catch {
    return dateStr;
  }
}

/**
 * Perform basic liveness checks using image analysis
 * This is a simplified implementation - for production, use specialized liveness detection APIs
 */
async function performBasicLivenessChecks(imageBuffer: Buffer): Promise<number> {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
    let score = 0.5; // Base score
    
    // Check image quality indicators
    if (metadata.width && metadata.height) {
      // Good resolution check
      if (metadata.width >= 480 && metadata.height >= 640) {
        score += 0.1;
      }
      
      // Aspect ratio check (typical selfie proportions)
      const aspectRatio = metadata.width / metadata.height;
      if (aspectRatio >= 0.6 && aspectRatio <= 0.8) {
        score += 0.1;
      }
    }
    
    // Check for image sharpness by analyzing edges
    const { data, info } = await image
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Simple edge detection for blur assessment
    let edgeStrength = 0;
    const pixels = new Uint8Array(data);
    const width = info.width;
    const height = info.height;
    
    // Sample some pixels to check for edge strength (simplified Sobel operator)
    for (let y = 1; y < height - 1; y += 10) {
      for (let x = 1; x < width - 1; x += 10) {
        const idx = y * width + x;
        const gx = pixels[idx + 1] - pixels[idx - 1];
        const gy = pixels[idx + width] - pixels[idx - width];
        edgeStrength += Math.sqrt(gx * gx + gy * gy);
      }
    }
    
    // Normalize edge strength
    const avgEdgeStrength = edgeStrength / ((width / 10) * (height / 10));
    
    // Higher edge strength indicates less blur (better liveness indicator)
    if (avgEdgeStrength > 50) {
      score += 0.2;
    } else if (avgEdgeStrength > 25) {
      score += 0.1;
    }
    
    // Check file size (very small files might be low quality)
    if (imageBuffer.length > 50000) { // > 50KB
      score += 0.1;
    }
    
    // Ensure score is between 0 and 1
    return Math.min(Math.max(score, 0), 1);
    
  } catch (error) {
    console.warn('⚠️ Liveness check analysis failed:', error instanceof Error ? error.message : 'Unknown error');
    return 0.3; // Conservative score on failure
  }
}
