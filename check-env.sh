#!/bin/bash
# Check which environment variables are missing

echo "🔍 Checking environment variables..."
echo ""

# Required variables from docker-compose.prod.yml
REQUIRED_VARS=(
    "DB_NAME"
    "DB_USER"
    "DB_PASSWORD"
    "REDIS_PASSWORD"
    "JWT_SECRET"
    "JWT_REFRESH_SECRET"
    "SMTP_HOST"
    "SMTP_USER"
    "SMTP_PASS"
    "CLOUDINARY_CLOUD_NAME"
    "CLOUDINARY_API_KEY"
    "CLOUDINARY_API_SECRET"
)

MISSING=()
FOUND=()

# Load .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ .env file not found!"
    exit 1
fi

# Check each variable
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING+=("$var")
        echo "❌ Missing: $var"
    else
        FOUND+=("$var")
        echo "✅ Found: $var"
    fi
done

echo ""
echo "📊 Summary:"
echo "   Found: ${#FOUND[@]}"
echo "   Missing: ${#MISSING[@]}"

if [ ${#MISSING[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  Missing variables:"
    for var in "${MISSING[@]}"; do
        echo "   - $var"
    done
    exit 1
else
    echo ""
    echo "✅ All required variables are set!"
    exit 0
fi
