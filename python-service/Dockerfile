# Python CLIP Image Service Dockerfile
# Industry-standard image search service using OpenAI CLIP model
#
# IMPORTANT: Build with BuildKit enabled for cache mounts to work:
#   DOCKER_BUILDKIT=1 docker build -t python-service .
#   Or set: export DOCKER_BUILDKIT=1 (Linux/Mac) or $env:DOCKER_BUILDKIT=1 (PowerShell)

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for image processing and health checks
# Note: libgl1-mesa-glx is replaced with libgl1 in newer Debian versions
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m -u 1000 pythonuser && \
    chown -R pythonuser:pythonuser /app

# Copy requirements files for better Docker layer caching
COPY requirements*.txt ./

# Copy pre-downloaded wheels if available (optional - speeds up builds significantly)
# Note: Build script ensures wheels/ directory exists (even if empty)
# The RUN command below will check if wheels exist and use them, or fall back to PyPI
COPY wheels/ /tmp/wheels/

# Install Python dependencies
# Using BuildKit cache mount to speed up pip installs
# Install pip upgrade first (small, changes infrequently)
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip

# Install base dependencies first (lightweight, change frequently)
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements-base.txt

# Install torch/torchvision from local wheels if available, otherwise from PyPI
# This significantly speeds up builds if wheels are pre-downloaded
RUN --mount=type=cache,target=/root/.cache/pip \
    WHEEL_COUNT=$(find /tmp/wheels -name "*.whl" 2>/dev/null | wc -l) && \
    if [ "$WHEEL_COUNT" -gt 0 ]; then \
        echo "📦 Installing torch from pre-downloaded wheels ($WHEEL_COUNT wheels found)..." && \
        pip install --no-index --find-links=/tmp/wheels -r requirements-torch.txt; \
    else \
        echo "📥 Installing torch from PyPI (this will take 10-20 minutes)..." && \
        pip install -r requirements-torch.txt; \
    fi

# Copy application code
COPY main.py .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV HF_HOME=/app/.cache/huggingface
ENV PORT=8001

# Create cache directory with proper permissions
RUN mkdir -p /app/.cache/huggingface && \
    chown -R pythonuser:pythonuser /app

# Switch to non-root user
USER pythonuser

# Expose port
EXPOSE 8001

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Run the service using uvicorn for production
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]
