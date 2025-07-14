import * as faceapi from 'face-api.js';
import * as canvas from 'canvas';
import * as path from 'path';
import * as fs from 'fs';

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const MODEL_PATH = path.join(__dirname, '../../models/face-api');

async function ensureModelsLoaded() {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
  console.log('[face-api] ssdMobilenetv1 loaded');
  await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
  console.log('[face-api] faceLandmark68Net loaded');
  await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);
  console.log('[face-api] faceRecognitionNet loaded');
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
  await ensureModelsLoaded();
  console.log('[face-api] Loading images:', documentImageUrl, selfieImageUrl);
  const [img1, img2] = await Promise.all([
    loadImageFromUrl(documentImageUrl),
    loadImageFromUrl(selfieImageUrl)
  ]);
  console.log('[face-api] Images loaded:', !!img1, !!img2);

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
  console.log('[face-api] Descriptor 1:', result1.descriptor);
  console.log('[face-api] Descriptor 2:', result2.descriptor);

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
} 