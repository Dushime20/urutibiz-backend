import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasProducts = await knex.schema.hasTable('products');
  

  const hasTitle = await knex.schema.hasColumn('products', 'title');
  const hasDescription = await knex.schema.hasColumn('products', 'description');

  if (!hasTitle) {
    await knex.schema.alterTable('products', (table) => {
      table.string('title', 255).notNullable().defaultTo('');
    });

    // Backfill from name if present
    const hasName = await knex.schema.hasColumn('products', 'name');
    if (hasName) {
      await knex.raw(`UPDATE products SET title = name WHERE COALESCE(title,'') = '' AND name IS NOT NULL`);
    }
    // If still empty, set a generic title using id
    await knex.raw(`UPDATE products SET title = CONCAT('Product ', id::text) WHERE COALESCE(title,'') = ''`);

    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_products_title ON products(title)`);
    console.log('✅ Added products.title (backfilled and indexed)');
  }

  if (!hasDescription) {
    await knex.schema.alterTable('products', (table) => {
      table.text('description');
    });
    console.log('✅ Added products.description');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasProducts = await knex.schema.hasTable('products');
  

  try { await knex.raw(`DROP INDEX IF EXISTS idx_products_title`); } catch {}

  const hasTitle = await knex.schema.hasColumn('products', 'title');
  const hasDescription = await knex.schema.hasColumn('products', 'description');
  if (hasTitle || hasDescription) {
    await knex.schema.alterTable('products', (table) => {
      if (hasTitle) table.dropColumn('title');
      if (hasDescription) table.dropColumn('description');
    });
  }
}


