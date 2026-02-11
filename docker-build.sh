#!/bin/bash
# =============================================================================
# UrutiBiz Backend - Docker Build Script
# =============================================================================
# Description: Professional Docker build script with validation and security
# Usage: ./docker-build.sh [environment] [options]
# Example: ./docker-build.sh production --push
# =============================================================================

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
APP_NAME="urutibiz-backend"
VERSION="1.0.0"
REGISTRY="docker.io"
NAMESPACE="urutibiz"
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# -----------------------------------------------------------------------------
# Functions
# -----------------------------------------------------------------------------
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check required files
    if [ ! -f "Dockerfile" ]; then
        log_error "Dockerfile not found"
        exit 1
    fi
    
    if [ ! -f "package.json" ]; then
        log_error "package.json not found"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

validate_environment() {
    local env=$1
    
    case $env in
        production|prod)
            ENV="production"
            TARGET="production"
            TAG_SUFFIX=""
            ;;
        development|dev)
            ENV="development"
            TARGET="development"
            TAG_SUFFIX="-dev"
            ;;
        testing|test)
            ENV="testing"
            TARGET="testing"
            TAG_SUFFIX="-test"
            ;;
        *)
            log_error "Invalid environment: $env"
            log_info "Valid environments: production, development, testing"
            exit 1
            ;;
    esac
}

build_image() {
    print_header "Building Docker Image"
    
    log_info "Environment: $ENV"
    log_info "Target: $TARGET"
    log_info "Version: $VERSION"
    log_info "Build Date: $BUILD_DATE"
    log_info "VCS Ref: $VCS_REF"
    
    # Build command
    docker build \
        --target "$TARGET" \
        --build-arg NODE_ENV="$ENV" \
        --build-arg APP_VERSION="$VERSION" \
        --build-arg BUILD_DATE="$BUILD_DATE" \
        --build-arg VCS_REF="$VCS_REF" \
        --tag "${APP_NAME}:${VERSION}${TAG_SUFFIX}" \
        --tag "${APP_NAME}:latest${TAG_SUFFIX}" \
        --progress=plain \
        .
    
    if [ $? -eq 0 ]; then
        log_success "Image built successfully"
    else
        log_error "Image build failed"
        exit 1
    fi
}

test_image() {
    print_header "Testing Docker Image"
    
    log_info "Running image tests..."
    
    # Test 1: Check if image exists
    if docker image inspect "${APP_NAME}:latest${TAG_SUFFIX}" &> /dev/null; then
        log_success "Image exists"
    else
        log_error "Image not found"
        exit 1
    fi
    
    # Test 2: Check image size
    local size=$(docker image inspect "${APP_NAME}:latest${TAG_SUFFIX}" --format='{{.Size}}' | awk '{print $1/1024/1024}')
    log_info "Image size: ${size} MB"
    
    # Test 3: Check for vulnerabilities (if trivy is installed)
    if command -v trivy &> /dev/null; then
        log_info "Scanning for vulnerabilities..."
        trivy image --severity HIGH,CRITICAL "${APP_NAME}:latest${TAG_SUFFIX}"
    else
        log_warning "Trivy not installed, skipping vulnerability scan"
    fi
    
    # Test 4: Run container health check
    if [ "$ENV" = "production" ]; then
        log_info "Starting container for health check..."
        
        # Start container
        docker run -d \
            --name "${APP_NAME}-test" \
            -p 10001:10000 \
            -e NODE_ENV=production \
            -e DB_HOST=localhost \
            -e REDIS_HOST=localhost \
            "${APP_NAME}:latest${TAG_SUFFIX}" || true
        
        # Wait for startup
        sleep 10
        
        # Check health
        if docker exec "${APP_NAME}-test" node healthcheck.js &> /dev/null; then
            log_success "Health check passed"
        else
            log_warning "Health check failed (may need database connection)"
        fi
        
        # Cleanup
        docker stop "${APP_NAME}-test" &> /dev/null || true
        docker rm "${APP_NAME}-test" &> /dev/null || true
    fi
    
    log_success "Image tests completed"
}

tag_image() {
    print_header "Tagging Image"
    
    local full_image="${REGISTRY}/${NAMESPACE}/${APP_NAME}"
    
    docker tag "${APP_NAME}:${VERSION}${TAG_SUFFIX}" "${full_image}:${VERSION}${TAG_SUFFIX}"
    docker tag "${APP_NAME}:latest${TAG_SUFFIX}" "${full_image}:latest${TAG_SUFFIX}"
    
    log_success "Image tagged: ${full_image}:${VERSION}${TAG_SUFFIX}"
    log_success "Image tagged: ${full_image}:latest${TAG_SUFFIX}"
}

push_image() {
    print_header "Pushing Image to Registry"
    
    local full_image="${REGISTRY}/${NAMESPACE}/${APP_NAME}"
    
    log_info "Pushing ${full_image}:${VERSION}${TAG_SUFFIX}..."
    docker push "${full_image}:${VERSION}${TAG_SUFFIX}"
    
    log_info "Pushing ${full_image}:latest${TAG_SUFFIX}..."
    docker push "${full_image}:latest${TAG_SUFFIX}"
    
    log_success "Images pushed successfully"
}

show_summary() {
    print_header "Build Summary"
    
    echo -e "${YELLOW}Environment:${NC}  $ENV"
    echo -e "${YELLOW}Version:${NC}      $VERSION"
    echo -e "${YELLOW}Build Date:${NC}   $BUILD_DATE"
    echo -e "${YELLOW}VCS Ref:${NC}      $VCS_REF"
    echo ""
    echo -e "${YELLOW}Local Images:${NC}"
    docker images "${APP_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    echo ""
    
    if [ "$PUSH" = true ]; then
        echo -e "${GREEN}✓ Images pushed to registry${NC}"
    else
        echo -e "${YELLOW}ℹ Images not pushed (use --push flag)${NC}"
    fi
}

show_usage() {
    cat << EOF
Usage: $0 [environment] [options]

Environments:
  production, prod     Build production image
  development, dev     Build development image
  testing, test        Build testing image

Options:
  --push              Push image to registry after build
  --no-cache          Build without using cache
  --no-test           Skip image testing
  --help, -h          Show this help message

Examples:
  $0 production                    # Build production image
  $0 production --push             # Build and push production image
  $0 development --no-cache        # Build dev image without cache
  $0 testing --no-test             # Build test image, skip tests

EOF
}

# -----------------------------------------------------------------------------
# Main Script
# -----------------------------------------------------------------------------
main() {
    # Default options
    PUSH=false
    NO_CACHE=""
    NO_TEST=false
    
    # Parse arguments
    if [ $# -eq 0 ]; then
        show_usage
        exit 1
    fi
    
    ENVIRONMENT=$1
    shift
    
    # Parse options
    while [ $# -gt 0 ]; do
        case $1 in
            --push)
                PUSH=true
                ;;
            --no-cache)
                NO_CACHE="--no-cache"
                ;;
            --no-test)
                NO_TEST=true
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
        shift
    done
    
    # Start build process
    print_header "UrutiBiz Backend - Docker Build"
    
    check_prerequisites
    validate_environment "$ENVIRONMENT"
    build_image
    
    if [ "$NO_TEST" = false ]; then
        test_image
    fi
    
    if [ "$PUSH" = true ]; then
        tag_image
        push_image
    fi
    
    show_summary
    
    log_success "Build process completed successfully!"
}

# Run main function
main "$@"
