import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('payment_methods');
  

  const hasColumn = await knex.schema.hasColumn('payment_methods', 'card_brand');
  

  // Drop any existing check constraint that might conflict
  try {
    await knex.raw(`ALTER TABLE payment_methods DROP CONSTRAINT IF EXISTS payment_methods_card_brand_check;`);
    console.log('✅ Dropped payment_methods_card_brand_check constraint');
  } catch (error) {
    console.warn('Could not drop constraint:', error);
  }

  // Ensure the enum has all the values we need
  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'card_brand') THEN
        CREATE TYPE card_brand AS ENUM ('visa', 'mastercard', 'amex', 'discover', 'diners', 'jcb', 'unionpay', 'unknown', 'other');
      END IF;
    END$$;
  `);

  // Add additional values if they don't exist
  const additionalBrands = ['unknown', 'other'];
  for (const brand of additionalBrands) {
    try {
      await knex.raw(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'card_brand') 
            AND enumlabel = '${brand}'
          ) THEN
            ALTER TYPE card_brand ADD VALUE '${brand}';
          END IF;
        END$$;
      `);
    } catch (error) {
      console.warn(`Failed to add card brand '${brand}':`, error);
    }
  }

  console.log('✅ Fixed payment_methods.card_brand constraint and enum values');
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('payment_methods');
  

  // Convert back to text
  await knex.raw(`
    ALTER TABLE payment_methods 
    ALTER COLUMN card_brand TYPE text;
  `);
}
