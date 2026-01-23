import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('payment_methods');
  

  const hasColumn = await knex.schema.hasColumn('payment_methods', 'description');
  if (!hasColumn) {
    await knex.schema.alterTable('payment_methods', (table) => {
      table.text('description');
    });
    console.log('✅ Added payment_methods.description text');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('payment_methods');
  
  const hasColumn = await knex.schema.hasColumn('payment_methods', 'description');
  if (hasColumn) {
    await knex.schema.alterTable('payment_methods', (table) => {
      table.dropColumn('description');
    });
  }
}
