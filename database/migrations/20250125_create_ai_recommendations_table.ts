import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('ai_recommendations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    table.enum('recommendation_type', ['collaborative_filtering', 'content_based', 'behavior_based', 'trending']).notNullable();
    table.decimal('confidence_score', 3, 2).notNullable().defaultTo(0.5);
    table.integer('ranking_position');
    table.jsonb('context');
    table.text('reasoning');
    table.boolean('was_clicked').defaultTo(false);
    table.boolean('was_booked').defaultTo(false);
    table.timestamp('clicked_at');
    table.timestamp('expires_at');
    table.timestamps(true, true);
    
    // Indexes for performance
    table.index(['user_id']);
    table.index(['product_id']);
    table.index(['recommendation_type']);
    table.index(['confidence_score']);
    table.index(['created_at']);
    table.index(['expires_at']);
    
    // Unique constraint to prevent duplicate recommendations
    table.unique(['user_id', 'product_id', 'recommendation_type']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('ai_recommendations');
}
