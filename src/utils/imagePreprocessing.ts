import axios from 'axios';
import sharp from 'sharp';

/**
 * Download and preprocess image for AI analysis
 * @param url - Image URL to download
 * @param size - Target size (default 112x112 for most face models)
 * @returns Float32Array of normalized pixel values
 */
export async function downloadAndPreprocessImage(url: string, size = 112): Promise<Float32Array> {
  try {
    console.log(`📥 Downloading image from: ${url}`);
    
    // Download image
    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: 15000 
    });
    
    // Preprocess with Sharp
    const buffer = await sharp(response.data)
      .resize(size, size, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer();
    
    // Convert to Float32Array and normalize to [0,1]
    const floatArray = new Float32Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      floatArray[i] = buffer[i] / 255.0;
    }
    
    console.log(`✅ Image preprocessed: ${size}x${size}, ${floatArray.length} pixels`);
    return floatArray;
    
  } catch (error) {
    console.error(`❌ Image preprocessing failed for ${url}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Image preprocessing failed: ${errorMessage}`);
  }
}

/**
 * Validate image format and size
 */
export async function validateImage(url: string): Promise<{ valid: boolean; size: number; format: string }> {
  try {
    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: 10000 
    });
    
    const buffer = Buffer.from(response.data);
    const metadata = await sharp(buffer).metadata();
    
    return {
      valid: true,
      size: buffer.length,
      format: metadata.format || 'unknown'
    };
  } catch (error) {
    return {
      valid: false,
      size: 0,
      format: 'unknown'
    };
  }
} 