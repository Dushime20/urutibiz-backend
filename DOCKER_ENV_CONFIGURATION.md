# Docker Environment Variable Configuration

All Docker Compose files now use environment variables from `.env` file for database configuration.

## Environment Variables Required

Create a `.env` file in the `urutibiz-backend/` directory with the following variables:

```env
# ============================================
# DATABASE CONFIGURATION
# ============================================
DB_NAME=urutibiz_db
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_HOST=localhost
DB_PORT=5432
DB_SSL=false

# ============================================
# REDIS CONFIGURATION
# ============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here

# ============================================
# JWT AUTHENTICATION
# ============================================
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters-long

# ============================================
# EMAIL CONFIGURATION (SMTP)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password

# ============================================
# CLOUDINARY (Image Storage)
# ============================================
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Docker Compose Files Updated

All docker-compose files now use environment variables with sensible defaults:

### 1. `docker-compose.yml` (Development)
- Uses `${DB_NAME:-urutibiz_db}`, `${DB_USER:-postgres}`, `${DB_PASSWORD}`
- Port: `${DB_PORT:-5434}:5432`

### 2. `docker-compose.prod.yml` (Production)
- Uses `${DB_NAME:-urutibiz_db}`, `${DB_USER:-postgres}`, `${DB_PASSWORD}`
- Database port not exposed (internal only)

### 3. `docker/docker-compose.database.yml` (Database Only)
- Uses `${DB_NAME:-urutibiz_db}`, `${DB_USER:-postgres}`, `${DB_PASSWORD}`
- Port: `${DB_PORT:-5432}:5432`

### 4. `docker/docker-compose.dev.yml` (Development Tools)
- Uses `${DB_NAME:-urutibiz_db}`, `${DB_USER:-postgres}`, `${DB_PASSWORD}`
- Port: `${DB_PORT:-5432}:5432`

### 5. `docker/docker-compose.yml` (Alternative Config)
- Uses `${DB_NAME:-urutibiz_db}`, `${DB_USER:-postgres}`, `${DB_PASSWORD}`
- Uses `${DB_HOST:-postgres}`, `${DB_PORT:-5432}`, `${DB_SSL:-false}`

## Default Values

If environment variables are not set, the following defaults are used:
- `DB_NAME`: `urutibiz_db`
- `DB_USER`: `postgres`
- `DB_PORT`: `5432` (or `5434` for development compose)
- `DB_HOST`: `postgres` (for Docker) or `localhost` (for local)
- `DB_SSL`: `false`

## Usage

### Development
```bash
# Set your .env file with database credentials
# Then start services
docker-compose up -d
```

### Production
```bash
# Set your .env file with production credentials
# Then start services
docker-compose -f docker-compose.prod.yml up -d
```

### Database Only
```bash
# Start only database services
docker-compose -f docker/docker-compose.database.yml up -d
```

## Important Notes

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use strong passwords** in production
3. **Default values** are provided for development convenience
4. **All files** now use the same environment variable names for consistency

## Verification

After starting services, verify database connection:

```bash
# Check if database is accessible
docker-compose exec postgres psql -U ${DB_USER:-postgres} -d ${DB_NAME:-urutibiz_db} -c "SELECT version();"
```

---

**Last Updated**: 2024
**Maintained by**: UrutiBiz Development Team

