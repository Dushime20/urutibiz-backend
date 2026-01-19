import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // User Interactions Table
  const hasInteractions = await knex.schema.hasTable('user_interactions');
  if (!hasInteractions) {
    await knex.schema.createTable('user_interactions', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
      table.string('session_id', 255);
      
      // Interaction details
      table.string('action_type', 50).notNullable(); // 'view', 'search', 'click', 'book', 'favorite'
      table.string('target_type', 50); // 'product', 'category', 'user'
      table.uuid('target_id');
      
      // Context
      table.text('page_url');
      table.text('referrer_url');
      table.text('user_agent');
      table.string('device_type', 20);
      
      // Additional data
      table.jsonb('metadata');
      
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index(['user_id']);
      table.index(['session_id']);
      table.index(['action_type']);
      table.index(['target_type', 'target_id']);
      table.index(['created_at']);
    });
  }

  // AI Model Metrics Table
  const hasMetrics = await knex.schema.hasTable('ai_model_metrics');
  if (!hasMetrics) {
    await knex.schema.createTable('ai_model_metrics', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('model_name', 100).notNullable();
      table.string('model_version', 50).notNullable();
      table.string('metric_name', 100).notNullable();
      table.decimal('metric_value', 10, 4).notNullable();
      table.date('data_date').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index(['model_name', 'model_version']);
      table.index(['metric_name']);
      table.index(['data_date']);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_interactions');
  await knex.schema.dropTableIfExists('ai_model_metrics');
}
