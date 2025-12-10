# Docker Build Optimization Guide

## Problem
Docker builds are slow because torch (~1.5GB) downloads during every build, taking 10-20+ minutes.

## Solution: Pre-download Torch Wheels

Pre-download torch wheels locally, then Docker will use them instead of downloading from PyPI.

## Quick Start

### Step 1: Pre-download torch wheels (one time, ~10-20 minutes)
```powershell
cd python-service
.\download-torch-wheels.ps1
```

This downloads torch and torchvision wheels to `./wheels/` directory (~2GB).

### Step 2: Build Docker image (now much faster!)
```powershell
# Option A: Use the build script (recommended)
.\build-docker.ps1

# Option B: Use docker-compose with BuildKit
$env:DOCKER_BUILDKIT=1
docker-compose -f ../docker-compose.prod.yml build python-service

# Option C: Direct docker build
$env:DOCKER_BUILDKIT=1
docker build -t python-service .
```

## Speed Comparison

| Method | First Build | Subsequent Builds |
|--------|-------------|-------------------|
| **Without pre-download** | ~40 minutes | ~40 minutes |
| **With pre-download** | ~5 minutes | ~2 minutes |
| **Code changes only** | ~1 minute | ~1 minute |

## How It Works

1. **Pre-download script** (`download-torch-wheels.ps1`):
   - Downloads Linux-compatible torch wheels to `./wheels/`
   - These wheels are for the Docker container (Linux), not Windows

2. **Dockerfile**:
   - Copies `./wheels/` into the image
   - Checks if wheels exist
   - If found: Installs from local wheels (fast!)
   - If not found: Downloads from PyPI (slow, but works)

3. **Build script** (`build-docker.ps1`):
   - Automatically detects if wheels exist
   - Creates empty wheels directory if needed
   - Enables BuildKit for cache mounts

## Requirements

- **BuildKit must be enabled** for cache mounts to work
- Python 3.11+ installed locally (for pre-download script)
- ~2GB free disk space for wheels directory

## Troubleshooting

### "wheels directory not found" error
- Run `.\download-torch-wheels.ps1` first
- Or create empty `wheels/` directory manually

### Build still slow
- Make sure BuildKit is enabled: `$env:DOCKER_BUILDKIT=1`
- Check that wheels were downloaded: `ls wheels/`
- Verify wheels are Linux-compatible (manylinux)

### Wheels download fails
- Check internet connection
- Try again (downloads can be interrupted)
- Wheels are large (~2GB), be patient

## Files Created

- `wheels/` - Directory containing pre-downloaded torch wheels
- `requirements-base.txt` - Lightweight packages (fast install)
- `requirements-torch.txt` - Heavy packages (torch, torchvision)
- `download-torch-wheels.ps1` - Script to pre-download wheels
- `build-docker.ps1` - Optimized build script

## Notes

- Wheels are Linux-specific (for Docker container)
- Wheels can be committed to git (if you want) or added to .gitignore
- After first build with wheels, subsequent builds are very fast
- If you update torch version, re-run download script

