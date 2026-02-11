# syntax=docker/dockerfile:1.4
# =============================================================================
# UrutiBiz Backend - Production-Grade Multi-Stage Dockerfile
# =============================================================================
# Author: DevOps Team
# Version: 2.0.0
# Description: Enterprise-grade Node.js TypeScript application container
# Standards: Docker Best Practices, OWASP, CIS Benchmarks
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base Image with Security Hardening
# -----------------------------------------------------------------------------
FROM node:18.20.5-alpine3.20 AS base

# Build arguments for flexibility
ARG NODE_ENV=production
ARG APP_VERSION=1.0.0
ARG BUILD_DATE
ARG VCS_REF

# Metadata labels (OCI standard)
LABEL org.opencontainers.image.title="UrutiBiz Backend API" \
      org.opencontainers.image.description="Enterprise booking and service management platform" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.vendor="UrutiBiz Team" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.authors="devops@urutibiz.com" \
      maintainer="devops@urutibiz.com"

# Install security updates and essential tools
RUN apk update && \
    apk upgrade --no-cache && \
    apk add --no-cache \
        dumb-init \
        curl \
        ca-certificates \
        tzdata && \
    rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

# Set timezone to UTC (best practice for servers)
ENV TZ=UTC

# Create non-root user and group with specific UID/GID
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs -h /home/nodejs -s /bin/sh nodejs && \
    mkdir -p /home/nodejs && \
    chown -R nodejs:nodejs /home/nodejs

# Set working directory
WORKDIR /app

# Set proper ownership
RUN chown -R nodejs:nodejs /app

# -----------------------------------------------------------------------------
# Stage 2: Dependencies Installation
# -----------------------------------------------------------------------------
FROM base AS dependencies

# Copy package files with proper ownership
COPY --chown=nodejs:nodejs package*.json ./

# Install ALL dependencies (including dev) for building
# Use npm ci for reproducible builds
# --ignore-scripts prevents running potentially malicious scripts
# --prefer-offline uses cache when available
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --ignore-scripts --prefer-offline && \
    npm cache clean --force

# Verify package integrity
RUN npm audit --audit-level=high || true

# -----------------------------------------------------------------------------
# Stage 3: Build Stage
# -----------------------------------------------------------------------------
FROM dependencies AS builder

# Copy TypeScript configuration
COPY --chown=nodejs:nodejs tsconfig*.json ./

# Copy source code
COPY --chown=nodejs:nodejs src ./src

# Build the application
RUN npm run build

# Verify build output
RUN test -d dist && \
    test -f dist/server.js && \
    echo "Build verification: SUCCESS" || \
    (echo "Build verification: FAILED" && exit 1)

# Remove source maps in production for security
RUN find dist -name "*.map" -type f -delete

# -----------------------------------------------------------------------------
# Stage 4: Production Dependencies
# -----------------------------------------------------------------------------
FROM base AS prod-dependencies

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./

# Install ONLY production dependencies
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --only=production --ignore-scripts --prefer-offline && \
    npm cache clean --force && \
    rm -rf /root/.npm /tmp/*

# -----------------------------------------------------------------------------
# Stage 5: Production Image (Final)
# -----------------------------------------------------------------------------
FROM base AS production

# Build arguments
ARG NODE_ENV=production
ARG PORT=10000

# Environment variables
ENV NODE_ENV=${NODE_ENV} \
    PORT=${PORT} \
    NODE_OPTIONS="--max-old-space-size=2048 --max-http-header-size=16384" \
    NPM_CONFIG_LOGLEVEL=error \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    SUPPRESS_NO_CONFIG_WARNING=true \
    NO_UPDATE_NOTIFIER=true

# Copy production dependencies
COPY --from=prod-dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy necessary runtime files
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs healthcheck.js ./
COPY --chown=nodejs:nodejs database ./database

# Create necessary directories with proper permissions
RUN mkdir -p \
        logs \
        uploads \
        tmp \
        .npm-cache && \
    chown -R nodejs:nodejs \
        logs \
        uploads \
        tmp \
        .npm-cache && \
    chmod 755 logs uploads tmp && \
    chmod 700 .npm-cache

# Security: Remove unnecessary files
RUN find . -name "*.md" -type f -not -name "README.md" -delete && \
    find . -name "*.test.js" -type f -delete && \
    find . -name "*.spec.js" -type f -delete && \
    rm -rf \
        .git \
        .github \
        docs \
        test \
        tests \
        coverage \
        .vscode \
        .idea

# Switch to non-root user
USER nodejs

# Expose port (documentation only, doesn't actually publish)
EXPOSE ${PORT}

# Health check configuration
# Interval: Check every 30 seconds
# Timeout: Wait 10 seconds for response
# Start period: Wait 60 seconds before first check (app startup time)
# Retries: Mark unhealthy after 3 consecutive failures
HEALTHCHECK --interval=30s \
            --timeout=10s \
            --start-period=60s \
            --retries=3 \
            CMD node healthcheck.js || exit 1

# Add security labels
LABEL security.scan.date="${BUILD_DATE}" \
      security.non-root="true" \
      security.read-only-root="false"

# Use dumb-init as PID 1 for proper signal handling
# This ensures graceful shutdown and proper zombie process reaping
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/server.js"]

# -----------------------------------------------------------------------------
# Stage 6: Development Image (Optional)
# -----------------------------------------------------------------------------
FROM dependencies AS development

# Install development tools
RUN apk add --no-cache \
        git \
        bash \
        vim

# Copy source code
COPY --chown=nodejs:nodejs . .

# Set development environment
ENV NODE_ENV=development \
    LOG_LEVEL=debug

USER nodejs

EXPOSE 3000

CMD ["npm", "run", "dev"]

# -----------------------------------------------------------------------------
# Stage 7: Testing Image (Optional)
# -----------------------------------------------------------------------------
FROM dependencies AS testing

# Copy all files including tests
COPY --chown=nodejs:nodejs . .

# Run tests
RUN npm run test:ci

USER nodejs

CMD ["npm", "test"]
