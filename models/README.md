# AI Models for User Verification

This directory contains AI models used for user verification and KYC processes.

## Required Models

### 1. Profile Verification Model
- **File**: `profile_verification.onnx`
- **Purpose**: Compares document photo with selfie for identity verification
- **Input**: Two image tensors (document photo and selfie)
- **Output**: Similarity score (0-1)

## Setup Instructions

### Option 1: Download Pre-trained Model
1. Download a pre-trained profile verification ONNX model
2. Place it in this directory as `profile_verification.onnx`
3. Restart the application

### Option 2: Use Fallback Mode
If no model is available, the system will use a fallback similarity scoring algorithm.

### Option 3: Train Custom Model
1. Collect training data (document photos + selfies)
2. Train a model using ONNX format
3. Export as `profile_verification.onnx`
4. Place in this directory

## Model Specifications

### Input Format
- Document image: `[1, 224, 224, 3]` (RGB, normalized)
- Selfie image: `[1, 224, 224, 3]` (RGB, normalized)

### Output Format
- Single float value (0-1) representing similarity score
- Higher values indicate more similar faces

## Testing

You can test the model setup by running:
```bash
npm run test:ai-models
```

## Troubleshooting

### Model Not Found
If you see "Load model models/profile_verification.onnx failed", the system will automatically use fallback scoring.

### Performance Issues
- Ensure the model file is optimized for inference
- Consider using a smaller model for faster processing
- Monitor memory usage during inference

## Security Notes

- Models should be validated before deployment
- Consider model poisoning attacks
- Regularly update models with new training data
- Monitor for adversarial attacks 