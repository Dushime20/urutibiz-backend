#!/bin/bash

echo "🐳 Starting UrutiBiz Database Services..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start database services
echo "📦 Starting PostgreSQL and Redis..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Test database connection
echo "🔍 Testing database connection..."
node test-db-connection.js

echo "✅ Database setup complete!"
echo ""
echo "📊 Database Info:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Database: postgres"
echo "  - User: postgres"
echo "  - Password: 12345"
echo ""
echo "🚀 You can now start the server with: npm run dev"
