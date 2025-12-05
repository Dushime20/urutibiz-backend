"""
Image Feature Extraction Service using CLIP
Industry-standard approach used by major e-commerce platforms
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from transformers import CLIPModel, CLIPProcessor
from PIL import Image
import torch
import io
import numpy as np
import logging
import os
import time
from typing import List

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global model variables
model = None
processor = None
device = None

def load_model_with_retry(max_retries=3, retry_delay=5):
    """Load CLIP model with retry logic for network issues"""
    global model, processor, device
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"Using device: {device}")
    
    model_name = "openai/clip-vit-base-patch32"
    cache_dir = os.getenv("HF_HOME", os.path.expanduser("~/.cache/huggingface"))
    
    logger.info("🔄 Loading CLIP model...")
    logger.info(f"   - Model: {model_name}")
    logger.info(f"   - Cache directory: {cache_dir}")
    logger.info(f"   - First download: ~605MB (this may take several minutes)")
    logger.info(f"   - Subsequent runs: Uses cached model (instant)")
    
    for attempt in range(max_retries):
        try:
            if attempt > 0:
                logger.info(f"   ⏳ Retry attempt {attempt + 1}/{max_retries} after {retry_delay}s delay...")
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            
            # Configure download settings for better reliability
            download_kwargs = {
                "resume_download": True,  # Resume interrupted downloads
                "local_files_only": False,
            }
            
            logger.info("   📥 Downloading model files (this may take a while on first run)...")
            start_time = time.time()
            
            model = CLIPModel.from_pretrained(
                model_name,
                **download_kwargs
            )
            processor = CLIPProcessor.from_pretrained(
                model_name,
                **download_kwargs
            )
            
            download_time = time.time() - start_time
            logger.info(f"   ✅ Model files downloaded in {download_time:.1f}s")
            
            # Move model to device
            logger.info(f"   🔄 Moving model to {device}...")
            model = model.to(device)
            model.eval()
            
            logger.info("✅ CLIP model loaded successfully")
            logger.info(f"   - Model: CLIP ViT-B/32")
            logger.info(f"   - Embedding dimension: 512")
            logger.info(f"   - Device: {device}")
            logger.info(f"   - Total load time: {time.time() - start_time:.1f}s")
            return True
            
        except Exception as e:
            error_msg = str(e)
            logger.warn(f"   ⚠️ Attempt {attempt + 1} failed: {error_msg}")
            
            if "timeout" in error_msg.lower() or "connection" in error_msg.lower():
                if attempt < max_retries - 1:
                    logger.info(f"   💡 Network issue detected. Will retry...")
                    continue
                else:
                    logger.error("❌ Failed to download model after multiple attempts")
                    logger.error("   💡 Troubleshooting:")
                    logger.error("      1. Check your internet connection")
                    logger.error("      2. Try again later (HuggingFace servers may be busy)")
                    logger.error("      3. Use a VPN if HuggingFace is blocked in your region")
                    logger.error("      4. Manually download: https://huggingface.co/openai/clip-vit-base-patch32")
                    raise
            else:
                # Non-network error, don't retry
                logger.error(f"❌ Failed to load CLIP model: {e}")
                raise
    
    return False

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events"""
    # Startup
    logger.info("=" * 70)
    logger.info("🚀 Starting Python Image Feature Extraction Service")
    logger.info("=" * 70)
    
    try:
        load_model_with_retry()
        logger.info("✅ Service ready to accept requests")
        logger.info("=" * 70)
    except Exception as e:
        logger.error("=" * 70)
        logger.error("❌ Service failed to start")
        logger.error(f"   Error: {e}")
        logger.error("=" * 70)
        raise
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down service...")

app = FastAPI(
    title="Image Feature Extraction Service",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    if model is None or processor is None:
        return {
            "status": "unhealthy",
            "model_loaded": False,
            "device": device,
            "message": "Model not loaded"
        }
    
    return {
        "status": "healthy",
        "model_loaded": True,
        "device": device,
        "model_name": "CLIP ViT-B/32",
        "embedding_dimension": 512
    }

@app.post("/extract-features")
async def extract_features(file: UploadFile = File(...)):
    """
    Extract feature vector from image using CLIP
    Returns: JSON with embedding vector (512 dimensions)
    """
    if model is None or processor is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Read image file
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert RGBA to RGB if needed
        if image.mode == 'RGBA':
            image = image.convert('RGB')
        
        # Preprocess image for CLIP
        inputs = processor(images=image, return_tensors="pt")
        inputs = {k: v.to(device) for k, v in inputs.items()}
        
        # Extract features
        with torch.no_grad():
            image_features = model.get_image_features(**inputs)
            # Normalize features
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            embedding = image_features.cpu().numpy()[0]
        
        logger.info(f"✅ Extracted features: {len(embedding)} dimensions")
        
        return {
            "success": True,
            "embedding": embedding.tolist(),
            "dimension": len(embedding)
        }
        
    except Exception as e:
        logger.error(f"❌ Feature extraction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Feature extraction failed: {str(e)}")

@app.post("/extract-features-batch")
async def extract_features_batch(files: List[UploadFile] = File(...)):
    """
    Extract features from multiple images (batch processing)
    """
    if model is None or processor is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    results = []
    
    for file in files:
        try:
            image_bytes = await file.read()
            image = Image.open(io.BytesIO(image_bytes))
            
            if image.mode == 'RGBA':
                image = image.convert('RGB')
            
            inputs = processor(images=image, return_tensors="pt")
            inputs = {k: v.to(device) for k, v in inputs.items()}
            
            with torch.no_grad():
                image_features = model.get_image_features(**inputs)
                image_features = image_features / image_features.norm(dim=-1, keepdim=True)
                embedding = image_features.cpu().numpy()[0]
            
            results.append({
                "filename": file.filename,
                "success": True,
                "embedding": embedding.tolist(),
                "dimension": len(embedding)
            })
            
        except Exception as e:
            logger.error(f"❌ Failed to process {file.filename}: {e}")
            results.append({
                "filename": file.filename,
                "success": False,
                "error": str(e)
            })
    
    return {
        "success": True,
        "results": results
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

