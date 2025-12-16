#!/bin/bash
# Run All Migrations Script for Server
# This script runs all pending migrations and verifies the database schema

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     UrutiBiz - Server Migration Script                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

cd "$BACKEND_DIR"

echo "📁 Working directory: $BACKEND_DIR"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "   Make sure your database configuration is set."
    echo ""
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "🔄 Step 1: Running all pending migrations..."
echo ""

# Run migrations using knex
npx knex migrate:latest

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations completed successfully!"
    echo ""
else
    echo ""
    echo "❌ Migration failed! Please check the error messages above."
    exit 1
fi

echo "🔍 Step 2: Verifying database schema..."
echo ""

# Run the verification script if it exists
if [ -f "scripts/run-all-migrations.ts" ]; then
    echo "Running comprehensive verification..."
    npm run db:migrate:all
else
    echo "⚠️  Verification script not found, skipping detailed verification."
    echo "   Basic migration completed."
fi

echo ""
echo "🎉 Migration process completed!"
echo ""
echo "📝 Next steps:"
echo "   1. Test booking creation"
echo "   2. Verify all features work as expected"
echo "   3. Check application logs for any issues"
echo ""

