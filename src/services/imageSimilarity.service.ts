/**
 * Image Similarity Service
 * Industry-standard implementation using CLIP model via Python service
 * Falls back to TensorFlow.js if Python service unavailable
 * 
 * Priority:
 * 1. Python CLIP service (industry standard, best accuracy)
 * 2. TensorFlow.js MobileNet (fallback)
 * 3. ONNX Runtime (fallback)
 */

import axios from 'axios';
import sharp from 'sharp';
import pythonImageService from './pythonImageService';
import { extractFeaturesFromUrl as extractEnhancedFeaturesFromUrl, extractFeaturesFromBuffer as extractEnhancedFeaturesFromBuffer } from './imageFeatureExtraction.service';
import { promises as fs } from 'fs';
import path from 'path';

// Lazy load TensorFlow.js to avoid startup errors
let tf: any = null;
let tfLoadError: Error | null = null;
const loadTensorFlow = async () => {
  if (tfLoadError) {
    return null;
  }
  
  if (!tf) {
    try {
      try {
        tf = await import('@tensorflow/tfjs-node');
        if (!tf || typeof tf.node !== 'object') {
          throw new Error('TensorFlow.js loaded but node module is invalid');
        }
        tf.tensor1d([1, 2, 3]).dispose(); // Test
        return tf;
      } catch (nodeError) {
        const tfjsModule = await import('@tensorflow/tfjs');
        const tfjs = tfjsModule.default || tfjsModule;
        
        if (typeof tfjs.setBackend === 'function') {
          await tfjs.setBackend('cpu');
          await tfjs.ready();
        }
        
        if (typeof tfjs.loadLayersModel !== 'function') {
          throw new Error('loadLayersModel not available');
        }
        
        tf = tfjs;
        return tf;
      }
    } catch (error) {
      tfLoadError = error instanceof Error ? error : new Error(String(error));
      return null;
    }
  }
  return tf;
};

// Cache for the MobileNet model
let mobilenetModel: any | null = null;

/**
 * Load AI model for feature extraction
 * Priority 1: @tensorflow-models/mobilenet package (already installed, works immediately)
 * Priority 2: ResNet from TensorFlow Hub (higher accuracy, 2048 dimensions)
 * Priority 3: MobileNet from TensorFlow Hub
 */
async function loadMobileNetModel(): Promise<any | null> {
  if (mobilenetModel) {
    console.log('✅ Using cached AI model');
    return mobilenetModel;
  }

  // Priority 1: Use @tensorflow-models/mobilenet package (already installed)
  console.log('🔄 Attempting to load MobileNet from @tensorflow-models/mobilenet package...');
  try {
    const mobilenet = await import('@tensorflow-models/mobilenet');
    if (mobilenet && mobilenet.load) {
      console.log('📦 Loading MobileNet from npm package (this may take a moment on first run)...');
      const mobilenetInstance = await mobilenet.load({
        version: 2,
        alpha: 1.0
      });
      
      // Store the mobilenet instance - we'll use it for feature extraction
      // The mobilenet package has an internal model we can access
      mobilenetModel = mobilenetInstance;
      
      console.log('✅ MobileNet loaded successfully from npm package');
      return mobilenetModel;
    }
  } catch (packageError) {
    const errorMsg = packageError instanceof Error ? packageError.message : String(packageError);
    console.warn(`⚠️ MobileNet package failed: ${errorMsg}`);
    console.log('🔄 Trying TensorFlow Hub models as fallback...');
  }

  // Priority 2 & 3: Try TensorFlow Hub URLs (ResNet first, then MobileNet)
  const tfModule = await loadTensorFlow();
  if (!tfModule || typeof tfModule.loadLayersModel !== 'function') {
    console.error('❌ TensorFlow.js not available for TensorFlow Hub models');
    return null;
  }
  
  console.log('✅ TensorFlow.js loaded, attempting to load from TensorFlow Hub...');

  // Try ResNet50 first (higher accuracy, 2048 dimensions - user suggested)
  const modelUrls = [
    'https://tfhub.dev/tensorflow/tfjs-model/google/imagenet/resnet_v2_50/feature_vector/5/default/1', // ResNet50 TF.js format
    'https://tfhub.dev/google/imagenet/resnet_v2_50/feature_vector/5', // ResNet50 original format (may not work)
    'https://tfhub.dev/tensorflow/tfjs-model/imagenet/mobilenet_v2_100_224/feature_vector/3/default/1' // MobileNet fallback
  ];
  
  for (const modelUrl of modelUrls) {
    try {
      console.log(`🌐 Attempting to load model from: ${modelUrl.substring(0, 70)}...`);
      const loadPromise = tfModule.loadLayersModel(modelUrl);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Model load timeout after 60 seconds')), 60000)
      );
      
      mobilenetModel = await Promise.race([loadPromise, timeoutPromise]);
      console.log(`✅ Model loaded successfully from TensorFlow Hub: ${modelUrl.substring(0, 70)}...`);
      return mobilenetModel;
    } catch (urlError) {
      const errorMsg = urlError instanceof Error ? urlError.message : String(urlError);
      console.warn(`⚠️ Failed to load from ${modelUrl.substring(0, 70)}...: ${errorMsg}`);
      continue;
    }
  }
  
  console.error('❌ All model loading methods failed');
  return null;
}

/**
 * Download image from URL and convert to buffer
 */
async function downloadImage(url: string): Promise<Buffer> {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 8000,
      maxContentLength: 10 * 1024 * 1024,
      validateStatus: (status) => status === 200,
    });
    return Buffer.from(response.data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('timeout')) {
      throw new Error(`Image download timeout: ${url}`);
    }
    throw new Error(`Failed to download image: ${errorMessage}`);
  }
}

/**
 * Preprocess image for MobileNet
 */
async function preprocessImageForMobileNet(imageBuffer: Buffer): Promise<any> {
  try {
    const tfModule = await loadTensorFlow();
    if (!tfModule) {
      throw new Error('TensorFlow.js not available');
    }

    const processedImage = await sharp(imageBuffer)
      .resize(224, 224, { 
        fit: 'cover',
        position: 'center'
      })
      .removeAlpha()
      .toFormat('jpeg')
      .toBuffer();

    let imageTensor: any;
    
    if (tfModule.node && typeof tfModule.node.decodeImage === 'function') {
      imageTensor = tfModule.node.decodeImage(processedImage, 3);
    } else {
      const decoded = await sharp(processedImage)
        .raw()
        .ensureAlpha(0) // 0 = no alpha channel, 1 = with alpha channel
        .toBuffer();
      
      const pixels = new Float32Array(224 * 224 * 3);
      for (let i = 0; i < decoded.length && i < pixels.length; i++) {
        pixels[i] = decoded[i];
      }
      
      imageTensor = tfModule.tensor3d(pixels, [224, 224, 3]);
    }
    
    const normalized = imageTensor.div(127.5).sub(1.0);
    const batched = normalized.expandDims(0);
    
    imageTensor.dispose();
    normalized.dispose();
    
    return batched;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Image preprocessing failed: ${errorMessage}`);
  }
}

function normalizeVector(features: number[]): number[] {
  const norm = Math.sqrt(features.reduce((sum, val) => sum + val * val, 0));
  if (norm === 0) return features;
  return features.map(v => v / norm);
}

/**
 * Extract image features using CLIP (Python service) or fallback methods
 */
async function extractImageFeatures(imageBuffer: Buffer): Promise<number[]> {
  // Priority 1: Try Python CLIP service (industry standard, best accuracy)
  if (pythonImageService.isServiceAvailable()) {
    try {
      console.log('🤖 Using Python CLIP service (industry standard)...');
      const features = await pythonImageService.extractFeaturesFromBuffer(imageBuffer);
      console.log(`✅ CLIP feature extraction successful: ${features.length} dimensions`);
      return features;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ Python CLIP service failed: ${errorMsg}`);
      console.log('🔄 Falling back to TensorFlow.js...');
    }
  } else {
    console.log('⚠️ Python CLIP service not available, using TensorFlow.js fallback...');
  }

  // Priority 2: Try TensorFlow.js MobileNet (fallback)
  console.log('🤖 Attempting to use TensorFlow.js MobileNet...');
  const model = await loadMobileNetModel();
  if (model) {
    try {
      console.log('✅ AI model loaded, extracting features...');
      
      // Get TensorFlow.js module
      const tfModule = await loadTensorFlow();
      if (!tfModule) {
        throw new Error('TensorFlow.js not available');
      }
      
      // Preprocess image (224x224, normalized for MobileNet/ResNet)
      const preprocessed = await preprocessImageForMobileNet(imageBuffer);
      
      // Extract features - handle different model types
      let features: any;
      
      // Check if this is the mobilenet package instance (has classify method)
      if (model.classify && typeof model.classify === 'function') {
        // This is @tensorflow-models/mobilenet package
        // We need to access the internal model to get features before classification
        const internalModel = (model as any).model;
        if (internalModel && internalModel.predict) {
          // Get the output from the layer before classification (feature layer)
          // MobileNet structure: conv -> global avg pool -> features -> classification
          const layers = internalModel.layers || [];
          if (layers.length > 0) {
            // Get the second-to-last layer (feature layer before classification)
            const featureLayerIndex = layers.length - 2;
            const featureLayer = layers[featureLayerIndex];
            if (featureLayer) {
              features = featureLayer.apply(preprocessed);
            } else {
              // Fallback: use the last layer
              features = internalModel.predict(preprocessed);
            }
          } else {
            // Fallback: use predict directly
            features = internalModel.predict(preprocessed);
          }
        } else {
          throw new Error('Cannot access MobileNet internal model');
        }
      } else if (model.predict) {
        // This is a TensorFlow.js model (ResNet or MobileNet from Hub)
        features = model.predict(preprocessed);
      } else {
        throw new Error('Model does not have predict or classify method');
      }
      
      const featuresArray = await features.array();
      
      // Clean up tensors
      preprocessed.dispose();
      features.dispose();
      
      // Flatten the output (handle both 1D and 2D arrays)
      let flattened: number[];
      if (Array.isArray(featuresArray[0])) {
        flattened = featuresArray[0] as number[];
      } else if (Array.isArray(featuresArray)) {
        flattened = featuresArray as number[];
      } else {
        flattened = [featuresArray as number];
      }
      
      // Normalize the feature vector
      const normalized = normalizeVector(flattened);
      console.log(`✅ AI feature extraction successful: ${normalized.length} dimensions`);
      
      // Log model type based on feature dimension
      if (normalized.length >= 2000) {
        console.log('   - Using ResNet50 (high accuracy, 2048 dimensions)');
      } else if (normalized.length >= 1000) {
        console.log('   - Using MobileNet v2 (good accuracy, ~1280 dimensions)');
      } else {
        console.log('   - Using MobileNet (lightweight, ~1000 dimensions)');
      }
      
      return normalized;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ AI model inference failed: ${errorMsg}`);
      console.log('🔄 Trying ONNX Runtime as fallback...');
    }
  } else {
    console.log('❌ AI model not available, trying ONNX Runtime...');
  }
  
  // Try ONNX Runtime
  try {
    const { extractImageFeatures: extractOnnxFeatures } = await import('./imageFeatureExtraction.service');
    console.log('🤖 Attempting to use ONNX Runtime...');
    const onnxFeatures = await extractOnnxFeatures(imageBuffer);
    if (onnxFeatures && onnxFeatures.length > 0 && onnxFeatures.some(v => v !== 0)) {
      console.log(`✅ ONNX feature extraction successful: ${onnxFeatures.length} dimensions`);
      return onnxFeatures;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ ONNX Runtime failed: ${errorMsg}`);
  }
  
  // NO FALLBACK - Both AI models failed
  const errorMessage = 
    '\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '❌ CRITICAL ERROR: No AI model available for image similarity search!\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    'TensorFlow.js MobileNet and ONNX Runtime both failed to load or infer.\n' +
    '\n' +
    'Sharp-based method is NOT accurate (extracts same features for all images).\n' +
    'This is why you get the same results for different images.\n' +
    '\n' +
    'SOLUTION - Fix AI model loading:\n' +
    '1. Check internet connection (MobileNet downloads from Google APIs)\n' +
    '2. Check firewall/proxy (needs access to storage.googleapis.com)\n' +
    '3. Verify @tensorflow/tfjs is installed: npm list @tensorflow/tfjs\n' +
    '4. Check server logs above for specific MobileNet/ONNX errors\n' +
    '5. Restart server after any changes\n' +
    '\n' +
    'Image search is DISABLED until an accurate AI model is available.\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  
  console.error(errorMessage);
  throw new Error('No AI model available. Check server logs for MobileNet/ONNX loading errors.');
}

/**
 * Extract features from image URL
 */
export async function extractFeaturesFromUrl(imageUrl: string): Promise<number[]> {
  const imageBuffer = await downloadImage(imageUrl);
  return await extractImageFeatures(imageBuffer);
}

/**
 * Extract features from image buffer
 */
export async function extractFeaturesFromBuffer(imageBuffer: Buffer): Promise<number[]> {
  return await extractImageFeatures(imageBuffer);
}

/**
 * Compare two images and return similarity score
 */
export async function compareImages(
  imageUrl1: string,
  imageUrl2: string
): Promise<{
  similarity: number;
  features1: number[];
  features2: number[];
}> {
  try {
    const [features1, features2] = await Promise.all([
      extractFeaturesFromUrl(imageUrl1),
      extractFeaturesFromUrl(imageUrl2)
    ]);
    
    const similarity = calculateCosineSimilarity(features1, features2);
    
    return {
      similarity,
      features1,
      features2
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Image comparison failed: ${errorMessage}`);
  }
}

/**
 * Calculate cosine similarity between two feature vectors
 */
function calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Feature vectors must have the same length');
  }
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }
  
  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (denominator === 0) return 0;
  
  const similarity = dotProduct / denominator;
  // Normalize to 0-1 range (cosine similarity is -1 to 1)
  return (similarity + 1) / 2;
}

/**
 * Find similar images from a list of image embeddings
 */
export function findSimilarImages(
  queryFeatures: number[],
  imageEmbeddings: Array<{ id: string; embedding: number[]; [key: string]: any }>,
  threshold: number = 0.3,
  limit: number = 1000
): Array<{ id: string; similarity: number; [key: string]: any }> {
  const results: Array<{ id: string; similarity: number; [key: string]: any }> = [];
  
  const queryNorm = Math.sqrt(queryFeatures.reduce((sum, val) => sum + val * val, 0));
  if (queryNorm === 0) {
    return [];
  }
  const normalizedQuery = queryFeatures.map(v => v / queryNorm);
  
  const queryDimension = queryFeatures.length;
  
  for (const image of imageEmbeddings) {
    if (!image.embedding || !Array.isArray(image.embedding)) continue;
    if (image.embedding.length !== queryDimension) continue;
    
    const similarity = calculateCosineSimilarity(normalizedQuery, image.embedding);
    
    if (similarity >= threshold) {
      results.push({
        ...image,
        similarity
      });
    }
  }
  
  results.sort((a, b) => b.similarity - a.similarity);
  
  return results.slice(0, limit);
}

/**
 * Preload the AI model (call this on server startup)
 */
export async function preloadModel(): Promise<boolean> {
  try {
    const model = await loadMobileNetModel();
    return model !== null;
  } catch (error) {
    console.error('Failed to preload model:', error);
    return false;
  }
}

// Export default instance
const imageSimilarityService = {
  extractFeaturesFromUrl,
  extractFeaturesFromBuffer,
  compareImages,
  findSimilarImages,
  preloadModel
};

export default imageSimilarityService;
