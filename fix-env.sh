#!/bin/bash
# Fix .env file for production

echo "🔧 Fixing .env file..."

# Generate secrets
DB_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
REDIS_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
JWT_SEC=$(openssl rand -base64 32)
JWT_REF=$(openssl rand -base64 32)

# Backup current .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Add missing production variables
cat >> .env << EOF

# Production Database Settings
DB_NAME=urutibiz_prod
DB_USER=urutibiz_user
DB_PASSWORD=$DB_PASS
REDIS_PASSWORD=$REDIS_PASS

# Production JWT Secrets
JWT_SECRET=$JWT_SEC
JWT_REFRESH_SECRET=$JWT_REF
EOF

echo "✅ .env file updated!"
echo ""
echo "📋 Generated passwords:"
echo "DB_PASSWORD: $DB_PASS"
echo "REDIS_PASSWORD: $REDIS_PASS"
echo ""
echo "⚠️  Save these passwords securely!"
