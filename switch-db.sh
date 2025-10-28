#!/bin/bash

# Database Configuration Switcher for UrutiBiz Backend
# Usage: ./switch-db.sh [docker|local]

case $1 in
  "docker")
    echo "🐳 Switching to Docker database configuration..."
    echo "DB_HOST=localhost" > .env.temp
    echo "DB_PORT=5434" >> .env.temp
    echo "DB_NAME=postgres" >> .env.temp
    echo "DB_USER=postgres" >> .env.temp
    echo "DB_PASSWORD=12345" >> .env.temp
    echo "DB_SSL=false" >> .env.temp
    echo "✅ Docker database configuration set!"
    echo "📋 Database: postgres@localhost:5434"
    echo "🔧 PostGIS: Pre-installed"
    ;;
  "local")
    echo "💻 Switching to Local database configuration..."
    echo "DB_HOST=localhost" > .env.temp
    echo "DB_PORT=5432" >> .env.temp
    echo "DB_NAME=rent_db" >> .env.temp
    echo "DB_USER=postgres" >> .env.temp
    echo "DB_PASSWORD=12345" >> .env.temp
    echo "DB_SSL=false" >> .env.temp
    echo "✅ Local database configuration set!"
    echo "📋 Database: rent_db@localhost:5432"
    echo "⚠️  Note: PostGIS needs to be installed on local PostgreSQL"
    ;;
  *)
    echo "❌ Usage: ./switch-db.sh [docker|local]"
    echo ""
    echo "🐳 docker  - Use Docker PostgreSQL with PostGIS"
    echo "💻 local   - Use Local PostgreSQL (requires PostGIS installation)"
    exit 1
    ;;
esac

# Copy other environment variables from existing .env
if [ -f .env ]; then
  grep -v "^DB_" .env >> .env.temp
fi

# Replace .env with new configuration
mv .env.temp .env

echo ""
echo "🚀 Next steps:"
echo "   1. Run migrations: npm run db:migrate"
echo "   2. Seed data: npm run db:seed"
echo "   3. Start server: npm run dev"
