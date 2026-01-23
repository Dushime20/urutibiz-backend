import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if column exists before adding it
  const hasProfileImagePublicId = await knex.schema.hasColumn('users', 'profile_image_public_id');
  
  if (!hasProfileImagePublicId) {
    await knex.schema.alterTable('users', (table) => {
      table.string('profile_image_public_id', 255).comment('Cloudinary public ID for profile image');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  // Remove column if it exists
  const hasProfileImagePublicId = await knex.schema.hasColumn('users', 'profile_image_public_id');
  
  if (hasProfileImagePublicId) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('profile_image_public_id');
    });
  }
}
