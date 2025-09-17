import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Ensure products table exists
  const hasProducts = await knex.schema.hasTable('products');
  if (!hasProducts) {
    console.log('⚠️ products table does not exist, skipping owner_id addition');
    return;
  }

  // 1) Add owner_id column if missing
  const hasOwnerId = await knex.schema.hasColumn('products', 'owner_id');
  if (!hasOwnerId) {
    await knex.schema.alterTable('products', (table) => {
      table.uuid('owner_id').nullable();
    });
    console.log('✅ Added products.owner_id column');
  } else {
    console.log('⚠️ products.owner_id already exists, skipping column add');
  }

  // 2) Optional backfill from created_by if that column exists and owner_id is null
  const hasCreatedBy = await knex.schema.hasColumn('products', 'created_by');
  if (hasCreatedBy) {
    try {
      await knex.raw(`
        UPDATE products
        SET owner_id = created_by
        WHERE owner_id IS NULL AND created_by IS NOT NULL
      `);
      console.log('✅ Backfilled products.owner_id from created_by');
    } catch (error) {
      console.log('⚠️ Skipped backfill from created_by:', error instanceof Error ? error.message : String(error));
    }
  }

  // 3) Add FK to users if not present and users table exists
  const hasUsers = await knex.schema.hasTable('users');
  if (hasUsers) {
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'products_owner_id_fkey'
        ) THEN
          ALTER TABLE products
            ADD CONSTRAINT products_owner_id_fkey
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
      END$$;
    `);
    console.log('✅ Ensured FK products.owner_id -> users.id');
  } else {
    console.log('⚠️ users table does not exist, skipping FK for products.owner_id');
  }

  // 4) Create index for owner_id
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_products_owner_id ON products(owner_id);`);
  console.log('✅ Ensured index idx_products_owner_id');
}

export async function down(knex: Knex): Promise<void> {
  const hasProducts = await knex.schema.hasTable('products');
  if (!hasProducts) {
    console.log('⚠️ products table does not exist, skipping down');
    return;
  }

  // Drop FK if exists
  try {
    await knex.raw(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'products_owner_id_fkey'
        ) THEN
          ALTER TABLE products DROP CONSTRAINT products_owner_id_fkey;
        END IF;
      END$$;
    `);
  } catch (error) {
    console.log('⚠️ Failed to drop FK products_owner_id_fkey:', error instanceof Error ? error.message : String(error));
  }

  // Drop index if exists
  try {
    await knex.raw(`DROP INDEX IF EXISTS idx_products_owner_id;`);
  } catch (error) {
    console.log('⚠️ Failed to drop index idx_products_owner_id:', error instanceof Error ? error.message : String(error));
  }

  // Drop column if exists
  const hasOwnerId = await knex.schema.hasColumn('products', 'owner_id');
  if (hasOwnerId) {
    await knex.schema.alterTable('products', (table) => {
      table.dropColumn('owner_id');
    });
    console.log('✅ Dropped products.owner_id');
  } else {
    console.log('⚠️ products.owner_id does not exist, skipping column drop');
  }
}


