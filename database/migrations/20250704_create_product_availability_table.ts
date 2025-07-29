import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if table already exists
  const hasTable = await knex.schema.hasTable('product_availability');
  
  if (!hasTable) {
    await knex.schema.createTable('product_availability', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
      table.date('date').notNullable();
      table.enu('availability_type', ['available', 'booked', 'maintenance', 'unavailable'], { useNative: true, enumName: 'availability_type' }).defaultTo('available');
      table.decimal('price_override', 10, 2);
      table.text('notes');
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
      table.unique(['product_id', 'date']);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('product_availability');
}
