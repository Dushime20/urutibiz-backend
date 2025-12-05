# Python CLIP Service Setup Guide

## Issue Resolution

The error "Python image service not available: Error" has been fixed with improved error handling and diagnostics.

## What Was Fixed

1. **Enhanced Error Logging**: Now shows detailed error information including:
   - Connection error type (ECONNREFUSED, ETIMEDOUT, etc.)
   - Service URL being accessed
   - Circuit breaker state
   - Helpful instructions on how to start the service

2. **Better Fallback Handling**: Embedding precomputation now gracefully falls back to TensorFlow.js/ONNX if Python service is unavailable

3. **Improved Diagnostics**: Error messages now include actionable steps to resolve issues

## Starting the Python Service

### Option 1: Using npm script (Recommended)
```bash
npm run python:service
```

### Option 2: Manual start
```bash
cd python-service
python main.py
```

### Option 3: Using uvicorn directly
```bash
cd python-service
uvicorn main:app --host 0.0.0.0 --port 8001
```

## Verifying Service is Running

### Check Health Endpoint
```bash
curl http://localhost:8001/health
```

Expected response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "device": "cpu"
}
```

### Check from Node.js Service
The Node.js service will automatically detect when the Python service becomes available and log:
```
✅ Python image service is available
   - URL: http://localhost:8001
   - Model loaded: true
   - Device: cpu
```

## Troubleshooting

### Error: "Connection refused" (ECONNREFUSED)
**Cause**: Python service is not running

**Solution**:
1. Start the Python service (see above)
2. Verify it's running: `curl http://localhost:8001/health`
3. Check the port is correct (default: 8001)

### Error: "Connection timeout" (ETIMEDOUT)
**Cause**: Python service is running but not responding

**Solution**:
1. Check Python service logs for errors
2. Verify the service URL in environment: `PYTHON_IMAGE_SERVICE_URL`
3. Check firewall/network settings

### Error: "Host not found" (ENOTFOUND)
**Cause**: Invalid service URL

**Solution**:
1. Check environment variable: `echo $PYTHON_IMAGE_SERVICE_URL`
2. Verify the URL format: `http://localhost:8001` or `http://hostname:port`
3. Ensure DNS resolution works for custom hostnames

### Circuit Breaker Open
**Cause**: Too many consecutive failures

**Solution**:
1. Fix the underlying issue (service not running, network problem, etc.)
2. Wait 30 seconds for automatic recovery
3. Or restart the Node.js service to reset circuit breaker

## Environment Configuration

### Default Configuration
- Service URL: `http://localhost:8001`
- Timeout: 30 seconds
- Health check interval: 60 seconds
- Circuit breaker threshold: 5 failures

### Custom Configuration
Set environment variable:
```bash
export PYTHON_IMAGE_SERVICE_URL=http://your-host:8001
```

Or in `.env` file:
```
PYTHON_IMAGE_SERVICE_URL=http://localhost:8001
```

## Service Status Monitoring

The Python service client provides status information:

```typescript
import pythonImageService from './services/pythonImageService';

const status = pythonImageService.getStatus();
console.log(status);
// {
//   available: true,
//   circuitBreakerState: 'closed',
//   failures: 0,
//   url: 'http://localhost:8001'
// }
```

## Fallback Behavior

If the Python service is unavailable:

1. **Image Search**: Falls back to TensorFlow.js MobileNet or ONNX Runtime
2. **Embedding Precomputation**: Falls back to TensorFlow.js/ONNX for each image
3. **Service Recovery**: Automatically reconnects when service becomes available

## Performance Notes

- **First Request**: May take longer as CLIP model loads (~2-5 seconds)
- **Subsequent Requests**: Fast inference (~100-500ms per image)
- **GPU Acceleration**: If CUDA is available, inference is 5-10x faster

## Next Steps

1. ✅ Start Python service: `npm run python:service`
2. ✅ Verify health: `curl http://localhost:8001/health`
3. ✅ Check Node.js logs for connection confirmation
4. ✅ Test image search endpoint

The system will automatically use the Python service when available, and gracefully fall back to alternative methods when it's not.

