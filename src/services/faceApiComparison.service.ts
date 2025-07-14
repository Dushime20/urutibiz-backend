import * as faceapi from 'face-api.js';
import * as canvas from 'canvas';
import * as path from 'path';
import * as fs from 'fs';

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const MODEL_PATH = path.join(__dirname, '../../models/face-api');

async function ensureModelsLoaded() {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);
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
  const [img1, img2] = await Promise.all([
    loadImageFromUrl(documentImageUrl),
    loadImageFromUrl(selfieImageUrl)
  ]);
  const result1 = await faceapi.detectSingleFace(img1).withFaceLandmarks().withFaceDescriptor();
  const result2 = await faceapi.detectSingleFace(img2).withFaceLandmarks().withFaceDescriptor();
  if (!result1 || !result2) {
    return { similarity: 0, isMatch: false, distance: 1 };
  }
  const distance = faceapi.euclideanDistance(result1.descriptor, result2.descriptor);
  // Lower distance = more similar. Threshold 0.6 is typical for match.
  const isMatch = distance < 0.6;
  const similarity = 1 - distance; // similarity: 1 (identical) to 0 (completely different)
  return { similarity, isMatch, distance };
} 