import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('products');
  if (!hasTable) {
    throw new Error('products table does not exist. Run base migrations first.');
  }
  const hasColumn = await knex.schema.hasColumn('products', 'tags');
  if (!hasColumn) {
    await knex.schema.alterTable('products', (table) => {
      table.specificType('tags', 'varchar(50)[]');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('products', 'tags');
  if (hasColumn) {
    await knex.schema.alterTable('products', (table) => {
      table.dropColumn('tags');
    });
  }
}
