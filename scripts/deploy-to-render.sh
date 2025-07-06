#!/bin/bash

# 🚀 UrutiBiz Backend - Render Deployment Script
# This script helps you deploy to Render with all necessary configurations

echo "🚀 UrutiBiz Backend - Render Deployment Helper"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Pre-deployment checks
echo ""
echo "🔍 Running pre-deployment checks..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found! Please run this script from the project root."
    exit 1
fi

print_status "Found package.json"

# Check if git repo is clean
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes. Consider committing them first."
    echo -n "Continue anyway? (y/N): "
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 1
    fi
fi

print_status "Git repository status checked"

# Test build process
echo ""
echo "🔨 Testing build process..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Build failed! Please fix build errors before deploying."
    exit 1
fi

print_status "Build successful"

# Check if dist folder was created
if [ ! -d "dist" ]; then
    print_error "dist folder not found after build!"
    exit 1
fi

print_status "Build artifacts found"

# Generate random JWT secret if not provided
generate_jwt_secret() {
    openssl rand -base64 64 | tr -d "=+/" | cut -c1-64
}

# Deployment information
echo ""
echo "📋 Deployment Information"
echo "========================"
echo ""
print_info "Repository: https://github.com/dkubwimana/urutibiz-backend"
print_info "Branch: main"
print_info "Build Command: npm install && npm run build"
print_info "Start Command: npm start"
print_info "Health Check: /health"
print_info "Node Version: 18+"
echo ""

# Environment variables template
echo "🔧 Required Environment Variables"
echo "=================================="
echo ""
echo "Copy these to your Render web service environment:"
echo ""
echo "# Core Configuration"
echo "NODE_ENV=production"
echo "PORT=10000"
echo "API_VERSION=v1"
echo ""
echo "# Database (get from your Render PostgreSQL service)"
echo "DATABASE_URL=postgresql://user:password@hostname:port/database"
echo ""
echo "# Security (generate a secure random string)"
echo "JWT_SECRET=$(generate_jwt_secret)"
echo "JWT_EXPIRES_IN=24h"
echo ""
echo "# CORS"
echo "CORS_ORIGIN=*"
echo "CORS_CREDENTIALS=true"
echo ""
echo "# File Uploads"
echo "UPLOAD_MAX_SIZE=10485760"
echo "UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,application/pdf"
echo ""
echo "# OCR (Optional)"
echo "TESSERACT_WORKER_AMOUNT=2"
echo ""
echo "# Demo Mode (Optional - for testing)"
echo "ENABLE_DEMO_MODE=true"
echo "DEMO_ADMIN_EMAIL=admin@urutibiz.com"
echo "DEMO_ADMIN_PASSWORD=demo123"
echo ""

# Step-by-step instructions
echo "📝 Step-by-Step Deployment Instructions"
echo "======================================="
echo ""
echo "1. Create Render Account:"
echo "   → Go to https://render.com"
echo "   → Sign up with GitHub"
echo ""
echo "2. Create PostgreSQL Database:"
echo "   → Dashboard → New + → PostgreSQL"
echo "   → Name: urutibiz-backend-db"
echo "   → Plan: Free"
echo "   → Click 'Create Database'"
echo "   → Copy the DATABASE_URL when ready"
echo ""
echo "3. Create Web Service:"
echo "   → Dashboard → New + → Web Service"
echo "   → Connect GitHub repo: urutibiz-backend"
echo "   → Name: urutibiz-backend"
echo "   → Environment: Node"
echo "   → Build Command: npm install && npm run build"
echo "   → Start Command: npm start"
echo "   → Add all environment variables from above"
echo "   → Click 'Create Web Service'"
echo ""
echo "4. After Deployment:"
echo "   → Wait for build to complete (5-10 minutes)"
echo "   → Go to web service → Shell tab"
echo "   → Run: npm run db:migrate"
echo "   → Run: npm run db:seed (optional)"
echo ""
echo "5. Test Your Deployment:"
echo "   → Visit: https://your-app-name.onrender.com/health"
echo "   → Should return: {\"status\":\"ok\",...}"
echo ""

print_status "Pre-deployment checks complete!"
print_info "Your app is ready for deployment to Render!"
echo ""
print_warning "Remember to:"
echo "  • Set your DATABASE_URL from Render PostgreSQL"
echo "  • Generate a secure JWT_SECRET"
echo "  • Run database migrations after deployment"
echo ""
print_info "Need help? Check RENDER_DEPLOY_GUIDE.md for detailed instructions."
