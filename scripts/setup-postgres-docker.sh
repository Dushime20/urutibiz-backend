#!/bin/bash

# Quick PostgreSQL Docker Setup for UrutiBiz
# This script sets up a PostgreSQL container for development

echo "🐳 Setting up PostgreSQL with Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Remove existing container if it exists
if docker ps -a --format 'table {{.Names}}' | grep -q urutibiz-postgres; then
    echo "🔄 Removing existing PostgreSQL container..."
    docker stop urutibiz-postgres 2>/dev/null
    docker rm urutibiz-postgres 2>/dev/null
fi

# Create and start PostgreSQL container
echo "🚀 Creating PostgreSQL container..."
docker run --name urutibiz-postgres \
  -e POSTGRES_DB=urutibiz_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=12345 \
  -p 5432:5432 \
  -d postgres:15

# Wait for container to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if container is running
if docker ps --format 'table {{.Names}}' | grep -q urutibiz-postgres; then
    echo "✅ PostgreSQL container is running!"
    echo ""
    echo "📋 Connection Details:"
    echo "   Host: localhost"
    echo "   Port: 5432"
    echo "   Database: urutibiz_dev"
    echo "   Username: postgres"
    echo "   Password: 12345"
    echo ""
    echo "🔧 Next Steps:"
    echo "   1. Test connection: npm run db:setup"
    echo "   2. Run migrations: npm run db:migrate"
    echo "   3. Start development: npm run dev"
    echo ""
    echo "🛠️ Container Management:"
    echo "   Stop: docker stop urutibiz-postgres"
    echo "   Start: docker start urutibiz-postgres"
    echo "   Remove: docker stop urutibiz-postgres && docker rm urutibiz-postgres"
else
    echo "❌ Failed to start PostgreSQL container"
    echo "Check Docker logs: docker logs urutibiz-postgres"
    exit 1
fi
