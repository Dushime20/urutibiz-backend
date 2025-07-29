import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if column already exists
  const hasColumn = await knex.schema.hasColumn('user_verifications', 'ai_profile_score');
  
  if (!hasColumn) {
    await knex.schema.alterTable('user_verifications', (table) => {
      table.float('ai_profile_score').nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  // Check if column exists before trying to drop it
  const hasColumn = await knex.schema.hasColumn('user_verifications', 'ai_profile_score');
  
  if (hasColumn) {
    await knex.schema.alterTable('user_verifications', (table) => {
      table.dropColumn('ai_profile_score');
    });
  }
}
