#!/bin/bash
# UrutiBiz Server Update Script
# Usage: ./update-server.sh

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================="
echo "🔄 UrutiBiz Server Update Script"
echo "==========================================${NC}"
echo ""

# Backup function
backup() {
    echo -e "${YELLOW}📦 Creating backup...${NC}"
    BACKUP_DIR=~/backups/$(date +%Y%m%d_%H%M%S)
    mkdir -p $BACKUP_DIR
    
    # Backup backend
    if [ -d ~/urutibz/urutibiz-backend/dist ]; then
        cp -r ~/urutibz/urutibiz-backend/dist $BACKUP_DIR/backend-dist 2>/dev/null || true
        echo "  ✅ Backend dist backed up"
    fi
    if [ -f ~/urutibz/urutibiz-backend/.env ]; then
        cp ~/urutibz/urutibiz-backend/.env $BACKUP_DIR/backend-env 2>/dev/null || true
        echo "  ✅ Backend .env backed up"
    fi
    
    # Backup frontend
    if [ -d /var/www/urutibz-frontend ]; then
        sudo cp -r /var/www/urutibz-frontend $BACKUP_DIR/frontend 2>/dev/null || true
        echo "  ✅ Frontend backed up"
    fi
    
    echo -e "${GREEN}✅ Backup created: $BACKUP_DIR${NC}"
    echo $BACKUP_DIR > /tmp/last_backup_dir.txt
}

# Git pull
pull_updates() {
    echo -e "${YELLOW}📥 Pulling latest code...${NC}"
    cd ~/urutibz
    
    # Check if git repo
    if [ ! -d .git ]; then
        echo -e "${RED}❌ Not a git repository!${NC}"
        exit 1
    fi
    
    # Show current branch
    CURRENT_BRANCH=$(git branch --show-current)
    echo "  Current branch: $CURRENT_BRANCH"
    
    # Pull updates
    git pull origin $CURRENT_BRANCH || git pull origin main
    
    echo -e "${GREEN}✅ Code updated${NC}"
    
    # Show recent commits
    echo ""
    echo "Recent commits:"
    git log --oneline -5
    echo ""
}

# Update backend
update_backend() {
    echo -e "${YELLOW}🔧 Updating backend...${NC}"
    cd ~/urutibz/urutibiz-backend
    
    echo "  📦 Installing dependencies..."
    npm install
    
    echo "  🗄️ Running migrations..."
    npm run db:migrate || echo "  ⚠️ No new migrations or migration failed"
    
    echo "  🔨 Building..."
    npm run build
    
    if [ ! -d dist ]; then
        echo -e "${RED}  ❌ Build failed! dist folder not created${NC}"
        exit 1
    fi
    
    echo "  🔄 Restarting PM2..."
    pm2 restart urutibiz-backend || pm2 start ecosystem.config.js
    
    sleep 3
    
    echo "  ✅ Checking status..."
    pm2 status urutibiz-backend | grep urutibiz-backend || echo "  ⚠️ Process not found"
    
    echo "  📋 Recent logs:"
    pm2 logs urutibiz-backend --lines 10 --nostream | tail -5
}

# Update frontend
update_frontend() {
    echo -e "${YELLOW}🎨 Updating frontend...${NC}"
    cd ~/urutibz/urutibz-frontend
    
    echo "  📦 Installing dependencies..."
    npm install
    
    echo "  🔨 Building..."
    npm run build
    
    if [ ! -d dist ]; then
        echo -e "${RED}  ❌ Build failed! dist folder not created${NC}"
        exit 1
    fi
    
    echo "  📤 Deploying..."
    sudo mkdir -p /var/www/urutibz-frontend
    sudo rm -rf /var/www/urutibz-frontend/*
    sudo cp -r dist/* /var/www/urutibz-frontend/
    sudo chown -R www-data:www-data /var/www/urutibz-frontend
    sudo chmod -R 755 /var/www/urutibz-frontend
    
    echo "  🔄 Reloading Nginx..."
    sudo nginx -t && sudo systemctl reload nginx || echo "  ⚠️ Nginx reload failed"
}

# Test endpoints
test_endpoints() {
    echo -e "${YELLOW}🧪 Testing endpoints...${NC}"
    
    echo "  Testing backend health..."
    curl -s http://localhost:3000/health | head -3 || echo "  ⚠️ Backend not responding"
    
    echo "  Testing API..."
    curl -s http://localhost:3000/api/v1/health | head -3 || echo "  ⚠️ API not responding"
    
    echo "  Testing frontend..."
    curl -s -I http://localhost:8080/ | head -3 || echo "  ⚠️ Frontend not responding"
}

# Main execution
main() {
    # Ask for backup
    read -p "Create backup before update? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        backup
    fi
    
    pull_updates
    update_backend
    update_frontend
    
    echo ""
    echo -e "${GREEN}=========================================="
    echo "✅ Server update complete!"
    echo "==========================================${NC}"
    echo ""
    
    test_endpoints
    
    echo ""
    echo -e "${BLUE}📊 Final Status:${NC}"
    pm2 status
    echo ""
    echo -e "${GREEN}✅ Update completed successfully!${NC}"
}

# Run main function
main




