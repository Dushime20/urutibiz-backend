import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add missing columns to notification_templates table
  await knex.schema.alterTable('notification_templates', (table) => {
    // Add channels column for template delivery channels
    table.specificType('channels', 'VARCHAR(20)[]').defaultTo(knex.raw("ARRAY['email']"));
    
    // Add priority column for template priority
    table.string('priority', 20).defaultTo('normal'); // 'low', 'normal', 'high'
    
    // Add variables column for template variables
    table.jsonb('variables').defaultTo('[]');
    
    // Add updated_at column for tracking modifications
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Update existing templates to have default values
  await knex('notification_templates')
    .whereNull('channels')
    .update({ 
      channels: knex.raw("ARRAY['email']"),
      priority: 'normal',
      variables: '[]',
      updated_at: knex.fn.now()
    });
}

export async function down(knex: Knex): Promise<void> {
  // Remove the added columns
  await knex.schema.alterTable('notification_templates', (table) => {
    table.dropColumn('channels');
    table.dropColumn('priority');
    table.dropColumn('variables');
    table.dropColumn('updated_at');
  });
}
