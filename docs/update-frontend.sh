#!/bin/bash
# Frontend Update Script
# Usage: ./update-frontend.sh

set -e

echo "🎨 Updating UrutiBiz Frontend..."

cd ~/urutibz/urutibz-frontend

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building frontend..."
npm run build

if [ ! -d dist ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "📤 Deploying frontend..."
sudo mkdir -p /var/www/urutibz-frontend
sudo rm -rf /var/www/urutibz-frontend/*
sudo cp -r dist/* /var/www/urutibz-frontend/
sudo chown -R www-data:www-data /var/www/urutibz-frontend
sudo chmod -R 755 /var/www/urutibz-frontend

echo "🔄 Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Frontend update complete!"




