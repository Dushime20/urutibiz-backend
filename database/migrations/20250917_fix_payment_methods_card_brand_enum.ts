import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('payment_methods');
  if (!hasTable) return;

  // Check if card_brand column exists
  const hasColumn = await knex.schema.hasColumn('payment_methods', 'card_brand');
  if (!hasColumn) return;

  // First, ensure the card_brand enum exists
  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'card_brand') THEN
        CREATE TYPE card_brand AS ENUM ('visa', 'mastercard', 'amex', 'discover', 'diners', 'jcb', 'unionpay');
      END IF;
    END$$;
  `);

  // Add additional card brand values to the enum
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

  console.log('✅ Created card_brand enum and added additional values');
}

export async function down(): Promise<void> {
  // Note: PostgreSQL doesn't support removing enum values directly
  // This would require recreating the enum and updating all references
  console.log('⚠️  Cannot remove enum values - would require recreating enum');
}
