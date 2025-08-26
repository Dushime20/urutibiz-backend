import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasBio = await knex.schema.hasColumn('users', 'bio');
  if (!hasBio) {
    await knex.schema.alterTable('users', (table) => {
      table.text('bio');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasBio = await knex.schema.hasColumn('users', 'bio');
  if (hasBio) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('bio');
    });
  }
}


