# 🔍 Database Migration Check & Run Script

This guide helps you verify and run all pending migrations to ensure your database schema is up to date.

## 🚀 Quick Start

### On the Server (Linux/Ubuntu):

```bash
cd ~/urutibz/urutibiz-backend
npm run db:migrate:all
```

### On Windows (Local Development):

```powershell
cd urutibiz-backend
npm run db:migrate:all
```

## 📋 What This Script Does

The `run-all-migrations.ts` script will:

1. ✅ **Connect to your database**
2. ✅ **Check migration status** - See which migrations have been run
3. ✅ **Verify table structures** - Check for missing columns in:
   - `bookings` table (owner_confirmation columns, etc.)
   - `products` table (view_count, review_count, average_rating)
4. ✅ **Run all pending migrations** - Execute any migrations that haven't run yet
5. ✅ **Verify again** - Confirm all required columns now exist
6. ✅ **Report summary** - Show what was fixed and what's still missing

## 🔧 Available Commands

| Command | Description |
|---------|-------------|
| `npm run db:migrate:all` | Run migrations + verify schema (comprehensive) |
| `npm run db:migrate` | Run all pending migrations (simple) |
| `npx knex migrate:status` | Check which migrations have run |
| `npx knex migrate:latest` | Run all pending migrations |
| `npx knex migrate:rollback` | Rollback last migration |

## ⚠️ Common Issues Fixed

### Issue: `column "view_count" does not exist`

**Solution:** Run the migration script:
```bash
npm run db:migrate:all
```

This will run the migration `20250120_add_view_count_to_products.ts` which adds the `view_count` column.

### Issue: `column "owner_confirmation_status" does not exist`

**Solution:** Run the migration script:
```bash
npm run db:migrate:all
```

This will run the migration that adds owner confirmation columns to the bookings table.

## 📊 Expected Output

After running successfully, you should see:

```
✅ All required columns exist in bookings table!
   Total columns verified: 14

✅ All required columns exist in products table!
   Total columns verified: 3

✅ All critical columns (owner_confirmed, owner_confirmation_status) exist in bookings!
✅ All critical columns (view_count) exist in products!

🎉 Migration process completed successfully!
```

## 🆘 Troubleshooting

### If migrations fail:

1. **Check database connection:**
   ```bash
   npm run db:test
   ```

2. **Check .env file:**
   - Ensure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` are set correctly

3. **Check database permissions:**
   - Ensure the database user has ALTER TABLE permissions

4. **Manually run specific migration:**
   ```bash
   npx knex migrate:up 20250120_add_view_count_to_products.ts
   ```

### If columns are still missing after migration:

1. Check the migration output for errors
2. Verify the migration file exists in `database/migrations/`
3. Check if the migration was already run (it won't run twice)
4. Manually verify the column exists:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'products' AND column_name = 'view_count';
   ```

## 📝 Next Steps After Migration

1. ✅ Restart your application:
   ```bash
   pm2 restart urutibiz-backend
   ```

2. ✅ Test product fetching - The `view_count` error should be resolved

3. ✅ Test booking creation - Owner confirmation should work

4. ✅ Monitor logs for any remaining issues

---

**Note:** Always backup your database before running migrations in production!

