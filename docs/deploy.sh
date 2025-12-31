#!/bin/bash

# UrutiBiz Initial Deployment Script
# Run this script for the first-time deployment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/urutibz"
BACKEND_DIR="$PROJECT_DIR/urutibiz-backend"
FRONTEND_DIR="$PROJECT_DIR/urutibz-frontend"
WEB_DIR="/var/www/urutibz-frontend"
BACKEND_NAME="urutibiz-backend"

echo -e "${BLUE}🚀 UrutiBiz Initial Deployment Script${NC}\n"
echo -e "${YELLOW}This script will guide you through the initial deployment.${NC}\n"

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}❌ Please do not run this script as root. Run as a regular user with sudo privileges.${NC}"
    exit 1
fi

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

MISSING_DEPS=()

if ! command_exists node; then
    MISSING_DEPS+=("nodejs")
fi

if ! command_exists npm; then
    MISSING_DEPS+=("npm")
fi

if ! command_exists git; then
    MISSING_DEPS+=("git")
fi

if ! command_exists psql; then
    MISSING_DEPS+=("postgresql")
fi

if ! command_exists redis-cli; then
    MISSING_DEPS+=("redis-server")
fi

if ! command_exists nginx; then
    MISSING_DEPS+=("nginx")
fi

if ! command_exists pm2; then
    MISSING_DEPS+=("pm2")
fi

if [ ${#MISSING_DEPS[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing dependencies: ${MISSING_DEPS[*]}${NC}"
    echo -e "${YELLOW}Please install them first. See COMPLETE_DEPLOYMENT_GUIDE.md${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites are installed${NC}\n"

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Project directory not found: $PROJECT_DIR${NC}"
    echo -e "${YELLOW}Please clone or copy your project to $PROJECT_DIR first${NC}"
    exit 1
fi

# Backend Deployment
echo -e "${BLUE}📦 Deploying Backend...${NC}\n"

cd "$BACKEND_DIR" || exit 1

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found in backend directory${NC}"
    echo -e "${YELLOW}Please create .env file with required configuration${NC}"
    echo -e "${YELLOW}See COMPLETE_DEPLOYMENT_GUIDE.md for details${NC}"
    read -p "Press Enter to continue after creating .env file..."
fi

# Install dependencies
echo "  → Installing backend dependencies..."
if npm ci; then
    echo -e "  ${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "  ${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Run database migrations
echo "  → Running database migrations..."
read -p "  Run database migrations? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if npm run db:migrate; then
        echo -e "  ${GREEN}✅ Migrations completed${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Migration had issues${NC}"
    fi
fi

# Build backend
echo "  → Building backend application..."
if npm run build; then
    echo -e "  ${GREEN}✅ Backend build successful${NC}"
else
    echo -e "  ${RED}❌ Backend build failed${NC}"
    exit 1
fi

# Start backend with PM2
echo "  → Starting backend with PM2..."
if pm2 list | grep -q "$BACKEND_NAME"; then
    echo -e "  ${YELLOW}⚠️  Backend already running, restarting...${NC}"
    pm2 restart "$BACKEND_NAME"
else
    pm2 start dist/server.js --name "$BACKEND_NAME"
fi

pm2 save

# Setup PM2 startup
echo "  → Setting up PM2 startup..."
STARTUP_CMD=$(pm2 startup | grep -oP 'sudo.*')
if [ -n "$STARTUP_CMD" ]; then
    echo -e "  ${YELLOW}Run this command to enable PM2 startup:${NC}"
    echo -e "  ${BLUE}$STARTUP_CMD${NC}"
fi

echo ""

# Frontend Deployment
echo -e "${BLUE}🎨 Deploying Frontend...${NC}\n"

cd "$FRONTEND_DIR" || exit 1

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found in frontend directory${NC}"
    echo -e "${YELLOW}Please create .env file with required configuration${NC}"
    read -p "Press Enter to continue after creating .env file..."
fi

# Install dependencies
echo "  → Installing frontend dependencies..."
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

# Create web directory
echo "  → Creating web directory..."
sudo mkdir -p "$WEB_DIR"

# Copy to web directory
echo "  → Deploying frontend files..."
if sudo cp -r dist/* "$WEB_DIR/"; then
    echo -e "  ${GREEN}✅ Files deployed successfully${NC}"
else
    echo -e "  ${RED}❌ Failed to deploy files${NC}"
    exit 1
fi

# Set permissions
echo "  → Setting file permissions..."
sudo chown -R www-data:www-data "$WEB_DIR"
sudo chmod -R 755 "$WEB_DIR"
echo -e "  ${GREEN}✅ Permissions set${NC}"

echo ""

# Final status
echo -e "${GREEN}✅ Deployment Complete!${NC}\n"
echo -e "${YELLOW}📊 Current Status:${NC}"
pm2 status
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "  1. Configure Nginx (see COMPLETE_DEPLOYMENT_GUIDE.md)"
echo "  2. Setup SSL certificates with Certbot"
echo "  3. Configure DNS records"
echo "  4. Test the application"
echo ""
echo -e "${YELLOW}💡 Useful Commands:${NC}"
echo "  - View backend logs: pm2 logs $BACKEND_NAME"
echo "  - Check backend health: curl http://localhost:10000/health"
echo "  - Restart backend: pm2 restart $BACKEND_NAME"
echo ""


