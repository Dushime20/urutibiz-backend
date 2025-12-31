# 🐍 Python Service Fix Guide

## Current Issue

- Duplicate PM2 processes (id 9 and 10)
- Service keeps crashing (30+ restarts)
- Not listening on port 8001
- Path confusion: service is at `~/urutibz/python-service` (not `~/urutibz/urutibiz-backend/python-service`)

## Quick Fix Commands

Run these commands in order:

```bash
# 1. Stop and delete ALL Python service processes
pm2 delete python-image-service 2>/dev/null || true
pm2 delete all --filter "python-image-service" 2>/dev/null || true
pm2 flush python-image-service 2>/dev/null || true

# 2. Navigate to correct directory
cd ~/urutibz/python-service

# 3. Check if dependencies are installed
pip3 list | grep -E "fastapi|uvicorn|torch|transformers" || {
    echo "Installing dependencies..."
    pip3 install -r requirements.txt
}

# 4. Test if script works
python3 -c "import main; print('✅ Import successful')" || {
    echo "❌ Import failed. Check errors above."
    exit 1
}

# 5. Start with uvicorn (RECOMMENDED method)
pm2 start "python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --workers 1" \
    --name python-image-service

# 6. Wait a few seconds for startup
sleep 5

# 7. Check status
pm2 status python-image-service

# 8. Check logs
pm2 logs python-image-service --lines 30 --nostream

# 9. Test health endpoint
curl http://localhost:8001/health

# 10. Save PM2 config
pm2 save
```

## Alternative: If uvicorn is not in PATH

```bash
cd ~/urutibz/python-service

# Start using python3 -m uvicorn
pm2 start "python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --workers 1" \
    --name python-image-service

pm2 save
```

## Check What's Wrong

### View Error Logs

```bash
# View PM2 logs
pm2 logs python-image-service --lines 50

# View error log specifically
pm2 logs python-image-service --err --lines 50

# Follow logs in real-time
pm2 logs python-image-service --lines 0
```

### Check if Dependencies are Missing

```bash
cd ~/urutibz/python-service

# Try importing main module
python3 -c "import main"

# Check specific imports
python3 -c "import fastapi; print('FastAPI:', fastapi.__version__)"
python3 -c "import uvicorn; print('Uvicorn:', uvicorn.__version__)"
python3 -c "import torch; print('PyTorch:', torch.__version__)"
python3 -c "import transformers; print('Transformers:', transformers.__version__)"
```

### Test Manual Start

```bash
cd ~/urutibz/python-service

# Start manually to see errors
python3 main.py
```

This will show you exactly what's wrong. Common issues:
- Missing dependencies
- Model download failing
- Port already in use
- Permission issues

## Expected Behavior

After successful start:

1. **PM2 Status:**
   ```
   │ 9  │ python-image-service │ online │ 0% │ 50mb │
   ```

2. **Health Check:**
   ```bash
   curl http://localhost:8001/health
   ```
   Response:
   ```json
   {
     "status": "healthy",
     "model_loaded": true,
     "device": "cpu"
   }
   ```

3. **Port Listening:**
   ```bash
   sudo netstat -tlnp | grep 8001
   ```
   Should show Python process listening on port 8001

## Troubleshooting

### Issue: "ModuleNotFoundError"

```bash
cd ~/urutibz/python-service
pip3 install -r requirements.txt
```

### Issue: "Port 8001 already in use"

```bash
# Find what's using port 8001
sudo lsof -i :8001

# Kill the process
sudo kill -9 <PID>
```

### Issue: "Model download fails"

The first run downloads ~605MB model. If it fails:
- Check internet connection
- Try again later (HuggingFace servers may be busy)
- Check disk space: `df -h`

### Issue: "Permission denied"

```bash
# Make sure you're in the right directory
cd ~/urutibz/python-service

# Check file permissions
ls -la main.py

# If needed, fix permissions
chmod +x main.py
```

## Complete Fix Script

Use the `fix-python-service.sh` script:

```bash
cd ~/urutibz
chmod +x fix-python-service.sh
./fix-python-service.sh
```

## Verify Service is Working

```bash
# 1. Check PM2
pm2 status python-image-service

# 2. Check port
sudo netstat -tlnp | grep 8001

# 3. Test health
curl http://localhost:8001/health

# 4. Check logs for errors
pm2 logs python-image-service --lines 20 --nostream | grep -i error
```

## Maintenance Commands

```bash
# Restart service
pm2 restart python-image-service

# Stop service
pm2 stop python-image-service

# Start service
pm2 start python-image-service

# View logs
pm2 logs python-image-service

# Monitor in real-time
pm2 monit
```

