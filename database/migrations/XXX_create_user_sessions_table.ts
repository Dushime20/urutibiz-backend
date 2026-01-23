import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if table already exists
  const hasTable = await knex.schema.hasTable('user_sessions');
  if (!hasTable) {
    await knex.schema.createTable('user_sessions', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('user_id').notNullable(); // Defer FK
      table.string('session_token', 255).notNullable().unique();
      table.string('refresh_token', 255).nullable().unique();
      table.string('ip_address').nullable();
      table.text('user_agent').nullable();
      table.timestamp('expires_at').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    // Add foreign key if users table exists
    const hasUsers = await knex.schema.hasTable('users');
    if (hasUsers) {
      await knex.schema.alterTable('user_sessions', (table) => {
        table.foreign('user_id').references('users.id').onDelete('CASCADE');
      });
    }

    console.log('✅ User sessions table created successfully');
  } else {
    
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('user_sessions');
  if (hasTable) {
    await knex.schema.dropTable('user_sessions');
    console.log('✅ User sessions table dropped successfully');
  } else {
    
  }
}
