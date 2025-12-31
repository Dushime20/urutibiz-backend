# 🚀 Database Migration Guide for Server

This guide provides commands and scripts to run all pending migrations on your server to fix missing database columns.

## ⚠️ Problem

If you're getting this error when creating bookings:
```
column "owner_confirmation_status" of relation "bookings" does not exist
```

This means the database migrations haven't been run yet. The code expects certain columns to exist, but they haven't been created in the database.

## ✅ Solution: Run All Migrations

### Option 1: Using the Comprehensive Script (Recommended)

This script runs all migrations AND verifies the database schema:

```bash
# For Linux/Ubuntu servers
cd urutibiz-backend
npm run db:migrate:all

# OR using the shell script directly
chmod +x scripts/run-migrations.sh
./scripts/run-migrations.sh
```

```powershell
# For Windows servers
cd urutibiz-backend
npm run db:migrate:all

# OR using PowerShell script
.\scripts\run-migrations.ps1
```

### Option 2: Simple Migration Command

If you just want to run migrations without verification:

```bash
cd urutibiz-backend
npm run db:migrate
```

Or directly with knex:

```bash
cd urutibiz-backend
npx knex migrate:latest
```

### Option 3: Manual Migration Check

To check which migrations have been run:

```bash
cd urutibiz-backend
npx knex migrate:status
```

## 📋 What Gets Fixed

Running migrations will add these missing columns to the `bookings` table:

- ✅ `owner_confirmed` - Boolean flag for owner confirmation
- ✅ `owner_confirmation_status` - Status (pending, confirmed, rejected)
- ✅ `owner_confirmed_at` - Timestamp when owner confirmed
- ✅ `owner_rejection_reason` - Reason if owner rejected
- ✅ `owner_confirmation_notes` - Additional notes from owner
- ✅ `base_amount` - Base booking amount
- ✅ `specifications` - Product specifications
- ✅ `location` - Geographic location (PostGIS)
- ✅ And other columns from various migrations

## 🔍 Verification

After running migrations, the comprehensive script will:

1. ✅ Check if all required columns exist
2. ✅ Verify critical columns for booking creation
3. ✅ Report any missing columns
4. ✅ Provide next steps

## 🐳 Docker/Container Environments

If you're running in Docker:

```bash
# Execute migrations inside the container
docker-compose exec backend npm run db:migrate:all

# OR if using docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml exec backend npm run db:migrate:all
```

## 🔧 Troubleshooting

### Migration Fails with Permission Error

```bash
# Check database user permissions
# The user needs ALTER TABLE permissions

# Grant permissions (as PostgreSQL superuser):
psql -U postgres -d your_database_name
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_db_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_db_user;
```

### Migration Says "Already Up to Date" but Column Doesn't Exist

This means the migration was marked as run but didn't actually execute. Fix:

```bash
# 1. Check migration status
npx knex migrate:status

# 2. If migration shows as run but column doesn't exist, rollback and re-run
npx knex migrate:rollback
npm run db:migrate:all
```

### Connection Issues

Make sure your `.env` file has correct database credentials:

```env
DB_HOST=your_host
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_password
DB_SSL=false  # or true for production
```

## 📝 Server Deployment Checklist

When deploying to a new server:

1. ✅ Clone the repository
2. ✅ Install dependencies: `npm install`
3. ✅ Configure `.env` file with database credentials
4. ✅ **Run migrations**: `npm run db:migrate:all`
5. ✅ Verify schema: Check script output
6. ✅ Test booking creation
7. ✅ Start the server: `npm start`

## 🎯 Quick Reference

| Command | Description |
|---------|-------------|
| `npm run db:migrate` | Run all pending migrations (simple) |
| `npm run db:migrate:all` | Run migrations + verify schema (comprehensive) |
| `npx knex migrate:status` | Check which migrations have run |
| `npx knex migrate:rollback` | Rollback last migration |
| `./scripts/run-migrations.sh` | Run migrations (Linux/Mac) |
| `.\scripts\run-migrations.ps1` | Run migrations (Windows) |

## ✅ Success Indicators

After running migrations successfully, you should see:

```
✅ Migrations completed successfully!
✅ All required columns exist in bookings table!
✅ All critical columns (owner_confirmed, owner_confirmation_status) exist!
🎉 Migration process completed successfully!
```

## 🆘 Still Having Issues?

1. Check the migration output for specific errors
2. Verify database connection: `npm run db:test`
3. Check database logs for detailed error messages
4. Ensure PostgreSQL version is 12+ (required for some features)
5. Verify PostGIS extension is installed (for location columns)

---

**Note**: Always backup your database before running migrations in production!




