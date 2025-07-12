#!/usr/bin/env node

/**
 * AI Model Download Script
 * 
 * This script helps download a real ONNX face verification model
 * for document/selfie comparison.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const MODEL_URL = 'https://huggingface.co/onnx/models/resolve/main/arcface_resnet100.onnx';
const MODEL_PATH = path.join(__dirname, '../models/profile_verification.onnx');

function downloadModel(url, dest, cb) {
  const file = fs.createWriteStream(dest);
  https.get(url, (response) => {
    if (response.statusCode !== 200) {
      cb(new Error(`Failed to get '${url}' (${response.statusCode})`));
      return;
    }
    response.pipe(file);
    file.on('finish', () => {
      file.close(cb);
    });
  }).on('error', (err) => {
    fs.unlink(dest, () => cb(err));
  });
}

console.log('📥 Downloading ArcFace ONNX model for face verification...');
downloadModel(MODEL_URL, MODEL_PATH, (err) => {
  if (err) {
    console.error('❌ Failed to download model:', err.message);
    console.log('---');
    console.log('Manual fallback:');
    console.log('1. Download the model from:');
    console.log('   https://huggingface.co/onnx/models/resolve/main/arcface_resnet100.onnx');
    console.log('2. Rename it to: profile_verification.onnx');
    console.log('3. Place it in: urutibiz-backend/models/');
    process.exit(1);
  } else {
    console.log('✅ Model downloaded and saved to:', MODEL_PATH);
    process.exit(0);
  }
}); 