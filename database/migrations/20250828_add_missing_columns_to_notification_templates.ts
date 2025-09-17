import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if notification_templates table exists
  const hasTable = await knex.schema.hasTable('notification_templates');
  if (!hasTable) {
    console.log('⚠️ notification_templates table does not exist, skipping...');
    return;
  }

  // Add missing columns to notification_templates table (only if they don't exist)
  const columnsToAdd = [
    { name: 'channels', type: 'specificType', definition: 'VARCHAR(20)[]', default: knex.raw("ARRAY['email']") },
    { name: 'priority', type: 'string', length: 20, default: 'normal' },
    { name: 'variables', type: 'jsonb', default: '[]' },
    { name: 'updated_at', type: 'timestamp', default: knex.fn.now() }
  ];

  for (const column of columnsToAdd) {
    const hasColumn = await knex.schema.hasColumn('notification_templates', column.name);
    if (!hasColumn) {
      try {
        await knex.schema.alterTable('notification_templates', (table) => {
          switch (column.type) {
            case 'specificType':
              const specificCol = table.specificType(column.name, column.definition!);
              if (column.default !== undefined) {
                specificCol.defaultTo(column.default);
              }
              break;
            case 'string':
              const stringCol = table.string(column.name, column.length);
              if (column.default !== undefined) {
                stringCol.defaultTo(column.default);
              }
              break;
            case 'jsonb':
              const jsonbCol = table.jsonb(column.name);
              if (column.default !== undefined) {
                jsonbCol.defaultTo(column.default);
              }
              break;
            case 'timestamp':
              const timestampCol = table.timestamp(column.name);
              if (column.default !== undefined) {
                timestampCol.defaultTo(column.default);
              }
              break;
          }
        });
        console.log(`✅ Added column: ${column.name}`);
      } catch (error) {
        console.log(`⚠️ Failed to add column ${column.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      console.log(`⚠️ Column ${column.name} already exists, skipping...`);
    }
  }

  // Update existing templates to have default values (only if channels column exists)
  const hasChannelsColumn = await knex.schema.hasColumn('notification_templates', 'channels');
  if (hasChannelsColumn) {
    try {
      await knex('notification_templates')
        .whereNull('channels')
        .update({ 
          channels: knex.raw("ARRAY['email']"),
          priority: 'normal',
          variables: '[]',
          updated_at: knex.fn.now()
        });
      console.log('✅ Updated existing templates with default values');
    } catch (error) {
      console.log(`⚠️ Failed to update existing templates: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log('✅ Notification templates table updated successfully');
}

export async function down(knex: Knex): Promise<void> {
  // Check if notification_templates table exists
  const hasTable = await knex.schema.hasTable('notification_templates');
  if (!hasTable) {
    console.log('⚠️ notification_templates table does not exist, skipping...');
    return;
  }

  // Remove the added columns (only if they exist)
  const columnsToRemove = [
    'channels',
    'priority',
    'variables',
    'updated_at'
  ];

  for (const columnName of columnsToRemove) {
    const hasColumn = await knex.schema.hasColumn('notification_templates', columnName);
    if (hasColumn) {
      try {
        await knex.schema.alterTable('notification_templates', (table) => {
          table.dropColumn(columnName);
        });
        console.log(`✅ Removed column: ${columnName}`);
      } catch (error) {
        console.log(`⚠️ Failed to remove column ${columnName}: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      console.log(`⚠️ Column ${columnName} does not exist, skipping...`);
    }
  }

  console.log('✅ Notification templates table reverted successfully');
}
