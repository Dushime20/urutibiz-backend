import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasProducts = await knex.schema.hasTable('products');
  

  const hasYear = await knex.schema.hasColumn('products', 'year_manufactured');
  if (!hasYear) {
    await knex.schema.alterTable('products', (table) => {
      table.integer('year_manufactured');
    });
    console.log('✅ Added products.year_manufactured');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasProducts = await knex.schema.hasTable('products');
  
  const hasYear = await knex.schema.hasColumn('products', 'year_manufactured');
  if (hasYear) {
    await knex.schema.alterTable('products', (table) => {
      table.dropColumn('year_manufactured');
    });
  }
}


