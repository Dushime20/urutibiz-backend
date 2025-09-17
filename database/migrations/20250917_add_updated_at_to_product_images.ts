import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('product_images');
  if (!hasTable) return;

  const hasUpdatedAt = await knex.schema.hasColumn('product_images', 'updated_at');
  if (!hasUpdatedAt) {
    await knex.schema.alterTable('product_images', (table) => {
      table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    });
    console.log('✅ Added product_images.updated_at with default NOW');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('product_images');
  if (!hasTable) return;
  const hasUpdatedAt = await knex.schema.hasColumn('product_images', 'updated_at');
  if (hasUpdatedAt) {
    await knex.schema.alterTable('product_images', (table) => {
      table.dropColumn('updated_at');
    });
  }
}


