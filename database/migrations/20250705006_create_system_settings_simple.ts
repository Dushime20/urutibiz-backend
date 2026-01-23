import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create system_settings table if it doesn't exist
  const exists = await knex.schema.hasTable('system_settings');
  if (!exists) {
    await knex.schema.createTable('system_settings', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('key').notNullable();
      table.text('value').notNullable();
      table.string('type').notNullable().defaultTo('string');
      table.string('category').notNullable();
      table.text('description');
      table.boolean('sensitive').defaultTo(false);
      table.uuid('created_by');
      table.uuid('updated_by');
      table.timestamps(true, true);
      
      // Indexes
      table.index(['key', 'category']);
      table.index(['category']);
      table.unique(['key', 'category']);
    });
  }

  // Insert default theme settings
  const themeSettings = [
    {
      key: 'mode',
      value: 'light',
      type: 'select',
      category: 'theme',
      description: 'Theme mode (light/dark/auto)'
    },
    {
      key: 'primaryColor',
      value: '#0ea5e9',
      type: 'color',
      category: 'theme',
      description: 'Primary brand color'
    },
    {
      key: 'secondaryColor',
      value: '#64748b',
      type: 'color',
      category: 'theme',
      description: 'Secondary color'
    },
    {
      key: 'accentColor',
      value: '#10b981',
      type: 'color',
      category: 'theme',
      description: 'Accent color'
    }
  ];

  // Check if settings already exist
  const existingCount = await knex('system_settings').count('* as count').first();
  const count = parseInt(existingCount?.count as string || '0');

  if (count === 0) {
    await knex('system_settings').insert(themeSettings);
    console.log('✅ Default theme settings inserted');
  } else {
    console.log(`✅ System settings table already has ${count} records`);
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('system_settings');
}
