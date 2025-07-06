# Database Setup Guide

## Option 1: Start Docker Desktop and Use PostgreSQL Container

1. **Start Docker Desktop** (if you have it installed)

2. **Run PostgreSQL container with correct password:**
```bash
docker run --name urutibiz-postgres -e POSTGRES_PASSWORD=12345 -e POSTGRES_DB=urutibiz_dev -p 5432:5432 -d postgres:15
```

3. **Verify container is running:**
```bash
docker ps
```

4. **Test connection:**
```bash
docker exec -it urutibiz-postgres psql -U postgres -d urutibiz_dev
```

## Option 2: Install PostgreSQL Locally

1. **Download PostgreSQL** from https://www.postgresql.org/download/windows/

2. **During installation:**
   - Set password for postgres user to: `12345`
   - Keep default port: `5432`

3. **Create database:**
```sql
CREATE DATABASE urutibiz_dev;
```

## Option 3: Use Different Database Credentials

Update your `.env` file with the correct PostgreSQL credentials for your system.

## Current .env Database Settings:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=12345
DB_SSL=false
```

## Quick Docker Setup Commands

```bash
# Pull PostgreSQL image
docker pull postgres:15

# Run PostgreSQL container
docker run --name urutibiz-postgres \
  -e POSTGRES_PASSWORD=12345 \
  -e POSTGRES_DB=urutibiz_dev \
  -p 5432:5432 \
  -d postgres:15

# Check if container is running
docker ps

# Connect to database
docker exec -it urutibiz-postgres psql -U postgres -d urutibiz_dev
```

## Testing Connection

Run this command to test your database connection:
```bash
node scripts/test-db-config.js
```
