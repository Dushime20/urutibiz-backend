#!/bin/bash
# Backend Update Script
# Usage: ./update-backend.sh

set -e

echo "🔧 Updating UrutiBiz Backend..."

cd ~/urutibz/urutibiz-backend

echo "📦 Installing dependencies..."
npm install

echo "🗄️ Running database migrations..."
npm run db:migrate || echo "⚠️ No new migrations"

echo "🔨 Building backend..."
npm run build

echo "🔄 Restarting backend..."
pm2 restart urutibiz-backend

sleep 3

echo "✅ Checking status..."
pm2 logs urutibiz-backend --lines 20 --nostream | grep -i -E "error|listening|server running|database" | tail -5

echo "✅ Backend update complete!"




