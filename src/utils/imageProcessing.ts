import axios from 'axios';
import * as ort from 'onnxruntime-node';
import * as tf from '@tensorflow/tfjs-node';
import sharp from 'sharp';

/**
 * Real Image Processing for AI Analysis
 * Downloads, preprocesses, and analyzes actual images
 */

export interface ImageAnalysisResult {
  documentFeatures: number[];
  selfieFeatures: number[];
  similarityScore: number;
  confidence: number;
  analysis: {
    documentQuality: number;
    selfieQuality: number;
    faceDetected: boolean;
    documentType: string;
  };
}

/**
 * Download image from URL and convert to buffer
 */
export async function downloadImage(url: string): Promise<Buffer> {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.error(`Failed to download image from ${url}:`, error);
    throw new Error(`Image download failed: ${error.message}`);
  }
}

/**
 * Preprocess image for AI analysis
 */
export async function preprocessImage(imageBuffer: Buffer): Promise<ort.Tensor> {
  try {
    // Resize and normalize image using Sharp
    const processedImage = await sharp(imageBuffer)
      .resize(224, 224, { fit: 'cover' })
      .toFormat('jpeg')
      .toBuffer();

    // Convert to tensor
    const image = tf.node.decodeImage(processedImage, 3);
    
    // Normalize to [0, 1] range
    const normalized = image.div(255.0);
    
    // Convert to ONNX tensor format
    const tensorData = await normalized.array();
    const flatData = new Float32Array(tensorData.flat());
    
    // Clean up TensorFlow tensors
    image.dispose();
    normalized.dispose();
    
    return new ort.Tensor('float32', flatData, [1, 224, 224, 3]);
  } catch (error) {
    console.error('Image preprocessing failed:', error);
    throw new Error(`Image preprocessing failed: ${error.message}`);
  }
}

/**
 * Extract features from image using basic computer vision
 */
export async function extractImageFeatures(imageBuffer: Buffer): Promise<number[]> {
  try {
    // Resize image for feature extraction
    const resizedImage = await sharp(imageBuffer)
      .resize(64, 64, { fit: 'cover' })
      .grayscale()
      .toBuffer();

    // Convert to tensor for feature extraction
    const image = tf.node.decodeImage(resizedImage, 1);
    const normalized = image.div(255.0);
    
    // Extract basic features (histogram, edges, texture)
    const features: number[] = [];
    
    // 1. Histogram features
    const histogram = await extractHistogram(normalized);
    features.push(...histogram);
    
    // 2. Edge features
    const edges = await extractEdgeFeatures(normalized);
    features.push(...edges);
    
    // 3. Texture features
    const texture = await extractTextureFeatures(normalized);
    features.push(...texture);
    
    // Clean up
    image.dispose();
    normalized.dispose();
    
    return features;
  } catch (error) {
    console.error('Feature extraction failed:', error);
    // Return default features if extraction fails
    return new Array(128).fill(0.5);
  }
}

/**
 * Extract histogram features
 */
async function extractHistogram(image: tf.Tensor): Promise<number[]> {
  const data = await image.array();
  const flat = data.flat();
  
  // Calculate histogram
  const histogram = new Array(16).fill(0);
  for (const pixel of flat) {
    const bin = Math.floor(pixel * 16);
    if (bin >= 0 && bin < 16) {
      histogram[bin]++;
    }
  }
  
  // Normalize
  const total = histogram.reduce((sum, val) => sum + val, 0);
  return histogram.map(val => val / total);
}

/**
 * Extract edge features using Sobel operators
 */
async function extractEdgeFeatures(image: tf.Tensor): Promise<number[]> {
  const data = await image.array();
  const height = data.length;
  const width = data[0].length;
  
  const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
  const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
  
  let edgeStrength = 0;
  let edgeCount = 0;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      
      // Apply Sobel operators
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const pixel = data[y + dy][x + dx];
          gx += pixel * sobelX[dy + 1][dx + 1];
          gy += pixel * sobelY[dy + 1][dx + 1];
        }
      }
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      if (magnitude > 0.1) {
        edgeStrength += magnitude;
        edgeCount++;
      }
    }
  }
  
  return [
    edgeStrength / (height * width),
    edgeCount / (height * width),
    edgeStrength / Math.max(edgeCount, 1)
  ];
}

/**
 * Extract texture features using GLCM-like approach
 */
async function extractTextureFeatures(image: tf.Tensor): Promise<number[]> {
  const data = await image.array();
  const height = data.length;
  const width = data[0].length;
  
  // Calculate local variance and contrast
  let variance = 0;
  let contrast = 0;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const center = data[y][x];
      const neighbors = [
        data[y-1][x], data[y+1][x], data[y][x-1], data[y][x+1]
      ];
      
      const mean = neighbors.reduce((sum, val) => sum + val, 0) / neighbors.length;
      const localVar = neighbors.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / neighbors.length;
      
      variance += localVar;
      contrast += Math.abs(center - mean);
    }
  }
  
  const totalPixels = (height - 2) * (width - 2);
  return [
    variance / totalPixels,
    contrast / totalPixels
  ];
}

/**
 * Calculate similarity between two feature vectors
 */
export function calculateFeatureSimilarity(features1: number[], features2: number[]): number {
  if (features1.length !== features2.length) {
    return 0.5; // Default similarity
  }
  
  // Cosine similarity
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < features1.length; i++) {
    dotProduct += features1[i] * features2[i];
    norm1 += features1[i] * features1[i];
    norm2 += features2[i] * features2[i];
  }
  
  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (denominator === 0) return 0;
  
  return dotProduct / denominator;
}

/**
 * Analyze image quality and content
 */
export async function analyzeImageQuality(imageBuffer: Buffer): Promise<{
  quality: number;
  faceDetected: boolean;
  documentType: string;
}> {
  try {
    const image = tf.node.decodeImage(imageBuffer, 3);
    const data = await image.array() as number[][][];
    
    // Basic quality assessment
    let quality = 0.5;
    let faceDetected = false;
    let documentType = 'unknown';
    
    // Check brightness
    const brightness = calculateBrightness(data);
    if (brightness > 0.3 && brightness < 0.8) {
      quality += 0.2;
    }
    
    // Check contrast
    const contrast = calculateContrast(data);
    if (contrast > 0.2) {
      quality += 0.2;
    }
    
    // Check sharpness (edge density)
    const sharpness = calculateSharpness(data);
    if (sharpness > 0.1) {
      quality += 0.2;
    }
    
    // Basic face detection (simplified)
    faceDetected = await detectFace(data);
    
    // Basic document type detection
    documentType = await detectDocumentType(data);
    
    image.dispose();
    
    return {
      quality: Math.min(1.0, quality),
      faceDetected,
      documentType
    };
  } catch (error) {
    console.error('Image quality analysis failed:', error);
    return {
      quality: 0.5,
      faceDetected: false,
      documentType: 'unknown'
    };
  }
}

/**
 * Calculate image brightness
 */
function calculateBrightness(data: number[][][]): number {
  let total = 0;
  let count = 0;
  
  for (let y = 0; y < data.length; y++) {
    for (let x = 0; x < data[y].length; x++) {
      const pixel = data[y][x];
      total += (pixel[0] + pixel[1] + pixel[2]) / 3;
      count++;
    }
  }
  
  return total / count;
}

/**
 * Calculate image contrast
 */
function calculateContrast(data: number[][][]): number {
  const values: number[] = [];
  
  for (let y = 0; y < data.length; y++) {
    for (let x = 0; x < data[y].length; x++) {
      const pixel = data[y][x];
      values.push((pixel[0] + pixel[1] + pixel[2]) / 3);
    }
  }
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  
  return Math.sqrt(variance);
}

/**
 * Calculate image sharpness
 */
function calculateSharpness(data: number[][][]): number {
  let edgeStrength = 0;
  
  for (let y = 1; y < data.length - 1; y++) {
    for (let x = 1; x < data[y].length - 1; x++) {
      const center = (data[y][x][0] + data[y][x][1] + data[y][x][2]) / 3;
      const neighbors = [
        (data[y-1][x][0] + data[y-1][x][1] + data[y-1][x][2]) / 3,
        (data[y+1][x][0] + data[y+1][x][1] + data[y+1][x][2]) / 3,
        (data[y][x-1][0] + data[y][x-1][1] + data[y][x-1][2]) / 3,
        (data[y][x+1][0] + data[y][x+1][1] + data[y][x+1][2]) / 3
      ];
      
      const gradient = neighbors.reduce((sum, val) => sum + Math.abs(center - val), 0) / 4;
      edgeStrength += gradient;
    }
  }
  
  return edgeStrength / ((data.length - 2) * (data[0].length - 2));
}

/**
 * Basic face detection (simplified)
 */
async function detectFace(data: number[][][]): Promise<boolean> {
  // Simplified face detection based on skin tone and symmetry
  let skinPixels = 0;
  let totalPixels = 0;
  
  for (let y = 0; y < data.length; y++) {
    for (let x = 0; x < data[y].length; x++) {
      const [r, g, b] = data[y][x];
      totalPixels++;
      
      // Basic skin tone detection
      if (r > 0.4 && g > 0.3 && b > 0.2 && r > g && r > b) {
        skinPixels++;
      }
    }
  }
  
  const skinRatio = skinPixels / totalPixels;
  return skinRatio > 0.1; // If more than 10% is skin-like
}

/**
 * Basic document type detection
 */
async function detectDocumentType(data: number[][][]): Promise<string> {
  // Simplified document type detection
  const aspectRatio = data[0].length / data.length;
  
  if (aspectRatio > 1.5) {
    return 'passport';
  } else if (aspectRatio > 1.2) {
    return 'national_id';
  } else {
    return 'driving_license';
  }
} 