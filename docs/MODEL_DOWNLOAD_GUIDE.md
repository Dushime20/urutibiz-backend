# CLIP Model Download Guide

## Current Status

The CLIP model is downloading (605MB total). This is normal for the first run.

## Download Progress

- **Model Size**: 605MB
- **Location**: `~/.cache/huggingface/hub/`
- **First Download**: Takes 5-15 minutes depending on internet speed
- **Subsequent Runs**: Instant (uses cached model)

## What's Happening

The service is downloading the CLIP model from HuggingFace. The download includes:
- `pytorch_model.bin` (~605MB) - The main model weights
- `config.json` - Model configuration
- `tokenizer files` - Text processing files

## Improvements Made

### 1. Retry Logic
- Automatically retries up to 3 times if download fails
- Exponential backoff between retries
- Resume interrupted downloads

### 2. Better Logging
- Progress indicators
- Time estimates
- Clear error messages with troubleshooting steps

### 3. Fixed Deprecation Warning
- Replaced `@app.on_event("startup")` with modern `lifespan` context manager
- Follows FastAPI best practices

## If Download Fails

### Option 1: Wait and Retry
The service will automatically retry. Just wait for it to complete.

### Option 2: Manual Download
```bash
# Set HuggingFace cache directory
export HF_HOME=~/.cache/huggingface

# Download manually using Python
python -c "from transformers import CLIPModel; CLIPModel.from_pretrained('openai/clip-vit-base-patch32')"
```

### Option 3: Use Mirror/Proxy
If HuggingFace is slow in your region:
```bash
# Set HuggingFace mirror (if available)
export HF_ENDPOINT=https://hf-mirror.com
```

### Option 4: Pre-download Model
```bash
cd python-service
python -c "from transformers import CLIPModel, CLIPProcessor; CLIPModel.from_pretrained('openai/clip-vit-base-patch32'); CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32')"
```

## Speeding Up Downloads

1. **Use Faster Internet**: Download speed directly affects time
2. **Use VPN**: If HuggingFace is blocked/slow in your region
3. **Download During Off-Peak Hours**: HuggingFace servers may be less busy
4. **Use HuggingFace CLI**: `pip install huggingface-cli && huggingface-cli download openai/clip-vit-base-patch32`

## Verification

Once download completes, you'll see:
```
✅ CLIP model loaded successfully
   - Model: CLIP ViT-B/32
   - Embedding dimension: 512
   - Device: cpu
✅ Service ready to accept requests
```

Then test with:
```bash
curl http://localhost:8001/health
```

## Cache Location

The model is cached at:
- **Windows**: `C:\Users\<username>\.cache\huggingface\hub\`
- **Linux/Mac**: `~/.cache/huggingface/hub/`

You can check cache size:
```bash
# Windows PowerShell
Get-ChildItem $env:USERPROFILE\.cache\huggingface -Recurse | Measure-Object -Property Length -Sum

# Linux/Mac
du -sh ~/.cache/huggingface
```

## Next Steps

1. ✅ Wait for download to complete (currently in progress)
2. ✅ Service will automatically start once model is loaded
3. ✅ Test health endpoint: `curl http://localhost:8001/health`
4. ✅ Start Node.js server - it will connect automatically

The download is progressing normally. Just let it complete!

