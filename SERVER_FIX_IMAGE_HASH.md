# 🔧 Server-Side Fix: Add image_hash Column to product_images Table

## Problem
The error occurs because the `image_hash` column doesn't exist in the `product_images` table on the server database.

**Error Message:**
```
column "image_hash" of relation "product_images" does not exist
```

## Solution Options

### Option 1: Run SQL Script Directly (Fastest) ⚡

If you have direct database access (psql, pgAdmin, or database console):

1. **Connect to your server database** using one of these methods:

   **Via SSH (if database is on server):**
   ```bash
   ssh your-user@your-server-ip
   sudo -u postgres psql urutibiz_db
   ```

   **Via Neon Console (if using Neon):**
   - Go to https://console.neon.tech
   - Select your database
   - Open SQL Editor

   **Via Connection String:**
   ```bash
   psql "postgresql://user:password@host:port/database?sslmode=require"
   ```

2. **Run this SQL:**
   ```sql
   -- Check if column exists
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'product_images' 
   AND column_name = 'image_hash';
   
   -- If no results, add the column
   ALTER TABLE product_images 
   ADD COLUMN IF NOT EXISTS image_hash VARCHAR(64) NULL;
   
   -- Add index for performance
   CREATE INDEX IF NOT EXISTS idx_product_images_hash 
   ON product_images (image_hash)
   WHERE image_hash IS NOT NULL;
   
   -- Verify it was added
   SELECT column_name, data_type, character_maximum_length
   FROM information_schema.columns 
   WHERE table_name = 'product_images' 
   AND column_name = 'image_hash';
   ```

### Option 2: Run Migration on Server 🚀

If you have SSH access to your server:

1. **SSH into your server:**
   ```bash
   ssh your-user@your-server-ip
   ```

2. **Navigate to backend directory:**
   ```bash
   cd /path/to/urutibiz-backend
   # or
   cd ~/urutibiz-backend
   ```

3. **Run the migration:**
   ```bash
   npm run db:migrate
   ```

4. **If migration says "Already up to date" but column doesn't exist:**
   ```bash
   # Check migration status
   npx knex migrate:status
   
   # If migration shows as run but column doesn't exist, 
   # manually run the migration SQL (use Option 1)
   ```

### Option 3: Run TypeScript Script on Server 📝

1. **SSH into your server:**
   ```bash
   ssh your-user@your-server-ip
   ```

2. **Navigate to backend directory:**
   ```bash
   cd /path/to/urutibiz-backend
   ```

3. **Run the fix script:**
   ```bash
   npx ts-node -r tsconfig-paths/register scripts/add-image-hash-column.ts
   ```

### Option 4: For Cloud Databases (Neon, Supabase, etc.) ☁️

1. **Log into your database console:**
   - **Neon**: https://console.neon.tech → Select database → SQL Editor
   - **Supabase**: Dashboard → SQL Editor
   - **Railway**: Database → Query

2. **Run the SQL script:**
   ```sql
   ALTER TABLE product_images 
   ADD COLUMN IF NOT EXISTS image_hash VARCHAR(64) NULL;
   
   CREATE INDEX IF NOT EXISTS idx_product_images_hash 
   ON product_images (image_hash)
   WHERE image_hash IS NOT NULL;
   ```

3. **Verify:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'product_images' 
   AND column_name = 'image_hash';
   ```

## Quick SQL Script (Copy & Paste)

Save this as `fix-image-hash.sql` and run it:

```sql
-- Fix: Add image_hash column to product_images table
-- This script is idempotent (safe to run multiple times)

-- Add column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'product_images' 
        AND column_name = 'image_hash'
    ) THEN
        ALTER TABLE product_images 
        ADD COLUMN image_hash VARCHAR(64) NULL;
        
        RAISE NOTICE '✅ Added image_hash column';
    ELSE
        RAISE NOTICE '✅ Column already exists';
    END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_product_images_hash 
ON product_images (image_hash)
WHERE image_hash IS NOT NULL;

-- Verify
SELECT 
    'Column Status' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'product_images' 
            AND column_name = 'image_hash'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status;
```

## Verification

After running the fix, verify the column exists:

```sql
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'product_images' 
AND column_name = 'image_hash';
```

You should see:
```
 column_name | data_type | character_maximum_length | is_nullable
-------------+-----------+-------------------------+-------------
 image_hash  | character varying | 64 | YES
```

## Restart Your Application

After adding the column, restart your backend:

```bash
# If using PM2
pm2 restart urutibiz-backend

# If using Docker
docker-compose restart backend

# If using systemd
sudo systemctl restart urutibiz-backend
```

## Troubleshooting

### Migration says "Already up to date" but column doesn't exist

This means the migration was marked as run but didn't actually execute. Fix:

1. Check migration status:
   ```bash
   npx knex migrate:status
   ```

2. If the migration shows as run, manually add the column using Option 1 (SQL script)

3. Or rollback and re-run:
   ```bash
   npx knex migrate:rollback
   npm run db:migrate
   ```

### Permission Denied

If you get permission errors:

```bash
# For PostgreSQL on server
sudo -u postgres psql urutibiz_db

# Or grant permissions
GRANT ALL ON TABLE product_images TO your_user;
```

### Connection Issues

If you can't connect to the database:

1. Check your `.env` file has correct credentials
2. Verify database is running: `sudo systemctl status postgresql`
3. Check firewall rules allow connections
4. For cloud databases, check IP whitelist settings

## Need Help?

If none of these work, check:
1. Database connection credentials in `.env`
2. Database user has ALTER TABLE permissions
3. Table name is exactly `product_images` (case-sensitive in some databases)

