#!/bin/bash

# UrutiBiz Deployment Update Script
# This script updates both backend and frontend when code changes are made

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/urutibz"
BACKEND_DIR="$PROJECT_DIR/urutibiz-backend"
FRONTEND_DIR="$PROJECT_DIR/urutibz-frontend"
WEB_DIR="/var/www/urutibz-frontend"
BACKEND_NAME="urutibiz-backend"

echo -e "${GREEN}🔄 Starting UrutiBiz Update Process...${NC}\n"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
if ! command_exists git; then
    echo -e "${RED}❌ Git is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command_exists pm2; then
    echo -e "${RED}❌ PM2 is not installed. Please install it first.${NC}"
    exit 1
fi

# Update Backend
echo -e "${YELLOW}📦 Updating Backend...${NC}"
cd "$BACKEND_DIR" || exit 1

# Pull latest changes
echo "  → Pulling latest changes from Git..."
if git pull origin main; then
    echo -e "  ${GREEN}✅ Git pull successful${NC}"
else
    echo -e "  ${YELLOW}⚠️  Git pull had issues (continuing anyway)${NC}"
fi

# Install dependencies
echo "  → Installing dependencies..."
if npm ci; then
    echo -e "  ${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "  ${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Run database migrations
echo "  → Running database migrations..."
if npm run db:migrate; then
    echo -e "  ${GREEN}✅ Migrations completed${NC}"
else
    echo -e "  ${YELLOW}⚠️  Migration had issues (check manually)${NC}"
fi

# Build backend
echo "  → Building backend application..."
if npm run build; then
    echo -e "  ${GREEN}✅ Backend build successful${NC}"
else
    echo -e "  ${RED}❌ Backend build failed${NC}"
    exit 1
fi

# Restart backend with PM2
echo "  → Restarting backend service..."
if pm2 restart "$BACKEND_NAME"; then
    echo -e "  ${GREEN}✅ Backend restarted successfully${NC}"
else
    echo -e "  ${YELLOW}⚠️  PM2 restart had issues, trying to start...${NC}"
    pm2 start dist/server.js --name "$BACKEND_NAME" || true
fi

# Wait a moment for backend to start
sleep 2

# Check backend health
echo "  → Checking backend health..."
if curl -f http://localhost:10000/health >/dev/null 2>&1; then
    echo -e "  ${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "  ${YELLOW}⚠️  Backend health check failed (check logs)${NC}"
fi

echo ""

# Update Frontend
echo -e "${YELLOW}🎨 Updating Frontend...${NC}"
cd "$FRONTEND_DIR" || exit 1

# Pull latest changes
echo "  → Pulling latest changes from Git..."
if git pull origin main; then
    echo -e "  ${GREEN}✅ Git pull successful${NC}"
else
    echo -e "  ${YELLOW}⚠️  Git pull had issues (continuing anyway)${NC}"
fi

# Install dependencies
echo "  → Installing dependencies..."
if npm ci; then
    echo -e "  ${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "  ${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Build frontend
echo "  → Building frontend application..."
if npm run build; then
    echo -e "  ${GREEN}✅ Frontend build successful${NC}"
else
    echo -e "  ${RED}❌ Frontend build failed${NC}"
    exit 1
fi

# Copy to web directory
echo "  → Deploying frontend files..."
if sudo cp -r dist/* "$WEB_DIR/"; then
    echo -e "  ${GREEN}✅ Files copied successfully${NC}"
else
    echo -e "  ${RED}❌ Failed to copy files${NC}"
    exit 1
fi

# Set permissions
echo "  → Setting file permissions..."
if sudo chown -R www-data:www-data "$WEB_DIR"; then
    echo -e "  ${GREEN}✅ Permissions set${NC}"
else
    echo -e "  ${YELLOW}⚠️  Permission setting had issues${NC}"
fi

echo ""

# Final status
echo -e "${GREEN}✅ Update Complete!${NC}\n"
echo -e "${YELLOW}📊 Current Status:${NC}"
pm2 status
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "  - View backend logs: pm2 logs $BACKEND_NAME"
echo "  - Check backend health: curl http://localhost:10000/health"
echo "  - Users may need to hard refresh (Ctrl+F5) to see frontend changes"
echo ""


