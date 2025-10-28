#!/bin/bash
# Quick database setup script

echo "🔄 Stopping existing containers..."
docker compose down

echo "🚀 Starting PostgreSQL with PostGIS..."
docker compose up -d postgres

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 15

echo "📊 Running database migrations..."
npm run db:migrate

echo "✅ Database setup complete!"


