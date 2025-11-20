import * as faceapi from 'face-api.js';
import * as canvas from 'canvas';
import * as path from 'path';
import * as fs from 'fs';

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Resolve model path - works both in development and after compilation
const MODEL_PATH = path.resolve(
  __dirname.includes('dist') 
    ? path.join(__dirname, '../models/face-api')
    : path.join(__dirname, '../../models/face-api')
);

// Track if models are already loaded to avoid reloading
let modelsLoaded = false;

async function ensureModelsLoaded() {
  if (modelsLoaded) {
    console.log('[face-api] Models already loaded, skipping reload');
    return;
  }

  try {
    // Check if nets exist before trying to load
    if (!faceapi.nets || !faceapi.nets.ssdMobilenetv1) {
      throw new Error('face-api.js nets not properly initialized');
    }

    console.log('[face-api] Loading models from:', MODEL_PATH);
    
    // Check if model directory exists
    if (!fs.existsSync(MODEL_PATH)) {
      throw new Error(`Model directory not found: ${MODEL_PATH}`);
    }

    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
    console.log('[face-api] ssdMobilenetv1 loaded');
    
    // Use faceLandmark68Net (correct property name in face-api.js)
    if (!faceapi.nets.faceLandmark68Net) {
      throw new Error('faceLandmark68Net not available in face-api.js');
    }
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
    console.log('[face-api] faceLandmark68Net loaded');
    
    if (!faceapi.nets.faceRecognitionNet) {
      throw new Error('faceRecognitionNet not available in face-api.js');
    }
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);
    console.log('[face-api] faceRecognitionNet loaded');
    
    modelsLoaded = true;
    console.log('[face-api] All models loaded successfully');
  } catch (error: any) {
    console.error('[face-api] Error loading models:', error.message);
    console.error('[face-api] Available nets:', faceapi.nets ? Object.keys(faceapi.nets) : 'nets is undefined');
    throw new Error(`Failed to load face-api models: ${error.message}`);
  }
}

async function loadImageFromUrl(url: string): Promise<canvas.Image> {
  const axios = require('axios');
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const img = new Image();
  img.src = Buffer.from(response.data, 'binary');
  return img;
}

export async function compareFacesFaceApi(documentImageUrl: string, selfieImageUrl: string): Promise<{
  similarity: number;
  isMatch: boolean;
  distance: number;
}> {
  try {
    await ensureModelsLoaded();
    console.log('[face-api] Loading images:', documentImageUrl, selfieImageUrl);
    
    const [img1, img2] = await Promise.all([
      loadImageFromUrl(documentImageUrl),
      loadImageFromUrl(selfieImageUrl)
    ]);
    console.log('[face-api] Images loaded:', !!img1, !!img2);

    if (!img1 || !img2) {
      throw new Error('Failed to load one or both images');
    }

    const result1 = await faceapi.detectSingleFace(img1).withFaceLandmarks().withFaceDescriptor();
    const result2 = await faceapi.detectSingleFace(img2).withFaceLandmarks().withFaceDescriptor();
    console.log('[face-api] Face detection results:', {
      docFaceDetected: !!result1,
      selfieFaceDetected: !!result2
    });

    if (!result1 || !result2) {
      console.warn('[face-api] Face not detected in one or both images.');
      return { similarity: 0, isMatch: false, distance: 1 };
    }

    if (!result1.descriptor || !result2.descriptor) {
      console.warn('[face-api] Face descriptors not available.');
      return { similarity: 0, isMatch: false, distance: 1 };
    }

    const distance = faceapi.euclideanDistance(result1.descriptor, result2.descriptor);
    console.log('[face-api] Face descriptors distance:', distance);

    // Sanity check: distance should be in a reasonable range
    if (isNaN(distance) || distance < 0 || distance > 2) {
      console.warn('[face-api] Distance out of expected range:', distance);
      return { similarity: 0, isMatch: false, distance: 1 };
    }

    const isMatch = distance < 0.6;
    let similarity = 1 - distance;
    // Clamp similarity to [0, 1]
    similarity = Math.max(0, Math.min(1, similarity));
    console.log('[face-api] Similarity:', similarity, 'Is match:', isMatch);
    return { similarity, isMatch, distance };
  } catch (error: any) {
    console.error('[face-api] Error in compareFacesFaceApi:', error.message);
    console.error('[face-api] Stack:', error.stack);
    // Return a safe default instead of throwing
    return { similarity: 0, isMatch: false, distance: 1 };
  }
} 