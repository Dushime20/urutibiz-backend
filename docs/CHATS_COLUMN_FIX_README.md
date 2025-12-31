# Messaging System Fix Guide

## Problems

### Problem 1: Missing Columns in Chats Table
The `chats` table insert is failing with error:
```
column "booking_id" of relation "chats" does not exist
```

### Problem 2: Missing conversation_participants Table
Error:
```
relation "conversation_participants" does not exist
```

### Problem 3: Missing is_deleted Column in Messages Table
Error:
```
column "is_deleted" of relation "messages" does not exist
```

These happen when the migration `20250125_enhance_messaging_system_international.ts` hasn't been run or failed.

## Solutions

### Option 1: Fix All Messaging Issues (Recommended - One Script Fixes Everything)
If the migration says "Already up to date" but tables/columns are missing, use this comprehensive script:

```bash
node scripts/fix-messaging-tables.js
```

This script will:
- Create the `conversation_participants` table if missing
- Add `is_deleted` and other missing columns to `messages` table
- Add `booking_id`, `product_id`, `subject` to `chats` table (if missing)
- Create all necessary indexes
- Verify everything was added correctly

### Option 2: Fix Only Chats Columns
If you only need to fix the chats table columns:

```bash
node scripts/force-add-chats-columns.js
```

This script will:
- Check which columns are missing in chats table
- Add them directly to the database
- Create indexes
- Verify everything was added correctly

### Option 2: Run the Migration (If Not Already Run)
```bash
# From the backend directory
npm run db:migrate
# or directly with knex
npx knex migrate:latest
```

### Option 3: Run SQL Fix Script Directly
If migrations aren't working, run the SQL script directly on your database:

```bash
# Using psql
psql -U your_username -d your_database -f scripts/fix-chats-booking-id.sql

# Or connect first, then run:
psql -U your_username -d your_database
\i scripts/fix-chats-booking-id.sql
```

### Option 4: Manual SQL (Quick Fix)
Connect to your database and run:
```sql
-- Add booking_id column if missing
ALTER TABLE chats ADD COLUMN IF NOT EXISTS booking_id UUID;

-- Add product_id column if missing  
ALTER TABLE chats ADD COLUMN IF NOT EXISTS product_id UUID;

-- Add subject column if missing
ALTER TABLE chats ADD COLUMN IF NOT EXISTS subject VARCHAR(255);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chats_booking_id ON chats(booking_id);
CREATE INDEX IF NOT EXISTS idx_chats_product_id ON chats(product_id);
```

## Verification Scripts

### Check Migration Status
```bash
node scripts/check-migration-status.js
```
This shows which migrations have been run and helps identify if a migration was marked as complete but didn't actually add the columns.

### Check Column Existence
```bash
# If TypeScript is compiled:
node scripts/check-chats-columns.js

# Or using ts-node (if not compiled):
npx ts-node scripts/check-chats-columns.ts
```

This will:
- Check if the `chats` table exists
- Verify if `booking_id`, `product_id`, and `subject` columns exist
- List all columns in the table
- Provide recommendations

### Test Insert Functionality
```bash
node scripts/test-chats-insert.js
```

This will:
- Test inserting into chats table
- Verify the code handles missing columns gracefully
- Clean up test data automatically

## Code Changes

The `MessagingRepository` has been updated to:
- Check if columns exist before inserting
- Only include columns in the insert if they exist in the table
- Cache column existence checks for performance

This means the code will work even if the migration hasn't run yet, but it's still recommended to run the migration for full functionality.

## Server Deployment Steps

1. **Check current state:**
   ```bash
   node scripts/check-chats-columns.js
   ```

2. **If columns are missing, fix them:**
   ```bash
   # Option A: Force add columns (when migration says "up to date")
   node scripts/force-add-chats-columns.js
   
   # Option B: Run migration (if not already run)
   npm run db:migrate
   
   # Option C: Run SQL script
   psql -U your_user -d your_db -f scripts/fix-chats-booking-id.sql
   ```

3. **Verify the fix:**
   ```bash
   node scripts/test-chats-insert.js
   ```

4. **Restart your server:**
   ```bash
   # Your restart command here
   pm2 restart all
   # or
   npm run start
   ```

## Notes

- The code now handles missing columns gracefully, so the server won't crash
- However, features that depend on `booking_id`, `product_id`, or `subject` won't work until the columns are added
- It's safe to run the SQL script multiple times - it checks for column existence first

