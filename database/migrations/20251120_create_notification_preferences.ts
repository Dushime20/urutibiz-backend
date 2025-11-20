import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('notification_preferences');
  if (hasTable) {
    console.log('ℹ️ notification_preferences table already exists');
    return;
  }

  await knex.schema.createTable('notification_preferences', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().unique();
    table.boolean('email').defaultTo(true);
    table.boolean('sms').defaultTo(false);
    table.boolean('push').defaultTo(true);
    table.boolean('webhook').defaultTo(false);
    table.boolean('in_app').defaultTo(true);
    table.boolean('quiet_hours_enabled').defaultTo(false);
    table.time('quiet_hours_start').defaultTo('22:00');
    table.time('quiet_hours_end').defaultTo('08:00');
    table.string('timezone', 50).defaultTo('UTC');
    table.jsonb('type_preferences').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('user_id').references('users.id').onDelete('CASCADE');
  });

  console.log('✅ Created notification_preferences table');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notification_preferences');
}

