# Real AI Implementation Guide for Document/Selfie Verification

## Overview

This guide explains how to implement **real AI-based face verification** for comparing document photos with selfies in your verification system.

## Current Status

✅ **Real AI Framework**: Code is ready to use real ONNX models  
✅ **Image Preprocessing**: Downloads and processes actual images  
✅ **Fallback System**: Works without AI models using basic analysis  
⚠️ **Missing Model**: Need to add a real ONNX face verification model  

## How It Works

### 1. **Image Processing Pipeline**
```
Document URL → Download → Resize (112x112) → Normalize → ONNX Tensor
Selfie URL   → Download → Resize (112x112) → Normalize → ONNX Tensor
```

### 2. **AI Analysis Flow**
```
ONNX Model → Input Tensors → Inference → Similarity Score → Verification Decision
```

### 3. **Fallback System**
```
No Model → Basic Image Analysis → Quality Assessment → Similarity Score
```

## Implementation Details

### **File Structure**
```
src/utils/
├── imagePreprocessing.ts    # Real image download & preprocessing
├── onnxProfileVerification.ts  # ONNX model inference
└── simpleImageAnalysis.ts  # Fallback analysis

models/
└── profile_verification.onnx  # Your ONNX model (to be added)
```

### **Key Functions**

#### **Image Preprocessing** (`imagePreprocessing.ts`)
```typescript
// Downloads and preprocesses images for AI
const docImage = await downloadAndPreprocessImage(docUrl, 112);
const selfieImage = await downloadAndPreprocessImage(selfieUrl, 112);
```

#### **ONNX Inference** (`onnxProfileVerification.ts`)
```typescript
// Runs real AI model inference
const session = await ort.InferenceSession.create(modelPath);
const output = await session.run(input);
const similarity = output['output']?.data[0];
```

#### **Fallback Analysis** (`simpleImageAnalysis.ts`)
```typescript
// Basic image analysis when no AI model available
const analysis = await runRealImageAnalysis(docUrl, selfieUrl);
```

## Getting a Real AI Model

### **Option 1: Download Pre-trained Model**

1. **Visit Model Repositories:**
   - [InsightFace Model Zoo](https://github.com/deepinsight/insightface/tree/master/model_zoo)
   - [ONNX Model Zoo](https://github.com/onnx/models)
   - [Hugging Face](https://huggingface.co/models?pipeline_tag=feature-extraction&search=face)

2. **Recommended Models:**
   - `arcface_r100_v1.onnx` (ArcFace)
   - `facenet.onnx` (FaceNet)
   - `sphereface.onnx` (SphereFace)

3. **Download and Setup:**
   ```bash
   # Download model
   wget https://example.com/arcface_r100_v1.onnx
   
   # Place in models directory
   mv arcface_r100_v1.onnx urutibiz-backend/models/profile_verification.onnx
   ```

### **Option 2: Train Custom Model**

1. **Collect Training Data:**
   - Document photos + corresponding selfies
   - Multiple images per person
   - Various lighting conditions

2. **Train Face Verification Model:**
   ```python
   # Example with PyTorch
   import torch
   import torch.nn as nn
   
   class FaceVerificationModel(nn.Module):
       def __init__(self):
           super().__init__()
           # Your model architecture
           
       def forward(self, doc_img, selfie_img):
           # Extract features and compare
           return similarity_score
   ```

3. **Export to ONNX:**
   ```python
   import torch.onnx
   
   model = FaceVerificationModel()
   torch.onnx.export(model, (doc_tensor, selfie_tensor), 
                    "profile_verification.onnx")
   ```

### **Option 3: Use Cloud AI Services**

```typescript
// Example with AWS Rekognition
import AWS from 'aws-sdk';

const rekognition = new AWS.Rekognition();

async function compareFaces(docUrl: string, selfieUrl: string) {
  const [docBuffer, selfieBuffer] = await Promise.all([
    downloadImage(docUrl),
    downloadImage(selfieUrl)
  ]);
  
  const params = {
    SourceImage: { Bytes: docBuffer },
    TargetImage: { Bytes: selfieBuffer }
  };
  
  const result = await rekognition.compareFaces(params).promise();
  return result.FaceMatches?.[0]?.Similarity || 0;
}
```

## Model Configuration

### **Input/Output Names**

Most face verification models use these input/output names:

```typescript
// Common input names
const input = {
  'input_1': docTensor,      // Document image
  'input_2': selfieTensor,   // Selfie image
  'input': docTensor,         // Alternative name
  'image': docTensor,         // Alternative name
};

// Common output names
const similarity = output['output']?.data[0] ||      // Most common
                   output['similarity']?.data[0] ||  // Alternative
                   output['score']?.data[0] ||       // Alternative
                   0.5;                              // Default
```

### **Input Shape**

Most models expect:
- **Size**: 112x112 or 160x160 pixels
- **Channels**: RGB (3 channels)
- **Format**: Float32, normalized [0,1]
- **Batch**: 1 (single image)

```typescript
// Example tensor shapes
const docTensor = new ort.Tensor('float32', docImage, [1, 112, 112, 3]);
const selfieTensor = new ort.Tensor('float32', selfieImage, [1, 112, 112, 3]);
```

## Testing Your Implementation

### **1. Test with Sample Images**
```bash
# Test the current implementation
npm run test:ai-models
```

### **2. Test Real Image Analysis**
```javascript
// Test with your actual image URLs
const docUrl = 'https://example.com/document.jpg';
const selfieUrl = 'https://example.com/selfie.jpg';

const score = await runProfileVerification(modelPath, docUrl, selfieUrl);
console.log(`Similarity: ${score}`);
```

### **3. Expected Results**

| Scenario | Expected Score | Verification Status |
|----------|----------------|-------------------|
| Same Person | 0.8 - 1.0 | ✅ Verified |
| Different Person | 0.1 - 0.4 | ❌ Pending |
| Poor Quality | 0.3 - 0.6 | ⚠️ Manual Review |

## Troubleshooting

### **Common Issues**

1. **"Model not found"**
   ```bash
   # Check if model exists
   ls -la urutibiz-backend/models/
   
   # Download model manually
   npm run download:ai-model
   ```

2. **"Input/Output name mismatch"**
   ```typescript
   // Use Netron to inspect your model
   // https://netron.app/
   // Upload your ONNX model and check input/output names
   ```

3. **"Image download failed"**
   ```typescript
   // Check image URL accessibility
   const response = await axios.get(imageUrl);
   console.log('Image accessible:', response.status === 200);
   ```

4. **"Low similarity scores"**
   - Ensure images are high quality
   - Check if faces are clearly visible
   - Verify model input requirements

### **Debug Commands**

```bash
# Check model status
npm run setup:ai-models

# Test image processing
node -e "
const { downloadAndPreprocessImage } = require('./dist/utils/imagePreprocessing');
downloadAndPreprocessImage('https://example.com/test.jpg').then(console.log);
"

# Test ONNX runtime
node -e "console.log(require('onnxruntime-node'))"
```

## Performance Optimization

### **1. Model Optimization**
```bash
# Optimize ONNX model for inference
pip install onnxruntime-tools
python -m onnxruntime.tools.optimize_cli profile_verification.onnx optimized_model.onnx
```

### **2. Batch Processing**
```typescript
// Process multiple verifications in batch
const batchResults = await Promise.all(
  verifications.map(v => runProfileVerification(modelPath, v.docUrl, v.selfieUrl))
);
```

### **3. Caching**
```typescript
// Cache processed images
const imageCache = new Map();
const cachedImage = imageCache.get(url) || await downloadAndPreprocessImage(url);
```

## Security Considerations

### **1. Model Validation**
- Verify model integrity (checksums)
- Validate model outputs
- Monitor for adversarial attacks

### **2. Image Security**
- Validate image URLs
- Check file types and sizes
- Sanitize all inputs

### **3. Privacy**
- Process images server-side only
- Don't store raw images
- Use secure image URLs

## Next Steps

1. **Get a Real Model**: Download or train a face verification model
2. **Test with Real Images**: Use actual document/selfie pairs
3. **Tune Thresholds**: Adjust verification thresholds based on your needs
4. **Monitor Performance**: Track accuracy and false positive rates
5. **Scale Up**: Optimize for production load

## Support

If you need help:
1. Check the troubleshooting section above
2. Verify your model input/output specifications
3. Test with known good/bad image pairs
4. Review the logs for detailed error messages

---

**The framework is ready! Just add your ONNX model and you'll have real AI-powered document/selfie verification.** 🚀 