import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasProducts = await knex.schema.hasTable('products');
  if (!hasProducts) return;

  // Backfill name from title/slug
  await knex.raw(`
    UPDATE products
    SET name = COALESCE(title, slug, CONCAT('Product ', id::text))
    WHERE name IS NULL;
  `);

  // Create trigger to keep name in sync if not provided
  await knex.raw(`
    CREATE OR REPLACE FUNCTION set_product_name_from_title()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.name IS NULL OR NEW.name = '' THEN
        NEW.name := COALESCE(NEW.title, NEW.slug, CONCAT('Product ', NEW.id::text));
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    DROP TRIGGER IF EXISTS trg_set_product_name ON products;
    CREATE TRIGGER trg_set_product_name
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION set_product_name_from_title();
  `);
}

export async function down(knex: Knex): Promise<void> {
  const hasProducts = await knex.schema.hasTable('products');
  if (!hasProducts) return;
  await knex.raw(`DROP TRIGGER IF EXISTS trg_set_product_name ON products;`);
  await knex.raw(`DROP FUNCTION IF EXISTS set_product_name_from_title;`);
}


